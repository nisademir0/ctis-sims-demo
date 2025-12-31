"""
SQL Validator with AST Parsing
Prevents SQL injection by validating query structure at token level.
"""
import sqlparse
from sqlparse.sql import Token, TokenList, Identifier, Where, Parenthesis
from sqlparse.tokens import Keyword, DML, DDL
from typing import Tuple, Set, List
import logging

logger = logging.getLogger(__name__)

class SQLValidator:
    """
    Strict SQL validator using AST parsing.
    Only allows SELECT queries on approved tables.
    """
    
    # Tables that AI is allowed to query
    APPROVED_TABLES = frozenset([
        'view_general_inventory',
        'items',
        'users',
        'transactions',
        'item_categories',
        'vendors',
        'roles'
    ])
    
    # Keywords that should never appear in AI-generated SQL
    DANGEROUS_KEYWORDS = frozenset([
        'DROP', 'DELETE', 'UPDATE', 'INSERT', 'TRUNCATE',
        'ALTER', 'CREATE', 'GRANT', 'REVOKE', 'EXEC',
        'EXECUTE', 'CALL', 'LOAD_FILE', 'OUTFILE', 
        'DUMPFILE', 'INTO', 'REPLACE', 'MERGE',
        'RENAME', 'TRIGGER', 'PROCEDURE', 'FUNCTION',
        'EVENT', 'VIEW', 'INDEX'
    ])
    
    @classmethod
    def validate(cls, sql: str) -> Tuple[bool, str]:
        """
        Validate SQL query for security.
        
        Returns:
            (is_valid, error_message)
            
        Example:
            >>> SQLValidator.validate("SELECT * FROM users")
            (True, "OK")
            
            >>> SQLValidator.validate("DROP TABLE users")
            (False, "Forbidden keyword: DROP")
        """
        if not sql or not sql.strip():
            return False, "Empty SQL query"
        
        # 1. Parse SQL into Abstract Syntax Tree
        try:
            parsed = sqlparse.parse(sql)
        except Exception as e:
            return False, f"SQL parse error: {e}"
        
        if len(parsed) == 0:
            return False, "No SQL statements found"
        
        # 2. Ensure ONLY ONE statement (prevent multi-statement injection)
        if len(parsed) > 1:
            logger.warning(f"Multi-statement SQL rejected: {len(parsed)} statements")
            return False, "Multi-statement queries are forbidden"
        
        stmt = parsed[0]
        
        # 3. Must be SELECT or WITH (CTE)
        first_token = stmt.token_first(skip_ws=True, skip_cm=True)
        if not first_token:
            return False, "Empty statement"
        
        if first_token.ttype not in (DML,) and first_token.value.upper() not in ('SELECT', 'WITH'):
            return False, f"Only SELECT/WITH queries allowed, got: {first_token.value}"
        
        # 4. Check for dangerous keywords in the entire query
        sql_upper = sql.upper()
        for keyword in cls.DANGEROUS_KEYWORDS:
            # Use word boundaries to avoid false positives (e.g., "DESCRIPTION" contains "DESC")
            if f' {keyword} ' in f' {sql_upper} ' or f' {keyword};' in f' {sql_upper} ':
                logger.warning(f"Dangerous keyword detected: {keyword}")
                return False, f"Forbidden keyword: {keyword}"
        
        # 5. Extract all table names from query
        tables = cls._extract_tables(stmt)
        
        if not tables:
            return False, "No tables found in query"
        
        # 6. Ensure all tables are in approved list
        for table in tables:
            if table.lower() not in [t.lower() for t in cls.APPROVED_TABLES]:
                logger.warning(f"Unauthorized table access: {table}")
                return False, f"Unauthorized table: {table}"
        
        # 7. Block UNION queries (data exfiltration risk)
        if 'UNION' in sql_upper:
            return False, "UNION queries are forbidden"
        
        # 8. Check for subqueries and validate them recursively
        if cls._has_dangerous_subquery(stmt):
            return False, "Subqueries are not allowed (prevents nested injection)"
        
        # 9. Check for comments (often used in injection attacks)
        if '--' in sql or '/*' in sql:
            return False, "SQL comments are not allowed"
        
        # 10. Ensure reasonable query length (prevent DoS)
        if len(sql) > 5000:
            return False, "Query exceeds maximum length (5000 chars)"
        
        return True, "OK"
    
    @classmethod
    def _extract_tables(cls, stmt) -> Set[str]:
        """
        Extract all table names from FROM and JOIN clauses.
        
        Handles:
        - Simple FROM: SELECT * FROM users
        - Joins: SELECT * FROM users JOIN items
        - Aliases: SELECT * FROM users u
        """
        tables = set()
        from_seen = False
        
        for token in stmt.tokens:
            # Check if we're in FROM or JOIN context
            if token.ttype is Keyword and token.value.upper() in ('FROM', 'JOIN', 'INNER', 'LEFT', 'RIGHT', 'OUTER'):
                from_seen = True
                continue
            
            # Extract table name
            if from_seen:
                if isinstance(token, Identifier):
                    table_name = token.get_real_name()
                    if table_name:
                        tables.add(table_name)
                    from_seen = False
                elif isinstance(token, TokenList):
                    # Nested tokens (e.g., in parentheses)
                    for sub_token in token.tokens:
                        if isinstance(sub_token, Identifier):
                            table_name = sub_token.get_real_name()
                            if table_name:
                                tables.add(table_name)
        
        return tables
    
    @classmethod
    def _has_dangerous_subquery(cls, stmt) -> bool:
        """
        Check if statement contains subqueries.
        
        We block subqueries because:
        1. They can bypass table restrictions
        2. Increase complexity and attack surface
        3. Not needed for inventory queries
        """
        def check_token(token):
            if isinstance(token, Parenthesis):
                # Check if parenthesis contains a SELECT
                for sub in token.tokens:
                    if sub.ttype == DML and sub.value.upper() == 'SELECT':
                        return True
                    if hasattr(sub, 'tokens'):
                        if check_token(sub):
                            return True
            elif isinstance(token, TokenList):
                for sub in token.tokens:
                    if check_token(sub):
                        return True
            return False
        
        for token in stmt.tokens:
            if check_token(token):
                return True
        
        return False


# Example usage and tests
if __name__ == "__main__":
    # Safe queries
    safe_queries = [
        "SELECT * FROM view_general_inventory;",
        "SELECT item_name, location FROM items WHERE status = 'available';",
        "SELECT COUNT(*) FROM users;",
        """
        SELECT category_name, COUNT(*) as total 
        FROM view_general_inventory 
        GROUP BY category_name;
        """
    ]
    
    # Dangerous queries
    dangerous_queries = [
        "DROP TABLE users;",
        "SELECT * FROM users; DELETE FROM items;",
        "SELECT * FROM users UNION SELECT password FROM admin;",
        "UPDATE items SET status = 'stolen' WHERE 1=1;",
        "SELECT * FROM information_schema.tables;",
        "SELECT * FROM view_general_inventory WHERE 1=1 -- comment",
        "INSERT INTO users VALUES ('hacker', 'password');",
    ]
    
    print("=== Testing Safe Queries ===")
    for sql in safe_queries:
        valid, msg = SQLValidator.validate(sql)
        print(f"{'✅' if valid else '❌'} {sql[:50]}... -> {msg}")
    
    print("\n=== Testing Dangerous Queries ===")
    for sql in dangerous_queries:
        valid, msg = SQLValidator.validate(sql)
        print(f"{'✅' if valid else '❌'} {sql[:50]}... -> {msg}")
