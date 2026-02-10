const periodosController = require("../controllers/periodosController");
const authenticate = require("../middleware/authenticate");

module.exports = (app) => {
    // Obtener todos los periodos
    app.get(
        "/api/periodos/getAll",
        authenticate,
        periodosController.getAll
    );

    // Obtener periodo actual
    app.get(
        "/api/periodos/current",
        authenticate,
        periodosController.getCurrent
    );

    // Crear nuevo periodo
    app.post(
        "/api/periodos/create",
        authenticate,
        periodosController.create
    );
};
