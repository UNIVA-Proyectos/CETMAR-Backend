const db = require("../config/config");

const Asistencia = {};

// Obtener todas las asistencias
Asistencia.getAll = () => {
  return db.manyOrNone("SELECT * FROM asistencias ORDER BY fecha DESC;");
};

// Obtener una asistencia por ID
Asistencia.findById = (id) => {
  return db.oneOrNone("SELECT * FROM asistencias WHERE id = $1;", [id]);
};

// Obtener asistencias por alumno
Asistencia.findByAlumno = (alumno_id) => {
  return db.manyOrNone(
    "SELECT * FROM asistencias WHERE alumno_id = $1 ORDER BY fecha DESC;",
    [alumno_id]
  );
};

// Obtener asistencias por clase
Asistencia.findByClase = (clase_id) => {
  return db.manyOrNone(
    "SELECT * FROM asistencias WHERE clase_id = $1 ORDER BY fecha DESC;",
    [clase_id]
  );
};

// Registrar una nueva asistencia
// Método para registrar asistencias en lote
Asistencia.createMasiva = async (asistencias, docente_usuario_id) => {
  const estadosPermitidos = ["presente", "retardo", "ausente", "justificado"];
  const fechaActual = new Date();
  const diaSemana = fechaActual.toLocaleDateString("es-MX", {
    weekday: "long",
  });

  const horaActual = fechaActual.toTimeString().split(" ")[0]; // formato HH:MM:SS

  const docente = await db.oneOrNone(
    "SELECT id FROM docentes WHERE usuario_id = $1;",
    [docente_usuario_id]
  );
  if (!docente) throw new Error("Docente no encontrado");

  // Validar que haya una clase correspondiente al horario actual
  const clasesValidas = await db.manyOrNone(
    `SELECT id FROM clases
     WHERE docente_id = $1
       AND dia_semana ILIKE $2
       AND $3::time BETWEEN hora_inicio AND hora_fin`,
    [docente.id, diaSemana, horaActual]
  );

  const clasesPermitidas = clasesValidas.map((c) => c.id);

  const datosValidos = asistencias.filter(
    (a) =>
      a.alumno_id &&
      a.clase_id &&
      a.fecha &&
      a.estado &&
      estadosPermitidos.includes(a.estado.toLowerCase()) &&
      clasesPermitidas.includes(a.clase_id)
  );

  if (datosValidos.length === 0) {
    throw new Error(
      "No hay asistencias válidas dentro del horario y día permitido"
    );
  }

  return db.tx(async (t) => {
    const inserciones = datosValidos.map((a) => {
      return t.none(
        `INSERT INTO asistencias (alumno_id, clase_id, fecha, estado)
         VALUES ($1, $2, $3, $4)
         ON CONFLICT (alumno_id, clase_id, fecha) DO NOTHING;`,
        [a.alumno_id, a.clase_id, a.fecha, a.estado.toLowerCase()]
      );
    });
    await t.batch(inserciones);
    return datosValidos.length;
  });
};

Asistencia.updateEstadosMasivos = async (updates) => {
  const estadosPermitidos = ["presente", "retardo", "ausente", "justificado"];

  return db.tx(async (t) => {
    for (let { id, estado } of updates) {
      if (!estadosPermitidos.includes(estado.toLowerCase())) {
        throw new Error(`Estado inválido: ${estado}`);
      }

      await t.none("UPDATE asistencias SET estado = $1 WHERE id = $2", [
        estado.toLowerCase(),
        id,
      ]);
    }
  });
};

Asistencia.findByClaseYFecha = (clase_id, fecha) => {
  const sql = `
    SELECT 
      a.id,
      a.alumno_id,
      u.nombre AS nombre_alumno,
      u.apellido_paterno,
      u.apellido_materno,
      a.clase_id,
      a.fecha,
      a.estado
    FROM asistencias a
    JOIN alumnos al ON a.alumno_id = al.id
    JOIN usuarios u ON al.usuario_id = u.id
    WHERE a.clase_id = $1 AND a.fecha = $2
    ORDER BY u.apellido_paterno, u.apellido_materno;
  `;
  return db.manyOrNone(sql, [clase_id, fecha]);
};

module.exports = Asistencia;
