const express = require('express');
const auth = require('../middleware/auth');
const Application = require('../models/Application');
const Subscription = require('../models/Subscription');
const webpush = require('web-push');

const router = express.Router();

// ── Push helper ───────────────────────────────────────────────────────────────

async function sendPushToUser(userId, payload) {
    try {
        const subs = await Subscription.find({ userId });
        for (const sub of subs) {
            try {
                await webpush.sendNotification(
                    { endpoint: sub.endpoint, keys: sub.keys },
                    JSON.stringify(payload)
                );
            } catch (e) {
                console.log('Push failed:', e?.statusCode, e?.message);
                if (e?.statusCode === 410 || e?.statusCode === 404) {
                    await Subscription.deleteOne({ _id: sub._id });
                }
            }
        }
    } catch (e) {
        console.log('sendPushToUser error:', e);
    }
}

// GET /api/applications
router.get('/', auth, async (req, res) => {
    try {
        const apps = await Application.find({ userId: req.userId }).sort({ createdAt: -1 });
        res.json({ applications: apps });
    } catch (e) {
        console.log('Fetch apps error:', e);
        res.status(500).json({ error: `Failed to fetch: ${e.message}` });
    }
});

// POST /api/applications
router.post('/', auth, async (req, res) => {
    try {
        const app = new Application({
            ...req.body,
            userId: req.userId,
        });
        await app.save();
        res.status(201).json({ application: app });
    } catch (e) {
        console.log('Create app error:', e);
        res.status(500).json({ error: `Failed to create: ${e.message}` });
    }
});

// PUT /api/applications/:id
router.put('/:id', auth, async (req, res) => {
    try {
        const existing = await Application.findOne({ _id: req.params.id, userId: req.userId });
        if (!existing) return res.status(404).json({ error: 'Not found' });

        const oldStatus = existing.status;
        Object.assign(existing, req.body);
        await existing.save();

        // Send push notification on status change
        if (req.body.status && req.body.status !== oldStatus) {
            const statusLabel = {
                'to-apply': 'To Apply',
                'applied': 'Applied',
                'interviewing': 'Interviewing 🎤',
                'offer': 'Offer Received 🎉',
                'rejected': 'Rejected',
            };
            sendPushToUser(req.userId, {
                title: `Status Updated: ${existing.company}`,
                body: `${existing.jobTitle} moved from ${statusLabel[oldStatus] ?? oldStatus} → ${statusLabel[req.body.status] ?? req.body.status}`,
                icon: '/favicon.ico',
                badge: '/favicon.ico',
                data: { appId: req.params.id, type: 'status_change' },
            });
        }

        res.json({ application: existing });
    } catch (e) {
        console.log('Update app error:', e);
        res.status(500).json({ error: `Failed to update: ${e.message}` });
    }
});

// DELETE /api/applications/:id
router.delete('/:id', auth, async (req, res) => {
    try {
        const result = await Application.deleteOne({ _id: req.params.id, userId: req.userId });
        if (result.deletedCount === 0) return res.status(404).json({ error: 'Not found' });
        res.json({ success: true });
    } catch (e) {
        console.log('Delete app error:', e);
        res.status(500).json({ error: `Failed to delete: ${e.message}` });
    }
});

module.exports = router;
