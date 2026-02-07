import mongoose from 'mongoose';

const sectionSchema = new mongoose.Schema({
    name: { type: String, required: true, unique: true },
    order: { type: Number, default: 0 }
}, { timestamps: true });

export default mongoose.model('Section', sectionSchema);
