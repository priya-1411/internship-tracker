const express = require('express');
const jwt = require('jsonwebtoken');
const User = require('../models/User');

const router = express.Router();

// Generate JWT token
function generateToken(userId) {
    return jwt.sign({ userId }, process.env.JWT_SECRET, { expiresIn: '7d' });
}

// POST /api/signup
router.post('/signup', async (req, res) => {
    try {
        const { email, password, name } = req.body;
        if (!email || !password) {
            return res.status(400).json({ error: 'Email and password required' });
        }

        // Check if user already exists
        const existingUser = await User.findOne({ email: email.toLowerCase() });
        if (existingUser) {
            return res.status(400).json({ error: 'User already registered' });
        }

        const user = new User({
            email,
            password,
            name: name || email.split('@')[0],
        });
        await user.save();

        const token = generateToken(user._id);

        res.status(201).json({
            user: user.toJSON(),
            token,
            session: { access_token: token },
        });
    } catch (e) {
        console.log('Signup error:', e);
        res.status(500).json({ error: `Signup failed: ${e.message}` });
    }
});

// POST /api/signin
router.post('/signin', async (req, res) => {
    try {
        const { email, password } = req.body;
        if (!email || !password) {
            return res.status(400).json({ error: 'Email and password required' });
        }

        const user = await User.findOne({ email: email.toLowerCase() });
        if (!user) {
            return res.status(401).json({ error: 'Invalid email or password' });
        }

        const isMatch = await user.comparePassword(password);
        if (!isMatch) {
            return res.status(401).json({ error: 'Invalid email or password' });
        }

        const token = generateToken(user._id);

        res.json({
            user: user.toJSON(),
            token,
            session: { access_token: token },
        });
    } catch (e) {
        console.log('Signin error:', e);
        res.status(500).json({ error: `Signin failed: ${e.message}` });
    }
});

// GET /api/me  — get current user from token
router.get('/me', async (req, res) => {
    try {
        const authHeader = req.headers.authorization;
        if (!authHeader) return res.status(401).json({ error: 'Unauthorized' });

        const token = authHeader.replace('Bearer ', '').trim();
        const decoded = jwt.verify(token, process.env.JWT_SECRET);
        const user = await User.findById(decoded.userId);
        if (!user) return res.status(401).json({ error: 'Unauthorized' });

        res.json({
            user: user.toJSON(),
            session: { access_token: token },
        });
    } catch (e) {
        res.status(401).json({ error: 'Unauthorized' });
    }
});

module.exports = router;
