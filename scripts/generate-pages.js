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
        .map(file => `/images/${month}/${file}`)
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

  // Generate HTML
  const html = `
<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <title>My Dark Mode Collage</title>
  <style>
    body {
      background-color: #1a1a1a;
      color: #ffffff;
      margin: 0;
      padding: 20px;
      text-align: center;
      font-family: Arial, sans-serif;
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
    .collage {
      display: flex;
      flex-wrap: wrap;
      justify-content: center;
      gap: 10px;
    }
    .collage img {
      width: 200px;
      height: 200px;
      object-fit: cover;
      border: 2px solid #ffffff;
    }
    .month-section {
      display: none;
    }
    .month-section.active {
      display: block;
    }
  </style>
</head>
<body>
  <h1>My Dark Mode Collage</h1>
  <div class="month-buttons">
    ${months.map(month => `<button onclick="showMonth('${month}')">${month === 'Jan' ? 'January' : month === 'Feb' ? 'February' : month === 'Mar' ? 'March' : month === 'Apr' ? 'April' : month === 'May' ? 'May' : month === 'Jun' ? 'June' : month === 'Jul' ? 'July' : month === 'Aug' ? 'August' : month === 'Sep' ? 'September' : month === 'Oct' ? 'October' : month === 'Nov' ? 'November' : 'December'}</button>`).join('')}
  </div>
  ${months.map(month => `
    <div id="${month}" class="month-section${month === 'Jan' ? ' active' : ''}">
      <div class="collage">
        ${imageData[month].map(src => `<img src="${src}" alt="Image with ${src.split('/').pop().split('.').shift()} likes">`).join('')}
      </div>
    </div>
  `).join('')}

  <script>
    function showMonth(month) {
      document.querySelectorAll('.month-section').forEach(section => {
        section.classList.remove('active');
      });
      document.getElementById(month).classList.add('active');
    }
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