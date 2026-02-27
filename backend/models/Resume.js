const mongoose = require('mongoose');

const resumeSchema = new mongoose.Schema({
    userId: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'User',
        required: true,
        index: true,
    },
    appId: {
        type: String,
        required: true,
        index: true,
    },
    filename: { type: String, required: true },
    storagePath: { type: String, required: true },
    size: { type: Number, default: 0 },
    version: { type: String, default: 'v1' },
    notes: { type: String, default: '' },
}, { timestamps: true });

resumeSchema.set('toJSON', {
    virtuals: true,
    transform: (doc, ret) => {
        ret.id = ret._id.toString();
        ret.uploadedAt = ret.createdAt?.toISOString?.() || ret.createdAt;
        delete ret._id;
        delete ret.__v;
        delete ret.userId;
        return ret;
    },
});

module.exports = mongoose.model('Resume', resumeSchema);
