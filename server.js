const express = require('express');
const mongoose = require('mongoose');
const cors = require('cors');
const session = require('express-session');
const passport = require('./Passport');
require('dotenv').config();
const bodyParser = require('body-parser');
const path = require('path');

const userRoutes = require('./routes/users');
const contactRoutes = require('./routes/userContact');
const messageRoutes = require('./routes/userMessage');
const verifyRoutes = require('./routes/verifyPhone');
const rolePermissionRoutes = require('./routes/userrolepermission');
const dashboardRoutes = require('./routes/dashboard');
const historyRoutes = require('./routes/history');
const uploadRoutes = require('./routes/upload');
const testUploadRouter = require('./routes/testUploadRouter');
const searchRouter = require('./routes/search');
const logoutRouter = require('./routes/logout');
const resetforgetRouter = require('./routes/resetforget');
const authRoutes = require('./routes/googleauth'); 

const app = express();
const PORT = 5000;

// CORS options
const corsOptions = {
    origin: "http://localhost:3000",
    methods: "GET,POST,PUT,DELETE,PATCH,HEAD",
    allowedHeaders: ['Content-Type', 'Authorization'],
    'Access-Control-Allow-Credentials': 'true',
};

// Serve files from the 'uploads' directory
app.use('/uploads', express.static(path.join(__dirname, 'uploads')));

// Middleware
app.use(cors(corsOptions));
app.use(express.json());
app.use(bodyParser.urlencoded({ extended: true }));

// Session middleware
app.use(session({
    secret: 'your secret key',
    resave: false,
    saveUninitialized: false,
    cookie: { secure: false }
}));

// Passport middleware
app.use(passport.initialize());
app.use(passport.session());

// Error handling middleware
app.use((err, req, res, next) => {
    console.error(err.stack);
    res.status(500).send('Something broke!');
});

// Connect to MongoDB
mongoose.connect(process.env.MONGO_URI, {
    useNewUrlParser: true,
    useUnifiedTopology: true,
})
.then(() => console.log('MongoDB connected'))
.catch(err => console.error('MongoDB connection error:', err));

// Routes
app.use('/api/users', userRoutes);
app.use('/api/contacts', contactRoutes);
app.use('/api/messages', messageRoutes);
app.use('/api/verify', verifyRoutes);
app.use('/api/role-permission', rolePermissionRoutes);
app.use('/api/dashboard', dashboardRoutes);
app.use('/api/history', historyRoutes);
app.use('/api/upload', uploadRoutes);
app.use('/api/test-upload', testUploadRouter);
app.use('/api/search', searchRouter);
app.use('/api', logoutRouter);
app.use('/api/reset-forget', resetforgetRouter);
app.use('/auth', authRoutes); 



// Start server
app.listen(PORT, () => {
    console.log(`Server is running on port ${PORT}`);
});
