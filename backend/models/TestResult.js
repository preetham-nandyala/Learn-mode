import mongoose from 'mongoose';

const testResultSchema = new mongoose.Schema({
    userId: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
    moduleId: { type: mongoose.Schema.Types.ObjectId, ref: 'Module', required: true },
    level: { type: String, enum: ['Basics', 'Intermediate', 'Advance'], required: true },
    score: { type: Number, required: true },
    totalQuestions: { type: Number, required: true },
    answers: [{
        questionId: { type: mongoose.Schema.Types.ObjectId, ref: 'Question' },
        selectedOptionIndex: { type: Number, required: true },
        isCorrect: { type: Boolean, required: true }
    }],
    completedAt: { type: Date, default: Date.now }
}, { timestamps: true });

export default mongoose.model('TestResult', testResultSchema);
