CREATE OR REPLACE FUNCTION actualizar_semestre()
RETURNS TRIGGER AS $$
BEGIN
    -- Solo actualizar si el alumno NO está en baja temporal o egresado
    IF NEW.estado NOT IN ('baja temporal', 'egresado') THEN
        NEW.semestre := 1 + (EXTRACT(YEAR FROM CURRENT_DATE) - EXTRACT(YEAR FROM NEW.fecha_ingreso)) * 2 +
            CASE WHEN EXTRACT(MONTH FROM CURRENT_DATE) >= 8 THEN 1 ELSE 0 END;
    END IF;
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;
 
CREATE TRIGGER trg_actualizar_semestre
BEFORE INSERT OR UPDATE ON Alumnos
FOR EACH ROW
EXECUTE FUNCTION actualizar_semestre();

-- Creación del ENUM para estado del alumno
DO $$ BEGIN
    CREATE TYPE estado_alumno_enum AS ENUM ('activo', 'baja_definitiva', 'baja_temporal', 'egresado');
EXCEPTION
    WHEN duplicate_object THEN null;
END $$;
 
-- Creación del ENUM para motivo incidencia
DO $$ BEGIN
    CREATE TYPE motivo_incidencia_enum AS ENUM ('Académico', 'Conducta', 'Uniforme', 'Inasistencia', 'Otro');
EXCEPTION
    WHEN duplicate_object THEN null;
END $$;
 
-- Creación del ENUM para tipo incidencia
DO $$ BEGIN
    CREATE TYPE tipo_incidencia_enum AS ENUM ('Confidencial', 'Educativo');
EXCEPTION
    WHEN duplicate_object THEN null;
END $$;
 
-- Creación del ENUM para tipo de usuario
DO $$ BEGIN
    CREATE TYPE tipo_usuario_enum AS ENUM ('superadmin', 'directivo', 'administrativo', 'docente', 'tutor', 'padre', 'alumno');
EXCEPTION
    WHEN duplicate_object THEN null;
END $$;
-- Creación del ENUM para tipo de justificación
DO $$ BEGIN
    CREATE TYPE tipo_justificacion_enum AS ENUM ('medica', 'actividad_clase', 'llamada_padres', 'otro');
EXCEPTION
    WHEN duplicate_object THEN null;
END $$;
-- Creación del ENUM para asistencias
DO $$ BEGIN
    CREATE TYPE estado_asistencia_enum AS ENUM ('presente', 'ausente', 'retardo', 'justificado');
EXCEPTION
    WHEN duplicate_object THEN null;
END $$;
-- Tabla de Usuarios (Base para todos los roles)
CREATE TABLE Usuarios (
    id SERIAL PRIMARY KEY,
    nombre VARCHAR(255) NOT NULL,
    apellido_paterno VARCHAR(100) NOT NULL,
	apellido_materno VARCHAR(100) NOT NULL,
    matricula VARCHAR(20) UNIQUE NOT NULL,
    contraseña VARCHAR(255) NOT NULL,
    tipo_usuario tipo_usuario_enum NOT NULL,
    correo VARCHAR(255) UNIQUE NOT NULL,
    telefono VARCHAR(15),
    fecha_creacion TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);
-- Tabla de Carreras Técnicas
CREATE TABLE Carreras (
    id SERIAL PRIMARY KEY,
    nombre VARCHAR(255) UNIQUE NOT NULL,
	abreviatura VARCHAR(50) NOT NULL
);
-- Tabla de Grupos
CREATE TABLE Grupos (
    id SERIAL PRIMARY KEY,
    nombre VARCHAR(50) NOT NULL,
    tutor_id INT REFERENCES Usuarios(id) ON DELETE SET NULL
);
-- Tabla de Alumnos
CREATE TABLE Alumnos (
    id SERIAL PRIMARY KEY,
    usuario_id INT UNIQUE REFERENCES Usuarios(id) ON DELETE CASCADE,
    grupo_id INT REFERENCES Grupos(id) ON DELETE SET NULL,
    carrera_id INT REFERENCES Carreras(id) ON DELETE SET NULL,
    huella_dactilar BYTEA, -- Guarda la huella en binario
    estado estado_alumno_enum NOT NULL DEFAULT 'activo',
	foto_perfil_url TEXT,
    curp VARCHAR(18) UNIQUE NOT NULL,
    generacion VARCHAR(9) NOT NULL, -- Ejemplo: "2023-2026"
    fecha_ingreso DATE NOT NULL, 
    semestre INT NOT NULL DEFAULT 1 
);
-- Tabla de Padres (Sin relación con Usuarios)
CREATE TABLE Padres (
    id SERIAL PRIMARY KEY,
    nombre VARCHAR(255) NOT NULL,
    apellido_paterno VARCHAR(100) NOT NULL,
	apellido_materno VARCHAR(100) NOT NULL,
    telefono VARCHAR(15) NOT NULL,
    correo VARCHAR(255) NULL,
    direccion TEXT NULL
);
-- Relación entre Padres y Alumnos (Un padre puede tener varios hijos)
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
-- Tabla de Clases (Relación entre Grupos, Docentes, Materias y Horarios)
CREATE TABLE Clases (
    id SERIAL PRIMARY KEY,
    grupo_id INT REFERENCES Grupos(id) ON DELETE CASCADE,
    docente_id INT REFERENCES Docentes(id) ON DELETE CASCADE,
    materia_id INT REFERENCES Materias(id) ON DELETE CASCADE,
    dia_semana VARCHAR(20) CHECK (dia_semana IN ('Lunes', 'Martes', 'Miércoles', 'Jueves', 'Viernes')) NOT NULL,
    hora_inicio TIME NOT NULL,
    hora_fin TIME NOT NULL
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
    archivo_url TEXT, -- Para almacenar el archivo si se requiere
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
    fecha_registro TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);
-- Tabla de Entradas y Salidas con huella dactilar
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
    motivo  motivo_incidencia_enum NOT NULL,
    descripcion TEXT NOT NULL,
	evidencia_url TEXT,
    estado VARCHAR(20) CHECK (estado IN ('pendiente', 'revisado', 'resuelto')) DEFAULT 'pendiente',
	seguimiento INT REFERENCES Usuarios(id) ON DELETE SET NULL
);

-- Tabla de Notificaciones
CREATE TABLE Notificaciones (
    id SERIAL PRIMARY KEY,
    usuario_id INT REFERENCES Usuarios(id) ON DELETE CASCADE,
    mensaje TEXT NOT NULL,
    fecha TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    leido BOOLEAN DEFAULT FALSE
);