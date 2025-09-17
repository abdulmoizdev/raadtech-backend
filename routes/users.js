const express = require('express');
const User = require('../models/User');
const { authenticateToken, requireAdmin } = require('../middleware/auth');
const router = express.Router();

// Get all users (Admin only)
router.get('/users', authenticateToken, requireAdmin, async (req, res) => {
    try {
        const { page = 1, limit = 10 } = req.query;
        const result = await User.findAll(parseInt(page), parseInt(limit));
        
        res.json({
            success: true,
            data: result.users,
            pagination: result.pagination
        });
    } catch (error) {
        console.error('Error fetching users:', error);
        res.status(500).json({
            success: false,
            message: 'Failed to fetch users',
            error: error.message
        });
    }
});

// Get user by ID (Admin only)
router.get('/users/:id', authenticateToken, requireAdmin, async (req, res) => {
    try {
        const { id } = req.params;
        const user = await User.findById(id);
        
        if (!user) {
            return res.status(404).json({
                success: false,
                message: 'User not found'
            });
        }
        
        res.json({
            success: true,
            data: user
        });
    } catch (error) {
        console.error('Error fetching user:', error);
        res.status(500).json({
            success: false,
            message: 'Failed to fetch user',
            error: error.message
        });
    }
});

// Create new user (Admin only)
router.post('/users', authenticateToken, requireAdmin, async (req, res) => {
    try {
        const { name, email, phone, shift, PID } = req.body;
        
        // Validation
        if (!name || !email || !phone || !shift || !PID) {
            return res.status(400).json({
                success: false,
                message: 'All fields are required'
            });
        }
        
        // Validate email format
        const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
        if (!emailRegex.test(email)) {
            return res.status(400).json({
                success: false,
                message: 'Invalid email format'
            });
        }
        
        // Validate shift (1, 2, 3)
        if (![1, 2, 3].includes(parseInt(shift))) {
            return res.status(400).json({
                success: false,
                message: 'Shift must be 1 (Morning), 2 (Evening), or 3 (Night)'
            });
        }
        
        // Validate PID (numbers only)
        if (!/^\d+$/.test(PID.toString())) {
            return res.status(400).json({
                success: false,
                message: 'PID must contain only numbers'
            });
        }
        
        // Validate phone number (basic validation)
        if (phone.length < 10) {
            return res.status(400).json({
                success: false,
                message: 'Phone number must be at least 10 characters'
            });
        }
        
        const userData = {
            name: name.trim(),
            email: email.trim().toLowerCase(),
            phone: phone.trim(),
            shift: parseInt(shift),
            PID: PID.toString().trim()
        };
        
        const user = new User(userData);
        const userId = await user.save();
        
        res.status(201).json({
            success: true,
            message: 'User created successfully',
            data: {
                id: userId,
                ...userData
            }
        });
    } catch (error) {
        console.error('Error creating user:', error);
        
        if (error.message === 'Email already exists') {
            return res.status(409).json({
                success: false,
                message: 'Email already exists'
            });
        }
        
        if (error.message === 'PID already exists') {
            return res.status(409).json({
                success: false,
                message: 'PID already exists'
            });
        }
        
        res.status(500).json({
            success: false,
            message: 'Failed to create user',
            error: error.message
        });
    }
});

// Update user (Admin only)
router.put('/users/:id', authenticateToken, requireAdmin, async (req, res) => {
    try {
        const { id } = req.params;
        const { name, email, phone, shift, PID } = req.body;
        
        // Check if user exists
        const existingUser = await User.findById(id);
        if (!existingUser) {
            return res.status(404).json({
                success: false,
                message: 'User not found'
            });
        }
        
        // Validation (PID not required for updates as it cannot be changed)
        if (!name || !email || !phone || !shift) {
            return res.status(400).json({
                success: false,
                message: 'Name, email, phone, and shift are required'
            });
        }
        
        // Validate email format
        const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
        if (!emailRegex.test(email)) {
            return res.status(400).json({
                success: false,
                message: 'Invalid email format'
            });
        }
        
        // Validate shift (1, 2, 3)
        if (![1, 2, 3].includes(parseInt(shift))) {
            return res.status(400).json({
                success: false,
                message: 'Shift must be 1 (Morning), 2 (Evening), or 3 (Night)'
            });
        }
        
        // Validate phone number
        if (phone.length < 10) {
            return res.status(400).json({
                success: false,
                message: 'Phone number must be at least 10 characters'
            });
        }
        
        // Check if email is being changed and if new email already exists
        if (email.toLowerCase() !== existingUser.email) {
            const emailExists = await User.findByEmail(email.toLowerCase());
            if (emailExists) {
                return res.status(409).json({
                    success: false,
                    message: 'Email already exists'
                });
            }
        }
        
        const updateData = {
            name: name.trim(),
            email: email.trim().toLowerCase(),
            phone: phone.trim(),
            shift: parseInt(shift)
            // PID is not included as it cannot be changed
        };
        
        const result = await User.updateById(id, updateData);
        
        if (result.matchedCount === 0) {
            return res.status(404).json({
                success: false,
                message: 'User not found'
            });
        }
        
        res.json({
            success: true,
            message: 'User updated successfully',
            data: {
                id: id,
                ...updateData
            }
        });
    } catch (error) {
        console.error('Error updating user:', error);
        res.status(500).json({
            success: false,
            message: 'Failed to update user',
            error: error.message
        });
    }
});

// Delete user (Admin only)
router.delete('/users/:id', authenticateToken, requireAdmin, async (req, res) => {
    try {
        const { id } = req.params;
        
        // Check if user exists
        const existingUser = await User.findById(id);
        if (!existingUser) {
            return res.status(404).json({
                success: false,
                message: 'User not found'
            });
        }
        
        const result = await User.deleteById(id);
        
        if (result.deletedCount === 0) {
            return res.status(404).json({
                success: false,
                message: 'User not found'
            });
        }
        
        res.json({
            success: true,
            message: 'User deleted successfully',
            data: {
                id: id,
                name: existingUser.name,
                email: existingUser.email
            }
        });
    } catch (error) {
        console.error('Error deleting user:', error);
        res.status(500).json({
            success: false,
            message: 'Failed to delete user',
            error: error.message
        });
    }
});

// Get user statistics (Admin only)
router.get('/users-stats', authenticateToken, requireAdmin, async (req, res) => {
    try {
        const stats = await User.getStatistics();
        
        res.json({
            success: true,
            data: stats
        });
    } catch (error) {
        console.error('Error fetching user statistics:', error);
        res.status(500).json({
            success: false,
            message: 'Failed to fetch user statistics',
            error: error.message
        });
    }
});

module.exports = router;
