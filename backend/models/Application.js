const mongoose = require('mongoose');

const networkingContactSchema = new mongoose.Schema({
    id: String,
    name: String,
    role: String,
    company: String,
    linkedinUrl: String,
    lastContactDate: String,
    notes: String,
}, { _id: false });

const applicationSchema = new mongoose.Schema({
    userId: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'User',
        required: true,
        index: true,
    },
    company: { type: String, default: '' },
    jobTitle: { type: String, default: '' },
    location: { type: String, default: '' },
    salary: { type: String, default: '' },
    deadline: { type: String, default: '' },
    status: {
        type: String,
        enum: ['to-apply', 'applied', 'interviewing', 'offer', 'rejected'],
        default: 'to-apply',
    },
    skills: [String],
    requiredSkills: [String],
    gpa: { type: Number, default: 0 },
    hasReferral: { type: Boolean, default: false },
    lastContactDate: { type: String, default: '' },
    appliedDate: { type: String, default: '' },
    networkingContacts: [networkingContactSchema],
    notes: { type: String, default: '' },
}, { timestamps: true });

// Virtual for `id` (frontend expects `id`, not `_id`)
applicationSchema.set('toJSON', {
    virtuals: true,
    transform: (doc, ret) => {
        ret.id = ret._id.toString();
        ret.createdAt = ret.createdAt?.toISOString?.() || ret.createdAt;
        delete ret._id;
        delete ret.__v;
        delete ret.userId;
        return ret;
    },
});

module.exports = mongoose.model('Application', applicationSchema);
