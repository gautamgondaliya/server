const express = require('express');
const router = express.Router();
const Contact = require('../models/ContactModel'); 

// Route to import contacts with authentication check only
router.post('/import', authMiddleware, async (req, res) => {
    try {
        const userId = req.user.id;
        const contacts = req.body.map(contact => ({ ...contact, userId })); // Add userId to each contact

        if (contacts.length === 0) {
            return res.status(400).send({ error: 'No contacts to import' });
        }

        const result = await Contact.insertMany(contacts, { ordered: false });

        if (result.length === 0) {
            return res.status(400).send({ error: 'No contacts were imported' });
        }

        return res.status(200).send({ message: 'Contacts imported successfully', result });
    } catch (error) {
        console.error('Error importing contacts:', error);

        if (error.code === 11000) {
            return res.status(400).send({ error: 'Duplicate contacts found', details: error.keyValue });
        }

        return res.status(500).send({ error: 'Error importing contacts' });
    }
});

module.exports = router;
