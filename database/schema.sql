-- =====================================================
-- BASE DE DATOS: FORO ACADÉMICO UPA
-- =====================================================
-- Schema completo con todas las tablas necesarias
-- Incluye datos de ejemplo para pruebas
-- =====================================================

SET SQL_MODE = "NO_AUTO_VALUE_ON_ZERO";
SET time_zone = "+00:00";

-- =====================================================
-- TABLA: usuarios
-- =====================================================
CREATE TABLE IF NOT EXISTS `usuarios` (
  `id` bigint(20) UNSIGNED NOT NULL AUTO_INCREMENT,
  `nombre` varchar(100) NOT NULL,
  `apellidos` varchar(100) NOT NULL,
  `email` varchar(255) NOT NULL,
  `password` varchar(255) NOT NULL,
  `rol` enum('estudiante','profesor','admin') NOT NULL DEFAULT 'estudiante',
  `avatar` varchar(255) DEFAULT NULL,
  `activo` tinyint(1) NOT NULL DEFAULT 1,
  `suspension_activa` tinyint(1) NOT NULL DEFAULT 0,
  `suspendido_hasta` datetime DEFAULT NULL,
  `suspension_motivo` text DEFAULT NULL,
  `remember_token` varchar(100) DEFAULT NULL,
  `created_at` timestamp NULL DEFAULT NULL,
  `updated_at` timestamp NULL DEFAULT NULL,
  PRIMARY KEY (`id`),
  UNIQUE KEY `usuarios_email_unique` (`email`),
  KEY `idx_usuarios_rol` (`rol`),
  KEY `idx_usuarios_activo` (`activo`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- =====================================================
-- TABLA: carreras
-- =====================================================
CREATE TABLE IF NOT EXISTS `carreras` (
  `id` bigint(20) UNSIGNED NOT NULL AUTO_INCREMENT,
  `nombre` varchar(255) NOT NULL,
  `codigo` varchar(50) NOT NULL,
  `descripcion` text DEFAULT NULL,
  `activo` tinyint(1) NOT NULL DEFAULT 1,
  `created_at` timestamp NULL DEFAULT NULL,
  `updated_at` timestamp NULL DEFAULT NULL,
  PRIMARY KEY (`id`),
  UNIQUE KEY `carreras_codigo_unique` (`codigo`),
  KEY `idx_carreras_activo` (`activo`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- =====================================================
-- TABLA: cuatrimestres
-- =====================================================
CREATE TABLE IF NOT EXISTS `cuatrimestres` (
  `id` bigint(20) UNSIGNED NOT NULL AUTO_INCREMENT,
  `numero` tinyint(4) NOT NULL,
  `carrera_id` bigint(20) UNSIGNED NOT NULL,
  `activo` tinyint(1) NOT NULL DEFAULT 1,
  `created_at` timestamp NULL DEFAULT NULL,
  `updated_at` timestamp NULL DEFAULT NULL,
  PRIMARY KEY (`id`),
  KEY `cuatrimestres_carrera_id_foreign` (`carrera_id`),
  CONSTRAINT `cuatrimestres_carrera_id_foreign` FOREIGN KEY (`carrera_id`) REFERENCES `carreras` (`id`) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- =====================================================
-- TABLA: estudiantes
-- =====================================================
CREATE TABLE IF NOT EXISTS `estudiantes` (
  `id` bigint(20) UNSIGNED NOT NULL AUTO_INCREMENT,
  `usuario_id` bigint(20) UNSIGNED NOT NULL,
  `matricula` varchar(50) NOT NULL,
  `carrera_id` bigint(20) UNSIGNED NOT NULL,
  `cuatrimestre_actual` tinyint(4) NOT NULL DEFAULT 1,
  `turno` enum('matutino','vespertino','nocturno') DEFAULT NULL,
  `created_at` timestamp NULL DEFAULT NULL,
  `updated_at` timestamp NULL DEFAULT NULL,
  PRIMARY KEY (`id`),
  UNIQUE KEY `estudiantes_usuario_id_unique` (`usuario_id`),
  UNIQUE KEY `estudiantes_matricula_unique` (`matricula`),
  KEY `estudiantes_carrera_id_foreign` (`carrera_id`),
  CONSTRAINT `estudiantes_usuario_id_foreign` FOREIGN KEY (`usuario_id`) REFERENCES `usuarios` (`id`) ON DELETE CASCADE,
  CONSTRAINT `estudiantes_carrera_id_foreign` FOREIGN KEY (`carrera_id`) REFERENCES `carreras` (`id`) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- =====================================================
-- TABLA: profesores
-- =====================================================
CREATE TABLE IF NOT EXISTS `profesores` (
  `id` bigint(20) UNSIGNED NOT NULL AUTO_INCREMENT,
  `usuario_id` bigint(20) UNSIGNED NOT NULL,
  `num_empleado` varchar(50) NOT NULL,
  `especialidad` varchar(255) DEFAULT NULL,
  `activo` tinyint(1) NOT NULL DEFAULT 1,
  `created_at` timestamp NULL DEFAULT NULL,
  `updated_at` timestamp NULL DEFAULT NULL,
  PRIMARY KEY (`id`),
  UNIQUE KEY `profesores_usuario_id_unique` (`usuario_id`),
  UNIQUE KEY `profesores_num_empleado_unique` (`num_empleado`),
  CONSTRAINT `profesores_usuario_id_foreign` FOREIGN KEY (`usuario_id`) REFERENCES `usuarios` (`id`) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- =====================================================
-- TABLA: materias
-- =====================================================
CREATE TABLE IF NOT EXISTS `materias` (
  `id` bigint(20) UNSIGNED NOT NULL AUTO_INCREMENT,
  `nombre` varchar(255) NOT NULL,
  `codigo` varchar(50) NOT NULL,
  `descripcion` text DEFAULT NULL,
  `cuatrimestre_id` bigint(20) UNSIGNED NOT NULL,
  `profesor_id` bigint(20) UNSIGNED DEFAULT NULL,
  `activo` tinyint(1) NOT NULL DEFAULT 1,
  `created_at` timestamp NULL DEFAULT NULL,
  `updated_at` timestamp NULL DEFAULT NULL,
  PRIMARY KEY (`id`),
  UNIQUE KEY `materias_codigo_unique` (`codigo`),
  KEY `materias_cuatrimestre_id_foreign` (`cuatrimestre_id`),
  KEY `materias_profesor_id_foreign` (`profesor_id`),
  CONSTRAINT `materias_cuatrimestre_id_foreign` FOREIGN KEY (`cuatrimestre_id`) REFERENCES `cuatrimestres` (`id`) ON DELETE CASCADE,
  CONSTRAINT `materias_profesor_id_foreign` FOREIGN KEY (`profesor_id`) REFERENCES `profesores` (`id`) ON DELETE SET NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- =====================================================
-- TABLA: publicaciones
-- =====================================================
CREATE TABLE IF NOT EXISTS `publicaciones` (
  `id` bigint(20) UNSIGNED NOT NULL AUTO_INCREMENT,
  `titulo` varchar(255) NOT NULL,
  `contenido` text NOT NULL,
  `categoria` enum('duda','recurso','aviso','discusion') NOT NULL DEFAULT 'discusion',
  `materia_id` bigint(20) UNSIGNED NOT NULL,
  `autor_id` bigint(20) UNSIGNED NOT NULL,
  `etiquetas` varchar(500) DEFAULT NULL,
  `vistas` int(11) NOT NULL DEFAULT 0,
  `num_comentarios` int(11) NOT NULL DEFAULT 0,
  `num_likes` int(11) NOT NULL DEFAULT 0,
  `fijado` tinyint(1) NOT NULL DEFAULT 0,
  `activo` tinyint(1) NOT NULL DEFAULT 1,
  `created_at` timestamp NULL DEFAULT NULL,
  `updated_at` timestamp NULL DEFAULT NULL,
  PRIMARY KEY (`id`),
  KEY `publicaciones_materia_id_foreign` (`materia_id`),
  KEY `publicaciones_autor_id_foreign` (`autor_id`),
  KEY `idx_publicaciones_categoria` (`categoria`),
  KEY `idx_publicaciones_fijado` (`fijado`),
  KEY `idx_publicaciones_activo` (`activo`),
  FULLTEXT KEY `idx_publicaciones_busqueda` (`titulo`,`contenido`),
  CONSTRAINT `publicaciones_autor_id_foreign` FOREIGN KEY (`autor_id`) REFERENCES `usuarios` (`id`) ON DELETE CASCADE,
  CONSTRAINT `publicaciones_materia_id_foreign` FOREIGN KEY (`materia_id`) REFERENCES `materias` (`id`) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- =====================================================
-- TABLA: comentarios
-- =====================================================
CREATE TABLE IF NOT EXISTS `comentarios` (
  `id` bigint(20) UNSIGNED NOT NULL AUTO_INCREMENT,
  `contenido` text NOT NULL,
  `publicacion_id` bigint(20) UNSIGNED NOT NULL,
  `autor_id` bigint(20) UNSIGNED NOT NULL,
  `comentario_padre_id` bigint(20) UNSIGNED DEFAULT NULL,
  `num_likes` int(11) NOT NULL DEFAULT 0,
  `es_respuesta_util` tinyint(1) NOT NULL DEFAULT 0,
  `activo` tinyint(1) NOT NULL DEFAULT 1,
  `created_at` timestamp NULL DEFAULT NULL,
  `updated_at` timestamp NULL DEFAULT NULL,
  PRIMARY KEY (`id`),
  KEY `comentarios_publicacion_id_foreign` (`publicacion_id`),
  KEY `comentarios_autor_id_foreign` (`autor_id`),
  KEY `comentarios_comentario_padre_id_foreign` (`comentario_padre_id`),
  KEY `idx_comentarios_activo` (`activo`),
  FULLTEXT KEY `idx_comentarios_busqueda` (`contenido`),
  CONSTRAINT `comentarios_autor_id_foreign` FOREIGN KEY (`autor_id`) REFERENCES `usuarios` (`id`) ON DELETE CASCADE,
  CONSTRAINT `comentarios_comentario_padre_id_foreign` FOREIGN KEY (`comentario_padre_id`) REFERENCES `comentarios` (`id`) ON DELETE CASCADE,
  CONSTRAINT `comentarios_publicacion_id_foreign` FOREIGN KEY (`publicacion_id`) REFERENCES `publicaciones` (`id`) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- =====================================================
-- TABLA: eventos_calendario
-- =====================================================
CREATE TABLE IF NOT EXISTS `eventos_calendario` (
  `id` bigint(20) UNSIGNED NOT NULL AUTO_INCREMENT,
  `titulo` varchar(255) NOT NULL,
  `descripcion` text DEFAULT NULL,
  `tipo` enum('evento','examen','tarea','aviso') NOT NULL DEFAULT 'evento',
  `materia_id` bigint(20) UNSIGNED DEFAULT NULL,
  `fecha_inicio` datetime NOT NULL,
  `fecha_fin` datetime DEFAULT NULL,
  `todo_el_dia` tinyint(1) NOT NULL DEFAULT 0,
  `creador_id` bigint(20) UNSIGNED NOT NULL,
  `recordatorio` tinyint(1) NOT NULL DEFAULT 0,
  `created_at` timestamp NULL DEFAULT NULL,
  `updated_at` timestamp NULL DEFAULT NULL,
  PRIMARY KEY (`id`),
  KEY `eventos_calendario_materia_id_foreign` (`materia_id`),
  KEY `eventos_calendario_creador_id_foreign` (`creador_id`),
  KEY `idx_eventos_fecha_inicio` (`fecha_inicio`),
  CONSTRAINT `eventos_calendario_creador_id_foreign` FOREIGN KEY (`creador_id`) REFERENCES `usuarios` (`id`) ON DELETE CASCADE,
  CONSTRAINT `eventos_calendario_materia_id_foreign` FOREIGN KEY (`materia_id`) REFERENCES `materias` (`id`) ON DELETE SET NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- =====================================================
-- TABLA: notificaciones
-- =====================================================
CREATE TABLE IF NOT EXISTS `notificaciones` (
  `id` bigint(20) UNSIGNED NOT NULL AUTO_INCREMENT,
  `usuario_id` bigint(20) UNSIGNED NOT NULL,
  `tipo` varchar(50) NOT NULL,
  `titulo` varchar(255) NOT NULL,
  `mensaje` text NOT NULL,
  `link` varchar(500) DEFAULT NULL,
  `leida` tinyint(1) NOT NULL DEFAULT 0,
  `data` json DEFAULT NULL,
  `created_at` timestamp NULL DEFAULT NULL,
  PRIMARY KEY (`id`),
  KEY `notificaciones_usuario_id_foreign` (`usuario_id`),
  KEY `idx_notificaciones_leida` (`leida`),
  KEY `idx_notificaciones_created_at` (`created_at`),
  CONSTRAINT `notificaciones_usuario_id_foreign` FOREIGN KEY (`usuario_id`) REFERENCES `usuarios` (`id`) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- =====================================================
-- TABLA: reportes
-- =====================================================
CREATE TABLE IF NOT EXISTS `reportes` (
  `id` bigint(20) UNSIGNED NOT NULL AUTO_INCREMENT,
  `publicacion_id` bigint(20) UNSIGNED DEFAULT NULL,
  `comentario_id` bigint(20) UNSIGNED DEFAULT NULL,
  `reportado_por` bigint(20) UNSIGNED NOT NULL,
  `motivo` varchar(100) NOT NULL,
  `descripcion` text DEFAULT NULL,
  `estado` enum('pendiente','en_revision','resuelto','descartado') NOT NULL DEFAULT 'pendiente',
  `prioridad` enum('baja','media','alta','urgente') NOT NULL DEFAULT 'media',
  `resuelto_por` bigint(20) UNSIGNED DEFAULT NULL,
  `accion_tomada` text DEFAULT NULL,
  `created_at` timestamp NULL DEFAULT NULL,
  `updated_at` timestamp NULL DEFAULT NULL,
  PRIMARY KEY (`id`),
  KEY `reportes_publicacion_id_foreign` (`publicacion_id`),
  KEY `reportes_comentario_id_foreign` (`comentario_id`),
  KEY `reportes_reportado_por_foreign` (`reportado_por`),
  KEY `reportes_resuelto_por_foreign` (`resuelto_por`),
  KEY `idx_reportes_estado` (`estado`),
  CONSTRAINT `reportes_comentario_id_foreign` FOREIGN KEY (`comentario_id`) REFERENCES `comentarios` (`id`) ON DELETE CASCADE,
  CONSTRAINT `reportes_publicacion_id_foreign` FOREIGN KEY (`publicacion_id`) REFERENCES `publicaciones` (`id`) ON DELETE CASCADE,
  CONSTRAINT `reportes_reportado_por_foreign` FOREIGN KEY (`reportado_por`) REFERENCES `usuarios` (`id`) ON DELETE CASCADE,
  CONSTRAINT `reportes_resuelto_por_foreign` FOREIGN KEY (`resuelto_por`) REFERENCES `usuarios` (`id`) ON DELETE SET NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- =====================================================
-- TABLA: historial_moderacion
-- =====================================================
CREATE TABLE IF NOT EXISTS `historial_moderacion` (
  `id` bigint(20) UNSIGNED NOT NULL AUTO_INCREMENT,
  `moderador_id` bigint(20) UNSIGNED NOT NULL,
  `usuario_afectado_id` bigint(20) UNSIGNED DEFAULT NULL,
  `accion` enum('advertencia','suspension','ban','eliminacion') NOT NULL,
  `contenido_tipo` enum('publicacion','comentario','usuario','general') DEFAULT NULL,
  `contenido_id` bigint(20) UNSIGNED DEFAULT NULL,
  `motivo` text NOT NULL,
  `created_at` timestamp NULL DEFAULT NULL,
  PRIMARY KEY (`id`),
  KEY `historial_moderacion_moderador_id_foreign` (`moderador_id`),
  KEY `historial_moderacion_usuario_afectado_id_foreign` (`usuario_afectado_id`),
  CONSTRAINT `historial_moderacion_moderador_id_foreign` FOREIGN KEY (`moderador_id`) REFERENCES `usuarios` (`id`) ON DELETE CASCADE,
  CONSTRAINT `historial_moderacion_usuario_afectado_id_foreign` FOREIGN KEY (`usuario_afectado_id`) REFERENCES `usuarios` (`id`) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- =====================================================
-- TABLA PIVOT: likes_publicaciones
-- =====================================================
CREATE TABLE IF NOT EXISTS `likes_publicaciones` (
  `publicacion_id` bigint(20) UNSIGNED NOT NULL,
  `usuario_id` bigint(20) UNSIGNED NOT NULL,
  `created_at` timestamp NULL DEFAULT NULL,
  PRIMARY KEY (`publicacion_id`,`usuario_id`),
  KEY `likes_publicaciones_usuario_id_foreign` (`usuario_id`),
  CONSTRAINT `likes_publicaciones_publicacion_id_foreign` FOREIGN KEY (`publicacion_id`) REFERENCES `publicaciones` (`id`) ON DELETE CASCADE,
  CONSTRAINT `likes_publicaciones_usuario_id_foreign` FOREIGN KEY (`usuario_id`) REFERENCES `usuarios` (`id`) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- =====================================================
-- TABLA PIVOT: likes_comentarios
-- =====================================================
CREATE TABLE IF NOT EXISTS `likes_comentarios` (
  `comentario_id` bigint(20) UNSIGNED NOT NULL,
  `usuario_id` bigint(20) UNSIGNED NOT NULL,
  `created_at` timestamp NULL DEFAULT NULL,
  PRIMARY KEY (`comentario_id`,`usuario_id`),
  KEY `likes_comentarios_usuario_id_foreign` (`usuario_id`),
  CONSTRAINT `likes_comentarios_comentario_id_foreign` FOREIGN KEY (`comentario_id`) REFERENCES `comentarios` (`id`) ON DELETE CASCADE,
  CONSTRAINT `likes_comentarios_usuario_id_foreign` FOREIGN KEY (`usuario_id`) REFERENCES `usuarios` (`id`) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- =====================================================
-- TABLA PIVOT: guardados
-- =====================================================
CREATE TABLE IF NOT EXISTS `guardados` (
  `publicacion_id` bigint(20) UNSIGNED NOT NULL,
  `usuario_id` bigint(20) UNSIGNED NOT NULL,
  `created_at` timestamp NULL DEFAULT NULL,
  PRIMARY KEY (`publicacion_id`,`usuario_id`),
  KEY `guardados_usuario_id_foreign` (`usuario_id`),
  CONSTRAINT `guardados_publicacion_id_foreign` FOREIGN KEY (`publicacion_id`) REFERENCES `publicaciones` (`id`) ON DELETE CASCADE,
  CONSTRAINT `guardados_usuario_id_foreign` FOREIGN KEY (`usuario_id`) REFERENCES `usuarios` (`id`) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- =====================================================
-- TABLA PIVOT: inscripciones
-- =====================================================
CREATE TABLE IF NOT EXISTS `inscripciones` (
  `materia_id` bigint(20) UNSIGNED NOT NULL,
  `estudiante_id` bigint(20) UNSIGNED NOT NULL,
  `created_at` timestamp NULL DEFAULT NULL,
  PRIMARY KEY (`materia_id`,`estudiante_id`),
  KEY `inscripciones_estudiante_id_foreign` (`estudiante_id`),
  CONSTRAINT `inscripciones_estudiante_id_foreign` FOREIGN KEY (`estudiante_id`) REFERENCES `estudiantes` (`id`) ON DELETE CASCADE,
  CONSTRAINT `inscripciones_materia_id_foreign` FOREIGN KEY (`materia_id`) REFERENCES `materias` (`id`) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- =====================================================
-- TABLAS LARAVEL (Sanctum, Cache, Jobs, etc.)
-- =====================================================

-- Personal Access Tokens (Laravel Sanctum)
CREATE TABLE IF NOT EXISTS `personal_access_tokens` (
  `id` bigint(20) UNSIGNED NOT NULL AUTO_INCREMENT,
  `tokenable_type` varchar(255) NOT NULL,
  `tokenable_id` bigint(20) UNSIGNED NOT NULL,
  `name` varchar(255) NOT NULL,
  `token` varchar(64) NOT NULL,
  `abilities` text DEFAULT NULL,
  `last_used_at` timestamp NULL DEFAULT NULL,
  `expires_at` timestamp NULL DEFAULT NULL,
  `created_at` timestamp NULL DEFAULT NULL,
  `updated_at` timestamp NULL DEFAULT NULL,
  PRIMARY KEY (`id`),
  UNIQUE KEY `personal_access_tokens_token_unique` (`token`),
  KEY `personal_access_tokens_tokenable_type_tokenable_id_index` (`tokenable_type`,`tokenable_id`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- Cache
CREATE TABLE IF NOT EXISTS `cache` (
  `key` varchar(255) NOT NULL,
  `value` mediumtext NOT NULL,
  `expiration` int(11) NOT NULL,
  PRIMARY KEY (`key`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- Cache Locks
CREATE TABLE IF NOT EXISTS `cache_locks` (
  `key` varchar(255) NOT NULL,
  `owner` varchar(255) NOT NULL,
  `expiration` int(11) NOT NULL,
  PRIMARY KEY (`key`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- Jobs
CREATE TABLE IF NOT EXISTS `jobs` (
  `id` bigint(20) UNSIGNED NOT NULL AUTO_INCREMENT,
  `queue` varchar(255) NOT NULL,
  `payload` longtext NOT NULL,
  `attempts` tinyint(3) UNSIGNED NOT NULL,
  `reserved_at` int(10) UNSIGNED DEFAULT NULL,
  `available_at` int(10) UNSIGNED NOT NULL,
  `created_at` int(10) UNSIGNED NOT NULL,
  PRIMARY KEY (`id`),
  KEY `jobs_queue_index` (`queue`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- Job Batches
CREATE TABLE IF NOT EXISTS `job_batches` (
  `id` varchar(255) NOT NULL,
  `name` varchar(255) NOT NULL,
  `total_jobs` int(11) NOT NULL,
  `pending_jobs` int(11) NOT NULL,
  `failed_jobs` int(11) NOT NULL,
  `failed_job_ids` longtext NOT NULL,
  `options` mediumtext DEFAULT NULL,
  `cancelled_at` int(11) DEFAULT NULL,
  `created_at` int(11) NOT NULL,
  `finished_at` int(11) DEFAULT NULL,
  PRIMARY KEY (`id`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- Failed Jobs
CREATE TABLE IF NOT EXISTS `failed_jobs` (
  `id` bigint(20) UNSIGNED NOT NULL AUTO_INCREMENT,
  `uuid` varchar(255) NOT NULL,
  `connection` text NOT NULL,
  `queue` text NOT NULL,
  `payload` longtext NOT NULL,
  `exception` longtext NOT NULL,
  `failed_at` timestamp NOT NULL DEFAULT CURRENT_TIMESTAMP,
  PRIMARY KEY (`id`),
  UNIQUE KEY `failed_jobs_uuid_unique` (`uuid`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- Password Reset Tokens
CREATE TABLE IF NOT EXISTS `password_reset_tokens` (
  `email` varchar(255) NOT NULL,
  `token` varchar(255) NOT NULL,
  `created_at` timestamp NULL DEFAULT NULL,
  PRIMARY KEY (`email`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- Sessions
CREATE TABLE IF NOT EXISTS `sessions` (
  `id` varchar(255) NOT NULL,
  `user_id` bigint(20) UNSIGNED DEFAULT NULL,
  `ip_address` varchar(45) DEFAULT NULL,
  `user_agent` text DEFAULT NULL,
  `payload` longtext NOT NULL,
  `last_activity` int(11) NOT NULL,
  PRIMARY KEY (`id`),
  KEY `sessions_user_id_index` (`user_id`),
  KEY `sessions_last_activity_index` (`last_activity`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- Migrations
CREATE TABLE IF NOT EXISTS `migrations` (
  `id` int(10) UNSIGNED NOT NULL AUTO_INCREMENT,
  `migration` varchar(255) NOT NULL,
  `batch` int(11) NOT NULL,
  PRIMARY KEY (`id`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- =====================================================
-- DATOS DE EJEMPLO
-- =====================================================

-- Contraseñas hasheadas con bcrypt (password: 'password123' para todos)
-- La contraseña es: password123

-- Insertar carreras
INSERT INTO `carreras` (`id`, `nombre`, `codigo`, `descripcion`, `activo`, `created_at`, `updated_at`) VALUES
(1, 'Ingeniería en Sistemas Computacionales', 'ISC', 'Carrera enfocada en desarrollo de software y sistemas', 1, NOW(), NOW()),
(2, 'Licenciatura en Administración', 'LAD', 'Carrera de gestión empresarial y administración', 1, NOW(), NOW()),
(3, 'Ingeniería Industrial', 'II', 'Carrera de optimización de procesos industriales', 1, NOW(), NOW());

-- Insertar cuatrimestres
INSERT INTO `cuatrimestres` (`id`, `numero`, `carrera_id`, `activo`, `created_at`, `updated_at`) VALUES
(1, 1, 1, 1, NOW(), NOW()),
(2, 2, 1, 1, NOW(), NOW()),
(3, 3, 1, 1, NOW(), NOW()),
(4, 4, 1, 1, NOW(), NOW()),
(5, 5, 1, 1, NOW(), NOW()),
(6, 6, 1, 1, NOW(), NOW()),
(7, 1, 2, 1, NOW(), NOW()),
(8, 2, 2, 1, NOW(), NOW()),
(9, 1, 3, 1, NOW(), NOW());

-- Insertar usuarios (contraseña: password123)
INSERT INTO `usuarios` (`id`, `nombre`, `apellidos`, `email`, `password`, `rol`, `avatar`, `activo`, `suspension_activa`, `suspendido_hasta`, `suspension_motivo`, `remember_token`, `created_at`, `updated_at`) VALUES
-- Admin
(1, 'Admin', 'Sistema', 'admin@upatlacomulco.edu.mx', '$2y$12$LQv3c1yqBWVHxkd0LHAkCOYz6TtxMQJqhN8/LewY5wJqKLZK5j0qO', 'admin', NULL, 1, 0, NULL, NULL, NULL, NOW(), NOW()),

-- Profesores
(2, 'María', 'González Pérez', 'maria.gonzalez@upatlacomulco.edu.mx', '$2y$12$LQv3c1yqBWVHxkd0LHAkCOYz6TtxMQJqhN8/LewY5wJqKLZK5j0qO', 'profesor', NULL, 1, 0, NULL, NULL, NULL, NOW(), NOW()),
(3, 'Juan', 'Rodríguez Martínez', 'juan.rodriguez@upatlacomulco.edu.mx', '$2y$12$LQv3c1yqBWVHxkd0LHAkCOYz6TtxMQJqhN8/LewY5wJqKLZK5j0qO', 'profesor', NULL, 1, 0, NULL, NULL, NULL, NOW(), NOW()),
(4, 'Carmen', 'López Hernández', 'carmen.lopez@upatlacomulco.edu.mx', '$2y$12$LQv3c1yqBWVHxkd0LHAkCOYz6TtxMQJqhN8/LewY5wJqKLZK5j0qO', 'profesor', NULL, 1, 0, NULL, NULL, NULL, NOW(), NOW()),

-- Estudiantes
(5, 'Pedro', 'Sánchez García', 'pedro.sanchez@upatlacomulco.edu.mx', '$2y$12$LQv3c1yqBWVHxkd0LHAkCOYz6TtxMQJqhN8/LewY5wJqKLZK5j0qO', 'estudiante', NULL, 1, 0, NULL, NULL, NULL, NOW(), NOW()),
(6, 'Ana', 'Martínez López', 'ana.martinez@upatlacomulco.edu.mx', '$2y$12$LQv3c1yqBWVHxkd0LHAkCOYz6TtxMQJqhN8/LewY5wJqKLZK5j0qO', 'estudiante', NULL, 1, 0, NULL, NULL, NULL, NOW(), NOW()),
(7, 'Luis', 'Hernández Torres', 'luis.hernandez@upatlacomulco.edu.mx', '$2y$12$LQv3c1yqBWVHxkd0LHAkCOYz6TtxMQJqhN8/LewY5wJqKLZK5j0qO', 'estudiante', NULL, 1, 0, NULL, NULL, NULL, NOW(), NOW()),
(8, 'Laura', 'Ramírez Díaz', 'laura.ramirez@upatlacomulco.edu.mx', '$2y$12$LQv3c1yqBWVHxkd0LHAkCOYz6TtxMQJqhN8/LewY5wJqKLZK5j0qO', 'estudiante', NULL, 1, 0, NULL, NULL, NULL, NOW(), NOW()),
(9, 'Carlos', 'Morales Vázquez', 'carlos.morales@upatlacomulco.edu.mx', '$2y$12$LQv3c1yqBWVHxkd0LHAkCOYz6TtxMQJqhN8/LewY5wJqKLZK5j0qO', 'estudiante', NULL, 1, 0, NULL, NULL, NULL, NOW(), NOW()),
(10, 'Sofía', 'Jiménez Ruiz', 'sofia.jimenez@upatlacomulco.edu.mx', '$2y$12$LQv3c1yqBWVHxkd0LHAkCOYz6TtxMQJqhN8/LewY5wJqKLZK5j0qO', 'estudiante', NULL, 1, 0, NULL, NULL, NULL, NOW(), NOW()),
(11, 'Diego', 'Castro Flores', 'diego.castro@upatlacomulco.edu.mx', '$2y$12$LQv3c1yqBWVHxkd0LHAkCOYz6TtxMQJqhN8/LewY5wJqKLZK5j0qO', 'estudiante', NULL, 1, 0, NULL, NULL, NULL, NOW(), NOW()),
(12, 'Elena', 'Rivera Méndez', 'elena.rivera@upatlacomulco.edu.mx', '$2y$12$LQv3c1yqBWVHxkd0LHAkCOYz6TtxMQJqhN8/LewY5wJqKLZK5j0qO', 'estudiante', NULL, 1, 0, NULL, NULL, NULL, NOW(), NOW());

-- Insertar profesores
INSERT INTO `profesores` (`id`, `usuario_id`, `num_empleado`, `especialidad`, `activo`, `created_at`, `updated_at`) VALUES
(1, 2, 'EMP001', 'Desarrollo de Software', 1, NOW(), NOW()),
(2, 3, 'EMP002', 'Base de Datos', 1, NOW(), NOW()),
(3, 4, 'EMP003', 'Redes y Seguridad', 1, NOW(), NOW());

-- Insertar estudiantes
INSERT INTO `estudiantes` (`id`, `usuario_id`, `matricula`, `carrera_id`, `cuatrimestre_actual`, `turno`, `created_at`, `updated_at`) VALUES
(1, 5, 'ISC2021001', 1, 3, 'matutino', NOW(), NOW()),
(2, 6, 'ISC2021002', 1, 4, 'vespertino', NOW(), NOW()),
(3, 7, 'ISC2021003', 1, 2, 'matutino', NOW(), NOW()),
(4, 8, 'LAD2021001', 2, 2, 'matutino', NOW(), NOW()),
(5, 9, 'ISC2021004', 1, 5, 'vespertino', NOW(), NOW()),
(6, 10, 'II2021001', 3, 1, 'nocturno', NOW(), NOW()),
(7, 11, 'ISC2021005', 1, 3, 'matutino', NOW(), NOW()),
(8, 12, 'LAD2021002', 2, 3, 'vespertino', NOW(), NOW());

-- Insertar materias
INSERT INTO `materias` (`id`, `nombre`, `codigo`, `descripcion`, `cuatrimestre_id`, `profesor_id`, `activo`, `created_at`, `updated_at`) VALUES
(1, 'Programación Orientada a Objetos', 'POO', 'Fundamentos de POO con Java y C++', 3, 1, 1, NOW(), NOW()),
(2, 'Base de Datos', 'BD', 'Diseño y administración de bases de datos relacionales', 4, 2, 1, NOW(), NOW()),
(3, 'Redes de Computadoras', 'RED', 'Protocolos de red y configuración de dispositivos', 5, 3, 1, NOW(), NOW()),
(4, 'Desarrollo Web', 'DW', 'HTML, CSS, JavaScript y frameworks modernos', 4, 1, 1, NOW(), NOW()),
(5, 'Fundamentos de Administración', 'FAD', 'Conceptos básicos de administración empresarial', 1, NULL, 1, NOW(), NOW()),
(6, 'Contabilidad General', 'CON', 'Principios de contabilidad financiera', 2, NULL, 1, NOW(), NOW());

-- Insertar inscripciones (estudiantes en materias)
INSERT INTO `inscripciones` (`materia_id`, `estudiante_id`, `created_at`) VALUES
-- Estudiante 1 (Pedro) - Cuatrimestre 3
(1, 1, NOW()),
-- Estudiante 2 (Ana) - Cuatrimestre 4
(2, 2, NOW()),
(4, 2, NOW()),
-- Estudiante 3 (Luis) - Cuatrimestre 2
-- Estudiante 4 (Laura) - Carrera LAD
(5, 4, NOW()),
(6, 4, NOW()),
-- Estudiante 5 (Carlos) - Cuatrimestre 5
(3, 5, NOW()),
-- Estudiante 7 (Diego) - Cuatrimestre 3
(1, 7, NOW());

-- Insertar publicaciones
INSERT INTO `publicaciones` (`id`, `titulo`, `contenido`, `categoria`, `materia_id`, `autor_id`, `etiquetas`, `vistas`, `num_comentarios`, `num_likes`, `fijado`, `activo`, `created_at`, `updated_at`) VALUES
(1, '¿Cómo implementar herencia en Java?', 'Estoy teniendo problemas para entender la herencia en Java. ¿Alguien me puede explicar con un ejemplo práctico?', 'duda', 1, 5, 'java,herencia,poo', 45, 3, 5, 0, 1, DATE_SUB(NOW(), INTERVAL 2 DAY), NOW()),
(2, 'Recursos útiles para aprender SQL', 'Comparto algunos recursos que me ayudaron mucho a aprender SQL: documentación oficial, ejercicios prácticos y videos.', 'recurso', 2, 6, 'sql,bases-de-datos,recursos', 78, 8, 12, 1, 1, DATE_SUB(NOW(), INTERVAL 1 DAY), NOW()),
(3, 'Aviso: Cambio de horario de clase', 'Se informa que la clase del viernes se realizará a las 10:00 AM en lugar de las 8:00 AM.', 'aviso', 1, 2, 'horario,aviso', 120, 2, 0, 1, 1, DATE_SUB(NOW(), INTERVAL 5 DAY), NOW()),
(4, 'Discusión sobre frameworks JavaScript', '¿Cuál es mejor para proyectos grandes: React, Vue o Angular? Compartan sus experiencias.', 'discusion', 4, 7, 'javascript,react,vue,angular', 92, 15, 8, 0, 1, DATE_SUB(NOW(), INTERVAL 3 DAY), NOW()),
(5, 'Duda sobre normalización de bases de datos', 'No entiendo bien las formas normales. ¿Alguien puede explicar la tercera forma normal con un ejemplo?', 'duda', 2, 8, 'bases-de-datos,normalizacion', 56, 7, 4, 0, 1, DATE_SUB(NOW(), INTERVAL 4 DAY), NOW()),
(6, 'Guía rápida de comandos de red', 'Comparto una lista de comandos útiles para configurar redes: ping, ipconfig, netstat, etc.', 'recurso', 3, 9, 'redes,comandos,guia', 34, 2, 3, 0, 1, DATE_SUB(NOW(), INTERVAL 6 DAY), NOW()),
(7, 'Mejores prácticas en desarrollo web', 'Hablemos sobre las mejores prácticas actuales en desarrollo web: código limpio, seguridad, performance.', 'discusion', 4, 10, 'desarrollo-web,buenas-practicas', 67, 9, 6, 0, 1, DATE_SUB(NOW(), INTERVAL 1 DAY), NOW()),
(8, 'Problema con conexión a base de datos', 'Mi aplicación no se conecta a la base de datos. ¿Qué puedo verificar? Ya revisé el usuario y contraseña.', 'duda', 2, 11, 'mysql,conexion,problemas', 41, 5, 2, 0, 1, DATE_SUB(NOW(), INTERVAL 2 DAY), NOW());

-- Insertar comentarios
INSERT INTO `comentarios` (`id`, `contenido`, `publicacion_id`, `autor_id`, `comentario_padre_id`, `num_likes`, `es_respuesta_util`, `activo`, `created_at`, `updated_at`) VALUES
(1, 'La herencia en Java te permite crear una clase basada en otra. Por ejemplo, si tienes una clase Vehículo, puedes crear Auto que herede de ella.', 1, 3, NULL, 3, 1, 1, DATE_SUB(NOW(), INTERVAL 1 DAY), NOW()),
(2, 'Gracias por la explicación, me ayudó mucho.', 1, 5, 1, 0, 0, 1, DATE_SUB(NOW(), INTERVAL 22 HOUR), NOW()),
(3, 'Aquí tienes un ejemplo práctico: class Vehículo { ... } class Auto extends Vehículo { ... }', 1, 6, NULL, 2, 1, 1, DATE_SUB(NOW(), INTERVAL 20 HOUR), NOW()),
(4, 'Excelente recurso, gracias por compartir. Yo agregaría también SQLBolt para prácticas interactivas.', 2, 7, NULL, 5, 1, 1, DATE_SUB(NOW(), INTERVAL 20 HOUR), NOW()),
(5, 'Estoy de acuerdo, SQLBolt es muy bueno para principiantes.', 2, 8, 4, 2, 0, 1, DATE_SUB(NOW(), INTERVAL 18 HOUR), NOW()),
(6, 'Entendido, gracias por el aviso.', 3, 5, NULL, 0, 0, 1, DATE_SUB(NOW(), INTERVAL 5 DAY), NOW()),
(7, 'Ok, nos vemos el viernes a las 10:00 AM.', 3, 7, NULL, 0, 0, 1, DATE_SUB(NOW(), INTERVAL 5 DAY), NOW()),
(8, 'Yo prefiero React por su ecosistema y comunidad. Además, hay muchos recursos disponibles.', 4, 9, NULL, 4, 1, 1, DATE_SUB(NOW(), INTERVAL 2 DAY), NOW()),
(9, 'Vue es más fácil de aprender para principiantes, en mi opinión.', 4, 10, NULL, 3, 0, 1, DATE_SUB(NOW(), INTERVAL 2 DAY), NOW()),
(10, 'Angular es mejor para proyectos empresariales grandes por su estructura más estricta.', 4, 11, NULL, 2, 0, 1, DATE_SUB(NOW(), INTERVAL 1 DAY), NOW()),
(11, 'La tercera forma normal (3NF) requiere que no haya dependencias transitivas. Un ejemplo sería separar tabla de clientes y tabla de ciudades.', 5, 3, NULL, 6, 1, 1, DATE_SUB(NOW(), INTERVAL 3 DAY), NOW()),
(12, 'Gracias, ahora lo entiendo mejor. ¿Puedes dar un ejemplo más detallado?', 5, 8, 11, 0, 0, 1, DATE_SUB(NOW(), INTERVAL 3 DAY), NOW()),
(13, 'Verifica la configuración del host, puerto y firewall. También asegúrate de que el servicio MySQL esté corriendo.', 8, 3, NULL, 4, 1, 1, DATE_SUB(NOW(), INTERVAL 1 DAY), NOW());

-- Insertar likes en publicaciones
INSERT INTO `likes_publicaciones` (`publicacion_id`, `usuario_id`, `created_at`) VALUES
(1, 6, NOW()),
(1, 7, NOW()),
(1, 8, NOW()),
(1, 9, NOW()),
(1, 10, NOW()),
(2, 5, NOW()),
(2, 7, NOW()),
(2, 8, NOW()),
(2, 9, NOW()),
(2, 10, NOW()),
(2, 11, NOW()),
(2, 12, NOW()),
(4, 5, NOW()),
(4, 6, NOW()),
(4, 8, NOW()),
(4, 9, NOW()),
(4, 10, NOW()),
(5, 6, NOW()),
(5, 7, NOW()),
(5, 9, NOW()),
(5, 10, NOW()),
(7, 5, NOW()),
(7, 6, NOW()),
(7, 8, NOW()),
(7, 9, NOW()),
(7, 11, NOW()),
(7, 12, NOW());

-- Insertar likes en comentarios
INSERT INTO `likes_comentarios` (`comentario_id`, `usuario_id`, `created_at`) VALUES
(1, 6, NOW()),
(1, 7, NOW()),
(1, 8, NOW()),
(3, 5, NOW()),
(3, 7, NOW()),
(4, 8, NOW()),
(4, 9, NOW()),
(4, 10, NOW()),
(4, 11, NOW()),
(4, 12, NOW()),
(8, 5, NOW()),
(8, 6, NOW()),
(8, 7, NOW()),
(8, 10, NOW()),
(11, 5, NOW()),
(11, 6, NOW()),
(11, 7, NOW()),
(11, 9, NOW()),
(11, 10, NOW()),
(11, 12, NOW());

-- Insertar guardados
INSERT INTO `guardados` (`publicacion_id`, `usuario_id`, `created_at`) VALUES
(2, 5, NOW()),
(2, 7, NOW()),
(2, 9, NOW()),
(4, 6, NOW()),
(4, 8, NOW()),
(6, 7, NOW()),
(6, 10, NOW()),
(7, 5, NOW()),
(7, 8, NOW());

-- Actualizar contadores de publicaciones
UPDATE `publicaciones` SET `num_likes` = (SELECT COUNT(*) FROM `likes_publicaciones` WHERE `likes_publicaciones`.`publicacion_id` = `publicaciones`.`id`);
UPDATE `publicaciones` SET `num_comentarios` = (SELECT COUNT(*) FROM `comentarios` WHERE `comentarios`.`publicacion_id` = `publicaciones`.`id`);

-- Actualizar contadores de comentarios
UPDATE `comentarios` SET `num_likes` = (SELECT COUNT(*) FROM `likes_comentarios` WHERE `likes_comentarios`.`comentario_id` = `comentarios`.`id`);

-- Insertar eventos de calendario
INSERT INTO `eventos_calendario` (`id`, `titulo`, `descripcion`, `tipo`, `materia_id`, `fecha_inicio`, `fecha_fin`, `todo_el_dia`, `creador_id`, `recordatorio`, `created_at`, `updated_at`) VALUES
(1, 'Examen Parcial - POO', 'Examen de la primera unidad de Programación Orientada a Objetos', 'examen', 1, DATE_ADD(NOW(), INTERVAL 7 DAY), DATE_ADD(NOW(), INTERVAL 7 DAY), 0, 2, 1, NOW(), NOW()),
(2, 'Entrega de Proyecto - Base de Datos', 'Entrega del proyecto final de diseño de base de datos', 'tarea', 2, DATE_ADD(NOW(), INTERVAL 14 DAY), DATE_ADD(NOW(), INTERVAL 14 DAY), 1, 3, 1, NOW(), NOW()),
(3, 'Conferencia sobre Desarrollo Web', 'Conferencia sobre tendencias actuales en desarrollo web', 'evento', 4, DATE_ADD(NOW(), INTERVAL 10 DAY), DATE_ADD(NOW(), INTERVAL 10 DAY), 0, 1, 0, NOW(), NOW()),
(4, 'Taller de Redes', 'Taller práctico de configuración de redes', 'evento', 3, DATE_ADD(NOW(), INTERVAL 5 DAY), DATE_ADD(NOW(), INTERVAL 5 DAY), 0, 3, 1, NOW(), NOW());

-- Insertar notificaciones
INSERT INTO `notificaciones` (`id`, `usuario_id`, `tipo`, `titulo`, `mensaje`, `link`, `leida`, `data`, `created_at`) VALUES
(1, 5, 'like', 'Nuevo like en tu publicación', 'A Ana le gustó tu publicación sobre herencia en Java', '/post?id=1', 0, '{"publicacion_id":1}', DATE_SUB(NOW(), INTERVAL 1 HOUR)),
(2, 6, 'comentario', 'Nuevo comentario en tu publicación', 'Pedro comentó en tu publicación sobre recursos SQL', '/post?id=2', 0, '{"publicacion_id":2,"comentario_id":4}', DATE_SUB(NOW(), INTERVAL 30 MINUTE)),
(3, 5, 'respuesta', 'Nueva respuesta a tu comentario', 'Ana respondió a tu comentario', '/post?id=1', 1, '{"publicacion_id":1,"comentario_id":2}', DATE_SUB(NOW(), INTERVAL 2 HOUR)),
(4, 7, 'like', 'Nuevo like en tu publicación', 'A 3 personas les gustó tu publicación sobre frameworks', '/post?id=4', 0, '{"publicacion_id":4}', DATE_SUB(NOW(), INTERVAL 15 MINUTE)),
(5, 8, 'respuesta_util', 'Tu respuesta fue marcada como útil', 'Tu respuesta sobre normalización fue marcada como útil', '/post?id=5', 0, '{"publicacion_id":5,"comentario_id":11}', DATE_SUB(NOW(), INTERVAL 3 HOUR));

-- Insertar reportes
INSERT INTO `reportes` (`id`, `publicacion_id`, `comentario_id`, `reportado_por`, `motivo`, `descripcion`, `estado`, `prioridad`, `resuelto_por`, `accion_tomada`, `created_at`, `updated_at`) VALUES
(1, NULL, NULL, 5, 'spam', 'Usuario publicando contenido no relacionado', 'pendiente', 'baja', NULL, NULL, DATE_SUB(NOW(), INTERVAL 1 DAY), NOW()),
(2, 4, NULL, 6, 'contenido_inadecuado', 'Contenido con lenguaje inapropiado', 'en_revision', 'media', NULL, NULL, DATE_SUB(NOW(), INTERVAL 12 HOUR), NOW()),
(3, NULL, 9, 8, 'spam', 'Comentario repetitivo sin sentido', 'resuelto', 'baja', 1, 'Comentario eliminado después de revisión', DATE_SUB(NOW(), INTERVAL 2 DAY), NOW());

-- Insertar historial de moderación
INSERT INTO `historial_moderacion` (`id`, `moderador_id`, `usuario_afectado_id`, `accion`, `contenido_tipo`, `contenido_id`, `motivo`, `created_at`) VALUES
(1, 1, NULL, 'advertencia', 'general', NULL, 'Aviso general: Recordar mantener un lenguaje respetuoso en todas las publicaciones', DATE_SUB(NOW(), INTERVAL 3 DAY)),
(2, 1, 7, 'advertencia', 'comentario', 9, 'Comentario eliminado por contenido inapropiado', DATE_SUB(NOW(), INTERVAL 2 DAY)),
(3, 1, 10, 'advertencia', 'publicacion', 7, 'Publicación editada para cumplir con las normas de la comunidad', DATE_SUB(NOW(), INTERVAL 1 DAY));

-- =====================================================
-- FIN DEL SCRIPT
-- =====================================================

