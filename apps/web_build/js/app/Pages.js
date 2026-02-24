import { ComponentTemplates } from '../components.js';

export function setupPages(App) {
    Object.assign(App.prototype, {
        renderPages() {
            this.dom.pageList.innerHTML = '';
            const pageIds = Object.keys(this.siteData.pages);
            
            pageIds.forEach((id, idx) => {
                const page = this.siteData.pages[id];
                const div = document.createElement('div');
                const isChild = !!page.parentId;
                const isHidden = !!page.hidden;
                
                div.className = `page-item ${id === this.currPage ? 'active' : ''}`;
                div.style.paddingLeft = isChild ? '24px' : '10px';
                div.style.borderLeft = isChild ? '2px solid var(--ui-border)' : '1px solid var(--ui-border)';
                
                div.setAttribute('draggable', 'true');
                div.addEventListener('dragstart', (e) => { e.dataTransfer.setData('text/plain', id); div.style.opacity = '0.4'; });
                div.addEventListener('dragend', () => { div.style.opacity = '1'; document.querySelectorAll('.page-item').forEach(el => el.style.boxShadow = ''); });
                div.addEventListener('dragover', (e) => {
                    e.preventDefault();
                    const rect = div.getBoundingClientRect();
                    div.style.boxShadow = (e.clientY - rect.top > rect.height / 2) ? '0 2px 0 var(--ui-accent)' : '0 -2px 0 var(--ui-accent)';
                });
                div.addEventListener('dragleave', () => div.style.boxShadow = '');
                div.addEventListener('drop', (e) => {
                    e.preventDefault();
                    div.style.boxShadow = '';
                    const draggedId = e.dataTransfer.getData('text/plain');
                    if (!draggedId || draggedId === id || draggedId.includes(':')) return;
                    const rect = div.getBoundingClientRect();
                    this.reorderPages(draggedId, id, (e.clientY - rect.top) > (rect.height / 2));
                });

                div.innerHTML = `<i class="fas fa-file-code"></i><span style="flex:1; ${isHidden ? 'text-decoration:line-through;opacity:0.5;' : ''}">${page.title}</span>`;
                div.onclick = () => { this.savePage(); this.loadPage(id); };

                const controls = document.createElement('div');
                controls.style.display = 'flex';
                controls.style.gap = '8px';
                controls.style.alignItems = 'center';

                if (id !== 'index') {
                    controls.innerHTML = `
                        <i class="fas ${isHidden ? 'fa-eye-slash' : 'fa-eye'}" title="Toggle Visibility" style="opacity:0.5;cursor:pointer;font-size:0.8em;" onclick="event.stopPropagation(); app.togglePageVisibility('${id}')"></i>
                        <i class="fas ${isChild ? 'fa-outdent' : 'fa-indent'}" title="${isChild ? 'Unnest' : 'Make Subpage'}" style="opacity:0.5;cursor:pointer;font-size:0.8em;" onclick="event.stopPropagation(); ${isChild ? `app.outdentPage('${id}')` : `app.indentPage('${id}')`}"></i>
                    `;
                    
                    const del = document.createElement('i');
                    del.className = 'fas fa-times';
                    del.style.cssText = 'opacity:0.4;transition:0.2s;cursor:pointer;margin-left:4px;';
                    del.onmouseover = () => del.style.opacity = '1';
                    del.onmouseout  = () => del.style.opacity = '0.4';
                    del.onclick = (e) => { e.stopPropagation(); this.delPage(id); };
                    controls.appendChild(del);
                }
                
                div.appendChild(controls);
                this.dom.pageList.appendChild(div);
            });
            
            this.renderNav();
        },

        reorderPages(draggedId, targetId, isAfter) {
            const pageIds = Object.keys(this.siteData.pages);
            const draggedIndex = pageIds.indexOf(draggedId);
            if (draggedIndex === -1) return;
            pageIds.splice(draggedIndex, 1);
            
            let targetIndex = pageIds.indexOf(targetId);
            if (isAfter) targetIndex++;
            
            pageIds.splice(targetIndex, 0, draggedId);
            
            const reorderedPages = {};
            for (const id of pageIds) {
                reorderedPages[id] = this.siteData.pages[id];
            }
            
            this.siteData.pages = reorderedPages;
            this.siteData.pages[draggedId].parentId = null;
            
            this.renderPages();
            this.saveHistory();
        },

        togglePageVisibility(id) {
            this.siteData.pages[id].hidden = !this.siteData.pages[id].hidden;
            this.renderPages();
            this.saveHistory();
        },

        indentPage(id) {
            const keys = Object.keys(this.siteData.pages);
            const idx = keys.indexOf(id);
            if (idx > 0) {
                const prevId = keys[idx - 1];
                this.siteData.pages[id].parentId = this.siteData.pages[prevId].parentId || prevId;
                this.renderPages();
                this.saveHistory();
            }
        },

        outdentPage(id) {
            this.siteData.pages[id].parentId = null;
            this.renderPages();
            this.saveHistory();
        },

        renderNav() {
            this.dom.nav = document.getElementById('site-nav');
            if (!this.dom.nav) return;
            this.dom.nav.innerHTML = '';
            
            const pages = this.siteData.pages;
            const pageIds = Object.keys(pages);
            
            const childrenMap = {};
            pageIds.forEach(id => {
                const pid = pages[id].parentId;
                if (pid && pages[pid]) {
                    if (!childrenMap[pid]) childrenMap[pid] = [];
                    childrenMap[pid].push(id);
                }
            });

            pageIds.forEach(id => {
                const page = pages[id];
                if (page.hidden || (page.parentId && pages[page.parentId])) return;

                const createLink = (pageId) => {
                    const a = document.createElement('a');
                    a.href = '#';
                    a.setAttribute('data-page-id', pageId);
                    a.textContent = pages[pageId].title;
                    if (pageId === this.currPage) a.classList.add('active-link');
                    a.setAttribute('onclick', `event.preventDefault(); event.stopPropagation(); app.savePage(); app.loadPage('${pageId}');`);
                    return a;
                };

                const children = childrenMap[id] || [];
                const visibleChildren = children.filter(cid => !pages[cid].hidden);

                if (visibleChildren.length > 0) {
                    const wrapper = document.createElement('div');
                    wrapper.className = 'nav-dropdown-wrapper';
                    
                    const parentLink = createLink(id);
                    parentLink.innerHTML += ' <i class="fas fa-caret-down" style="font-size:0.8em;opacity:0.7"></i>';
                    
                    const dropdown = document.createElement('div');
                    dropdown.className = 'nav-dropdown';
                    
                    visibleChildren.forEach(cid => dropdown.appendChild(createLink(cid)));
                    
                    wrapper.appendChild(parentLink);
                    wrapper.appendChild(dropdown);
                    this.dom.nav.appendChild(wrapper);
                } else {
                    this.dom.nav.appendChild(createLink(id));
                }
            });

            if (!document.getElementById('nav-dropdown-css')) {
                const style = document.createElement('style');
                style.id = 'nav-dropdown-css';
                style.innerHTML = `
                    .site-header { z-index: 100; }
                    .nav-dropdown-wrapper { position: relative; display: inline-block; padding-bottom: 15px; margin-bottom: -15px; }
                    .nav-dropdown { display: none; position: absolute; top: 100%; left: 0; background: var(--site-bg); border: 1px solid rgba(128,128,128,0.2); border-radius: 6px; padding: 8px 0; min-width: 160px; z-index: 100; box-shadow: 0 8px 24px rgba(0,0,0,0.15); flex-direction: column; gap: 0; }
                    .nav-dropdown a { padding: 8px 16px !important; width: 100%; opacity: 0.8; font-size: 0.85rem !important; text-align: left; transition: 0.2s; }
                    .nav-dropdown a:hover { background: rgba(128,128,128,0.1); opacity: 1; color: var(--site-accent); }
                    .nav-dropdown-wrapper:hover .nav-dropdown { display: flex; }
                `;
                document.head.appendChild(style);
            }
        },

        addPage() {
            const title = prompt('New page title:');
            if (!title?.trim()) return;
            const id = title.trim().toLowerCase().replace(/[^a-z0-9]/g, '-');
            if (this.siteData.pages[id]) { this.toast('Page already exists!', 'error'); return; }
            this.savePage();
            
            this.siteData.pages[id] = { 
                title: title.trim(), 
                html: ComponentTemplates.defaultPage.replace('%%TITLE%%', title.trim()),
                hidden: false,
                parentId: null
            };
            
            this.loadPage(id);
            this.saveHistory();
            this.toast(`Page "${title.trim()}" created!`, 'success');
        },

        loadPage(id) {
            if (!this.siteData.pages[id]) id = 'index';
            this.currPage = id;
            this.dom.main.innerHTML = this.siteData.pages[id].html;
            this.deselectAll();
            this.renderPages();
            this.bindElementEvents();
            this.updateLayers();
            document.getElementById('page-title-display').textContent = this.siteData.pages[id].title;
        },

        savePage() {
            if (!this.siteData.pages[this.currPage]) return;
            const tmp = this.dom.main.cloneNode(true);
            tmp.querySelectorAll('.active-el').forEach(e => e.classList.remove('active-el'));
            this.siteData.pages[this.currPage].html = tmp.innerHTML;
        },

        delPage(id) {
            if (id === 'index') { this.toast('Cannot delete home page.', 'warning'); return; }
            if (confirm(`Delete page "${this.siteData.pages[id].title}"?`)) {
                delete this.siteData.pages[id];
                this.loadPage('index');
                this.saveHistory();
                this.toast('Page deleted', 'info');
            }
        }
    });
}