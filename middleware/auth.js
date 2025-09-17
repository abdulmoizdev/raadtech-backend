const jwt = require('jsonwebtoken');
const Admin = require('../models/Admin');

// JWT Secret (should match the one in auth routes)
const JWT_SECRET = process.env.JWT_SECRET || 'your-super-secret-jwt-key-change-in-production';

// Middleware to verify JWT token
const authenticateToken = async (req, res, next) => {
    try {
        // Get token from Authorization header
        const authHeader = req.headers['authorization'];
        const token = authHeader && authHeader.split(' ')[1]; // Bearer TOKEN

        if (!token) {
            return res.status(401).json({
                success: false,
                message: 'Access token required'
            });
        }

        // Verify token
        const decoded = jwt.verify(token, JWT_SECRET);
        
        // Get admin from database to ensure they still exist and are active
        const admin = await Admin.findById(decoded.adminId);
        
        if (!admin) {
            return res.status(401).json({
                success: false,
                message: 'Admin not found'
            });
        }

        if (!admin.isActive) {
            return res.status(401).json({
                success: false,
                message: 'Account is deactivated'
            });
        }

        // Add admin info to request object
        req.admin = {
            id: admin._id,
            email: admin.email,
            name: admin.name,
            role: admin.role
        };

        next();
    } catch (error) {
        console.error('Auth middleware error:', error);
        
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

        return res.status(500).json({
            success: false,
            message: 'Internal server error'
        });
    }
};

// Middleware to check if user is admin
const requireAdmin = (req, res, next) => {
    if (req.admin && req.admin.role === 'admin') {
        next();
    } else {
        return res.status(403).json({
            success: false,
            message: 'Admin access required'
        });
    }
};

module.exports = {
    authenticateToken,
    requireAdmin
};
