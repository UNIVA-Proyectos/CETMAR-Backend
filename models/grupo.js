const db = require("../config/config");

const Grupo = {
  // Obtener todos los grupos con información relacionada
  getAll: async () => {
    const sql = `
      SELECT 
        g.id,
        g.nombre,
        g.periodo_id,
        COALESCE(p.nombre, 'Sin periodo') as periodo_nombre,
        g.tutor_id,
        COALESCE(CONCAT(u.nombre, ' ', u.apellido_paterno, ' ', u.apellido_materno), 'Sin asignar') as tutor_nombre,
        COALESCE(COUNT(DISTINCT a.id), 0) as total_estudiantes,
        0 as asistencia_promedio,
        0 as rendimiento_promedio
      FROM grupos g
      LEFT JOIN periodos p ON g.periodo_id = p.id
      LEFT JOIN usuarios u ON g.tutor_id = u.id
      LEFT JOIN alumnos a ON a.grupo_id = g.id
      GROUP BY g.id, g.nombre, g.periodo_id, p.nombre, g.tutor_id, u.nombre, u.apellido_paterno, u.apellido_materno
      ORDER BY g.nombre;
    `;
    return db.manyOrNone(sql);
  },

  // Obtener grupo por ID
  findById: async (id) => {
    const sql = `
      SELECT 
        g.id,
        g.nombre,
        g.periodo_id,
        COALESCE(p.nombre, 'Sin periodo') as periodo_nombre,
        g.tutor_id,
        COALESCE(CONCAT(u.nombre, ' ', u.apellido_paterno, ' ', u.apellido_materno), 'Sin asignar') as tutor_nombre,
        COALESCE(COUNT(DISTINCT a.id), 0) as total_estudiantes,
        0 as asistencia_promedio,
        0 as rendimiento_promedio
      FROM grupos g
      LEFT JOIN periodos p ON g.periodo_id = p.id
      LEFT JOIN usuarios u ON g.tutor_id = u.id
      LEFT JOIN alumnos a ON a.grupo_id = g.id
      WHERE g.id = $1
      GROUP BY g.id, g.nombre, g.periodo_id, p.nombre, g.tutor_id, u.nombre, u.apellido_paterno, u.apellido_materno;
    `;
    return db.oneOrNone(sql, [id]);
  },

  // Crear nuevo grupo
  create: async (grupoData) => {
    const sql = `
      INSERT INTO grupos (nombre, periodo_id, tutor_id)
      VALUES ($1, $2, $3)
      RETURNING id;
    `;
    return db.one(sql, [grupoData.nombre, grupoData.periodo_id, grupoData.tutor_id]);
  },

  // Actualizar grupo
  update: async (id, grupoData) => {
    const sql = `
      UPDATE grupos 
      SET nombre = $1, periodo_id = $2, tutor_id = $3
      WHERE id = $4
      RETURNING id;
    `;
    return db.oneOrNone(sql, [grupoData.nombre, grupoData.periodo_id, grupoData.tutor_id, id]);
  },

  // Eliminar grupo
  delete: async (id) => {
    const sql = "DELETE FROM grupos WHERE id = $1 RETURNING id;";
    return db.oneOrNone(sql, [id]);
  },

  // Obtener estudiantes de un grupo
  getEstudiantes: async (grupoId) => {
    const sql = `
      SELECT 
        a.id,
        a.usuario_id,
        CONCAT(u.nombre, ' ', u.apellido_paterno, ' ', u.apellido_materno) as nombre_completo,
        u.matricula,
        a.estado,
        a.semestre,
        c.nombre as carrera
      FROM alumnos a
      JOIN usuarios u ON a.usuario_id = u.id
      LEFT JOIN carreras c ON a.carrera_id = c.id
      WHERE a.grupo_id = $1
      ORDER BY u.apellido_paterno, u.apellido_materno, u.nombre;
    `;
    return db.manyOrNone(sql, [grupoId]);
  },

  // Obtener clases de un grupo
  getClases: async (grupoId) => {
    const sql = `
      SELECT 
        cl.id,
        cl.dia_semana,
        cl.hora_inicio,
        cl.hora_fin,
        m.nombre as materia,
        m.clave_materia,
        CONCAT(u.nombre, ' ', u.apellido_paterno, ' ', u.apellido_materno) as docente_nombre
      FROM clases cl
      JOIN materias m ON cl.materia_id = m.id
      JOIN docentes d ON cl.docente_id = d.id
      JOIN usuarios u ON d.usuario_id = u.id
      WHERE cl.grupo_id = $1
      ORDER BY 
        CASE cl.dia_semana 
          WHEN 'Lunes' THEN 1 
          WHEN 'Martes' THEN 2 
          WHEN 'Miércoles' THEN 3 
          WHEN 'Jueves' THEN 4 
          WHEN 'Viernes' THEN 5 
        END,
        cl.hora_inicio;
    `;
    return db.manyOrNone(sql, [grupoId]);
  },

  // Obtener estadísticas del grupo
  getStats: async (grupoId) => {
    const sql = `
      SELECT 
        COUNT(DISTINCT a.id) as total_estudiantes,
        COUNT(DISTINCT CASE WHEN a.estado = 'activo' THEN a.id END) as estudiantes_activos,
        COALESCE(AVG(CASE WHEN asis.estado = 'presente' THEN 100 WHEN asis.estado = 'retardo' THEN 50 ELSE 0 END), 0) as asistencia_promedio,
        COALESCE(AVG(cal.calificacion), 0) as rendimiento_promedio,
        COUNT(DISTINCT cl.id) as total_clases
      FROM grupos g
      LEFT JOIN alumnos a ON a.grupo_id = g.id
      LEFT JOIN asistencias asis ON asis.alumno_id = a.id
      LEFT JOIN calificaciones cal ON cal.alumno_id = a.id
      LEFT JOIN clases cl ON cl.grupo_id = g.id
      WHERE g.id = $1;
    `;
    return db.one(sql, [grupoId]);
  },

  // Buscar grupos por nombre
  searchByName: async (searchTerm) => {
    const sql = `
      SELECT 
        g.id,
        g.nombre,
        g.periodo_id,
        p.nombre as periodo_nombre,
        g.tutor_id,
        CONCAT(u.nombre, ' ', u.apellido_paterno, ' ', u.apellido_materno) as tutor_nombre,
        COUNT(DISTINCT a.id) as total_estudiantes
      FROM grupos g
      LEFT JOIN periodos p ON g.periodo_id = p.id
      LEFT JOIN usuarios u ON g.tutor_id = u.id
      LEFT JOIN alumnos a ON a.grupo_id = g.id
      WHERE g.nombre ILIKE $1
      GROUP BY g.id, g.nombre, g.periodo_id, p.nombre, g.tutor_id, u.nombre, u.apellido_paterno, u.apellido_materno
      ORDER BY g.nombre;
    `;
    return db.manyOrNone(sql, [`%${searchTerm}%`]);
  },

  // Obtener grupos por periodo
  getByPeriodo: async (periodoId) => {
    const sql = `
      SELECT 
        g.id,
        g.nombre,
        g.periodo_id,
        p.nombre as periodo_nombre,
        g.tutor_id,
        CONCAT(u.nombre, ' ', u.apellido_paterno, ' ', u.apellido_materno) as tutor_nombre,
        COUNT(DISTINCT a.id) as total_estudiantes
      FROM grupos g
      LEFT JOIN periodos p ON g.periodo_id = p.id
      LEFT JOIN usuarios u ON g.tutor_id = u.id
      LEFT JOIN alumnos a ON a.grupo_id = g.id
      WHERE g.periodo_id = $1
      GROUP BY g.id, g.nombre, g.periodo_id, p.nombre, g.tutor_id, u.nombre, u.apellido_paterno, u.apellido_materno
      ORDER BY g.nombre;
    `;
    return db.manyOrNone(sql, [periodoId]);
  },

  // Obtener grupos por tutor
  getByTutor: async (tutorId) => {
    const sql = `
      SELECT 
        g.id,
        g.nombre,
        g.periodo_id,
        p.nombre as periodo_nombre,
        g.tutor_id,
        CONCAT(u.nombre, ' ', u.apellido_paterno, ' ', u.apellido_materno) as tutor_nombre,
        COUNT(DISTINCT a.id) as total_estudiantes
      FROM grupos g
      LEFT JOIN periodos p ON g.periodo_id = p.id
      LEFT JOIN usuarios u ON g.tutor_id = u.id
      LEFT JOIN alumnos a ON a.grupo_id = g.id
      WHERE g.tutor_id = $1
      GROUP BY g.id, g.nombre, g.periodo_id, p.nombre, g.tutor_id, u.nombre, u.apellido_paterno, u.apellido_materno
      ORDER BY g.nombre;
    `;
    return db.manyOrNone(sql, [tutorId]);
  }
};

module.exports = Grupo;
