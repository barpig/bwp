# Collage Website

A single-page application to display a collage of beautiful women, organized by month. Each image is named according to the number of likes it received (e.g., `1254.jpg` for 1254 likes). The site features a night mode theme, a tilt effect on images, and displays likes on hover. The URL remains static at `/` while navigating between months.

## Features
- Landing page (`/`) with a navigation bar to select months.
- Gallery updates dynamically without changing the URL.
- "Previous" and "Next" buttons to cycle through months.
- Images are stored in `images/Jan/`, `images/Feb/`, etc.

## Folder Structure
- `images/Jan/`, `images/Feb/`, etc.: Contains images for each month.
- `public/`: Static files (CSS, JS).
- `server.js`: Node.js/Express backend with API endpoints.

## Deployment
Deployed on Vercel. Access the site at: [your-vercel-url].

## Local Development
1. Install dependencies: `npm install`
2. Run the server: `npm start`
3. Open `http://localhost:3000/` in your browser.