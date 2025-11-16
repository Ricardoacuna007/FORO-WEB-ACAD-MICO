#!/bin/bash

# =========================================
# Script de Build para Producción
# Minifica y optimiza archivos JS y CSS
# =========================================

set -e

echo "=========================================="
echo "Build de Producción - Foro Académico UPA"
echo "=========================================="

FRONTEND_DIR="/var/www/FORO-WEB-ACAD-MICO/frontend"
BUILD_DIR="$FRONTEND_DIR/dist"

# Crear directorio de build
mkdir -p "$BUILD_DIR/js" "$BUILD_DIR/css"

echo ""
echo "1. Verificando dependencias..."

# Verificar si terser está instalado (para minificar JS)
if ! command -v terser &> /dev/null; then
    echo "   Instalando terser globalmente..."
    npm install -g terser
fi

# Verificar si cssnano está instalado (para minificar CSS)
if ! command -v cssnano &> /dev/null; then
    echo "   Instalando cssnano-cli globalmente..."
    npm install -g cssnano-cli
fi

echo ""
echo "2. Minificando JavaScript..."

# Minificar cada archivo JS
for js_file in "$FRONTEND_DIR/js"/*.js; do
    if [ -f "$js_file" ]; then
        filename=$(basename "$js_file" .js)
        echo "   Minificando: $filename.js"
        terser "$js_file" -o "$BUILD_DIR/js/${filename}.min.js" \
            --compress drop_console=true \
            --mangle \
            --comments false
    fi
done

echo ""
echo "3. Minificando CSS..."

# Minificar CSS
if [ -f "$FRONTEND_DIR/css/styles.css" ]; then
    echo "   Minificando: styles.css"
    cssnano "$FRONTEND_DIR/css/styles.css" "$BUILD_DIR/css/styles.min.css"
fi

echo ""
echo "4. Copiando archivos estáticos..."

# Copiar otros assets
cp -r "$FRONTEND_DIR/assets" "$BUILD_DIR/" 2>/dev/null || true
cp -r "$FRONTEND_DIR/vendor" "$BUILD_DIR/" 2>/dev/null || true

echo ""
echo "5. Generando archivo de manifiesto..."

# Crear manifest.json con hashes de archivos
cat > "$BUILD_DIR/manifest.json" << EOF
{
    "version": "1.0.0",
    "build_date": "$(date -u +"%Y-%m-%dT%H:%M:%SZ")",
    "files": {
EOF

# Agregar archivos JS
for js_file in "$BUILD_DIR/js"/*.min.js; do
    if [ -f "$js_file" ]; then
        filename=$(basename "$js_file")
        hash=$(md5sum "$js_file" | awk '{print $1}')
        echo "        \"js/$filename\": \"$hash\"," >> "$BUILD_DIR/manifest.json"
    fi
done

# Agregar archivos CSS
for css_file in "$BUILD_DIR/css"/*.min.css; do
    if [ -f "$css_file" ]; then
        filename=$(basename "$css_file")
        hash=$(md5sum "$css_file" | awk '{print $1}')
        echo "        \"css/$filename\": \"$hash\"," >> "$BUILD_DIR/manifest.json"
    fi
done

# Cerrar JSON (remover última coma)
sed -i '$ s/,$//' "$BUILD_DIR/manifest.json"
echo "    }" >> "$BUILD_DIR/manifest.json"
echo "}" >> "$BUILD_DIR/manifest.json"

echo ""
echo "=========================================="
echo "✓ Build completado exitosamente"
echo "=========================================="
echo ""
echo "Archivos generados en: $BUILD_DIR"
echo ""
echo "Próximos pasos:"
echo "  1. Revisar archivos minificados"
echo "  2. Actualizar HTML para usar archivos .min.js y .min.css"
echo "  3. Configurar Nginx para servir archivos minificados"
echo ""

