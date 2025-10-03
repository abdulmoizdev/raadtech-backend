const express = require('express');
const fetch = require('node-fetch');
const router = express.Router();

/**
 * CHANGED: Geo endpoint that receives IP from frontend and gets geo data
 * 
 * Changes made:
 * 1. Removed all caching functionality
 * 2. Now accepts IP from frontend via POST request
 * 3. Uses https://api.ipinfo.io/lite/{ip}?token=YOUR_TOKEN
 * 4. Updated response format to match ipinfo.io Lite API
 * 5. Simplified error handling
 * 
 * Flow:
 * 1. Frontend gets browser IP and sends it to backend
 * 2. Backend receives IP and gets geo data for that specific IP
 * 3. Token is hardcoded in the file: '8d7c76a4935fc3'
 */

/**
 * POST /api/geo
 * Receives IP from frontend and returns geo location data using ipinfo.io Lite API
 */
router.post('/geo', async (req, res) => {
    try {
        // Step 1: Get IP from frontend request body
        const { ip } = req.body;
        
        if (!ip) {
            return res.status(400).json({
                success: false,
                error: 'missing_ip',
                message: 'IP address is required'
            });
        }
        
        const clientIP = ip;
        console.log(`Received IP from frontend: ${clientIP}`);
        
        // Step 2: Fetch geo data from ipinfo.io Lite API
        console.log(`🌐 Fetching geo data for IP: ${clientIP}`);
        
        // CHANGED: Using direct token instead of environment variable
        const ipinfoToken = '8d7c76a4935fc3';
        
        const geoResponse = await fetch(`https://api.ipinfo.io/lite/${clientIP}?token=${ipinfoToken}`, {
            timeout: 15000 // 15 second timeout
        });
        
        if (!geoResponse.ok) {
            // Handle rate limiting specifically
            if (geoResponse.status === 429) {
                return res.status(429).json({
                    success: false,
                    error: 'rate_limit_exceeded',
                    message: 'Geo API rate limit exceeded. Please try again later.',
                    retryAfter: 3600 // Suggest retry after 1 hour
                });
            }
            
            throw new Error(`Failed to fetch geo data: ${geoResponse.status} ${geoResponse.statusText}`);
        }
        
        const geoData = await geoResponse.json();
        
        // CHANGED: Transform ipinfo.io Lite response to match expected format
        const transformedData = {
            ip: geoData.ip,
            city: geoData.city || null,
            region: geoData.region || null,
            country_name: geoData.country || null,
            country_code: geoData.country_code || null,
            latitude: geoData.latitude || null,
            longitude: geoData.longitude || null,
            timezone: geoData.timezone || null,
            org: geoData.as_name || null,
            asn: geoData.asn || null,
            postal: geoData.postal || null,
            version: 'IPv4',
            currency: null, // ipinfo.io Lite doesn't provide currency
            continent_code: geoData.continent_code || null,
            country_tld: null, // ipinfo.io Lite doesn't provide TLD
            languages: null, // ipinfo.io Lite doesn't provide languages
            country_calling_code: null, // ipinfo.io Lite doesn't provide calling code
            in_eu: null, // ipinfo.io Lite doesn't provide EU status
            utc_offset: null // ipinfo.io Lite doesn't provide UTC offset
        };
        
        console.log(`✅ Successfully fetched geo data for IP: ${clientIP}`);
        
        res.json({
            success: true,
            data: transformedData,
            message: 'Geo data fetched successfully from ipinfo.io Lite'
        });
        
    } catch (error) {
        console.error('❌ Error in geo endpoint:', error);
        
        res.status(500).json({
            success: false,
            error: 'lookup failed',
            message: error.message || 'Failed to fetch geo location data',
            details: process.env.NODE_ENV === 'development' ? error.stack : undefined
        });
    }
});

module.exports = router;