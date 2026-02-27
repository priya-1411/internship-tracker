const mongoose = require('mongoose');

const vapidKeySchema = new mongoose.Schema({
    publicKey: { type: String, required: true },
    privateKey: { type: String, required: true },
}, { timestamps: true });

module.exports = mongoose.model('VapidKey', vapidKeySchema);
