const express = require("express");
const app = express.Router();
const UsersController = require("../controllers/usersController");
const passport = require("passport");

app.get("/api/users/", UsersController.getAll);
app.get("/api/users/:id", UsersController.findById);
app.post("/api/users/create", UsersController.register);
app.post("/api/users/login", UsersController.login);
app.post("/api/users/logout", UsersController.logout);
app.put("/api/users/update", UsersController.update);
app.get("/api/users/profile/:id/:role", UsersController.getProfile);
app.get(
  "/api/users/verify-session",
  passport.authenticate("jwt", { session: false }),
  UsersController.verifySession
);

module.exports = app;
