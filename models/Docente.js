const db = require("../config/config");

const Docente = {};

Docente.getAllDocentes = () => {
  const sql = `
    SELECT 
      d.id,
      d.usuario_id,
      d.academia,
      u.nombre,
      u.apellido_paterno,
      u.apellido_materno
    FROM docentes d
    INNER JOIN usuarios u ON d.usuario_id = u.id
    ORDER BY u.nombre;
  `;
  return db.manyOrNone(sql);
};

Docente.findById = (id) => {
  return db.oneOrNone("SELECT * FROM docentes WHERE id = $1;", [id]);
};

Docente.findByMatricula = (matricula) => {
  return db.oneOrNone(
    "SELECT * FROM docentes WHERE usuario_id = (SELECT id FROM usuarios WHERE matricula = $1);",
    [matricula]
  );
};

Docente.create = (docente) => {
  const sql = `
    INSERT INTO docentes (usuario_id, academia, password)
    VALUES ($1, $2, $3) RETURNING id;
  `;
  return db.one(sql, [docente.usuario_id, docente.academia, docente.password]);
};

Docente.update = (docente) => {
  const sql = `
    UPDATE docentes
    SET academia = $2
    WHERE id = $1;
  `;
  return db.none(sql, [docente.id, docente.academia]);
};

module.exports = Docente;
