-- phpMyAdmin SQL Dump
-- version 5.2.1
-- https://www.phpmyadmin.net/
--
-- Servidor: 127.0.0.1
-- Tiempo de generación: 10-11-2025 a las 22:13:55
-- Versión del servidor: 10.4.32-MariaDB
-- Versión de PHP: 8.2.12

SET SQL_MODE = "NO_AUTO_VALUE_ON_ZERO";
START TRANSACTION;
SET time_zone = "+00:00";


/*!40101 SET @OLD_CHARACTER_SET_CLIENT=@@CHARACTER_SET_CLIENT */;
/*!40101 SET @OLD_CHARACTER_SET_RESULTS=@@CHARACTER_SET_RESULTS */;
/*!40101 SET @OLD_COLLATION_CONNECTION=@@COLLATION_CONNECTION */;
/*!40101 SET NAMES utf8mb4 */;

--
-- Base de datos: `foro_academico_upa`
--

-- --------------------------------------------------------

--
-- Estructura de tabla para la tabla `archivos`
--

CREATE TABLE `archivos` (
  `id` bigint(20) UNSIGNED NOT NULL,
  `publicacion_id` bigint(20) UNSIGNED DEFAULT NULL,
  `comentario_id` bigint(20) UNSIGNED DEFAULT NULL,
  `nombre_original` varchar(255) NOT NULL,
  `nombre_almacenado` varchar(255) NOT NULL,
  `ruta` varchar(500) NOT NULL,
  `tipo_mime` varchar(100) NOT NULL,
  `tamano` int(10) UNSIGNED NOT NULL COMMENT 'En bytes',
  `descargas` int(10) UNSIGNED DEFAULT 0,
  `created_at` timestamp NOT NULL DEFAULT current_timestamp()
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

--
-- Volcado de datos para la tabla `archivos`
--

INSERT INTO `archivos` (`id`, `publicacion_id`, `comentario_id`, `nombre_original`, `nombre_almacenado`, `ruta`, `tipo_mime`, `tamano`, `descargas`, `created_at`) VALUES
(1, 2, NULL, 'Apuntes_BD_Completo.pdf', 'apuntes_bd_20250115_abc123.pdf', '/uploads/2025/01/apuntes_bd_20250115_abc123.pdf', 'application/pdf', 2457600, 0, '2025-10-24 02:42:40'),
(2, 6, NULL, 'proyecto_twitter_clone.zip', 'proyecto_twitter_20250116_def456.zip', '/uploads/2025/01/proyecto_twitter_20250116_def456.zip', 'application/zip', 5242880, 0, '2025-10-24 02:42:40'),
(3, 9, NULL, 'Tutorial_PacketTracer.pdf', 'tutorial_pt_20250117_ghi789.pdf', '/uploads/2025/01/tutorial_pt_20250117_ghi789.pdf', 'application/pdf', 1048576, 0, '2025-10-24 02:42:40');

-- --------------------------------------------------------

--
-- Estructura de tabla para la tabla `cache`
--

CREATE TABLE `cache` (
  `key` varchar(255) NOT NULL,
  `value` mediumtext NOT NULL,
  `expiration` int(11) NOT NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- --------------------------------------------------------

--
-- Estructura de tabla para la tabla `cache_locks`
--

CREATE TABLE `cache_locks` (
  `key` varchar(255) NOT NULL,
  `owner` varchar(255) NOT NULL,
  `expiration` int(11) NOT NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- --------------------------------------------------------

--
-- Estructura de tabla para la tabla `carreras`
--

CREATE TABLE `carreras` (
  `id` bigint(20) UNSIGNED NOT NULL,
  `nombre` varchar(255) NOT NULL,
  `codigo` varchar(10) NOT NULL,
  `descripcion` text DEFAULT NULL,
  `activo` tinyint(1) DEFAULT 1,
  `created_at` timestamp NOT NULL DEFAULT current_timestamp(),
  `updated_at` timestamp NOT NULL DEFAULT current_timestamp() ON UPDATE current_timestamp()
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

--
-- Volcado de datos para la tabla `carreras`
--

INSERT INTO `carreras` (`id`, `nombre`, `codigo`, `descripcion`, `activo`, `created_at`, `updated_at`) VALUES
(1, 'Ingeniería en Sistemas Computacionales', 'ISC', 'Desarrollo de software y soluciones tecnológicas', 1, '2025-10-24 02:41:51', '2025-10-24 02:41:51'),
(2, 'Ingeniería en Tecnologías de la Información', 'ITI', 'Administración de infraestructura TI y redes', 1, '2025-10-24 02:41:51', '2025-10-24 02:41:51'),
(3, 'Ingeniería Mecatrónica', 'IME', 'Automatización y sistemas robóticos', 1, '2025-10-24 02:41:51', '2025-10-24 02:41:51'),
(4, 'Ingeniería en Manufactura', 'IMA', 'Procesos industriales y optimización', 1, '2025-10-24 02:41:51', '2025-10-24 02:41:51');

-- --------------------------------------------------------

--
-- Estructura de tabla para la tabla `comentarios`
--

CREATE TABLE `comentarios` (
  `id` bigint(20) UNSIGNED NOT NULL,
  `publicacion_id` bigint(20) UNSIGNED NOT NULL,
  `autor_id` bigint(20) UNSIGNED NOT NULL,
  `comentario_padre_id` bigint(20) UNSIGNED DEFAULT NULL COMMENT 'Para comentarios anidados',
  `contenido` text NOT NULL,
  `num_likes` int(10) UNSIGNED DEFAULT 0,
  `es_respuesta_util` tinyint(1) DEFAULT 0 COMMENT 'Marcada por el autor original',
  `activo` tinyint(1) DEFAULT 1,
  `created_at` timestamp NOT NULL DEFAULT current_timestamp(),
  `updated_at` timestamp NOT NULL DEFAULT current_timestamp() ON UPDATE current_timestamp()
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

--
-- Volcado de datos para la tabla `comentarios`
--

INSERT INTO `comentarios` (`id`, `publicacion_id`, `autor_id`, `comentario_padre_id`, `contenido`, `num_likes`, `es_respuesta_util`, `activo`, `created_at`, `updated_at`) VALUES
(1, 1, 7, NULL, '¡Claro! Te puedo ayudar. El proceso de normalización a 3FN tiene 3 pasos principales: 1) Primera Forma Normal (1FN): Eliminar grupos repetitivos. 2) Segunda Forma Normal (2FN): Eliminar dependencias parciales. 3) Tercera Forma Normal (3FN): Eliminar dependencias transitivas. En tu caso, primero debes identificar la clave primaria. ¿Ya sabes cuál es?', 3, 0, 1, '2025-10-24 02:42:40', '2025-10-24 02:42:40'),
(2, 1, 6, 1, '¡Gracias María! Creo que la clave primaria sería id_estudiante, ¿verdad?', 0, 0, 1, '2025-10-24 02:42:40', '2025-10-24 02:42:40'),
(3, 1, 7, 2, 'Exacto! Ahora, identifica las dependencias. Por ejemplo, codigo_postal depende de ciudad, y ciudad de direccion. Esas son dependencias transitivas que debes eliminar.', 0, 0, 1, '2025-10-24 02:42:40', '2025-10-24 02:42:40'),
(4, 1, 2, NULL, 'Excelente pregunta Juan. María tiene razón. Para tu tabla, el proceso sería separar en múltiples tablas: Estudiante (id_estudiante, nombre, apellido, direccion, ciudad, codigo_postal), Curso (id_curso, nombre_curso, id_profesor), Profesor (id_profesor, nombre_profesor, departamento). Te recomiendo revisar el material que compartí en clase sobre dependencias funcionales.', 3, 0, 1, '2025-10-24 02:42:40', '2025-10-24 02:42:40'),
(5, 1, 6, 4, '¡Perfecto profesor! Ya me quedó mucho más claro. Voy a trabajar en mi diagrama y se lo muestro en asesoría.', 0, 0, 1, '2025-10-24 02:42:40', '2025-10-24 02:42:40'),
(6, 2, 6, NULL, '¡Increíble María! Justo lo que necesitaba para el examen. ¿Puedes compartir el PDF?', 0, 0, 1, '2025-10-24 02:42:40', '2025-10-24 02:42:40'),
(7, 2, 8, NULL, 'Excelente recurso. Los ejemplos están muy bien explicados. Gracias por compartir.', 0, 0, 1, '2025-10-24 02:42:40', '2025-10-24 02:42:40'),
(8, 2, 7, 6, 'Claro, el link está aquí: [enlace]. Son 52 páginas pero vale la pena leerlo todo.', 0, 0, 1, '2025-10-24 02:42:40', '2025-10-24 02:42:40'),
(9, 5, 7, NULL, 'Probablemente tu backend no tiene las cabeceras CORS correctas. Necesitas agregar: Access-Control-Allow-Origin: * en tu servidor. ¿Estás usando Express?', 2, 0, 1, '2025-10-24 02:42:40', '2025-10-24 02:42:40'),
(10, 5, 6, 9, 'Sí, uso Express. ¿Dónde pongo esa cabecera exactamente?', 0, 0, 1, '2025-10-24 02:42:40', '2025-10-24 02:42:40'),
(11, 5, 7, 10, 'Necesitas el middleware cors. Instala: npm install cors, y luego en tu app.js: const cors = require(\"cors\"); app.use(cors());', 0, 0, 1, '2025-10-24 02:42:40', '2025-10-24 02:42:40'),
(12, 8, 7, NULL, 'Un switch trabaja en la capa 2 (enlace de datos) y conecta dispositivos dentro de la misma red. Un router trabaja en capa 3 (red) y conecta diferentes redes entre sí. El switch usa direcciones MAC, el router usa direcciones IP.', 2, 0, 1, '2025-10-24 02:42:40', '2025-10-24 02:42:40'),
(13, 8, 4, NULL, 'Exacto María. Piénsalo así: el switch es como las calles dentro de una ciudad, el router es como las carreteras entre ciudades.', 0, 0, 1, '2025-10-24 02:42:40', '2025-10-24 02:42:40');

--
-- Disparadores `comentarios`
--
DELIMITER $$
CREATE TRIGGER `after_comentario_delete` AFTER DELETE ON `comentarios` FOR EACH ROW BEGIN
    UPDATE publicaciones 
    SET num_comentarios = GREATEST(0, num_comentarios - 1)
    WHERE id = OLD.publicacion_id;
END
$$
DELIMITER ;
DELIMITER $$
CREATE TRIGGER `after_comentario_insert` AFTER INSERT ON `comentarios` FOR EACH ROW BEGIN
    UPDATE publicaciones 
    SET num_comentarios = num_comentarios + 1 
    WHERE id = NEW.publicacion_id;
END
$$
DELIMITER ;

-- --------------------------------------------------------

--
-- Estructura de tabla para la tabla `cuatrimestres`
--

CREATE TABLE `cuatrimestres` (
  `id` bigint(20) UNSIGNED NOT NULL,
  `numero` tinyint(4) NOT NULL,
  `carrera_id` bigint(20) UNSIGNED NOT NULL,
  `activo` tinyint(1) DEFAULT 1,
  `created_at` timestamp NOT NULL DEFAULT current_timestamp(),
  `updated_at` timestamp NOT NULL DEFAULT current_timestamp() ON UPDATE current_timestamp()
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

--
-- Volcado de datos para la tabla `cuatrimestres`
--

INSERT INTO `cuatrimestres` (`id`, `numero`, `carrera_id`, `activo`, `created_at`, `updated_at`) VALUES
(1, 1, 1, 1, '2025-10-24 02:41:51', '2025-10-24 02:41:51'),
(2, 2, 1, 1, '2025-10-24 02:41:51', '2025-10-24 02:41:51'),
(3, 3, 1, 1, '2025-10-24 02:41:51', '2025-10-24 02:41:51'),
(4, 4, 1, 1, '2025-10-24 02:41:51', '2025-10-24 02:41:51'),
(5, 5, 1, 1, '2025-10-24 02:41:51', '2025-10-24 02:41:51'),
(6, 6, 1, 1, '2025-10-24 02:41:51', '2025-10-24 02:41:51'),
(7, 7, 1, 1, '2025-10-24 02:41:51', '2025-10-24 02:41:51'),
(8, 8, 1, 1, '2025-10-24 02:41:51', '2025-10-24 02:41:51'),
(9, 9, 1, 1, '2025-10-24 02:41:51', '2025-10-24 02:41:51'),
(10, 10, 1, 1, '2025-10-24 02:41:51', '2025-10-24 02:41:51'),
(11, 11, 1, 1, '2025-10-24 02:41:51', '2025-10-24 02:41:51'),
(12, 1, 2, 1, '2025-10-24 02:41:51', '2025-10-24 02:41:51'),
(13, 2, 2, 1, '2025-10-24 02:41:51', '2025-10-24 02:41:51'),
(14, 3, 2, 1, '2025-10-24 02:41:51', '2025-10-24 02:41:51'),
(15, 4, 2, 1, '2025-10-24 02:41:51', '2025-10-24 02:41:51'),
(16, 5, 2, 1, '2025-10-24 02:41:51', '2025-10-24 02:41:51'),
(17, 6, 2, 1, '2025-10-24 02:41:51', '2025-10-24 02:41:51'),
(18, 7, 2, 1, '2025-10-24 02:41:51', '2025-10-24 02:41:51'),
(19, 8, 2, 1, '2025-10-24 02:41:51', '2025-10-24 02:41:51'),
(20, 9, 2, 1, '2025-10-24 02:41:51', '2025-10-24 02:41:51'),
(21, 10, 2, 1, '2025-10-24 02:41:51', '2025-10-24 02:41:51'),
(22, 11, 2, 1, '2025-10-24 02:41:51', '2025-10-24 02:41:51'),
(23, 1, 3, 1, '2025-10-24 02:41:51', '2025-10-24 02:41:51'),
(24, 2, 3, 1, '2025-10-24 02:41:51', '2025-10-24 02:41:51'),
(25, 3, 3, 1, '2025-10-24 02:41:51', '2025-10-24 02:41:51'),
(26, 4, 3, 1, '2025-10-24 02:41:51', '2025-10-24 02:41:51'),
(27, 5, 3, 1, '2025-10-24 02:41:51', '2025-10-24 02:41:51'),
(28, 6, 3, 1, '2025-10-24 02:41:51', '2025-10-24 02:41:51'),
(29, 7, 3, 1, '2025-10-24 02:41:51', '2025-10-24 02:41:51'),
(30, 8, 3, 1, '2025-10-24 02:41:51', '2025-10-24 02:41:51'),
(31, 9, 3, 1, '2025-10-24 02:41:51', '2025-10-24 02:41:51'),
(32, 10, 3, 1, '2025-10-24 02:41:51', '2025-10-24 02:41:51'),
(33, 11, 3, 1, '2025-10-24 02:41:51', '2025-10-24 02:41:51'),
(34, 1, 4, 1, '2025-10-24 02:41:51', '2025-10-24 02:41:51'),
(35, 2, 4, 1, '2025-10-24 02:41:51', '2025-10-24 02:41:51'),
(36, 3, 4, 1, '2025-10-24 02:41:51', '2025-10-24 02:41:51'),
(37, 4, 4, 1, '2025-10-24 02:41:51', '2025-10-24 02:41:51'),
(38, 5, 4, 1, '2025-10-24 02:41:51', '2025-10-24 02:41:51'),
(39, 6, 4, 1, '2025-10-24 02:41:51', '2025-10-24 02:41:51'),
(40, 7, 4, 1, '2025-10-24 02:41:51', '2025-10-24 02:41:51'),
(41, 8, 4, 1, '2025-10-24 02:41:51', '2025-10-24 02:41:51'),
(42, 9, 4, 1, '2025-10-24 02:41:51', '2025-10-24 02:41:51'),
(43, 10, 4, 1, '2025-10-24 02:41:51', '2025-10-24 02:41:51'),
(44, 11, 4, 1, '2025-10-24 02:41:51', '2025-10-24 02:41:51');

-- --------------------------------------------------------

--
-- Estructura de tabla para la tabla `estudiantes`
--

CREATE TABLE `estudiantes` (
  `id` bigint(20) UNSIGNED NOT NULL,
  `usuario_id` bigint(20) UNSIGNED NOT NULL,
  `matricula` varchar(20) NOT NULL,
  `carrera_id` bigint(20) UNSIGNED NOT NULL,
  `cuatrimestre_actual` tinyint(4) NOT NULL,
  `turno` enum('matutino','vespertino') NOT NULL,
  `created_at` timestamp NOT NULL DEFAULT current_timestamp(),
  `updated_at` timestamp NOT NULL DEFAULT current_timestamp() ON UPDATE current_timestamp()
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

--
-- Volcado de datos para la tabla `estudiantes`
--

INSERT INTO `estudiantes` (`id`, `usuario_id`, `matricula`, `carrera_id`, `cuatrimestre_actual`, `turno`, `created_at`, `updated_at`) VALUES
(1, 6, '2021210001', 1, 7, 'matutino', '2025-10-24 02:42:18', '2025-10-24 02:42:18'),
(2, 7, '2021210002', 1, 7, 'vespertino', '2025-10-24 02:42:18', '2025-10-24 02:42:18'),
(3, 8, '2021210003', 1, 7, 'matutino', '2025-10-24 02:42:18', '2025-10-24 02:42:18'),
(4, 9, '2022210004', 2, 5, 'vespertino', '2025-10-24 02:42:18', '2025-10-24 02:42:18'),
(5, 10, '2023210005', 3, 3, 'matutino', '2025-10-24 02:42:18', '2025-10-24 02:42:18');

-- --------------------------------------------------------

--
-- Estructura de tabla para la tabla `eventos_calendario`
--

CREATE TABLE `eventos_calendario` (
  `id` bigint(20) UNSIGNED NOT NULL,
  `titulo` varchar(255) NOT NULL,
  `descripcion` text DEFAULT NULL,
  `categoria` enum('examen','entrega','clase','evento','otro') NOT NULL,
  `materia_id` bigint(20) UNSIGNED DEFAULT NULL,
  `fecha_inicio` datetime NOT NULL,
  `fecha_fin` datetime DEFAULT NULL,
  `todo_el_dia` tinyint(1) DEFAULT 0,
  `creador_id` bigint(20) UNSIGNED NOT NULL,
  `recordatorio` tinyint(1) DEFAULT 1,
  `created_at` timestamp NOT NULL DEFAULT current_timestamp(),
  `updated_at` timestamp NOT NULL DEFAULT current_timestamp() ON UPDATE current_timestamp()
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

--
-- Volcado de datos para la tabla `eventos_calendario`
--

INSERT INTO `eventos_calendario` (`id`, `titulo`, `descripcion`, `categoria`, `materia_id`, `fecha_inicio`, `fecha_fin`, `todo_el_dia`, `creador_id`, `recordatorio`, `created_at`, `updated_at`) VALUES
(1, 'Examen Final - Bases de Datos', 'Examen final del cuatrimestre. Incluye normalización, SQL avanzado y transacciones.', 'examen', 1, '2025-10-17 10:00:00', '2025-10-17 12:00:00', 0, 2, 1, '2025-10-24 02:42:40', '2025-10-24 02:42:40'),
(2, 'Entrega Proyecto Web', 'Fecha límite para entregar el proyecto final de Programación Web', 'entrega', 2, '2025-10-18 23:59:00', '2025-10-18 23:59:00', 0, 3, 1, '2025-10-24 02:42:40', '2025-10-24 02:42:40'),
(3, 'Taller Git y GitHub', 'Taller práctico de control de versiones con Git', 'clase', 2, '2025-10-12 10:00:00', '2025-10-12 14:00:00', 0, 3, 1, '2025-10-24 02:42:40', '2025-10-24 02:42:40'),
(4, 'Examen Parcial - Redes', 'Evaluación de los temas 1 al 5', 'examen', 3, '2025-10-22 14:00:00', '2025-10-22 16:00:00', 0, 4, 1, '2025-10-24 02:42:40', '2025-10-24 02:42:40'),
(5, 'Inicio de Vacaciones', 'Periodo vacacional de octubre', 'evento', NULL, '2025-10-20 00:00:00', '2025-10-27 23:59:00', 0, 1, 1, '2025-10-24 02:42:40', '2025-10-24 02:42:40'),
(6, 'Asesoría Grupal BD', 'Asesoría para resolver dudas del proyecto final', 'clase', 1, '2025-10-14 16:00:00', '2025-10-14 18:00:00', 0, 2, 1, '2025-10-24 02:42:40', '2025-10-24 02:42:40');

-- --------------------------------------------------------

--
-- Estructura de tabla para la tabla `failed_jobs`
--

CREATE TABLE `failed_jobs` (
  `id` bigint(20) UNSIGNED NOT NULL,
  `uuid` varchar(255) NOT NULL,
  `connection` text NOT NULL,
  `queue` text NOT NULL,
  `payload` longtext NOT NULL,
  `exception` longtext NOT NULL,
  `failed_at` timestamp NOT NULL DEFAULT current_timestamp()
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- --------------------------------------------------------

--
-- Estructura de tabla para la tabla `guardados`
--

CREATE TABLE `guardados` (
  `id` bigint(20) UNSIGNED NOT NULL,
  `usuario_id` bigint(20) UNSIGNED NOT NULL,
  `publicacion_id` bigint(20) UNSIGNED NOT NULL,
  `created_at` timestamp NOT NULL DEFAULT current_timestamp()
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

--
-- Volcado de datos para la tabla `guardados`
--

INSERT INTO `guardados` (`id`, `usuario_id`, `publicacion_id`, `created_at`) VALUES
(1, 6, 2, '2025-10-24 02:42:40'),
(2, 6, 4, '2025-10-24 02:42:40'),
(3, 6, 9, '2025-10-24 02:42:40'),
(4, 7, 1, '2025-10-24 02:42:40'),
(5, 8, 2, '2025-10-24 02:42:40'),
(6, 8, 6, '2025-10-24 02:42:40');

-- --------------------------------------------------------

--
-- Estructura de tabla para la tabla `historial_moderacion`
--

CREATE TABLE `historial_moderacion` (
  `id` bigint(20) UNSIGNED NOT NULL,
  `moderador_id` bigint(20) UNSIGNED NOT NULL,
  `usuario_afectado_id` bigint(20) UNSIGNED NOT NULL,
  `accion` enum('advertencia','eliminacion_contenido','suspension','aprobacion') NOT NULL,
  `contenido_tipo` enum('publicacion','comentario') NOT NULL,
  `contenido_id` bigint(20) UNSIGNED NOT NULL,
  `motivo` text NOT NULL,
  `created_at` timestamp NOT NULL DEFAULT current_timestamp()
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- --------------------------------------------------------

--
-- Estructura de tabla para la tabla `inscripciones`
--

CREATE TABLE `inscripciones` (
  `id` bigint(20) UNSIGNED NOT NULL,
  `estudiante_id` bigint(20) UNSIGNED NOT NULL,
  `materia_id` bigint(20) UNSIGNED NOT NULL,
  `created_at` timestamp NOT NULL DEFAULT current_timestamp()
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

--
-- Volcado de datos para la tabla `inscripciones`
--

INSERT INTO `inscripciones` (`id`, `estudiante_id`, `materia_id`, `created_at`) VALUES
(1, 1, 1, '2025-10-24 02:42:18'),
(2, 1, 2, '2025-10-24 02:42:18'),
(3, 1, 3, '2025-10-24 02:42:18'),
(4, 1, 4, '2025-10-24 02:42:18'),
(5, 1, 5, '2025-10-24 02:42:18'),
(6, 2, 1, '2025-10-24 02:42:18'),
(7, 2, 2, '2025-10-24 02:42:18'),
(8, 2, 3, '2025-10-24 02:42:18'),
(9, 2, 4, '2025-10-24 02:42:18'),
(10, 2, 5, '2025-10-24 02:42:18'),
(11, 3, 1, '2025-10-24 02:42:18'),
(12, 3, 2, '2025-10-24 02:42:18'),
(13, 3, 3, '2025-10-24 02:42:18');

-- --------------------------------------------------------

--
-- Estructura de tabla para la tabla `jobs`
--

CREATE TABLE `jobs` (
  `id` bigint(20) UNSIGNED NOT NULL,
  `queue` varchar(255) NOT NULL,
  `payload` longtext NOT NULL,
  `attempts` tinyint(3) UNSIGNED NOT NULL,
  `reserved_at` int(10) UNSIGNED DEFAULT NULL,
  `available_at` int(10) UNSIGNED NOT NULL,
  `created_at` int(10) UNSIGNED NOT NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- --------------------------------------------------------

--
-- Estructura de tabla para la tabla `job_batches`
--

CREATE TABLE `job_batches` (
  `id` varchar(255) NOT NULL,
  `name` varchar(255) NOT NULL,
  `total_jobs` int(11) NOT NULL,
  `pending_jobs` int(11) NOT NULL,
  `failed_jobs` int(11) NOT NULL,
  `failed_job_ids` longtext NOT NULL,
  `options` mediumtext DEFAULT NULL,
  `cancelled_at` int(11) DEFAULT NULL,
  `created_at` int(11) NOT NULL,
  `finished_at` int(11) DEFAULT NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- --------------------------------------------------------

--
-- Estructura de tabla para la tabla `likes_comentarios`
--

CREATE TABLE `likes_comentarios` (
  `id` bigint(20) UNSIGNED NOT NULL,
  `comentario_id` bigint(20) UNSIGNED NOT NULL,
  `usuario_id` bigint(20) UNSIGNED NOT NULL,
  `created_at` timestamp NOT NULL DEFAULT current_timestamp()
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

--
-- Volcado de datos para la tabla `likes_comentarios`
--

INSERT INTO `likes_comentarios` (`id`, `comentario_id`, `usuario_id`, `created_at`) VALUES
(1, 1, 6, '2025-10-24 02:42:40'),
(2, 1, 8, '2025-10-24 02:42:40'),
(3, 1, 9, '2025-10-24 02:42:40'),
(4, 4, 6, '2025-10-24 02:42:40'),
(5, 4, 7, '2025-10-24 02:42:40'),
(6, 4, 8, '2025-10-24 02:42:40'),
(7, 9, 6, '2025-10-24 02:42:40'),
(8, 9, 8, '2025-10-24 02:42:40'),
(9, 12, 9, '2025-10-24 02:42:40'),
(10, 12, 10, '2025-10-24 02:42:40');

--
-- Disparadores `likes_comentarios`
--
DELIMITER $$
CREATE TRIGGER `after_like_comentario_delete` AFTER DELETE ON `likes_comentarios` FOR EACH ROW BEGIN
    UPDATE comentarios 
    SET num_likes = GREATEST(0, num_likes - 1)
    WHERE id = OLD.comentario_id;
END
$$
DELIMITER ;
DELIMITER $$
CREATE TRIGGER `after_like_comentario_insert` AFTER INSERT ON `likes_comentarios` FOR EACH ROW BEGIN
    UPDATE comentarios 
    SET num_likes = num_likes + 1 
    WHERE id = NEW.comentario_id;
END
$$
DELIMITER ;

-- --------------------------------------------------------

--
-- Estructura de tabla para la tabla `likes_publicaciones`
--

CREATE TABLE `likes_publicaciones` (
  `id` bigint(20) UNSIGNED NOT NULL,
  `publicacion_id` bigint(20) UNSIGNED NOT NULL,
  `usuario_id` bigint(20) UNSIGNED NOT NULL,
  `created_at` timestamp NOT NULL DEFAULT current_timestamp()
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

--
-- Volcado de datos para la tabla `likes_publicaciones`
--

INSERT INTO `likes_publicaciones` (`id`, `publicacion_id`, `usuario_id`, `created_at`) VALUES
(1, 1, 7, '2025-10-24 02:42:40'),
(2, 1, 8, '2025-10-24 02:42:40'),
(3, 1, 9, '2025-10-24 02:42:40'),
(4, 1, 10, '2025-10-24 02:42:40'),
(5, 1, 2, '2025-10-24 02:42:40'),
(6, 1, 3, '2025-10-24 02:42:40'),
(7, 2, 6, '2025-10-24 02:42:40'),
(8, 2, 8, '2025-10-24 02:42:40'),
(9, 2, 9, '2025-10-24 02:42:40'),
(10, 2, 10, '2025-10-24 02:42:40'),
(11, 3, 6, '2025-10-24 02:42:40'),
(12, 3, 7, '2025-10-24 02:42:40'),
(13, 3, 8, '2025-10-24 02:42:40'),
(14, 5, 7, '2025-10-24 02:42:40'),
(15, 5, 8, '2025-10-24 02:42:40'),
(16, 6, 6, '2025-10-24 02:42:40'),
(17, 6, 8, '2025-10-24 02:42:40'),
(18, 6, 9, '2025-10-24 02:42:40'),
(19, 8, 7, '2025-10-24 02:42:40'),
(20, 8, 8, '2025-10-24 02:42:40');

--
-- Disparadores `likes_publicaciones`
--
DELIMITER $$
CREATE TRIGGER `after_like_publicacion_delete` AFTER DELETE ON `likes_publicaciones` FOR EACH ROW BEGIN
    UPDATE publicaciones 
    SET num_likes = GREATEST(0, num_likes - 1)
    WHERE id = OLD.publicacion_id;
END
$$
DELIMITER ;
DELIMITER $$
CREATE TRIGGER `after_like_publicacion_insert` AFTER INSERT ON `likes_publicaciones` FOR EACH ROW BEGIN
    UPDATE publicaciones 
    SET num_likes = num_likes + 1 
    WHERE id = NEW.publicacion_id;
END
$$
DELIMITER ;

-- --------------------------------------------------------

--
-- Estructura de tabla para la tabla `materias`
--

CREATE TABLE `materias` (
  `id` bigint(20) UNSIGNED NOT NULL,
  `nombre` varchar(255) NOT NULL,
  `codigo` varchar(20) NOT NULL,
  `cuatrimestre_id` bigint(20) UNSIGNED NOT NULL,
  `profesor_id` bigint(20) UNSIGNED DEFAULT NULL,
  `descripcion` text DEFAULT NULL,
  `activo` tinyint(1) DEFAULT 1,
  `created_at` timestamp NOT NULL DEFAULT current_timestamp(),
  `updated_at` timestamp NOT NULL DEFAULT current_timestamp() ON UPDATE current_timestamp()
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

--
-- Volcado de datos para la tabla `materias`
--

INSERT INTO `materias` (`id`, `nombre`, `codigo`, `cuatrimestre_id`, `profesor_id`, `descripcion`, `activo`, `created_at`, `updated_at`) VALUES
(1, 'Bases de Datos', 'BD701', 7, 2, 'Diseño, implementación y administración de bases de datos relacionales', 1, '2025-10-24 02:42:18', '2025-10-24 02:42:18'),
(2, 'Programación Web', 'PW702', 7, 3, 'Desarrollo de aplicaciones web con HTML, CSS, JavaScript y frameworks modernos', 1, '2025-10-24 02:42:18', '2025-10-24 02:42:18'),
(3, 'Redes de Computadoras', 'RC703', 7, 4, 'Diseño, configuración y administración de redes de datos', 1, '2025-10-24 02:42:18', '2025-10-24 02:42:18'),
(4, 'Ingeniería de Software', 'IS704', 7, 5, 'Metodologías ágiles, análisis de requisitos y gestión de proyectos', 1, '2025-10-24 02:42:18', '2025-10-24 02:42:18'),
(5, 'Inteligencia Artificial', 'IA705', 7, 2, 'Fundamentos de IA, machine learning y aplicaciones', 1, '2025-10-24 02:42:18', '2025-10-24 02:42:18');

-- --------------------------------------------------------

--
-- Estructura de tabla para la tabla `migrations`
--

CREATE TABLE `migrations` (
  `id` int(10) UNSIGNED NOT NULL,
  `migration` varchar(255) NOT NULL,
  `batch` int(11) NOT NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

--
-- Volcado de datos para la tabla `migrations`
--

INSERT INTO `migrations` (`id`, `migration`, `batch`) VALUES
(1, '0001_01_01_000000_create_users_table', 1),
(2, '0001_01_01_000001_create_cache_table', 1),
(3, '0001_01_01_000002_create_jobs_table', 1);

-- --------------------------------------------------------

--
-- Estructura de tabla para la tabla `notificaciones`
--

CREATE TABLE `notificaciones` (
  `id` bigint(20) UNSIGNED NOT NULL,
  `usuario_id` bigint(20) UNSIGNED NOT NULL,
  `tipo` enum('comentario','like','mencion','aviso','recordatorio','respuesta_util') NOT NULL,
  `titulo` varchar(255) NOT NULL,
  `mensaje` text NOT NULL,
  `link` varchar(500) DEFAULT NULL COMMENT 'URL de destino',
  `publicacion_id` bigint(20) UNSIGNED DEFAULT NULL,
  `comentario_id` bigint(20) UNSIGNED DEFAULT NULL,
  `leida` tinyint(1) DEFAULT 0,
  `created_at` timestamp NOT NULL DEFAULT current_timestamp()
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

--
-- Volcado de datos para la tabla `notificaciones`
--

INSERT INTO `notificaciones` (`id`, `usuario_id`, `tipo`, `titulo`, `mensaje`, `link`, `publicacion_id`, `comentario_id`, `leida`, `created_at`) VALUES
(1, 6, 'comentario', 'Nuevo comentario', 'María comentó en tu publicación \"¿Cómo normalizar una base de datos a 3FN?\"', '/views/post.html?id=1', 1, NULL, 0, '2025-10-24 02:42:40'),
(2, 6, 'comentario', 'Nuevo comentario', 'Prof. Roberto Sánchez comentó en tu publicación', '/views/post.html?id=1', 1, NULL, 0, '2025-10-24 02:42:40'),
(3, 6, 'like', 'Le gustó tu publicación', 'A María y 5 personas más les gustó tu publicación', '/views/post.html?id=1', 1, NULL, 1, '2025-10-24 02:42:40'),
(4, 6, 'recordatorio', 'Recordatorio de evento', 'Examen de Bases de Datos mañana a las 10:00 AM', '/views/calendario.html', NULL, NULL, 0, '2025-10-24 02:42:40'),
(5, 7, 'like', 'Le gustó tu comentario', 'Juan y 2 personas más dieron like a tu comentario', '/views/post.html?id=1#comment-1', 1, NULL, 0, '2025-10-24 02:42:40'),
(6, 7, 'comentario', 'Nueva respuesta', 'Juan respondió a tu comentario', '/views/post.html?id=1', 1, NULL, 1, '2025-10-24 02:42:40'),
(7, 8, 'aviso', 'Nuevo aviso en Redes', 'Prof. Carlos López publicó un aviso importante', '/views/post.html?id=10', 10, NULL, 0, '2025-10-24 02:42:40');

-- --------------------------------------------------------

--
-- Estructura de tabla para la tabla `password_reset_tokens`
--

CREATE TABLE `password_reset_tokens` (
  `email` varchar(255) NOT NULL,
  `token` varchar(255) NOT NULL,
  `created_at` timestamp NULL DEFAULT NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- --------------------------------------------------------

--
-- Estructura de tabla para la tabla `profesores`
--

CREATE TABLE `profesores` (
  `id` bigint(20) UNSIGNED NOT NULL,
  `usuario_id` bigint(20) UNSIGNED NOT NULL,
  `num_empleado` varchar(20) NOT NULL,
  `especialidad` varchar(255) DEFAULT NULL,
  `created_at` timestamp NOT NULL DEFAULT current_timestamp(),
  `updated_at` timestamp NOT NULL DEFAULT current_timestamp() ON UPDATE current_timestamp()
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

--
-- Volcado de datos para la tabla `profesores`
--

INSERT INTO `profesores` (`id`, `usuario_id`, `num_empleado`, `especialidad`, `created_at`, `updated_at`) VALUES
(1, 2, 'EMP001', 'Bases de Datos', '2025-10-24 02:42:18', '2025-10-24 02:42:18'),
(2, 3, 'EMP002', 'Desarrollo Web', '2025-10-24 02:42:18', '2025-10-24 02:42:18'),
(3, 4, 'EMP003', 'Redes y Telecomunicaciones', '2025-10-24 02:42:18', '2025-10-24 02:42:18'),
(4, 5, 'EMP004', 'Ingeniería de Software', '2025-10-24 02:42:18', '2025-10-24 02:42:18');

-- --------------------------------------------------------

--
-- Estructura de tabla para la tabla `publicaciones`
--

CREATE TABLE `publicaciones` (
  `id` bigint(20) UNSIGNED NOT NULL,
  `titulo` varchar(255) NOT NULL,
  `contenido` text NOT NULL,
  `categoria` enum('duda','recurso','aviso','discusion') NOT NULL DEFAULT 'duda',
  `materia_id` bigint(20) UNSIGNED NOT NULL,
  `autor_id` bigint(20) UNSIGNED NOT NULL,
  `etiquetas` varchar(255) DEFAULT NULL COMMENT 'Separadas por comas',
  `vistas` int(10) UNSIGNED DEFAULT 0,
  `num_comentarios` int(10) UNSIGNED DEFAULT 0,
  `num_likes` int(10) UNSIGNED DEFAULT 0,
  `fijado` tinyint(1) DEFAULT 0,
  `activo` tinyint(1) DEFAULT 1,
  `created_at` timestamp NOT NULL DEFAULT current_timestamp(),
  `updated_at` timestamp NOT NULL DEFAULT current_timestamp() ON UPDATE current_timestamp()
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

--
-- Volcado de datos para la tabla `publicaciones`
--

INSERT INTO `publicaciones` (`id`, `titulo`, `contenido`, `categoria`, `materia_id`, `autor_id`, `etiquetas`, `vistas`, `num_comentarios`, `num_likes`, `fijado`, `activo`, `created_at`, `updated_at`) VALUES
(1, '¿Cómo normalizar una base de datos a 3FN?', 'Hola a todos, tengo algunas dudas sobre el proceso de normalización de bases de datos. Estoy trabajando en mi proyecto final y tengo una tabla con los siguientes campos: Estudiante (id_estudiante, nombre, apellido, direccion, ciudad, codigo_postal, id_curso, nombre_curso, profesor, departamento_profesor). Necesito llevarla de 1FN a 3FN pero no estoy seguro de cómo identificar correctamente las dependencias funcionales. ¿Alguien me puede explicar el proceso paso a paso?', 'duda', 1, 6, 'normalización,3FN,sql,proyecto', 45, 5, 6, 0, 1, '2025-10-24 02:42:18', '2025-10-24 02:42:40'),
(2, 'Apuntes completos de Normalización y Diagramas ER', 'Comparto mis apuntes del cuatrimestre completo. Incluye ejemplos de normalización, diagramas entidad-relación y ejercicios resueltos. El PDF tiene más de 50 páginas con casos prácticos. ¡Espero les sirva para el examen final!', 'recurso', 1, 7, 'apuntes,normalización,diagrama-ER,recursos', 120, 3, 4, 0, 1, '2025-10-24 02:42:18', '2025-10-24 02:42:40'),
(3, 'Cambio de fecha: Examen Final de BD', 'Estimados estudiantes, les informo que el examen final se pospone del miércoles 15 al viernes 17 de octubre a las 10:00 AM en el salón A-301. El temario incluye normalización, SQL avanzado (subconsultas, joins, triggers) y transacciones. Les recomiendo repasar los ejercicios de la clase 10 y 11. ¡A estudiar!', 'aviso', 1, 2, '', 200, 0, 3, 0, 1, '2025-10-24 02:42:18', '2025-10-24 02:42:40'),
(4, 'Tutorial: Transacciones en MySQL', 'Encontré este excelente tutorial sobre transacciones ACID en MySQL. Explica muy bien los conceptos de COMMIT, ROLLBACK y niveles de aislamiento. Link en los comentarios.', 'discusion', 1, 8, 'mysql,transacciones,acid,tutorial', 78, 0, 0, 0, 1, '2025-10-24 02:42:18', '2025-10-24 02:42:18'),
(5, 'Ayuda con fetch() en JavaScript', 'No logro hacer que mi fetch() funcione correctamente. Siempre me da error de CORS aunque el backend está configurado. ¿Alguien sabe cómo solucionarlo?', 'duda', 2, 6, 'javascript,fetch,cors,ajax', 32, 3, 2, 0, 1, '2025-10-24 02:42:18', '2025-10-24 02:42:40'),
(6, 'Proyecto: Clon de Twitter con React', 'Comparto mi proyecto final del cuatrimestre. Es un clon de Twitter hecho con React, Node.js y MongoDB. Incluye autenticación, tweets, likes y comentarios. El código está en GitHub.', 'recurso', 2, 7, 'react,nodejs,mongodb,proyecto', 95, 0, 3, 0, 1, '2025-10-24 02:42:18', '2025-10-24 02:42:40'),
(7, 'Taller de Git y GitHub - Este Sábado', 'La profesora Ana impartirá un taller gratuito de Git y GitHub este sábado de 10am a 2pm en el laboratorio de cómputo. Es importante para el proyecto final. Confirmen su asistencia.', 'aviso', 2, 3, 'git,github,taller', 150, 0, 0, 0, 1, '2025-10-24 02:42:18', '2025-10-24 02:42:18'),
(8, '¿Diferencia entre switch y router?', 'Sé que ambos son dispositivos de red, pero no me queda claro cuándo usar uno u otro. ¿Alguien me puede explicar con ejemplos prácticos?', 'duda', 3, 9, 'switch,router,redes,conceptos', 25, 2, 2, 0, 1, '2025-10-24 02:42:18', '2025-10-24 02:42:40'),
(9, 'Configuración básica de Cisco Packet Tracer', 'Tutorial paso a paso para configurar una red LAN básica en Cisco Packet Tracer. Incluye configuración de VLANs, routing y DHCP.', 'recurso', 3, 8, 'cisco,packet-tracer,vlan,routing', 110, 0, 0, 0, 1, '2025-10-24 02:42:18', '2025-10-24 02:42:18'),
(10, 'Práctica de laboratorio cancelada', 'La práctica de laboratorio del jueves 10 está cancelada por mantenimiento del equipo. Se repondrá el martes 15.', 'aviso', 3, 4, '', 88, 0, 0, 0, 1, '2025-10-24 02:42:18', '2025-10-24 02:42:18');

-- --------------------------------------------------------

--
-- Estructura de tabla para la tabla `reportes`
--

CREATE TABLE `reportes` (
  `id` bigint(20) UNSIGNED NOT NULL,
  `publicacion_id` bigint(20) UNSIGNED DEFAULT NULL,
  `comentario_id` bigint(20) UNSIGNED DEFAULT NULL,
  `reportado_por` bigint(20) UNSIGNED NOT NULL,
  `motivo` enum('spam','ofensivo','inapropiado','plagio','otro') NOT NULL,
  `descripcion` text DEFAULT NULL,
  `estado` enum('pendiente','en_revision','resuelto','rechazado') DEFAULT 'pendiente',
  `prioridad` enum('baja','media','alta') DEFAULT 'media',
  `resuelto_por` bigint(20) UNSIGNED DEFAULT NULL,
  `accion_tomada` varchar(255) DEFAULT NULL,
  `created_at` timestamp NOT NULL DEFAULT current_timestamp(),
  `updated_at` timestamp NOT NULL DEFAULT current_timestamp() ON UPDATE current_timestamp()
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

--
-- Volcado de datos para la tabla `reportes`
--

INSERT INTO `reportes` (`id`, `publicacion_id`, `comentario_id`, `reportado_por`, `motivo`, `descripcion`, `estado`, `prioridad`, `resuelto_por`, `accion_tomada`, `created_at`, `updated_at`) VALUES
(1, 1, NULL, 8, 'otro', 'El contenido está duplicado, ya existe una publicación similar', 'pendiente', 'baja', NULL, NULL, '2025-10-24 02:42:40', '2025-10-24 02:42:40');

-- --------------------------------------------------------

--
-- Estructura de tabla para la tabla `sesiones`
--

CREATE TABLE `sesiones` (
  `id` varchar(255) NOT NULL,
  `usuario_id` bigint(20) UNSIGNED DEFAULT NULL,
  `ip_address` varchar(45) DEFAULT NULL,
  `user_agent` text DEFAULT NULL,
  `payload` longtext NOT NULL,
  `last_activity` int(11) NOT NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- --------------------------------------------------------

--
-- Estructura de tabla para la tabla `sessions`
--

CREATE TABLE `sessions` (
  `id` varchar(255) NOT NULL,
  `user_id` bigint(20) UNSIGNED DEFAULT NULL,
  `ip_address` varchar(45) DEFAULT NULL,
  `user_agent` text DEFAULT NULL,
  `payload` longtext NOT NULL,
  `last_activity` int(11) NOT NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- --------------------------------------------------------

--
-- Estructura de tabla para la tabla `users`
--

CREATE TABLE `users` (
  `id` bigint(20) UNSIGNED NOT NULL,
  `name` varchar(255) NOT NULL,
  `email` varchar(255) NOT NULL,
  `email_verified_at` timestamp NULL DEFAULT NULL,
  `password` varchar(255) NOT NULL,
  `remember_token` varchar(100) DEFAULT NULL,
  `created_at` timestamp NULL DEFAULT NULL,
  `updated_at` timestamp NULL DEFAULT NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- --------------------------------------------------------

--
-- Estructura de tabla para la tabla `usuarios`
--

CREATE TABLE `usuarios` (
  `id` bigint(20) UNSIGNED NOT NULL,
  `nombre` varchar(100) NOT NULL,
  `apellidos` varchar(100) NOT NULL,
  `email` varchar(255) NOT NULL,
  `email_verified_at` timestamp NULL DEFAULT NULL,
  `password` varchar(255) NOT NULL,
  `rol` enum('estudiante','profesor','admin') NOT NULL DEFAULT 'estudiante',
  `avatar` varchar(255) DEFAULT NULL,
  `activo` tinyint(1) DEFAULT 1,
  `remember_token` varchar(100) DEFAULT NULL,
  `created_at` timestamp NOT NULL DEFAULT current_timestamp(),
  `updated_at` timestamp NOT NULL DEFAULT current_timestamp() ON UPDATE current_timestamp()
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

--
-- Volcado de datos para la tabla `usuarios`
--

INSERT INTO `usuarios` (`id`, `nombre`, `apellidos`, `email`, `email_verified_at`, `password`, `rol`, `avatar`, `activo`, `remember_token`, `created_at`, `updated_at`) VALUES
(1, 'Admin', 'Sistema', 'admin@upatlacomulco.edu.mx', '2025-10-24 02:42:18', '$2y$10$92IXUNpkjO0rOQ5byMi.Ye4oKoEa3Ro9llC/.og/at2.uheWG/igi', 'admin', NULL, 1, NULL, '2025-10-24 02:42:18', '2025-10-24 02:42:18'),
(2, 'Roberto', 'Sánchez Martínez', 'roberto.sanchez@upatlacomulco.edu.mx', '2025-10-24 02:42:18', '$2y$10$92IXUNpkjO0rOQ5byMi.Ye4oKoEa3Ro9llC/.og/at2.uheWG/igi', 'profesor', NULL, 1, NULL, '2025-10-24 02:42:18', '2025-10-24 02:42:18'),
(3, 'Ana', 'Martínez López', 'ana.martinez@upatlacomulco.edu.mx', '2025-10-24 02:42:18', '$2y$10$92IXUNpkjO0rOQ5byMi.Ye4oKoEa3Ro9llC/.og/at2.uheWG/igi', 'profesor', NULL, 1, NULL, '2025-10-24 02:42:18', '2025-10-24 02:42:18'),
(4, 'Carlos', 'López Hernández', 'carlos.lopez@upatlacomulco.edu.mx', '2025-10-24 02:42:18', '$2y$10$92IXUNpkjO0rOQ5byMi.Ye4oKoEa3Ro9llC/.og/at2.uheWG/igi', 'profesor', NULL, 1, NULL, '2025-10-24 02:42:18', '2025-10-24 02:42:18'),
(5, 'Laura', 'Hernández García', 'laura.hernandez@upatlacomulco.edu.mx', '2025-10-24 02:42:18', '$2y$10$92IXUNpkjO0rOQ5byMi.Ye4oKoEa3Ro9llC/.og/at2.uheWG/igi', 'profesor', NULL, 1, NULL, '2025-10-24 02:42:18', '2025-10-24 02:42:18'),
(6, 'Juan', 'Pérez García', 'juan.perez@upatlacomulco.edu.mx', '2025-10-24 02:42:18', '$2y$10$92IXUNpkjO0rOQ5byMi.Ye4oKoEa3Ro9llC/.og/at2.uheWG/igi', 'estudiante', NULL, 1, NULL, '2025-10-24 02:42:18', '2025-10-24 02:42:18'),
(7, 'María', 'García López', 'maria.garcia@upatlacomulco.edu.mx', '2025-10-24 02:42:18', '$2y$10$92IXUNpkjO0rOQ5byMi.Ye4oKoEa3Ro9llC/.og/at2.uheWG/igi', 'estudiante', NULL, 1, NULL, '2025-10-24 02:42:18', '2025-10-24 02:42:18'),
(8, 'Pedro', 'Ramírez Torres', 'pedro.ramirez@upatlacomulco.edu.mx', '2025-10-24 02:42:18', '$2y$10$92IXUNpkjO0rOQ5byMi.Ye4oKoEa3Ro9llC/.og/at2.uheWG/igi', 'estudiante', NULL, 1, NULL, '2025-10-24 02:42:18', '2025-10-24 02:42:18'),
(9, 'Sofía', 'Torres Mendoza', 'sofia.torres@upatlacomulco.edu.mx', '2025-10-24 02:42:18', '$2y$10$92IXUNpkjO0rOQ5byMi.Ye4oKoEa3Ro9llC/.og/at2.uheWG/igi', 'estudiante', NULL, 1, NULL, '2025-10-24 02:42:18', '2025-10-24 02:42:18'),
(10, 'Diego', 'Mendoza Cruz', 'diego.mendoza@upatlacomulco.edu.mx', '2025-10-24 02:42:18', '$2y$10$92IXUNpkjO0rOQ5byMi.Ye4oKoEa3Ro9llC/.og/at2.uheWG/igi', 'estudiante', NULL, 1, NULL, '2025-10-24 02:42:18', '2025-10-24 02:42:18');

-- --------------------------------------------------------

--
-- Estructura Stand-in para la vista `vista_estadisticas_usuarios`
-- (Véase abajo para la vista actual)
--
CREATE TABLE `vista_estadisticas_usuarios` (
`id` bigint(20) unsigned
,`nombre` varchar(100)
,`apellidos` varchar(100)
,`email` varchar(255)
,`rol` enum('estudiante','profesor','admin')
,`total_publicaciones` bigint(21)
,`total_comentarios` bigint(21)
,`total_likes_dados` bigint(21)
,`total_guardados` bigint(21)
);

-- --------------------------------------------------------

--
-- Estructura Stand-in para la vista `vista_publicaciones_completas`
-- (Véase abajo para la vista actual)
--
CREATE TABLE `vista_publicaciones_completas` (
`id` bigint(20) unsigned
,`titulo` varchar(255)
,`contenido` text
,`categoria` enum('duda','recurso','aviso','discusion')
,`materia_id` bigint(20) unsigned
,`autor_id` bigint(20) unsigned
,`etiquetas` varchar(255)
,`vistas` int(10) unsigned
,`num_comentarios` int(10) unsigned
,`num_likes` int(10) unsigned
,`fijado` tinyint(1)
,`activo` tinyint(1)
,`created_at` timestamp
,`updated_at` timestamp
,`autor_nombre` varchar(100)
,`autor_apellidos` varchar(100)
,`autor_avatar` varchar(255)
,`autor_rol` enum('estudiante','profesor','admin')
,`materia_nombre` varchar(255)
,`materia_codigo` varchar(20)
,`cuatrimestre_numero` tinyint(4)
,`carrera_nombre` varchar(255)
);

-- --------------------------------------------------------

--
-- Estructura para la vista `vista_estadisticas_usuarios`
--
DROP TABLE IF EXISTS `vista_estadisticas_usuarios`;

CREATE ALGORITHM=UNDEFINED DEFINER=`root`@`localhost` SQL SECURITY DEFINER VIEW `vista_estadisticas_usuarios`  AS SELECT `u`.`id` AS `id`, `u`.`nombre` AS `nombre`, `u`.`apellidos` AS `apellidos`, `u`.`email` AS `email`, `u`.`rol` AS `rol`, count(distinct `p`.`id`) AS `total_publicaciones`, count(distinct `c`.`id`) AS `total_comentarios`, count(distinct `lp`.`id`) AS `total_likes_dados`, count(distinct `g`.`id`) AS `total_guardados` FROM ((((`usuarios` `u` left join `publicaciones` `p` on(`u`.`id` = `p`.`autor_id` and `p`.`activo` = 1)) left join `comentarios` `c` on(`u`.`id` = `c`.`autor_id` and `c`.`activo` = 1)) left join `likes_publicaciones` `lp` on(`u`.`id` = `lp`.`usuario_id`)) left join `guardados` `g` on(`u`.`id` = `g`.`usuario_id`)) GROUP BY `u`.`id` ;

-- --------------------------------------------------------

--
-- Estructura para la vista `vista_publicaciones_completas`
--
DROP TABLE IF EXISTS `vista_publicaciones_completas`;

CREATE ALGORITHM=UNDEFINED DEFINER=`root`@`localhost` SQL SECURITY DEFINER VIEW `vista_publicaciones_completas`  AS SELECT `p`.`id` AS `id`, `p`.`titulo` AS `titulo`, `p`.`contenido` AS `contenido`, `p`.`categoria` AS `categoria`, `p`.`materia_id` AS `materia_id`, `p`.`autor_id` AS `autor_id`, `p`.`etiquetas` AS `etiquetas`, `p`.`vistas` AS `vistas`, `p`.`num_comentarios` AS `num_comentarios`, `p`.`num_likes` AS `num_likes`, `p`.`fijado` AS `fijado`, `p`.`activo` AS `activo`, `p`.`created_at` AS `created_at`, `p`.`updated_at` AS `updated_at`, `u`.`nombre` AS `autor_nombre`, `u`.`apellidos` AS `autor_apellidos`, `u`.`avatar` AS `autor_avatar`, `u`.`rol` AS `autor_rol`, `m`.`nombre` AS `materia_nombre`, `m`.`codigo` AS `materia_codigo`, `c`.`numero` AS `cuatrimestre_numero`, `car`.`nombre` AS `carrera_nombre` FROM ((((`publicaciones` `p` join `usuarios` `u` on(`p`.`autor_id` = `u`.`id`)) join `materias` `m` on(`p`.`materia_id` = `m`.`id`)) join `cuatrimestres` `c` on(`m`.`cuatrimestre_id` = `c`.`id`)) join `carreras` `car` on(`c`.`carrera_id` = `car`.`id`)) WHERE `p`.`activo` = 1 ;

--
-- Índices para tablas volcadas
--

--
-- Indices de la tabla `archivos`
--
ALTER TABLE `archivos`
  ADD PRIMARY KEY (`id`),
  ADD KEY `idx_publicacion` (`publicacion_id`),
  ADD KEY `idx_comentario` (`comentario_id`);

--
-- Indices de la tabla `cache`
--
ALTER TABLE `cache`
  ADD PRIMARY KEY (`key`);

--
-- Indices de la tabla `cache_locks`
--
ALTER TABLE `cache_locks`
  ADD PRIMARY KEY (`key`);

--
-- Indices de la tabla `carreras`
--
ALTER TABLE `carreras`
  ADD PRIMARY KEY (`id`),
  ADD UNIQUE KEY `codigo` (`codigo`),
  ADD KEY `idx_codigo` (`codigo`);

--
-- Indices de la tabla `comentarios`
--
ALTER TABLE `comentarios`
  ADD PRIMARY KEY (`id`),
  ADD KEY `idx_publicacion` (`publicacion_id`),
  ADD KEY `idx_autor` (`autor_id`),
  ADD KEY `idx_padre` (`comentario_padre_id`),
  ADD KEY `idx_created` (`created_at`);

--
-- Indices de la tabla `cuatrimestres`
--
ALTER TABLE `cuatrimestres`
  ADD PRIMARY KEY (`id`),
  ADD UNIQUE KEY `unique_cuatrimestre_carrera` (`numero`,`carrera_id`),
  ADD KEY `idx_carrera` (`carrera_id`);

--
-- Indices de la tabla `estudiantes`
--
ALTER TABLE `estudiantes`
  ADD PRIMARY KEY (`id`),
  ADD UNIQUE KEY `usuario_id` (`usuario_id`),
  ADD UNIQUE KEY `matricula` (`matricula`),
  ADD KEY `idx_matricula` (`matricula`),
  ADD KEY `idx_carrera` (`carrera_id`);

--
-- Indices de la tabla `eventos_calendario`
--
ALTER TABLE `eventos_calendario`
  ADD PRIMARY KEY (`id`),
  ADD KEY `idx_materia` (`materia_id`),
  ADD KEY `idx_fecha_inicio` (`fecha_inicio`),
  ADD KEY `idx_creador` (`creador_id`);

--
-- Indices de la tabla `failed_jobs`
--
ALTER TABLE `failed_jobs`
  ADD PRIMARY KEY (`id`),
  ADD UNIQUE KEY `failed_jobs_uuid_unique` (`uuid`);

--
-- Indices de la tabla `guardados`
--
ALTER TABLE `guardados`
  ADD PRIMARY KEY (`id`),
  ADD UNIQUE KEY `unique_guardado` (`usuario_id`,`publicacion_id`),
  ADD KEY `idx_usuario` (`usuario_id`),
  ADD KEY `idx_publicacion` (`publicacion_id`);

--
-- Indices de la tabla `historial_moderacion`
--
ALTER TABLE `historial_moderacion`
  ADD PRIMARY KEY (`id`),
  ADD KEY `idx_moderador` (`moderador_id`),
  ADD KEY `idx_usuario_afectado` (`usuario_afectado_id`),
  ADD KEY `idx_created` (`created_at`);

--
-- Indices de la tabla `inscripciones`
--
ALTER TABLE `inscripciones`
  ADD PRIMARY KEY (`id`),
  ADD UNIQUE KEY `unique_inscripcion` (`estudiante_id`,`materia_id`),
  ADD KEY `idx_estudiante` (`estudiante_id`),
  ADD KEY `idx_materia` (`materia_id`);

--
-- Indices de la tabla `jobs`
--
ALTER TABLE `jobs`
  ADD PRIMARY KEY (`id`),
  ADD KEY `jobs_queue_index` (`queue`);

--
-- Indices de la tabla `job_batches`
--
ALTER TABLE `job_batches`
  ADD PRIMARY KEY (`id`);

--
-- Indices de la tabla `likes_comentarios`
--
ALTER TABLE `likes_comentarios`
  ADD PRIMARY KEY (`id`),
  ADD UNIQUE KEY `unique_like` (`comentario_id`,`usuario_id`),
  ADD KEY `idx_comentario` (`comentario_id`),
  ADD KEY `idx_usuario` (`usuario_id`);

--
-- Indices de la tabla `likes_publicaciones`
--
ALTER TABLE `likes_publicaciones`
  ADD PRIMARY KEY (`id`),
  ADD UNIQUE KEY `unique_like` (`publicacion_id`,`usuario_id`),
  ADD KEY `idx_publicacion` (`publicacion_id`),
  ADD KEY `idx_usuario` (`usuario_id`);

--
-- Indices de la tabla `materias`
--
ALTER TABLE `materias`
  ADD PRIMARY KEY (`id`),
  ADD KEY `idx_cuatrimestre` (`cuatrimestre_id`),
  ADD KEY `idx_profesor` (`profesor_id`),
  ADD KEY `idx_codigo` (`codigo`);

--
-- Indices de la tabla `migrations`
--
ALTER TABLE `migrations`
  ADD PRIMARY KEY (`id`);

--
-- Indices de la tabla `notificaciones`
--
ALTER TABLE `notificaciones`
  ADD PRIMARY KEY (`id`),
  ADD KEY `publicacion_id` (`publicacion_id`),
  ADD KEY `comentario_id` (`comentario_id`),
  ADD KEY `idx_usuario` (`usuario_id`),
  ADD KEY `idx_leida` (`leida`),
  ADD KEY `idx_created` (`created_at`);

--
-- Indices de la tabla `password_reset_tokens`
--
ALTER TABLE `password_reset_tokens`
  ADD PRIMARY KEY (`email`);

--
-- Indices de la tabla `profesores`
--
ALTER TABLE `profesores`
  ADD PRIMARY KEY (`id`),
  ADD UNIQUE KEY `usuario_id` (`usuario_id`),
  ADD UNIQUE KEY `num_empleado` (`num_empleado`),
  ADD KEY `idx_num_empleado` (`num_empleado`);

--
-- Indices de la tabla `publicaciones`
--
ALTER TABLE `publicaciones`
  ADD PRIMARY KEY (`id`),
  ADD KEY `idx_materia` (`materia_id`),
  ADD KEY `idx_autor` (`autor_id`),
  ADD KEY `idx_categoria` (`categoria`),
  ADD KEY `idx_created` (`created_at`),
  ADD KEY `idx_fijado` (`fijado`);
ALTER TABLE `publicaciones` ADD FULLTEXT KEY `idx_busqueda` (`titulo`,`contenido`,`etiquetas`);

--
-- Indices de la tabla `reportes`
--
ALTER TABLE `reportes`
  ADD PRIMARY KEY (`id`),
  ADD KEY `reportado_por` (`reportado_por`),
  ADD KEY `resuelto_por` (`resuelto_por`),
  ADD KEY `idx_publicacion` (`publicacion_id`),
  ADD KEY `idx_comentario` (`comentario_id`),
  ADD KEY `idx_estado` (`estado`),
  ADD KEY `idx_prioridad` (`prioridad`);

--
-- Indices de la tabla `sesiones`
--
ALTER TABLE `sesiones`
  ADD PRIMARY KEY (`id`),
  ADD KEY `idx_usuario` (`usuario_id`),
  ADD KEY `idx_last_activity` (`last_activity`);

--
-- Indices de la tabla `sessions`
--
ALTER TABLE `sessions`
  ADD PRIMARY KEY (`id`),
  ADD KEY `sessions_user_id_index` (`user_id`),
  ADD KEY `sessions_last_activity_index` (`last_activity`);

--
-- Indices de la tabla `users`
--
ALTER TABLE `users`
  ADD PRIMARY KEY (`id`),
  ADD UNIQUE KEY `users_email_unique` (`email`);

--
-- Indices de la tabla `usuarios`
--
ALTER TABLE `usuarios`
  ADD PRIMARY KEY (`id`),
  ADD UNIQUE KEY `email` (`email`),
  ADD KEY `idx_email` (`email`),
  ADD KEY `idx_rol` (`rol`),
  ADD KEY `idx_activo` (`activo`);

--
-- AUTO_INCREMENT de las tablas volcadas
--

--
-- AUTO_INCREMENT de la tabla `archivos`
--
ALTER TABLE `archivos`
  MODIFY `id` bigint(20) UNSIGNED NOT NULL AUTO_INCREMENT, AUTO_INCREMENT=4;

--
-- AUTO_INCREMENT de la tabla `carreras`
--
ALTER TABLE `carreras`
  MODIFY `id` bigint(20) UNSIGNED NOT NULL AUTO_INCREMENT, AUTO_INCREMENT=5;

--
-- AUTO_INCREMENT de la tabla `comentarios`
--
ALTER TABLE `comentarios`
  MODIFY `id` bigint(20) UNSIGNED NOT NULL AUTO_INCREMENT, AUTO_INCREMENT=14;

--
-- AUTO_INCREMENT de la tabla `cuatrimestres`
--
ALTER TABLE `cuatrimestres`
  MODIFY `id` bigint(20) UNSIGNED NOT NULL AUTO_INCREMENT, AUTO_INCREMENT=45;

--
-- AUTO_INCREMENT de la tabla `estudiantes`
--
ALTER TABLE `estudiantes`
  MODIFY `id` bigint(20) UNSIGNED NOT NULL AUTO_INCREMENT, AUTO_INCREMENT=6;

--
-- AUTO_INCREMENT de la tabla `eventos_calendario`
--
ALTER TABLE `eventos_calendario`
  MODIFY `id` bigint(20) UNSIGNED NOT NULL AUTO_INCREMENT, AUTO_INCREMENT=7;

--
-- AUTO_INCREMENT de la tabla `failed_jobs`
--
ALTER TABLE `failed_jobs`
  MODIFY `id` bigint(20) UNSIGNED NOT NULL AUTO_INCREMENT;

--
-- AUTO_INCREMENT de la tabla `guardados`
--
ALTER TABLE `guardados`
  MODIFY `id` bigint(20) UNSIGNED NOT NULL AUTO_INCREMENT, AUTO_INCREMENT=7;

--
-- AUTO_INCREMENT de la tabla `historial_moderacion`
--
ALTER TABLE `historial_moderacion`
  MODIFY `id` bigint(20) UNSIGNED NOT NULL AUTO_INCREMENT;

--
-- AUTO_INCREMENT de la tabla `inscripciones`
--
ALTER TABLE `inscripciones`
  MODIFY `id` bigint(20) UNSIGNED NOT NULL AUTO_INCREMENT, AUTO_INCREMENT=14;

--
-- AUTO_INCREMENT de la tabla `jobs`
--
ALTER TABLE `jobs`
  MODIFY `id` bigint(20) UNSIGNED NOT NULL AUTO_INCREMENT;

--
-- AUTO_INCREMENT de la tabla `likes_comentarios`
--
ALTER TABLE `likes_comentarios`
  MODIFY `id` bigint(20) UNSIGNED NOT NULL AUTO_INCREMENT, AUTO_INCREMENT=11;

--
-- AUTO_INCREMENT de la tabla `likes_publicaciones`
--
ALTER TABLE `likes_publicaciones`
  MODIFY `id` bigint(20) UNSIGNED NOT NULL AUTO_INCREMENT, AUTO_INCREMENT=21;

--
-- AUTO_INCREMENT de la tabla `materias`
--
ALTER TABLE `materias`
  MODIFY `id` bigint(20) UNSIGNED NOT NULL AUTO_INCREMENT, AUTO_INCREMENT=6;

--
-- AUTO_INCREMENT de la tabla `migrations`
--
ALTER TABLE `migrations`
  MODIFY `id` int(10) UNSIGNED NOT NULL AUTO_INCREMENT, AUTO_INCREMENT=4;

--
-- AUTO_INCREMENT de la tabla `notificaciones`
--
ALTER TABLE `notificaciones`
  MODIFY `id` bigint(20) UNSIGNED NOT NULL AUTO_INCREMENT, AUTO_INCREMENT=8;

--
-- AUTO_INCREMENT de la tabla `profesores`
--
ALTER TABLE `profesores`
  MODIFY `id` bigint(20) UNSIGNED NOT NULL AUTO_INCREMENT, AUTO_INCREMENT=5;

--
-- AUTO_INCREMENT de la tabla `publicaciones`
--
ALTER TABLE `publicaciones`
  MODIFY `id` bigint(20) UNSIGNED NOT NULL AUTO_INCREMENT, AUTO_INCREMENT=11;

--
-- AUTO_INCREMENT de la tabla `reportes`
--
ALTER TABLE `reportes`
  MODIFY `id` bigint(20) UNSIGNED NOT NULL AUTO_INCREMENT, AUTO_INCREMENT=2;

--
-- AUTO_INCREMENT de la tabla `users`
--
ALTER TABLE `users`
  MODIFY `id` bigint(20) UNSIGNED NOT NULL AUTO_INCREMENT;

--
-- AUTO_INCREMENT de la tabla `usuarios`
--
ALTER TABLE `usuarios`
  MODIFY `id` bigint(20) UNSIGNED NOT NULL AUTO_INCREMENT, AUTO_INCREMENT=11;

--
-- Restricciones para tablas volcadas
--

--
-- Filtros para la tabla `archivos`
--
ALTER TABLE `archivos`
  ADD CONSTRAINT `archivos_ibfk_1` FOREIGN KEY (`publicacion_id`) REFERENCES `publicaciones` (`id`) ON DELETE CASCADE,
  ADD CONSTRAINT `archivos_ibfk_2` FOREIGN KEY (`comentario_id`) REFERENCES `comentarios` (`id`) ON DELETE CASCADE;

--
-- Filtros para la tabla `comentarios`
--
ALTER TABLE `comentarios`
  ADD CONSTRAINT `comentarios_ibfk_1` FOREIGN KEY (`publicacion_id`) REFERENCES `publicaciones` (`id`) ON DELETE CASCADE,
  ADD CONSTRAINT `comentarios_ibfk_2` FOREIGN KEY (`autor_id`) REFERENCES `usuarios` (`id`) ON DELETE CASCADE,
  ADD CONSTRAINT `comentarios_ibfk_3` FOREIGN KEY (`comentario_padre_id`) REFERENCES `comentarios` (`id`) ON DELETE CASCADE;

--
-- Filtros para la tabla `cuatrimestres`
--
ALTER TABLE `cuatrimestres`
  ADD CONSTRAINT `cuatrimestres_ibfk_1` FOREIGN KEY (`carrera_id`) REFERENCES `carreras` (`id`) ON DELETE CASCADE;

--
-- Filtros para la tabla `estudiantes`
--
ALTER TABLE `estudiantes`
  ADD CONSTRAINT `estudiantes_ibfk_1` FOREIGN KEY (`usuario_id`) REFERENCES `usuarios` (`id`) ON DELETE CASCADE,
  ADD CONSTRAINT `estudiantes_ibfk_2` FOREIGN KEY (`carrera_id`) REFERENCES `carreras` (`id`) ON DELETE CASCADE;

--
-- Filtros para la tabla `eventos_calendario`
--
ALTER TABLE `eventos_calendario`
  ADD CONSTRAINT `eventos_calendario_ibfk_1` FOREIGN KEY (`materia_id`) REFERENCES `materias` (`id`) ON DELETE CASCADE,
  ADD CONSTRAINT `eventos_calendario_ibfk_2` FOREIGN KEY (`creador_id`) REFERENCES `usuarios` (`id`) ON DELETE CASCADE;

--
-- Filtros para la tabla `guardados`
--
ALTER TABLE `guardados`
  ADD CONSTRAINT `guardados_ibfk_1` FOREIGN KEY (`usuario_id`) REFERENCES `usuarios` (`id`) ON DELETE CASCADE,
  ADD CONSTRAINT `guardados_ibfk_2` FOREIGN KEY (`publicacion_id`) REFERENCES `publicaciones` (`id`) ON DELETE CASCADE;

--
-- Filtros para la tabla `historial_moderacion`
--
ALTER TABLE `historial_moderacion`
  ADD CONSTRAINT `historial_moderacion_ibfk_1` FOREIGN KEY (`moderador_id`) REFERENCES `usuarios` (`id`) ON DELETE CASCADE,
  ADD CONSTRAINT `historial_moderacion_ibfk_2` FOREIGN KEY (`usuario_afectado_id`) REFERENCES `usuarios` (`id`) ON DELETE CASCADE;

--
-- Filtros para la tabla `inscripciones`
--
ALTER TABLE `inscripciones`
  ADD CONSTRAINT `inscripciones_ibfk_1` FOREIGN KEY (`estudiante_id`) REFERENCES `estudiantes` (`id`) ON DELETE CASCADE,
  ADD CONSTRAINT `inscripciones_ibfk_2` FOREIGN KEY (`materia_id`) REFERENCES `materias` (`id`) ON DELETE CASCADE;

--
-- Filtros para la tabla `likes_comentarios`
--
ALTER TABLE `likes_comentarios`
  ADD CONSTRAINT `likes_comentarios_ibfk_1` FOREIGN KEY (`comentario_id`) REFERENCES `comentarios` (`id`) ON DELETE CASCADE,
  ADD CONSTRAINT `likes_comentarios_ibfk_2` FOREIGN KEY (`usuario_id`) REFERENCES `usuarios` (`id`) ON DELETE CASCADE;

--
-- Filtros para la tabla `likes_publicaciones`
--
ALTER TABLE `likes_publicaciones`
  ADD CONSTRAINT `likes_publicaciones_ibfk_1` FOREIGN KEY (`publicacion_id`) REFERENCES `publicaciones` (`id`) ON DELETE CASCADE,
  ADD CONSTRAINT `likes_publicaciones_ibfk_2` FOREIGN KEY (`usuario_id`) REFERENCES `usuarios` (`id`) ON DELETE CASCADE;

--
-- Filtros para la tabla `materias`
--
ALTER TABLE `materias`
  ADD CONSTRAINT `materias_ibfk_1` FOREIGN KEY (`cuatrimestre_id`) REFERENCES `cuatrimestres` (`id`) ON DELETE CASCADE,
  ADD CONSTRAINT `materias_ibfk_2` FOREIGN KEY (`profesor_id`) REFERENCES `usuarios` (`id`) ON DELETE SET NULL;

--
-- Filtros para la tabla `notificaciones`
--
ALTER TABLE `notificaciones`
  ADD CONSTRAINT `notificaciones_ibfk_1` FOREIGN KEY (`usuario_id`) REFERENCES `usuarios` (`id`) ON DELETE CASCADE,
  ADD CONSTRAINT `notificaciones_ibfk_2` FOREIGN KEY (`publicacion_id`) REFERENCES `publicaciones` (`id`) ON DELETE CASCADE,
  ADD CONSTRAINT `notificaciones_ibfk_3` FOREIGN KEY (`comentario_id`) REFERENCES `comentarios` (`id`) ON DELETE CASCADE;

--
-- Filtros para la tabla `profesores`
--
ALTER TABLE `profesores`
  ADD CONSTRAINT `profesores_ibfk_1` FOREIGN KEY (`usuario_id`) REFERENCES `usuarios` (`id`) ON DELETE CASCADE;

--
-- Filtros para la tabla `publicaciones`
--
ALTER TABLE `publicaciones`
  ADD CONSTRAINT `publicaciones_ibfk_1` FOREIGN KEY (`materia_id`) REFERENCES `materias` (`id`) ON DELETE CASCADE,
  ADD CONSTRAINT `publicaciones_ibfk_2` FOREIGN KEY (`autor_id`) REFERENCES `usuarios` (`id`) ON DELETE CASCADE;

--
-- Filtros para la tabla `reportes`
--
ALTER TABLE `reportes`
  ADD CONSTRAINT `reportes_ibfk_1` FOREIGN KEY (`publicacion_id`) REFERENCES `publicaciones` (`id`) ON DELETE CASCADE,
  ADD CONSTRAINT `reportes_ibfk_2` FOREIGN KEY (`comentario_id`) REFERENCES `comentarios` (`id`) ON DELETE CASCADE,
  ADD CONSTRAINT `reportes_ibfk_3` FOREIGN KEY (`reportado_por`) REFERENCES `usuarios` (`id`) ON DELETE CASCADE,
  ADD CONSTRAINT `reportes_ibfk_4` FOREIGN KEY (`resuelto_por`) REFERENCES `usuarios` (`id`) ON DELETE SET NULL;

--
-- Filtros para la tabla `sesiones`
--
ALTER TABLE `sesiones`
  ADD CONSTRAINT `sesiones_ibfk_1` FOREIGN KEY (`usuario_id`) REFERENCES `usuarios` (`id`) ON DELETE CASCADE;
COMMIT;

/*!40101 SET CHARACTER_SET_CLIENT=@OLD_CHARACTER_SET_CLIENT */;
/*!40101 SET CHARACTER_SET_RESULTS=@OLD_CHARACTER_SET_RESULTS */;
/*!40101 SET COLLATION_CONNECTION=@OLD_COLLATION_CONNECTION */;
