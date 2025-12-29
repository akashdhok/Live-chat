import mongoose from "mongoose";


const connectDB = async()=>{
    try {
        let conn = await mongoose.connect(process.env.MONGO_DB_URL);
        console.log(`MongoDB connected: ${conn.connection.host}`);
    } catch (error) {
        console.log(`Error: ${error.message}`);
        process.exit(1);
    }
}

export default connectDB;