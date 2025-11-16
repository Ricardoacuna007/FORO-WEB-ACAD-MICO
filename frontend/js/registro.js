// ===================================
// REGISTRO.JS - Manejo del formulario de registro
// ===================================
(function () {
    const form = document.getElementById('registroForm');
    if (!form) return;

    const ui = {
        rol: document.getElementById('rol'),
        camposEstudiante: document.getElementById('camposEstudiante'),
        camposProfesor: document.getElementById('camposProfesor'),
        matricula: document.getElementById('matricula'),
        carrera: document.getElementById('carrera'),
        cuatrimestre: document.getElementById('cuatrimestre'),
        numEmpleado: document.getElementById('numEmpleado'),
        especialidad: document.getElementById('especialidad'),
        password: document.getElementById('password'),
        confirmPassword: document.getElementById('confirmPassword'),
        togglePassword1: document.getElementById('togglePassword1'),
        togglePassword2: document.getElementById('togglePassword2'),
        passwordStrength: document.getElementById('passwordStrength'),
        passwordStrengthText: document.getElementById('passwordStrengthText'),
        registroBtn: document.getElementById('registroBtn'),
        successAlert: document.getElementById('successAlert'),
        successMessage: document.getElementById('successMessage'),
        errorAlert: document.getElementById('errorAlert'),
        errorMessage: document.getElementById('errorMessage')
    };

    const reglasBase = {
        nombre: { requerido: true, minLength: 2, maxLength: 50 },
        apellidos: { requerido: true, minLength: 2, maxLength: 50 },
        email: { requerido: true, email: true, emailInstitucional: true },
        password: { requerido: true, password: true, minLength: 8 },
        confirmPassword: { requerido: true, passwordMatch: '#password' },
        rol: { requerido: true },
        terminos: { requerido: true }
    };

    let carrerasDisponibles = [];

    inicializarValidacionTiempoReal(form, reglasBase);
    cargarCarreras();
    configurarEventos();

    function configurarEventos() {
        ui.rol?.addEventListener('change', manejarCambioRol);
        ui.togglePassword1?.addEventListener('click', () => togglePassword('password', ui.togglePassword1));
        ui.togglePassword2?.addEventListener('click', () => togglePassword('confirmPassword', ui.togglePassword2));
        ui.password?.addEventListener('input', actualizarFortalezaPassword);
        form.addEventListener('submit', manejarEnvioFormulario);

        // Inicializar visibilidad según el valor actual
        manejarCambioRol();
    }

    function manejarCambioRol() {
        const rol = ui.rol?.value;
        const esEstudiante = rol === 'estudiante';
        const esProfesor = rol === 'profesor';

        toggleSection(ui.camposEstudiante, esEstudiante);
        toggleSection(ui.camposProfesor, esProfesor);

        setRequired(ui.matricula, esEstudiante);
        setRequired(ui.carrera, esEstudiante);
        setRequired(ui.cuatrimestre, esEstudiante);

        setRequired(ui.numEmpleado, esProfesor);
        setRequired(ui.especialidad, esProfesor);
    }

    async function manejarEnvioFormulario(event) {
        event.preventDefault();
        ocultarAlertas();

        const rol = ui.rol?.value;
        const reglasRol = obtenerReglasPorRol(rol);

        const esValido = validarFormulario(form, { ...reglasBase, ...reglasRol });
        if (!esValido) {
            mostrarError('Por favor corrige los campos marcados antes de continuar.');
            return;
        }

        const payload = construirPayload(rol);
        if (!payload) {
            mostrarError('No se pudo construir la información para el registro.');
            return;
        }

        await enviarRegistro(payload);
    }

    function obtenerReglasPorRol(rol) {
        if (rol === 'estudiante') {
            return {
                matricula: { requerido: true, minLength: 5 },
                carrera: { requerido: true },
                cuatrimestre: { requerido: true }
            };
        }

        if (rol === 'profesor') {
            return {
                numEmpleado: { requerido: true, minLength: 3 },
                especialidad: { requerido: true, minLength: 3 }
            };
        }

        return {};
    }

    function construirPayload(rol) {
        try {
            const base = {
                nombre: form.nombre.value.trim(),
                apellidos: form.apellidos.value.trim(),
                email: form.email.value.trim().toLowerCase(),
                password: ui.password.value,
                password_confirmation: ui.confirmPassword.value,
                rol: rol
            };

            if (rol === 'estudiante') {
                base.matricula = ui.matricula?.value.trim();
                base.carrera_id = ui.carrera?.value ? parseInt(ui.carrera.value, 10) : null;
                base.cuatrimestre_actual = ui.cuatrimestre?.value ? parseInt(ui.cuatrimestre.value, 10) : null;
            }

            if (rol === 'profesor') {
                base.numero_empleado = ui.numEmpleado?.value.trim();
                base.especialidad = ui.especialidad?.value.trim();
            }

            base.terminos = form.terminos.checked;
            return base;
        } catch (error) {
            console.error('Error construyendo payload de registro:', error);
            return null;
        }
    }

    async function enviarRegistro(payload) {
        try {
            setEstadoBoton(true, 'Creando cuenta...');
            const response = await API.register(payload);

            if (!response?.success) {
                throw new Error(obtenerMensajeError(response));
            }

            mostrarExito(response.message || 'Cuenta creada exitosamente. Revisa tu correo para verificar tu cuenta.');
            form.reset();
            limpiarValidacion(form);
            manejarCambioRol();

            setTimeout(() => {
                if (typeof buildFrontendUrl === 'function') {
                    window.location.href = buildFrontendUrl('index');
                } else {
                    window.location.href = 'index.html';
                }
            }, 2000);
        } catch (error) {
            console.error('Error en el registro:', error);
            mostrarError(error.message || 'Ocurrió un error al crear tu cuenta.');
        } finally {
            setEstadoBoton(false);
        }
    }

    async function cargarCarreras() {
        if (!ui.carrera) return;

        try {
            const response = await API.getCarreras();
            if (response.success && Array.isArray(response.data)) {
                carrerasDisponibles = response.data;
                const opciones = ['<option value="" selected disabled>Selecciona tu carrera</option>'];
                carrerasDisponibles.forEach(carrera => {
                    opciones.push(`<option value="${carrera.id}">${carrera.nombre}</option>`);
                });
                ui.carrera.innerHTML = opciones.join('');
            }
        } catch (error) {
            console.error('Error al cargar carreras para el formulario de registro:', error);
        }
    }

    function obtenerMensajeError(response) {
        if (response?.errors) {
            const mensajes = Object.values(response.errors)
                .flat()
                .join(' ');
            return mensajes;
        }
        return response?.message || 'Error al procesar el registro.';
    }

    function toggleSection(section, mostrar) {
        if (!section) return;
        section.classList.toggle('d-none', !mostrar);
    }

    function setRequired(campo, requerido) {
        if (!campo) return;
        if (requerido) {
            campo.setAttribute('required', 'required');
        } else {
            campo.removeAttribute('required');
            limpiarErrorCampo(campo);
        }
    }

    function togglePassword(inputId, button) {
        const input = document.getElementById(inputId);
        if (!input || !button) return;

        const icon = button.querySelector('i');
        const esOculto = input.type === 'password';
        input.type = esOculto ? 'text' : 'password';
        icon.classList.toggle('fa-eye', !esOculto);
        icon.classList.toggle('fa-eye-slash', esOculto);
    }

    function actualizarFortalezaPassword() {
        if (!ui.password || !ui.passwordStrength) return;
        const password = ui.password.value;
        let strength = 0;

        if (password.length >= 8) strength += 25;
        if (/[a-z]/.test(password)) strength += 25;
        if (/[A-Z]/.test(password)) strength += 25;
        if (/[0-9]/.test(password)) strength += 25;

        ui.passwordStrength.style.width = `${strength}%`;
        ui.passwordStrength.className = 'progress-bar';

        if (strength <= 25) {
            ui.passwordStrength.classList.add('bg-danger');
            ui.passwordStrengthText.textContent = 'Débil';
        } else if (strength <= 50) {
            ui.passwordStrength.classList.add('bg-warning');
            ui.passwordStrengthText.textContent = 'Regular';
        } else if (strength <= 75) {
            ui.passwordStrength.classList.add('bg-info');
            ui.passwordStrengthText.textContent = 'Buena';
        } else {
            ui.passwordStrength.classList.add('bg-success');
            ui.passwordStrengthText.textContent = 'Fuerte';
        }
    }

    function ocultarAlertas() {
        toggleAlert(ui.successAlert, false);
        toggleAlert(ui.errorAlert, false);
    }

    function mostrarExito(mensaje) {
        if (ui.successMessage) ui.successMessage.textContent = mensaje;
        toggleAlert(ui.successAlert, true);
    }

    function mostrarError(mensaje) {
        if (ui.errorMessage) ui.errorMessage.textContent = mensaje;
        toggleAlert(ui.errorAlert, true);
    }

    function toggleAlert(alerta, mostrar) {
        if (!alerta) return;
        alerta.classList.toggle('d-none', !mostrar);
        alerta.classList.toggle('show', mostrar);
    }

    function setEstadoBoton(cargando, texto = 'Creando cuenta...') {
        if (!ui.registroBtn) return;
        ui.registroBtn.disabled = cargando;
        ui.registroBtn.innerHTML = cargando
            ? `<span class="spinner-border spinner-border-sm me-2"></span>${texto}`
            : '<i class="fas fa-user-plus me-2"></i> Crear Cuenta';
    }
})();
