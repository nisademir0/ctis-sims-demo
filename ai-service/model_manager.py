"""
Model Manager for LM Studio
Handles model listing, selection, and configuration
"""

from lm_studio_client import LMStudioClient
from typing import Dict, Any, Optional
import logging

logger = logging.getLogger(__name__)

class ModelManager:
    """
    Centralized model management for LM Studio
    """
    
    def __init__(self):
        self.client = LMStudioClient()
        self.current_model = None
        self.model_cache = None
    
    def get_available_models(self) -> Dict[str, Any]:
        """Get all available models from LM Studio"""
        try:
            if self.model_cache is None:
                self.model_cache = self.client.list_models()
            return self.model_cache
        except Exception as e:
            logger.error(f"Failed to get models: {e}")
            return {"success": False, "models": [], "error": str(e)}
    
    def refresh_models(self) -> Dict[str, Any]:
        """Force refresh model list"""
        self.model_cache = None
        return self.get_available_models()
    
    def test_connection(self) -> bool:
        """Test LM Studio connection"""
        return self.client.test_connection()

model_manager = ModelManager()
