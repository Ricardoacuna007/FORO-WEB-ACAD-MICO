# 📊 Análisis del Proyecto - FORO WEB ACADÉMICO

## 📁 Estructura del Proyecto

### 🌐 Frontend (`/frontend`)
```
frontend/
├── assets/
│   ├── fonts/          # Fuentes personalizadas
│   ├── icons/          # Iconos
│   └── img/            # Imágenes (logo-upa.jpg)
├── components/         # Componentes HTML reutilizables
│   ├── breadcrumb.html
│   ├── comment-item.html
│   ├── footer.html
│   ├── modal-crear-post.html
│   ├── modal-editar-perfil.html
│   ├── navbar.html
│   ├── notification-badge.html
│   ├── post-card.html
│   └── sidebar.html
├── css/                # Estilos CSS
│   ├── bootstrap.main.css
│   ├── components.css
│   ├── layout.css
│   ├── styles.css
│   └── themes.css
├── js/                 # Scripts JavaScript
│   ├── api.js          ✅ USADO (264 líneas)
│   ├── auth.js         ✅ USADO (266 líneas)
│   ├── main.js         ✅ USADO (622 líneas)
│   ├── calendario.js   ❌ VACÍO (1 línea)
│   ├── comments.js     ❌ VACÍO (1 línea)
│   ├── notifications.js ❌ VACÍO (1 línea)
│   ├── posts.js        ❌ VACÍO (1 línea)
│   ├── search.js       ❌ VACÍO (1 línea)
│   ├── utils.js        ❌ VACÍO (1 línea)
│   └── validation.js   ❌ VACÍO (1 línea)
├── views/              # Vistas HTML
│   ├── calendario.html
│   ├── carrera.html
│   ├── crear-post.html
│   ├── cuatrimestre.html
│   ├── foro.html
│   ├── materia.html
│   ├── moderacion.html
│   ├── notificaciones.html
│   ├── perfil.html
│   └── post.html
├── dashboard.html      ✅ USADO
├── index.html          ✅ USADO
├── registro.html       ✅ USADO
└── test.html           ⚠️ ARCHIVO DE PRUEBA
```

### 🔧 Backend Laravel (`/backend`)
```
backend/
├── app/
│   ├── Http/
│   │   ├── Controllers/    # Controladores
│   │   │   ├── AuthController.php
│   │   │   ├── CalendarioController.php
│   │   │   ├── ComentarioController.php
│   │   │   ├── Controller.php
│   │   │   ├── ModeracionController.php
│   │   │   ├── NavegacionController.php
│   │   │   ├── NotificacionController.php
│   │   │   ├── PerfilController.php
│   │   │   └── PublicacionController.php
│   │   └── Middleware/
│   ├── Models/             # Modelos Eloquent
│   │   ├── Carrera.php
│   │   ├── Comentario.php
│   │   ├── Estudiante.php
│   │   ├── Evento.php
│   │   ├── Materia.php
│   │   ├── Notificacion.php
│   │   ├── Profesor.php
│   │   ├── Publicacion.php
│   │   ├── User.php        ⚠️ DUPLICADO (modelo por defecto Laravel)
│   │   └── Usuario.php     ✅ USADO (modelo principal)
│   └── Providers/
├── database/
│   ├── migrations/         # Migraciones
│   │   ├── 0001_01_01_000000_create_users_table.php
│   │   ├── 0001_01_01_000001_create_cache_table.php
│   │   ├── 0001_01_01_000002_create_jobs_table.php
│   │   ├── 2025_11_10_210155_create_personal_access_tokens_table.php
│   │   └── 2025_11_10_215132_create_personal_access_tokens_table.php ⚠️ DUPLICADO
│   ├── seeders/
│   └── database.sqlite     # Base de datos SQLite
├── routes/
│   ├── api.php             ✅ RUTAS API DEFINIDAS
│   ├── web.php
│   └── console.php
├── config/                 # Configuración Laravel
├── public/                 # Punto de entrada público
├── resources/              # Recursos (vistas Blade, CSS, JS)
├── storage/                # Archivos almacenados
├── tests/                  # Pruebas
├── vendor/                 # Dependencias Composer
├── composer.json           ✅ CONFIGURADO
├── composer.lock
├── package.json
├── phpunit.xml
├── vite.config.js
└── README.md               ⚠️ README GENÉRICO DE LARAVEL
```

