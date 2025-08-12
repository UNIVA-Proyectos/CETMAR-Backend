const db = require("../config/config");

const alumnoController = {
  // Obtener todos los estudiantes
  getAllStudents: async (req, res) => {
    try {
      const query = `
        SELECT 
          a.id,
          u.nombre,
          u.apellido_paterno,
          u.apellido_materno,
          u.matricula,
          g.nombre as grupo_nombre,
          c.nombre as carrera_nombre,
          a.estado,
          a.semestre,
          a.generacion
        FROM Alumnos a
        JOIN Usuarios u ON a.usuario_id = u.id
        LEFT JOIN Grupos g ON a.grupo_id = g.id
        LEFT JOIN Carreras c ON a.carrera_id = c.id
        WHERE a.estado = 'activo'
        ORDER BY u.apellido_paterno, u.apellido_materno, u.nombre
      `;
      
      const students = await db.any(query);
      
      res.json({
        success: true,
        data: students,
        message: 'Estudiantes obtenidos exitosamente'
      });
    } catch (error) {
      console.error('Error al obtener estudiantes:', error);
      res.status(500).json({
        success: false,
        message: 'Error interno del servidor al obtener estudiantes',
        error: error.message
      });
    }
  },

  // Obtener estudiante por ID
  getStudentById: async (req, res) => {
    try {
      const { id } = req.params;
      
      const query = `
        SELECT 
          a.id,
          u.nombre,
          u.apellido_paterno,
          u.apellido_materno,
          u.matricula,
          u.correo as email,
          u.telefono,
          g.nombre as grupo_nombre,
          c.nombre as carrera_nombre,
          a.estado,
          a.semestre,
          a.generacion,
          a.fecha_ingreso,
          a.curp
        FROM Alumnos a
        JOIN Usuarios u ON a.usuario_id = u.id
        LEFT JOIN Grupos g ON a.grupo_id = g.id
        LEFT JOIN Carreras c ON a.carrera_id = c.id
        WHERE a.id = $1
      `;
      
      const students = await db.any(query, [id]);
      
      if (students.length === 0) {
        return res.status(404).json({
          success: false,
          message: 'Estudiante no encontrado'
        });
      }
      
      res.json({
        success: true,
        data: students[0],
        message: 'Estudiante obtenido exitosamente'
      });
    } catch (error) {
      console.error('Error al obtener estudiante:', error);
      res.status(500).json({
        success: false,
        message: 'Error interno del servidor al obtener estudiante',
        error: error.message
      });
    }
  },

  // Crear nuevo estudiante
  createStudent: async (req, res) => {
    try {
      const {
        nombre,
        apellido_paterno,
        apellido_materno,
        matricula,
        correo,
        telefono,
        contraseña,
        grupo_id,
        carrera_id,
        curp,
        generacion,
        fecha_ingreso,
        semestre
      } = req.body;
      
      // Validar campos requeridos
      if (!nombre || !apellido_paterno || !apellido_materno || !matricula || !correo || !contraseña || !curp || !generacion || !fecha_ingreso) {
        return res.status(400).json({
          success: false,
          message: 'Los campos nombre, apellidos, matrícula, correo, contraseña, CURP, generación y fecha de ingreso son requeridos'
        });
      }
      
      // Verificar si la matrícula ya existe
      const existingStudent = await db.any(
        'SELECT id FROM Usuarios WHERE matricula = $1',
        [matricula]
      );
      
      if (existingStudent.length > 0) {
        return res.status(400).json({
          success: false,
          message: 'Ya existe un estudiante con esa matrícula'
        });
      }
      
      // Verificar si el correo ya existe
      const existingEmail = await db.any(
        'SELECT id FROM Usuarios WHERE correo = $1',
        [correo]
      );
      
      if (existingEmail.length > 0) {
        return res.status(400).json({
          success: false,
          message: 'Ya existe un usuario con ese correo'
        });
      }
      
      // Verificar si el CURP ya existe
      const existingCurp = await db.any(
        'SELECT id FROM Alumnos WHERE curp = $1',
        [curp]
      );
      
      if (existingCurp.length > 0) {
        return res.status(400).json({
          success: false,
          message: 'Ya existe un estudiante con ese CURP'
        });
      }
      
      // Crear usuario primero
      const userQuery = `
        INSERT INTO Usuarios (
          nombre, apellido_paterno, apellido_materno, matricula, 
          correo, telefono, contraseña
        ) VALUES ($1, $2, $3, $4, $5, $6, $7)
        RETURNING id
      `;
      
      const userResult = await db.one(userQuery, [
        nombre, apellido_paterno, apellido_materno, matricula,
        correo, telefono, contraseña
      ]);
      
      // Crear alumno
      const alumnoQuery = `
        INSERT INTO Alumnos (
          usuario_id, grupo_id, carrera_id, curp, generacion, 
          fecha_ingreso, semestre, estado
        ) VALUES ($1, $2, $3, $4, $5, $6, $7, 'activo')
        RETURNING id
      `;
      
      const alumnoResult = await db.one(alumnoQuery, [
        userResult.id, grupo_id, carrera_id, curp, generacion, 
        fecha_ingreso, semestre || 1
      ]);
      
      // Asignar rol de alumno
      await db.none(
        'INSERT INTO Usuario_Rol (usuario_id, rol) VALUES ($1, $2)',
        [userResult.id, 'alumno']
      );
      
      res.status(201).json({
        success: true,
        data: { 
          id: alumnoResult.id,
          usuario_id: userResult.id
        },
        message: 'Estudiante creado exitosamente'
      });
    } catch (error) {
      console.error('Error al crear estudiante:', error);
      res.status(500).json({
        success: false,
        message: 'Error interno del servidor al crear estudiante',
        error: error.message
      });
    }
  },

  // Actualizar estudiante
  updateStudent: async (req, res) => {
    try {
      const { id } = req.params;
      const {
        nombre,
        apellido_paterno,
        apellido_materno,
        matricula,
        correo,
        telefono,
        grupo_id,
        carrera_id,
        semestre,
        estado
      } = req.body;
      
      // Verificar si el alumno existe
      const existingAlumno = await db.any(
        'SELECT usuario_id FROM Alumnos WHERE id = $1',
        [id]
      );
      
      if (existingAlumno.length === 0) {
        return res.status(404).json({
          success: false,
          message: 'Estudiante no encontrado'
        });
      }
      
      const usuarioId = existingAlumno[0].usuario_id;
      
      // Si se está cambiando la matrícula, verificar que no exista
      if (matricula) {
        const duplicateMatricula = await db.any(
          'SELECT id FROM Usuarios WHERE matricula = $1 AND id != $2',
          [matricula, usuarioId]
        );
        
        if (duplicateMatricula.length > 0) {
          return res.status(400).json({
            success: false,
            message: 'Ya existe otro usuario con esa matrícula'
          });
        }
      }
      
      // Si se está cambiando el correo, verificar que no exista
      if (correo) {
        const duplicateEmail = await db.any(
          'SELECT id FROM Usuarios WHERE correo = $1 AND id != $2',
          [correo, usuarioId]
        );
        
        if (duplicateEmail.length > 0) {
          return res.status(400).json({
            success: false,
            message: 'Ya existe otro usuario con ese correo'
          });
        }
      }
      
      // Actualizar usuario
      if (nombre || apellido_paterno || apellido_materno || matricula || correo || telefono) {
        const userUpdateQuery = `
          UPDATE Usuarios SET
            nombre = COALESCE($1, nombre),
            apellido_paterno = COALESCE($2, apellido_paterno),
            apellido_materno = COALESCE($3, apellido_materno),
            matricula = COALESCE($4, matricula),
            correo = COALESCE($5, correo),
            telefono = COALESCE($6, telefono)
          WHERE id = $7
        `;
        
        await db.none(userUpdateQuery, [
          nombre, apellido_paterno, apellido_materno, matricula,
          correo, telefono, usuarioId
        ]);
      }
      
      // Actualizar alumno
      if (grupo_id !== undefined || carrera_id !== undefined || semestre !== undefined || estado) {
        const alumnoUpdateQuery = `
          UPDATE Alumnos SET
            grupo_id = COALESCE($1, grupo_id),
            carrera_id = COALESCE($2, carrera_id),
            semestre = COALESCE($3, semestre),
            estado = COALESCE($4, estado)
          WHERE id = $5
        `;
        
        await db.none(alumnoUpdateQuery, [
          grupo_id, carrera_id, semestre, estado, id
        ]);
      }
      
      res.json({
        success: true,
        message: 'Estudiante actualizado exitosamente'
      });
    } catch (error) {
      console.error('Error al actualizar estudiante:', error);
      res.status(500).json({
        success: false,
        message: 'Error interno del servidor al actualizar estudiante',
        error: error.message
      });
    }
  },

  // Eliminar estudiante
  deleteStudent: async (req, res) => {
    try {
      const { id } = req.params;
      
      // Verificar si el alumno existe
      const existingAlumno = await db.any(
        'SELECT usuario_id FROM Alumnos WHERE id = $1',
        [id]
      );
      
      if (existingAlumno.length === 0) {
        return res.status(404).json({
          success: false,
          message: 'Estudiante no encontrado'
        });
      }
      
      const usuarioId = existingAlumno[0].usuario_id;
      
      // Eliminar alumno (esto también eliminará el usuario por CASCADE)
      await db.none('DELETE FROM Alumnos WHERE id = $1', [id]);
      
      res.json({
        success: true,
        message: 'Estudiante eliminado exitosamente'
      });
    } catch (error) {
      console.error('Error al eliminar estudiante:', error);
      res.status(500).json({
        success: false,
        message: 'Error interno del servidor al eliminar estudiante',
        error: error.message
      });
    }
  },

  // Buscar estudiantes
  searchStudents: async (req, res) => {
    try {
      const { q } = req.query;
      
      if (!q) {
        return res.status(400).json({
          success: false,
          message: 'Término de búsqueda requerido'
        });
      }
      
      const searchTerm = `%${q}%`;
      const query = `
        SELECT 
          a.id,
          u.nombre,
          u.apellido_paterno,
          u.apellido_materno,
          u.matricula,
          g.nombre as grupo_nombre,
          c.nombre as carrera_nombre,
          a.estado,
          a.semestre
        FROM Alumnos a
        JOIN Usuarios u ON a.usuario_id = u.id
        LEFT JOIN Grupos g ON a.grupo_id = g.id
        LEFT JOIN Carreras c ON a.carrera_id = c.id
        WHERE 
          (u.nombre ILIKE $1 OR
           u.apellido_paterno ILIKE $1 OR
           u.apellido_materno ILIKE $1 OR
           u.matricula ILIKE $1) AND
          a.estado = 'activo'
        ORDER BY u.apellido_paterno, u.apellido_materno, u.nombre
      `;
      
      const students = await db.any(query, [searchTerm]);
      
      res.json({
        success: true,
        data: students,
        message: 'Búsqueda completada exitosamente'
      });
    } catch (error) {
      console.error('Error al buscar estudiantes:', error);
      res.status(500).json({
        success: false,
        message: 'Error interno del servidor al buscar estudiantes',
        error: error.message
      });
    }
  },

  // Obtener estadísticas de estudiantes
  getStudentsStats: async (req, res) => {
    try {
      const totalStudents = await db.one('SELECT COUNT(*) as total FROM Alumnos WHERE estado = $1', ['activo']);
      const byGroup = await db.any(`
        SELECT g.nombre as grupo, COUNT(a.id) as cantidad
        FROM Grupos g
        LEFT JOIN Alumnos a ON g.id = a.grupo_id AND a.estado = 'activo'
        GROUP BY g.id, g.nombre
        ORDER BY g.nombre
      `);
      const byCareer = await db.any(`
        SELECT c.nombre as carrera, COUNT(a.id) as cantidad
        FROM Carreras c
        LEFT JOIN Alumnos a ON c.id = a.carrera_id AND a.estado = 'activo'
        GROUP BY c.id, c.nombre
        ORDER BY c.nombre
      `);
      
      res.json({
        success: true,
        data: {
          total: totalStudents.total,
          byGroup,
          byCareer
        },
        message: 'Estadísticas obtenidas exitosamente'
      });
    } catch (error) {
      console.error('Error al obtener estadísticas:', error);
      res.status(500).json({
        success: false,
        message: 'Error interno del servidor al obtener estadísticas',
        error: error.message
      });
    }
  }
};

module.exports = alumnoController;
