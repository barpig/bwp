const express = require('express');
const puppeteer = require('puppeteer');
const fs = require('fs');
const path = require('path');
const app = express();

app.use(express.json());
app.use(express.static(__dirname));

// Serve the images folder from the bwp directory
app.use('/images', express.static('C:\\Users\\rendo\\Documents\\GitHub\\bwp\\images'));

// Helper function to convert likes (e.g., "56K") to number (for logging only)
function parseLikes(likesStr) {
    if (!likesStr) return 0;
    likesStr = likesStr.toLowerCase().trim();
    if (likesStr.includes('k')) {
        return Math.round(parseFloat(likesStr.replace('k', '')) * 1000);
    }
    return parseInt(likesStr);
}

// Function to get month folder name from date string
function getMonthFolder(dateStr) {
    const date = new Date(dateStr);
    const months = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 
                   'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];
    return months[date.getMonth()];
}

// Function to get the next available number for the filename
function getNextFileNumber(dir) {
    if (!fs.existsSync(dir)) {
        return 2101; // Start at 2101 if the directory doesn't exist
    }

    const files = fs.readdirSync(dir);
    const numbers = files
        .map(file => {
            const match = file.match(/^(\d+)\.(jpg|jpeg|png|gif)$/i);
            return match ? parseInt(match[1]) : null;
        })
        .filter(num => num !== null);

    if (numbers.length === 0) {
        return 2101; // Start at 2101 if no numbered files exist
    }

    return Math.max(...numbers) + 1; // Increment the highest number
}

// Custom delay function
const delay = (ms) => new Promise(resolve => setTimeout(resolve, ms));

app.post('/scrape', async (req, res) => {
    const { url } = req.body;
    if (!url || (!url.includes('twitter.com') && !url.includes('x.com')) || !url.includes('status')) {
        return res.json({ success: false, error: 'Invalid X post URL. Please use a URL like https://twitter.com/username/status/123456789 or https://x.com/username/status/123456789' });
    }

    const browser = await puppeteer.launch({ headless: false }); // Non-headless mode
    const page = await browser.newPage();

    try {
        // Set user agent and viewport
        await page.setUserAgent('Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/91.0.4472.124 Safari/537.36');
        await page.setViewport({ width: 1280, height: 800 });

        // Load cookies
        console.log('Loading cookies...');
        const cookiesPath = path.join(__dirname, 'cookies.json');
        if (!fs.existsSync(cookiesPath)) {
            throw new Error('cookies.json not found. Please create cookies.json with your X session cookies.');
        }
        const cookies = JSON.parse(fs.readFileSync(cookiesPath));
        await page.setCookie(...cookies);
        console.log('Cookies loaded successfully');

        // Navigate to the post URL
        console.log('Navigating to:', url);
        await page.goto(url, { waitUntil: 'networkidle2' });

        // Wait for the post content to load
        await page.waitForSelector('article', { timeout: 10000 }).catch(() => {
            console.log('Article not found, continuing anyway');
        });
        await delay(10000); // 10-second delay to ensure content loads

        // Extract post data
        const postData = await page.evaluate(() => {
            // Debug: Log all images on the page
            const allImages = Array.from(document.querySelectorAll('img[src*="twimg.com"]'));
            const imageDetails = allImages.map(img => ({
                src: img.src,
                parent: img.parentElement?.outerHTML.substring(0, 100) || 'No parent'
            }));
            console.log('All images found:', imageDetails);

            // Target the post image specifically
            let imgElement = null;

            // Try specific container for post image
            imgElement = document.querySelector('div[data-testid="tweetPhoto"] img[src*="twimg.com"]');
            if (!imgElement) imgElement = document.querySelector('article div[role="presentation"] img[src*="twimg.com"]');

            // Fallback: Loop through images and exclude profile pictures
            if (!imgElement) {
                const images = Array.from(document.querySelectorAll('img[src*="twimg.com"]'));
                imgElement = images.find(img => {
                    const parent = img.closest('div[data-testid="UserProfileHeader_Items"]') || img.closest('div[data-testid="primaryColumn"] img[alt="Image"]');
                    const isProfilePic = parent && parent.closest('div[data-testid="UserProfileHeader_Items"]');
                    const isPostImage = img.closest('article') && !isProfilePic && !img.src.includes('profile');
                    return isPostImage;
                });
            }

            const timeElement = document.querySelector('time');
            let likeElement = document.querySelector('[data-testid="like"]')?.parentElement || { textContent: '0' };

            return {
                imgUrl: imgElement?.src || null,
                date: timeElement?.getAttribute('datetime') || new Date().toISOString(),
                likes: likeElement.textContent || '0'
            };
        });

        console.log('Scraped post data:', postData);

        if (!postData.imgUrl) {
            // Debug: Log the HTML of the main content area
            const mainContent = await page.evaluate(() => {
                const main = document.querySelector('div[id="react-root"]');
                return main ? main.innerHTML.substring(0, 1000) : 'Main content not found';
            });
            console.log('Main content snippet:', mainContent);

            throw new Error('No image found in the post. The post might not contain an image, the page structure may have changed, or the content failed to load.');
        }

        const monthFolder = getMonthFolder(postData.date);
        const dir = path.join('C:\\Users\\rendo\\Documents\\GitHub\\bwp\\images', monthFolder);

        if (!fs.existsSync(dir)) {
            fs.mkdirSync(dir, { recursive: true });
        }

        // Extract the file extension from the URL query parameter
        let extension = 'jpg'; // Default extension
        const urlParams = new URLSearchParams(postData.imgUrl.split('?')[1]);
        if (urlParams.has('format')) {
            extension = urlParams.get('format');
        } else if (postData.imgUrl.includes('.')) {
            extension = postData.imgUrl.split('.').pop().split('?')[0];
        }

        // Get the next available number for the filename
        const nextNumber = getNextFileNumber(dir);
        let filename = `${nextNumber}.${extension}`;
        let filepath = path.join(dir, filename);

        console.log('Downloading image to:', filepath);
        const response = await page.goto(postData.imgUrl, { waitUntil: 'networkidle0' });
        const buffer = await response.buffer();
        fs.writeFileSync(filepath, buffer);

        await browser.close();
        
        res.json({
            success: true,
            filename,
            filepath: `/images/${monthFolder}/${filename}`
        });

    } catch (error) {
        await browser.close();
        res.json({ success: false, error: error.message });
    }
});

app.listen(3000, () => console.log('Server running on http://localhost:3000'));