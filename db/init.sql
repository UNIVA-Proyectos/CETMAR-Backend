-- Crear los ENUMS necesarios
DO $$ BEGIN
    CREATE TYPE estado_alumno_enum AS ENUM ('activo', 'baja_definitiva', 'baja_temporal', 'egresado');
EXCEPTION
    WHEN duplicate_object THEN null;
END $$;

DO $$ BEGIN
    CREATE TYPE motivo_incidencia_enum AS ENUM ('Académico', 'Conducta', 'Uniforme', 'Inasistencia', 'Otro');
EXCEPTION
    WHEN duplicate_object THEN null;
END $$;

DO $$ BEGIN
    CREATE TYPE tipo_incidencia_enum AS ENUM ('Confidencial', 'Educativo');
EXCEPTION
    WHEN duplicate_object THEN null;
END $$;

DO $$ BEGIN
    CREATE TYPE tipo_usuario_enum AS ENUM ('admin', 'directivo', 'administrativo', 'docente', 'tutor', 'padre', 'alumno');
EXCEPTION
    WHEN duplicate_object THEN null;
END $$;

DO $$ BEGIN
    CREATE TYPE tipo_justificacion_enum AS ENUM ('medica', 'actividad_clase', 'llamada_padres', 'otro');
EXCEPTION
    WHEN duplicate_object THEN null;
END $$;

DO $$ BEGIN
    CREATE TYPE estado_asistencia_enum AS ENUM ('presente', 'ausente', 'retardo', 'justificado');
EXCEPTION
    WHEN duplicate_object THEN null;
END $$;

DO $$ BEGIN
    CREATE TYPE estado_incidencia_enum AS ENUM ('pendiente', 'revisado', 'resuelto');
EXCEPTION
    WHEN duplicate_object THEN null;
END $$;


