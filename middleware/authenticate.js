const jwt = require("jsonwebtoken");
require("dotenv").config();

/**
 * Middleware para verificar el token JWT y extraer el usuario autenticado.
 */
function authenticate(req, res, next) {
  const token = req.header("Authorization");

  if (!token) {
    return res
      .status(401)
      .json({ success: false, message: "Token no proporcionado" });
  }

  try {
    // Decodificar el token
    const decoded = jwt.verify(
      token.replace("Bearer ", ""),
      process.env.JWT_SECRET
    );
    req.user = decoded; // Agregar usuario al request
    next();
  } catch (error) {
    return res
      .status(403)
      .json({ success: false, message: "Token inválido o expirado" });
  }
}

module.exports = authenticate;
