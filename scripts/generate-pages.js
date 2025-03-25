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
      padding: 2px; /* Reduced padding to minimize blank space */
      box-sizing: border-box;
      /* Placeholder gradient background; replace with a blurred image */
      background: linear-gradient(135deg, rgba(50, 50, 50, 0.8), rgba(20, 20, 20, 0.8));
      position: relative;
      overflow: hidden;
    }
    .collage {
      display: block; /* Use block to stack rows */
      width: 100%;
      position: relative;
      z-index: 1; /* Ensure images are above the background */
    }
    .row {
      display: flex; /* Each row is a flex container */
      flex-wrap: nowrap; /* Prevent wrapping within a row */
      gap: 2px; /* Reduced gap between images */
      justify-content: center; /* Center images horizontally in the row */
      align-items: center; /* Center images vertically in the row */
      margin-bottom: 2px; /* Reduced gap between rows */
      position: relative;
    }
    .image-container {
      position: relative;
      margin: 0;
      display: flex;
      justify-content: center;
      align-items: center;
      overflow: hidden; /* Ensure the glow effect doesn't overflow */
    }
    .tilt-wrapper {
      position: relative; /* Ensure the overlay positions correctly */
      display: block; /* Ensure the wrapper fills its container */
      width: 100%;
      cursor: pointer; /* Ensure the wrapper is clickable */
    }
    .collage img {
      width: 100%;
      height: auto; /* Preserve aspect ratio, no cropping */
      object-fit: contain; /* Show the entire image without cropping */
      object-position: center; /* Center the image within the container */
      border: none; /* No white borders */
      border-radius: 5px;
      display: block; /* Remove any inline-block spacing */
    }
    /* Scaled widths to reduce blank space */
    .row1 .image-container {
      width: 298px; /* (1200px - 2px padding * 2 - 3 * 2px gap) / 4 = 298px */
    }
    .row2-3 .image-container {
      width: 198px; /* (1200px - 2px padding * 2 - 5 * 2px gap) / 6 = 198px */
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
        border: none; /* No white borders in modal */
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
            const blurredSrc = src.replace('.jpg', '-blurred.jpg'); // Placeholder for blurred image URL
            return `
              <div class="image-container" style="background: url('${blurredSrc}') center center / cover no-repeat; background-size: 150%;">
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
      adjustRowHeights();
    }

    function adjustRowHeights() {
      document.querySelectorAll('.month-section.active .row').forEach(row => {
        let maxHeight = 0;
        const containers = row.querySelectorAll('.image-container');
        const images = row.querySelectorAll('img');

        // Reset heights to measure natural height
        containers.forEach(container => {
          container.style.height = 'auto';
        });
        images.forEach(img => {
          img.style.height = 'auto';
        });

        // Find the tallest image
        images.forEach(img => {
          const height = img.getBoundingClientRect().height;
          if (height > maxHeight) {
            maxHeight = height;
          }
        });

        // Set the row and containers to the tallest height
        row.style.height = maxHeight + 'px';
        containers.forEach(container => {
          container.style.height = maxHeight + 'px';
        });
      });
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

    // Run adjustRowHeights after images load
    window.addEventListener('load', adjustRowHeights);
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