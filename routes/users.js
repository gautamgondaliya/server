const express = require('express');
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const User = require('../models/UserModel');
const { authMiddleware } = require('../middleware/auth');
const router = express.Router();
const roleMiddleware = require('../middleware/roleMiddleware');
const Contact = require('../models/ContactModel');
const File = require('../models/FileModel');

// Route to get total connections for the logged-in user
router.get('/total-connections', authMiddleware, async (req, res) => {
    try {
        const userId = req.user.id;
        const totalConnections = await Contact.countDocuments({ userId });
        res.json({ totalConnections });
    } catch (error) {
        console.error('Error fetching total connections:', error);
        res.status(500).json({ message: 'Server error', error: error.message });
    }
});

// @route   POST api/users/signup
// @desc    Register new user
// @access  Public
router.post('/signup', async (req, res) => {
    const { username, email, mobile, address, password, businessType, agreeToTerms } = req.body;

    if (!username || !email || !mobile || !address || !password || !businessType || !agreeToTerms) {
        return res.status(400).json({ msg: 'Please enter all fields' });
    }

    try {
        const existingUser = await User.findOne({ email });
        if (existingUser) {
            return res.status(400).json({ msg: 'User already exists' });
        }

        const newUser = new User({
            username,
            email,
            mobile,
            address,
            password,
            businessType,
            agreeToTerms,
            createdAt: new Date(),
            updatedAt: new Date()
        });

        const salt = await bcrypt.genSalt(10);
        newUser.password = await bcrypt.hash(password, salt);
        const savedUser = await newUser.save();
        const token = jwt.sign({ id: savedUser._id, role: savedUser.role }, process.env.JWT_SECRET, { expiresIn: '1h' });

        res.status(201).json({ 
            msg: 'User registered successfully', 
            token, 
            user: { 
                username: savedUser.username, 
                email: savedUser.email, 
                mobile: savedUser.mobile, 
                address: savedUser.address, 
                businessType: savedUser.businessType,
                role: savedUser.role
            } 
        });

    } catch (err) {
        console.error(err.message);
        res.status(500).send('Server error');
    }
});

// @route   POST api/users/login
// @desc    Authenticate user and get token
// @access  Public
router.post('/login', async (req, res) => {
    const { email, password } = req.body;

    if (!email || !password) {
        return res.status(400).json({ msg: 'Please enter all fields' });
    }

    try {
        const user = await User.findOne({ email });
        if (!user) {
            return res.status(400).json({ msg: 'User does not exist' });
        }

        const isMatch = await bcrypt.compare(password, user.password);
        if (!isMatch) {
            return res.status(400).json({ msg: 'Invalid credentials' });
        }

        // Update last login time
        user.updatedAt = new Date();
        await user.save();

        const payload = { id: user.id, role: user.role };
        jwt.sign(payload, process.env.JWT_SECRET, { expiresIn: '1h' }, (err, token) => {
            if (err) throw err;
            res.json({ token });
        });

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
        const userId = req.user.id;
        const user = await User.findById(userId).select('-password');

        if (!user) {
            return res.status(404).json({ error: 'User not found' });
        }

        res.json({ user });
    } catch (error) {
        console.error('Error fetching user:', error);
        res.status(500).json({ error: 'Server error' });
    }
});


// Endpoint to fetch user data
router.get('/:id', async (req, res) => {
    try {
        const user = await User.findById(req.params.id);
        if (!user) {
            return res.status(404).send({ error: 'User not found' });
        }
        res.send(user);
    } catch (error) {
        res.status(500).send({ error: 'Server error' });
    }
});




// @route   GET api/admin
// @desc    Admin route
// @access  Private, Admin
router.get('/admin', [authMiddleware, roleMiddleware('admin')], async (req, res) => {
    res.json({ msg: 'Welcome Admin' });
});

module.exports = router;
