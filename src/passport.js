var passport = require("passport");
var GoogleStrategy = require("passport-google-oauth").OAuth2Strategy;
import models, { sequelize } from "./models";
import { createTokens } from "./auth";

passport.serializeUser(function(user, done) {
  console.log(user);
  done(null, user.id);
});

passport.deserializeUser(function(user, done) {
  console.log(user);
  done(null, user);
});

// Use the GoogleStrategy within Passport.
//   Strategies in passport require a `verify` function, which accept
//   credentials (in this case, a token, tokenSecret, and Google profile), and
//   invoke a callback with a user object.
passport.use(
  new GoogleStrategy(
    {
      clientID: process.env.GOOGLE_CLIENT_ID,
      clientSecret: process.env.GOOGLE_CLIENT_SECRET,
      callbackURL: `/auth/google/callback`
    },
    async (req, token, tokenSecret, profile, done) => {
      const email = await profile.emails[0].value;
      try {
        const user = await models.User.findByLogin(email);
        if (!user) {
          let user = await models.User.create({
            username: profile.id,
            email: email,
            password: null
          });
          return await user;
        }
        console.log(user);
        done(null, user);
      } catch (e) {
        done(null, user);
      }
    }
  )
);

module.exports = { passport: passport };
