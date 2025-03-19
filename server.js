const express = require("express");
const app = express();
const http = require("http");
const server = http.createServer(app);
const logger = require("morgan");
const cors = require("cors");
const passport = require("passport");
const session = require("express-session");

// Configura express-session
app.use(
  session({
    secret: "09876",
    resave: false,
    saveUninitialized: true,
    cookie: { secure: false },
  })
);

//Instanciando rutas
const users = require("./routes/usersRoutes");

const port = process.env.PORT || 3000;

app.use(logger("dev"));
app.use(express.json());
app.use(
  express.urlencoded({
    extended: true,
  })
);
app.use(cors());
app.use(passport.initialize());
app.use(passport.session());
require("./config/passport")(passport);

app.disable("x-powered-by");

app.set("port", port);

//Llamando a las rutas
users(app);

server.listen(port, "0.0.0.0", function () {
  console.log(
    "Aplicacion de Node.js " + process.pid + " iniciada en puerto " + port
  );
});

//ERROR HANDLING
app.use((err, req, res, next) => {
  console.log(err);
  res.status(err.status || 500).send(err.stack);
});

module.exports = {
  app: app,
  server: server,
};
