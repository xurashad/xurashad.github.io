
// Wait for the DOM to be fully loaded before running the script
document.addEventListener("DOMContentLoaded", function() {
    // --- Find all elements ---
    const themeToggle = document.getElementById('theme-toggle');
    const themeIconSun = document.getElementById('theme-icon-sun');
    const themeIconMoon = document.getElementById('theme-icon-moon');
    const themeToggleText = document.getElementById('theme-toggle-text');
    const htmlElement = document.documentElement;
    const navLinks = document.querySelectorAll('.nav-button');

    // --- THEME LOGIC ---
    /**
     * Applies the selected theme and updates the toggle button's state to reflect
     * the action it will perform next.
     * @param {string} theme - The theme to apply ('dark' or 'light').
     */
    function applyTheme(theme) {
        const isDark = theme === 'dark';

        // Set the 'dark' class on the <html> element
        htmlElement.classList.toggle('dark', isDark);

        // Update icon visibility: show the icon for the mode we can switch TO.
        if (themeIconSun) {
            // Show sun icon when in dark mode (action is to switch to light)
            themeIconSun.classList.toggle('hidden', !isDark);
        }
        if (themeIconMoon) {
            // Show moon icon when in light mode (action is to switch to dark)
            themeIconMoon.classList.toggle('hidden', isDark);
        }

        // Update button text to reflect the action.
        if (themeToggleText) {
            themeToggleText.textContent = isDark ? 'Light Mode' : 'Dark Mode';
        }
        
        // Save the user's preference to localStorage
        localStorage.setItem('theme', theme);
    }
    
    // Add click listener for the theme toggle button
    if (themeToggle) {
        themeToggle.addEventListener('click', () => {
            // Determine the new theme based on the current one and apply it
            const newTheme = htmlElement.classList.contains('dark') ? 'light' : 'dark';
            applyTheme(newTheme);
        });
    }

    // --- NAVIGATION LOGIC ---
    /**
     * Sets the active style for the navigation link corresponding to the current page.
     */
    function setActiveLink() {
        const currentPagePath = window.location.pathname;
        const currentPageFile = currentPagePath.substring(currentPagePath.lastIndexOf('/') + 1);

        navLinks.forEach(link => {
            const linkPath = new URL(link.href).pathname;
            const linkFile = linkPath.substring(linkPath.lastIndexOf('/') + 1);

            let isActive = false;
            // Case 1: The link's file matches the current page's file.
            if (currentPageFile === linkFile) {
                isActive = true;
            }
            // Case 2: Handle the root path, which should match 'index.html'.
            if ((currentPageFile === '' || currentPageFile === 'index.html') && linkFile === 'index.html') {
                isActive = true;
            }

            const activeClasses = ['bg-teal-500/10', 'text-teal-600', 'dark:bg-teal-400/10', 'dark:text-teal-300'];
            const inactiveClasses = ['text-slate-500', 'dark:text-slate-400', 'hover:bg-slate-200/50', 'dark:hover:bg-slate-700/50', 'hover:text-slate-700', 'dark:hover:text-slate-200'];

            if (isActive) {
                link.classList.add(...activeClasses);
                link.classList.remove(...inactiveClasses);
            } else {
                link.classList.remove(...activeClasses);
                link.classList.add(...inactiveClasses);
            }
        });
    }

    // --- INITIALIZATION ---
    // 1. Set the initial theme from localStorage or default to 'dark'
    const savedTheme = localStorage.getItem('theme') || 'dark';
    applyTheme(savedTheme);

    // 2. Highlight the active navigation link
    setActiveLink();
});
