import mongoose from 'mongoose';

const courseProgressSchema = new mongoose.Schema({
    userId: { type: String, required: true },
    courseId: { type: String, required: true },
    completed: { type: Boolean, default: false },
    lectureCompleted: { type: [String], default: [] }
}, { minimize: false, timestamps: true });

// Reuse the compiled model across serverless invocations (avoids OverwriteModelError)
export const CourseProgress = mongoose.models.CourseProgress || mongoose.model('CourseProgress', courseProgressSchema)
