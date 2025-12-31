FROM python:3.10-slim

WORKDIR /app

# 1. Java (Zemberek için) ve Sistem Paketleri
RUN apt-get update && apt-get install -y \
    default-jre \
    default-libmysqlclient-dev \
    build-essential \
    pkg-config \
    && rm -rf /var/lib/apt/lists/*

# Java Home ayarı
ENV JAVA_HOME="/usr/lib/jvm/default-java"

# 2. Bağımlılıklar
COPY requirements.txt .
RUN pip install --no-cache-dir -r requirements.txt

# 3. Kodlar
COPY . .

EXPOSE 8001
CMD ["uvicorn", "main:app", "--host", "0.0.0.0", "--port", "8001", "--reload"]