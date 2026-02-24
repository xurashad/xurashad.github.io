import { ComponentTemplates } from '../components.js';

export function setupElements(App) {
    Object.assign(App.prototype, {
        addEl(type) {
            const targetCol = this.getTargetColumn();
            if (!targetCol) {
                this.toast('Add a section/column first, then select it', 'warning');
                return;
            }
            let el;
            switch(type) {
                case 'btn':
                    el = document.createElement('a');
                    el.href = '#'; el.className = 'b-el btn';
                    el.textContent = 'Click Here'; el.setAttribute('data-label','Button');
                    break;
                case 'img':
                    el = document.createElement('img');
                    el.className = 'b-el';
                    el.src = 'https://images.unsplash.com/photo-1618005182384-a83a8bd57fbe?q=80&w=800&auto=format&fit=crop';
                    el.alt = 'Image'; el.style.width = '100%'; el.style.borderRadius = '8px';
                    el.setAttribute('data-label','Image');
                    break;
                case 'video':
                    el = document.createElement('div');
                    el.className = 'b-el video-wrapper';
                    el.setAttribute('data-label','Video');
                    el.setAttribute('data-video-url','https://www.youtube.com/embed/dQw4w9WgXcQ');
                    el.innerHTML = '<iframe src="https://www.youtube.com/embed/dQw4w9WgXcQ" allowfullscreen allow="accelerometer; autoplay; encrypted-media; gyroscope; picture-in-picture"></iframe>';
                    break;
                case 'icon':
                    el = document.createElement('i');
                    el.className = 'b-el icon fas fa-star'; el.setAttribute('data-label','Icon');
                    break;
                case 'divider':
                    el = document.createElement('hr');
                    el.className = 'b-el divider'; el.setAttribute('data-label','Divider');
                    break;
                case 'blockquote':
                    el = document.createElement('blockquote');
                    el.className = 'b-el'; el.textContent = 'An inspiring quote that resonates with your audience.';
                    el.setAttribute('data-label','Quote'); el.setAttribute('contenteditable','true');
                    break;
                case 'map':
                    el = document.createElement('div');
                    el.className = 'b-el map'; el.setAttribute('data-label','Map');
                    el.innerHTML = '<iframe src="https://www.google.com/maps/embed?pb=!1m18!1m12!1m3!1d387193.3059445135!2d-74.25986548248684!3d40.69714941932609!2m3!1f0!2f0!3f0!3m2!1i1024!2i768!4f13.1!3m3!1m2!1s0x89c24fa5d33f083b%3A0xc80b8f06e177fe62!2sNew%20York%2C%20NY%2C%20USA!5e0!3m2!1sen!2s!4v1644262073400!5m2!1sen!2s" allowfullscreen loading="lazy"></iframe>';
                    break;
                case 'form':
                    el = document.createElement('div');
                    el.className = 'b-el form-group'; el.setAttribute('data-label','Form');
                    el.innerHTML = `
                        <div class="form-field"><label class="form-label" contenteditable="true">Full Name</label><input class="form-input" placeholder="Your name" type="text"></div>
                        <div class="form-field"><label class="form-label" contenteditable="true">Email Address</label><input class="form-input" placeholder="your@email.com" type="email"></div>
                        <div class="form-field"><label class="form-label" contenteditable="true">Message</label><textarea class="form-input" placeholder="Write your message..." rows="4"></textarea></div>
                        <button class="form-btn" contenteditable="true">Send Message →</button>`;
                    break;
                case 'list':
                    el = document.createElement('ul');
                    el.className = 'b-el'; el.innerHTML = '<li>First item</li><li>Second item</li><li>Third item</li>';
                    el.setAttribute('data-label','List'); el.setAttribute('contenteditable','true');
                    break;
                case 'h3':
                    el = document.createElement('h3');
                    el.className = 'b-el'; el.textContent = 'Sub-heading';
                    el.setAttribute('data-label','H3'); el.setAttribute('contenteditable','true');
                    break;
                default:
                    el = document.createElement(type);
                    el.className = 'b-el'; el.setAttribute('contenteditable','true');
                    el.textContent = type === 'p' ? 'Write your text here. Click to start editing.' : (type === 'h2' ? 'Section Heading' : 'Page Heading');
                    el.setAttribute('data-label', type.toUpperCase());
            }
            targetCol.appendChild(el);
            this.bindElementEvents();
            this.selectEl(el);
            this.savePage();
            this.saveHistory();
            this.toast(`${el.getAttribute('data-label')} added`, 'success', 1200);
        },

        insertElement(el) {
            const target = this.getTargetColumn() || this.dom.main;
            target.appendChild(el);
            this.bindElementEvents();
            this.selectEl(el);
            this.savePage();
            this.saveHistory();
        },

        duplicateEl() {
            if (!this.selEl) { this.toast('Select an element first', 'warning'); return; }
            if (this.selEl.id === 'global-header' || this.selEl.id === 'global-footer') return;
            const clone = this.selEl.cloneNode(true);
            clone.classList.remove('active-el');
            clone.id = '';
            this.selEl.parentNode.insertBefore(clone, this.selEl.nextSibling);
            this.bindElementEvents();
            this.selectEl(clone);
            this.savePage();
            this.saveHistory();
            this.toast('Duplicated!', 'success', 1200);
        },

        deleteEl() {
            if (!this.selEl) return;
            if (this.selEl.id === 'global-header' || this.selEl.id === 'global-footer') {
                this.toast('Cannot delete header or footer', 'warning'); return;
            }
            if (this.selEl.classList.contains('b-col')) {
                const row = this.selEl.closest('.b-row');
                this.selEl.remove();
                if (row) this.updateRowColClass(row);
            } else {
                this.selEl.remove();
            }
            this.deselectAll();
            this.savePage();
            this.saveHistory();
        },

        moveEl(direction) {
            if (!this.selEl) return;
            if (this.selEl.id === 'global-header' || this.selEl.id === 'global-footer') return;
            const parent = this.selEl.parentNode;
            if (direction === 'up' && this.selEl.previousElementSibling) {
                parent.insertBefore(this.selEl, this.selEl.previousElementSibling);
            } else if (direction === 'down' && this.selEl.nextElementSibling) {
                parent.insertBefore(this.selEl.nextElementSibling, this.selEl);
            }
            this.showToolbar(this.selEl);
            this.savePage();
            this.saveHistory();
        },

        bindElementEvents() {
            const targets = this.dom.canvas.querySelectorAll('.b-section, .b-row, .b-col, .b-el, #global-header, #global-footer');
            targets.forEach(el => {
                const clone = el.cloneNode(true);
                el.parentNode.replaceChild(clone, el);
            });

            this.dom.canvas.querySelectorAll('.b-section, .b-row, .b-col, .b-el, #global-header, #global-footer').forEach(el => {
                el.addEventListener('click', (e) => {
                    e.stopPropagation();
                    this.selectEl(el);
                    if (el.tagName === 'A') e.preventDefault();
                });
                if (el.getAttribute('contenteditable') === 'true') {
                    el.addEventListener('mouseup', () => this.checkSelection());
                    el.addEventListener('keyup', () => this.checkSelection());
                    el.addEventListener('blur', () => { this.savePage(); this.saveHistory(); });
                }
            });
            this.updateLayers();
        },

        selectEl(el) {
            if (!el) return;
            document.querySelectorAll('.active-el').forEach(e => e.classList.remove('active-el'));
            this.selEl = el;
            el.classList.add('active-el');
            this.dom.propsPanel.style.display = 'flex';
            this.dom.propsEmpty.style.display = 'none';
            this.dom.badge.style.display = 'flex';
            this.syncPropsUI();
            this.updateLayers();
            this.showToolbar(el);

            const label = el.getAttribute('data-label') || el.tagName;
            this.dom.statusEl.textContent = `Selected: ${label}`;
            document.getElementById('badge-label-text').textContent = label;
            document.getElementById('badge-tag-text').textContent = el.tagName.toLowerCase() + (el.className ? ' · ' + el.className.split(' ').filter(c => !['active-el','b-el','b-row','b-col','b-section'].includes(c)).slice(0,2).join(' ') : '');
        },

        deselectAll(e) {
            if (e && e.target !== this.dom.canvasWrap && e.target !== this.dom.canvas && !e.target.classList.contains('canvas-wrap')) return;
            document.querySelectorAll('.active-el').forEach(el => el.classList.remove('active-el'));
            this.selEl = null;
            this.dom.propsPanel.style.display = 'none';
            this.dom.propsEmpty.style.display = 'block';
            this.dom.badge.style.display = 'none';
            this.dom.rte.style.display = 'none';
            this.dom.hoverBar.style.display = 'none';
            this.dom.rowBar.style.display = 'none';
            this.dom.statusEl.textContent = 'No selection';
            this.updateLayers();
        },

        showToolbar(el) {
            const rect = el.getBoundingClientRect();
            const isStructural = el.classList.contains('b-row') || el.classList.contains('b-col') || el.classList.contains('b-section') || el.id === 'global-header' || el.id === 'global-footer';

            if (isStructural) {
                this.dom.hoverBar.style.display = 'none';
                this.dom.rowBar.style.display = 'flex';
                const top = Math.max(10, rect.top - 46);
                const left = Math.min(window.innerWidth - 420, Math.max(10, rect.left));
                this.dom.rowBar.style.top = top + 'px';
                this.dom.rowBar.style.left = left + 'px';
                const section = this.getParentSection();
                document.getElementById('btn-fullbleed').classList.toggle('active-btn', section?.classList.contains('full-bleed'));
            } else {
                this.dom.rowBar.style.display = 'none';
                this.dom.hoverBar.style.display = 'flex';
                const top = Math.max(10, rect.top - 46);
                const left = Math.min(window.innerWidth - 200, Math.max(10, rect.left));
                this.dom.hoverBar.style.top = top + 'px';
                this.dom.hoverBar.style.left = left + 'px';
            }
        },

        checkSelection() {
            const sel = window.getSelection();
            if (sel && sel.toString().length > 0 && sel.rangeCount > 0) {
                const rect = sel.getRangeAt(0).getBoundingClientRect();
                this.dom.rte.style.display = 'flex';
                this.dom.rte.style.top  = Math.max(10, rect.top - 48) + 'px';
                this.dom.rte.style.left = Math.min(window.innerWidth - 340, Math.max(10, rect.left)) + 'px';
            } else {
                this.dom.rte.style.display = 'none';
            }
        },

        formatText(cmd) {
            document.execCommand(cmd, false, null);
            this.dom.rte.style.display = 'none';
            this.savePage();
        },

        linkText() {
            const url = prompt('Enter link URL:');
            if (url) {
                document.execCommand('createLink', false, url);
                this.dom.rte.style.display = 'none';
                this.savePage();
                this.toast('Link inserted', 'success', 1200);
            }
        },

        dragComponent(e, type) { e.dataTransfer.setData('text/plain', `component:${type}`); },
        handleDragOver(e) { e.preventDefault(); this.dom.canvasWrap.classList.add('drag-over'); },
        handleDragLeave(e) { if (!this.dom.canvasWrap.contains(e.relatedTarget)) this.dom.canvasWrap.classList.remove('drag-over'); },
        
        handleDrop(e) {
            e.preventDefault();
            this.dom.canvasWrap.classList.remove('drag-over');
            const data = e.dataTransfer.getData('text/plain');
            if (!data) return;
            if (data.startsWith('asset:')) this.insertAsset(data.split(':')[1]);
            else if (data.startsWith('component:')) this.insertComponent(data.split(':')[1]);
        },

        insertComponent(type) {
            let html = ComponentTemplates[type];
            if (html) {
                const tmp = document.createElement('div');
                tmp.innerHTML = html;
                Array.from(tmp.children).forEach(node => this.dom.main.appendChild(node));
                this.bindElementEvents();
                this.savePage();
                this.saveHistory();
                this.updateLayers();
                this.toast(`${type.charAt(0).toUpperCase()+type.slice(1)} added!`, 'success');
            }
        }
    });
}