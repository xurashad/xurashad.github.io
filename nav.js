//////////////////////////////////////////////////
// ----- NAVIGATION BAR SCRIPT -----
//////////////////////////////////////////////////
class SpecialNav extends HTMLElement {
    connectedCallback() {
        this.innerHTML = `
            <nav class="bg-white/80 dark:bg-slate-800/50 backdrop-blur-sm p-2 sm:p-4 flex flex-col items-center sm:items-start space-y-2 border-r border-slate-200/80 dark:border-slate-700/50 sticky top-0 h-screen overflow-y-auto">
            <div class="p-2 mb-6 hidden sm:block">
                <h1 class="text-2xl font-bold text-teal-600 dark:text-teal-400">Rashad H.</h1>
                <p class="text-slate-500 dark:text-slate-400 text-sm">Theoretical Physicist</p>
            </div>
            <div class="p-2 mb-6 sm:hidden">
                <div class="w-10 h-10 bg-teal-500 dark:bg-teal-400 rounded-full flex items-center justify-center text-white dark:text-slate-900 font-bold text-lg">
                RH
                </div>
            </div>
            <ul class="flex flex-col space-y-2">
                <li>
                    <a href="../index.html" data-page="Home" class="nav-button flex items-center space-x-3 p-3 rounded-lg w-full text-left transition-all duration-200 ease-in-out group">
                        <div class="flex-shrink-0">
                            <svg xmlns="http://www.w3.org/2000/svg" class="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M3 12l2-2m0 0l7-7 7 7M5 10v10a1 1 0 001 1h3m10-11l2 2m-2-2v10a1 1 0 01-1 1h-3m-6 0a1 1 0 001-1v-4a1 1 0 011-1h2a1 1 0 011 1v4a1 1 0 001 1m-6 0h6"></path>
                            </svg>
                        </div>
                        <span class="hidden sm:inline-block font-medium">Home</span>
                    </a>
                </li>
                <li>
                    <a href="../apps.html" data-page="Apps" class="nav-button flex items-center space-x-3 p-3 rounded-lg w-full text-left transition-all duration-200 ease-in-out group">
                        <div class="flex-shrink-0">
                            <svg xmlns="http://www.w3.org/2000/svg" class="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M4 6a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2H6a2 2 0 01-2-2V6zM14 6a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2h-2a2 2 0 01-2-2V6zM4 16a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2H6a2 2 0 01-2-2v-2zM14 16a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2h-2a2 2 0 01-2-2v-2z"></path>
                            </svg>
                        </div>
                        <span class="hidden sm:inline-block font-medium">Apps</span>
                    </a>
                </li>
                    <li>
                        <a href="../datasets.html" data-page="Datasets" class="nav-button flex items-center space-x-3 p-3 rounded-lg w-full text-left transition-all duration-200 ease-in-out group">
                            <div class="flex-shrink-0">
                                <svg xmlns="http://www.w3.org/2000/svg" 
                                    width="24" 
                                    height="24" 
                                    viewBox="0 0 24 24" 
                                    fill="none" 
                                    stroke="currentColor" 
                                    stroke-width="2" 
                                    stroke-linecap="round" 
                                    stroke-linejoin="round">
                                <ellipse cx="12" cy="5" rx="9" ry="3"/>
                                <path d="M21 12c0 1.66-4 3-9 3s-9-1.34-9-3"/>
                                <path d="M3 5v14c0 1.66 4 3 9 3s9-1.34 9-3V5"/>
                                </svg>
                            </div>
                            <span class="hidden sm:inline-block font-medium">Datasets</span>
                        </a>
                    </li>
                <li>
                    <a href="../posts.html" data-page="Posts" class="nav-button flex items-center space-x-3 p-3 rounded-lg w-full text-left transition-all duration-200 ease-in-out group">
                        <div class="flex-shrink-0">
                            <svg xmlns="http://www.w3.org/2000/svg" class="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2m-3 7h3m-3 4h3m-6-4h.01M9 16h.01"></path>
                            </svg>
                        </div>
                        <span class="hidden sm:inline-block font-medium">Posts</span>
                    </a>
                </li>
                <li>
                    <a href="../documents.html" data-page="Documents" class="nav-button flex items-center space-x-3 p-3 rounded-lg w-full text-left transition-all duration-200 ease-in-out group">
                        <div class="flex-shrink-0">
                            <svg xmlns="http://www.w3.org/2000/svg" class="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M7 21h10a2 2 0 002-2V9.414a1 1 0 00-.293-.707l-5.414-5.414A1 1 0 0012.586 3H7a2 2 0 00-2 2v14a2 2 0 002 2z"></path>
                            </svg>
                        </div>
                        <span class="hidden sm:inline-block font-medium">Documents</span>
                    </a>
                </li>
                <li>
                    <a href="../cv.html" data-page="CV" class="nav-button flex items-center space-x-3 p-3 rounded-lg w-full text-left transition-all duration-200 ease-in-out group">
                        <div class="flex-shrink-0">
                            <svg xmlns="http://www.w3.org/2000/svg" class="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M10 6H5a2 2 0 00-2 2v9a2 2 0 002 2h14a2 2 0 002-2V8a2 2 0 00-2-2h-5m-4 0V5a2 2 0 012-2h4a2 2 0 012 2v1m-4 0h4"></path>
                            </svg>
                        </div>
                        <span class="hidden sm:inline-block font-medium">CV</span>
                    </a>
                </li>
<!--                <li>
                    <a href="../personal.html" data-page="Personal Info" class="nav-button flex items-center space-x-3 p-3 rounded-lg w-full text-left transition-all duration-200 ease-in-out group">
                        <div class="flex-shrink-0">
                            <svg xmlns="http://www.w3.org/2000/svg" class="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M22 12C22 17.5228 17.5228 22 12 22C6.47715 22 2 17.5228 2 12C2 6.47715 6.47715 2 12 2C17.5228 2 22 6.47715 22 12ZM15 9C15 10.6569 13.6569 12 12 12C10.3431 12 9 10.6569 9 9C9 7.34315 10.3431 6 12 6C13.6569 6 15 7.34315 15 9ZM12 20.5C13.784 20.5 15.4397 19.9504 16.8069 19.0112C17.4108 18.5964 17.6688 17.8062 17.3178 17.1632C16.59 15.8303 15.0902 15 11.9999 15C8.90969 15 7.40997 15.8302 6.68214 17.1632C6.33105 17.8062 6.5891 18.5963 7.19296 19.0111C8.56018 19.9503 10.2159 20.5 12 20.5Z"></path>
                            </svg>
                        </div>
                        <span class="hidden sm:inline-block font-medium">Personal Info</span>
                    </a>
                </li>
                <li>
                    <a href="../science.html" data-page="Science" class="nav-button flex items-center space-x-3 p-3 rounded-lg w-full text-left transition-all duration-200 ease-in-out group">
                        <div class="flex-shrink-0">
                            <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
                                <circle cx="12" cy="12" r="1"/>
                                <ellipse cx="12" cy="12" rx="9" ry="4"/>
                                <ellipse cx="12" cy="12" rx="4" ry="9" transform="rotate(45 12 12)"/>
                                <ellipse cx="12" cy="12" rx="4" ry="9" transform="rotate(-45 12 12)"/>
                            </svg>
                        </div>
                        <span class="hidden sm:inline-block font-medium">Science</span>
                    </a>
                </li>
                <li>
                    <a href="../philosophy.html" data-page="Philosophy" class="nav-button flex items-center space-x-3 p-3 rounded-lg w-full text-left transition-all duration-200 ease-in-out group">
                        <div class="flex-shrink-0">
                            <svg width="24" height="24" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
                                <path d="M4 21h16"/>
                                <path d="M6 21V10"/>
                                <path d="M18 21V10"/>
                                <path d="M4 10h18"/>
                                <path d="M4 7h18"/>
                                <path d="M10 21V10"/>
                                <path d="M14 21V10"/>
                                <path d="M5 7c-1.5 0-2.5-1-2.5-2.5S3.5 2 5 2"/>
                                <path d="M19 7c1.5 0 2.5-1 2.5-2.5S20.5 2 19 2"/>
                            </svg>
                        </div>
                        <span class="hidden sm:inline-block font-medium">Philosophy</span>
                    </a>
                </li> -->
                <li>
                    <a href="../palestine.html" data-page="Palestine" class="nav-button flex items-center space-x-3 p-3 rounded-lg w-full text-left transition-all duration-200 ease-in-out group">
                        <div class="flex-shrink-0">
                            <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 600 300" width="24" height="24">
                                <defs>
                                    <clipPath id="icon-shape">
                                    <rect x="0" y="0" width="600" height="300" rx="40" ry="40"/>
                                    </clipPath>
                                </defs>
                                <g clip-path="url(#icon-shape)">
                                    <rect x="0" y="0" width="600" height="100" fill="#000000" />
                                    <rect x="0" y="100" width="600" height="100" fill="#ffffff" />
                                    <rect x="0" y="200" width="600" height="100" fill="#009639" />
                                    <polygon points="0,0 0,300 200,150" fill="#ce1126" />
                                </g>
                            </svg>
                        </div>
                        <span class="hidden sm:inline-block font-medium">Palestine</span>
                    </a>
                </li>
                <li>
                    <a href="../contact.html" data-page="Contact" class="nav-button flex items-center space-x-3 p-3 rounded-lg w-full text-left transition-all duration-200 ease-in-out group">
                        <div class="flex-shrink-0">
                            <svg xmlns="http://www.w3.org/2000/svg" class="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M3 8l7.89 5.26a2 2 0 002.22 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z"></path>
                            </svg>
                        </div>
                        <span class="hidden sm:inline-block font-medium">Contact</span>
                    </a>
                </li>
            </ul>
            <div class="mt-auto w-full">
                <button id="theme-toggle" class="flex items-center justify-center sm:justify-start space-x-3 p-3 rounded-lg w-full text-left transition-all duration-200 ease-in-out group text-slate-500 dark:text-slate-400 hover:bg-slate-200/50 dark:hover:bg-slate-700/50 hover:text-slate-700 dark:hover:text-slate-200" aria-label="Switch theme mode">
                    <div class="flex-shrink-0">
                        <svg id="theme-icon-sun" xmlns="http://www.w3.org/2000/svg" class="h-6 w-6 hidden" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 3v1m0 16v1m9-9h-1M4 12H3m15.364 6.364l-.707-.707M6.343 6.343l-.707-.707m12.728 0l-.707.707M6.343 17.657l-.707.707M16 12a4 4 0 11-8 0 4 4 0 018 0z"></path>
                        </svg>
                        <svg id="theme-icon-moon" xmlns="http://www.w3.org/2000/svg" class="h-6 w-6 hidden" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M20.354 15.354A9 9 0 018.646 3.646 9.003 9.003 0 0012 21a9.003 9.003 0 008.354-5.646z"></path>
                        </svg>
                    </div>
                    <span id="theme-toggle-text" class="hidden sm:inline-block font-medium"></span>
                </button>
            </div>
        </nav>
        `;
    }
}

