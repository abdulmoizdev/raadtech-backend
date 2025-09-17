const { getDB } = require('../config/database');

class User {
    constructor(data) {
        this.name = data.name;
        this.email = data.email;
        this.phone = data.phone;
        this.shift = data.shift; // 1, 2, 3
        this.PID = data.PID; // Personal ID - number
        this.createdAt = new Date();
        this.updatedAt = new Date();
    }

    // Save user to database
    async save() {
        try {
            const db = getDB();
            const userCollection = db.collection('users');
            
            // Check if email already exists
            const existingUser = await userCollection.findOne({ email: this.email });
            if (existingUser) {
                throw new Error('Email already exists');
            }

            // Check if PID already exists
            const existingPID = await userCollection.findOne({ PID: this.PID });
            if (existingPID) {
                throw new Error('PID already exists');
            }

            const result = await userCollection.insertOne(this);
            return result.insertedId;
        } catch (error) {
            throw error;
        }
    }

    // Get all users with pagination
    static async findAll(page = 1, limit = 10) {
        try {
            const db = getDB();
            const userCollection = db.collection('users');
            
            const skip = (page - 1) * limit;
            
            const users = await userCollection
                .find({})
                .sort({ createdAt: -1 })
                .skip(skip)
                .limit(limit)
                .toArray();
            
            const total = await userCollection.countDocuments();
            
            return {
                users,
                pagination: {
                    page,
                    limit,
                    total,
                    pages: Math.ceil(total / limit)
                }
            };
        } catch (error) {
            throw error;
        }
    }

    // Find user by ID
    static async findById(userId) {
        try {
            const db = getDB();
            const userCollection = db.collection('users');
            
            // Convert string ID to ObjectId if needed
            const { ObjectId } = require('mongodb');
            const objectId = typeof userId === 'string' ? new ObjectId(userId) : userId;
            
            return await userCollection.findOne({ _id: objectId });
        } catch (error) {
            throw error;
        }
    }

    // Find user by email
    static async findByEmail(email) {
        try {
            const db = getDB();
            const userCollection = db.collection('users');
            return await userCollection.findOne({ email: email });
        } catch (error) {
            throw error;
        }
    }

    // Find user by PID
    static async findByPID(PID) {
        try {
            const db = getDB();
            const userCollection = db.collection('users');
            return await userCollection.findOne({ PID: PID });
        } catch (error) {
            throw error;
        }
    }

    // Update user
    static async updateById(userId, updateData) {
        try {
            const db = getDB();
            const userCollection = db.collection('users');
            
            // Convert string ID to ObjectId if needed
            const { ObjectId } = require('mongodb');
            const objectId = typeof userId === 'string' ? new ObjectId(userId) : userId;
            
            updateData.updatedAt = new Date();
            
            const result = await userCollection.updateOne(
                { _id: objectId },
                { $set: updateData }
            );
            
            return result;
        } catch (error) {
            throw error;
        }
    }

    // Delete user
    static async deleteById(userId) {
        try {
            const db = getDB();
            const userCollection = db.collection('users');
            
            // Convert string ID to ObjectId if needed
            const { ObjectId } = require('mongodb');
            const objectId = typeof userId === 'string' ? new ObjectId(userId) : userId;
            
            const result = await userCollection.deleteOne({ _id: objectId });
            return result;
        } catch (error) {
            throw error;
        }
    }

    // Get user statistics
    static async getStatistics() {
        try {
            const db = getDB();
            const userCollection = db.collection('users');
            
            const totalUsers = await userCollection.countDocuments();
            
            const shiftStats = await userCollection.aggregate([
                {
                    $group: {
                        _id: '$shift',
                        count: { $sum: 1 }
                    }
                },
                {
                    $sort: { _id: 1 }
                }
            ]).toArray();
            
            return {
                totalUsers,
                shiftStats
            };
        } catch (error) {
            throw error;
        }
    }
}

module.exports = User;
