const express = require('express');
const cors = require('cors');
require('dotenv').config();

// Import database connection
const { connectDB } = require('./config/database');

// Import routes
const authRoutes = require('./routes/auth');
const ipDataRoutes = require('./routes/ipData');
const userRoutes = require('./routes/users');
const geoRoutes = require('./routes/geo');

const app = express();
const PORT = process.env.PORT || 5000;

// Middleware
app.use(cors());
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// Connect to MongoDB
connectDB();

// Routes
app.use('/api', authRoutes);
app.use('/api', ipDataRoutes);
app.use('/api', userRoutes);
app.use('/api', geoRoutes);

// Basic route for testing
app.get('/', (req, res) => {
    res.json({ 
        message: 'Backend server is running!',
        status: 'success'
    });
});

// Health check route
app.get('/health', (req, res) => {
    res.json({ 
        status: 'healthy',
        timestamp: new Date().toISOString()
    });
});

// Start server
app.listen(PORT, () => {
    console.log(`Server is running on port ${PORT}`);
    console.log(`Visit http://localhost:${PORT} to test the server`);
});

module.exports = app;
