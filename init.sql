-- =============================================================
--  init.sql  |  Base de datos educativa para práctica de SQLi
--  Ejecutar en phpMyAdmin o mysql CLI:
--      mysql -u root -p < init.sql
-- =============================================================

DROP DATABASE IF EXISTS practica;
CREATE DATABASE practica CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;
USE practica;

-- ---------------------------------------------------------------
-- Tabla: usuarios
-- ---------------------------------------------------------------
CREATE TABLE usuarios (
    id        INT AUTO_INCREMENT PRIMARY KEY,
    username  VARCHAR(50)  NOT NULL UNIQUE,
    password  VARCHAR(255) NOT NULL,          -- almacenado en texto plano (¡solo educativo!)
    email     VARCHAR(100) NOT NULL,
    rol       ENUM('admin','editor','user') DEFAULT 'user',
    creado_en TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

INSERT INTO usuarios (username, password, email, rol) VALUES
('admin',     'admin123',      'admin@practica.local',     'admin'),
('editor',    'editor456',     'editor@practica.local',    'editor'),
('juan',      'juanpass',      'juan@correo.com',          'user'),
('maria',     'mariapass',     'maria@correo.com',         'user'),
('invitado',  'guest',         'invitado@practica.local',  'user');

-- ---------------------------------------------------------------
-- Tabla: noticias
-- ---------------------------------------------------------------
CREATE TABLE noticias (
    id          INT AUTO_INCREMENT PRIMARY KEY,
    titulo      VARCHAR(200) NOT NULL,
    contenido   TEXT,
    autor_id    INT,
    publicado   TINYINT(1) DEFAULT 1,
    fecha       TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (autor_id) REFERENCES usuarios(id)
);

INSERT INTO noticias (titulo, contenido, autor_id, publicado) VALUES
('Bienvenidos al portal',    'Esta es la primera noticia de prueba del sistema.',  1, 1),
('Actualización de sistema', 'Se realizaron mejoras en el backend.',               2, 1),
('Noticia interna',          'Contenido visible solo para administradores.',       1, 0),
('Evento especial',          'Se celebrará un evento el próximo viernes.',         2, 1);

-- ---------------------------------------------------------------
-- Tabla: productos
-- ---------------------------------------------------------------
CREATE TABLE productos (
    id           INT AUTO_INCREMENT PRIMARY KEY,
    nombre       VARCHAR(150) NOT NULL,
    descripcion  TEXT,
    precio       DECIMAL(10,2),
    categoria    VARCHAR(50),
    stock        INT DEFAULT 0
);

INSERT INTO productos (nombre, descripcion, precio, categoria, stock) VALUES
('Laptop Pro X',      'Laptop de alto rendimiento',        1299.99, 'electronica',  10),
('Mouse Inalámbrico', 'Mouse ergonómico sin cable',           29.99, 'electronica',  50),
('Escritorio Gamer',  'Mesa amplia para gamers',             199.99, 'muebles',       5),
('Silla Ergonómica',  'Silla con soporte lumbar',            349.99, 'muebles',       8),
('Teclado Mecánico',  'Teclado con switches Cherry MX',       89.99, 'electronica',  20),
('Audífonos BT',      'Audífonos bluetooth con cancelación', 149.99, 'audio',        15);

-- ---------------------------------------------------------------
-- Tabla: perfiles
-- ---------------------------------------------------------------
CREATE TABLE perfiles (
    id              INT AUTO_INCREMENT PRIMARY KEY,
    user_id         INT NOT NULL,
    nombre_completo VARCHAR(150),
    bio             TEXT,
    telefono        VARCHAR(20),
    direccion       VARCHAR(255),
    token_secreto   VARCHAR(64),                   -- dato sensible expuesto intencionalmente
    FOREIGN KEY (user_id) REFERENCES usuarios(id)
);

INSERT INTO perfiles (user_id, nombre_completo, bio, telefono, direccion, token_secreto) VALUES
(1, 'Administrador del Sistema', 'Cuenta de administración principal.',   '555-0001', 'Oficina Central 1',   'tok3n_s3cr3t0_4dm1n_XYZ987'),
(2, 'Editor General',            'Encargado de publicaciones.',           '555-0002', 'Oficina Editorial 2', 'tok3n_3d1t0r_ABC123'),
(3, 'Juan Pérez',                'Usuario registrado desde 2023.',        '555-0003', 'Calle Falsa 123',     'tok3n_ju4n_DEF456'),
(4, 'María López',               'Usuaria activa del portal.',            '555-0004', 'Av. Siempreviva 742', 'tok3n_m4r14_GHI789');

-- ---------------------------------------------------------------
-- Tabla: logs_secretos  (dato extra para UNION extraction)
-- ---------------------------------------------------------------
CREATE TABLE logs_secretos (
    id       INT AUTO_INCREMENT PRIMARY KEY,
    nivel    VARCHAR(20),
    mensaje  TEXT,
    fecha    TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

INSERT INTO logs_secretos (nivel, mensaje) VALUES
('CRITICAL', 'Intento de acceso no autorizado detectado a las 03:14'),
('INFO',      'Backup completado exitosamente'),
('WARNING',   'Certificado SSL próximo a vencer');

-- Verificación final
SELECT 'Base de datos "practica" creada exitosamente.' AS estado;
SELECT TABLE_NAME, TABLE_ROWS FROM information_schema.TABLES WHERE TABLE_SCHEMA = 'practica';
