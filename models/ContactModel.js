const mongoose = require('mongoose');

const ContactSchema = new mongoose.Schema({
    userId: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'User',
        required: true
    },
    name: {
        type: String,
        required: [true, 'Name is required']
    },
    email: {
        type: String,
        required: [true, 'Email is required'],
        unique: true,
        match: [/\S+@\S+\.\S+/, 'Email is invalid']
    },
    phone: {
        type: String,
        required: [true, 'Phone number is required'],
        unique: true,
        // match: [/^\+91\d{10}$/, 'Phone number is invalid']
    },
    occupation: {
        type: String,
        required: [true, 'Occupation is required']
    },
    loan: {
        type: Number,
        required: [true, 'Loan amount is required']
    },
    verified: {
        type: Boolean,
        default: false
    },
    createdAt: {
        type: Date,
        default: Date.now
    },
    updatedAt: {
        type: Date,
        default: Date.now
    }
});

// Pre-save hook to update `updatedAt` field
ContactSchema.pre('save', function(next) {
    this.updatedAt = Date.now();
    next();
});

// Pre-insertMany hook to update `updatedAt` field for bulk inserts
ContactSchema.pre('insertMany', function(next, docs) {
    docs.forEach(doc => doc.updatedAt = Date.now());
    next();
});

const Contact = mongoose.model('Contact', ContactSchema);

module.exports = Contact;
