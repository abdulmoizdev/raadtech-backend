const express = require('express');
const jwt = require('jsonwebtoken');
const bcrypt = require('bcryptjs');
const Admin = require('../models/Admin');
const router = express.Router();

// JWT Secret (in production, use environment variable)
const JWT_SECRET = process.env.JWT_SECRET || 'your-super-secret-jwt-key-change-in-production';

// Admin Login Route
router.post('/admin/login', async (req, res) => {
    try {
        const { email, password } = req.body;

        // Validate input
        if (!email || !password) {
            return res.status(400).json({
                success: false,
                message: 'Email and password are required'
            });
        }

        // Find admin by email
        const admin = await Admin.findByEmail(email);
        
        if (!admin) {
            return res.status(401).json({
                success: false,
                message: 'Invalid email or password'
            });
        }

        // Check if admin is active
        if (!admin.isActive) {
            return res.status(401).json({
                success: false,
                message: 'Account is deactivated. Please contact administrator.'
            });
        }

        // Compare password
        const isPasswordValid = await bcrypt.compare(password, admin.password);
        
        if (!isPasswordValid) {
            return res.status(401).json({
                success: false,
                message: 'Invalid email or password'
            });
        }

        // Generate JWT token
        const token = jwt.sign(
            { 
                adminId: admin._id,
                email: admin.email,
                role: admin.role
            },
            JWT_SECRET,
            { expiresIn: '24h' } // Token expires in 24 hours
        );

        // Update last login
        await Admin.updateLastLogin(admin._id);

        // Return success response with token
        res.status(200).json({
            success: true,
            message: 'Login successful',
            data: {
                token: token,
                admin: {
                    id: admin._id,
                    name: admin.name,
                    email: admin.email,
                    role: admin.role,
                    lastLogin: admin.lastLogin
                }
            }
        });

    } catch (error) {
        console.error('Login error:', error);
        res.status(500).json({
            success: false,
            message: 'Internal server error'
        });
    }
});

// Admin Register Route (for creating new admin accounts)
router.post('/admin/register', async (req, res) => {
    try {
        const { name, email, password } = req.body;

        // Validate input
        if (!name || !email || !password) {
            return res.status(400).json({
                success: false,
                message: 'Name, email, and password are required'
            });
        }

        // Validate email format
        const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
        if (!emailRegex.test(email)) {
            return res.status(400).json({
                success: false,
                message: 'Please provide a valid email address'
            });
        }

        // Validate password strength
        if (password.length < 6) {
            return res.status(400).json({
                success: false,
                message: 'Password must be at least 6 characters long'
            });
        }

        // Create new admin
        const adminData = {
            name,
            email,
            password
        };

        const admin = new Admin(adminData);
        const adminId = await admin.save();

        res.status(201).json({
            success: true,
            message: 'Admin account created successfully',
            data: {
                adminId: adminId,
                name: admin.name,
                email: admin.email,
                role: admin.role
            }
        });

    } catch (error) {
        console.error('Registration error:', error);
        
        if (error.message === 'Admin with this email already exists') {
            return res.status(409).json({
                success: false,
                message: 'Admin with this email already exists'
            });
        }

        res.status(500).json({
            success: false,
            message: 'Internal server error'
        });
    }
});

// Get Admin Profile Route
router.get('/admin/profile', async (req, res) => {
    try {
        // Get token from header
        const token = req.headers.authorization?.split(' ')[1];
        
        if (!token) {
            return res.status(401).json({
                success: false,
                message: 'Access token required'
            });
        }

        // Verify token
        const decoded = jwt.verify(token, JWT_SECRET);
        const admin = await Admin.findById(decoded.adminId);

        if (!admin) {
            return res.status(404).json({
                success: false,
                message: 'Admin not found'
            });
        }

        res.status(200).json({
            success: true,
            data: {
                admin: admin
            }
        });

    } catch (error) {
        console.error('Profile error:', error);
        
        if (error.name === 'JsonWebTokenError') {
            return res.status(401).json({
                success: false,
                message: 'Invalid token'
            });
        }

        if (error.name === 'TokenExpiredError') {
            return res.status(401).json({
                success: false,
                message: 'Token expired'
            });
        }

        res.status(500).json({
            success: false,
            message: 'Internal server error'
        });
    }
});

// Change Admin Password Route
router.put('/admin/change-password', async (req, res) => {
    try {
        const { email, newPassword } = req.body;

        // Validate input
        if (!email || !newPassword) {
            return res.status(400).json({
                success: false,
                message: 'Email and new password are required'
            });
        }

        // Validate email format
        const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
        if (!emailRegex.test(email)) {
            return res.status(400).json({
                success: false,
                message: 'Please provide a valid email address'
            });
        }

        // Validate password strength
        if (newPassword.length < 6) {
            return res.status(400).json({
                success: false,
                message: 'Password must be at least 6 characters long'
            });
        }

        // Find admin by email
        const admin = await Admin.findByEmail(email);
        
        if (!admin) {
            return res.status(404).json({
                success: false,
                message: 'Admin with this email does not exist'
            });
        }

        // Check if admin is active
        if (!admin.isActive) {
            return res.status(400).json({
                success: false,
                message: 'Account is deactivated. Please contact administrator.'
            });
        }

        // Hash the new password
        const saltRounds = 10;
        const hashedPassword = await bcrypt.hash(newPassword, saltRounds);

        // Update password in database
        const updated = await Admin.updatePassword(admin._id, hashedPassword);

        if (!updated) {
            return res.status(500).json({
                success: false,
                message: 'Failed to update password'
            });
        }

        res.status(200).json({
            success: true,
            message: 'Password changed successfully'
        });

    } catch (error) {
        console.error('Change password error:', error);
        res.status(500).json({
            success: false,
            message: 'Internal server error'
        });
    }
});

module.exports = router;
