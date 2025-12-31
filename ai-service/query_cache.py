"""
AI Query Cache System
Caches similar queries and their results to improve response time
"""
import hashlib
import json
import time
from typing import Optional, Dict, Any
from collections import OrderedDict

class QueryCache:
    """
    Simple in-memory LRU cache for AI query results
    Cache TTL: 5 minutes
    Max Cache Size: 100 entries
    """
    
    def __init__(self, ttl_seconds: int = 300, max_size: int = 100):
        self.cache: OrderedDict[str, Dict[str, Any]] = OrderedDict()
        self.ttl_seconds = ttl_seconds
        self.max_size = max_size
        self.hits = 0
        self.misses = 0
    
    def _generate_key(self, query: str) -> str:
        """Generate cache key from query (normalized)"""
        # Normalize: lowercase, strip whitespace, remove extra spaces
        normalized = ' '.join(query.lower().strip().split())
        return hashlib.md5(normalized.encode()).hexdigest()
    
    def _is_expired(self, entry: Dict[str, Any]) -> bool:
        """Check if cache entry is expired"""
        return time.time() - entry['timestamp'] > self.ttl_seconds
    
    def _cleanup_expired(self):
        """Remove expired entries"""
        expired_keys = [
            key for key, entry in self.cache.items()
            if self._is_expired(entry)
        ]
        for key in expired_keys:
            del self.cache[key]
    
    def _evict_oldest(self):
        """Evict oldest entry if cache is full (LRU)"""
        if len(self.cache) >= self.max_size:
            self.cache.popitem(last=False)
    
    def get(self, query: str) -> Optional[Dict[str, Any]]:
        """
        Get cached result for query
        Returns None if not found or expired
        """
        self._cleanup_expired()
        
        key = self._generate_key(query)
        
        if key in self.cache:
            entry = self.cache[key]
            if not self._is_expired(entry):
                # Move to end (most recently used)
                self.cache.move_to_end(key)
                self.hits += 1
                return entry['result']
        
        self.misses += 1
        return None
    
    def set(self, query: str, result: Dict[str, Any]):
        """Cache query result"""
        key = self._generate_key(query)
        
        # Evict oldest if necessary
        self._evict_oldest()
        
        # Store new entry
        self.cache[key] = {
            'query': query,
            'result': result,
            'timestamp': time.time()
        }
    
    def clear(self):
        """Clear all cache"""
        self.cache.clear()
        self.hits = 0
        self.misses = 0
    
    def get_stats(self) -> Dict[str, Any]:
        """Get cache statistics"""
        total_requests = self.hits + self.misses
        hit_rate = (self.hits / total_requests * 100) if total_requests > 0 else 0
        
        return {
            'size': len(self.cache),
            'max_size': self.max_size,
            'hits': self.hits,
            'misses': self.misses,
            'total_requests': total_requests,
            'hit_rate': round(hit_rate, 2),
            'ttl_seconds': self.ttl_seconds
        }
    
    def invalidate_pattern(self, pattern: str):
        """
        Invalidate cache entries matching a pattern
        Useful when data changes (e.g., new transaction, item update)
        """
        keys_to_delete = []
        pattern_lower = pattern.lower()
        
        for key, entry in self.cache.items():
            if pattern_lower in entry['query'].lower():
                keys_to_delete.append(key)
        
        for key in keys_to_delete:
            del self.cache[key]
        
        return len(keys_to_delete)


# Global cache instance
cache = QueryCache(ttl_seconds=300, max_size=100)
