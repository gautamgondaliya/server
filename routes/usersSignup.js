const express = require('express');
const router = express.Router();
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const User = require('../models/UserModel');

// @route   POST api/users/signup
// @desc    Register new user
// @access  Public

router.post('/signup', async (req, res) => {
    const { username, email, mobile, address, password, businessType, agreeToTerms } = req.body;

    // Simple validation
    if (!username || !email || !mobile || !address || !password  || !businessType || agreeToTerms === false) {
        return res.status(400).json({ msg: 'Please enter all fields' });
    }

    try {
        // Check for existing user
        const existingUser = await User.findOne({ email });
        if (existingUser) {
            return res.status(400).json({ msg: 'User already exists' });
        }

        // Create new user
        const newUser = new User({
            username,
            email,
            mobile,
            address,
            password,
            businessType,
            agreeToTerms
        });

        // Hash password
        const salt = await bcrypt.genSalt(10);
        newUser.password = await bcrypt.hash(password, salt);

        // Save user
        const savedUser = await newUser.save();

        // Generate JWT token
        const token = jwt.sign({ id: savedUser._id }, process.env.JWT_SECRET, { expiresIn: '1h' });

        res.status(201).json({ msg: 'User registered successfully', token, user: { username: savedUser.username, email: savedUser.email, mobile: savedUser.mobile, address: savedUser.address, businessType: savedUser.businessType } });

    } catch (err) {
        console.error(err.message);
        res.status(500).send('Server error');
    }
});

module.exports = router;
