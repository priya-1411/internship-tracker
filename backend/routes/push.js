const express = require('express');
const webpush = require('web-push');
const auth = require('../middleware/auth');
const Subscription = require('../models/Subscription');
const VapidKey = require('../models/VapidKey');

const router = express.Router();

// Helper to create a short hash of a string
function shortHash(str) {
    let h = 0;
    for (let i = 0; i < str.length; i++) {
        h = Math.imul(31, h) + str.charCodeAt(i) | 0;
    }
    return Math.abs(h).toString(36).slice(0, 10);
}

// GET /api/vapid-public-key
router.get('/vapid-public-key', async (req, res) => {
    try {
        const keys = await VapidKey.findOne();
        if (!keys) return res.status(503).json({ error: 'VAPID not initialized' });
        res.json({ publicKey: keys.publicKey });
    } catch (e) {
        res.status(500).json({ error: `${e.message}` });
    }
});

// POST /api/push/subscribe
router.post('/subscribe', auth, async (req, res) => {
    try {
        const subscription = req.body;
        const hash = shortHash(subscription.endpoint);

        await Subscription.findOneAndUpdate(
            { userId: req.userId, hashKey: hash },
            {
                userId: req.userId,
                endpoint: subscription.endpoint,
                keys: subscription.keys,
                hashKey: hash,
            },
            { upsert: true, new: true }
        );

        console.log(`Saved push subscription for user ${req.userId}`);
        res.json({ success: true });
    } catch (e) {
        res.status(500).json({ error: `Failed to save subscription: ${e.message}` });
    }
});

// DELETE /api/push/subscribe
router.delete('/subscribe', auth, async (req, res) => {
    try {
        const { endpoint } = req.body;
        const hash = shortHash(endpoint);
        await Subscription.deleteOne({ userId: req.userId, hashKey: hash });
        res.json({ success: true });
    } catch (e) {
        res.status(500).json({ error: `Failed to remove subscription: ${e.message}` });
    }
});

module.exports = router;
