const bcrypt = require('bcryptjs');
const { getDB } = require('../config/database');

class Admin {
    constructor(adminData) {
        this.email = adminData.email;
        this.password = adminData.password;
        this.name = adminData.name;
        this.role = 'admin';
        this.isActive = true;
        this.createdAt = new Date();
        this.lastLogin = null;
    }

    // Hash password before saving
    async hashPassword() {
        const saltRounds = 12;
        this.password = await bcrypt.hash(this.password, saltRounds);
    }

    // Compare password for login
    async comparePassword(candidatePassword) {
        return await bcrypt.compare(candidatePassword, this.password);
    }

    // Save admin to database
    async save() {
        try {
            const db = getDB();
            const adminCollection = db.collection('admins');
            
            // Check if admin already exists
            const existingAdmin = await adminCollection.findOne({ email: this.email });
            if (existingAdmin) {
                throw new Error('Admin with this email already exists');
            }

            // Hash password before saving
            await this.hashPassword();

            // Insert admin
            const result = await adminCollection.insertOne(this);
            return result.insertedId;
        } catch (error) {
            throw error;
        }
    }

    // Find admin by email
    static async findByEmail(email) {
        try {
            const db = getDB();
            const adminCollection = db.collection('admins');
            return await adminCollection.findOne({ email: email });
        } catch (error) {
            throw error;
        }
    }

    // Update last login
    static async updateLastLogin(adminId) {
        try {
            const db = getDB();
            const adminCollection = db.collection('admins');
            await adminCollection.updateOne(
                { _id: adminId },
                { $set: { lastLogin: new Date() } }
            );
        } catch (error) {
            throw error;
        }
    }

    // Get admin by ID (without password)
    static async findById(adminId) {
        try {
            const db = getDB();
            const adminCollection = db.collection('admins');
            
            // Convert string ID to ObjectId if needed
            const { ObjectId } = require('mongodb');
            const objectId = typeof adminId === 'string' ? new ObjectId(adminId) : adminId;
            
            return await adminCollection.findOne(
                { _id: objectId },
                { projection: { password: 0 } } // Exclude password from result
            );
        } catch (error) {
            throw error;
        }
    }

    // Get all admins (without passwords)
    static async findAll() {
        try {
            const db = getDB();
            const adminCollection = db.collection('admins');
            return await adminCollection.find(
                {},
                { projection: { password: 0 } }
            ).toArray();
        } catch (error) {
            throw error;
        }
    }

    // Update admin password
    static async updatePassword(adminId, hashedPassword) {
        try {
            const db = getDB();
            const adminCollection = db.collection('admins');
            
            // Convert string ID to ObjectId if needed
            const { ObjectId } = require('mongodb');
            const objectId = typeof adminId === 'string' ? new ObjectId(adminId) : adminId;
            
            const result = await adminCollection.updateOne(
                { _id: objectId },
                { 
                    $set: { 
                        password: hashedPassword,
                        updatedAt: new Date()
                    } 
                }
            );
            
            return result.modifiedCount > 0;
        } catch (error) {
            throw error;
        }
    }
}

module.exports = Admin;
