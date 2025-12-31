from fastapi import FastAPI, HTTPException
from pydantic import BaseModel, Field
from pipeline import Pipeline
from input_sanitizer import InputSanitizer
from query_enhancer import QueryEnhancer
from query_cache import cache
from lm_studio_client import LMStudioClient
import logging

logging.basicConfig(level=logging.INFO)
logger = logging.getLogger(__name__)

app = FastAPI(title="CTIS-SIMS AI Service", version="2.3.0")
pipeline = None
lm_client = None

@app.on_event("startup")
def startup():
    global pipeline, lm_client
    pipeline = Pipeline()
    lm_client = LMStudioClient()
    
    # Test LM Studio connection
    if lm_client.test_connection():
        logger.info("✅ LM Studio connected successfully")
    else:
        logger.warning("⚠️  LM Studio not available - using fallback")
    
    logger.info("✅ AI Service started successfully with query enhancement and caching")

@app.get("/health")
def health():
    """Health check endpoint with cache stats"""
    return {
        "status": "healthy",
        "service": "CTIS-SIMS AI",
        "version": "2.3.0",
        "features": ["input_sanitization", "sql_validation", "query_enhancement", "time_based_queries", "statistical_queries", "query_caching"],
        "cache": cache.get_stats()
    }

class Query(BaseModel):
    query: str = Field(..., min_length=3, max_length=500, description="User query in Turkish or English")

@app.post("/ask")
def ask(q: Query):
    """
    Process natural language query and return SQL results.
    Enhanced with time-based and statistical query support.
    Includes input sanitization, SQL validation, and response caching.
    """
    # 1. Sanitize input to prevent prompt injection
    sanitized_query = InputSanitizer.sanitize(q.query)
    
    if not sanitized_query:
        logger.warning(f"Blocked malicious input: {q.query[:100]}")
        raise HTTPException(
            status_code=400,
            detail="Invalid or potentially malicious input detected. Please rephrase your question."
        )
    
    # 2. Check cache first
    cached_result = cache.get(sanitized_query)
    if cached_result:
        logger.info(f"Cache HIT for query: {sanitized_query[:50]}...")
        cached_result['cached'] = True
        cached_result['cache_stats'] = cache.get_stats()
        return cached_result
    
    logger.info(f"Cache MISS for query: {sanitized_query[:50]}...")
    
    # 3. Enhance query with time-based and statistical context
    enhanced_query, query_metadata = QueryEnhancer.enhance_query(sanitized_query)
    logger.info(f"Query enhancement metadata: {query_metadata}")
    
    # 4. Process through AI pipeline (now with SQL validation)
    try:
        result = pipeline.run_pipeline(enhanced_query, query_metadata)
        
        # Add enhancement metadata to result
        result['query_enhancement'] = query_metadata
        result['cached'] = False
        
        # 5. Cache the result
        cache.set(sanitized_query, result)
        
        return result
    except Exception as e:
        logger.error(f"Pipeline error: {e}")
        raise HTTPException(
            status_code=500,
            detail="An error occurred while processing your query. Please try again."
        )

@app.post("/cache/clear")
def clear_cache():
    """Clear AI query cache (admin only in production)"""
    cache.clear()
    logger.info("Cache cleared")
    return {"message": "Cache cleared successfully"}

@app.post("/cache/invalidate")
def invalidate_cache(pattern: str):
    """
    Invalidate cache entries matching a pattern
    Useful when data changes
    """
    count = cache.invalidate_pattern(pattern)
    logger.info(f"Invalidated {count} cache entries matching '{pattern}'")
    return {"message": f"Invalidated {count} cache entries", "pattern": pattern}

@app.get("/cache/stats")
def cache_stats():
    """Get cache statistics"""
    return cache.get_stats()

@app.get("/models/list")
def list_models():
    """Get all available LM Studio models"""
    if not lm_client:
        raise HTTPException(503, "LM Studio not available")
    return lm_client.list_models()

@app.get("/models/test")
def test_models():
    """Test LM Studio connection"""
    if not lm_client:
        return {"connected": False}
    return {"connected": lm_client.test_connection()}