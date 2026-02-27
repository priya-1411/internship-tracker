const mongoose = require('mongoose');

const preferenceSchema = new mongoose.Schema({
    userId: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'User',
        required: true,
        unique: true,
    },
    enabled: { type: Boolean, default: true },
    daysThreshold: { type: Number, default: 7 },
    lastSentDate: { type: String, default: '' },
}, { timestamps: true });

module.exports = mongoose.model('Preference', preferenceSchema);
