#!/bin/bash

# =========================================
# Script para Corregir Problemas Finales
# =========================================

set -e

echo "=========================================="
echo "Corrigiendo Problemas Finales"
echo "=========================================="
echo ""

# Colores
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
RED='\033[0;31m'
NC='\033[0m' # No Color

# 1. Corregir permisos de storage y bootstrap/cache
echo "1. Corrigiendo permisos de storage y bootstrap/cache..."
sudo chmod -R 775 /var/www/FORO-WEB-ACAD-MICO/backend/storage
sudo chmod -R 775 /var/www/FORO-WEB-ACAD-MICO/backend/bootstrap/cache
sudo chown -R nginx:nginx /var/www/FORO-WEB-ACAD-MICO/backend/storage
sudo chown -R nginx:nginx /var/www/FORO-WEB-ACAD-MICO/backend/bootstrap/cache

echo -e "${GREEN}   ✓ Permisos corregidos${NC}"

# 2. Verificar y corregir permisos de .env
if [ -f "/var/www/FORO-WEB-ACAD-MICO/backend/.env" ]; then
    echo ""
    echo "2. Corrigiendo permisos de .env..."
    sudo chmod 644 /var/www/FORO-WEB-ACAD-MICO/backend/.env
    sudo chown nginx:nginx /var/www/FORO-WEB-ACAD-MICO/backend/.env
    echo -e "${GREEN}   ✓ Permisos de .env corregidos${NC}"
fi

# 3. Verificar configuración de Nginx
echo ""
echo "3. Verificando configuración de Nginx..."
if sudo nginx -t 2>&1 | grep -q "syntax is ok"; then
    echo -e "${GREEN}   ✓ Sintaxis correcta${NC}"
    sudo systemctl reload nginx
    echo -e "${GREEN}   ✓ Nginx recargado${NC}"
else
    echo -e "${RED}   ✗ Error en sintaxis${NC}"
    sudo nginx -t
    exit 1
fi

# 4. Limpiar caché de Laravel como usuario nginx
echo ""
echo "4. Limpiando caché de Laravel..."
cd /var/www/FORO-WEB-ACAD-MICO/backend

sudo -u nginx php artisan config:clear 2>&1 | grep -v "Permission denied" | grep -v "StreamHandler" || true
sudo -u nginx php artisan cache:clear 2>&1 | grep -v "Permission denied" | grep -v "StreamHandler" || true
sudo -u nginx php artisan route:clear 2>&1 | grep -v "Permission denied" | grep -v "StreamHandler" || true

echo ""
echo "5. Recacheando configuración..."
sudo -u nginx php artisan config:cache 2>&1 | grep -v "Permission denied" | grep -v "StreamHandler" || true
sudo -u nginx php artisan route:cache 2>&1 | grep -v "Permission denied" | grep -v "StreamHandler" || true

echo -e "${GREEN}   ✓ Caché limpiado y recacheado${NC}"

# 5. Verificar archivo de avatar
echo ""
echo "6. Verificando archivo de avatar..."
if [ -f "/var/www/FORO-WEB-ACAD-MICO/backend/storage/app/public/avatars/f373013c-0923-4482-9372-5d3967458a3b.jpeg" ]; then
    echo -e "${GREEN}   ✓ Archivo existe${NC}"
    ls -lh /var/www/FORO-WEB-ACAD-MICO/backend/storage/app/public/avatars/f373013c-0923-4482-9372-5d3967458a3b.jpeg
else
    echo -e "${YELLOW}   ⚠ Archivo NO existe${NC}"
fi

# 6. Probar acceso al archivo
echo ""
echo "7. Probando acceso al archivo..."
STATUS=$(curl -s -o /dev/null -w "%{http_code}" http://localhost/storage/avatars/f373013c-0923-4482-9372-5d3967458a3b.jpeg)
if [ "$STATUS" = "200" ]; then
    echo -e "${GREEN}   ✓ Archivo accesible (HTTP $STATUS)${NC}"
elif [ "$STATUS" = "404" ]; then
    echo -e "${RED}   ✗ Archivo NO accesible (HTTP 404)${NC}"
    echo ""
    echo "   Verificando configuración de Nginx..."
    echo "   La ruta debe ser: /storage/avatars/f373013c-0923-4482-9372-5d3967458a3b.jpeg"
    echo "   Y debe mapear a: /var/www/FORO-WEB-ACAD-MICO/backend/storage/app/public/avatars/f373013c-0923-4482-9372-5d3967458a3b.jpeg"
else
    echo -e "${YELLOW}   ⚠ Estado HTTP: $STATUS${NC}"
fi

echo ""
echo "=========================================="
echo -e "${GREEN}✓ Correcciones aplicadas${NC}"
echo "=========================================="
echo ""
echo "Pruebas:"
echo "  1. curl -I http://localhost/storage/avatars/f373013c-0923-4482-9372-5d3967458a3b.jpeg"
echo "  2. curl http://localhost/health"
echo ""

