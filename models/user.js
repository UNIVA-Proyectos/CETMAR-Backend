const db = require("../config/config");
const bcrypt = require("bcryptjs");

const User = {};

//Obtener todos los usuarios
User.getAll = () => {
  const sql = `
    SELECT 
      id,
      TRIM(nombre) AS nombre,
      TRIM(apellido_paterno) AS apellido_paterno,
      TRIM(apellido_materno) AS apellido_materno,
      TRIM(matricula) AS matricula,
      contraseña,
      TRIM(correo) AS correo,
      telefono,
      fecha_creacion
    FROM usuarios;
  `;
  return db.manyOrNone(sql);
};

//Buscar usuario por matrícula e incluir sus roles
User.findByMatricula = async (matricula) => {
  if (!matricula) throw new Error("La matrícula es requerida");

  const userSql = `
    SELECT 
      id, matricula, nombre, apellido_paterno, apellido_materno, 
      contraseña, telefono
    FROM usuarios
    WHERE matricula = $1
  `;

  const user = await db.oneOrNone(userSql, matricula);
  if (!user) return null;

  // Obtener roles del usuario
  const roles = await User.getRolesByUserId(user.id);
  user.roles = roles;

  return user;
};

// 📌 Obtener roles de un usuario
User.getRolesByUserId = async (id) => {
  const sql = "SELECT rol FROM Usuario_Rol WHERE usuario_id = $1";
  const roles = await db.manyOrNone(sql, id);
  return roles.map((row) => row.rol);
};

// 📌 Buscar usuario por ID e incluir sus roles
User.findByUserId = async (id) => {
  const userSql = `
    SELECT 
      id, matricula, nombre, apellido_paterno, apellido_materno, 
      contraseña, correo, telefono
    FROM usuarios
    WHERE id = $1
  `;

  const user = await db.oneOrNone(userSql, id);
  if (!user) return null;

  // Obtener roles del usuario
  const roles = await User.getRolesByUserId(user.id);
  user.roles = roles;

  return user;
};

// 📌 Crear un usuario con roles
User.create = async (user, roles) => {
  // Generar hash de la contraseña
  const hashedPassword = await bcrypt.hash(user.contraseña, 10);

  const userSql = `
    INSERT INTO usuarios 
      (matricula, nombre, apellido_paterno, apellido_materno, correo, contraseña, telefono, fecha_creacion)
    VALUES ($1, $2, $3, $4, $5, $6, $7, NOW()) 
    RETURNING id;
  `;

  // Insertar usuario
  const newUser = await db.one(userSql, [
    user.matricula,
    user.nombre,
    user.apellido_paterno,
    user.apellido_materno,
    user.correo,
    hashedPassword,
    user.telefono || null,
  ]);

  // Insertar roles
  if (roles && roles.length > 0) {
    const roleSql = `
      INSERT INTO Usuario_Rol (usuario_id, rol)
      VALUES ${roles.map((_, i) => `(${newUser.id}, $${i + 1})`).join(", ")}
    `;
    await db.none(roleSql, roles);
  }

  return newUser;
};

// 📌 Actualizar datos del usuario
User.update = async (user) => {
  const sql = `
    UPDATE usuarios
    SET 
      nombre = $2,
      apellido_paterno = $3,
      apellido_materno = $4,
      telefono = $5,
      correo = $6
    WHERE id = $1
  `;
  await db.none(sql, [
    user.id,
    user.nombre,
    user.apellido_paterno,
    user.apellido_materno,
    user.telefono,
    user.correo,
  ]);

  // 📌 Si hay nuevos roles, actualizar
  if (user.roles && user.roles.length > 0) {
    await db.none(`DELETE FROM Usuario_Rol WHERE usuario_id = $1`, [user.id]);

    const roleSql = `
      INSERT INTO Usuario_Rol (usuario_id, rol)
      VALUES ${user.roles.map((_, i) => `(${user.id}, $${i + 1})`).join(", ")}
    `;
    await db.none(roleSql, user.roles);
  }
};

User.getProfileByRoles = async (id, roles) => {
  let profileData = { id };

  if (roles.includes("docente")) {
    const docenteData = await db.oneOrNone(
      "SELECT * FROM docentes WHERE usuario_id = $1",
      [id]
    );
    profileData = { ...profileData, ...docenteData };
  }

  if (roles.includes("alumno")) {
    const alumnoData = await db.oneOrNone(
      "SELECT * FROM alumnos WHERE usuario_id = $1",
      [id]
    );
    profileData = { ...profileData, ...alumnoData };
  }

  return profileData;
};

module.exports = User;
