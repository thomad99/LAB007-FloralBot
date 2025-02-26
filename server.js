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
    res.json({
        STORAGE_ACCOUNT: process.env.STORAGE_ACCOUNT,
        STORAGE_CONTAINER: process.env.STORAGE_CONTAINER,
        VISION_ENDPOINT: process.env.VISION_ENDPOINT
    });
});

app.listen(port, () => {
    console.log(`FloralBot server running on port ${port}`);
}); 