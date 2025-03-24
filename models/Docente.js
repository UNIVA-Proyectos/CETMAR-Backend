const db = require("../config/config");

const Docente = {};

Docente.getAllDocentes = () => {
  return db.manyOrNone("SELECT * FROM docentes;");
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
