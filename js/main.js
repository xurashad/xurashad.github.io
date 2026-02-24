document.addEventListener("DOMContentLoaded", function() {
    // Theme setup (Updated to handle multiple buttons via classes instead of IDs)
    const themeToggles = document.querySelectorAll('.theme-toggle');
    const themeIconsSun = document.querySelectorAll('.theme-icon-sun');
    const themeIconsMoon = document.querySelectorAll('.theme-icon-moon');
    const themeToggleTexts = document.querySelectorAll('.theme-toggle-text');
    const htmlElement = document.documentElement;
    const navLinks = document.querySelectorAll('.nav-button');

    function applyTheme(theme) {
        const isDark = theme === 'dark';
        htmlElement.classList.toggle('dark', isDark);

        themeIconsSun.forEach(icon => icon.classList.toggle('hidden', !isDark));
        themeIconsMoon.forEach(icon => icon.classList.toggle('hidden', isDark));
        themeToggleTexts.forEach(text => text.textContent = isDark ? 'Light Mode' : 'Dark Mode');
        
        localStorage.setItem('theme', theme);
    }
    
    themeToggles.forEach(toggle => {
        toggle.addEventListener('click', () => {
            const newTheme = htmlElement.classList.contains('dark') ? 'light' : 'dark';
            applyTheme(newTheme);
        });
    });

    // Active Link setup
    function setActiveLink() {
        const currentPagePath = window.location.pathname;
        const currentPageFile = currentPagePath.substring(currentPagePath.lastIndexOf('/') + 1);

        navLinks.forEach(link => {
            const linkPath = new URL(link.href).pathname;
            const linkFile = linkPath.substring(linkPath.lastIndexOf('/') + 1);

            let isActive = false;
            if (currentPageFile === linkFile) isActive = true;
            if ((currentPageFile === '' || currentPageFile === 'index.html') && linkFile === 'index.html') isActive = true;

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

    const savedTheme = localStorage.getItem('theme') || 'dark';
    applyTheme(savedTheme);
    setActiveLink();

    // Mobile Sidebar Setup
    const mobileMenuBtn = document.getElementById('mobile-menu-btn');
    const closeSidebarBtn = document.getElementById('close-sidebar-btn');
    const mobileSidebar = document.getElementById('mobile-sidebar');
    const mobileSidebarOverlay = document.getElementById('mobile-sidebar-overlay');

    function openSidebar() {
        if(mobileSidebar) mobileSidebar.classList.remove('-translate-x-full');
        if(mobileSidebarOverlay) {
            mobileSidebarOverlay.classList.remove('hidden');
            setTimeout(() => mobileSidebarOverlay.classList.remove('opacity-0'), 10);
        }
    }

    function closeSidebar() {
        if(mobileSidebar) mobileSidebar.classList.add('-translate-x-full');
        if(mobileSidebarOverlay) {
            mobileSidebarOverlay.classList.add('opacity-0');
            setTimeout(() => mobileSidebarOverlay.classList.add('hidden'), 300);
        }
    }

    if(mobileMenuBtn) mobileMenuBtn.addEventListener('click', openSidebar);
    if(closeSidebarBtn) closeSidebarBtn.addEventListener('click', closeSidebar);
    if(mobileSidebarOverlay) mobileSidebarOverlay.addEventListener('click', closeSidebar);
});