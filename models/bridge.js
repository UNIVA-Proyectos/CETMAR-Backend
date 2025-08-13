const db = require("../config/config");

const Bridge = {};

Bridge.getUsuariosParaSync = async (
  updated_since,
  limit = 100,
  after_last_update = null,
  after_last_id = null
) => {
  const query = `
    SELECT
      u.id,
      u.matricula,
      u.nombre,
      u.apellido_paterno,
      u.apellido_materno,
      a.id AS alumno_id,
      a.estado,
      GREATEST(
        COALESCE(u.fecha_modificacion, u.fecha_creacion),
        COALESCE(a.fecha_modificacion, a.fecha_ingreso),
        COALESCE(a.fecha_ultima_baja, '1970-01-01')
      ) AS last_update
    FROM
      usuarios u
    JOIN
      alumnos a ON a.usuario_id = u.id
    WHERE
      GREATEST(
        COALESCE(u.fecha_modificacion, u.fecha_creacion),
        COALESCE(a.fecha_modificacion, a.fecha_ingreso),
        COALESCE(a.fecha_ultima_baja, '1970-01-01')
      ) >= $1
      AND (
        $3::timestamp IS NULL OR
        (
          GREATEST(
            COALESCE(u.fecha_modificacion, u.fecha_creacion),
            COALESCE(a.fecha_modificacion, a.fecha_ingreso),
            COALESCE(a.fecha_ultima_baja, '1970-01-01')
          ) > $3::timestamp
          OR (
            GREATEST(
              COALESCE(u.fecha_modificacion, u.fecha_creacion),
              COALESCE(a.fecha_modificacion, a.fecha_ingreso),
              COALESCE(a.fecha_ultima_baja, '1970-01-01')
            ) = $3::timestamp
            AND u.id > $4::int
          )
        )
      )
    ORDER BY last_update, u.id
    LIMIT $2
  `;

  const params = [
    updated_since,
    limit,
    after_last_update || null,
    after_last_id || null,
  ];

  const rows = await db.manyOrNone(query, params);
  const has_more = rows.length === limit;
  const next_last_update = has_more ? rows[rows.length - 1].last_update : null;
  const next_last_id = has_more ? rows[rows.length - 1].id : null;

  return {
    usuarios: rows,
    has_more,
    next_last_update,
    next_last_id,
  };
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
