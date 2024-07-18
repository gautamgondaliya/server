const express = require('express');
const router = express.Router();
const nodemailer = require('nodemailer');
const twilio = require('twilio');
const multer = require('multer');
const fs = require('fs');
const path = require('path');
const { promisify } = require('util');
const mongoose = require('mongoose');

const MessageLog = require('../models/MessageLog');
const File = require('../models/FileModel');

const storage = multer.diskStorage({
  destination: (req, file, cb) => {
    cb(null, 'uploads/');
  },
  filename: (req, file, cb) => {
    cb(null, Date.now() + '-' + file.originalname);
  }
});

const upload = multer({ storage });

const client = new twilio(process.env.TWILIO_ACCOUNT_SID, process.env.TWILIO_AUTH_TOKEN);

const unlinkAsync = promisify(fs.unlink);

router.post('/send', upload.array('files'), async (req, res) => {
  const { userId, message, methods, contacts } = req.body;
  const files = req.files;

  console.log('Received files:', files); // Debugging log

  if (!userId) {
    return res.status(400).send({ error: 'User ID is required' });
  }

  if (!message && files.length === 0) {
    return res.status(400).send({ error: 'Please provide a message or media file.' });
  }

  if (!methods || !contacts || contacts.length === 0) {
    return res.status(400).send({ error: 'Invalid request payload' });
  }

  const selectedMethods = methods.split(',');
  const contactList = JSON.parse(contacts);

  try {
    const sendPromises = contactList.map(async (contact) => {
      if (!mongoose.Types.ObjectId.isValid(contact.userId)) {
        throw new Error(`Invalid contact ID for contact: ${contact.name || contact.email || contact.phone}`);
      }

      const mediaUrls = files.map(file => ({
        filename: file.originalname,
        path: path.resolve(file.path) // Use absolute paths
      }));

      console.log('Media URLs:', mediaUrls); // Debugging log

      const methodPromises = selectedMethods.map(async (method) => {
        let response;

        switch (method) {
          case 'sms':
            response = await client.messages.create({
              body: message,
              from: process.env.TWILIO_PHONE_NUMBER,
              to: contact.phone,
              mediaUrl: mediaUrls.length ? mediaUrls.map(url => url.path) : undefined,
            });
            break;

          case 'email':
            const transporter = nodemailer.createTransport({
              service: 'gmail',
              auth: {
                user: process.env.EMAIL_USER,
                pass: process.env.EMAIL_PASS,
              },
            });

            const mailOptions = {
              from: process.env.EMAIL_USER,
              to: contact.email,
              subject: 'Subject of your email',
              text: message,
              attachments: mediaUrls.map(url => ({
                filename: url.filename,
                path: url.path
              })),
            };

            console.log('Mail options:', mailOptions); // Debugging log

            response = await transporter.sendMail(mailOptions);
            break;

          case 'whatsapp':
            response = await client.messages.create({
              body: message,
              from: `whatsapp:${process.env.TWILIO_WHATSAPP_NUMBER}`,
              to: `whatsapp:${contact.phone}`,
              mediaUrl: mediaUrls.length ? mediaUrls.map(url => url.path) : undefined,
            });
            break;

          default:
            response = { status: 'failed', error: 'Invalid method' };
        }

        let status = 'failed';
        if (method === 'sms' || method === 'whatsapp') {
          status = response && response.status === 'queued' ? 'sent' : 'failed';
        } else if (method === 'email') {
          status = response && response.accepted.length > 0 ? 'sent' : 'failed';
        }

        await MessageLog.create({
          userId: userId,
          contactId: contact.userId,
          contactName: contact.name || contact.email || contact.phone,
          message,
          methods: method,
          status
        });

        return { contact, method, status: response.status || status, response };
      });

      return await Promise.all(methodPromises);
    });

    const results = await Promise.all(sendPromises);

    await Promise.all(files.map(file => unlinkAsync(file.path)));

    res.send({ results });
  } catch (error) {
    console.error('Error sending messages:', error);

    await Promise.all(files.map(file => unlinkAsync(file.path)));

    res.status(500).send({ error: error.message });
  }
});

module.exports = router;