### 🔄 Backend Alternativo (`/backendd`)
```
backendd/
├── app/
│   ├── composer.json       ❌ VACÍO
│   ├── config/             # Configuración
│   │   ├── cors.php
│   │   └── database.php
│   ├── http/               # Controladores (minúsculas)
│   │   ├── controllers/
│   │   │   ├── AuthController.php
│   │   │   ├── CalendarioController.php
│   │   │   ├── ComentarioController.php
│   │   │   ├── ModeracionController.php
│   │   │   ├── NavegacionController.php
│   │   │   ├── NotificacionController.php
│   │   │   ├── PerfilController.php
│   │   │   └── PublicacionController.php
│   │   ├── middleware/
│   │   │   └── cors.php
│   │   └── models/
│   │       ├── Carrera.php
│   │       ├── Comentario.php
│   │       ├── Estudiante.php
│   │       ├── Evento.php
│   │       ├── Materia.php
│   │       ├── Notificacion.php
│   │       ├── Profesor.php
│   │       ├── Publicacion.php
│   │       └── Usuario.php
│   └── routers/
│       └── api.php         ❌ VACÍO
└── tests/                  # Directorio de pruebas (vacío)
```

**⚠️ OBSERVACIÓN:** El directorio `backendd/` parece ser una versión alternativa o anterior del backend. Tiene estructura similar pero:
- No es un proyecto Laravel completo
- No tiene `composer.json` funcional
- Tiene estructura de carpetas en minúsculas (no sigue PSR-4)
- El archivo `api.php` en routers está vacío
- No tiene configuración de dependencias

### 💾 Base de Datos (`/database`)
```
database/
├── backups/            # Respaldos de base de datos
├── schema.sql          # Esquema SQL
└── seed.sql            # Datos de semilla
```

### 📚 Documentación (`/docs`)
```
docs/
├── diagramas_UML/      # Diagramas UML del proyecto
├── manual_tecnico.md   # Manual técnico
├── manual_usuario.md   # Manual de usuario
├── presentacion/       # Presentaciones
└── requerimientos/     # Documentos de requerimientos
```

### 🚀 Despliegue (`/deployment`)
```
deployment/
└── setup_intrucciones.md  ⚠️ TYPO: "intrucciones" debería ser "instrucciones"
```

### 🔧 Configuración Raíz
```
/
├── composer.phar       # Ejecutable de Composer
├── composer-setup.php  # Instalador de Composer
├── .git/               # Control de versiones Git
└── .vscode/            # Configuración de VS Code
```

---

## ❌ Archivos Vacíos o No Utilizados

### 🔴 Archivos JavaScript Vacíos (1 línea cada uno)
Los siguientes archivos están vacíos y **NO se están usando** en ningún HTML:

1. **`frontend/js/calendario.js`** ❌
   - **Estado:** Vacío (1 línea)
   - **Uso:** No se importa en ningún HTML
   - **Nota:** El calendario usa FullCalendar directamente en `views/calendario.html`

2. **`frontend/js/comments.js`** ❌
   - **Estado:** Vacío (1 línea)
   - **Uso:** No se importa en ningún HTML
   - **Nota:** Los comentarios se manejan en `main.js` o deberían implementarse

3. **`frontend/js/notifications.js`** ❌
   - **Estado:** Vacío (1 línea)
   - **Uso:** No se importa en ningún HTML
   - **Nota:** Las notificaciones se manejan en `main.js`

4. **`frontend/js/posts.js`** ❌
   - **Estado:** Vacío (1 línea)
   - **Uso:** No se importa en ningún HTML
   - **Nota:** Las publicaciones se manejan en `main.js` y `api.js`

5. **`frontend/js/search.js`** ❌
   - **Estado:** Vacío (1 línea)
   - **Uso:** No se importa en ningún HTML
   - **Nota:** La búsqueda se maneja en `main.js` (función `inicializarBusqueda()`)

6. **`frontend/js/utils.js`** ❌
   - **Estado:** Vacío (1 línea)
   - **Uso:** No se importa en ningún HTML
   - **Nota:** Las utilidades están en `main.js`

7. **`frontend/js/validation.js`** ❌
   - **Estado:** Vacío (1 línea)
   - **Uso:** No se importa en ningún HTML
   - **Nota:** La validación se maneja en `auth.js` y `api.js`

### ⚠️ Archivos con Problemas o Duplicados

1. **`backend/app/Models/User.php`** ⚠️
   - **Estado:** Modelo por defecto de Laravel
   - **Problema:** Duplicado con `Usuario.php`
   - **Recomendación:** Eliminar si se usa `Usuario.php` como modelo principal

2. **`backend/database/migrations/2025_11_10_215132_create_personal_access_tokens_table.php`** ⚠️
   - **Estado:** Migración duplicada
   - **Problema:** Ya existe `2025_11_10_210155_create_personal_access_tokens_table.php`
   - **Recomendación:** Eliminar la duplicada

3. **`backendd/app/composer.json`** ❌
   - **Estado:** Vacío
   - **Problema:** No tiene configuración de dependencias
   - **Recomendación:** Eliminar `backendd/` si no se usa, o migrar código a `backend/`

