export function setupTheme(App) {
    Object.assign(App.prototype, {
        updateSiteTheme() {
            this.siteData.theme.light.bg  = document.getElementById('light-bg').value;
            this.siteData.theme.light.txt = document.getElementById('light-txt').value;
            this.siteData.theme.dark.bg   = document.getElementById('dark-bg').value;
            this.siteData.theme.dark.txt  = document.getElementById('dark-txt').value;
            this.siteData.theme.accent    = document.getElementById('site-accent').value;
            this.siteData.customCSS       = this.dom.customCSS.value;
            document.getElementById('accent-hex').textContent = this.siteData.theme.accent;
            const mode = this.dom.canvas.getAttribute('data-site-theme') || 'light';
            this.dom.canvas.style.setProperty('--site-bg',     this.siteData.theme[mode].bg);
            this.dom.canvas.style.setProperty('--site-text',   this.siteData.theme[mode].txt);
            this.dom.canvas.style.setProperty('--site-accent', this.siteData.theme.accent);
            let s = document.getElementById('live-custom-css');
            if (!s) { s = document.createElement('style'); s.id = 'live-custom-css'; document.head.appendChild(s); }
            s.innerHTML = this.siteData.customCSS;
            this.renderNav();
        },

        toggleCanvasTheme() {
            const cur = this.dom.canvas.getAttribute('data-site-theme');
            this.dom.canvas.setAttribute('data-site-theme', cur === 'light' ? 'dark' : 'light');
            this.updateSiteTheme();
            this.toast(`Preview: ${cur === 'light' ? 'dark' : 'light'} mode`, 'info', 1600);
        },

        uploadFavicon() {
            const input = document.createElement('input');
            input.type = 'file';
            input.accept = 'image/*,.ico';
            input.onchange = (e) => {
                const file = e.target.files[0];
                if (!file) return;
                const reader = new FileReader();
                reader.onload = ev => { this.siteData.favicon = ev.target.result; this.toast('Favicon updated!', 'success'); };
                reader.readAsDataURL(file);
            };
            input.click();
        }
    });
}