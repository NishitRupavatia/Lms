import mongoose from 'mongoose'

const purchaseSchema = new mongoose.Schema({
    courseId: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'Course',
        required: true
    },
    userId: {
        type: String,
        ref: 'User',
        required: true
    },
    amount: { type: Number, required: true },
    status: { type: String, enum: ['pending', 'completed', 'failed'], default: 'pending' }
}, { timestamps: true });

// Reuse the compiled model across serverless invocations (avoids OverwriteModelError)
export const Purchase = mongoose.models.Purchase || mongoose.model('Purchase', purchaseSchema)
