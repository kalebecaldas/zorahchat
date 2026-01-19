const fs = require('fs');
const path = require('path');
const { initializeDatabase } = require('../database');

// Environment config to match app
require('dotenv').config({ path: path.join(__dirname, '../.env') });

const dataDir = process.env.NODE_ENV === 'production' ? '/app/data' : path.join(__dirname, '../');
const dbPath = path.join(dataDir, 'database.sqlite');

async function setup() {
    console.log('[SETUP] Starting database setup...');
    console.log(`[SETUP] Database path: ${dbPath}`);

    const args = process.argv.slice(2);
    const forceReset = args.includes('--reset');

    if (forceReset) {
        if (fs.existsSync(dbPath)) {
            console.warn('[SETUP] --reset flag detected. Deleting existing database...');
            fs.unlinkSync(dbPath);
            console.log('[SETUP] Old database deleted.');
        } else {
            console.log('[SETUP] No existing database found to delete.');
        }
    }

    try {
        await initializeDatabase();
        console.log('[SETUP] Database initialized successfully with all tables.');
    } catch (error) {
        console.error('[SETUP] Error initializing database:', error);
        process.exit(1);
    }
}

setup();
