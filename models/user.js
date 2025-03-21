const db = require("../config/config");
const crypto = require("crypto");

const User = {};

User.getAll = () => {
  const sql = `SELECT 
    id,
    TRIM(nombres) AS nombres,
    TRIM(apellido_paterno) AS apellido_paterno,
    TRIM(apellido_materno) AS apellido_materno,
    TRIM(matricula) AS matricula,
    contraseña,
    tipo_usuario,
    TRIM(correo) AS correo,
    telefono,
    fecha_creacion
FROM usuarios;
`;
  return db.manyOrNone(sql);
};

User.findByMatricula = async (matricula) => {
  if (!matricula) {
    throw new Error("La matrícula es requerida para la consulta");
  }

  const sql = `
    SELECT 
      id,
      matricula,
      nombres,
      apellido_paterno,
      apellido_materno,
      contraseña
    FROM usuarios
    WHERE matricula = $1
  `;

  return db.oneOrNone(sql, matricula);
};

User.findByUserId = (id) => {
  const sql = `
  SELECT 
      matricula,
      nombres,
      apellido_paterno,
      apellido_materno,
      contraseña,
      correo,
      tipo_usuario
    FROM usuarios
    WHERE id = $1`;
  return db.oneOrNone(sql, id);
};

User.create = (user) => {
  const myPasswordHashed = crypto
    .createHash("md5")
    .update(user.password)
    .digest("hex");

  user.password = myPasswordHashed;
  const sql = `
    INSERT INTO users (email, name, lastname , phone, image,  password, created_at, updated_at)
    VALUES($1, $2, $3, $4, $5, $6, $7, $8) RETURNING id
    `;

  return db.oneOrNone(sql, [
    user.email,
    user.name,
    user.lastname,
    user.phone,
    user.image,
    user.password,
    new Date(),
    new Date(),
  ]);
};

User.update = (user) => {
  const sql = `
    UPDATE users
      SET
        name = $2,
        lastname = $3,
        phone = $4,
        image = $5,
        updated_at = $6
      WHERE
        id = $1
    `;
  return db.none(sql, [
    user.id,
    user.name,
    user.lastname,
    user.phone,
    user.image,
    new Date(),
  ]);
};

module.exports = User;
