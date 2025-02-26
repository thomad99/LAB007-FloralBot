const express = require('express');
const path = require('path');
const cors = require('cors');
require('dotenv').config();

const app = express();
const port = process.env.PORT || 3000;

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

    res.json({
        STORAGE_ACCOUNT: process.env.STORAGE_ACCOUNT,
        STORAGE_CONTAINER: process.env.STORAGE_CONTAINER,
        VISION_ENDPOINT: process.env.VISION_ENDPOINT,
        VISION_API_KEY: process.env.VISION_API_KEY,
        SAS_TOKEN: process.env.SAS_TOKEN.startsWith('?') ? process.env.SAS_TOKEN : `?${process.env.SAS_TOKEN}`
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
