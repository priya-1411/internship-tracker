const express = require('express');
const multer = require('multer');
const path = require('path');
const { v2: cloudinary } = require('cloudinary');
const { CloudinaryStorage } = require('multer-storage-cloudinary');
const auth = require('../middleware/auth');
const Resume = require('../models/Resume');

const router = express.Router();

// ─── Cloudinary Config ────────────────────────────────────────────────────────

cloudinary.config({
    cloud_name: process.env.CLOUDINARY_CLOUD_NAME,
    api_key: process.env.CLOUDINARY_API_KEY,
    api_secret: process.env.CLOUDINARY_API_SECRET,
});

// ─── Multer + Cloudinary Storage ─────────────────────────────────────────────

const storage = new CloudinaryStorage({
    cloudinary,
    params: async (req, file) => {
        return {
            folder: `interntrack/${req.userId}`,
            resource_type: 'raw',               // allows PDF / DOCX
            public_id: `${Date.now()}-${Math.round(Math.random() * 1e9)}`,
            format: path.extname(file.originalname).replace('.', ''),
        };
    },
});

const upload = multer({
    storage,
    limits: { fileSize: 10 * 1024 * 1024 }, // 10 MB
    fileFilter: (req, file, cb) => {
        const allowed = ['.pdf', '.doc', '.docx', '.txt', '.rtf'];
        const ext = path.extname(file.originalname).toLowerCase();
        if (allowed.includes(ext)) {
            cb(null, true);
        } else {
            cb(new Error('Only PDF, DOC, DOCX, TXT, and RTF files are allowed'));
        }
    },
});

// ─── POST /api/resumes/:appId  — upload a resume ─────────────────────────────

router.post('/:appId', auth, upload.single('file'), async (req, res) => {
    try {
        if (!req.file) return res.status(400).json({ error: 'No file provided' });

        const resume = new Resume({
            userId: req.userId,
            appId: req.params.appId,
            filename: req.file.originalname,
            // Cloudinary gives us a public URL — store it as storagePath
            storagePath: req.file.path,
            size: req.file.size,
            version: req.body.version || 'v1',
            notes: req.body.notes || '',
        });
        await resume.save();

        res.status(201).json({ resume });
    } catch (e) {
        console.log('Upload resume error:', e);
        res.status(500).json({ error: `Failed to upload: ${e.message}` });
    }
});

// ─── GET /api/resumes  — get all resumes for a user ──────────────────────────

router.get('/', auth, async (req, res) => {
    try {
        const resumes = await Resume.find({ userId: req.userId }).sort({ createdAt: -1 });
        res.json({ resumes });
    } catch (e) {
        res.status(500).json({ error: `Failed to list resumes: ${e.message}` });
    }
});

// ─── GET /api/resumes/:appId  — get resumes for a specific application ────────

router.get('/:appId', auth, async (req, res) => {
    try {
        const resumes = await Resume.find({
            userId: req.userId,
            appId: req.params.appId,
        }).sort({ createdAt: -1 });
        res.json({ resumes });
    } catch (e) {
        res.status(500).json({ error: `Failed to list resumes: ${e.message}` });
    }
});

// ─── GET /api/resumes/:appId/:resumeId/url  — get Cloudinary download URL ────

router.get('/:appId/:resumeId/url', auth, async (req, res) => {
    try {
        const resume = await Resume.findOne({
            _id: req.params.resumeId,
            userId: req.userId,
            appId: req.params.appId,
        });
        if (!resume) return res.status(404).json({ error: 'Resume not found' });

        // storagePath now holds the Cloudinary URL directly — return it as-is
        res.json({ url: resume.storagePath });
    } catch (e) {
        res.status(500).json({ error: `Failed to get URL: ${e.message}` });
    }
});

// ─── DELETE /api/resumes/:appId/:resumeId ─────────────────────────────────────

router.delete('/:appId/:resumeId', auth, async (req, res) => {
    try {
        const resume = await Resume.findOne({
            _id: req.params.resumeId,
            userId: req.userId,
            appId: req.params.appId,
        });
        if (!resume) return res.status(404).json({ error: 'Not found' });

        // Delete from Cloudinary using the stored URL
        try {
            // Extract public_id from the Cloudinary URL
            const urlParts = resume.storagePath.split('/');
            const uploadIndex = urlParts.indexOf('upload');
            if (uploadIndex !== -1) {
                // Skip version segment (v1234567890) if present
                let publicIdParts = urlParts.slice(uploadIndex + 1);
                if (/^v\d+$/.test(publicIdParts[0])) {
                    publicIdParts = publicIdParts.slice(1);
                }
                const publicId = publicIdParts.join('/').replace(/\.[^/.]+$/, '');
                await cloudinary.uploader.destroy(publicId, { resource_type: 'raw' });
            }
        } catch (cloudErr) {
            console.warn('Cloudinary delete warning:', cloudErr.message);
        }

        await Resume.deleteOne({ _id: resume._id });
        res.json({ success: true });
    } catch (e) {
        res.status(500).json({ error: `Failed to delete: ${e.message}` });
    }
});

module.exports = router;
