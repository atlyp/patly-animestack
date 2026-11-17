import mongoose from "mongoose";

let connectionPromise;

const connectDB = async () => {
    if (mongoose.connection.readyState === 1) return mongoose.connection;
    if (mongoose.connection.readyState === 2) return connectionPromise;
    if (!process.env.MONGO_URI) {
        throw new Error("MONGO_URI is required to connect to MongoDB.");
    }

    connectionPromise = mongoose.connect(process.env.MONGO_URI).catch((error) => {
        connectionPromise = undefined;
        throw error;
    });
    return connectionPromise;
};

export default connectDB;
