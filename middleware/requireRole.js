/**
 * Middleware para verificar si el usuario tiene al menos uno de los roles permitidos.
 * @param {Array<string>} allowedRoles - Lista de roles permitidos (por ejemplo, ['superadmin', 'docente']).
 */
function requireRole(allowedRoles) {
  return (req, res, next) => {
    // Verifica si el usuario está autenticado
    if (!req.user) {
      return res
        .status(401)
        .json({ success: false, message: "Usuario no autenticado" });
    }

    // Verifica si el usuario tiene al menos uno de los roles permitidos
    const tienePermiso = req.user.roles.some((rol) =>
      allowedRoles.includes(rol)
    );

    if (!tienePermiso) {
      return res.status(403).json({
        success: false,
        message: "Acceso denegado: Privilegios insuficientes",
      });
    }

    // Si el usuario tiene permiso, continuar con la petición
    next();
  };
}

module.exports = requireRole;
