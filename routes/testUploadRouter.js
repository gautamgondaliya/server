// testUploadRouter.js
const express = require('express');
const multer = require('multer');
const path = require('path');
const router = express.Router();

const storage = multer.diskStorage({
    destination: (req, file, cb) => {
        cb(null, 'uploads/');
    },
    filename: (req, file, cb) => {
        cb(null, Date.now() + '-' + file.originalname);
    }
});

const upload = multer({ storage });

router.post('/test-upload', upload.array('files'), (req, res) => {
    const files = req.files;
    console.log('Received files:', files); // Debugging log

    if (!files || files.length === 0) {
        return res.status(400).send({ error: 'No files uploaded' });
    }

    const mediaUrls = files.map(file => ({
        filename: file.originalname,
        path: path.resolve(file.path) // Use absolute paths
    }));

    console.log('Media URLs:', mediaUrls); // Debugging log

    res.send({ message: 'Files uploaded successfully', files: mediaUrls });
});

module.exports = router;
