const fs = require("fs");
const xlsx = require("xlsx");
const bcrypt = require("bcryptjs");
const db = require("../config/config");

function generarAbreviatura(nombreCarrera) {
  const partes = nombreCarrera.toUpperCase().split(" ");
  if (partes.length < 3 || partes[0] !== "TÉCNICO" || partes[1] !== "EN") {
    return nombreCarrera.substring(0, 3).toUpperCase();
  }
  return partes
    .slice(2)
    .map((palabra) => palabra[0])
    .join("");
}

async function getPeriodoActual(t) {
  const periodo = await t.oneOrNone(
    `SELECT id FROM periodos WHERE fecha_inicio <= CURRENT_DATE AND fecha_fin >= CURRENT_DATE LIMIT 1`
  );
  return periodo ? periodo.id : null;
}

async function importarAlumnosDesdeExcel(rutaArchivo) {
  const workbook = xlsx.readFile(rutaArchivo);
  const hoja = workbook.Sheets[workbook.SheetNames[0]];
  const alumnos = xlsx.utils.sheet_to_json(hoja);

  try {
    return await db.tx(async (t) => {
      let carrerasDB = await t.any("SELECT id, nombre FROM carreras");
      let gruposDB = await t.any("SELECT id, nombre, periodo_id FROM grupos");
      let usuariosDB = await t.any("SELECT id, matricula FROM usuarios");

      const periodoActual = await getPeriodoActual(t);
      if (!periodoActual) throw new Error("No hay un periodo actual definido.");

      const passwordHash = await bcrypt.hash("12345", 10);
      const fechaIngreso = new Date().toISOString().split("T")[0];

      const usuariosToInsert = [];
      const usuariosMatriculasSet = new Set(usuariosDB.map((u) => u.matricula));
      const carrerasToInsert = [];
      const carrerasNombreSet = new Set(carrerasDB.map((c) => c.nombre));
      const gruposToInsert = [];
      const gruposClaveSet = new Set(
        gruposDB.map((g) => `${g.nombre}|${g.periodo_id}`)
      );

      alumnos.forEach((alumno) => {
        const matricula = String(alumno.NO_CONTROL).trim();
        const carreraNombre = String(alumno.CARRERA).trim();
        const grupoNombre = String(alumno.GRUPO).trim();

        if (!usuariosMatriculasSet.has(matricula)) {
          usuariosToInsert.push({
            matricula,
            nombre: String(alumno.NOMBRE).trim(),
            paterno: String(alumno.PATERNO).trim(),
            materno: String(alumno.MATERNO).trim(),
            correo: `${matricula}@cetmar6.com`,
            password: passwordHash,
          });
          usuariosMatriculasSet.add(matricula);
        }
        if (!carrerasNombreSet.has(carreraNombre)) {
          carrerasToInsert.push({
            nombre: carreraNombre,
            abreviatura: generarAbreviatura(carreraNombre),
          });
          carrerasNombreSet.add(carreraNombre);
        }
        const grupoKey = `${grupoNombre}|${periodoActual}`;
        if (!gruposClaveSet.has(grupoKey)) {
          gruposToInsert.push({
            nombre: grupoNombre,
            periodo_id: periodoActual,
          });
          gruposClaveSet.add(grupoKey);
        }
      });

      if (carrerasToInsert.length) {
        const values = carrerasToInsert
          .map((_, i) => `($${i * 2 + 1}, $${i * 2 + 2})`)
          .join(",");
        const flat = carrerasToInsert.flatMap((c) => [c.nombre, c.abreviatura]);
        const rows = await t.any(
          `INSERT INTO carreras (nombre, abreviatura) VALUES ${values} RETURNING id, nombre`,
          flat
        );
        carrerasDB.push(...rows);
      }
      if (gruposToInsert.length) {
        const values = gruposToInsert
          .map((_, i) => `($${i * 2 + 1}, $${i * 2 + 2})`)
          .join(",");
        const flat = gruposToInsert.flatMap((g) => [g.nombre, g.periodo_id]);
        const rows = await t.any(
          `INSERT INTO grupos (nombre, periodo_id) VALUES ${values} RETURNING id, nombre, periodo_id`,
          flat
        );
        gruposDB.push(...rows);
      }
      if (usuariosToInsert.length) {
        const values = usuariosToInsert
          .map(
            (_, i) =>
              `($${i * 6 + 1}, $${i * 6 + 2}, $${i * 6 + 3}, $${i * 6 + 4}, $${
                i * 6 + 5
              }, $${i * 6 + 6})`
          )
          .join(",");
        const flat = usuariosToInsert.flatMap((u) => [
          u.matricula,
          u.nombre,
          u.paterno,
          u.materno,
          u.correo,
          u.password,
        ]);
        const rows = await t.any(
          `INSERT INTO usuarios (matricula, nombre, apellido_paterno, apellido_materno, correo, contraseña) 
           VALUES ${values} RETURNING id, matricula`,
          flat
        );
        usuariosDB.push(...rows);
      }

      const idsUsuarios = usuariosDB.map((u) => u.id);
      const yaTienenRol = await t.any(
        "SELECT usuario_id FROM usuario_rol WHERE usuario_id IN ($1:csv) AND rol = 'alumno'",
        [idsUsuarios]
      );
      const idsConRol = new Set(yaTienenRol.map((x) => x.usuario_id));
      const rolesToInsert = usuariosDB
        .filter((u) => !idsConRol.has(u.id))
        .map((u) => u.id);
      if (rolesToInsert.length) {
        await t.none(
          `INSERT INTO usuario_rol (usuario_id, rol) 
           SELECT unnest($1::int[]), 'alumno'`,
          [rolesToInsert]
        );
      }

      const alumnosExistentes = await t.any(
        "SELECT usuario_id FROM alumnos WHERE usuario_id IN ($1:csv)",
        [usuariosDB.map((u) => u.id)]
      );
      const usuarioIdsEnAlumnos = new Set(
        alumnosExistentes.map((x) => x.usuario_id)
      );

      const alumnosToInsert = [];
      /*
      console.log("Alumnos en Excel:", alumnos.length);
      console.log("Usuarios nuevos:", usuariosToInsert.length);
      console.log("Usuarios totales en DB:", usuariosDB.length);*/
      alumnos.forEach((alumno) => {
        const matricula = String(alumno.NO_CONTROL).trim();
        const usuario = usuariosDB.find((u) => u.matricula === matricula);
        if (!usuario || usuarioIdsEnAlumnos.has(usuario.id)) return;

        const carreraNombre = String(alumno.CARRERA).trim();
        const grupoNombre = String(alumno.GRUPO).trim();
        const carrera = carrerasDB.find((c) => c.nombre === carreraNombre);
        const grupo = gruposDB.find(
          (g) => g.nombre === grupoNombre && g.periodo_id === periodoActual
        );
        alumnosToInsert.push({
          usuario_id: usuario.id,
          curp: String(alumno.CURP).trim(),
          carrera_id: carrera ? carrera.id : null,
          grupo_id: grupo ? grupo.id : null,
          semestre: parseInt(alumno.SEMESTRE, 10) || 1,
          generacion: String(alumno.GENERACION).trim(),
          fecha_ingreso: fechaIngreso,
        });
      });

      // Si hay usuarios únicos en tu Excel, no filtres más!
      const uniqueAlumnosToInsert = alumnosToInsert;

      if (uniqueAlumnosToInsert.length) {
        const values = uniqueAlumnosToInsert
          .map(
            (_, i) =>
              `($${i * 7 + 1}, $${i * 7 + 2}, $${i * 7 + 3}, $${i * 7 + 4}, $${
                i * 7 + 5
              }, $${i * 7 + 6}, $${i * 7 + 7}, 'activo')`
          )
          .join(",");
        const flat = uniqueAlumnosToInsert.flatMap((a) => [
          a.usuario_id,
          a.curp,
          a.carrera_id,
          a.grupo_id,
          a.semestre,
          a.generacion,
          a.fecha_ingreso,
        ]);
        await t.none(
          `INSERT INTO alumnos 
          (usuario_id, curp, carrera_id, grupo_id, semestre, generacion, fecha_ingreso, estado) 
          VALUES ${values}`,
          flat
        );
      }

      return {
        success: true,
        message: `Se importaron ${uniqueAlumnosToInsert.length} nuevos alumnos.`,
      };
    });
  } catch (error) {
    console.error("Error al importar alumnos:", error);
    return {
      success: false,
      message: "Error al importar alumnos",
      error: error.message,
    };
  }
}

const uploadFile = async (req, res) => {
  try {
    if (!req.file) {
      return res
        .status(400)
        .json({ success: false, message: "No se subió ningún archivo" });
    }
    const resultado = await importarAlumnosDesdeExcel(req.file.path);
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
