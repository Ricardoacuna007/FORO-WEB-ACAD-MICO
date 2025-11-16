#!/bin/bash

# =========================================
# Script para Aplicar Todas las Mejoras
# =========================================

set -e

echo "=========================================="
echo "Aplicando Mejoras - Foro Académico UPA"
echo "=========================================="
echo ""

# Colores
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
RED='\033[0;31m'
NC='\033[0m' # No Color

# 1. Verificar Nginx
echo "1. Verificando configuración de Nginx..."
if sudo nginx -t 2>&1 | grep -q "syntax is ok"; then
    echo -e "${GREEN}   ✓ Sintaxis de Nginx correcta${NC}"
    
    echo "   Recargando Nginx..."
    if sudo systemctl reload nginx 2>&1; then
        echo -e "${GREEN}   ✓ Nginx recargado exitosamente${NC}"
    else
        echo -e "${RED}   ✗ Error al recargar Nginx${NC}"
        exit 1
    fi
else
    echo -e "${RED}   ✗ Error en la sintaxis de Nginx${NC}"
    sudo nginx -t
    exit 1
fi

echo ""

# 2. Limpiar caché de Laravel
echo "2. Limpiando caché de Laravel..."
cd /var/www/FORO-WEB-ACAD-MICO/backend

php artisan config:clear
php artisan cache:clear
php artisan route:clear
php artisan view:clear

echo -e "${GREEN}   ✓ Caché limpiado${NC}"

# 3. Recachear configuración
echo ""
echo "3. Recacheando configuración..."
php artisan config:cache
php artisan route:cache

echo -e "${GREEN}   ✓ Configuración recacheada${NC}"

# 4. Crear tabla de jobs si no existe
echo ""
echo "4. Verificando tabla de jobs..."
if php artisan migrate:status 2>&1 | grep -q "jobs" || php artisan db:table jobs 2>&1 | grep -q "jobs"; then
    echo -e "${YELLOW}   ⚠ Tabla jobs ya existe${NC}"
else
    echo "   Creando tabla de jobs..."
    php artisan queue:table
    php artisan migrate --force
    echo -e "${GREEN}   ✓ Tabla de jobs creada${NC}"
fi

# 5. Verificar health checks
echo ""
echo "5. Verificando health checks..."
if curl -s http://localhost/health | grep -q "healthy\|ok"; then
    echo -e "${GREEN}   ✓ Health check funcionando${NC}"
else
    echo -e "${YELLOW}   ⚠ Health check no responde correctamente${NC}"
fi

echo ""
echo "=========================================="
echo -e "${GREEN}✓ Mejoras aplicadas exitosamente${NC}"
echo "=========================================="
echo ""
echo "Próximos pasos recomendados:"
echo ""
echo "1. Configurar queue worker (opcional pero recomendado):"
echo "   sudo nano /etc/systemd/system/foro-queue.service"
echo "   (Ver instrucciones en IMPLEMENTACION_MEJORAS.md)"
echo ""
echo "2. Verificar que todo funciona:"
echo "   curl http://localhost/health"
echo "   curl http://localhost/api/test"
echo ""
echo "3. Monitorear logs:"
echo "   tail -f /var/www/FORO-WEB-ACAD-MICO/backend/storage/logs/laravel.log"
echo "   tail -f /var/log/nginx/forodigital_error.log"
echo ""

