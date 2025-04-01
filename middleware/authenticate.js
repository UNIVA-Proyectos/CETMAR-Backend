const jwt = require("jsonwebtoken");
const db = require("../config/config");
require("dotenv").config();

/**
 * Middleware para verificar el token JWT y extraer el usuario autenticado con sus roles.
 */
async function authenticate(req, res, next) {
  const authHeader = req.headers.authorization;

  if (!authHeader || !authHeader.startsWith("Bearer ")) {
    return res
      .status(401)
      .json({ success: false, message: "Usuario no autenticado" });
  }

  try {
    const token = authHeader.split(" ")[1];
    const decoded = jwt.verify(token, process.env.JWT_SECRET);

    console.log("Token decodificado:", decoded);

    // Verificar que el token tenga un ID de usuario
    if (!decoded.id) {
      return res
        .status(403)
        .json({
          success: false,
          message: "Token inválido: no contiene un ID de usuario",
        });
    }

    // Si ya trae roles, usarlos directamente
    req.user = {
      id: decoded.id,
      matricula: decoded.matricula,
      roles: decoded.roles || [], // Evitar que sea undefined
    };

    next();
  } catch (error) {
    console.error("Error en la verificación del token:", error);
    return res
      .status(403)
      .json({ success: false, message: "Token inválido o expirado" });
  }
}

module.exports = authenticate;
