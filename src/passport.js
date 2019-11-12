const passport = require("passport");
const { Strategy: GoogleTokenStrategy } = require("passport-google-token");
const GoogleStrategy = require("passport-google-oauth20").Strategy;
import models, { sequelize } from "./models";
import { createTokens } from "./auth";

passport.serializeUser(function(user, done) {
  done(null, user);
});

passport.deserializeUser(function(id, done) {
  models.User.findById(id)
    .then(user => done(null, user))
    .catch(done);
});

// Use the GoogleStrategy within Passport.
//   Strategies in passport require a `verify` function, which accept
//   credentials (in this case, a token, tokenSecret, and Google profile), and
//   invoke a callback with a user object.
passport.use(
  new GoogleTokenStrategy(
    {
      clientID: process.env.GOOGLE_CLIENT_ID,
      clientSecret: process.env.GOOGLE_CLIENT_SECRET,
      callbackURL: `/auth/google/callback`
    },
    function(token, refreshToken, profile, done) {
      done(null, { profile, token, refreshToken });
    }
  )
);

const authenticateGoogle = (req, res) =>
  new Promise((resolve, reject) => {
    passport.authenticate(
      "google-token",
      { session: false },
      (err, data, info) => {
        if (err) reject(err);
        resolve({ data, info });
      }
    )(req, res);
  });

passport.use(
  new GoogleStrategy(
    {
      clientID: process.env.GOOGLE_CLIENT_ID,
      clientSecret: process.env.GOOGLE_CLIENT_SECRET,
      callbackURL: `/auth/google/callback`
    },
    function(token, refreshToken, profile, done) {
      done(null, { profile, token, refreshToken });
    }
  )
);

module.exports = { passport: passport, authenticateGoogle };
