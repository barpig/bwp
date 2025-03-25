const fs = require('fs').promises;
const path = require('path');

module.exports = async (req, res) => {
  const { month } = req.query;
  if (!month) {
    return res.status(400).json({ error: 'Month is required' });
  }

  const dirPath = path.join(process.cwd(), 'images', month);
  try {
    const files = await fs.readdir(dirPath);
    const images = files
      .filter(file => file.endsWith('.jpg'))
      .map(file => `/images/${month}/${file}`);
    res.status(200).json(images);
  } catch (error) {
    res.status(200).json([]); // Return empty array if folder doesn’t exist
  }
};