const { getDB } = require('../config/database');

class IpData {
    constructor(data) {
        this.pid = data.pid;
        this.record_type = data.record_type || 'Search'; // Default to 'Search' if not provided
        this.ip = data.ip;
        this.network = data.network;
        this.version = data.version;
        this.city = data.city;
        this.region = data.region;
        this.region_code = data.region_code;
        this.country = data.country;
        this.country_name = data.country_name;
        this.country_code = data.country_code;
        this.country_code_iso3 = data.country_code_iso3;
        this.country_capital = data.country_capital;
        this.country_tld = data.country_tld;
        this.continent_code = data.continent_code;
        this.in_eu = data.in_eu;
        this.postal = data.postal;
        this.latitude = data.latitude;
        this.longitude = data.longitude;
        this.timezone = data.timezone;
        this.utc_offset = data.utc_offset;
        this.country_calling_code = data.country_calling_code;
        this.currency = data.currency;
        this.currency_name = data.currency_name;
        this.languages = data.languages;
        this.country_area = data.country_area;
        this.country_population = data.country_population;
        this.asn = data.asn;
        this.org = data.org;
        this.createdAt = new Date();
        this.updatedAt = new Date();
    }

    // Save IP data to database
    async save() {
        try {
            const db = getDB();
            const ipDataCollection = db.collection('ip_data');
            
            // Insert IP data
            const result = await ipDataCollection.insertOne(this);
            return result.insertedId;
        } catch (error) {
            throw error;
        }
    }

    // Find IP data by PID
    static async findByPid(pid) {
        try {
            const db = getDB();
            const ipDataCollection = db.collection('ip_data');
            return await ipDataCollection.findOne({ pid: pid });
        } catch (error) {
            throw error;
        }
    }

    // Find IP data by IP address
    static async findByIp(ip) {
        try {
            const db = getDB();
            const ipDataCollection = db.collection('ip_data');
            return await ipDataCollection.findOne({ ip: ip });
        } catch (error) {
            throw error;
        }
    }

