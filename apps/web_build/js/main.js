import { App } from './app/Core.js';
import { setupHistory } from './app/History.js';
import { setupTheme } from './app/Theme.js';
import { setupPages } from './app/Pages.js';
import { setupLayout } from './app/Layout.js';
import { setupElements } from './app/Elements.js';
import { setupProperties } from './app/Properties.js';
import { setupAssets } from './app/Assets.js';
import { setupExportPreview } from './app/ExportPreview.js';

// Apply mixins to the App class to modularize functionality safely
setupHistory(App);
setupTheme(App);
setupPages(App);
setupLayout(App);
setupElements(App);
setupProperties(App);
setupAssets(App);
setupExportPreview(App);

// Expose UI helper globally
window.toggleCollapse = function(el) {
    el.classList.toggle('collapsed');
    el.nextElementSibling.classList.toggle('collapsed');
};

// Instantiate and start App, binding it to the window for inline event handlers
window.app = new App();