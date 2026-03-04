require('dotenv').config();
const fs = require('fs');
const mongoose = require('mongoose');
const csv = require('csv-parser');
const User = require('./models/User');
const Application = require('./models/Application');

const CSV_FILE_PATH = 'C:\\Users\\Admin\\Downloads\\Internship Tracker Web App 2\\cleaned_internship_dataset.csv';

// We limit to 50 rows per user so the Kanban UI doesn't crash when sorting thousands of items
const UPLOAD_LIMIT = 50;

async function start() {
    try {
        console.log('Connecting to MongoDB...');
        await mongoose.connect(process.env.MONGODB_URI);
        console.log('✅ MongoDB connected');

        console.log(`Reading CSV from: ${CSV_FILE_PATH}`);

        const internships = [];
        await new Promise((resolve, reject) => {
            fs.createReadStream(CSV_FILE_PATH)
                .pipe(csv())
                .on('data', (data) => {
                    if (internships.length < UPLOAD_LIMIT) {
                        internships.push(data);
                    }
                })
                .on('end', () => {
                    console.log(`Read ${internships.length} rows.`);
                    resolve();
                })
                .on('error', reject);
        });

        if (internships.length === 0) {
            console.log('No data found in the CSV.');
            process.exit(1);
        }

        const users = await User.find({});
        console.log(`Found ${users.length} users in the database.`);

        if (users.length === 0) {
            console.log('No users to add data to.');
            process.exit(0);
        }

        console.log('Inserting into database...');
        let totalInserted = 0;

        for (const user of users) {
            console.log(`Generating applications for user: ${user.email}`);

            const docs = internships.map(raw => ({
                userId: user._id,
                company: raw.company_name?.trim() || 'Unknown Company',
                jobTitle: raw.internship_title?.trim() || 'Unknown Title',
                location: raw.location?.trim() || 'Not specified',
                salary: raw.stipend?.trim() || 'Unpaid',
                status: 'to-apply'
            }));

            // Bulk insert for this specific user
            await Application.insertMany(docs);
            totalInserted += docs.length;
        }

        console.log(`🎉 Successfully inserted ${totalInserted} applications across ${users.length} users.`);
        process.exit(0);
    } catch (error) {
        console.error('❌ Failed to upload data:', error);
        process.exit(1);
    }
}

start();
