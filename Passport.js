require('dotenv').config();
const passport = require('passport');
const GoogleStrategy = require('passport-google-oauth20').Strategy;
const User = require('./models/UserModel'); // Assuming User model is defined

passport.use(new GoogleStrategy({
    clientID: process.env.GOOGLE_CLIENT_ID,
    clientSecret: process.env.GOOGLE_CLIENT_SECRET,
    callbackURL: 'http://localhost:5000/auth/google/callback'
  },
  function(accessToken, refreshToken, profile, done) {
    // Find or create user in the database
    User.findOne({ googleId: profile.id }, (err, user) => {
      if (err) {
        return done(err); // Pass error to done()
      }
      
      if (!user) {
        // If user does not exist, create a new one
        const newUser = new User({
          googleId: profile.id,
          name: profile.displayName,
          email: (profile.emails && profile.emails.length > 0) ? profile.emails[0].value : null
          // Add any additional fields you want to save from the profile
        });

        newUser.save((err) => {
          if (err) {
            return done(err); // Pass error to done()
          }
          return done(null, newUser); // Pass new user to done()
        });
      } else {
        // If user exists, return the user object
        return done(null, user); // Pass user to done()
      }
    });
  }
));

// Serialize and deserialize user
passport.serializeUser((user, done) => {
  done(null, user.id);
});

passport.deserializeUser((id, done) => {
  User.findById(id, (err, user) => {
    done(err, user); // Pass user to done()
  });
});

module.exports = passport;
