require("dotenv").config();
const promise = require("bluebird");
const options = {
  promiseLib: promise,
  query: (e) => {},
};

const pgp = require("pg-promise")(options);
const types = pgp.pg.types;

types.setTypeParser(1114, function (stringValue) {
  return stringValue;
});
const databaseConfig = {
  host: process.env.DB_HOST,
  port: process.env.DB_PORT,
  database: process.env.DB_NAME,
  user: process.env.DB_USER,
  password: process.env.DB_PASSWORD,
  ssl:
    process.env.DB_SSL === "true" ? { rejectUnauthorized: false } : undefined,
};

const db = pgp(databaseConfig);
//DEBUG PARA VERIFICAR CONEXIÓN
/*db.one(
  "SELECT current_database() as db, current_user as user, inet_server_addr() as host"
)
  .then((data) => {
    console.log("Conectado a:", data);
  })
  .catch((error) => {
    console.error("Error de conexión:", error);
  });*/

module.exports = db;
