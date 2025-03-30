const puppeteer = require('puppeteer');
const fs = require('fs');
const path = require('path');

// Helper function to convert likes (e.g., "56K") to number
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

// Function to download image
async function downloadImage(page, url, filepath) {
    const response = await page.goto(url, { waitUntil: 'networkidle0' });
    const buffer = await response.buffer();
    fs.writeFileSync(filepath, buffer);
}

async function scrapeXPosts(username) {
    const browser = await puppeteer.launch({ headless: true });
    const page = await browser.newPage();
    
    try {
        // Go to user's profile
        await page.goto(`https://twitter.com/${username}`, {
            waitUntil: 'networkidle2'
        });

        // Scroll to load more content
        let previousHeight;
        for (let i = 0; i < 3; i++) { // Adjust scroll iterations as needed
            previousHeight = await page.evaluate('document.body.scrollHeight');
            await page.evaluate('window.scrollTo(0, document.body.scrollHeight)');
            await page.waitForTimeout(2000); // Wait for content to load
            const newHeight = await page.evaluate('document.body.scrollHeight');
            if (newHeight === previousHeight) break;
        }

        // Extract posts
        const posts = await page.evaluate(() => {
            const tweets = [];
            const articles = document.querySelectorAll('article');
            
            articles.forEach(article => {
                const timeElement = article.querySelector('time');
                const imgElement = article.querySelector('img[src*="media"]');
                const likeElement = article.querySelector('[data-testid="like"]')?.parentElement;

                if (imgElement && timeElement) {
                    tweets.push({
                        date: timeElement.getAttribute('datetime'),
                        imgUrl: imgElement.src,
                        likes: likeElement?.textContent || '0'
                    });
                }
            });
            return tweets;
        });

        // Process each post
        for (const post of posts) {
            const monthFolder = getMonthFolder(post.date);
            const likes = parseLikes(post.likes);
            
            // Create directory if it doesn't exist
            const dir = path.join(__dirname, 'videos', monthFolder);
            if (!fs.existsSync(dir)) {
                fs.mkdirSync(dir, { recursive: true });
            }

            // Get image extension and create filename
            const extension = post.imgUrl.split('.').pop().split('?')[0];
            let filename = `${likes}.${extension}`;
            let filepath = path.join(dir, filename);
            
            // Handle duplicates
            let counter = 0;
            while (fs.existsSync(filepath)) {
                counter++;
                filename = `${likes}_${counter}.${extension}`;
                filepath = path.join(dir, filename);
            }

            console.log(`Downloading ${filename} to ${monthFolder}`);
            await downloadImage(page, post.imgUrl, filepath);
        }

        console.log('Scraping completed!');

    } catch (error) {
        console.error('Error scraping posts:', error.message);
    } finally {
        await browser.close();
    }
}

// Usage
scrapeXPosts('targetUsername'); // Replace with the username you want to scrape