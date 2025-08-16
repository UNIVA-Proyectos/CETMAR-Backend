const db = require("../config/config");
const bcrypt = require("bcryptjs");

const User = {};

//Obtener todos los usuarios con sus roles
User.getAll = async () => {
  const sql = `
    SELECT 
      u.id,
      TRIM(u.nombre) AS nombre,
      TRIM(u.apellido_paterno) AS apellido_paterno,
      TRIM(u.apellido_materno) AS apellido_materno,
      TRIM(u.matricula) AS matricula,
      u.contraseña,
      TRIM(u.correo) AS correo,
      u.telefono,
      u.fecha_creacion,
      ARRAY_AGG(ur.rol) FILTER (WHERE ur.rol IS NOT NULL) AS roles
    FROM usuarios u
    LEFT JOIN Usuario_Rol ur ON u.id = ur.usuario_id
    GROUP BY u.id, u.nombre, u.apellido_paterno, u.apellido_materno, 
             u.matricula, u.contraseña, u.correo, u.telefono, u.fecha_creacion;
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
  let profileData = { id, roles }; // 🔹 Ahora se incluyen TODOS los roles en el perfil

  // 🔹 Si el usuario es alumno
  if (roles.includes("alumno")) {
    const alumnoData = await db.oneOrNone(
      `SELECT 
        a.semestre, a.estado, a.curp, a.generacion, a.foto_perfil_url, 
        c.nombre AS carrera, g.nombre AS grupo,
        ARRAY_AGG(DISTINCT m.nombre) AS materias
      FROM alumnos a
      LEFT JOIN carreras c ON a.carrera_id = c.id
      LEFT JOIN grupos g ON a.grupo_id = g.id
      LEFT JOIN clases cl ON cl.grupo_id = g.id
      LEFT JOIN materias m ON m.id = cl.materia_id
      WHERE a.usuario_id = $1
      GROUP BY a.id, c.nombre, g.nombre;`,
      [id]
    );

    if (alumnoData) {
      profileData.alumno = alumnoData; // 🔹 Se guarda en una clave específica
    }
  }

  // 🔹 Si el usuario es docente
  if (roles.includes("docente")) {
    const docenteData = await db.oneOrNone(
      `SELECT 
        d.academia,
        ARRAY_AGG(DISTINCT m.nombre) AS materias_impartidas,
        ARRAY_AGG(DISTINCT g.nombre) AS grupos_asignados
      FROM docentes d
      LEFT JOIN clases cl ON cl.docente_id = d.id
      LEFT JOIN materias m ON m.id = cl.materia_id
      LEFT JOIN grupos g ON g.id = cl.grupo_id
      WHERE d.usuario_id = $1
      GROUP BY d.id;`,
      [id]
    );

    if (docenteData) {
      profileData.docente = docenteData; // 🔹 Se guarda separado
    }
  }

  // 🔹 Si el usuario es tutor
  if (roles.includes("tutor")) {
    const tutorData = await db.oneOrNone(
      `SELECT 
        ARRAY_AGG(DISTINCT g.nombre) AS grupos_tutorados
      FROM grupos g
      WHERE g.tutor_id = $1
      GROUP BY g.tutor_id;`,
      [id]
    );

    if (tutorData) {
      profileData.tutor = tutorData;
    }
  }

  // 🔹 Si el usuario es directivo o administrativo
  if (roles.includes("directivo") || roles.includes("administrativo")) {
    const usuarioData = await db.oneOrNone(
      `SELECT u.tipo_usuario FROM usuarios u WHERE u.id = $1;`,
      [id]
    );

    if (usuarioData) {
      profileData.administrativo = usuarioData; // 🔹 Se guarda separado
    }
  }

  // 🔹 Si el usuario es admin, le damos acceso total (sin datos específicos)
  if (roles.includes("admin")) {
    profileData.admin = true;
  }

  return profileData;
};

module.exports = User;
