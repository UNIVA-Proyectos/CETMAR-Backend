const db = require("../config/config");

const Periodo = {
    getAll: async () => {
        const sql = `
      SELECT id, nombre, fecha_inicio, fecha_fin
      FROM periodos
      ORDER BY fecha_inicio DESC;
    `;
        return db.manyOrNone(sql);
    },

    findById: async (id) => {
        const sql = `
      SELECT id, nombre, fecha_inicio, fecha_fin
      FROM periodos
      WHERE id = $1;
    `;
        return db.oneOrNone(sql, [id]);
    },

    getCurrentPeriodo: async () => {
        const sql = `
      SELECT id, nombre, fecha_inicio, fecha_fin
      FROM periodos
      WHERE fecha_inicio <= CURRENT_DATE AND fecha_fin >= CURRENT_DATE
      LIMIT 1;
    `;
        return db.oneOrNone(sql);
    },

    create: async (periodoData) => {
        const sql = `
      INSERT INTO periodos (nombre, fecha_inicio, fecha_fin)
      VALUES ($1, $2, $3)
      RETURNING id;
    `;
        return db.one(sql, [periodoData.nombre, periodoData.fecha_inicio, periodoData.fecha_fin]);
    },

    update: async (id, periodoData) => {
        const sql = `
      UPDATE periodos
      SET nombre = $2, fecha_inicio = $3, fecha_fin = $4
      WHERE id = $1;
    `;
        return db.none(sql, [id, periodoData.nombre, periodoData.fecha_inicio, periodoData.fecha_fin]);
    },

    delete: async (id) => {
        const sql = `DELETE FROM periodos WHERE id = $1;`;
        return db.none(sql, [id]);
    }
};

module.exports = Periodo;