4. **`backendd/app/routers/api.php`** ❌
   - **Estado:** Vacío
   - **Problema:** No tiene rutas definidas
   - **Recomendación:** Eliminar si no se usa

5. **`backend/README.md`** ⚠️
   - **Estado:** README genérico de Laravel
   - **Problema:** No documenta el proyecto específico
   - **Recomendación:** Reemplazar con documentación del proyecto

6. **`frontend/test.html`** ⚠️
   - **Estado:** Archivo de prueba
   - **Problema:** No debería estar en producción
   - **Recomendación:** Mover a carpeta de pruebas o eliminar

7. **`deployment/setup_intrucciones.md`** ⚠️
   - **Estado:** Tiene typo en el nombre
   - **Problema:** Debería ser "instrucciones"
   - **Recomendación:** Renombrar archivo

---

## ✅ Archivos en Uso

### JavaScript Activos
- ✅ `frontend/js/api.js` - Comunicación con backend (264 líneas)
- ✅ `frontend/js/auth.js` - Autenticación (266 líneas)
- ✅ `frontend/js/main.js` - Funcionalidad principal (622 líneas)

### HTML Principal
- ✅ `frontend/index.html` - Página de inicio
- ✅ `frontend/dashboard.html` - Dashboard principal
- ✅ `frontend/registro.html` - Registro de usuarios
- ✅ `frontend/views/*.html` - Vistas de la aplicación

### Backend Laravel
- ✅ `backend/routes/api.php` - Rutas API definidas
- ✅ `backend/app/Models/Usuario.php` - Modelo principal de usuario
- ✅ `backend/app/Http/Controllers/*.php` - Controladores activos

---

## 📋 Recomendaciones

### 🗑️ Archivos a Eliminar
1. **Archivos JS vacíos:**
   - `frontend/js/calendario.js`
   - `frontend/js/comments.js`
   - `frontend/js/notifications.js`
   - `frontend/js/posts.js`
   - `frontend/js/search.js`
   - `frontend/js/utils.js`
   - `frontend/js/validation.js`

2. **Backend alternativo (si no se usa):**
   - Eliminar toda la carpeta `backendd/` si `backend/` es el backend principal

3. **Archivos duplicados:**
   - `backend/app/Models/User.php` (si se usa `Usuario.php`)
   - `backend/database/migrations/2025_11_10_215132_create_personal_access_tokens_table.php`

4. **Archivos de prueba:**
   - `frontend/test.html` (mover a carpeta de pruebas o eliminar)

### 🔧 Archivos a Corregir
1. **Renombrar:**
   - `deployment/setup_intrucciones.md` → `deployment/setup_instrucciones.md`

2. **Actualizar:**
   - `backend/README.md` - Agregar documentación del proyecto

3. **Verificar:**
   - Si `backendd/` se está usando, migrar código a `backend/`
   - Si no se usa, eliminar `backendd/`

### 📝 Archivos a Implementar (si se necesitan)
Si en el futuro se requiere modularizar el código JavaScript, se pueden crear:
- `frontend/js/comments.js` - Manejo de comentarios
- `frontend/js/posts.js` - Manejo de publicaciones
- `frontend/js/notifications.js` - Sistema de notificaciones
- `frontend/js/calendario.js` - Funcionalidad del calendario
- `frontend/js/search.js` - Búsqueda avanzada
- `frontend/js/utils.js` - Utilidades compartidas
- `frontend/js/validation.js` - Validación de formularios

---

## 📊 Resumen Estadístico

- **Total de archivos JS:** 10
  - ✅ En uso: 3 (api.js, auth.js, main.js)
  - ❌ Vacíos: 7 (calendario.js, comments.js, notifications.js, posts.js, search.js, utils.js, validation.js)

- **Backends:**
  - ✅ Backend Laravel (`backend/`): Completo y funcional
  - ⚠️ Backend alternativo (`backendd/`): Incompleto, posiblemente obsoleto

- **Archivos duplicados:** 2
  - User.php / Usuario.php
  - Migración de personal_access_tokens duplicada

- **Archivos de prueba:** 1
  - test.html

---

## 🔍 Análisis de Dependencias

### Frontend
- **Bootstrap 5.3.0** - Framework CSS
- **Font Awesome 6.4.0** - Iconos
- **AOS 2.3.1** - Animaciones al scroll
- **FullCalendar 6.1.8** - Calendario (en views/calendario.html)

### Backend
- **Laravel 12.0** - Framework PHP
- **Laravel Sanctum 4.2** - Autenticación API
- **PHP 8.2+** - Versión de PHP requerida

---

*Análisis generado el: $(Get-Date -Format "yyyy-MM-dd HH:mm:ss")*

