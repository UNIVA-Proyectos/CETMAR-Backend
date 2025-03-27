const db = require("../config/config");
const xlsx = require("xlsx");
const bcrypt = require("bcryptjs");
const fs = require("fs"); // Para eliminar el archivo después de usarlo

async function importarAlumnosDesdeExcel(rutaArchivo) {
  const workbook = xlsx.readFile(rutaArchivo);
  const sheet = workbook.Sheets[workbook.SheetNames[0]];
  const alumnos = xlsx.utils.sheet_to_json(sheet);

  try {
    await db.tx(async (t) => {
      for (const alumno of alumnos) {
        // 🔹 Convertir todos los datos a string
        const matricula = String(alumno.NO_CONTROL);
        const nombre = String(alumno.NOMBRE);
        const paterno = String(alumno.PATERNO);
        const materno = String(alumno.MATERNO);
        const curp = String(alumno.CURP);
        const carreraNombre = String(alumno.CARRERA);
        const grupoNombre = String(alumno.GRUPO);
        const semestre = String(alumno.SEMESTRE);
        const generacion = String(alumno.GENERACION);
        const fechaIngreso = new Date().toISOString().split("T")[0]; // 🔹 Fecha actual en formato YYYY-MM-DD

        // 🔹 Generar contraseña hasheada (por defecto "12345")
        const passwordHash = await bcrypt.hash("12345", 10);

        // 1️⃣ Verificar si la carrera ya existe
        let carrera = await t.oneOrNone(
          "SELECT id FROM carreras WHERE nombre = $1",
          [carreraNombre]
        );
        if (!carrera) {
          carrera = await t.one(
            "INSERT INTO carreras (nombre) VALUES ($1) RETURNING id",
            [carreraNombre]
          );
        }

        // 2️⃣ Verificar si el grupo ya existe
        let grupo = await t.oneOrNone(
          "SELECT id FROM grupos WHERE nombre = $1",
          [grupoNombre]
        );
        if (!grupo) {
          grupo = await t.one(
            "INSERT INTO grupos (nombre) VALUES ($1) RETURNING id",
            [grupoNombre]
          );
        }

        // 3️⃣ Verificar si el usuario ya existe
        let usuario = await t.oneOrNone(
          "SELECT id FROM usuarios WHERE matricula = $1",
          [matricula]
        );
        if (!usuario) {
          usuario = await t.one(
            `INSERT INTO usuarios (matricula, nombre, apellido_paterno, apellido_materno, correo, tipo_usuario, contraseña) 
             VALUES ($1, $2, $3, $4, $5, 'alumno', $6) RETURNING id`,
            [
              matricula,
              nombre,
              paterno,
              materno,
              `${matricula}@cetmar6.com`,
              passwordHash,
            ]
          );
        }

        // 4️⃣ Verificar si el alumno ya existe
        const alumnoExistente = await t.oneOrNone(
          "SELECT id FROM alumnos WHERE usuario_id = $1",
          [usuario.id]
        );
        if (!alumnoExistente) {
          await t.none(
            `INSERT INTO alumnos (usuario_id, curp, carrera_id, grupo_id, semestre, generacion, fecha_ingreso, estado) 
             VALUES ($1, $2, $3, $4, $5, $6, $7, 'activo')`,
            [
              usuario.id,
              curp,
              carrera.id,
              grupo.id,
              semestre,
              generacion,
              fechaIngreso,
            ]
          );
        }
      }
    });

    return { success: true, message: "Datos importados correctamente" };
  } catch (error) {
    console.error("Error al importar datos:", error);
    return {
      success: false,
      message: "Error al importar datos",
      error: error.message,
    };
  }
}

// 📌 Controlador para manejar la subida y procesamiento del archivo
const uploadFile = async (req, res) => {
  try {
    if (!req.file) {
      return res
        .status(400)
        .json({ success: false, message: "No se subió ningún archivo" });
    }

    const resultado = await importarAlumnosDesdeExcel(req.file.path);

    // 🗑️ Eliminar el archivo después de procesarlo (opcional)
    fs.unlinkSync(req.file.path);

    res.status(200).json(resultado);
  } catch (error) {
    res.status(500).json({
      success: false,
      message: "Error al importar datos",
      error: error.message,
    });
  }
};

module.exports = { uploadFile };
