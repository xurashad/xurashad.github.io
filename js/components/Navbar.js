class SpecialNav extends HTMLElement {
    connectedCallback() {
        // AUTO-FIX: Automatically switches the parent layout so the header stays on top
        const parent = this.parentElement;
        if (parent && parent.classList.contains('flex') && !parent.classList.contains('flex-col')) {
            parent.classList.add('flex-col');
        }
        
        // AUTO-FIX: Remove internal scrolling from <main> so the whole page scrolls naturally under the sticky nav
        const mainElement = document.querySelector('main');
        if (mainElement) {
            mainElement.classList.remove('overflow-y-auto');
        }

        // Force the component to act as a full-width block container
        this.classList.add('block', 'w-full', 'sticky', 'top-0', 'z-50');

        this.innerHTML = `
        <!-- Minimalist Top Header (Always Visible) -->
        <header class="bg-white/90 dark:bg-slate-800/90 backdrop-blur-md border-b border-slate-200/80 dark:border-slate-700/50 w-full shadow-sm">
            <div class="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
                <div class="flex items-center justify-between h-16">
                    
                    <!-- Logo -->
                    <div class="flex-shrink-0 flex items-center">
                        <a href="index.html" class="text-2xl font-bold text-teal-600 dark:text-teal-400 tracking-tight">Rashad H.</a>
                    </div>
                    
                    <!-- Action Buttons (Theme & Menu) -->
                    <div class="flex items-center space-x-2">
                        <!-- Theme Toggle Button -->
                        <button class="theme-toggle p-2 rounded-full text-slate-500 hover:bg-slate-200/50 dark:text-slate-400 dark:hover:bg-slate-700/50 transition-colors" aria-label="Switch theme mode">
                            <svg class="theme-icon-sun w-5 h-5 hidden" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 3v1m0 16v1m9-9h-1M4 12H3m15.364 6.364l-.707-.707M6.343 6.343l-.707-.707m12.728 0l-.707.707M6.343 17.657l-.707.707M16 12a4 4 0 11-8 0 4 4 0 018 0z"></path></svg>
                            <svg class="theme-icon-moon w-5 h-5 hidden" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M20.354 15.354A9 9 0 018.646 3.646 9.003 9.003 0 0012 21a9.003 9.003 0 008.354-5.646z"></path></svg>
                        </button>
                        
                        <!-- Hamburger Menu Button -->
                        <button id="mobile-menu-btn" class="p-2 rounded-md text-slate-500 hover:bg-slate-200/50 dark:text-slate-400 dark:hover:bg-slate-700/50 focus:outline-none transition-colors">
                            <svg class="w-6 h-6" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M4 6h16M4 12h16M4 18h16"></path></svg>
                        </button>
                    </div>
                </div>
            </div>
        </header>

        <!-- Sidebar Overlay (Visible when menu is open on ANY screen size) -->
        <div id="mobile-sidebar-overlay" class="fixed inset-0 bg-slate-900/50 backdrop-blur-sm z-[60] hidden opacity-0 transition-opacity duration-300"></div>
        
        <!-- Collapsible Sidebar -->
        <div id="mobile-sidebar" class="fixed inset-y-0 left-0 z-[70] w-64 bg-slate-50 dark:bg-slate-900 shadow-2xl transform -translate-x-full transition-transform duration-300 flex flex-col overflow-y-auto border-r border-slate-200/80 dark:border-slate-700/50">
            <!-- Sidebar Header -->
            <div class="p-4 flex items-center justify-between border-b border-slate-200/80 dark:border-slate-700/50 h-16">
                <span class="text-xl font-bold text-teal-600 dark:text-teal-400 tracking-tight">Menu</span>
                <button id="close-sidebar-btn" class="p-2 rounded-md text-slate-500 hover:bg-slate-200/50 dark:text-slate-400 dark:hover:bg-slate-700/50 transition-colors">
                    <svg class="w-6 h-6" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M6 18L18 6M6 6l12 12"></path></svg>
                </button>
            </div>

            <!-- Sidebar Navigation Links -->
            <nav class="flex flex-col p-4 space-y-2">
                <a href="index.html" data-page="Home" class="nav-button text-slate-500 dark:text-slate-400 flex items-center space-x-3 p-3 rounded-lg w-full text-left transition-all duration-200 ease-in-out group">
                    <div class="flex-shrink-0"><svg xmlns="http://www.w3.org/2000/svg" class="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M3 12l2-2m0 0l7-7 7 7M5 10v10a1 1 0 001 1h3m10-11l2 2m-2-2v10a1 1 0 01-1 1h-3m-6 0a1 1 0 001-1v-4a1 1 0 011-1h2a1 1 0 011 1v4a1 1 0 001 1m-6 0h6"></path></svg></div>
                    <span class="font-medium">Home</span>
                </a>
                <a href="apps.html" data-page="Apps" class="nav-button text-slate-500 dark:text-slate-400 flex items-center space-x-3 p-3 rounded-lg w-full text-left transition-all duration-200 ease-in-out group">
                    <div class="flex-shrink-0"><svg xmlns="http://www.w3.org/2000/svg" class="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M4 6a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2H6a2 2 0 01-2-2V6zM14 6a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2h-2a2 2 0 01-2-2V6zM4 16a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2H6a2 2 0 01-2-2v-2zM14 16a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2h-2a2 2 0 01-2-2v-2z"></path></svg></div>
                    <span class="font-medium">Apps</span>
                </a>
                <a href="datasets.html" data-page="Datasets" class="nav-button text-slate-500 dark:text-slate-400 flex items-center space-x-3 p-3 rounded-lg w-full text-left transition-all duration-200 ease-in-out group">
                    <div class="flex-shrink-0"><svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><ellipse cx="12" cy="5" rx="9" ry="3"/><path d="M21 12c0 1.66-4 3-9 3s-9-1.34-9-3"/><path d="M3 5v14c0 1.66 4 3 9 3s9-1.34 9-3V5"/></svg></div>
                    <span class="font-medium">Datasets</span>
                </a>
                <a href="posts.html" data-page="Posts" class="nav-button text-slate-500 dark:text-slate-400 flex items-center space-x-3 p-3 rounded-lg w-full text-left transition-all duration-200 ease-in-out group">
                    <div class="flex-shrink-0"><svg xmlns="http://www.w3.org/2000/svg" class="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2m-3 7h3m-3 4h3m-6-4h.01M9 16h.01"></path></svg></div>
                    <span class="font-medium">Posts</span>
                </a>
                <a href="documents.html" data-page="Documents" class="nav-button text-slate-500 dark:text-slate-400 flex items-center space-x-3 p-3 rounded-lg w-full text-left transition-all duration-200 ease-in-out group">
                    <div class="flex-shrink-0"><svg xmlns="http://www.w3.org/2000/svg" class="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M7 21h10a2 2 0 002-2V9.414a1 1 0 00-.293-.707l-5.414-5.414A1 1 0 0012.586 3H7a2 2 0 00-2 2v14a2 2 0 002 2z"></path></svg></div>
                    <span class="font-medium">Documents</span>
                </a>
                <a href="cv.html" data-page="CV" class="nav-button text-slate-500 dark:text-slate-400 flex items-center space-x-3 p-3 rounded-lg w-full text-left transition-all duration-200 ease-in-out group">
                    <div class="flex-shrink-0"><svg xmlns="http://www.w3.org/2000/svg" class="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M10 6H5a2 2 0 00-2 2v9a2 2 0 002 2h14a2 2 0 002-2V8a2 2 0 00-2-2h-5m-4 0V5a2 2 0 012-2h4a2 2 0 012 2v1m-4 0h4"></path></svg></div>
                    <span class="font-medium">CV</span>
                </a>
                <a href="palestine.html" data-page="Palestine" class="nav-button text-slate-500 dark:text-slate-400 flex items-center space-x-3 p-3 rounded-lg w-full text-left transition-all duration-200 ease-in-out group">
                    <div class="flex-shrink-0"><svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 600 300" width="24" height="24"><defs><clipPath id="sidebar-icon-shape"><rect x="0" y="0" width="600" height="300" rx="40" ry="40"/></clipPath></defs><g clip-path="url(#sidebar-icon-shape)"><rect x="0" y="0" width="600" height="100" fill="#000000" /><rect x="0" y="100" width="600" height="100" fill="#ffffff" /><rect x="0" y="200" width="600" height="100" fill="#009639" /><polygon points="0,0 0,300 200,150" fill="#ce1126" /></g></svg></div>
                    <span class="font-medium">Palestine</span>
                </a>
                <a href="contact.html" data-page="Contact" class="nav-button text-slate-500 dark:text-slate-400 flex items-center space-x-3 p-3 rounded-lg w-full text-left transition-all duration-200 ease-in-out group">
                    <div class="flex-shrink-0"><svg xmlns="http://www.w3.org/2000/svg" class="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M3 8l7.89 5.26a2 2 0 002.22 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z"></path></svg></div>
                    <span class="font-medium">Contact</span>
                </a>
            </nav>
        </div>
        `;
    }
}
customElements.define('special-nav', SpecialNav);