const express = require("express");
const router = express.Router();
require('dotenv').config();
const twilio = require('twilio');

const client = twilio(
    process.env.TWILIO_ACCOUNT_SID,
    process.env.TWILIO_AUTH_TOKEN
);

// Route to send OTP
router.post('/send-otp', async (req, res) => {
    const { phone } = req.body;

    if (!phone) {
        return res.status(400).send({ error: 'Phone number is required' });
    }

    try {
        const verification = await client.verify.services(process.env.TWILIO_VERIFY_SERVICE_SID)
            .verifications
            .create({ to: phone, channel: 'sms' });

        console.log('Verification sent:', verification);

        res.send({ status: 'OTP sent successfully' });
    } catch (error) {
        console.error('Error sending OTP:', error);
        res.status(500).send({ error: 'Failed to send OTP' });
    }
});

// Route to verify OTP
router.post('/verify-otp', async (req, res) => {
    const { phone, code } = req.body;

    if (!phone || !code) {
        return res.status(400).send({ error: 'Phone number and OTP code are required' });
    }

    try {
        const verificationCheck = await client.verify.services(process.env.TWILIO_VERIFY_SERVICE_SID)
            .verificationChecks
            .create({ to: phone, code });

        if (verificationCheck.status === 'approved') {
            res.send({ status: 'OTP verified successfully' });
        } else {
            res.status(400).send({ error: 'Invalid OTP' });
        }
    } catch (error) {
        console.error('Error verifying OTP:', error);
        res.status(500).send({ error: 'Failed to verify OTP' });
    }
});

module.exports = router;
