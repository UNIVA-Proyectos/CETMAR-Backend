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
    id,
    matricula,
    nombres,
    apellido_paterno,
    apellido_materno,
    contraseña,
    correo,
    tipo_usuario AS role
    FROM usuarios
    WHERE id = $1
    `;
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
User.getProfileByRole = (id, role) => {
  let sql = `
    SELECT 
      u.id, u.nombres, u.apellido_paterno, u.apellido_materno,
  `;

  // Agregar campos específicos según el rol
  if (role === "alumno") {
    sql += `
      a.semestre, a.estado, a.curp, a.generacion, a.foto_perfil_url, 
      c.nombre AS carrera, g.nombre AS grupo,
      ARRAY_AGG(DISTINCT m.nombre) AS materias
    FROM usuarios u
    JOIN alumnos a ON a.usuario_id = u.id
    LEFT JOIN carreras c ON a.carrera_id = c.id
    LEFT JOIN grupos g ON a.grupo_id = g.id
    LEFT JOIN clases cl ON cl.grupo_id = g.id
    LEFT JOIN materias m ON m.id = cl.materia_id
    WHERE u.id = $1
    GROUP BY u.id, a.semestre, a.estado, a.curp, a.generacion, a.foto_perfil_url, c.nombre, g.nombre;
    `;
  } else if (role === "docente") {
    sql += `
      d.academia,
      ARRAY_AGG(DISTINCT m.nombre) AS materias_impartidas,
      ARRAY_AGG(DISTINCT g.nombre) AS grupos_asignados
    FROM usuarios u
    JOIN docentes d ON d.usuario_id = u.id
    LEFT JOIN clases cl ON cl.docente_id = d.id
    LEFT JOIN materias m ON m.id = cl.materia_id
    LEFT JOIN grupos g ON g.id = cl.grupo_id
    WHERE u.id = $1
    GROUP BY u.id, d.academia;
    `;
  } else if (role === "tutor") {
    sql += `
      ARRAY_AGG(DISTINCT g.nombre) AS grupos_tutorados
    FROM usuarios u
    JOIN grupos g ON g.tutor_id = u.id
    WHERE u.id = $1
    GROUP BY u.id;
    `;
  } else if (role === "directivo" || role === "administrativo") {
    sql += `
      u.tipo_usuario
    FROM usuarios u
    WHERE u.id = $1;
    `;
  }

  // Ejecutar la consulta con el ID del usuario
  return db.oneOrNone(sql, [id]);
};

module.exports = User;
