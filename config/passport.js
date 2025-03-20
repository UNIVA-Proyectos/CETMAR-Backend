const JwtStrategy = require("passport-jwt").Strategy;
const ExtractJwt = require("passport-jwt").ExtractJwt;
const LocalStrategy = require('passport-local').Strategy;
const bcrypt = require('bcryptjs');
const User = require("../models/user");
const Keys = require("./keys");
const db = require('./config');

module.exports = function (passport) {
  let opts = {};
  opts.jwtFromRequest = ExtractJwt.fromAuthHeaderWithScheme("jwt");
  opts.secretOrKey = Keys.secretOrKey;
  passport.use(
    new JwtStrategy(opts, (jwt_payload, done) => {
      User.findById(jwt_payload.id, (err, user) => {
        if (err) {
          return done(err, false);
        }
        if (user) {
          return done(null, user);
        } else {
          return done(null, false);
        }
      });
    })
  );

  passport.use(
    new LocalStrategy({
      usernameField: 'matricula',
      passwordField: 'contraseña'
    },
    async (matricula, contraseña, done) => {
      try {
        const user = await db.oneOrNone('SELECT * FROM usuarios WHERE matricula = $1', [matricula]);
        
        if (!user) {
          return done(null, false, { message: 'Credenciales inválidas' });
        }

        const isMatch = await bcrypt.compare(contraseña, user.contraseña);
        if (!isMatch) {
          return done(null, false, { message: 'Credenciales inválidas' });
        }

        return done(null, user);
      } catch (error) {
        return done(error);
      }
    })
  );

  passport.serializeUser((user, done) => {
    done(null, user.id);
  });

  passport.deserializeUser(async (id, done) => {
    try {
      const user = await db.oneOrNone('SELECT * FROM usuarios WHERE id = $1', [id]);
      done(null, user);
    } catch (error) {
      done(error);
    }
  });
};