    // Get all IP data with pagination and user information
    static async findAll(page = 1, limit = 10, recordType = null) {
        try {
            const db = getDB();
            const ipDataCollection = db.collection('ip_data');
            
            const skip = (page - 1) * limit;
            
            // Use aggregation to join with users collection
            const pipeline = [
                {
                    $lookup: {
                        from: 'users',
                        localField: 'pid',
                        foreignField: 'PID',
                        as: 'userInfo'
                    }
                },
                ...(recordType && recordType !== 'All' ? [{
                    $match: {
                        record_type: recordType
                    }
                }] : []),
                {
                    $unwind: {
                        path: '$userInfo',
                        preserveNullAndEmptyArrays: true
                    }
                },
                {
                    $addFields: {
                        user: {
                            name: '$userInfo.name',
                            email: '$userInfo.email',
                            shift: '$userInfo.shift',
                            shiftLabel: {
                                $switch: {
                                    branches: [
                                        { case: { $eq: ['$userInfo.shift', 1] }, then: 'Morning' },
                                        { case: { $eq: ['$userInfo.shift', 2] }, then: 'Evening' },
                                        { case: { $eq: ['$userInfo.shift', 3] }, then: 'Night' }
                                    ],
                                    default: 'Unknown'
                                }
                            },
                            shiftTime: {
                                $switch: {
                                    branches: [
                                        { case: { $eq: ['$userInfo.shift', 1] }, then: '8:00 AM - 4:00 PM' },
                                        { case: { $eq: ['$userInfo.shift', 2] }, then: '4:00 PM - 12:00 AM' },
                                        { case: { $eq: ['$userInfo.shift', 3] }, then: '12:00 AM - 8:00 AM' }
                                    ],
                                    default: 'Unknown'
                                }
                            }
                        }
                    }
                },
                {
                    $project: {
                        userInfo: 0 // Remove the original userInfo field
                    }
                },
                {
                    $sort: { createdAt: -1 }
                },
                {
                    $skip: skip
                },
                {
                    $limit: limit
                }
            ];
            
            const data = await ipDataCollection.aggregate(pipeline).toArray();
            
            // Get total count with record type filter
            const countPipeline = [
                ...(recordType && recordType !== 'All' ? [{
                    $match: {
                        record_type: recordType
                    }
                }] : [])
            ];
            const totalResult = await ipDataCollection.aggregate(countPipeline).toArray();
            const total = totalResult.length;
            
            return {
                data,
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

    // Get all IP data without pagination (for exports)
    static async findAllWithoutPagination(recordType = null) {
        try {
            const db = getDB();
            const ipDataCollection = db.collection('ip_data');
            
            const pipeline = [
                {
                    $lookup: {
                        from: 'users',
                        localField: 'pid',
                        foreignField: 'PID',
                        as: 'userInfo'
                    }
                },
                ...(recordType && recordType !== 'All' ? [{
                    $match: {
                        record_type: recordType
                    }
                }] : []),
                {
                    $unwind: {
                        path: '$userInfo',
                        preserveNullAndEmptyArrays: true
                    }
                },
                {
                    $addFields: {
                        user: {
                            name: '$userInfo.name',
                            email: '$userInfo.email',
                            shift: '$userInfo.shift',
                            shiftLabel: {
                                $switch: {
                                    branches: [
                                        { case: { $eq: ['$userInfo.shift', 1] }, then: 'Morning' },
                                        { case: { $eq: ['$userInfo.shift', 2] }, then: 'Evening' },
                                        { case: { $eq: ['$userInfo.shift', 3] }, then: 'Night' }
                                    ],
                                    default: 'Unknown'
                                }
                            },
                            shiftTime: {
                                $switch: {
                                    branches: [
                                        { case: { $eq: ['$userInfo.shift', 1] }, then: '8:00 AM - 4:00 PM' },
                                        { case: { $eq: ['$userInfo.shift', 2] }, then: '4:00 PM - 12:00 AM' },
                                        { case: { $eq: ['$userInfo.shift', 3] }, then: '12:00 AM - 8:00 AM' }
                                    ],
                                    default: 'Unknown'
                                }
                            }
                        }
                    }
                },
                {
                    $project: {
                        userInfo: 0
                    }
                },
                {
                    $sort: { createdAt: -1 }
                }
            ];
            
            const data = await ipDataCollection.aggregate(pipeline).toArray();
            return data;
        } catch (error) {
            throw error;
        }
    }

    // Get IP data by shift with pagination and user information
    static async findByShift(shiftId, page = 1, limit = 10, recordType = null) {
        try {
            const db = getDB();
            const ipDataCollection = db.collection('ip_data');
            
            const skip = (page - 1) * limit;
            
            // Use aggregation to join with users collection and filter by shift
            const pipeline = [
                {
                    $lookup: {
                        from: 'users',
                        localField: 'pid',
                        foreignField: 'PID',
                        as: 'userInfo'
                    }
                },
                {
                    $unwind: {
                        path: '$userInfo',
                        preserveNullAndEmptyArrays: false // Only include records with matching users
                    }
                },
                {
                    $match: {
                        'userInfo.shift': shiftId, // Filter by shift
                        ...(recordType && recordType !== 'All' ? { record_type: recordType } : {})
                    }
                },
                {
                    $addFields: {
                        user: {
                            name: '$userInfo.name',
                            email: '$userInfo.email',
                            shift: '$userInfo.shift',
                            shiftLabel: {
                                $switch: {
                                    branches: [
                                        { case: { $eq: ['$userInfo.shift', 1] }, then: 'Morning' },
                                        { case: { $eq: ['$userInfo.shift', 2] }, then: 'Evening' },
                                        { case: { $eq: ['$userInfo.shift', 3] }, then: 'Night' }
                                    ],
                                    default: 'Unknown'
                                }
                            },
                            shiftTime: {
                                $switch: {
                                    branches: [
                                        { case: { $eq: ['$userInfo.shift', 1] }, then: '8:00 AM - 4:00 PM' },
                                        { case: { $eq: ['$userInfo.shift', 2] }, then: '4:00 PM - 12:00 AM' },
                                        { case: { $eq: ['$userInfo.shift', 3] }, then: '12:00 AM - 8:00 AM' }
                                    ],
                                    default: 'Unknown'
                                }
                            }
                        }
                    }
                },
                {
                    $project: {
                        userInfo: 0 // Remove the original userInfo field
                    }
                },
                {
                    $sort: { createdAt: -1 }
                },
                {
                    $skip: skip
                },
                {
                    $limit: limit
                }
            ];
            
            const data = await ipDataCollection.aggregate(pipeline).toArray();
            
            // Get total count for this shift
            const totalPipeline = [
                {
                    $lookup: {
                        from: 'users',
                        localField: 'pid',
                        foreignField: 'PID',
                        as: 'userInfo'
                    }
                },
                {
                    $unwind: {
                        path: '$userInfo',
                        preserveNullAndEmptyArrays: false
                    }
                },
                {
                    $match: {
                        'userInfo.shift': shiftId,
                        ...(recordType && recordType !== 'All' ? { record_type: recordType } : {})
                    }
                },
                {
                    $count: 'total'
                }
            ];
            
            const totalResult = await ipDataCollection.aggregate(totalPipeline).toArray();
            const total = totalResult.length > 0 ? totalResult[0].total : 0;
            
            return {
                data,
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

    // Get IP data statistics
    static async getStatistics() {
        try {
            const db = getDB();
            const ipDataCollection = db.collection('ip_data');
            
            const totalRecords = await ipDataCollection.countDocuments();
            
            const countryStats = await ipDataCollection.aggregate([
                {
                    $group: {
                        _id: '$country_name',
                        count: { $sum: 1 }
                    }
                },
                {
                    $sort: { count: -1 }
                },
                {
                    $limit: 10
                }
            ]).toArray();

            const cityStats = await ipDataCollection.aggregate([
                {
                    $group: {
                        _id: '$city',
                        count: { $sum: 1 }
                    }
                },
                {
                    $sort: { count: -1 }
                },
                {
                    $limit: 10
                }
            ]).toArray();

            return {
                totalRecords,
                topCountries: countryStats,
                topCities: cityStats
            };
        } catch (error) {
            throw error;
        }
    }

    // Delete IP data by PID
    static async deleteByPid(pid) {
        try {
            const db = getDB();
            const ipDataCollection = db.collection('ip_data');
            const result = await ipDataCollection.deleteOne({ pid: pid });
            return result.deletedCount > 0;
        } catch (error) {
            throw error;
        }
    }

    // Delete all IP data records
    static async deleteAll() {
        try {
            const db = getDB();
            const ipDataCollection = db.collection('ip_data');
            const result = await ipDataCollection.deleteMany({});
            return result.deletedCount;
        } catch (error) {
            throw error;
        }
    }
}

module.exports = IpData;
