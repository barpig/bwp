const fs = require('fs').promises;
const path = require('path');

async function generateImageList() {
  console.log('Starting image list generation...');
  const months = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];
  const imageData = {};

  const publicDir = path.join(__dirname, 'public');
  try {
    await fs.access(publicDir);
    console.log('public/ directory exists');
  } catch {
    console.log('Creating public/ directory');
    await fs.mkdir(publicDir);
  }

  for (const month of months) {
    const dirPath = path.join(__dirname, 'images', month);
    try {
      const files = await fs.readdir(dirPath);
      console.log(`Found ${files.length} files in images/${month}`);
      imageData[month] = files
        .filter(file => file.endsWith('.jpg'))
        .map(file => `/images/${month}/${file}`);
    } catch (error) {
      console.log(`No images found for ${month}`);
      imageData[month] = [];
    }
  }

  await fs.writeFile(
    path.join(publicDir, 'images.json'),
    JSON.stringify(imageData, null, 2)
  );
  console.log('Image list generated successfully');
}

generateImageList().catch(error => {
  console.error('Error generating image list:', error);
});