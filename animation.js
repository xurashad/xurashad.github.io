// Function to apply dark mode
function applyDarkMode() {
    const isDarkMode = localStorage.getItem('darkMode') === 'enabled';
    document.body.classList.toggle('dark-mode', isDarkMode);
    document.getElementById('dark-mode-toggle').checked = isDarkMode;
}

// Function to toggle dark mode
function toggleDarkMode() {
    const checkbox = document.getElementById('dark-mode-toggle');
    document.body.classList.toggle('dark-mode', checkbox.checked);
    localStorage.setItem('darkMode', checkbox.checked ? 'enabled' : 'disabled');
}

// Function to trigger the animation
function animateHeading() {
    const heading = document.getElementById('main-heading');
    heading.style.animation = 'none';
    heading.offsetHeight; // Trigger reflow
    heading.style.animation = null;
}

// Function to toggle the menu
function toggleMenu() {
    const menu = document.getElementById('menu');
    menu.classList.toggle('active');
}

// Apply dark mode and animate heading on page load
document.addEventListener('DOMContentLoaded', function() {
    applyDarkMode();
    animateHeading();
    const checkbox = document.getElementById('dark-mode-toggle');
    const isDarkMode = localStorage.getItem('darkMode') === 'enabled';
    checkbox.checked = isDarkMode;
    document.body.classList.toggle('dark-mode', isDarkMode);
    checkbox.addEventListener('change', toggleDarkMode);
});
