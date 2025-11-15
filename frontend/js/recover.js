/**
 * RECOVER.JS - Flujo de recuperación de contraseña
 */

document.addEventListener('DOMContentLoaded', () => {
    const stepSolicitud = document.getElementById('stepSolicitud');
    const stepRestablecer = document.getElementById('stepRestablecer');
    const formSolicitud = document.getElementById('formRecuperar');
    const formReset = document.getElementById('formRestablecer');
    const emailInputSolicitud = document.getElementById('emailRecuperacion');
    const emailInputReset = document.getElementById('emailReset');
    const tokenInput = document.getElementById('tokenRecuperacion');
    const passwordInput = document.getElementById('passwordNuevo');
    const passwordConfirmInput = document.getElementById('passwordConfirmacion');
    const tokenDebugContainer = document.getElementById('tokenDebugContainer');
    const tokenDebugValue = document.getElementById('tokenDebugValue');
    const stepperItems = document.querySelectorAll('[data-stepper]');

    function setActiveStep(step) {
        stepperItems.forEach(item => {
            const itemStep = item.getAttribute('data-stepper');
            item.classList.toggle('active', itemStep === step);
            item.classList.toggle('completed', Number(itemStep) < Number(step));
        });
    }

    function mostrarPasoSolicitud() {
        stepSolicitud.classList.remove('d-none');
        stepRestablecer.classList.add('d-none');
        setActiveStep('1');
        if (emailInputSolicitud) {
            emailInputSolicitud.focus();
        }
    }

    function mostrarPasoRestablecer() {
        stepSolicitud.classList.add('d-none');
        stepRestablecer.classList.remove('d-none');
        setActiveStep('2');
        if (tokenInput) {
            tokenInput.focus();
        }
    }

    function toggleLoading(button, loading = true, message = 'Procesando...') {
        if (!button) return;
        if (loading) {
            button.dataset.originalText = button.innerHTML;
            button.disabled = true;
            button.innerHTML = `<span class="spinner-border spinner-border-sm me-2" role="status"></span>${message}`;
        } else {
            button.disabled = false;
            button.innerHTML = button.dataset.originalText || button.innerHTML;
        }
    }

    if (formSolicitud) {
        formSolicitud.addEventListener('submit', async (event) => {
            event.preventDefault();
            if (!validarFormulario(formSolicitud)) {
                return;
            }

            const email = emailInputSolicitud.value.trim();
            const submitBtn = formSolicitud.querySelector('button[type="submit"]');

            try {
                toggleLoading(submitBtn, true, 'Enviando enlace...');
                const response = await API.recuperarPassword(email);
                mostrarNotificacion('success', response.message || 'Hemos enviado instrucciones a tu correo.');

                if (emailInputReset) {
                    emailInputReset.value = email;
                }
                if (tokenDebugContainer && tokenDebugValue) {
                    const token = response?.data?.token;
                    if (token) {
                        tokenDebugValue.textContent = token;
                        tokenDebugContainer.classList.remove('d-none');
                    } else {
                        tokenDebugContainer.classList.add('d-none');
                        tokenDebugValue.textContent = '';
                    }
                }

                mostrarPasoRestablecer();
            } catch (error) {
                console.error('Error en recuperación:', error);
                mostrarNotificacion('error', error.message || 'No pudimos procesar tu solicitud. Intenta nuevamente.');
            } finally {
                toggleLoading(submitBtn, false);
            }
        });
    }

    if (formReset) {
        formReset.addEventListener('submit', async (event) => {
            event.preventDefault();
            if (!validarFormulario(formReset)) {
                return;
            }

            const submitBtn = formReset.querySelector('button[type="submit"]');
            const payload = {
                email: emailInputReset.value.trim(),
                token: tokenInput.value.trim(),
                password: passwordInput.value,
                password_confirmation: passwordConfirmInput.value
            };

            try {
                toggleLoading(submitBtn, true, 'Restableciendo...');
                const response = await API.restablecerPassword(payload);
                mostrarNotificacion('success', response.message || 'Contraseña restablecida correctamente.');

                formReset.reset();
                if (formSolicitud) {
                    formSolicitud.reset();
                }

                setTimeout(() => {
                    window.location.href = buildFrontendUrl('index');
                }, 1500);
            } catch (error) {
                console.error('Error al restablecer contraseña:', error);
                mostrarNotificacion('error', error.message || 'No fue posible restablecer tu contraseña.');
            } finally {
                toggleLoading(submitBtn, false);
            }
        });
    }

    if (typeof inicializarValidacionTiempoReal === 'function') {
        if (formSolicitud) {
            inicializarValidacionTiempoReal(formSolicitud, {
                email: { requerido: true, email: true, emailInstitucional: true }
            });
        }
        if (formReset) {
            inicializarValidacionTiempoReal(formReset, {
                email: { requerido: true, email: true, emailInstitucional: true },
                token: { requerido: true, minLength: 6 },
                password: { requerido: true, password: true, minLength: 8 },
                password_confirmation: { requerido: true, passwordMatch: '#passwordNuevo' }
            });
        }
    }

    mostrarPasoSolicitud();
});

