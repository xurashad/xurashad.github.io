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
                    <p class="mb-4">Theoretical Physicist</p>
                    <p class="text-sm">&copy; 2025 Rashad Hamidi. All rights reserved.</p>
                </div>

                <!-- Column 2: Quick Links -->
                <div>
                    <h4 class="text-lg font-semibold dark:text-white mb-4">Quick Links</h4>
                    <ul>
                        <li class="mb-2"><a href="index.html" class="hover:text-teal-500 transition-colors duration-200">Home</a></li>
                        <li class="mb-2"><a href="cv.html" class="hover:text-teal-500 transition-colors duration-200">CV</a></li>
                        <li class="mb-2"><a href="contact.html" class="hover:text-teal-500 transition-colors duration-200">Contact</a></li>
                    </ul>
                </div>

                <!-- Column 3: Resources -->
                <div>
                    <h4 class="text-lg font-semibold dark:text-white mb-4">Resources</h4>
                    <ul>
                        <li class="mb-2"><a href="apps.html" class="hover:text-teal-500 transition-colors duration-200">Apps</a></li>
                        <li class="mb-2"><a href="datasets.html" class="hover:text-teal-500 transition-colors duration-200">Datasets</a></li>
                        <li class="mb-2"><a href="documents.html" class="hover:text-teal-500 transition-colors duration-200">Documents</a></li>
                        <li class="mb-2"><a href="posts.html" class="hover:text-teal-500 transition-colors duration-200">Posts</a></li>
                    </ul>
                </div>

                <!-- Column 4: Social Media -->
                <div>
                    <h4 class="text-lg font-semibold dark:text-white mb-4">Links</h4>
                    <div class="flex space-x-4">
                        <a href="mailto:xurashad@gmail.com" class="text-slate-400 hover:text-teal-500 transition-colors duration-200" aria-label="Email">
                            <svg xmlns="http://www.w3.org/2000/svg" class="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M3 8l7.89 5.26a2 2 0 002.22 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z"></path>
                            </svg>
                        </a>
                        <a href="https://github.com/xurashad/" class="text-slate-400 hover:text-teal-500 transition-colors duration-200" aria-label="GitHub">
                            <svg xmlns="http://www.w3.org/2000/svg" class="h-6 w-6" fill="currentColor" viewBox="0 0 16 16">
                                <path d="M8 0C3.58 0 0 3.58 0 8c0 3.54 2.29 6.53 5.47 7.59.4.07.55-.17.55-.38 0-.19-.01-.82-.01-1.49-2.01.37-2.53-.49-2.69-.94-.09-.23-.48-.94-.82-1.13-.28-.15-.68-.52-.01-.53.63-.01 1.08.58 1.23.82.72 1.21 1.87.87 2.33.66.07-.52.28-.87.51-1.07-1.78-.2-3.64-.89-3.64-3.95 0-.87.31-1.59.82-2.15-.08-.2-.36-1.02.08-2.12 0 0 .67-.21 2.2.82.64-.18 1.32-.27 2-.27.68 0 1.36.09 2 .27 1.53-1.04 2.2-.82 2.2-.82.44 1.1.16 1.92.08 2.12.51.56.82 1.27.82 2.15 0 3.07-1.87 3.75-3.65 3.95.29.25.54.73.54 1.48 0 1.07-.01 1.93-.01 2.2 0 .21.15.46.55.38A8.012 8.012 0 0 0 16 8c0-4.42-3.58-8-8-8z"></path>
                            </svg>
                        </a>
                        <a href="https://www.linkedin.com/in/rashad-hamidi/" class="text-slate-400 hover:text-teal-500 transition-colors duration-200" aria-label="LinkedIn">
                            <svg xmlns="http://www.w3.org/2000/svg" class="h-6 w-6" fill="currentColor" viewBox="0 0 24 24">
                                <path d="M19 0h-14c-2.761 0-5 2.239-5 5v14c0 2.761 2.239 5 5 5h14c2.762 0 5-2.239 5-5v-14c0-2.761-2.238-5-5-5zm-11 19h-3v-11h3v11zm-1.5-12.268c-.966 0-1.75-.79-1.75-1.764s.784-1.764 1.75-1.764 1.75.79 1.75 1.764-.783 1.764-1.75 1.764zm13.5 12.268h-3v-5.604c0-3.368-4-3.113-4 0v5.604h-3v-11h3v1.765c1.396-2.586 7-2.777 7 2.476v6.759z"></path>
                            </svg>
                        </a>
                    </div>
                </div>
            </div>
        </div>
        
        <!-- Footer bottom bar -->
        <div class="border-t border-slate-200/50 dark:border-slate-700/50">
            <div class="container mx-auto px-6 py-4 flex flex-col md:flex-row justify-between items-center text-sm">
                <div class="flex space-x-4">
                    <a href="#" class="hover:text-teal-500">Science</a>
                    <span class="text-slate-400">|</span>
                    <a href="#" class="hover:text-teal-500">Philosophy</a>
                    <span class="text-slate-400">|</span>
                    <a href="palestine.html" class="hover:text-teal-500">Palestine</a>
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
customElements.define('special-footer', SpecialFooter);