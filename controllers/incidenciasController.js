const Incidencia = require("../models/incidencias");

module.exports = {
  async create(req, res) {
    try {
      const incidencia = await Incidencia.create(req.body);
      res.status(201).json({ success: true, data: incidencia });
    } catch (error) {
      res.status(500).json({ success: false, message: "Error al crear incidencia", error: error.message });
    }
  },

  async getAll(req, res) {
    try {
      const incidencias = await Incidencia.getAll();
      res.status(200).json({ success: true, data: incidencias });
    } catch (error) {
      res.status(500).json({ success: false, message: "Error al obtener incidencias", error: error.message });
    }
  },

  async getById(req, res) {
    try {
      const incidencia = await Incidencia.getById(req.params.id);
      if (!incidencia) {
        return res.status(404).json({ success: false, message: "Incidencia no encontrada" });
      }
      res.status(200).json({ success: true, data: incidencia });
    } catch (error) {
      res.status(500).json({ success: false, message: "Error al obtener la incidencia", error: error.message });
    }
  },

  async update(req, res) {
    try {
      const incidencia = await Incidencia.update(req.params.id, req.body);
      res.status(200).json({ success: true, data: incidencia });
    } catch (error) {
      res.status(500).json({ success: false, message: "Error al actualizar incidencia", error: error.message });
    }
  },

  async delete(req, res) {
    try {
      const result = await Incidencia.delete(req.params.id);
      if (result.rowCount === 0) {
        return res.status(404).json({ success: false, message: "Incidencia no encontrada" });
      }
      res.status(200).json({ success: true, message: "Incidencia eliminada correctamente" });
    } catch (error) {
      res.status(500).json({ success: false, message: "Error al eliminar incidencia", error: error.message });
    }
  }
};