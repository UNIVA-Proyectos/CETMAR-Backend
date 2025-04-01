const fs = require("fs");
const xlsx = require("xlsx");
const bcrypt = require("bcryptjs");
const db = require("../config/config");

// 📌 Función para generar la abreviatura de la carrera
function generarAbreviatura(nombreCarrera) {
  const partes = nombreCarrera.toUpperCase().split(" ");
  if (partes.length < 3 || partes[0] !== "TÉCNICO" || partes[1] !== "EN") {
    return nombreCarrera.substring(0, 3).toUpperCase(); // Fallback
  }
  return partes
    .slice(2)
    .map((palabra) => palabra[0])
    .join(""); // Toma iniciales
}

// 📌 Importación de alumnos desde un archivo Excel
async function importarAlumnosDesdeExcel(rutaArchivo) {
  const workbook = xlsx.readFile(rutaArchivo);
  const hoja = workbook.Sheets[workbook.SheetNames[0]];
  const alumnos = xlsx.utils.sheet_to_json(hoja);

  try {
    await db.tx(async (t) => {
      for (const alumno of alumnos) {
        // 🔹 Convertir todos los datos a string
        const matricula = String(alumno.NO_CONTROL).trim();
        const nombre = String(alumno.NOMBRE).trim();
        const paterno = String(alumno.PATERNO).trim();
        const materno = String(alumno.MATERNO).trim();
        const curp = String(alumno.CURP).trim();
        const carreraNombre = String(alumno.CARRERA).trim();
        const grupoNombre = String(alumno.GRUPO).trim();
        const semestre = String(alumno.SEMESTRE).trim();
        const generacion = String(alumno.GENERACION).trim();
        const fechaIngreso = new Date().toISOString().split("T")[0]; // 🔹 Fecha actual en formato YYYY-MM-DD

        // 🔹 Generar contraseña hasheada (por defecto "12345")
        const passwordHash = await bcrypt.hash("12345", 10);

        // 1️⃣ Verificar si la carrera ya existe
        let carrera = await t.oneOrNone(
          "SELECT id FROM carreras WHERE nombre = $1",
          [carreraNombre]
        );
        if (!carrera) {
          const abreviatura = generarAbreviatura(carreraNombre); // Generar abreviatura
          carrera = await t.one(
            "INSERT INTO carreras (nombre, abreviatura) VALUES ($1, $2) RETURNING id",
            [carreraNombre, abreviatura]
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
            `INSERT INTO usuarios (matricula, nombre, apellido_paterno, apellido_materno, correo, contraseña) 
             VALUES ($1, $2, $3, $4, $5, $6) RETURNING id`,
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

        // 4️⃣ Asignar rol de "alumno" si no lo tiene
        const rolAlumno = await t.oneOrNone(
          "SELECT 1 FROM usuario_rol WHERE usuario_id = $1 AND rol = 'alumno'",
          [usuario.id]
        );
        if (!rolAlumno) {
          await t.none(
            "INSERT INTO usuario_rol (usuario_id, rol) VALUES ($1, 'alumno')",
            [usuario.id]
          );
        }

        // 5️⃣ Verificar si el alumno ya existe
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
    console.error("Error al importar alumnos:", error);
    return {
      success: false,
      message: "Error al importar alumnos",
      error: error.message,
    };
  }
}

// 📌 Función para manejar la subida y procesamiento del archivo
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
