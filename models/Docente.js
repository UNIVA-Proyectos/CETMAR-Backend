const db = require("../config/config");

const Docente = {};

Docente.getAllDocentes = () => {
  const sql = `
    SELECT 
      d.id,
      u.id as usuario_id,
      d.academia,
      u.nombre,
      u.apellido_paterno,
      u.apellido_materno,
      u.correo,
      u.telefono,
      u.fecha_creacion
    FROM usuarios u
    INNER JOIN Usuario_Rol ur ON u.id = ur.usuario_id
    LEFT JOIN docentes d ON u.id = d.usuario_id
    WHERE ur.rol = 'docente'
    GROUP BY d.id, u.id, d.academia, u.nombre, u.apellido_paterno, u.apellido_materno, u.correo, u.telefono, u.fecha_creacion
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
