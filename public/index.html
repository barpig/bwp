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
  </style>
</head>
<body>
  <h1>My Dark Mode Collage</h1>
  <div class="month-buttons">
    <button onclick="showImages('Jan')">January</button>
    <button onclick="showImages('Feb')">February</button>
    <button onclick="showImages('Mar')">March</button>
    <button onclick="showImages('Apr')">April</button>
    <button onclick="showImages('May')">May</button>
    <button onclick="showImages('Jun')">June</button>
    <button onclick="showImages('Jul')">July</button>
    <button onclick="showImages('Aug')">August</button>
    <button onclick="showImages('Sep')">September</button>
    <button onclick="showImages('Oct')">October</button>
    <button onclick="showImages('Nov')">November</button>
    <button onclick="showImages('Dec')">December</button>
  </div>
  <div class="collage" id="collage"></div>

  <script>
    let imageData = {};

    // Fetch the generated image list
    fetch('/images.json')
      .then(response => response.json())
      .then(data => {
        imageData = data;
        showImages('Jan'); // Load January by default
      })
      .catch(error => console.error('Error loading images:', error));

    function showImages(month) {
      const collage = document.getElementById('collage');
      collage.innerHTML = ''; // Clear current images

      const images = imageData[month] || [];
      images
        .sort((a, b) => { // Sort highest to lowest by likes
          const likesA = parseInt(a.split('/').pop().split('.').shift());
          const likesB = parseInt(b.split('/').pop().split('.').shift());
          return likesB - likesA;
        })
        .forEach(src => {
          const img = document.createElement('img');
          img.src = src;
          img.alt = `Image with ${src.split('/').pop().split('.').shift()} likes`;
          collage.appendChild(img);
        });
    }
  </script>
</body>
</html>