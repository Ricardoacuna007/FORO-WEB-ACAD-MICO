#!/bin/bash

# Script para agregar el footer personalizado a todas las vistas HTML

FOOTER_BLOCK='    <!-- Footer -->
    <footer class="footer-custom bg-dark text-white py-5 mt-auto">
        <div class="container">
            <div class="row g-4">
                <div class="col-lg-4 col-md-6">
                    <h5 class="fw-bold mb-3"><i class="fas fa-graduation-cap me-2"></i> Foro Académico UPA</h5>
                    <p class="text-muted mb-3">Plataforma de comunicación académica para la comunidad de la Universidad Politécnica de Atlacomulco.</p>
                    <p class="text-muted small">Conecta con estudiantes y profesores, comparte conocimiento y colabora en proyectos académicos.</p>
                </div>
                <div class="col-lg-2 col-md-6">
                    <h6 class="fw-bold mb-3">Enlaces Rápidos</h6>
                    <ul class="list-unstyled">
                        <li class="mb-2"><a href="#" data-route="foro" class="text-muted text-decoration-none"><i class="fas fa-fire me-2"></i> Foro</a></li>
                        <li class="mb-2"><a href="#" data-route="dashboard" class="text-muted text-decoration-none"><i class="fas fa-home me-2"></i> Dashboard</a></li>
                        <li class="mb-2"><a href="#" data-route="calendario" class="text-muted text-decoration-none"><i class="fas fa-calendar me-2"></i> Calendario</a></li>
                        <li class="mb-2"><a href="#" data-route="perfil" class="text-muted text-decoration-none"><i class="fas fa-user me-2"></i> Mi Perfil</a></li>
                    </ul>
                </div>
                <div class="col-lg-3 col-md-6">
                    <h6 class="fw-bold mb-3">Recursos</h6>
                    <ul class="list-unstyled">
                        <li class="mb-2"><a href="#" data-route="search" class="text-muted text-decoration-none"><i class="fas fa-search me-2"></i> Búsqueda</a></li>
                        <li class="mb-2"><a href="#" data-route="notificaciones" class="text-muted text-decoration-none"><i class="fas fa-bell me-2"></i> Notificaciones</a></li>
                        <li class="mb-2"><a href="#" data-route="crear-post" class="text-muted text-decoration-none"><i class="fas fa-edit me-2"></i> Crear Publicación</a></li>
                    </ul>
                </div>
                <div class="col-lg-3 col-md-6">
                    <h6 class="fw-bold mb-3">Contacto y Redes Sociales</h6>
                    <ul class="list-unstyled text-muted small mb-4">
                        <li class="mb-3"><a href="mailto:hacrikianoni.9000@gmail.com" class="text-muted text-decoration-none" title="Enviar correo"><i class="fas fa-envelope me-2"></i> hacrikianoni.9000@gmail.com</a></li>
                    </ul>
                    <div class="social-links">
                        <a href="https://www.facebook.com/ricardo.acuna.359778?locale=es_LA" target="_blank" rel="noopener noreferrer" class="text-white me-3" aria-label="Facebook" title="Facebook"><i class="fab fa-facebook-f fa-lg"></i></a>
                        <a href="https://www.instagram.com/ricardo_acunaalc/" target="_blank" rel="noopener noreferrer" class="text-white me-3" aria-label="Instagram" title="Instagram"><i class="fab fa-instagram fa-lg"></i></a>
                        <a href="mailto:hacrikianoni.9000@gmail.com" class="text-white" aria-label="Email" title="Enviar correo"><i class="fas fa-envelope fa-lg"></i></a>
                    </div>
                </div>
            </div>
            <hr class="my-4 border-secondary">
            <div class="row align-items-center">
                <div class="col-md-6">
                    <p class="text-muted small mb-0">© <span id="footerYear-UNIQUE">2025</span> Foro Académico UPA. Todos los derechos reservados.</p>
                </div>
                <div class="col-md-6 text-md-end">
                    <ul class="list-inline mb-0 small">
                        <li class="list-inline-item me-3"><a href="#" class="text-muted text-decoration-none" onclick="if(typeof mostrarNotificacion==='function'){mostrarNotificacion('\''info'\'','\''Política de Privacidad en desarrollo'\'');}return false;">Política de Privacidad</a></li>
                        <li class="list-inline-item"><a href="#" class="text-muted text-decoration-none" onclick="if(typeof mostrarNotificacion==='function'){mostrarNotificacion('\''info'\'','\''Términos y Condiciones en desarrollo'\'');}return false;">Términos y Condiciones</a></li>
                    </ul>
                </div>
            </div>
            <div class="row mt-3">
                <div class="col-12 text-center">
                    <p class="text-muted small mb-0">Desarrollado con <i class="fas fa-heart text-danger"></i> por Ricardo Acuña <span class="d-none d-md-inline">• Ingeniería en Sistemas Computacionales</span></p>
                </div>
            </div>
        </div>
    </footer>
    <script>
        document.addEventListener('\''DOMContentLoaded'\'',function(){const f=document.getElementById('\''footerYear-UNIQUE'\'');if(f)f.textContent=new Date().getFullYear();});
    </script>'

echo "📝 Agregando footer a vistas HTML..."

# Lista de archivos que necesitan footer
FILES=(
    "frontend/registro.html"
    "frontend/recuperar-contrasena.html"
    "frontend/views/materia.html"
    "frontend/views/perfil.html"
    "frontend/views/calendario.html"
    "frontend/views/search.html"
    "frontend/views/notificaciones.html"
    "frontend/views/crear-post.html"
    "frontend/views/moderacion.html"
    "frontend/views/carrera.html"
    "frontend/views/cuatrimestre.html"
)

for file in "${FILES[@]}"; do
    if [ -f "$file" ]; then
        # Verificar si ya tiene footer
        if ! grep -q "footer-custom" "$file"; then
            # Agregar footer antes de </body>
            sed -i 's|</body>|FOOTER_PLACEHOLDER\n</body>|' "$file"
            # Reemplazar placeholder con footer real (necesita ID único)
            UNIQUE_ID=$(basename "$file" .html)
            FOOTER_WITH_ID=$(echo "$FOOTER_BLOCK" | sed "s/footerYear-UNIQUE/footerYear-$UNIQUE_ID/g")
            sed -i "s|FOOTER_PLACEHOLDER|$FOOTER_WITH_ID|" "$file"
            echo "✅ Footer agregado a $file"
        else
            echo "⚠️  $file ya tiene footer"
        fi
    else
        echo "❌ Archivo no encontrado: $file"
    fi
done

echo ""
echo "✅ Proceso completado"

