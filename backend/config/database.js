const mongoose = require('mongoose');

const connectDB = async () => {
    try {
        // Thay thế YOUR_ACTUAL_PASSWORD bằng password thực của bạn
        const conn = await mongoose.connect(
            'mongodb+srv://nguyenminhhieudnc_db_user:123@cluster0.llbjaqb.mongodb.net/groupDB?retryWrites=true&w=majority&appName=Cluster0',
            {
                useNewUrlParser: true,
                useUnifiedTopology: true,
            }
        );
        
        console.log(`✅ MongoDB Connected: ${conn.connection.host}`);
        console.log(`📊 Database: ${conn.connection.name}`);
    } catch (error) {
        console.error('❌ Database connection error:', error.message);
        process.exit(1);
    }
};

module.exports = connectDB;