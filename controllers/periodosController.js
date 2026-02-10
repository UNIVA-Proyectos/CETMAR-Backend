const Periodo = require("../models/periodo");

module.exports = {
    async getAll(req, res) {
        try {
            const periodos = await Periodo.getAll();
            return res.status(200).json({
                success: true,
                data: periodos
            });
        } catch (error) {
            console.error("Error al obtener periodos:", error);
            return res.status(500).json({
                success: false,
                message: "Error al obtener los periodos",
                error: error.message
            });
        }
    },

    async getCurrent(req, res) {
        try {
            const periodo = await Periodo.getCurrentPeriodo();
            return res.status(200).json({
                success: true,
                data: periodo
            });
        } catch (error) {
            console.error("Error al obtener periodo actual:", error);
            return res.status(500).json({
                success: false,
                message: "Error al obtener el periodo actual",
                error: error.message
            });
        }
    },

    async create(req, res) {
        try {
            const { nombre, fecha_inicio, fecha_fin } = req.body;

            if (!nombre || !fecha_inicio || !fecha_fin) {
                return res.status(400).json({
                    success: false,
                    message: "Nombre, fecha de inicio y fecha de fin son requeridos"
                });
            }

            const nuevoPeriodo = await Periodo.create({ nombre, fecha_inicio, fecha_fin });

            return res.status(201).json({
                success: true,
                message: "Periodo creado exitosamente",
                data: { id: nuevoPeriodo.id }
            });
        } catch (error) {
            console.error("Error al crear periodo:", error);
            return res.status(500).json({
                success: false,
                message: "Error al crear el periodo",
                error: error.message
            });
        }
    }
};
