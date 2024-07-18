const mongoose = require('mongoose');
const Schema = mongoose.Schema;

const MessageLogSchema = new Schema({
    userId: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'User',  
        required: true
    },
    contactId: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'Contact',  
        required: true
    },
    contactName: {  
        type: String,
        required: true
    },
    message: {
        type: String,
        required: true
    },
    methods: {
        type: [String],  // Modified to be an array of strings
        required: true
    },
    status: {
        type: String,
        enum: ['sent', 'failed', 'queued'],
        default: 'sent'
    },
    createdAt: {
        type: Date,
        default: Date.now
    }
});

const MessageLog = mongoose.model('MessageLog', MessageLogSchema);

module.exports = MessageLog;


