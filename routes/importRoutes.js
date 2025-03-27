const multer = require("multer");
const { uploadFile } = require("../controllers/importController");

module.exports = (app) => {
  // Configuración de multer para almacenar archivos en /uploads
  const storage = multer.diskStorage({
    destination: "./uploads/",
    filename: (req, file, cb) => {
      cb(null, Date.now() + "-" + file.originalname);
    },
  });

  const upload = multer({ storage });

  app.post("/api/import/alumnos", upload.single("file"), uploadFile);
};
