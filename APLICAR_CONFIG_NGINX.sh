#!/bin/bash
# Script para aplicar la configuración de Nginx

echo "🔧 Aplicando configuración de Nginx..."

# Hacer backup de la configuración actual
BACKUP_FILE="/etc/nginx/conf.d/miweb.conf.backup.$(date +%Y%m%d_%H%M%S)"
sudo cp /etc/nginx/conf.d/miweb.conf "$BACKUP_FILE"
echo "✅ Backup creado: $BACKUP_FILE"

# Copiar nueva configuración
sudo cp /var/www/FORO-WEB-ACAD-MICO/nginx_miweb.conf /etc/nginx/conf.d/miweb.conf

# Probar configuración
echo ""
echo "📝 Probando configuración de Nginx..."
sudo nginx -t

if [ $? -eq 0 ]; then
    echo ""
    echo "✅ Configuración válida. Recargando Nginx..."
    sudo systemctl reload nginx
    echo "✅ Nginx recargado exitosamente!"
    echo ""
    echo "🔍 Verifica que todo funciona:"
    echo "   - https://forodigital.org"
    echo "   - https://forodigital.org/moderacion"
    echo "   - https://forodigital.org/api/auth/me"
else
    echo ""
    echo "❌ Error en la configuración. Revisa los errores arriba."
    echo "🔙 Restaurando backup..."
    sudo cp "$BACKUP_FILE" /etc/nginx/conf.d/miweb.conf
    exit 1
fi
