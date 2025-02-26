const express = require('express');
const path = require('path');
const cors = require('cors');
const fs = require('fs');
require('dotenv').config();

const app = express();
const port = process.env.PORT || 3000;

// Debug: Check if .env file exists and can be read
try {
    const envPath = path.join(__dirname, '.env');
    if (fs.existsSync(envPath)) {
        console.log('.env file found');
        const envContent = fs.readFileSync(envPath, 'utf8');
        console.log('Environment variables found:', Object.keys(process.env));
    } else {
        console.error('.env file not found at:', envPath);
    }
} catch (error) {
    console.error('Error checking .env file:', error);
}

// Enable CORS
app.use(cors());

// Serve static files
app.use(express.static(path.join(__dirname, '.')));

// Serve environment variables to client
app.get('/config', (req, res) => {
    // Log server-side to verify values
    console.log('Server config:', {
        STORAGE_ACCOUNT: process.env.STORAGE_ACCOUNT,
        STORAGE_CONTAINER: process.env.STORAGE_CONTAINER,
        SAS_TOKEN: process.env.SAS_TOKEN ? 'Present' : 'Missing',
        VISION_ENDPOINT: process.env.VISION_ENDPOINT,
        VISION_API_KEY: process.env.VISION_API_KEY ? 'Present' : 'Missing'
    });

    // Verify all required values are present
    const config = {
        STORAGE_ACCOUNT: process.env.STORAGE_ACCOUNT,
        STORAGE_CONTAINER: process.env.STORAGE_CONTAINER,
        VISION_ENDPOINT: process.env.VISION_ENDPOINT,
        VISION_API_KEY: process.env.VISION_API_KEY,
        SAS_TOKEN: process.env.SAS_TOKEN
    };

    // Add detailed logging for SAS token
    console.log('SAS Token check:', {
        hasToken: !!process.env.SAS_TOKEN,
        tokenLength: process.env.SAS_TOKEN?.length,
        startsWithQuestion: process.env.SAS_TOKEN?.startsWith('?'),
        fullToken: process.env.SAS_TOKEN, // Temporarily log full token for debugging
        envKeys: Object.keys(process.env)
    });

    // Check for missing values
    const missingValues = Object.entries(config)
        .filter(([key, value]) => !value)
        .map(([key]) => key);

    if (missingValues.length > 0) {
        console.error('Missing required values:', missingValues);
        return res.status(500).json({ 
            error: `Missing required configuration values: ${missingValues.join(', ')}` 
        });
    }

    res.json(config);
});

// Add test endpoint for environment variables
app.get('/test-env', (req, res) => {
    res.json({
        envVars: {
            STORAGE_ACCOUNT: process.env.STORAGE_ACCOUNT ? 'Present' : 'Missing',
            STORAGE_CONTAINER: process.env.STORAGE_CONTAINER ? 'Present' : 'Missing',
            SAS_TOKEN: process.env.SAS_TOKEN ? `Present (${process.env.SAS_TOKEN.length} chars)` : 'Missing',
            VISION_ENDPOINT: process.env.VISION_ENDPOINT ? 'Present' : 'Missing',
            VISION_API_KEY: process.env.VISION_API_KEY ? 'Present' : 'Missing'
        },
        sasTokenInfo: {
            startsWithQuestion: process.env.SAS_TOKEN?.startsWith('?'),
            length: process.env.SAS_TOKEN?.length,
            firstChar: process.env.SAS_TOKEN?.[0],
            hasSpaces: /\s/.test(process.env.SAS_TOKEN || '')
        }
    });
});

// Add error handling
app.use((err, req, res, next) => {
    console.error('Server error:', err);
    res.status(500).json({ error: 'Internal server error' });
});

app.listen(port, () => {
    console.log(`FloralBot server running on port ${port}`);
    console.log('Environment loaded:', {
        STORAGE_ACCOUNT: process.env.STORAGE_ACCOUNT ? 'Present' : 'Missing',
        STORAGE_CONTAINER: process.env.STORAGE_CONTAINER ? 'Present' : 'Missing',
        SAS_TOKEN: process.env.SAS_TOKEN ? 'Present' : 'Missing',
        VISION_ENDPOINT: process.env.VISION_ENDPOINT ? 'Present' : 'Missing',
        VISION_API_KEY: process.env.VISION_API_KEY ? 'Present' : 'Missing'
    });
}); 
