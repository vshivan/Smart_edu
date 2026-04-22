const passport = require('passport');
const { Strategy: GoogleStrategy } = require('passport-google-oauth20');
const { findOrCreateGoogleUser } = require('../services/auth.service');

passport.use(
  new GoogleStrategy(
    {
      clientID: process.env.GOOGLE_CLIENT_ID,
      clientSecret: process.env.GOOGLE_CLIENT_SECRET,
      callbackURL: process.env.GOOGLE_CALLBACK_URL,
    },
    async (accessToken, refreshToken, profile, done) => {
      try {
        const user = await findOrCreateGoogleUser(profile);
        done(null, user);
      } catch (err) {
        done(err, null);
      }
    }
  )
);
