const { MongoClient } = require('mongodb');

let db;
let client;

const connectDB = async () => {
    try {
        // MongoDB connection string from environment variables
        const mongoURI = process.env.MONGODB_URI;
        
        if (!mongoURI) {
            throw new Error('MONGODB_URI is not defined in environment variables');
        }

        console.log('Connecting to MongoDB...');
        
        // Create MongoDB client
        client = new MongoClient(mongoURI);
        
        // Connect to MongoDB
        await client.connect();
        
        // Get database name from URI or use default
        const dbName = process.env.DB_NAME || 'raadtech_db';
        db = client.db(dbName);
        
        console.log(`Successfully connected to MongoDB database: ${dbName}`);
        
        return db;
    } catch (error) {
        console.error('MongoDB connection error:', error.message);
        process.exit(1);
    }
};

const getDB = () => {
    if (!db) {
        throw new Error('Database not initialized. Call connectDB first.');
    }
    return db;
};

const closeDB = async () => {
    if (client) {
        await client.close();
        console.log('MongoDB connection closed');
    }
};

module.exports = {
    connectDB,
    getDB,
    closeDB
};
