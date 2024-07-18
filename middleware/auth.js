const jwt = require('jsonwebtoken');
const User = require('../models/UserModel');
const Role = require('../models/RoleModel');

const authMiddleware = async (req, res, next) => {
    const token = req.header('Authorization')?.replace('Bearer ', '');

    if (!token) {
        return res.status(401).json({ error: 'Access denied, no token provided' });
    }

    try {
        const decoded = jwt.verify(token, process.env.JWT_SECRET);
        req.user = await User.findById(decoded.id).select('-password');
        
        if (!req.user) {
            return res.status(401).json({ error: 'User not found' });
        }

        next();
    } catch (error) {
        console.error('Failed to authenticate token:', error);
        res.status(400).json({ error: 'Invalid token' });
    }
};



// Middleware to check if the user has a specific permission
const permissionMiddleware = (permission) => {
    return (req, res, next) => {
        if (!req.user || !req.user.role || !req.user.role.permissions.some(perm => perm.name === permission)) {
            return res.status(403).json({ msg: 'Access denied: Insufficient permissions' });
        }
        next();
    };
};


module.exports = { authMiddleware, permissionMiddleware };
