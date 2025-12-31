"""
Query Enhancer for Time-Based and Statistical Queries
Adds intelligent date parsing and statistical aggregations
"""
import re
from datetime import datetime, timedelta
from typing import Dict, Optional, Tuple


class QueryEnhancer:
    """
    Enhances natural language queries with time-based and statistical context
    """
    
    @staticmethod
    def detect_time_period(query: str) -> Optional[Dict[str, str]]:
        """
        Detect time-based keywords and convert to SQL date filters
        
        Returns: Dict with 'start_date' and 'end_date' or None
        """
        query_lower = query.lower()
        today = datetime.now().date()
        
        # Turkish time expressions
        time_patterns = {
            # Today/Yesterday
            r'bugün|today': {
                'start': today,
                'end': today
            },
            r'dün|yesterday': {
                'start': today - timedelta(days=1),
                'end': today - timedelta(days=1)
            },
            # This week/Last week
            r'bu hafta|this week': {
                'start': today - timedelta(days=today.weekday()),
                'end': today
            },
            r'geçen hafta|last week': {
                'start': today - timedelta(days=today.weekday() + 7),
                'end': today - timedelta(days=today.weekday() + 1)
            },
            # This month/Last month
            r'bu ay|this month': {
                'start': today.replace(day=1),
                'end': today
            },
            r'geçen ay|last month': {
                'start': (today.replace(day=1) - timedelta(days=1)).replace(day=1),
                'end': today.replace(day=1) - timedelta(days=1)
            },
            # Last X days
            r'son (\d+) gün|last (\d+) days?': None,  # Special handling needed
            # This year/Last year
            r'bu yıl|this year': {
                'start': today.replace(month=1, day=1),
                'end': today
            },
            r'geçen yıl|last year': {
                'start': today.replace(year=today.year - 1, month=1, day=1),
                'end': today.replace(year=today.year - 1, month=12, day=31)
            },
        }
        
        # Check for "last X days" pattern
        last_days_match = re.search(r'son (\d+) gün|last (\d+) days?', query_lower)
        if last_days_match:
            days = int(last_days_match.group(1) or last_days_match.group(2))
            return {
                'start_date': (today - timedelta(days=days)).strftime('%Y-%m-%d'),
                'end_date': today.strftime('%Y-%m-%d'),
                'description': f'Last {days} days'
            }
        
        # Check other patterns
        for pattern, dates in time_patterns.items():
            if dates and re.search(pattern, query_lower):
                return {
                    'start_date': dates['start'].strftime('%Y-%m-%d'),
                    'end_date': dates['end'].strftime('%Y-%m-%d'),
                    'description': pattern.split('|')[0]
                }
        
        return None
    
    @staticmethod
    def detect_statistical_intent(query: str) -> Optional[Dict[str, str]]:
        """
        Detect statistical keywords and return aggregation type
        
        Returns: Dict with 'aggregation' type and 'field' or None
        """
        query_lower = query.lower()
        
        # Statistical patterns
        stat_patterns = {
            r'kaç tane|kaç adet|how many|count': {
                'aggregation': 'COUNT',
                'function': 'COUNT(*)'
            },
            r'toplam|total|sum': {
                'aggregation': 'SUM',
                'function': 'SUM'  # field needed
            },
            r'ortalama|average|avg': {
                'aggregation': 'AVG',
                'function': 'AVG'  # field needed
            },
            r'en fazla|en çok|maximum|max': {
                'aggregation': 'MAX',
                'function': 'MAX'  # field needed
            },
            r'en az|minimum|min': {
                'aggregation': 'MIN',
                'function': 'MIN'  # field needed
            },
        }
        
        for pattern, stat_info in stat_patterns.items():
            if re.search(pattern, query_lower):
                return stat_info
        
        return None
    
    @staticmethod
    def enhance_query(original_query: str) -> Tuple[str, Dict]:
        """
        Enhance query with time and statistical context
        
        Returns: (enhanced_query, metadata)
        """
        metadata = {
            'has_time_filter': False,
            'has_statistical_intent': False,
            'time_period': None,
            'statistical_info': None
        }
        
        enhanced_query = original_query
        
        # Detect time period
        time_period = QueryEnhancer.detect_time_period(original_query)
        if time_period:
            metadata['has_time_filter'] = True
            metadata['time_period'] = time_period
            
            # Add time context to query
            enhanced_query += f" (between {time_period['start_date']} and {time_period['end_date']})"
        
        # Detect statistical intent
        stat_info = QueryEnhancer.detect_statistical_intent(original_query)
        if stat_info:
            metadata['has_statistical_intent'] = True
            metadata['statistical_info'] = stat_info
            
            # Add statistical context to query
            if stat_info['aggregation'] == 'COUNT':
                enhanced_query += f" (calculate {stat_info['aggregation']})"
        
        return enhanced_query, metadata
    
    @staticmethod
    def build_sql_time_filter(time_period: Dict, table_alias: str = 't') -> str:
        """
        Build SQL WHERE clause for time filtering
        
        Args:
            time_period: Dict with start_date and end_date
            table_alias: Table alias to use (default: 't')
        
        Returns: SQL WHERE clause string
        """
        if not time_period:
            return ""
        
        start = time_period.get('start_date')
        end = time_period.get('end_date')
        
        if start and end:
            return f"{table_alias}.created_at BETWEEN '{start}' AND '{end} 23:59:59'"
        elif start:
            return f"{table_alias}.created_at >= '{start}'"
        elif end:
            return f"{table_alias}.created_at <= '{end} 23:59:59'"
        
        return ""
