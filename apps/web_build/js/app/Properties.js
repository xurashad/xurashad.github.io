export function setupProperties(App) {
    Object.assign(App.prototype, {
        syncPropsUI() {
            if (!this.selEl) return;
            const isSection = this.selEl.classList.contains('b-section') || this.selEl.classList.contains('b-row') || this.selEl.classList.contains('b-col');
            document.getElementById('section-controls').style.display = isSection ? 'block' : 'none';

            if (isSection) {
                const section = this.getParentSection();
                if (section) {
                    document.getElementById('toggle-fullbleed').checked = section.classList.contains('full-bleed');
                    const inner = section.querySelector('.b-section-inner');
                    if (inner) {
                        const s = inner.style;
                        const setv = (id, v) => { const el = document.getElementById(id); if(el) el.value = v || ''; };
                        setv('sec-pt', s.paddingTop);
                        setv('sec-pb', s.paddingBottom);
                        setv('sec-pl', s.paddingLeft);
                        setv('sec-pr', s.paddingRight);
                    }
                    const row = this.getParentRow();
                    if (row) document.getElementById('sec-gap').value = row.style.gap || '';
                }
            }

            const dyn = this.dom.dynContent;
            dyn.style.display = 'none';
            dyn.innerHTML = '';

            if (this.selEl.tagName === 'IMG') {
                dyn.style.display = 'block';
                dyn.innerHTML = `
                    <label>Image Source URL</label>
                    <input type="text" value="${this.selEl.getAttribute('src')||''}" onchange="app.setAttr('src',this.value)" placeholder="https://...">
                    <label style="margin-top:8px;">Alt Text</label>
                    <input type="text" value="${this.selEl.getAttribute('alt')||''}" onchange="app.setAttr('alt',this.value)" placeholder="Describe the image...">
                    <div class="grid-2" style="margin-top:8px;">
                        <button class="btn-sm" onclick="app.triggerImgUpload()"><i class="fas fa-upload"></i> Upload</button>
                        <button class="btn-sm" onclick="app.setStyle('objectFit','cover');app.setStyle('height','220px')"><i class="fas fa-crop"></i> Cover Fit</button>
                    </div>`;
            } else if (this.selEl.tagName === 'A') {
                let pageOpts = '';
                for (let pid in this.siteData.pages) {
                    const p = this.getPageExportPath(pid);
                    pageOpts += `<option value="${p}">${this.siteData.pages[pid].title} (${p})</option>`;
                }
                
                dyn.style.display = 'block';
                dyn.innerHTML = `
                    <label>Button / Link URL</label>
                    <input type="text" id="btn-link-input" value="${this.selEl.getAttribute('href')||'#'}" onchange="app.setAttr('href',this.value)">
                    <select onchange="if(this.value){ document.getElementById('btn-link-input').value=this.value; app.setAttr('href',this.value); this.value=''; }" style="margin-top:5px;">
                        <option value="">-- Link to internal page --</option>
                        ${pageOpts}
                    </select>
                    <div class="grid-2" style="margin-top:8px;">
                        <div><label style="margin-top:0">Open In</label><select onchange="app.setAttr('target',this.value)"><option value="">Same tab</option><option value="_blank">New tab</option></select></div>
                        <div><label style="margin-top:0">Button Style</label><select onchange="app.applyBtnPreset(this.value)"><option value="">Filled</option><option value="outline">Outline</option><option value="ghost">Ghost</option></select></div>
                    </div>`;
            } else if (this.selEl.classList.contains('video-wrapper')) {
                dyn.style.display = 'block';
                const currentUrl = this.selEl.getAttribute('data-video-url') || '';
                dyn.innerHTML = `
                    <label>Video / YouTube URL</label>
                    <div style="display:flex; gap:5px; margin-top:4px;">
                        <input type="text" id="video-url-input" value="${currentUrl}" placeholder="Paste URL & press Enter..." onchange="app.updateVideoUrl(this.value)" style="flex:1;">
                        <button class="btn-primary btn-sm" onclick="app.updateVideoUrl(document.getElementById('video-url-input').value)" title="Update"><i class="fas fa-check"></i></button>
                    </div>
                    <div class="info-box" style="margin-top:8px;">Supports YouTube, Vimeo, and direct video files (.mp4).</div>
                    <div class="grid-2" style="margin-top:6px;">
                        <button class="btn-sm" onclick="app.uploadLocalVideo()"><i class="fas fa-upload"></i> Local Video</button>
                        <button class="btn-sm" onclick="app.toggleVideoAttr('autoplay')"><i class="fas fa-play"></i> Autoplay</button>
                    </div>`;
            } else if (this.selEl.classList.contains('icon')) {
                dyn.style.display = 'block';
                const currIcon = Array.from(this.selEl.classList).find(c => c.startsWith('fa-') && c.length > 3) || 'fa-star';
                dyn.innerHTML = `
                    <label>FontAwesome Icon</label>
                    <input type="text" value="${currIcon.replace('fa-','')}" oninput="app.updateIconClass(this.value)" placeholder="star, heart, bolt...">
                    <label style="margin-top:8px;">Icon Size</label>
                    <select onchange="app.setStyle('fontSize',this.value)">
                        <option value="1.5rem">Small</option><option value="2.5rem" selected>Medium</option><option value="4rem">Large</option><option value="6rem">X-Large</option>
                    </select>`;
            } else if (this.selEl.classList.contains('map')) {
                dyn.style.display = 'block';
                dyn.innerHTML = `
                    <label>Location (City, Address)</label>
                    <input type="text" id="map-addr" placeholder="New York, NY, USA" style="margin-bottom:5px;">
                    <button class="btn-sm btn-primary" style="width:100%;" onclick="app.updateMapByAddress(document.getElementById('map-addr').value)"><i class="fas fa-search-location"></i> Search Location</button>
                    <hr>
                    <label>Or paste Google Maps Embed URL</label>
                    <input type="text" id="map-url-input" placeholder="https://google.com/maps/embed?..." value="${this.selEl.querySelector('iframe')?.src||''}">
                    <button class="btn-sm" style="width:100%;margin-top:5px;" onclick="app.updateMapSrc(document.getElementById('map-url-input').value)"><i class="fas fa-map"></i> Apply URL</button>
                    <label style="margin-top:9px;">Map Height</label>
                    <select onchange="app.selEl.querySelector('iframe').style.height=this.value">
                        <option value="220px">Small (220px)</option><option value="320px" selected>Medium (320px)</option><option value="450px">Large (450px)</option><option value="550px">X-Large (550px)</option>
                    </select>`;
            } else if (this.selEl.classList.contains('form-group')) {
                dyn.style.display = 'block';
                dyn.innerHTML = `
                    <label>Add Form Field</label>
                    <div class="grid-2" style="margin-bottom:8px;">
                        <button class="btn-sm" onclick="app.addFormField('text')"><i class="fas fa-font"></i> Text</button>
                        <button class="btn-sm" onclick="app.addFormField('email')"><i class="fas fa-at"></i> Email</button>
                        <button class="btn-sm" onclick="app.addFormField('tel')"><i class="fas fa-phone"></i> Phone</button>
                        <button class="btn-sm" onclick="app.addFormField('textarea')"><i class="fas fa-align-left"></i> Textarea</button>
                        <button class="btn-sm" onclick="app.addFormField('select')"><i class="fas fa-list"></i> Dropdown</button>
                        <button class="btn-sm" onclick="app.addFormField('checkbox')"><i class="fas fa-check-square"></i> Checkbox</button>
                    </div>
                    <label>Button Text</label>
                    <input type="text" placeholder="Send Message" onchange="app.updateFormButton(this.value)">
                    <label style="margin-top:8px;">Action URL (form post)</label>
                    <input type="text" placeholder="https://your-endpoint.com/submit" onchange="app.setAttr('data-action',this.value)">
                    <label style="margin-top:8px;">Form Width</label>
                    <select onchange="app.setStyle('maxWidth',this.value)">
                        <option value="100%">Full Width</option>
                        <option value="520px" selected>Medium (520px)</option>
                        <option value="400px">Narrow (400px)</option>
                        <option value="700px">Wide (700px)</option>
                    </select>`;
            }

            const s = window.getComputedStyle(this.selEl);
            const rgb2hex = (rgb) => {
                if (!rgb || rgb === 'rgba(0, 0, 0, 0)' || rgb === 'transparent') return '#000000';
                const m = rgb.match(/\d+/g);
                return m ? '#' + m.slice(0,3).map(x => parseInt(x).toString(16).padStart(2,'0')).join('') : '#000000';
            };
            const setVal = (id, val) => { const el = document.getElementById(id); if(el) el.value = val; };

            setVal('p-pt', parseInt(this.selEl.style.paddingTop) || 0);
            setVal('p-pr', parseInt(this.selEl.style.paddingRight) || 0);
            setVal('p-pb', parseInt(this.selEl.style.paddingBottom) || 0);
            setVal('p-pl', parseInt(this.selEl.style.paddingLeft) || 0);
            setVal('p-mt', parseInt(this.selEl.style.marginTop) || 0);
            setVal('p-mr', parseInt(this.selEl.style.marginRight) || 0);
            setVal('p-mb', parseInt(this.selEl.style.marginBottom) || 0);
            setVal('p-ml', parseInt(this.selEl.style.marginLeft) || 0);
            setVal('p-width', this.selEl.style.width || '');
            setVal('p-height', this.selEl.style.height || '');
            setVal('p-maxw', this.selEl.style.maxWidth || '');
            setVal('p-minh', this.selEl.style.minHeight || '');
            setVal('p-fs', this.selEl.style.fontSize || s.fontSize);
            setVal('p-fw', this.selEl.style.fontWeight || s.fontWeight);
            setVal('p-lh', this.selEl.style.lineHeight || '');
            setVal('p-ls', this.selEl.style.letterSpacing || '');
            setVal('p-color', rgb2hex(this.selEl.style.color || s.color));
            setVal('p-bgc', rgb2hex(this.selEl.style.backgroundColor));
            const radVal = parseInt(this.selEl.style.borderRadius) || 0;
            setVal('p-rad', radVal);
            document.getElementById('rad-val').textContent = radVal + 'px';
            setVal('p-bw', parseInt(this.selEl.style.borderWidth) || 0);
            setVal('p-id', this.selEl.id || '');

            const builtinCls = ['b-el','b-row','b-col','b-section','full-bleed','col-1','col-2','col-3','col-4','active-el','icon','btn','divider','spacer','map','form-group','site-header','site-footer','video-wrapper','b-section-inner'];
            const customCls = Array.from(this.selEl.classList).filter(c => !builtinCls.includes(c) && !c.startsWith('fa')).join(' ');
            setVal('p-class', customCls);
        },

        setStyle(prop, val) {
            if (!this.selEl) return;
            this.selEl.style[prop] = val;
            this.savePage();
        },

        setAttr(attr, val) {
            if (!this.selEl) return;
            if (val === '') this.selEl.removeAttribute(attr);
            else this.selEl.setAttribute(attr, val);
            this.savePage();
        },

        setCustomClass(val) {
            if (!this.selEl) return;
            const keep = Array.from(this.selEl.classList).filter(c =>
                ['b-el','b-row','b-col','b-section','full-bleed','col-1','col-2','col-3','col-4','active-el','icon','btn','divider','spacer','map','form-group','site-header','site-footer','video-wrapper','b-section-inner'].includes(c) || c.startsWith('fa')
            );
            this.selEl.className = [...keep, ...val.split(' ').filter(Boolean)].join(' ');
            this.savePage();
        },

        applyBtnPreset(preset) {
            if (!this.selEl) return;
            if (preset === 'outline') {
                this.selEl.style.background = 'transparent';
                this.selEl.style.border = '2px solid var(--site-accent, #5b6af0)';
                this.selEl.style.color = 'var(--site-accent, #5b6af0)';
            } else if (preset === 'ghost') {
                this.selEl.style.background = 'transparent';
                this.selEl.style.border = 'none';
                this.selEl.style.color = 'var(--site-accent, #5b6af0)';
                this.selEl.style.textDecoration = 'underline';
            } else {
                this.selEl.style.background = 'var(--site-accent, #5b6af0)';
                this.selEl.style.border = 'none';
                this.selEl.style.color = '#fff';
            }
            this.savePage();
        },

        convertVideoUrl(url) {
            if (!url) return url;
            let m = url.match(/(?:youtube\.com\/watch\?.*v=|youtu\.be\/)([a-zA-Z0-9_-]{11})/);
            if (m) return `https://www.youtube.com/embed/${m[1]}?rel=0`;
            m = url.match(/youtube\.com\/shorts\/([a-zA-Z0-9_-]{11})/);
            if (m) return `https://www.youtube.com/embed/${m[1]}?rel=0`;
            m = url.match(/vimeo\.com\/(?:video\/)?(\d+)/);
            if (m) return `https://player.vimeo.com/video/${m[1]}`;
            return url;
        },

        isEmbedUrl(url) {
            return url && (url.includes('/embed/') || url.includes('player.vimeo.com') || url.includes('maps.google.com') || url.includes('google.com/maps'));
        },

        updateVideoUrl(url) {
            if (!this.selEl || !this.selEl.classList.contains('video-wrapper')) return;
            if (!url) return;
            if (!url.startsWith('http') && !url.startsWith('/')) url = 'https://' + url;
            const embedUrl = this.convertVideoUrl(url);
            this.selEl.setAttribute('data-video-url', url);

            const isLocalOrDirect = url.match(/\.(mp4|webm|ogg|mov)$/i);
            if (isLocalOrDirect && !this.isEmbedUrl(embedUrl)) {
                this.selEl.innerHTML = `<video src="${embedUrl}" controls style="position:absolute;top:0;left:0;width:100%;height:100%;"></video>`;
            } else {
                this.selEl.innerHTML = `<iframe src="${embedUrl}" allowfullscreen allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture" style="position:absolute;top:0;left:0;width:100%;height:100%;border:0;"></iframe>`;
            }
            this.savePage();
            this.toast('Video updated!', 'success');
        },

        uploadLocalVideo() {
            const input = document.createElement('input');
            input.type = 'file';
            input.accept = 'video/*';
            input.onchange = (e) => {
                const file = e.target.files[0];
                if (!file || !this.selEl) return;
                const reader = new FileReader();
                reader.onload = (ev) => {
                    const id = 'asset_' + Date.now();
                    this.siteData.assets[id] = { name: file.name.replace(/[^a-zA-Z0-9.]/g,'_'), url: ev.target.result, type: file.type, base64: ev.target.result.split(',')[1] };
                    this.selEl.setAttribute('data-video-url', ev.target.result);
                    this.selEl.innerHTML = `<video src="${ev.target.result}" controls style="position:absolute;top:0;left:0;width:100%;height:100%;"></video>`;
                    this.renderAssets();
                    this.savePage();
                    this.saveHistory();
                    this.toast('Local video loaded!', 'success');
                };
                reader.readAsDataURL(file);
            };
            input.click();
        },

        toggleVideoAttr(attr) {
            if (!this.selEl) return;
            const video = this.selEl.querySelector('video');
            if (video) {
                if (video.hasAttribute(attr)) video.removeAttribute(attr);
                else video.setAttribute(attr, '');
                this.savePage();
            }
        },

        updateIconClass(iconName) {
            if (!this.selEl) return;
            Array.from(this.selEl.classList).filter(c => c.startsWith('fa-')).forEach(c => this.selEl.classList.remove(c));
            const cls = iconName.startsWith('fa-') ? iconName : 'fa-' + iconName;
            this.selEl.classList.add(cls);
            this.savePage();
        },

        updateMapByAddress(address) {
            if (!address?.trim()) return;
            const iframe = this.selEl?.querySelector('iframe');
            if (!iframe) return;
            const encoded = encodeURIComponent(address);
            iframe.src = `https://maps.google.com/maps?q=${encoded}&output=embed&z=14`;
            this.savePage();
            this.toast('Map location updated!', 'success');
        },

        updateMapSrc(url) {
            if (!this.selEl || !url) return;
            const iframe = this.selEl.querySelector('iframe');
            if (iframe) iframe.src = url;
            this.savePage();
        },

        addFormField(type) {
            if (!this.selEl?.classList.contains('form-group')) return;
            const btn = this.selEl.querySelector('.form-btn');
            let fieldHtml = '';
            if (type === 'textarea') {
                fieldHtml = `<div class="form-field"><label class="form-label" contenteditable="true">Your Message</label><textarea class="form-input" placeholder="Write here..." rows="4"></textarea></div>`;
            } else if (type === 'checkbox') {
                fieldHtml = `<div class="form-field" style="flex-direction:row;align-items:center;gap:8px;"><input type="checkbox" style="width:auto;flex-shrink:0;"><label class="form-label" contenteditable="true" style="margin:0;">I agree to the terms</label></div>`;
            } else if (type === 'select') {
                fieldHtml = `<div class="form-field"><label class="form-label" contenteditable="true">Choose Option</label><select class="form-input"><option>Option 1</option><option>Option 2</option><option>Option 3</option></select></div>`;
            } else {
                const labels = { text: 'Full Name', email: 'Email Address', tel: 'Phone Number' };
                const placeholders = { text: 'Your name', email: 'your@email.com', tel: '+1 (555) 000-0000' };
                fieldHtml = `<div class="form-field"><label class="form-label" contenteditable="true">${labels[type]||'Field'}</label><input class="form-input" type="${type}" placeholder="${placeholders[type]||''}"></div>`;
            }
            const tmp = document.createElement('div');
            tmp.innerHTML = fieldHtml;
            if (btn) this.selEl.insertBefore(tmp.firstElementChild, btn);
            else this.selEl.appendChild(tmp.firstElementChild);
            this.savePage();
            this.toast('Form field added', 'success', 1200);
        },

        updateFormButton(text) {
            if (!this.selEl) return;
            const btn = this.selEl.querySelector('.form-btn');
            if (btn && text) btn.textContent = text;
            this.savePage();
        },

        setGradient(val) {
            if (!this.selEl || !val) return;
            this.selEl.style.backgroundImage = val;
            this.savePage();
        },

        clearBg() {
            if (!this.selEl) return;
            this.selEl.style.backgroundImage = '';
            this.selEl.style.backgroundColor = '';
            this.savePage();
        },

        triggerBgUpload() { this.dom.bgIn.click(); },

        triggerImgUpload() {
            const input = document.createElement('input');
            input.type = 'file';
            input.accept = 'image/*';
            input.onchange = (e) => {
                const file = e.target.files[0];
                if (!file || !this.selEl) return;
                const reader = new FileReader();
                reader.onload = (ev) => {
                    const id = 'asset_' + Date.now();
                    this.siteData.assets[id] = { name: file.name.replace(/[^a-zA-Z0-9.]/g,'_'), url: ev.target.result, type: file.type, base64: ev.target.result.split(',')[1] };
                    this.selEl.src = ev.target.result;
                    this.selEl.setAttribute('data-asset', id);
                    this.renderAssets();
                    this.savePage();
                    this.saveHistory();
                    this.toast('Image uploaded!', 'success');
                };
                reader.readAsDataURL(file);
            };
            input.click();
        },

        setHoverStyle(prop, val) {
            if (!this.selEl) return;
            if (!this.selEl.id) this.selEl.id = 'el-' + Math.random().toString(36).substr(2,8);
            let styles = {};
            try { styles = JSON.parse(this.selEl.getAttribute('data-hover') || '{}'); } catch(e) {}
            styles[prop] = val;
            this.selEl.setAttribute('data-hover', JSON.stringify(styles));
            this.updateHoverStyles();
            this.savePage();
        },

        clearHoverStyles() {
            if (!this.selEl) return;
            this.selEl.removeAttribute('data-hover');
            this.updateHoverStyles();
            this.savePage();
            this.toast('Hover styles cleared', 'info', 1200);
        },

        updateHoverStyles() {
            let tag = document.getElementById('hover-styles');
            if (!tag) { tag = document.createElement('style'); tag.id = 'hover-styles'; document.head.appendChild(tag); }
            let css = '';
            document.querySelectorAll('[data-hover]').forEach(el => {
                if (!el.id) return;
                let hover = {};
                try { hover = JSON.parse(el.getAttribute('data-hover')); } catch(e) {}
                const rules = Object.entries(hover).map(([p,v]) => `${p.replace(/([A-Z])/g,'-$1').toLowerCase()}:${v}!important`).join(';');
                if (rules) css += `#${el.id}:hover{${rules};transition:all 0.2s ease;}\n`;
            });
            tag.innerHTML = css;
        },

        updateBorder() {
            const bw = document.getElementById('p-bw').value;
            const bs = document.getElementById('p-bs').value;
            const bc = document.getElementById('p-bc').value;
            this.setStyle('border', bw > 0 ? `${bw}px ${bs} ${bc}` : 'none');
        },

        setResponsiveVisibility(val) {
            if (!this.selEl) return;
            this.selEl.setAttribute('data-visibility', val);
            this.savePage();
        }
    });
}