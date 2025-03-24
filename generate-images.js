const fs = require('fs').promises;
const path = require('path');

async function generateImageList() {
  const months = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];
  const imageData = {};

  for (const month of months) {
    const dirPath = path.join(__dirname, '../images', month);
    try {
      const files = await fs.readdir(dirPath);
      imageData[month] = files
        .filter(file => file.endsWith('.jpg'))
        .map(file => `/images/${month}/${file}`);
    } catch (error) {
      imageData[month] = []; // Empty array if folder doesn’t exist
    }
  }

  // Write the list to public/images.json
  await fs.writeFile(
    path.join(__dirname, '../public', 'images.json'),
    JSON.stringify(imageData, null, 2)
  );
  console.log('Image list generated successfully');
}

generateImageList().catch(console.error);