const express = require('express');
const passport = require('passport');
const router = express.Router();

// Route to start OAuth2 authentication with Google
router.get('/google',
  passport.authenticate('google', { scope: ['profile', 'email'] })
);

// OAuth2 callback route
router.get('/google/callback',
  passport.authenticate('google', { failureRedirect: '/' }),
  (req, res) => {
    // Successful authentication, redirect home.
    res.redirect('/');
  }
);

module.exports = router;
