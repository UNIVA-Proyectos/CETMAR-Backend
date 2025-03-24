const Docente = require("../models/Docente");
const jwt = require("jsonwebtoken");
const bcrypt = require("bcryptjs");
const keys = require("../config/keys");

module.exports = {
  async getAllDocentes(req, res, next) {
    try {
      const data = await Docente.getAllDocentes();
      return res.status(200).json({
        success: true,
        data,
      });
    } catch (error) {
      console.error(`Error: ${error}`);
      return res.status(500).json({
        success: false,
        message: "Error al obtener los docentes",
        error: error.message,
      });
    }
  },

  async findById(req, res, next) {
    try {
      const id = req.params.id;
      const data = await Docente.findById(id);
      return res.status(200).json(data);
    } catch (error) {
      return res.status(500).json({
        success: false,
        message: "Error al obtener el docente",
      });
    }
  },

  async register(req, res, next) {
    try {
      const docente = req.body;
      const hashedPassword = await bcrypt.hash(docente.password, 10);
      docente.password = hashedPassword;

      const data = await Docente.create(docente);

      return res.status(201).json({
        success: true,
        message: "Docente registrado correctamente",
        data: data.id,
      });
    } catch (error) {
      return res.status(500).json({
        success: false,
        message: "Error al registrar docente",
      });
    }
  },



  async update(req, res) {
    try {
      const docente = req.body;
      await Docente.update(docente);

      return res.status(200).json({
        success: true,
        message: "Docente actualizado correctamente",
      });
    } catch (error) {
      return res.status(500).json({
        success: false,
        message: "Error al actualizar docente",
      });
    }
  },
};