-- Tabla de Usuarios
CREATE TABLE Usuarios (
    id SERIAL PRIMARY KEY,
    nombre VARCHAR(255) NOT NULL,
    apellido_paterno VARCHAR(100) NOT NULL,
    apellido_materno VARCHAR(100) NOT NULL,
    matricula VARCHAR(20) UNIQUE NOT NULL,
    contraseña VARCHAR(255) NOT NULL,
    correo VARCHAR(255) UNIQUE NOT NULL,
    telefono VARCHAR(15),
    fecha_creacion TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    fecha_modificacion TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Tabla de Multi-Rol
CREATE TABLE Usuario_Rol (
    id SERIAL PRIMARY KEY,
    usuario_id INT REFERENCES Usuarios(id) ON DELETE CASCADE,
    rol tipo_usuario_enum NOT NULL
);

-- Tabla de Carreras Técnicas
CREATE TABLE Carreras (
    id SERIAL PRIMARY KEY,
    nombre VARCHAR(255) UNIQUE NOT NULL,
    abreviatura VARCHAR(50) NULL
);

CREATE TABLE Periodos (
    id SERIAL PRIMARY KEY,
    nombre VARCHAR(20) UNIQUE NOT NULL, -- e.g., '2025-1', '2025-2'
    fecha_inicio DATE NOT NULL,
    fecha_fin DATE NOT NULL
);

-- Tabla de Grupos
CREATE TABLE Grupos (
    id SERIAL PRIMARY KEY,
    nombre VARCHAR(50) NOT NULL,
    periodo_id INT REFERENCES Periodos(id),
    tutor_id INT REFERENCES Usuarios(id) ON DELETE SET NULL
);

-- Tabla de Alumnos
CREATE TABLE Alumnos (
    id SERIAL PRIMARY KEY,
    usuario_id INT UNIQUE REFERENCES Usuarios(id) ON DELETE CASCADE,
    grupo_id INT REFERENCES Grupos(id) ON DELETE SET NULL,
    carrera_id INT REFERENCES Carreras(id) ON DELETE SET NULL,
    huella_dactilar BYTEA,
    estado estado_alumno_enum NOT NULL DEFAULT 'activo',
    foto_perfil_url TEXT,
    curp VARCHAR(18) UNIQUE NOT NULL,
    generacion VARCHAR(15) NOT NULL,
    fecha_ingreso DATE NOT NULL,
    semestre INT NOT NULL DEFAULT 1,
    fecha_ultima_baja DATE NULL,
    fecha_modificacion TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Tabla de Padres
CREATE TABLE Padres (
    id SERIAL PRIMARY KEY,
    nombre VARCHAR(255) NOT NULL,
    apellido_paterno VARCHAR(100) NOT NULL,
    apellido_materno VARCHAR(100) NOT NULL,
    telefono VARCHAR(15) NOT NULL,
    correo VARCHAR(255) NULL,
    direccion TEXT NULL
);

-- Relación Padres-Alumnos
CREATE TABLE Padre_Alumno (
    id SERIAL PRIMARY KEY,
    padre_id INT REFERENCES Padres(id) ON DELETE CASCADE,
    alumno_id INT REFERENCES Alumnos(id) ON DELETE CASCADE
);

-- Tabla de Materias
CREATE TABLE Materias (
    id SERIAL PRIMARY KEY,
    clave_materia VARCHAR(10) UNIQUE NOT NULL,
    nombre VARCHAR(255) NOT NULL
);

-- Tabla de Docentes
CREATE TABLE Docentes (
    id SERIAL PRIMARY KEY,
    usuario_id INT UNIQUE REFERENCES Usuarios(id) ON DELETE CASCADE,
    academia VARCHAR(100) NOT NULL
);

-- Tabla de Clases
CREATE TABLE Clases (
    id SERIAL PRIMARY KEY,
    grupo_id INT REFERENCES Grupos(id) ON DELETE CASCADE,
    docente_id INT REFERENCES Docentes(id) ON DELETE CASCADE,
    materia_id INT REFERENCES Materias(id) ON DELETE CASCADE,
    dia_semana VARCHAR(20) CHECK (dia_semana IN ('Lunes', 'Martes', 'Miércoles', 'Jueves', 'Viernes')) NOT NULL,
    hora_inicio TIME NOT NULL,
    hora_fin TIME NOT NULL,
    periodo_id INT REFERENCES Periodos(id)
);

-- Tabla de Asistencias
CREATE TABLE Asistencias (
    id SERIAL PRIMARY KEY,
    alumno_id INT REFERENCES Alumnos(id) ON DELETE CASCADE,
    clase_id INT REFERENCES Clases(id) ON DELETE CASCADE,
    fecha DATE NOT NULL,
    estado estado_asistencia_enum NOT NULL
);

-- Tabla de Justificaciones
CREATE TABLE Justificaciones (
    id SERIAL PRIMARY KEY,
    alumno_id INT REFERENCES Alumnos(id) ON DELETE CASCADE,
    fecha_a_justificar DATE NOT NULL,
    fecha_creacion TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    motivo TEXT NOT NULL,
    tipo tipo_justificacion_enum NOT NULL,
    archivo_url TEXT,
    aprobado_por INT REFERENCES Usuarios(id) ON DELETE SET NULL
);

-- Tabla de Pases de Salida
CREATE TABLE PasesSalida (
    id SERIAL PRIMARY KEY,
    alumno_id INT REFERENCES Alumnos(id) ON DELETE CASCADE,
    fecha_salida TIMESTAMP NOT NULL,
    motivo TEXT NOT NULL,
    autorizado_por INT REFERENCES Usuarios(id) ON DELETE SET NULL
);

-- Tabla de Calificaciones
CREATE TABLE Calificaciones (
    id SERIAL PRIMARY KEY,
    alumno_id INT REFERENCES Alumnos(id) ON DELETE CASCADE,
    clase_id INT REFERENCES Clases(id) ON DELETE CASCADE,
    calificacion DECIMAL(5,2) CHECK (calificacion BETWEEN 0 AND 100),
    tipo_calificacion VARCHAR(20) NOT NULL DEFAULT 'parcial',
    fecha_registro TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Tabla de Entradas y Salidas
CREATE TABLE EntradasSalidas (
    id SERIAL PRIMARY KEY,
    alumno_id INT REFERENCES Alumnos(id) ON DELETE CASCADE,
    fecha_hora TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    es_entrada BOOLEAN NOT NULL
);

-- Tabla de Incidencias
CREATE TABLE Incidencias (
    id SERIAL PRIMARY KEY,
    alumno_id INT REFERENCES Alumnos(id) ON DELETE CASCADE,
    reportado_por INT REFERENCES Usuarios(id) ON DELETE SET NULL,
    fecha TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    tipo tipo_incidencia_enum NOT NULL,
    motivo motivo_incidencia_enum NOT NULL,
    descripcion TEXT NOT NULL,
    evidencia_url TEXT,
    estado estado_incidencia_enum NOT NULL DEFAULT 'pendiente',
    seguimiento INT REFERENCES Usuarios(id) ON DELETE SET NULL
);

-- Tabla de Notificaciones
CREATE TABLE Notificaciones (
    id SERIAL PRIMARY KEY,
    usuario_id INT REFERENCES Usuarios(id) ON DELETE CASCADE,
    mensaje TEXT NOT NULL,
    titulo VARCHAR(255) NOT NULL,
    fecha TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    leida BOOLEAN DEFAULT FALSE
);

CREATE TABLE system_config (
 id SERIAL PRIMARY KEY,
 config_key VARCHAR(100) UNIQUE NOT NULL,
 config_value TEXT NOT NULL,
 description TEXT,
 is_public BOOLEAN DEFAULT false,
 is_editable BOOLEAN DEFAULT true,
 created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
 updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
 updated_by INT REFERENCES usuarios(id)
);

CREATE INDEX idx_system_config_key ON system_config(config_key);
CREATE INDEX idx_system_config_public ON system_config(is_public);

CREATE OR REPLACE FUNCTION update_system_config_timestamp()
RETURNS TRIGGER AS $$
BEGIN
 NEW.updated_at = CURRENT_TIMESTAMP;
 RETURN NEW;
END;
$$ LANGUAGE plpgsql;
CREATE TRIGGER trg_update_system_config_timestamp
 BEFORE UPDATE ON system_config
 FOR EACH ROW
 EXECUTE FUNCTION update_system_config_timestamp();

-- Función y Trigger para actualizar el semestre considerando bajas temporales
CREATE OR REPLACE FUNCTION actualizar_semestre()
RETURNS TRIGGER AS $$
DECLARE
    tiempo_pausado INTERVAL;
    fecha_base DATE;
BEGIN
    IF NEW.estado = 'baja_temporal' THEN
        NEW.fecha_ultima_baja := CURRENT_DATE;
        RETURN NEW;
    ELSIF NEW.estado = 'activo' THEN
        IF OLD.estado = 'baja_temporal' AND OLD.fecha_ultima_baja IS NOT NULL THEN
            tiempo_pausado := CURRENT_DATE - OLD.fecha_ultima_baja;
            fecha_base := OLD.fecha_ingreso + tiempo_pausado;
        ELSE
            fecha_base := NEW.fecha_ingreso;
        END IF;

        NEW.semestre := 1 + (EXTRACT(YEAR FROM CURRENT_DATE) - EXTRACT(YEAR FROM fecha_base)) * 2 +
            CASE WHEN EXTRACT(MONTH FROM CURRENT_DATE) >= 8 THEN 1 ELSE 0 END;
    END IF;

    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE OR REPLACE TRIGGER trg_actualizar_semestre
BEFORE INSERT OR UPDATE ON Alumnos
FOR EACH ROW
EXECUTE FUNCTION actualizar_semestre();

CREATE OR REPLACE FUNCTION actualizar_fecha_modificacion()
RETURNS TRIGGER AS $$
BEGIN
  NEW.fecha_modificacion = CURRENT_TIMESTAMP;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS trg_actualizar_fecha_modificacion ON usuarios;

CREATE TRIGGER trg_actualizar_fecha_modificacion
BEFORE UPDATE ON usuarios
FOR EACH ROW
EXECUTE FUNCTION actualizar_fecha_modificacion();

-- Trigger para mantener fecha_modificacion
CREATE OR REPLACE FUNCTION set_alumnos_fecha_modificacion()
RETURNS TRIGGER AS $$
BEGIN
  NEW.fecha_modificacion = CURRENT_TIMESTAMP;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;


CREATE TRIGGER trg_set_alumnos_fecha_modificacion
BEFORE UPDATE ON Alumnos
FOR EACH ROW
EXECUTE FUNCTION set_alumnos_fecha_modificacion();

CREATE UNIQUE INDEX asistencia_unique_idx 
ON asistencias (alumno_id, clase_id, fecha);

CREATE UNIQUE INDEX idx_usuarios_matricula 
ON usuarios (matricula);

CREATE INDEX idx_usuario_rol_usuario_id ON Usuario_Rol(usuario_id);
CREATE INDEX idx_alumnos_grupo_id ON Alumnos(grupo_id);
CREATE INDEX idx_alumnos_carrera_id ON Alumnos(carrera_id);
CREATE INDEX idx_clases_grupo_id ON Clases(grupo_id);
CREATE INDEX idx_clases_docente_id ON Clases(docente_id);
CREATE INDEX idx_clases_materia_id ON Clases(materia_id);
CREATE INDEX idx_asistencias_alumno_fecha ON Asistencias(alumno_id, fecha);
CREATE INDEX idx_justificaciones_alumno_fecha ON Justificaciones(alumno_id, fecha_a_justificar);
CREATE INDEX idx_incidencias_alumno_fecha ON Incidencias(alumno_id, fecha);
CREATE INDEX idx_notificaciones_usuario_id ON Notificaciones(usuario_id);

CREATE INDEX IF NOT EXISTS idx_usuarios_fecha_mod ON usuarios(fecha_modificacion);
CREATE INDEX IF NOT EXISTS idx_usuarios_fecha_crea ON usuarios(fecha_creacion);

CREATE INDEX IF NOT EXISTS idx_alumnos_fecha_mod ON alumnos(fecha_modificacion);
CREATE INDEX IF NOT EXISTS idx_alumnos_fecha_ingreso ON alumnos(fecha_ingreso);
CREATE INDEX IF NOT EXISTS idx_alumnos_estado ON alumnos(estado);







