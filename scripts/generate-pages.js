const fs = require('fs').promises;
const path = require('path');

async function generatePages() {
  console.log('Starting page generation...');
  const months = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];
  const imageData = {};

  // Scan images for each month
  for (const month of months) {
    const dirPath = path.join(__dirname, '../images', month);
    try {
      const files = await fs.readdir(dirPath);
      imageData[month] = files
        .filter(file => file.endsWith('.jpg'))
        .map(file => `https://raw.githubusercontent.com/barpig/bwp/refs/heads/main/images/${month}/${file}`)
        .sort((a, b) => {
          const likesA = parseInt(a.split('/').pop().split('.').shift());
          const likesB = parseInt(b.split('/').pop().split('.').shift());
          return likesB - likesA;
        });
      console.log(`Found ${imageData[month].length} images for ${month}`);
    } catch (error) {
      imageData[month] = [];
      console.log(`No images found for ${month}`);
    }
  }

  // Generate HTML with dynamic scaling and likes overlay
  const html = `
<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <title>BWP @ https://x.com/rendo/lists</title>
  <style>
    body {
      background-color: #1a1a1a;
      color: #ffffff;
      margin: 0;
      padding: 20px;
      text-align: center;
      font-family: Arial, sans-serif;
    }
    h1 a {
      color: #ffffff;
      text-decoration: none;
    }
    h1 a:hover {
      text-decoration: underline;
      color: #cccccc;
    }
    .month-buttons {
      margin-bottom: 20px;
    }
    .month-buttons button {
      background-color: #333333;
      color: #ffffff;
      border: 1px solid #ffffff;
      padding: 8px 16px;
      margin: 5px;
      cursor: pointer;
      font-size: 14px;
    }
    .month-buttons button:hover {
      background-color: #555555;
    }
    .collage-container {
      max-width: 1200px; /* Fixed width for the display rectangle */
      margin: 0 auto; /* Center the container */
      border: 5px solid #ffffff; /* White border on all sides */
      padding: 0; /* No padding to reduce blank space */
      box-sizing: border-box;
      background-color: #2a2a2a; /* Slightly lighter background for contrast */
    }
    .collage {
      display: block; /* Use block to stack rows */
      width: 100%;
    }
    .row {
      display: flex; /* Each row is a flex container */
      flex-wrap: nowrap; /* Prevent wrapping within a row */
      gap: 0px; /* No gap between images */
      justify-content: space-between; /* Distribute space evenly */
      margin-bottom: 0px; /* No gap between rows */
    }
    .image-container {
      position: relative;
      margin: 0; /* Remove margin to use gap */
    }
    .tilt-wrapper {
      position: relative; /* Ensure the overlay positions correctly */
      display: block; /* Ensure the wrapper fills its container */
      width: 100%;
      cursor: pointer; /* Ensure the wrapper is clickable */
    }
    .collage img {
      width: 100%;
      height: auto;
      object-fit: cover;
      border: 2px solid #ffffff;
      border-radius: 5px;
      display: block; /* Remove any inline-block spacing */
    }
    /* Uniform widths for each row */
    .row1 .image-container {
      width: 300px; /* 1200px / 4 = 300px */
    }
    .row2-3 .image-container {
      width: 200px; /* 1200px / 6 = 200px */
    }
    .month-section {
      display: none;
    }
    .month-section.active {
      display: block;
    }
    /* Likes overlay */
    .likes-overlay {
      position: absolute;
      top: 10px;
      left: 10px;
      background-color: rgba(0, 0, 0, 0.7);
      color: #ffffff;
      padding: 5px 10px;
      border-radius: 5px;
      display: flex;
      align-items: center;
      opacity: 0;
      transition: opacity 0.3s ease;
      font-size: 14px;
    }
    .tilt-wrapper:hover .likes-overlay {
      opacity: 1;
    }
    .likes-overlay::before {
      content: '❤️';
      margin-right: 5px;
    }
    /* Full-screen modal styles */
    .modal {
        display: none;
        position: fixed;
        top: 0;
        left: 0;
        width: 100vw;
        height: 100vh;
        background-color: rgba(0, 0, 0, 0.8);
        z-index: 1000;
        justify-content: center;
        align-items: center;
        margin: 0;
        padding: 0;
        box-sizing: border-box;
    }
    .modal.active {
        display: flex;
    }
    .modal .image-container {
        width: auto;
        height: auto;
        max-width: 90vw;
        max-height: 90vh;
        display: flex;
        justify-content: center;
        align-items: center;
    }
    .modal .tilt-wrapper {
        position: relative; /* Ensure the overlay positions correctly */
        display: inline-block; /* Ensure the wrapper hugs its content */
    }
    .modal img {
        max-width: 90vw;
        max-height: 90vh;
        width: auto;
        height: auto;
        object-fit: contain;
        border: 2px solid #ffffff;
        border-radius: 5px;
        display: block; /* Remove any inline-block spacing */
    }
  </style>
</head>
<body>
  <h1>BWP @ <a href="https://x.com/rendo/lists" target="_blank" rel="noopener noreferrer">https://x.com/rendo/lists</a></h1>
  <div class="month-buttons">
    ${months.map(month => `<button onclick="showMonth('${month}')">${month === 'Jan' ? 'January' : month === 'Feb' ? 'February' : month === 'Mar' ? 'March' : month === 'Apr' ? 'April' : month === 'May' ? 'May' : month === 'Jun' ? 'June' : month === 'Jul' ? 'July' : month === 'Aug' ? 'August' : month === 'Sep' ? 'September' : month === 'Oct' ? 'October' : month === 'Nov' ? 'November' : 'December'}</button>`).join('')}
  </div>
  ${months.map(month => {
    // Define row structure
    const images = imageData[month];
    let imageIndex = 0;
    const rowCounts = [4]; // First row: 4 images
    let htmlOutput = '';

    // Process images row by row
    for (let row = 0; imageIndex < images.length; row++) {
      const imagesInRow = row < rowCounts.length ? rowCounts[row] : 6; // 6 images per row after row 1
      const rowImages = images.slice(imageIndex, imageIndex + imagesInRow);
      imageIndex += imagesInRow;

      // Determine row class based on row number
      let rowClass = row === 0 ? 'row1' : 'row2-3';

      // Generate HTML for this row
      htmlOutput += `
        <div class="row ${rowClass}">
          ${rowImages.map(src => {
            const likes = parseInt(src.split('/').pop().split('.').shift());
            return `
              <div class="image-container">
                <div class="tilt-wrapper tilt-image" onclick="toggleFullScreen('${src}')">
                  <img src="${src}" alt="Image with ${likes} likes">
                  <div class="likes-overlay">${likes}</div>
                </div>
              </div>
            `;
          }).join('')}
        </div>
      `;
    }

    return `
    <div id="${month}" class="month-section${month === 'Jan' ? ' active' : ''}">
      <div class="collage-container">
        <div class="collage">
          ${htmlOutput}
        </div>
      </div>
    </div>
  `;
  }).join('')}

  <!-- Full-screen modal -->
  <div id="modal" class="modal" onclick="toggleFullScreen()">
    <div class="image-container">
      <div class="tilt-wrapper tilt-image" id="modal-wrapper">
        <img id="modal-image" src="" alt="">
        <div class="likes-overlay" id="modal-likes"></div>
      </div>
    </div>
  </div>

  <!-- Include vanilla-tilt via CDN -->
  <script src="https://cdnjs.cloudflare.com/ajax/libs/vanilla-tilt/1.7.0/vanilla-tilt.min.js"></script>
  <script>
    function showMonth(month) {
      document.querySelectorAll('.month-section').forEach(section => {
        section.classList.remove('active');
      });
      document.getElementById(month).classList.add('active');
      initTilt();
    }

    function initTilt() {
      VanillaTilt.init(document.querySelectorAll('.month-section.active .tilt-image'), {
        max: 15,
        speed: 400,
        glare: true,
        'max-glare': 0.5
      });
      VanillaTilt.init(document.querySelectorAll('#modal-wrapper'), {
        max: 15,
        speed: 400,
        glare: true,
        'max-glare': 0.5
      });
    }

    let currentImage = null;
    function toggleFullScreen(src) {
      const modal = document.getElementById('modal');
      const modalImage = document.getElementById('modal-image');
      const modalLikes = document.getElementById('modal-likes');

      if (modal.classList.contains('active')) {
        modal.classList.remove('active');
        currentImage = null;
      } else if (src) {
        modalImage.src = src;
        const likes = src.split('/').pop().split('.').shift();
        modalLikes.textContent = likes;
        modal.classList.add('active');
        currentImage = src;
        initTilt();
      }
    }

    initTilt();
  </script>
</body>
</html>
  `;

  // Ensure public/ exists
  const publicDir = path.join(__dirname, '../public');
  try {
    await fs.access(publicDir);
  } catch {
    await fs.mkdir(publicDir);
  }

  // Write the HTML
  await fs.writeFile(path.join(publicDir, 'index.html'), html);
  console.log('Static pages generated successfully in public/index.html');
}

generatePages().catch(error => {
  console.error('Error generating pages:', error);
});