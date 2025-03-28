const fs = require('fs').promises;
const path = require('path');
const ffmpeg = require('fluent-ffmpeg');

// Ensure FFmpeg is installed and accessible
// If you're using ffmpeg-static, uncomment the following line:
// ffmpeg.setFfmpegPath(require('ffmpeg-static'));

async function generatePages() {
  console.log('Starting page generation...');
  const months = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];
  const mediaData = {};

  // Generate thumbnails for videos
  for (const month of months) {
    const videoDirPath = path.join(__dirname, '../videos', month);
    const imageDirPath = path.join(__dirname, '../images', month);
    try {
      // Ensure the images directory exists
      await fs.mkdir(imageDirPath, { recursive: true });
      const videoFiles = await fs.readdir(videoDirPath);
      for (const file of videoFiles.filter(f => f.endsWith('.mp4'))) {
        const videoPath = path.join(videoDirPath, file);
        const thumbnailPath = path.join(imageDirPath, file.replace('.mp4', '-thumbnail.jpg'));
        try {
          await new Promise((resolve, reject) => {
            ffmpeg(videoPath)
              .screenshots({
                count: 1,
                folder: imageDirPath,
                filename: file.replace('.mp4', '-thumbnail.jpg'),
                timemarks: ['0'] // Extract the first frame
              })
              .on('end', () => {
                console.log(`Generated thumbnail for ${file}`);
                resolve();
              })
              .on('error', (err) => {
                console.error(`Error generating thumbnail for ${file}:`, err);
                reject(err);
              });
          });
        } catch (error) {
          console.error(`Failed to generate thumbnail for ${file}:`, error);
        }
      }
    } catch (error) {
      console.log(`No videos found for ${month}`);
    }
  }

  // Scan images and videos for each month
  for (const month of months) {
    mediaData[month] = { images: [], videos: [] };

    // Scan images
    const imageDirPath = path.join(__dirname, '../images', month);
    try {
      const imageFiles = await fs.readdir(imageDirPath);
      mediaData[month].images = imageFiles
        .filter(file => file.endsWith('.jpg') && !file.includes('-thumbnail') && !file.includes('-blurred'))
        .map(file => ({
          type: 'image',
          src: `https://raw.githubusercontent.com/barpig/bwp/refs/heads/main/images/${month}/${file}`,
          likes: parseInt(file.split('.').shift())
        }))
        .sort((a, b) => b.likes - a.likes);
      console.log(`Found ${mediaData[month].images.length} images for ${month}`);
    } catch (error) {
      console.log(`No images found for ${month}`);
    }

    // Scan videos
    const videoDirPath = path.join(__dirname, '../videos', month);
    try {
      const videoFiles = await fs.readdir(videoDirPath);
      mediaData[month].videos = videoFiles
        .filter(file => file.endsWith('.mp4'))
        .map(file => ({
          type: 'video',
          src: `https://raw.githubusercontent.com/barpig/bwp/refs/heads/main/videos/${month}/${file}`,
          likes: parseInt(file.split('.').shift())
        }))
        .sort((a, b) => b.likes - a.likes);
      console.log(`Found ${mediaData[month].videos.length} videos for ${month}`);
    } catch (error) {
      console.log(`No videos found for ${month}`);
    }
  }

  // Generate HTML with masonry layout
  const html = `
<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <title>BWP</title>
  <style>
    body {
      background-color: #1a1a1a;
      color: #ffffff;
      margin: 0;
      padding: 20px;
      text-align: center;
      font-family: Arial, sans-serif;
      min-height: 100vh;
      display: flex;
      flex-direction: column;
      box-sizing: border-box;
    }
    .month-buttons {
      margin-bottom: 20px;
    }
    .month-buttons button {
      background-color: #333333;
      color: #ffffff;
      border: none;
      padding: 8px 16px;
      margin: 5px;
      cursor: pointer;
      font-size: 14px;
      border-radius: 5px;
      transition: background-color 0.3s ease;
    }
    .month-buttons button:hover {
      background-color: #555555;
    }
    .collage-container {
      max-width: 1200px;
      margin: 0 auto;
      border: 5px solid #333333;
      padding: 10px;
      box-sizing: border-box;
      background: linear-gradient(135deg, rgba(50, 50, 50, 0.8), rgba(20, 20, 20, 0.8));
      position: relative;
      overflow: hidden;
      flex: 1;
    }
    .collage {
      column-count: 4;
      column-gap: 10px;
      width: 100%;
      position: relative;
      z-index: 1;
    }
    @media (max-width: 900px) {
      .collage {
        column-count: 3;
      }
    }
    @media (max-width: 600px) {
      .collage {
        column-count: 2;
      }
    }
    .image-container {
      position: relative;
      margin-bottom: 10px;
      break-inside: avoid;
      display: inline-block;
      width: 100%;
    }
    .tilt-wrapper {
      position: relative;
      display: block;
      width: 100%;
      cursor: pointer;
    }
    .collage img,
    .collage video {
      width: 100%;
      height: auto;
      object-fit: contain;
      object-position: center;
      border: none;
      border-radius: 5px;
      display: block;
    }
    .collage video {
      pointer-events: none;
    }
    .month-section {
      display: none;
    }
    .month-section.active {
      display: block;
    }
    /* Play button for videos */
    .play-button {
      position: absolute;
      top: 10px;
      right: 10px;
      width: 30px;
      height: 30px;
      background-color: rgba(255, 255, 255, 0.8);
      border-radius: 50%;
      display: flex;
      justify-content: center;
      align-items: center;
      opacity: 1;
      transition: opacity 0.3s ease;
    }
    .play-button::before {
      content: '▶';
      color: #000;
      font-size: 14px;
      margin-left: 2px;
    }
    .tilt-wrapper:hover .play-button {
      opacity: 0;
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
    /* Footer styles */
    footer {
      margin-top: 20px;
      padding: 10px 20px;
      background-color: #333333;
      width: calc(100% - 40px);
      display: flex;
      justify-content: flex-end;
      align-items: center;
      box-sizing: border-box;
    }
    .footer-content {
      display: flex;
      align-items: center;
    }
    .footer-content img {
      width: 20px;
      height: 20px;
      margin-right: 8px;
    }
    footer a {
      color: #ffffff;
      text-decoration: none;
      font-size: 14px;
    }
    footer a:hover {
      text-decoration: underline;
      color: #cccccc;
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
        position: relative;
        display: inline-block;
    }
    .modal img,
    .modal video {
        max-width: 90vw;
        max-height: 90vh;
        width: auto;
        height: auto;
        object-fit: contain;
        border: none;
        border-radius: 5px;
        display: block;
    }
  </style>
</head>
<body>
  <div class="month-buttons">
    ${months.map(month => `<button onclick="showMonth('${month}')">${month === 'Jan' ? 'January' : month === 'Feb' ? 'February' : month === 'Mar' ? 'March' : month === 'Apr' ? 'April' : month === 'May' ? 'May' : month === 'Jun' ? 'June' : month === 'Jul' ? 'July' : month === 'Aug' ? 'August' : month === 'Sep' ? 'September' : month === 'Oct' ? 'October' : month === 'Nov' ? 'November' : 'December'}</button>`).join('')}
  </div>
  ${months.map(month => {
    const media = [...mediaData[month].images, ...mediaData[month].videos].sort((a, b) => b.likes - a.likes);
    return `
    <div id="${month}" class="month-section${month === 'Jan' ? ' active' : ''}">
      <div class="collage-container">
        <div class="collage">
          ${media.map(item => {
            const thumbnailSrc = item.src.replace('.mp4', '-thumbnail.jpg').replace('.jpg', '-thumbnail.jpg');
            const blurredSrc = item.src.replace('.mp4', '-blurred.jpg').replace('.jpg', '-blurred.jpg');
            return `
              <div class="image-container" style="background: url('${blurredSrc}') center center / cover no-repeat; background-size: 150%;">
                <div class="tilt-wrapper tilt-image" onclick="toggleFullScreen('${item.src}', '${item.type}')" onmouseover="playVideo(this)" onmouseout="pauseVideo(this)">
                  ${item.type === 'image' ? `
                    <img src="${item.src}" alt="Image with ${item.likes} likes">
                  ` : `
                    <video muted playsinline loop poster="${thumbnailSrc}">
                      <source src="${item.src}" type="video/mp4">
                      Your browser does not support the video tag.
                    </video>
                    <div class="play-button"></div>
                  `}
                  <div class="likes-overlay">${item.likes}</div>
                </div>
              </div>
            `;
          }).join('')}
        </div>
      </div>
    </div>
  `;
  }).join('')}

  <!-- Footer -->
  <footer>
    <div class="footer-content">
      <img src="https://upload.wikimedia.org/wikipedia/commons/5/57/X_logo_2023_%28white%29.png" alt="X Logo">
      <a href="https://x.com/rendo" target="_blank" rel="noopener noreferrer">@rendo</a>
    </div>
  </footer>

  <!-- Full-screen modal -->
  <div id="modal" class="modal" onclick="toggleFullScreen()">
    <div class="image-container">
      <div class="tilt-wrapper tilt-image" id="modal-wrapper">
        <img id="modal-image" src="" alt="" style="display: none;">
        <video id="modal-video" muted playsinline controls style="display: none;">
          <source id="modal-video-source" src="" type="video/mp4">
          Your browser does not support the video tag.
        </video>
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

    let currentMedia = null;
    let currentMediaType = null;
    function toggleFullScreen(src, type) {
      const modal = document.getElementById('modal');
      const modalImage = document.getElementById('modal-image');
      const modalVideo = document.getElementById('modal-video');
      const modalVideoSource = document.getElementById('modal-video-source');
      const modalLikes = document.getElementById('modal-likes');

      if (modal.classList.contains('active')) {
        modal.classList.remove('active');
        modalImage.style.display = 'none';
        modalVideo.style.display = 'none';
        modalVideo.pause();
        currentMedia = null;
        currentMediaType = null;
      } else if (src && type) {
        if (type === 'image') {
          modalImage.src = src;
          modalImage.style.display = 'block';
          modalVideo.style.display = 'none';
        } else {
          modalVideoSource.src = src;
          modalVideo.load();
          modalVideo.style.display = 'block';
          modalImage.style.display = 'none';
          modalVideo.play();
        }
        const likes = src.split('/').pop().split('.').shift();
        modalLikes.textContent = likes;
        modal.classList.add('active');
        currentMedia = src;
        currentMediaType = type;
        initTilt();
      }
    }

    function playVideo(element) {
      const video = element.querySelector('video');
      if (video) {
        const playPromise = video.play();
        if (playPromise !== undefined) {
          playPromise.catch(error => {
            console.error('Video playback failed:', error);
          });
        }
      }
    }

    function pauseVideo(element) {
      const video = element.querySelector('video');
      if (video) {
        video.pause();
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