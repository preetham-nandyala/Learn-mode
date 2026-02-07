import mongoose from 'mongoose';

const moduleSchema = new mongoose.Schema({
    title: { type: String, required: true },
    description: { type: String },
    section: { type: mongoose.Schema.Types.ObjectId, ref: 'Section' },
    order: { type: Number, default: 0 },
    isFeatured: { type: Boolean, default: false },
    featuredOrder: { type: Number, default: 0 },
    isDisplay: { type: Boolean, default: true },
    createdBy: { type: mongoose.Schema.Types.ObjectId, ref: 'User' }
}, { timestamps: true });

export default mongoose.model('Module', moduleSchema);
