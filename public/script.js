document.querySelectorAll('.tilt-image').forEach(img => {
    // Extract the filename from the src (e.g., "/images/Jan/1254.jpg" -> "1254.jpg")
    const filename = img.src.split('/').pop();
    // Extract the number of likes from the filename (e.g., "1254.jpg" -> "1254")
    const likes = filename.split('.')[0];
    
    // Set the tooltip text
    const tooltip = img.nextElementSibling;
    tooltip.textContent = `${likes} Likes`;
});