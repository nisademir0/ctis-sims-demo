FROM php:8.3-fpm

# Gerekli sistem bağımlılıklarını kur
RUN apt-get update && apt-get install -y \
    git \
    curl \
    libpng-dev \
    libonig-dev \
    libxml2-dev \
    zip \
    unzip \
    default-mysql-client \
    cron \
    supervisor

# PHP eklentilerini kur
RUN docker-php-ext-install pdo_mysql mbstring exif pcntl bcmath gd

# Composer'ı kur
COPY --from=composer:latest /usr/bin/composer /usr/bin/composer

# Çalışma dizini
WORKDIR /var/www

# Copy entrypoint script
COPY docker-entrypoint.sh /usr/local/bin/
RUN chmod +x /usr/local/bin/docker-entrypoint.sh

# Copy supervisor config
COPY supervisord.conf /etc/supervisor/conf.d/supervisord.conf

# Create supervisor log directory
RUN mkdir -p /var/log/supervisor

# Kullanıcı yetkileri (Opsiyonel ama iyi pratik)
RUN chown -R www-data:www-data /var/www

EXPOSE 8000

# Use custom entrypoint
ENTRYPOINT ["docker-entrypoint.sh"]