class SpecialFooter extends HTMLElement {
    connectedCallback() {
        this.innerHTML = `
            <footer class="bg-white/50 dark:bg-slate-800/50 font-sans text-slate-800 dark:text-slate-100 transition-colors duration-300 border border-slate-200/50 dark:border-slate-700/50">
        <div class="container mx-auto px-6 py-12">
            <!-- Footer columns -->
            <div class="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-8">
                
                <!-- Column 1: Brand/Logo -->
                <div>
                    <h3 class="text-2xl font-bold dark:text-white mb-4">Rashad Hamidi</h3>
                    <p class="mb-4">
                        Theoretical Physicist
                    </p>
                    <p class="text-sm">&copy; 2025 Rashad Hamidi. All rights reserved.</p>
                </div>

                <!-- Column 2: Quick Links -->
                <div>
                    <h4 class="text-lg font-semibold dark:text-white mb-4">Quick Links</h4>
                    <ul>
                        <li class="mb-2"><a href="index.html" class="hover:text-white transition-colors duration-200">Home</a></li>
                        <li class="mb-2"><a href="cv.html" class="hover:text-white transition-colors duration-200">CV</a></li>
                        <li class="mb-2"><a href="contact.html" class="hover:text-white transition-colors duration-200">Contact</a></li>
                    </ul>
                </div>

                <!-- Column 3: Resources -->
                <div>
                    <h4 class="text-lg font-semibold dark:text-white mb-4">Resources</h4>
                    <ul>
                        <li class="mb-2"><a href="apps.html" class="hover:text-white transition-colors duration-200">Apps</a></li>
                        <li class="mb-2"><a href="datasets.html" class="hover:text-white transition-colors duration-200">Datasets</a></li>
                        <li class="mb-2"><a href="documents.html" class="hover:text-white transition-colors duration-200">Documents</a></li>
                        <li class="mb-2"><a href="posts.html" class="hover:text-white transition-colors duration-200">Posts</a></li>
                    </ul>
                </div>

                <!-- Column 4: Social Media -->
                <div>
                    <h4 class="text-lg font-semibold dark:text-white mb-4">Contact</h4>
                    <div class="flex space-x-4">
                        <!-- Email Icon -->
                        <a href="mailto:xurashad@gmail.com" class="text-gray-400 hover:text-white transition-colors duration-200" aria-label="Email">
                            <svg xmlns="http://www.w3.org/2000/svg" class="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M3 8l7.89 5.26a2 2 0 002.22 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z"></path></svg>
                        </a>
                        <!-- GitHub Icon -->
                        <a href="https://github.com/xurashad/" class="text-gray-400 hover:text-white transition-colors duration-200" aria-label="GitHub">
                            <svg xmlns="http://www.w3.org/2000/svg" class="h-6 w-6" fill="currentColor" viewBox="0 0 16 16"><path d="M8 0C3.58 0 0 3.58 0 8c0 3.54 2.29 6.53 5.47 7.59.4.07.55-.17.55-.38 0-.19-.01-.82-.01-1.49-2.01.37-2.53-.49-2.69-.94-.09-.23-.48-.94-.82-1.13-.28-.15-.68-.52-.01-.53.63-.01 1.08.58 1.23.82.72 1.21 1.87.87 2.33.66.07-.52.28-.87.51-1.07-1.78-.2-3.64-.89-3.64-3.95 0-.87.31-1.59.82-2.15-.08-.2-.36-1.02.08-2.12 0 0 .67-.21 2.2.82.64-.18 1.32-.27 2-.27.68 0 1.36.09 2 .27 1.53-1.04 2.2-.82 2.2-.82.44 1.1.16 1.92.08 2.12.51.56.82 1.27.82 2.15 0 3.07-1.87 3.75-3.65 3.95.29.25.54.73.54 1.48 0 1.07-.01 1.93-.01 2.2 0 .21.15.46.55.38A8.012 8.012 0 0 0 16 8c0-4.42-3.58-8-8-8z"></path></svg>
                        </a>
                        <!-- LinkedIn Icon -->
                        <a href="https://www.linkedin.com/in/rashad-hamidi/" class="text-gray-400 hover:text-white transition-colors duration-200" aria-label="LinkedIn">
                            <svg xmlns="http://www.w3.org/2000/svg" class="h-6 w-6" fill="currentColor" viewBox="0 0 24 24"><path d="M19 0h-14c-2.761 0-5 2.239-5 5v14c0 2.761 2.239 5 5 5h14c2.762 0 5-2.239 5-5v-14c0-2.761-2.238-5-5-5zm-11 19h-3v-11h3v11zm-1.5-12.268c-.966 0-1.75-.79-1.75-1.764s.784-1.764 1.75-1.764 1.75.79 1.75 1.764-.783 1.764-1.75 1.764zm13.5 12.268h-3v-5.604c0-3.368-4-3.113-4 0v5.604h-3v-11h3v1.765c1.396-2.586 7-2.777 7 2.476v6.759z"></path></svg>
                        </a>
                    </div>
                </div>

            </div>
        </div>
        
        <!-- Footer bottom bar (optional, for extra links or info) -->
        <div class="border-t border-gray-800">
            <div class="container mx-auto px-6 py-4 flex flex-col md:flex-row justify-between items-center text-sm">
                <div class="flex space-x-4">
                    <a href="#" class="hover:text-white">Science</a>
                    <span class="text-gray-600">|</span>
                    <a href="#" class="hover:text-white">Philosophy</a>
                    <span class="text-gray-600">|</span>
                    <a href="#" class="hover:text-white">Palestine</a>
                </div>
                <div class="mt-4 md:mt-0">
                    <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 600 300" width="24" height="24">
                        <defs>
                            <clipPath id="icon-shape">
                            <rect x="0" y="0" width="600" height="300" rx="40" ry="40"/>
                            </clipPath>
                        </defs>
                        <g clip-path="url(#icon-shape)">
                            <rect x="0" y="0" width="600" height="100" fill="#000000" />
                            <rect x="0" y="100" width="600" height="100" fill="#ffffff" />
                            <rect x="0" y="200" width="600" height="100" fill="#009639" />
                            <polygon points="0,0 0,300 200,150" fill="#ce1126" />
                        </g>
                    </svg>
                </div>
            </div>
        </div>
    </footer>
        `;
    }
}

customElements.define('special-nav', SpecialNav);
customElements.define('special-footer', SpecialFooter);


//////////////////////////////////////////////////
// ----- THEME AND NAVIGATION SCRIPT -----
//////////////////////////////////////////////////

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
