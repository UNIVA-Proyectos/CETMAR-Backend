const db = require("../config/config");

const Bridge = {};

Bridge.getUsuariosParaSync = async (updated_since) => {
  let query = `
    SELECT
      u.id,
      u.matricula,
      u.nombre,
      u.apellido_paterno,
      u.apellido_materno,
      a.id AS alumno_id
    FROM
      usuarios u
    JOIN
      alumnos a ON a.usuario_id = u.id
    WHERE
      a.estado = 'activo'
    AND (u.fecha_creacion >= $1 OR u.fecha_modificacion >= $1)
  `;

  const usuarios = await db.manyOrNone(query, [updated_since]);
  return usuarios.map((usuario) => ({
    id: usuario.id,
    matricula: usuario.matricula,
    nombre: usuario.nombre,
    apellido_paterno: usuario.apellido_paterno,
    apellido_materno: usuario.apellido_materno,
    alumno_id: usuario.alumno_id,
  }));
};

// Guardar entradas y salidas en lote usando transacciones de pg-promise
Bridge.guardarEntradasSalidasLote = async (logs) => {
  return await db.tx(async (t) => {
    const queries = logs.map((log) => {
      return t.none(
        `INSERT INTO entradassalidas (alumno_id, fecha_hora, es_entrada) 
         VALUES ($1, $2, $3)`,
        [log.alumno_id, log.fecha_hora || new Date(), log.es_entrada]
      );
    });

    await t.batch(queries);
    return logs.length;
  });
};

module.exports = Bridge;
