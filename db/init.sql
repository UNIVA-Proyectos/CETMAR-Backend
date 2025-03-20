-- Crear tabla de usuarios
CREATE TABLE IF NOT EXISTS usuarios (
    id SERIAL PRIMARY KEY,
    matricula VARCHAR(8) UNIQUE NOT NULL,
    contraseña VARCHAR(255) NOT NULL,
    nombres VARCHAR(100) NOT NULL,
    apellido_paterno VARCHAR(100) NOT NULL,
    apellido_materno VARCHAR(100),
    telefono VARCHAR(15),
    tipo_usuario VARCHAR(20) NOT NULL DEFAULT 'estudiante',
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Crear índice para búsqueda rápida por matrícula
CREATE INDEX IF NOT EXISTS idx_usuarios_matricula ON usuarios(matricula);

-- Insertar usuario administrador por defecto
-- La contraseña es 'admin123' (deberás cambiarla después)
INSERT INTO usuarios (
    matricula,
    contraseña,
    nombres,
    apellido_paterno,
    tipo_usuario
) VALUES (
    'ADMIN001',
    '$2a$10$X7SZVe0vZJQX.1vR3qX5m.D1hBZw.yv8WrCHZYXHVp.W4qQhwCkrK',
    'Administrador',
    'Sistema',
    'admin'
) ON CONFLICT (matricula) DO NOTHING;
