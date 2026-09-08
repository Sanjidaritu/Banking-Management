FROM php:8.3-cli

RUN docker-php-ext-install pdo pdo_mysql

COPY . /var/www/html

WORKDIR /var/www/html

CMD ["sh", "-c", "php -S 0.0.0.0:${PORT:-8080} -t /var/www/html"]
