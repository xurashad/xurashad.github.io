import { ComponentTemplates } from '../components.js';

export class App {
    constructor() {
        this.siteData = {
            theme: {
                light: { bg: '#ffffff', txt: '#0f172a' },
                dark:  { bg: '#0f172a', txt: '#f8fafc' },
                accent: '#5b6af0'
            },
            pages: {
                'index': {
                    title: 'Home',
                    html: ComponentTemplates.index
                }
            },
            assets: {},
            favicon: null,
            customCSS: ''
        };
        this.currPage = 'index';
        this.selEl = null;
        this.history = [];
        this.historyIndex = -1;

        this.dom = {
            canvas:      document.getElementById('canvas'),
            main:        document.getElementById('page-content'),
            nav:         document.getElementById('site-nav'),
            assetIn:     document.getElementById('asset-upload'),
            bgIn:        document.getElementById('bg-upload'),
            propsPanel:  document.getElementById('props-panel'),
            propsEmpty:  document.getElementById('props-empty'),
            dynContent:  document.getElementById('dynamic-content-panel'),
            rte:         document.getElementById('rte-toolbar'),
            hoverBar:    document.getElementById('hover-toolbar'),
            rowBar:      document.getElementById('row-toolbar'),
            pageList:    document.getElementById('page-list'),
            layersList:  document.getElementById('layers-list'),
            assetGrid:   document.getElementById('asset-grid'),
            assetEmpty:  document.getElementById('asset-empty'),
            customCSS:   document.getElementById('custom-css'),
            canvasWrap:  document.getElementById('canvas-wrap'),
            statusEl:    document.getElementById('status-el'),
            badge:       document.getElementById('selected-badge'),
        };

        this.init();
    }

    init() {
        if (!document.getElementById('builder-pointer-events')) {
            const s = document.createElement('style');
            s.id = 'builder-pointer-events';
            s.innerHTML = `.b-el.video-wrapper iframe, .b-el.video-wrapper video, .b-el.map iframe { pointer-events: none !important; }`;
            document.head.appendChild(s);
        }
        
        this.updateSiteTheme();
        this.renderPages();
        this.loadPage('index');
        this.bindGlobalEvents();
        this.renderAssets();
        this.saveHistory();
    }

    getPageExportPath(id) {
        if (id === 'index') return 'index.html';
        let path = id;
        let curr = this.siteData.pages[id];
        while (curr && curr.parentId) {
            path = curr.parentId + '/' + path;
            curr = this.siteData.pages[curr.parentId];
        }
        return path + '.html';
    }

    getRelativePrefix(id) {
        const path = this.getPageExportPath(id);
        const depth = (path.match(/\//g) || []).length;
        return '../'.repeat(depth);
    }

    toast(msg, type = 'info', duration = 2600) {
        const c = document.getElementById('toast-container');
        const t = document.createElement('div');
        const icons = { success: '✅', error: '❌', warning: '⚠️', info: 'ℹ️' };
        t.className = `toast ${type}`;
        t.innerHTML = `<span>${icons[type]||'ℹ️'}</span><span>${msg}</span>`;
        c.appendChild(t);
        setTimeout(() => { t.style.animation = 'toastOut 0.3s ease forwards'; setTimeout(() => t.remove(), 300); }, duration);
    }

    updateLayers() {
        const buildTree = (parent, depth = 0) => {
            let html = '';
            Array.from(parent.children).forEach(el => {
                const isTarget = el.classList.contains('site-header') || el.classList.contains('site-footer') || el.classList.contains('b-section') || el.classList.contains('b-row') || el.classList.contains('b-col') || el.classList.contains('b-el');
                if (!isTarget) return;
                if (!el.dataset.id) el.dataset.id = 'el_' + Math.random().toString(36).substr(2,8);
                const label = el.getAttribute('data-label') || el.tagName.toLowerCase();
                const active = el === this.selEl ? 'active' : '';
                const indent = depth * 10;
                html += `<div class="layer-item ${active}" style="padding-left:${10+indent}px;" onclick="app.selectLayer('${el.dataset.id}')"><i class="fas fa-${this.getIcon(el)}"></i>${label}</div>`;
                if (el.children.length && !el.classList.contains('b-el')) {
                    html += buildTree(el, depth + 1);
                }
            });
            return html;
        };
        this.dom.layersList.innerHTML = buildTree(this.dom.canvas);
    }

    selectLayer(dataId) {
        const el = document.querySelector(`[data-id="${dataId}"]`);
        if (el) this.selectEl(el);
    }

    getIcon(el) {
        if (el.id === 'global-header') return 'window-maximize';
        if (el.id === 'global-footer') return 'window-minimize';
        if (el.classList.contains('b-section')) return 'layer-group';
        if (el.classList.contains('b-row')) return 'grip-horizontal';
        if (el.classList.contains('b-col')) return 'grip-vertical';
        if (el.tagName === 'H1') return 'heading';
        if (el.tagName === 'H2' || el.tagName === 'H3') return 'h';
        if (el.tagName === 'P') return 'align-left';
        if (el.tagName === 'A') return 'hand-pointer';
        if (el.tagName === 'IMG') return 'image';
        if (el.classList.contains('video-wrapper')) return 'video';
        if (el.classList.contains('icon')) return 'star';
        if (el.tagName === 'HR') return 'minus';
        if (el.classList.contains('map')) return 'map-marker-alt';
        if (el.classList.contains('form-group')) return 'envelope';
        if (el.tagName === 'BLOCKQUOTE') return 'quote-left';
        if (el.classList.contains('spacer')) return 'arrows-alt-v';
        return 'cube';
    }

    switchTab(idx) {
        document.querySelectorAll('.tab').forEach((t,i) => t.classList.toggle('active', i===idx));
        document.querySelectorAll('.tab-content').forEach((t,i) => t.classList.toggle('active', i===idx));
    }

    bindGlobalEvents() {
        this.dom.assetIn.addEventListener('change', e => this.handleAssetUpload(e));
        this.dom.bgIn.addEventListener('change', e => this.handleBgUpload(e));

        ['light-bg','light-txt','dark-bg','dark-txt','site-accent'].forEach(id => {
            document.getElementById(id).addEventListener('input', () => this.updateSiteTheme());
        });

        document.addEventListener('click', (e) => {
            if (!this.dom.rte.contains(e.target) && !e.target.closest('[contenteditable="true"]')) {
                this.dom.rte.style.display = 'none';
            }
        });

        document.addEventListener('keydown', (e) => {
            if (['INPUT','TEXTAREA','SELECT'].includes(e.target.tagName) || e.target.isContentEditable) return;
            if (e.ctrlKey && e.key === 'z') { e.preventDefault(); this.undo(); }
            if (e.ctrlKey && (e.key === 'y' || (e.shiftKey && e.key === 'Z'))) { e.preventDefault(); this.redo(); }
            if (e.ctrlKey && e.key === 'd') { e.preventDefault(); this.duplicateEl(); }
            if ((e.key === 'Delete' || e.key === 'Backspace') && this.selEl) { e.preventDefault(); this.deleteEl(); }
            if (e.key === 'Escape') { this.deselectAll({target: this.dom.canvasWrap}); }
            if (e.key === 'ArrowUp' && this.selEl) { e.preventDefault(); this.moveEl('up'); }
            if (e.key === 'ArrowDown' && this.selEl) { e.preventDefault(); this.moveEl('down'); }
        });

        window.addEventListener('resize', () => {
            if (this.selEl) this.showToolbar(this.selEl);
        });
    }
}