let availableMonths = [];
let currentMonthIndex = -1;

// Fetch the list of available months
async function fetchMonths() {
    try {
        const response = await fetch('/api/months');
        availableMonths = await response.json();
        renderMonthNav();
    } catch (err) {
        console.error('Error fetching months:', err);
        document.getElementById('month-nav').innerHTML = '<p>Error loading months.</p>';
    }
}

// Render the month navigation bar
function renderMonthNav() {
    const monthNav = document.getElementById('month-nav');
    monthNav.innerHTML = availableMonths.map((month, index) => `
        <a href="#" data-month="${month}" data-index="${index}" class="${currentMonthIndex === index ? 'active' : ''}">${month}</a>
    `).join(' | ');

    // Add click event listeners to month links
    document.querySelectorAll('.month-nav a').forEach(link => {
        link.addEventListener('click', (e) => {
            e.preventDefault();
            currentMonthIndex = parseInt(e.target.getAttribute('data-index'));
            loadImages(availableMonths[currentMonthIndex]);
            updateNav();
        });
    });

    // Update Previous/Next buttons
    updateNav();
}

// Load images for a specific month
async function loadImages(month) {
    try {
        const response = await fetch(`/api/images/${month}`);
        const images = await response.json();

        // Split images into rows
        const topRow = images.slice(0, 3); // 3 large images
        const middleRow = images.slice(3, 7); // 4 medium images
        const bottomRow = images.slice(7, 15); // 8 small images

        // Render the gallery
        const gallery = document.getElementById('gallery');
        gallery.innerHTML = `
            <div class="top-row">
                ${topRow.map(img => `
                    <div class="image-container large">
                        <img src="${img.src}" alt="Beautiful Woman" class="tilt-image">
                        <span class="likes-tooltip">${img.likes} Likes</span>
                    </div>
                `).join('')}
            </div>
            <div class="middle-row">
                ${middleRow.map(img => `
                    <div class="image-container medium">
                        <img src="${img.src}" alt="Beautiful Woman" class="tilt-image">
                        <span class="likes-tooltip">${img.likes} Likes</span>
                    </div>
                `).join('')}
            </div>
            <div class="bottom-row">
                ${bottomRow.map(img => `
                    <div class="image-container small">
                        <img src="${img.src}" alt="Beautiful Woman" class="tilt-image">
                        <span class="likes-tooltip">${img.likes} Likes</span>
                    </div>
                `).join('')}
            </div>
        `;
    } catch (err) {
        console.error('Error loading images:', err);
        document.getElementById('gallery').innerHTML = '<p>Error loading images.</p>';
    }
}

// Update the navigation bar and Previous/Next buttons
function updateNav() {
    // Update active month
    document.querySelectorAll('.month-nav a').forEach(link => {
        const index = parseInt(link.getAttribute('data-index'));
        link.classList.toggle('active', index === currentMonthIndex);
    });

    // Update Previous/Next buttons
    const prevBtn = document.getElementById('prev-btn');
    const nextBtn = document.getElementById('next-btn');
    prevBtn.disabled = currentMonthIndex <= 0;
    nextBtn.disabled = currentMonthIndex >= availableMonths.length - 1 || currentMonthIndex === -1;
}

// Add event listeners for Previous/Next buttons
document.getElementById('prev-btn').addEventListener('click', () => {
    if (currentMonthIndex > 0) {
        currentMonthIndex--;
        loadImages(availableMonths[currentMonthIndex]);
        updateNav();
    }
});

document.getElementById('next-btn').addEventListener('click', () => {
    if (currentMonthIndex < availableMonths.length - 1) {
        currentMonthIndex++;
        loadImages(availableMonths[currentMonthIndex]);
        updateNav();
    }
});

// Initialize the page
fetchMonths();