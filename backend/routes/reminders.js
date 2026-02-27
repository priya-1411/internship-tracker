const express = require('express');
const auth = require('../middleware/auth');
const Application = require('../models/Application');
const Preference = require('../models/Preference');
const Subscription = require('../models/Subscription');
const webpush = require('web-push');

const router = express.Router();

// ── Email Helper (Resend) ────────────────────────────────────────────────────

async function sendEmail(to, subject, html) {
    const apiKey = process.env.RESEND_API_KEY;
    if (!apiKey) throw new Error('RESEND_API_KEY environment variable not set');

    const res = await fetch('https://api.resend.com/emails', {
        method: 'POST',
        headers: {
            Authorization: `Bearer ${apiKey}`,
            'Content-Type': 'application/json',
        },
        body: JSON.stringify({
            from: 'InternTrack <onboarding@resend.dev>',
            to: [to],
            subject,
            html,
        }),
    });

    if (!res.ok) {
        const body = await res.text();
        throw new Error(`Resend error ${res.status}: ${body}`);
    }
    return res.json();
}

function deadlineEmailHtml(apps) {
    const rows = apps.map((a) => {
        const daysLeft = Math.ceil(
            (new Date(a.deadline).getTime() - Date.now()) / (1000 * 60 * 60 * 24)
        );
        const urgency = daysLeft <= 1 ? '🔴' : daysLeft <= 3 ? '🟡' : '🟢';
        return `
      <tr>
        <td style="padding:10px 8px;border-bottom:1px solid #eee">${urgency} <strong>${a.company}</strong></td>
        <td style="padding:10px 8px;border-bottom:1px solid #eee">${a.jobTitle}</td>
        <td style="padding:10px 8px;border-bottom:1px solid #eee;color:${daysLeft <= 1 ? '#ef4444' : daysLeft <= 3 ? '#f59e0b' : '#22c55e'}">
          ${daysLeft <= 0 ? 'TODAY!' : daysLeft === 1 ? 'Tomorrow' : `${daysLeft} days`}
        </td>
      </tr>`;
    }).join('');

    return `
    <div style="font-family:sans-serif;max-width:600px;margin:0 auto;padding:24px">
      <div style="background:linear-gradient(135deg,#4f46e5,#7c3aed);padding:24px;border-radius:12px;margin-bottom:24px">
        <h1 style="color:white;margin:0;font-size:22px">📅 InternTrack Deadline Reminder</h1>
        <p style="color:rgba(255,255,255,0.8);margin:8px 0 0">You have ${apps.length} upcoming application deadline${apps.length > 1 ? 's' : ''}</p>
      </div>
      <table style="width:100%;border-collapse:collapse">
        <thead>
          <tr style="background:#f8fafc">
            <th style="padding:10px 8px;text-align:left;font-size:12px;text-transform:uppercase;color:#64748b">Company</th>
            <th style="padding:10px 8px;text-align:left;font-size:12px;text-transform:uppercase;color:#64748b">Role</th>
            <th style="padding:10px 8px;text-align:left;font-size:12px;text-transform:uppercase;color:#64748b">Deadline</th>
          </tr>
        </thead>
        <tbody>${rows}</tbody>
      </table>
      <div style="margin-top:24px;padding:16px;background:#f0f4ff;border-radius:8px">
        <p style="margin:0;font-size:14px;color:#4f46e5">
          <strong>Tip:</strong> Log in to InternTrack to update your application status and stay on top of deadlines.
        </p>
      </div>
      <p style="margin-top:16px;font-size:12px;color:#94a3b8;text-align:center">
        You received this because you enabled deadline reminders in InternTrack.
      </p>
    </div>`;
}

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
                if (e?.statusCode === 410 || e?.statusCode === 404) {
                    await Subscription.deleteOne({ _id: sub._id });
                }
            }
        }
    } catch (e) {
        console.log('sendPushToUser error:', e);
    }
}

// POST /api/reminders/check
router.post('/check', auth, async (req, res) => {
    try {
        const daysThreshold = req.body.daysThreshold || 7;

        // Load user preferences
        const prefs = await Preference.findOne({ userId: req.userId });
        if (prefs?.enabled === false) {
            return res.json({ skipped: true, reason: 'disabled' });
        }

        const apps = await Application.find({ userId: req.userId });
        const today = new Date();
        today.setHours(0, 0, 0, 0);

        const upcoming = apps.filter((a) => {
            if (!a.deadline || ['offer', 'rejected'].includes(a.status)) return false;
            const dl = new Date(a.deadline);
            dl.setHours(0, 0, 0, 0);
            const diff = Math.ceil((dl.getTime() - today.getTime()) / (1000 * 60 * 60 * 24));
            return diff >= 0 && diff <= daysThreshold;
        });

        if (upcoming.length === 0) {
            return res.json({ sent: false, reason: 'no upcoming deadlines' });
        }

        // Check if we already sent a reminder today
        const todayKey = today.toISOString().split('T')[0];
        if (prefs?.lastSentDate === todayKey) {
            return res.json({ sent: false, reason: 'already sent today' });
        }

        await sendEmail(
            req.user.email,
            `📅 ${upcoming.length} Upcoming Deadline${upcoming.length > 1 ? 's' : ''} - InternTrack`,
            deadlineEmailHtml(upcoming)
        );

        // Update last sent date
        await Preference.findOneAndUpdate(
            { userId: req.userId },
            { lastSentDate: todayKey },
            { upsert: true }
        );

        // Also send push
        sendPushToUser(req.userId, {
            title: `📅 ${upcoming.length} Upcoming Deadline${upcoming.length > 1 ? 's' : ''}`,
            body: upcoming.map((a) => a.company).join(', '),
            icon: '/favicon.ico',
            data: { type: 'deadline_reminder' },
        });

        res.json({ sent: true, count: upcoming.length });
    } catch (e) {
        console.log('Reminder check error:', e);
        res.status(500).json({ error: `Failed to check reminders: ${e.message}` });
    }
});

// POST /api/reminders/preferences
router.post('/preferences', auth, async (req, res) => {
    try {
        const prefs = await Preference.findOneAndUpdate(
            { userId: req.userId },
            {
                userId: req.userId,
                enabled: req.body.enabled ?? true,
                daysThreshold: req.body.daysThreshold ?? 7,
            },
            { upsert: true, new: true }
        );
        res.json({ success: true, prefs });
    } catch (e) {
        res.status(500).json({ error: `Failed to save prefs: ${e.message}` });
    }
});

// GET /api/reminders/preferences
router.get('/preferences', auth, async (req, res) => {
    try {
        const prefs = await Preference.findOne({ userId: req.userId });
        res.json({
            prefs: prefs
                ? { enabled: prefs.enabled, daysThreshold: prefs.daysThreshold }
                : { enabled: true, daysThreshold: 7 },
        });
    } catch (e) {
        res.status(500).json({ error: `Failed to load prefs: ${e.message}` });
    }
});

module.exports = router;
