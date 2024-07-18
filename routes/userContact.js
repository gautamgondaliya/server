const express = require('express');
const Contact = require('../models/ContactModel');
const { authMiddleware } = require('../middleware/auth');
const router = express.Router();



// Create a contact
router.post('/contact', authMiddleware, async (req, res) => {
    const { name, email, phone, occupation, loan } = req.body;

    if (!name || !email || !phone || !occupation || !loan) {
        return res.status(400).json({ msg: 'Please enter all fields' });
    }

    try {
        const existingContact = await Contact.findOne({ email });
        if (existingContact) {
            return res.status(400).json({ msg: 'Contact already exists' });
        }

        const newContact = new Contact({
            name,
            email,
            phone,
            occupation,
            loan,
            userId: req.user.id
        });

        await newContact.save();
        return res.status(201).json({ msg: 'Contact created successfully', contact: newContact });
    } catch (err) {
        console.error(err.message);
        return res.status(500).send('Server error');
    }
});

// Get all contacts for the logged-in user
router.get('/contacts', authMiddleware, async (req, res) => {
    try {
        const userId = req.user.id;
        const contacts = await Contact.find({ userId });
        return res.json(contacts);
    } catch (err) {
        return res.status(500).json({ message: err.message });
    }
});

// Delete contacts by IDs
router.delete('/contact', authMiddleware, async (req, res) => {
    const { ids } = req.body;
    try {
        await Contact.deleteMany({ _id: { $in: ids } });
        return res.status(200).send({ message: 'Contacts deleted successfully' });
    } catch (error) {
        return res.status(500).send({ error: 'Error deleting contacts' });
    }
});

// Import contacts from CSV
router.post('/import', authMiddleware, async (req, res) => {
    try {
        const userId = req.user.id; // Extract userId from authenticated user

        const contacts = req.body.map(contact => ({
            ...contact,
            userId, // Assign userId to each contact
            verified: false, // Assuming 'verified' defaults to false for imported contacts
            createdAt: new Date(),
            updatedAt: new Date()
        }));

        console.log('Importing contacts:', contacts); // Log the contacts array for debugging

        const result = await Contact.insertMany(contacts);

        console.log('Contacts imported successfully:', result);

        if (result.length === contacts.length) {
            return res.status(200).send({ message: 'Contacts imported successfully', result });
        } else {
            return res.status(500).send({ error: 'Some contacts failed to import' });
        }
        navigator("/contacts");
    } catch (error) {
        console.error('Error importing contacts:', error);

        if (error.code === 11000) {
            return res.status(400).send({ error: 'Duplicate contacts found', details: error.keyValue });
        }

        return res.status(500).send({ error: 'Error importing contacts' });
    }
});




// Update a contact by ID
router.put('/contact/:id', authMiddleware, async (req, res) => {
    try {
        const { id } = req.params;
        const updatedContact = await Contact.findByIdAndUpdate(id, req.body, { new: true });
        return res.json(updatedContact);
    } catch (err) {
        return res.status(500).json({ message: err.message });
    }
});

module.exports = router;