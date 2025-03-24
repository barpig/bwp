const express = require('express');
const fs = require('fs').promises;
const path = require('path');
const app = express();

// Serve static files (CSS, JS, images)
app.use(express.static('public'));
app.use('/images', express.static('images'));

// Helper function to map month name to folder (e.g., "january-2025" -> "Jan")
const getMonthFolder = (monthYear) => {
    const [month, year] = monthYear.split('-');
    return month.charAt(0).toUpperCase() + month.slice(1, 3).toLowerCase(); // e.g., "january" -> "Jan"
};

// Helper function to get all available months
const getAvailableMonths = async () => {
    const monthFolders = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];
    const years = ['2025']; // Add more years if needed (e.g., ['2025', '2026'])
    const availableMonths = [];

    for (const year of years) {
        for (const monthFolder of monthFolders) {
            const folderPath = path.join('images', monthFolder);
            try {
                const files = await fs.readdir(folderPath);
                if (files.length > 0) {
                    const monthIndex = monthFolders.indexOf(monthFolder);
                    const monthName = [
                        'january', 'february', 'march', 'april', 'may', 'june',
                        'july', 'august', 'september', 'october', 'november', 'december'
                    ][monthIndex];
                    availableMonths.push(`${monthName}-${year}`);
                }
            } catch (err) {
                // Folder doesn't exist or is empty, skip it
            }
        }
    }

    return availableMonths.sort(); // Sort chronologically
};

// Helper function to get previous and next months
const getAdjacentMonths = (monthYear, availableMonths) => {
    const [month, year] = monthYear.split('-');
    const monthNames = [
        'january', 'february', 'march', 'april', 'may', 'june',
        'july', 'august', 'september', 'october', 'november', 'december'
    ];
    const monthIndex = monthNames.indexOf(month.toLowerCase());
    const currentYear = parseInt(year);

    const currentPosition = availableMonths.indexOf(`${month.toLowerCase()}-${year}`);
    const prevMonth = currentPosition > 0 ? availableMonths[currentPosition - 1] : null;
    const nextMonth = currentPosition < availableMonths.length - 1 ? availableMonths[currentPosition + 1] : null;

    return { prev: prevMonth, next: nextMonth };
};

// Landing page: List all available months
app.get('/', async (req, res) => {
    const availableMonths = await getAvailableMonths();
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
                <nav class="month-nav">
                    ${availableMonths.map(month => `
                        <a href="/${month}">${month.replace('-', ' ')}</a>
                    `).join(' | ')}
                </nav>
            </header>
            <div class="gallery">
                <p>Select a month to view the gallery.</p>
            </div>
        </body>
        </html>
    `);
});

// Route to serve the HTML for a specific month
app.get('/:monthYear', async (req, res) => {
    const monthYear = req.params.monthYear.toLowerCase(); // e.g., "january-2025"
    const monthFolder = getMonthFolder(monthYear); // e.g., "Jan"
    const availableMonths = await getAvailableMonths();

    try {
        // Read all files in the month's folder
        const files = await fs.readdir(path.join('images', monthFolder));
        const images = files
            .filter(file => file.endsWith('.jpg'))
            .map(file => ({
                src: `/images/${monthFolder}/${file}`,
                likes: file.split('.')[0] // Extract likes from filename
            }));

        // Sort images by likes (descending)
        images.sort((a, b) => b.likes - a.likes);

        // Split images into rows
        const topRow = images.slice(0, 3); // 3 large images
        const middleRow = images.slice(3, 7); // 4 medium images
        const bottomRow = images.slice(7, 15); // 8 small images

        // Get previous and next months for navigation
        const { prev, next } = getAdjacentMonths(monthYear, availableMonths);

        // Generate HTML
        res.send(`
            <!DOCTYPE html>
            <html lang="en">
            <head>
                <meta charset="UTF-8">
                <meta name="viewport" content="width=device-width, initial-scale=1.0">
                <title>${monthYear} - Beautiful Women Collage</title>
                <link rel="stylesheet" href="/styles.css">
            </head>
            <body>
                <header>
                    <h1>${monthYear.replace('-', ' ')}</h1>
                    <nav class="month-nav">
                        ${availableMonths.map(month => `
                            <a href="/${month}" ${month === monthYear ? 'class="active"' : ''}>${month.replace('-', ' ')}</a>
                        `).join(' | ')}
                    </nav>
                    <nav class="prev-next-nav">
                        ${prev ? `<a href="/${prev}">Previous</a>` : '<span>Previous</span>'} | 
                        ${next ? `<a href="/${next}">Next</a>` : '<span>Next</span>'}
                    </nav>
                </header>
                <div class="gallery">
                    <!-- Top Row -->
                    <div class="top-row">
                        ${topRow.map(img => `
                            <div class="image-container large">
                                <img src="${img.src}" alt="Beautiful Woman" class="tilt-image">
                                <span class="likes-tooltip"></span>
                            </div>
                        `).join('')}
                    </div>
                    <!-- Middle Row -->
                    <div class="middle-row">
                        ${middleRow.map(img => `
                            <div class="image-container medium">
                                <img src="${img.src}" alt="Beautiful Woman" class="tilt-image">
                                <span class="likes-tooltip"></span>
                            </div>
                        `).join('')}
                    </div>
                    <!-- Bottom Row -->
                    <div class="bottom-row">
                        ${bottomRow.map(img => `
                            <div class="image-container small">
                                <img src="${img.src}" alt="Beautiful Woman" class="tilt-image">
                                <span class="likes-tooltip"></span>
                            </div>
                        `).join('')}
                    </div>
                </div>
                <script src="/script.js"></script>
            </body>
            </html>
        `);
    } catch (err) {
        res.status(500).send(`Error loading images for ${monthFolder}: ${err.message}`);
    }
});

module.exports = app; // Export for Vercel