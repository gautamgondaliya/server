const express = require('express');
const router = express.Router();
const Role = require('../models/RoleModel');
const Permission = require('../models/PermissionModel');
const { authMiddleware, permissionMiddleware } = require('../middleware/auth');

// Create a new role
router.post('/roles', authMiddleware, permissionMiddleware('create_role'), async (req, res) => {
    const { name, permissions } = req.body;

    if (!name || !permissions) {
        return res.status(400).json({ msg: 'Please provide name and permissions' });
    }

    try {
        const newRole = new Role({ name, permissions });
        await newRole.save();
        return res.status(201).json({ msg: 'Role created successfully', role: newRole });
    } catch (err) {
        console.error(err.message);
        return res.status(500).send('Server error');
    }
});

// Get all roles
router.get('/roles', authMiddleware, permissionMiddleware('view_roles'), async (req, res) => {
    try {
        const roles = await Role.find().populate('permissions');
        res.status(200).json(roles);
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
});

// Create a new permission
router.post('/permissions', authMiddleware, permissionMiddleware('create_permission'), async (req, res) => {
    try {
        const { name, description } = req.body;
        const newPermission = new Permission({ name, description });
        await newPermission.save();
        res.status(201).json(newPermission);
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
});

// Get all permissions
router.get('/permissions', authMiddleware, permissionMiddleware('view_permissions'), async (req, res) => {
    try {
        const permissions = await Permission.find();
        res.status(200).json(permissions);
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
});

module.exports = router;
