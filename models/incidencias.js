const db = require("../config/config");

const Incidencia = {};

// Crear incidencia
Incidencia.create = async (data) => {
  const sql = `
    INSERT INTO Incidencias 
      (alumno_id, reportado_por, tipo, motivo, descripcion, evidencia_url, estado, seguimiento)
    VALUES ($1, $2, $3, $4, $5, $6, $7, $8)
    RETURNING *;
  `;
  return db.one(sql, [
    data.alumno_id,
    data.reportado_por,
    data.tipo,
    data.motivo,
    data.descripcion,
    data.evidencia_url || null,
    data.estado || "pendiente",
    data.seguimiento || null,
  ]);
};

// Obtener todas las incidencias
Incidencia.getAll = () => {
  const sql = `
    SELECT 
      i.*,
      u.nombre as estudiante_nombre,
      u.apellido_paterno as estudiante_apellido_paterno,
      u.apellido_materno as estudiante_apellido_materno,
      g.nombre as grupo_nombre,
      c.nombre as carrera_nombre
    FROM Incidencias i
    LEFT JOIN Alumnos a ON i.alumno_id = a.id
    LEFT JOIN Usuarios u ON a.usuario_id = u.id
    LEFT JOIN Grupos g ON a.grupo_id = g.id
    LEFT JOIN Carreras c ON a.carrera_id = c.id
    ORDER BY i.fecha DESC
  `;
  return db.manyOrNone(sql);
};

// Obtener incidencia por ID
Incidencia.getById = (id) => {
  const sql = `
    SELECT 
      i.*,
      u.nombre as estudiante_nombre,
      u.apellido_paterno as estudiante_apellido_paterno,
      u.apellido_materno as estudiante_apellido_materno,
      g.nombre as grupo_nombre,
      c.nombre as carrera_nombre
    FROM Incidencias i
    LEFT JOIN Alumnos a ON i.alumno_id = a.id
    LEFT JOIN Usuarios u ON a.usuario_id = u.id
    LEFT JOIN Grupos g ON a.grupo_id = g.id
    LEFT JOIN Carreras c ON a.carrera_id = c.id
    WHERE i.id = $1
  `;
  return db.oneOrNone(sql, [id]);
};

// Actualizar incidencia
Incidencia.update = async (id, data) => {
  const sql = `
    UPDATE Incidencias
    SET
      alumno_id = $2,
      reportado_por = $3,
      tipo = $4,
      motivo = $5,
      descripcion = $6,
      evidencia_url = $7,
      estado = $8,
      seguimiento = $9
    WHERE id = $1
    RETURNING *;
  `;
  return db.one(sql, [
    id,
    data.alumno_id,
    data.reportado_por,
    data.tipo,
    data.motivo,
    data.descripcion,
    data.evidencia_url || null,
    data.estado || "pendiente",
    data.seguimiento || null,
  ]);
};

// Eliminar incidencia
Incidencia.delete = (id) => {
  return db.result("DELETE FROM Incidencias WHERE id = $1", [id]);
};

module.exports = Incidencia;