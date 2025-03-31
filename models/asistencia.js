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
Asistencia.create = (asistencia) => {
  const sql = `
    INSERT INTO asistencias (alumno_id, clase_id, fecha, estado)
    VALUES ($1, $2, $3, $4)
    RETURNING id;
  `;
  return db.one(sql, [
    asistencia.alumno_id,
    asistencia.clase_id,
    asistencia.fecha,
    asistencia.estado.toLowerCase(),
  ]);
};

module.exports = Asistencia;