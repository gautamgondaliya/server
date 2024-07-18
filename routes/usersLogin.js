const express = require('express');
const router = express.Router();
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const User = require('../models/UserModel');
const authMiddleware = require('../middleware/auth'); 

// @route   POST api/users/login
// @desc    Authenticate user and get token
// @access  Public
// POST api/users/login
router.post('/login', async (req, res) => {
    const { email, password } = req.body;

    // Simple validation
    if (!email || !password) {
        return res.status(400).json({ msg: 'Please enter all fields' });
    }

    try {
        // Check for existing user
        const user = await User.findOne({ email });
        if (!user) {
            return res.status(400).json({ msg: 'User does not exist' });
        }

        // Validate password
        const isMatch = await bcrypt.compare(password, user.password);
        if (!isMatch) {
            return res.status(400).json({ msg: 'Invalid credentials' });
        }

        // Generate JWT
        const payload = {
            user: {
                id: user.id
            }
        };

        jwt.sign(
            payload,
            process.env.JWT_SECRET,
            { expiresIn: '1h' },
            (err, token) => {
                if (err) throw err;
                res.json({ token });
            }
        );
        
    } catch (err) {
        console.error(err.message);
        res.status(500).send('Server error');
    }
});

// @route   GET api/users/me
// @desc    Get user details
// @access  Private
router.get('/me', authMiddleware, async (req, res) => {
    try {
        const userId = req.user.id; // Assuming req.user is correctly populated by authMiddleware

        // Fetch user details using userId
        const user = await User.findById(userId).select('-password'); // Example query, adjust as per your User schema

        if (!user) {
            return res.status(404).json({ error: 'User not found' });
        }

        res.json({ user }); // Return user data
    } catch (error) {
        console.error('Error fetching user:', error);
        res.status(500).json({ error: 'Server error' });
    }
});


module.exports = router;
