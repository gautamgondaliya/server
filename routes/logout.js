const express = require('express');
const router = express.Router();

// Logout route
router.post('/logout', async (req, res) => {
    try {
        // Invalidate the token (if using JWT), although in JWT, tokens are stateless
        // Optionally, clear any server-side session or token storage

        res.status(200).json({ message: 'Logout successful' });
    } catch (error) {
        console.error('Logout failed:', error);
        res.status(500).json({ message: 'Logout failed' });
    }
});

module.exports = router;
