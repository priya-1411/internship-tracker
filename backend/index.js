const express = require('express');
const mongoose = require('mongoose');
const cors = require('cors');
const path = require('path');
const webpush = require('web-push');
require('dotenv').config();

const VapidKey = require('./models/VapidKey');

// Import routes
const authRoutes = require('./routes/auth');
const applicationRoutes = require('./routes/applications');
const resumeRoutes = require('./routes/resumes');
const pushRoutes = require('./routes/push');
const reminderRoutes = require('./routes/reminders');

const app = express();
const PORT = process.env.PORT || 5000;

// ─── Middleware ───────────────────────────────────────────────────────────────

app.use(cors({
    origin: '*',
    allowedHeaders: ['Content-Type', 'Authorization'],
    methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
    exposedHeaders: ['Content-Length'],
    maxAge: 600,
}));

app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// Request logger
app.use((req, res, next) => {
    console.log(`${req.method} ${req.path}`);
    next();
});

// ─── VAPID Initialization ─────────────────────────────────────────────────────

async function initVapid() {
    try {
        let keys = await VapidKey.findOne();
        if (!keys) {
            const generated = webpush.generateVAPIDKeys();
            keys = new VapidKey({
                publicKey: generated.publicKey,
                privateKey: generated.privateKey,
            });
            await keys.save();
            console.log('Generated VAPID keys');
        }
        webpush.setVapidDetails(
            'mailto:no-reply@interntrack.app',
            keys.publicKey,
            keys.privateKey
        );
        console.log('VAPID ready, publicKey:', keys.publicKey.substring(0, 20) + '...');
    } catch (e) {
        console.log('VAPID init error:', e);
    }
}

// ─── Routes ───────────────────────────────────────────────────────────────────

// Health check
app.get('/api/health', (req, res) => res.json({ status: 'ok' }));

// Auth routes (signup, signin, me)
app.use('/api', authRoutes);

// Application routes
app.use('/api/applications', applicationRoutes);

// Resume routes
app.use('/api/resumes', resumeRoutes);

// Push notification routes
app.use('/api', pushRoutes);
app.use('/api/push', pushRoutes);

// Reminder routes
app.use('/api/reminders', reminderRoutes);

// ─── Connect to MongoDB & Start Server ────────────────────────────────────────

async function start() {
    try {
        console.log('Connecting to MongoDB...');
        await mongoose.connect(process.env.MONGODB_URI, {
            // Mongoose 7+ doesn't need useNewUrlParser / useUnifiedTopology
        });
        console.log('✅ MongoDB connected');

        await initVapid();

        app.listen(PORT, () => {
            console.log(`🚀 Server running on http://localhost:${PORT}`);
            console.log(`   Health check: http://localhost:${PORT}/api/health`);
        });
    } catch (error) {
        console.error('❌ Failed to start server:', error.message);
        process.exit(1);
    }
}

start();
