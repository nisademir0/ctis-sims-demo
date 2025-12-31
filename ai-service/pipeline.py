import time
import logging
import json
import re
import requests
import pymysql
import sqlparse
from dbutils.pooled_db import PooledDB
from zemberek import TurkishMorphology
import dspy
from config import Config
from sql_validator import SQLValidator

logging.basicConfig(level=logging.INFO, format="%(asctime)s - %(levelname)s - %(message)s")
logger = logging.getLogger(__name__)

class Pipeline:
    def __init__(self):
        self.config = Config()
        self.morphology = TurkishMorphology.create_with_defaults()
        self._schema_cache = None
        
        # 1. DB Connection Pool
        try:
            self.pool = PooledDB(
                creator=pymysql,
                mincached=1,
                maxcached=5,
                host=self.config.DB_HOST,
                user=self.config.DB_USER,
                password=self.config.DB_PASSWORD,
                database=self.config.DB_NAME,
                cursorclass=pymysql.cursors.DictCursor
            )
            logger.info("✅ DB Pool Ready")
        except Exception as e:
            logger.error(f"❌ DB Pool Error: {e}")
            self.pool = None

    def get_db_connection(self):
        return self.pool.connection() if self.pool else None

    def get_schema(self):
        if self._schema_cache: return self._schema_cache
        conn = self.get_db_connection()
        if not conn: return "Schema Unavailable"
        try:
            with conn.cursor() as cursor:
                cursor.execute("""
                    SELECT TABLE_NAME, COLUMN_NAME, DATA_TYPE 
                    FROM INFORMATION_SCHEMA.COLUMNS 
                    WHERE TABLE_SCHEMA = %s 
                    ORDER BY TABLE_NAME, ORDINAL_POSITION
                """, (self.config.DB_NAME,))
                rows = cursor.fetchall()
                schema = {}
                for row in rows:
                    t = row['TABLE_NAME']
                    c = f"{row['COLUMN_NAME']} ({row['DATA_TYPE']})"
                    if t not in schema: schema[t] = []
                    schema[t].append(c)
                res = "\n".join([f"Table '{t}': {', '.join(cols)}" for t, cols in schema.items()])
                self._schema_cache = res
                return res
        finally:
            conn.close()

    def analyze_word_zemberek(self, text):
        words = text.split()
        analysis = []
        for word in words:
            clean = re.sub(r'[^\w\s]', '', word)
            if not clean: continue
            try:
                results = self.morphology.analyze(clean)
                if results.analysis_results:
                    best = results.analysis_results[0]
                    analysis.append(f"{word}->{best.get_stem()}")
            except:
                continue
        return ", ".join(analysis)

    def _call_ollama_chat(self, messages, model, temp=0.1):
        """
        KRİTİK GÜNCELLEME: /api/generate yerine /api/chat kullanıyoruz.
        Bu sayede model 'System', 'User' ve 'Assistant' rollerini ayırt edebilir.
        Örnekleri cevap sanıp tekrar etme sorunu biter.
        """
        try:
            # URL'i /api/chat olarak değiştirdik (Config'den bağımsız)
            url = f"http://{self.config.OLLAMA_HOST}:11434/api/chat"
            
            payload = {
                "model": model,
                "messages": messages, # Prompt string yerine Mesaj Listesi gidiyor
                "stream": False,
                "options": {"temperature": temp}
            }
            res = requests.post(url, json=payload, timeout=60)
            if res.status_code != 200:
                logger.error(f"Ollama Error: {res.text}")
                return None
            
            # Chat API yanıt yapısı farklıdır
            return res.json().get("message", {}).get("content", "").strip()
        except Exception as e:
            logger.error(f"Ollama Chat Failed: {e}")
            return None

    def translate_to_english(self, user_query):
        morphology = self.analyze_word_zemberek(user_query)
        
        system_content = f"""
        You are a translation engine. Your ONLY job is to translate Turkish inventory queries to English.
        
        RULES:
        1. Output ONLY the translated text. No "Here is the translation".
        2. Treat 'hibe' as 'donated'.
        3. Treat 'zimmetli' as 'lent'.
        4. Treat 'boşta' as 'available'.
        
        Morphology: {morphology}
        """

        # Few-Shot (Örnekleri Chat Geçmişi gibi veriyoruz)
        messages = [
            {"role": "system", "content": system_content},
            {"role": "user", "content": "monitörler nerede"},
            {"role": "assistant", "content": "Where are the monitors?"},
            {"role": "user", "content": "ahmetin eşyaları"},
            {"role": "assistant", "content": "What items does Ahmet have?"},
            {"role": "user", "content": user_query}
        ]
        
        return self._call_ollama_chat(messages, self.config.TRANSLATION_MODEL)

    def extract_sql(self, text):
        if not text: return ""
        text = text.replace("```sql", "").replace("```", "").strip()
        
        # Regex: Sadece SQL komutunu bul (öncesindeki ve sonrasındaki gevezelikleri at)
        match = re.search(r'(SELECT|WITH)\s[\s\S]*?(?:;|$)', text, re.IGNORECASE)
        if match:
            sql = match.group(0).strip()
            if not sql.endswith(';'): sql += ';'
            return sqlparse.format(sql, reindent=True, keyword_case='upper')
        
        # Eğer regex bulamazsa ama metin SELECT içeriyorsa, manuel temizlik dene
        if "SELECT" in text.upper():
            return text # Son çare olarak ham metni döndür (belki validasyondan geçer)
            
        return ""

    def run_pipeline(self, user_query, query_metadata=None):
        # 1. Çeviri
        translated_query = self.translate_to_english(user_query)
        if not translated_query: return {"error": "Translation failed"}
        
        # Ekstra Güvenlik: Hala ":" içeriyorsa (örn: "Translation: ...") temizle
        if "translation:" in translated_query.lower():
             translated_query = translated_query.split(":")[-1].strip()

        logger.info(f"🇹🇷: {user_query} -> 🇺🇸: {translated_query}")
        
        schema = self.get_schema()
        error_memory = []
        
        # Extract enhancement metadata
        query_metadata = query_metadata or {}
        has_time_filter = query_metadata.get('has_time_filter', False)
        has_statistical_intent = query_metadata.get('has_statistical_intent', False)
        time_period = query_metadata.get('time_period')
        stat_info = query_metadata.get('statistical_info')

        # 2. SQL Üretim
        for model_cfg in self.config.MODEL_SEQUENCE:
            for attempt in range(model_cfg['retry_count']):
                
                # Build enhanced system prompt with time and statistical context
                time_instructions = ""
                if has_time_filter and time_period:
                    time_instructions = f"""
                6. IMPORTANT: Filter results by date range: {time_period['start_date']} to {time_period['end_date']}.
                   - Use created_at column for filtering.
                   - Format: WHERE created_at BETWEEN '{time_period['start_date']}' AND '{time_period['end_date']} 23:59:59'
                """
                
                stat_instructions = ""
                if has_statistical_intent and stat_info:
                    aggregation = stat_info['aggregation']
                    stat_instructions = f"""
                7. IMPORTANT: Use {aggregation} aggregation function.
                   - For COUNT: Use COUNT(*) to count rows.
                   - For SUM/AVG/MAX/MIN: Apply to relevant numeric columns.
                   - Include GROUP BY if needed for meaningful aggregation.
                """
                
                system_content = f"""
                You are a MySQL expert. Output ONLY valid SQL query. No explanations.
                
                DATABASE SCHEMA:
                {schema}
                
                RULES:
                1. USE `view_general_inventory` for ALL general queries (items, holders, status).
                   - Columns: item_name, category_name, location, status, current_holder.
                2. DO NOT JOIN `users` if using `view_general_inventory`.
                3. For 'available' items: status = 'available'.
                4. For 'donated' items: status = 'donated'.
                5. Use LIKE '%term%' for fuzzy search on names.
                {time_instructions}
                {stat_instructions}
                """
                
                # Chat Geçmişi ile Context Oluşturma
                messages = [
                    {"role": "system", "content": system_content},
                    {"role": "user", "content": "Where are the monitors?"},
                    {"role": "assistant", "content": "SELECT location, item_name, status FROM view_general_inventory WHERE item_name LIKE '%Monitor%' OR category_name LIKE '%Monitor%';"},
                    {"role": "user", "content": "What items does Ahmet have?"},
                    {"role": "assistant", "content": "SELECT item_name, location FROM view_general_inventory WHERE current_holder LIKE '%Ahmet%';"},
                ]
                
                # Add time-based example if relevant
                if has_time_filter:
                    messages.extend([
                        {"role": "user", "content": "Show me items added this week"},
                        {"role": "assistant", "content": f"SELECT item_name, category_name, created_at FROM view_general_inventory WHERE created_at >= CURDATE() - INTERVAL WEEKDAY(CURDATE()) DAY;"}
                    ])
                
                # Add statistical example if relevant
                if has_statistical_intent:
                    messages.extend([
                        {"role": "user", "content": "How many monitors do we have?"},
                        {"role": "assistant", "content": "SELECT COUNT(*) as total_monitors FROM view_general_inventory WHERE item_name LIKE '%Monitor%';"}
                    ])
                
                messages.append({"role": "user", "content": f"Generate SQL for: {translated_query}\nAvoid Errors: {'; '.join(error_memory)}"})
                
                raw_res = self._call_ollama_chat(messages, model_cfg['model_identifier'], model_cfg['temperature'])
                sql = self.extract_sql(raw_res)
                
                if not sql: 
                    error_memory.append("Empty SQL")
                    continue

                logger.info(f"Generated SQL: {sql}")
                
                # Validate SQL with strict AST-based validator
                is_valid, validation_error = SQLValidator.validate(sql)
                if not is_valid:
                    logger.error(f"SQL REJECTED: {validation_error}\nSQL: {sql}")
                    error_memory.append(f"Security: {validation_error}")
                    continue

                # Execute only if validated
                conn = self.get_db_connection()
                try:
                    with conn.cursor() as cursor:
                        cursor.execute(sql)
                        results = cursor.fetchall()
                    conn.close()
                    
                    # Limit results to prevent massive data dumps
                    if len(results) > 1000:
                        logger.warning(f"Query returned {len(results)} rows - truncating to 1000")
                        results = results[:1000]
                    
                    return {
                        "original_query": user_query,
                        "translated_query": translated_query,
                        "sql": sql,
                        "results": results,
                        "result_count": len(results),
                        "model": model_cfg['name']
                    }
                except Exception as db_err:
                    if conn: conn.close()
                    logger.error(f"DB Error: {db_err}")
                    error_memory.append(f"SQL: {sql} -> Error: {db_err}")
                    continue

        return {"error": "Failed", "details": error_memory}
    
    def _is_safe_sql(self, sql):
        """
        Validate SQL query for safety - only allow SELECT statements
        on approved tables/views
        """
        if not sql:
            return False
            
        sql_upper = sql.upper().strip()
        
        # Must start with SELECT or WITH (for CTEs)
        if not (sql_upper.startswith('SELECT') or sql_upper.startswith('WITH')):
            logger.warning("SQL rejected: Not a SELECT query")
            return False
        
        # Block dangerous keywords
        dangerous_keywords = [
            'DROP', 'DELETE', 'UPDATE', 'INSERT', 'TRUNCATE', 
            'ALTER', 'CREATE', 'GRANT', 'REVOKE', 'EXEC',
            'EXECUTE', 'CALL', 'LOAD_FILE', 'OUTFILE', 'DUMPFILE'
        ]
        
        for keyword in dangerous_keywords:
            if keyword in sql_upper:
                logger.warning(f"SQL rejected: Contains dangerous keyword '{keyword}'")
                return False
        
        # Only allow queries on approved tables/views
        approved_tables = [
            'view_general_inventory', 
            'items', 'users', 'transactions',
            'item_categories', 'vendors', 'roles'
        ]
        
        # Check if at least one approved table is referenced
        has_approved_table = any(table in sql_upper for table in [t.upper() for t in approved_tables])
        
        if not has_approved_table:
            logger.warning("SQL rejected: No approved tables found")
            return False
            
        return True