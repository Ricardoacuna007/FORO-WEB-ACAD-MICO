/**
 * FOOTER.JS - Footer dinámico
 * ===========================
 * Carga el footer en todas las vistas
 */

(function() {
    'use strict';

    function cargarFooter() {
        const footerContainer = document.getElementById('footer-container');
        if (!footerContainer) {
            // Si no existe el contenedor, crear el footer antes de </body>
            const body = document.body;
            const footerHTML = obtenerFooterHTML();
            body.insertAdjacentHTML('beforeend', footerHTML);
        } else {
            footerContainer.innerHTML = obtenerFooterHTML();
        }

        // Actualizar año dinámicamente
        const footerYear = document.getElementById('footerYear');
        if (footerYear) {
            footerYear.textContent = new Date().getFullYear();
        }

        // Configurar navegación para enlaces del footer
        document.querySelectorAll('.footer-custom a[data-route]').forEach(link => {
            link.addEventListener('click', function(e) {
                e.preventDefault();
                const route = this.getAttribute('data-route');
                if (route && typeof navigateToRoute === 'function') {
                    navigateToRoute(route);
                } else if (route && typeof window.location !== 'undefined') {
                    window.location.href = route === 'index' ? '/' : `/${route}`;
                }
            });
        });
    }

    function obtenerFooterHTML() {
        return `
<!-- Footer -->
<footer class="footer-custom bg-dark text-white py-5 mt-auto">
    <div class="container">
        <div class="row g-4">
            <!-- Información Principal -->
            <div class="col-lg-4 col-md-6">
                <h5 class="fw-bold mb-3">
                    <i class="fas fa-graduation-cap me-2"></i> Foro Académico UPA
                </h5>
                <p class="text-muted mb-3">
                    Plataforma de comunicación académica para la comunidad de la Universidad Politécnica de Atlacomulco.
                </p>
                <p class="text-muted small">
                    Conecta con estudiantes y profesores, comparte conocimiento y colabora en proyectos académicos.
                </p>
            </div>

            <!-- Enlaces Rápidos -->
            <div class="col-lg-2 col-md-6">
                <h6 class="fw-bold mb-3">Enlaces Rápidos</h6>
                <ul class="list-unstyled">
                    <li class="mb-2">
                        <a href="#" data-route="foro" class="text-muted text-decoration-none">
                            <i class="fas fa-fire me-2"></i> Foro
                        </a>
                    </li>
                    <li class="mb-2">
                        <a href="#" data-route="dashboard" class="text-muted text-decoration-none">
                            <i class="fas fa-home me-2"></i> Dashboard
                        </a>
                    </li>
                    <li class="mb-2">
                        <a href="#" data-route="calendario" class="text-muted text-decoration-none">
                            <i class="fas fa-calendar me-2"></i> Calendario
                        </a>
                    </li>
                    <li class="mb-2">
                        <a href="#" data-route="perfil" class="text-muted text-decoration-none">
                            <i class="fas fa-user me-2"></i> Mi Perfil
                        </a>
                    </li>
                </ul>
            </div>

            <!-- Recursos -->
            <div class="col-lg-3 col-md-6">
                <h6 class="fw-bold mb-3">Recursos</h6>
                <ul class="list-unstyled">
                    <li class="mb-2">
                        <a href="#" data-route="search" class="text-muted text-decoration-none">
                            <i class="fas fa-search me-2"></i> Búsqueda
                        </a>
                    </li>
                    <li class="mb-2">
                        <a href="#" data-route="notificaciones" class="text-muted text-decoration-none">
                            <i class="fas fa-bell me-2"></i> Notificaciones
                        </a>
                    </li>
                    <li class="mb-2">
                        <a href="#" data-route="crear-post" class="text-muted text-decoration-none">
                            <i class="fas fa-edit me-2"></i> Crear Publicación
                        </a>
                    </li>
                </ul>
            </div>

            <!-- Contacto y Redes Sociales -->
            <div class="col-lg-3 col-md-6">
                <h6 class="fw-bold mb-3">Contacto</h6>
                <ul class="list-unstyled text-muted small mb-4">
                    <li class="mb-2">
                        <i class="fas fa-university me-2"></i> Universidad Politécnica de Atlacomulco
                    </li>
                    <li class="mb-2">
                        <i class="fas fa-globe me-2"></i> www.upatlacomulco.edu.mx
                    </li>
                </ul>
            </div>
        </div>

        <hr class="my-4 border-secondary">

        <!-- Copyright y Avisos Legales -->
        <div class="row align-items-center">
            <div class="col-md-6">
                <p class="text-muted small mb-0">
                    © <span id="footerYear">${new Date().getFullYear()}</span> Universidad Politécnica de Atlacomulco. Todos los derechos reservados.
                </p>
            </div>
            <div class="col-md-6 text-md-end">
                <ul class="list-inline mb-0 small">
                    <li class="list-inline-item me-3">
                        <a href="#" class="text-muted text-decoration-none" onclick="mostrarNotificacion('info', 'Política de Privacidad en desarrollo'); return false;">
                            Política de Privacidad
                        </a>
                    </li>
                    <li class="list-inline-item">
                        <a href="#" class="text-muted text-decoration-none" onclick="mostrarNotificacion('info', 'Términos y Condiciones en desarrollo'); return false;">
                            Términos y Condiciones
                        </a>
                    </li>
                </ul>
            </div>
        </div>

        <!-- Información de Desarrollo -->
        <div class="row mt-3">
            <div class="col-12 text-center">
                <p class="text-muted small mb-0">
                    Desarrollado con <i class="fas fa-heart text-danger"></i> para la comunidad académica
                    <span class="d-none d-md-inline">• Ingeniería en Sistemas Computacionales</span>
                </p>
            </div>
        </div>
    </div>
</footer>
        `;
    }

    // Cargar footer cuando el DOM esté listo
    if (document.readyState === 'loading') {
        document.addEventListener('DOMContentLoaded', cargarFooter);
    } else {
        cargarFooter();
    }
})();

