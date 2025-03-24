const express = require('express');
const fs = require('fs').promises;
const path = require('path');
const app = express();

// Serve static files (CSS, JS, images)
app.use(express.static('public'));
app.use('/images', express.static('images'));

// Helper function to get all available months
const getAvailableMonths = async () => {
    const monthFolders = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];
    const availableMonths = [];

    for (const monthFolder of monthFolders) {
        const folderPath = path.join('images', monthFolder);
        try {
            const files = await fs.readdir(folderPath);
            if (files.length > 0 && files.some(file => file.endsWith('.jpg'))) {
                availableMonths.push(monthFolder);
            }
        } catch (err) {
            // Folder doesn't exist or is empty, skip it
        }
    }

    return availableMonths.sort((a, b) => {
        const monthOrder = monthFolders.indexOf(a) - monthFolders.indexOf(b);
        return monthOrder;
    }); // Sort chronologically
};

// API endpoint to get all available months
app.get('/api/months', async (req, res) => {
    try {
        const availableMonths = await getAvailableMonths();
        res.json(availableMonths);
    } catch (err) {
        res.status(500).json({ error: 'Error fetching months' });
    }
});

// API endpoint to get images for a specific month
app.get('/api/images/:month', async (req, res) => {
    const month = req.params.month; // e.g., "Jan"
    try {
        const files = await fs.readdir(path.join('images', month));
        const images = files
            .filter(file => file.endsWith('.jpg'))
            .map(file => ({
                src: `/images/${month}/${file}`,
                likes: file.split('.')[0] // Extract likes from filename
            }));

        // Sort images by likes (descending)
        images.sort((a, b) => b.likes - a.likes);
        res.json(images);
    } catch (err) {
        res.status(500).json({ error: `Error loading images for ${month}: ${err.message}` });
    }
});

// Serve the single-page application
app.get('/', async (req, res) => {
    res.send(`
        <!DOCTYPE html>
        <html lang="en">
        <head>
            <meta charset="UTF-8">
            <meta name="viewport" content="width=device-width, initial-scale=1.0">
            <title>Beautiful Women Collage</title>
            <link rel="stylesheet" href="/styles.css">
        </head>
        <body>
            <header>
                <h1>Beautiful Women Collage</h1>
                <nav class="month-nav" id="month-nav"></nav>
                <nav class="prev-next-nav">
                    <button id="prev-btn" disabled>Previous</button> | 
                    <button id="next-btn" disabled>Next</button>
                </nav>
            </header>
            <div class="gallery" id="gallery">
                <p>Select a month to view the gallery.</p>
            </div>
            <script src="/script.js"></script>
        </body>
        </html>
    `);
});

module.exports = app; // Export for Vercel