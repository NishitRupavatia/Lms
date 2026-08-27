import mongoose from "mongoose";

// Cache the connection across serverless invocations so each request
// reuses the same MongoDB connection instead of opening a new one.
let cached = global.__mongooseConn;

if (!cached) {
    cached = global.__mongooseConn = { conn: null, promise: null };
}

const connectDB = async () => {
    if (cached.conn) return cached.conn;

    if (!process.env.MONGODB_URI) {
        throw new Error("MONGODB_URI is not defined in the environment");
    }

    if (!cached.promise) {
        mongoose.connection.on("connected", () => console.log("Database connected"));

        cached.promise = mongoose
            .connect(`${process.env.MONGODB_URI}/lms`, {
                bufferCommands: false,
            })
            .then((m) => m);
    }

    try {
        cached.conn = await cached.promise;
    } catch (error) {
        cached.promise = null;
        throw error;
    }

    return cached.conn;
};

export default connectDB
