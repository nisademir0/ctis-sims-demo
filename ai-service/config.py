import os

class Config:
    # DB
    DB_HOST = os.getenv("DB_HOST", "db")
    DB_USER = os.getenv("DB_USER", "ctis_user")
    DB_PASSWORD = os.getenv("DB_PASSWORD", "secret_password")
    DB_NAME = os.getenv("DB_NAME", "ctis_sims")
    
    # LM Studio
    LM_STUDIO_URL = os.getenv("LM_STUDIO_URL", "http://host.docker.internal:1234/v1")
    PRIMARY_MODEL = os.getenv("PRIMARY_MODEL", "llama-3.2-8b-instruct")
    SECONDARY_MODEL = os.getenv("SECONDARY_MODEL", "qwen-2.5-3b")
    
    # Ollama (Legacy)
    OLLAMA_HOST = os.getenv("OLLAMA_HOST", "host.docker.internal")
    OLLAMA_API_URL = f"http://{OLLAMA_HOST}:11434/api/generate"
    TRANSLATION_MODEL = "llama3.2:latest"
    
    # Model Sequence (Fallback)
    MODEL_SEQUENCE = [
        {"name": "Primary", "model_identifier": "llama3.2:latest", "temperature": 0.1, "retry_count": 2},
        {"name": "Fallback", "model_identifier": "llama3.2:latest", "temperature": 0.3, "retry_count": 1}
    ]

# Export
LM_STUDIO_URL = Config.LM_STUDIO_URL
PRIMARY_MODEL = Config.PRIMARY_MODEL
SECONDARY_MODEL = Config.SECONDARY_MODEL
OLLAMA_HOST = Config.OLLAMA_HOST
OLLAMA_API_URL = Config.OLLAMA_API_URL
