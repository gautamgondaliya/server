const express = require('express');
const router = express.Router();
const mongoose = require('mongoose');
const MessageLog = require('../models/MessageLog'); 
const { authMiddleware } = require('../middleware/auth');
const { ObjectId } = mongoose.Types;

// Route to get today's message count for the logged-in user
router.get('/messageCountToday', authMiddleware, async (req, res) => {
    const userId = req.user.id;

    try {
        const startOfDay = new Date();
        startOfDay.setHours(0, 0, 0, 0);

        const endOfDay = new Date();
        endOfDay.setHours(23, 59, 59, 999);

        const messageCount = await MessageLog.countDocuments({
            userId: new ObjectId(userId), 
            createdAt: { $gte: startOfDay, $lt: endOfDay }
        });

        res.json({ messageCount });
    } catch (error) {
        console.error('Error fetching message count:', error);
        res.status(500).json({ message: 'Server error', error: error.message });
    }
});

// Helper function to get the start and end of the current week
const getWeekRange = () => {
    const currentDate = new Date();
    const startDate = new Date(currentDate.setDate(currentDate.getDate() - currentDate.getDay()));
    startDate.setHours(0, 0, 0, 0);
    const endDate = new Date(startDate);
    endDate.setDate(startDate.getDate() + 6);
    endDate.setHours(23, 59, 59, 999);
    return { startDate, endDate };
};

// Helper function to get the start and end of the current month
const getMonthRange = () => {
    const currentDate = new Date();
    const startDate = new Date(currentDate.getFullYear(), currentDate.getMonth(), 1);
    const endDate = new Date(currentDate.getFullYear(), currentDate.getMonth() + 1, 0);
    endDate.setHours(23, 59, 59, 999);
    return { startDate, endDate };
};

// Helper function to get the start and end of the current year
const getYearRange = () => {
    const currentDate = new Date();
    const startDate = new Date(currentDate.getFullYear(), 0, 1);
    const endDate = new Date(currentDate.getFullYear(), 11, 31);
    endDate.setHours(23, 59, 59, 999);
    return { startDate, endDate };
};

// Helper function to get the start and end of a specific year
const getSpecificYearRange = (year) => {
    const startDate = new Date(year, 0, 1);
    const endDate = new Date(year, 11, 31);
    endDate.setHours(23, 59, 59, 999);
    return { startDate, endDate };
};
// Route to get message count for a specific period for the logged-in user
router.get('/message-count/:period', authMiddleware, async (req, res) => {
    const userId = req.user.id;
    const period = req.params.period;
    let startDate, endDate;

    if (period === 'week') {
        ({ startDate, endDate } = getWeekRange());
    } else if (period === 'month') {
        ({ startDate, endDate } = getMonthRange());
    } else if (period === 'year') {
        ({ startDate, endDate } = getYearRange());
    } else if (!isNaN(period)) { // Specific year
        ({ startDate, endDate } = getSpecificYearRange(Number(period))); // Adjusted for specific year
    } else {
        return res.status(400).json({ error: 'Invalid period' });
    }

    try {
        const messages = await MessageLog.find({
            userId: new ObjectId(userId),
            createdAt: { $gte: startDate, $lte: endDate }
        }).lean();

        let messageCount = [];

        if (period === 'week') {
            messageCount = new Array(7).fill(0);
            messages.forEach(message => {
                const dayOfWeek = new Date(message.createdAt).getDay();
                messageCount[dayOfWeek]++;
            });
        } else if (period === 'month') {
            const daysInMonth = new Date(startDate.getFullYear(), startDate.getMonth() + 1, 0).getDate();
            messageCount = new Array(daysInMonth).fill(0);
            messages.forEach(message => {
                const dayOfMonth = new Date(message.createdAt).getDate();
                messageCount[dayOfMonth - 1]++;
            });
        } else if (period === 'year' || !isNaN(period)) { // Adjusted condition to handle both 'year' and specific year
            messageCount = new Array(12).fill(0);
            messages.forEach(message => {
                const month = new Date(message.createdAt).getMonth();
                messageCount[month]++;
            });
        }

        res.json({ messageCount });
    } catch (error) {
        console.error(`Error fetching ${period} message count:`, error);
        res.status(500).json({ error: 'Internal server error' });
    }
});
// Endpoint to get the last 10 message logs for the logged-in user
router.get('/last-logs', authMiddleware, async (req, res) => {
    try {
        const userId = req.user.id;
        const logs = await MessageLog.find({ userId })
            .sort({ createdAt: -1 })
            .limit(10)
            .select('contactName createdAt _id methods'); // Fetching contactName directly

        res.json(logs);
    } catch (error) {
        console.error('Error fetching last logs:', error);
        res.status(500).send('Server Error');
    }
});

module.exports = router;
