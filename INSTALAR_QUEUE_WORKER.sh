#!/bin/bash

# =========================================
# Script para Instalar Queue Worker
# =========================================

set -e

echo "=========================================="
echo "Instalando Queue Worker"
echo "=========================================="

# Copiar servicio
echo "1. Copiando servicio systemd..."
sudo cp /var/www/FORO-WEB-ACAD-MICO/foro-queue.service /etc/systemd/system/foro-queue.service

# Recargar systemd
echo "2. Recargando systemd..."
sudo systemctl daemon-reload

# Habilitar servicio
echo "3. Habilitando servicio..."
sudo systemctl enable foro-queue

# Iniciar servicio
echo "4. Iniciando servicio..."
sudo systemctl start foro-queue

# Verificar estado
echo ""
echo "5. Verificando estado..."
sudo systemctl status foro-queue --no-pager -l

echo ""
echo "=========================================="
echo "✓ Queue Worker instalado"
echo "=========================================="
echo ""
echo "Comandos útiles:"
echo "  sudo systemctl status foro-queue   # Ver estado"
echo "  sudo systemctl restart foro-queue  # Reiniciar"
echo "  sudo systemctl stop foro-queue     # Detener"
echo "  sudo journalctl -u foro-queue -f   # Ver logs"
echo ""

