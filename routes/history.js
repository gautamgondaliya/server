const express = require('express');
const router = express.Router();
const mongoose = require('mongoose');
const MessageLog = require('../models/MessageLog'); 
const { authMiddleware } = require('../middleware/auth'); // Assuming you have authentication middleware
const { ObjectId } = mongoose.Types;

// Backend endpoint adjustment with pagination and total count
router.get('/history-data', authMiddleware, async (req, res) => {
    const userId = req.user._id; // Assuming req.user contains the logged-in user's information
    const { range, year, page = 1 } = req.query; 
    const query = { userId };

    try {
        let startDate, endDate;

        if (range === 'lastWeek') {
            startDate = new Date();
            startDate.setDate(startDate.getDate() - 7);
            query.createdAt = { $gte: startDate };
        } else if (range === 'lastMonth') {
            startDate = new Date();
            startDate.setMonth(startDate.getMonth() - 1);
            query.createdAt = { $gte: startDate };
        } else if (range === 'lastYear') {
            startDate = new Date();
            startDate.setFullYear(startDate.getFullYear() - 1);
            query.createdAt = { $gte: startDate };
        } else if (year) {
            startDate = new Date(year, 0, 1);
            endDate = new Date(year, 11, 31, 23, 59, 59); 
            query.createdAt = { $gte: startDate, $lte: endDate };
        } else {
            throw new Error('Invalid range or year parameter');
        }

        const pageSize = 10; 
        const skips = pageSize * (page - 1); 

        const [logs, total] = await Promise.all([
            MessageLog.find(query)
                .sort({ createdAt: -1 })
                .skip(skips)
                .limit(pageSize)
                .populate('contactId', 'name'),
            MessageLog.countDocuments(query) // Get total count of documents
        ]);

        res.json({
            messages: logs,
            total: total
        });
    } catch (error) {
        console.error('Error fetching history:', error);
        res.status(500).send('Server Error');
    }
});

module.exports = router;
