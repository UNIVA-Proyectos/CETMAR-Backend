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
  return db.manyOrNone("SELECT * FROM Incidencias ORDER BY fecha DESC");
};

// Obtener incidencia por ID
Incidencia.getById = (id) => {
  return db.oneOrNone("SELECT * FROM Incidencias WHERE id = $1", [id]);
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