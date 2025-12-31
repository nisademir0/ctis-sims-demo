"""
LM Studio Client
OpenAI-compatible API client for LM Studio local server
"""

from openai import OpenAI
import logging
from typing import Optional, Dict, Any
from config import LM_STUDIO_URL, PRIMARY_MODEL, SECONDARY_MODEL

logger = logging.getLogger(__name__)

class LMStudioClient:
    """
    Client for LM Studio API (OpenAI-compatible)
    Supports multiple models and fallback strategies
    """
    
    def __init__(self, base_url: str = LM_STUDIO_URL):
        self.client = OpenAI(
            base_url=base_url,
            api_key="lm-studio"  # LM Studio doesn't validate this
        )
        self.base_url = base_url
        
    def generate_sql(
        self,
        prompt: str,
        model: str = PRIMARY_MODEL,
        temperature: float = 0.1,
        max_tokens: int = 500,
        user_context: Optional[Dict[str, Any]] = None
    ) -> Dict[str, Any]:
        """
        Generate SQL using LM Studio
        
        Args:
            prompt: The formatted prompt with user context
            model: Model name (sqlcoder-7b, codellama-13b, etc.)
            temperature: Lower = more deterministic (0.0-1.0)
            max_tokens: Maximum response length
            user_context: User metadata for logging
            
        Returns:
            {
                'sql': 'SELECT * FROM...',
                'model_used': 'sqlcoder-7b',
                'tokens_used': 150,
                'confidence': 0.95
            }
        """
        try:
            logger.info(f"Generating SQL with model: {model}")
            
            response = self.client.chat.completions.create(
                model=model,
                messages=[
                    {
                        "role": "system",
                        "content": "You are an expert SQL generator for a MySQL 8.0 database. Generate only valid MySQL SQL syntax, no explanations."
                    },
                    {
                        "role": "user",
                        "content": prompt
                    }
                ],
                temperature=temperature,
                max_tokens=max_tokens,
                stop=["--", "/*", "EXPLAIN"]  # Stop at comments
            )
            
            sql = response.choices[0].message.content.strip()
            
            # Clean up response
            sql = self._clean_sql(sql)
            
            return {
                'sql': sql,
                'model_used': model,
                'tokens_used': response.usage.total_tokens if response.usage else 0,
                'confidence': self._estimate_confidence(sql),
                'finish_reason': response.choices[0].finish_reason
            }
            
        except Exception as e:
            logger.error(f"LM Studio error: {e}")
            raise Exception(f"SQL generation failed: {str(e)}")
    
    def _clean_sql(self, sql: str) -> str:
        """
        Clean and normalize SQL response
        """
        # Remove markdown code blocks
        if '```sql' in sql:
            sql = sql.split('```sql')[1].split('```')[0]
        elif '```' in sql:
            sql = sql.split('```')[1].split('```')[0]
        
        # Remove comments
        lines = []
        for line in sql.split('\n'):
            line = line.strip()
            if line and not line.startswith('--'):
                lines.append(line)
        
        sql = ' '.join(lines)
        
        # Ensure semicolon at end
        if not sql.endswith(';'):
            sql += ';'
        
        return sql.strip()
    
    def _estimate_confidence(self, sql: str) -> float:
        """
        Estimate confidence based on SQL structure
        (Simple heuristic, can be improved with actual model probabilities)
        """
        confidence = 1.0
        
        # Penalties for complexity
        if 'UNION' in sql.upper():
            confidence *= 0.9
        if 'SUBQUERY' in sql.upper() or '(SELECT' in sql.upper():
            confidence *= 0.95
        if sql.count('JOIN') > 3:
            confidence *= 0.9
        
        # Bonus for simplicity
        if sql.upper().startswith('SELECT') and sql.count('WHERE') <= 2:
            confidence = min(1.0, confidence * 1.05)
        
        return round(confidence, 2)
    
    def validate_sql(
        self,
        sql: str,
        model: str = "phi-3-mini-128k-instruct"
    ) -> Dict[str, Any]:
        """
        Validate SQL syntax using lightweight model
        
        Returns:
            {
                'is_valid': True,
                'errors': [],
                'warnings': ['Missing WHERE clause'],
                'suggestions': ['Add LIMIT for large tables']
            }
        """
        try:
            prompt = f"""
Analyze this SQL query for syntax errors, security issues, and best practices:

SQL:
{sql}

Return JSON with:
- is_valid: boolean
- errors: list of syntax errors
- warnings: list of potential issues
- suggestions: list of improvements
"""
            
            response = self.client.chat.completions.create(
                model=model,
                messages=[
                    {
                        "role": "system",
                        "content": "You are a SQL validator. Return only valid JSON."
                    },
                    {
                        "role": "user",
                        "content": prompt
                    }
                ],
                temperature=0.0,
                max_tokens=300
            )
            
            import json
            result = json.loads(response.choices[0].message.content)
            return result
            
        except Exception as e:
            logger.warning(f"SQL validation failed: {e}")
            # Fallback: basic validation
            return {
                'is_valid': 'SELECT' in sql.upper(),
                'errors': [],
                'warnings': ['Validation service unavailable'],
                'suggestions': []
            }
    
    def test_connection(self) -> bool:
        """
        Test LM Studio connection
        """
        try:
            response = self.client.models.list()
            models = [m.id for m in response.data]
            logger.info(f"LM Studio connected. Available models: {models}")
            return True
        except Exception as e:
            logger.error(f"LM Studio connection failed: {e}")
            return False
    
    def list_models(self) -> Dict[str, Any]:
        """
        Get list of all available models from LM Studio
        
        Returns:
            {
                'success': True,
                'models': [
                    {
                        'id': 'llama-3.2-8b-instruct',
                        'name': 'Llama 3.2 8B Instruct',
                        'size': '8B parameters',
                        'type': 'chat',
                        'capabilities': ['sql', 'chat', 'analysis']
                    },
                    ...
                ],
                'count': 5
            }
        """
        try:
            response = self.client.models.list()
            
            models = []
            for model in response.data:
                model_info = {
                    'id': model.id,
                    'name': self._format_model_name(model.id),
                    'size': self._extract_model_size(model.id),
                    'type': self._detect_model_type(model.id),
                    'capabilities': self._detect_capabilities(model.id),
                    'created': getattr(model, 'created', None),
                    'owned_by': getattr(model, 'owned_by', 'local')
                }
                models.append(model_info)
            
            return {
                'success': True,
                'models': models,
                'count': len(models)
            }
            
        except Exception as e:
            logger.error(f"Failed to list models: {e}")
            return {
                'success': False,
                'error': str(e),
                'models': [],
                'count': 0
            }
    
    def _format_model_name(self, model_id: str) -> str:
        """
        Convert model ID to human-readable name
        e.g., 'llama-3.2-8b-instruct' -> 'Llama 3.2 8B Instruct'
        """
        # Replace hyphens with spaces and capitalize
        parts = model_id.split('-')
        formatted = []
        
        for part in parts:
            if part.replace('.', '').isdigit():
                formatted.append(part)  # Keep version numbers as-is
            elif part.lower() in ['b', 'gb', 'mb']:
                formatted.append(part.upper())  # Parameter size
            else:
                formatted.append(part.capitalize())
        
        return ' '.join(formatted)
    
    def _extract_model_size(self, model_id: str) -> str:
        """
        Extract parameter size from model ID
        e.g., '8b' -> '8B parameters'
        """
        import re
        match = re.search(r'(\d+)b', model_id.lower())
        if match:
            size = match.group(1)
            return f"{size}B parameters"
        
        match = re.search(r'(\d+)m', model_id.lower())
        if match:
            size = match.group(1)
            return f"{size}M parameters"
        
        return "Unknown size"
    
    def _detect_model_type(self, model_id: str) -> str:
        """
        Detect model type from ID
        """
        model_id_lower = model_id.lower()
        
        if 'code' in model_id_lower or 'sql' in model_id_lower:
            return 'code'
        elif 'instruct' in model_id_lower or 'chat' in model_id_lower:
            return 'chat'
        elif 'embed' in model_id_lower:
            return 'embedding'
        else:
            return 'general'
    
    def _detect_capabilities(self, model_id: str) -> list:
        """
        Detect model capabilities based on name/type
        """
        model_id_lower = model_id.lower()
        capabilities = []
        
        # SQL/Code generation
        if any(x in model_id_lower for x in ['code', 'sql', 'sqlcoder']):
            capabilities.append('sql')
            capabilities.append('code')
        
        # Chat/Instruction following
        if any(x in model_id_lower for x in ['instruct', 'chat', 'llama', 'mistral']):
            capabilities.append('chat')
        
        # Analysis/Reasoning
        if any(x in model_id_lower for x in ['llama', 'qwen', 'mistral']):
            capabilities.append('analysis')
        
        # If nothing detected, assume general chat
        if not capabilities:
            capabilities.append('general')
        
        return capabilities
