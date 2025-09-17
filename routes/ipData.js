const express = require('express');
const IpData = require('../models/IpData');
const User = require('../models/User');
const { authenticateToken, requireAdmin } = require('../middleware/auth');
const router = express.Router();

// Store IP data with PID (Public route for user dashboard)
router.post('/ip-data', async (req, res) => {
    try {
        const { pid, record_type, ipData } = req.body;

        // Validate input
        if (!pid) {
            return res.status(400).json({
                success: false,
                message: 'PID is required'
            });
        }

        if (!record_type) {
            return res.status(400).json({
                success: false,
                message: 'Record type is required'
            });
        }

        // Validate record_type
        const validRecordTypes = ['Search', 'Session', 'Click'];
        if (!validRecordTypes.includes(record_type)) {
            return res.status(400).json({
                success: false,
                message: 'Invalid record type. Must be one of: Search, Session, Click'
            });
        }

        if (!ipData || !ipData.ip) {
            return res.status(400).json({
                success: false,
                message: 'IP data is required'
            });
        }

        // Validate PID exists in User table
        const userExists = await User.findByPID(pid);
        if (!userExists) {
            return res.status(403).json({
                success: false,
                message: 'Invalid PID. This PID is not registered in our system',
                data: {
                    pid: pid,
                    suggestion: 'Please contact administrator to register your PID'
                }
            });
        }

        // Check if IP already exists
        const existingData = await IpData.findByIp(ipData.ip);
        if (existingData) {
            return res.status(409).json({
                success: false,
                message: 'This IP address has already been saved',
                data: {
                    existingPid: existingData.pid,
                    ip: existingData.ip,
                    location: `${existingData.city}, ${existingData.country_name}`
                }
            });
        }

        // Create IP data object
        const ipDataObj = new IpData({
            pid,
            record_type,
            ...ipData
        });

        // Save to database
        const result = await ipDataObj.save();

        res.status(201).json({
            success: true,
            message: 'IP data stored successfully',
            data: {
                id: result,
                pid: pid,
                record_type: record_type,
                ip: ipData.ip,
                city: ipData.city,
                country: ipData.country_name
            }
        });

    } catch (error) {
        console.error('Store IP data error:', error);
        res.status(500).json({
            success: false,
            message: 'Internal server error'
        });
    }
});

// Get IP data by PID (Public route)
router.get('/ip-data/:pid', async (req, res) => {
    try {
        const { pid } = req.params;

        const ipData = await IpData.findByPid(pid);

        if (!ipData) {
            return res.status(404).json({
                success: false,
                message: 'IP data not found for this PID'
            });
        }

        res.status(200).json({
            success: true,
            data: ipData
        });

    } catch (error) {
        console.error('Get IP data error:', error);
        res.status(500).json({
            success: false,
            message: 'Internal server error'
        });
    }
});

// Get all IP data (Admin only)
router.get('/ip-data', authenticateToken, requireAdmin, async (req, res) => {
    try {
        const { page = 1, limit = 10, record_type } = req.query;

        const result = await IpData.findAll(parseInt(page), parseInt(limit), record_type);

        res.status(200).json({
            success: true,
            data: result.data,
            pagination: result.pagination
        });

    } catch (error) {
        console.error('Get all IP data error:', error);
        res.status(500).json({
            success: false,
            message: 'Internal server error'
        });
    }
});

// Get IP data records by shift (Morning, Evening, Night)
router.get('/ip-data/shift/:shiftId', authenticateToken, requireAdmin, async (req, res) => {
    try {
        const { shiftId } = req.params;
        const { page = 1, limit = 10, record_type } = req.query;

        // Validate shift ID
        const validShifts = [1, 2, 3]; // 1=Morning, 2=Evening, 3=Night
        if (!validShifts.includes(parseInt(shiftId))) {
            return res.status(400).json({
                success: false,
                message: 'Invalid shift ID. Must be 1 (Morning), 2 (Evening), or 3 (Night)'
            });
        }

        const result = await IpData.findByShift(parseInt(shiftId), parseInt(page), parseInt(limit), record_type);

        res.status(200).json({
            success: true,
            data: result.data,
            pagination: result.pagination
        });

    } catch (error) {
        console.error('Get IP data by shift error:', error);
        res.status(500).json({
            success: false,
            message: 'Internal server error'
        });
    }
});

// Get IP data statistics (Admin only)
router.get('/ip-data-stats', authenticateToken, requireAdmin, async (req, res) => {
    try {
        const stats = await IpData.getStatistics();

        res.status(200).json({
            success: true,
            data: stats
        });

    } catch (error) {
        console.error('Get IP data stats error:', error);
        res.status(500).json({
            success: false,
            message: 'Internal server error'
        });
    }
});

// Delete IP data by PID (Admin only)
router.delete('/ip-data/:pid', authenticateToken, requireAdmin, async (req, res) => {
    try {
        const { pid } = req.params;

        const deleted = await IpData.deleteByPid(pid);

        if (!deleted) {
            return res.status(404).json({
                success: false,
                message: 'IP data not found for this PID'
            });
        }

        res.status(200).json({
            success: true,
            message: 'IP data deleted successfully'
        });

    } catch (error) {
        console.error('Delete IP data error:', error);
        res.status(500).json({
            success: false,
            message: 'Internal server error'
        });
    }
});

// Delete all IP data records (Admin only)
router.delete('/ip-data', authenticateToken, requireAdmin, async (req, res) => {
    try {
        const deletedCount = await IpData.deleteAll();

        res.status(200).json({
            success: true,
            message: `Successfully deleted ${deletedCount} IP data records`,
            data: {
                deletedCount: deletedCount
            }
        });

    } catch (error) {
        console.error('Delete all IP data error:', error);
        res.status(500).json({
            success: false,
            message: 'Internal server error'
        });
    }
});

module.exports = router;
