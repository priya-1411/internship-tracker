const mongoose = require('mongoose');

const subscriptionSchema = new mongoose.Schema({
    userId: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'User',
        required: true,
        index: true,
    },
    endpoint: { type: String, required: true },
    keys: {
        p256dh: String,
        auth: String,
    },
    hashKey: { type: String, required: true },
}, { timestamps: true });

// Compound unique index to prevent duplicate subscriptions
subscriptionSchema.index({ userId: 1, hashKey: 1 }, { unique: true });

module.exports = mongoose.model('Subscription', subscriptionSchema);
