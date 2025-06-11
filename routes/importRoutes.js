const multer = require("multer");
const { uploadFile } = require("../controllers/importController");
const authenticate = require("../middleware/authenticate");
const requireRoles = require("../middleware/requireRole");

module.exports = (app) => {
  // Configuración de multer para almacenar archivos en /uploads
  const storage = multer.diskStorage({
    destination: "./uploads/",
    filename: (req, file, cb) => {
      cb(null, Date.now() + "-" + file.originalname);
    },
  });

  const upload = multer({ storage });

  app.post(
    "/api/import/alumnos",
    authenticate,
    upload.single("file"),
    uploadFile
  );
};
