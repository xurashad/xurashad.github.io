export function setupHistory(App) {
    Object.assign(App.prototype, {
        saveHistory() {
            const state = { pages: JSON.parse(JSON.stringify(this.siteData.pages)) };
            if (this.historyIndex < this.history.length - 1) this.history = this.history.slice(0, this.historyIndex + 1);
            this.history.push(state);
            this.historyIndex++;
            if (this.history.length > 60) { this.history.shift(); this.historyIndex--; }
        },

        undo() {
            if (this.historyIndex > 0) { this.historyIndex--; this.restoreHistory(this.history[this.historyIndex]); this.toast('Undone', 'info', 1200); }
            else this.toast('Nothing to undo', 'warning', 1200);
        },

        redo() {
            if (this.historyIndex < this.history.length - 1) { this.historyIndex++; this.restoreHistory(this.history[this.historyIndex]); this.toast('Redone', 'info', 1200); }
            else this.toast('Nothing to redo', 'warning', 1200);
        },

        restoreHistory(state) {
            this.siteData.pages = JSON.parse(JSON.stringify(state.pages));
            this.loadPage(this.currPage);
        }
    });
}