
const express = require('express');
const router = express.Router();
const Contact = require('../models/ContactModel');
const { authMiddleware } = require('../middleware/auth');

// Search contacts by userId and name
router.get('/contacts', authMiddleware, async (req, res) => {
    const { query } = req.query;
    const userId = req.user._id;  // Get userId from req.user._id

    if (!userId) {
        return res.status(400).json({ error: 'User ID is required' });
    }

    if (!query) {
        return res.status(400).json({ error: 'Query is required' });
    }

    try {
        const contacts = await Contact.find({
            userId: userId,
            $or: [
                { name: { $regex: query, $options: 'i' } }, // Case-insensitive name search
                // Add more fields to search as needed
            ],
        });
        res.json(contacts);
    } catch (err) {
        console.error('Error searching contacts:', err);
        res.status(500).json({ error: 'Internal server error' });
    }
});

module.exports = router;