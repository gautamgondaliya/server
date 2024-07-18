const express = require('express');
const multer = require('multer');
const path = require('path');
const fs = require('fs');
const { promisify } = require('util');
const { File } = require('../models/FileModel'); 
const { authMiddleware } = require('../middleware/auth'); 
const router = express.Router();

const unlinkAsync = promisify(fs.unlink);

const storage = multer.diskStorage({
    destination: (req, file, cb) => {
        cb(null, 'uploads/');
    },
    filename: (req, file, cb) => {
        const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1E9);
        const fileName = uniqueSuffix + '-' + file.originalname;
        cb(null, fileName);
    }
});

const upload = multer({ storage });

router.post('/upload-file', authMiddleware, upload.array('files'), async (req, res) => {
    try {
        const userId = req.user.id;
        const files = req.files;

        const fileEntries = files.map(file => ({
            userId,
            fileName: file.originalname,
            filePath: file.path,
            fileType: file.mimetype
        }));

        await File.insertMany(fileEntries);

        res.status(200).json({ message: 'Files uploaded successfully', files: fileEntries });
    } catch (error) {
        console.error('Error uploading files:', error);
        res.status(500).json({ message: 'Internal Server Error' });
    }
});

router.get('/uploaded-files', authMiddleware, async (req, res) => {
    try {
        const userId = req.user.id;
        const files = await File.find({ userId });

        res.status(200).json(files);
    } catch (error) {
        console.error('Error fetching files:', error);
        res.status(500).json({ message: 'Internal Server Error' });
    }
});

router.post('/delete-files', authMiddleware, async (req, res) => {
    try {
        const { fileIds } = req.body;
        const userId = req.user.id;

        const files = await File.find({ _id: { $in: fileIds }, userId });

        await Promise.all(files.map(async file => {
            fs.unlink(file.filePath, (err) => {
                if (err) {
                    console.error(`Error deleting file ${file.filePath}:, err`);
                }
            });
            await File.deleteOne({ _id: file._id });
        }));

        res.status(200).json({ message: 'Files deleted successfully' });
    } catch (error) {
        console.error('Error deleting files:', error);
        res.status(500).json({ message: 'Internal Server Error' });
    }
});

router.get('/files/:userId', async (req, res) => {
    try {
        const files = await File.find({ userId: req.params.userId });
        res.json(files);
    } catch (error) {
        console.error('Error fetching files:', error);
        res.status(500).send('Error fetching files');
    }
});

module.exports = router;