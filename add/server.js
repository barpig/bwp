const express = require('express');
const puppeteer = require('puppeteer');
const fs = require('fs');
const path = require('path');
const app = express();

app.use(express.json());
app.use(express.static(__dirname));

// Serve the images folder from the bwp directory
app.use('/images', express.static('C:\\Users\\rendo\\Documents\\GitHub\\bwp\\images'));

// Helper function to convert likes (e.g., "56K") to number
function parseLikes(likesStr) {
    console.log('Raw likes string:', likesStr); // Debug log
    if (!likesStr) return 0;
    likesStr = likesStr.toLowerCase().trim();
    if (likesStr.includes('k')) {
        return Math.round(parseFloat(likesStr.replace('k', '')) * 1000);
    }
    if (likesStr.includes('m')) {
        return Math.round(parseFloat(likesStr.replace('m', '')) * 1000000);
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

        // Load cookies from the private folder
        console.log('Loading cookies...');
        const cookiesPath = path.join(__dirname, '..', 'private', 'cookies.json');
        if (!fs.existsSync(cookiesPath)) {
            throw new Error('cookies.json not found in the private folder. Please create C:\\Users\\rendo\\Documents\\GitHub\\bwp\\private\\cookies.json with your X session cookies.');
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

            // Debug: Log all elements with data-testid="like"
            const likeElements = Array.from(document.querySelectorAll('[data-testid="like"]'));
            console.log('Like elements found:', likeElements.map(el => ({
                text: el.parentElement?.textContent || 'No text',
                outerHTML: el.parentElement?.outerHTML.substring(0, 100) || 'No parent'
            })));

            // Find the like element specific to the target post
            let likeElement = null;
            const article = document.querySelector(`article [data-testid="tweetPhoto"]`)?.closest('article');
            if (article) {
                likeElement = article.querySelector('[data-testid="like"]')?.parentElement || { textContent: '0' };
            } else {
                // Fallback: Use the first like element if article-specific search fails
                likeElement = document.querySelector('[data-testid="like"]')?.parentElement || { textContent: '0' };
            }
            console.log('Selected like element text:', likeElement.textContent);

            // Extract the post text content
            let postText = '';
            const textElement = article?.querySelector('div[data-testid="tweetText"]');
            if (textElement) {
                postText = textElement.textContent || '';
            }

            return {
                imgUrl: imgElement?.src || null,
                date: timeElement?.getAttribute('datetime') || new Date().toISOString(),
                likes: likeElement.textContent || '0',
                text: postText
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

        // Use the like count for the filename
        const likes = parseLikes(postData.likes);
        let filename = `${likes}.${extension}`;
        let filepath = path.join(dir, filename);
        let counter = 0;

        // Handle filename conflicts
        while (fs.existsSync(filepath)) {
            counter++;
            filename = `${likes}_${counter}.${extension}`;
            filepath = path.join(dir, filename);
        }

        // Save the image
        console.log('Downloading image to:', filepath);
        const response = await page.goto(postData.imgUrl, { waitUntil: 'networkidle0' });
        const buffer = await response.buffer();
        fs.writeFileSync(filepath, buffer);

        // Prepare the metadata
        const metadata = {
            filename: filename,
            filepath: `/images/${monthFolder}/${filename}`,
            date: postData.date,
            likes: postData.likes,
            text: postData.text
        };
        console.log('Prepared metadata:', metadata);

        // Save the metadata to a single JSON file in the root directory
        const metadataFilepath = path.join('C:\\Users\\rendo\\Documents\\GitHub\\bwp', 'posts.json');
        let allMetadata = {};

        // Read the existing metadata file, if it exists
        console.log('Checking if posts.json exists at:', metadataFilepath);
        if (fs.existsSync(metadataFilepath)) {
            try {
                const fileContent = fs.readFileSync(metadataFilepath, 'utf8');
                console.log('Existing posts.json content:', fileContent);
                allMetadata = JSON.parse(fileContent);
            } catch (error) {
                console.error('Error reading posts.json:', error.message);
                allMetadata = {};
            }
        } else {
            console.log('posts.json does not exist, creating a new one');
        }

        // Add the new metadata using the full post URL as the key
        console.log('Adding metadata for URL:', url);
        allMetadata[url] = metadata;
        console.log('Updated allMetadata:', JSON.stringify(allMetadata, null, 2));

        // Write the updated metadata back to the file
        try {
            fs.writeFileSync(metadataFilepath, JSON.stringify(allMetadata, null, 2));
            console.log('Saved metadata to:', metadataFilepath);
        } catch (error) {
            console.error('Error writing to posts.json:', error.message);
            throw new Error('Failed to save metadata to posts.json');
        }

        await browser.close();
        
        res.json({
            success: true,
            filename,
            filepath: `/images/${monthFolder}/${filename}`,
            metadata
        });

    } catch (error) {
        await browser.close();
        res.json({ success: false, error: error.message });
    }
});

app.listen(3000, () => console.log('Server running on http://localhost:3000'));