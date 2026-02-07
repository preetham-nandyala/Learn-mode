import mongoose from 'mongoose';

const questionSchema = new mongoose.Schema({
    moduleId: { type: mongoose.Schema.Types.ObjectId, ref: 'Module', required: true },
    questionText: { type: String, required: true },
    options: [{ type: String, required: true }],
    correctOptionIndex: { type: Number, required: true }, // 0-3
    explanation: { type: String },
    level: { type: String, enum: ['Basics', 'Intermediate', 'Advance'], default: 'Basics' }
}, { timestamps: true });

export default mongoose.model('Question', questionSchema);
