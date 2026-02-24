export function setupLayout(App) {
    Object.assign(App.prototype, {
        getTargetColumn() {
            if (this.selEl) {
                if (this.selEl.classList.contains('b-col')) return this.selEl;
                if (this.selEl.classList.contains('b-row')) return this.selEl.querySelector('.b-col');
                if (this.selEl.classList.contains('b-section')) return this.selEl.querySelector('.b-col');
                if (this.selEl.closest('.b-col')) return this.selEl.closest('.b-col');
            }
            const cols = this.dom.main.querySelectorAll('.b-col');
            return cols.length ? cols[cols.length - 1] : null;
        },

        getParentSection() {
            if (!this.selEl) return null;
            if (this.selEl.classList.contains('b-section')) return this.selEl;
            return this.selEl.closest('.b-section');
        },

        getParentRow() {
            if (!this.selEl) return null;
            if (this.selEl.classList.contains('b-row')) return this.selEl;
            return this.selEl.closest('.b-row');
        },

        addSection(colType) {
            const section = document.createElement('div');
            section.className = 'b-section';
            section.setAttribute('data-label', 'Section');
            const inner = document.createElement('div');
            inner.className = 'b-section-inner';
            const row = document.createElement('div');
            row.className = `b-row ${colType}`;
            row.setAttribute('data-label', 'Row');
            const cols = parseInt(colType.split('-')[1]);
            for (let i = 0; i < cols; i++) {
                const col = document.createElement('div');
                col.className = 'b-col';
                col.setAttribute('data-label', 'Column');
                row.appendChild(col);
            }
            inner.appendChild(row);
            section.appendChild(inner);
            this.dom.main.appendChild(section);
            this.bindElementEvents();
            this.selectEl(section);
            this.savePage();
            this.saveHistory();
            this.toast(`${cols}-column section added`, 'success', 1400);
        },

        addRow(colType) {
            const section = this.getParentSection();
            if (!section) {
                this.toast('Select a section or element first to add a row inside it.', 'warning');
                return;
            }
            const inner = section.querySelector('.b-section-inner');
            if (!inner) return;

            const row = document.createElement('div');
            row.className = `b-row ${colType}`;
            row.setAttribute('data-label', 'Row');
            const cols = parseInt(colType.split('-')[1]);
            for (let i = 0; i < cols; i++) {
                const col = document.createElement('div');
                col.className = 'b-col';
                col.setAttribute('data-label', 'Column');
                row.appendChild(col);
            }

            const currRow = this.getParentRow();
            if (currRow && currRow.parentNode === inner) {
                inner.insertBefore(row, currRow.nextSibling);
            } else {
                inner.appendChild(row);
            }

            this.bindElementEvents();
            this.selectEl(row);
            this.savePage();
            this.saveHistory();
            this.toast(`${cols}-column row added`, 'success', 1200);
        },

        addColumnToRow() {
            const row = this.getParentRow();
            if (!row) { this.toast('Select a row first', 'warning'); return; }
            const col = document.createElement('div');
            col.className = 'b-col';
            col.setAttribute('data-label', 'Column');
            row.appendChild(col);
            this.updateRowColClass(row);
            this.bindElementEvents();
            this.savePage();
            this.saveHistory();
            this.toast('Column added', 'success', 1200);
        },

        removeColumnFromRow() {
            const row = this.getParentRow();
            if (!row) { this.toast('Select a row first', 'warning'); return; }
            const cols = row.querySelectorAll(':scope > .b-col');
            if (cols.length <= 1) { this.toast('Row must have at least 1 column', 'warning'); return; }
            const toRemove = this.selEl?.classList.contains('b-col') ? this.selEl : cols[cols.length - 1];
            toRemove.remove();
            this.updateRowColClass(row);
            this.deselectAll();
            this.savePage();
            this.saveHistory();
            this.toast('Column removed', 'info', 1200);
        },

        updateRowColClass(row) {
            const count = row.querySelectorAll(':scope > .b-col').length;
            row.className = row.className.replace(/col-\d+/, `col-${Math.min(count, 4)}`);
            if (count > 4) row.style.gridTemplateColumns = `repeat(${count}, 1fr)`;
        },

        changeRowLayout(colClass) {
            const row = this.getParentRow();
            if (!row) { this.toast('Select a row/section', 'warning'); return; }
            const targetCols = parseInt(colClass.split('-')[1]);
            const existing = Array.from(row.querySelectorAll(':scope > .b-col'));
            const diff = targetCols - existing.length;
            if (diff > 0) {
                for (let i = 0; i < diff; i++) {
                    const col = document.createElement('div');
                    col.className = 'b-col'; col.setAttribute('data-label', 'Column');
                    row.appendChild(col);
                }
            } else if (diff < 0) {
                let toRemove = Math.abs(diff);
                for (let i = existing.length - 1; i >= 0 && toRemove > 0; i--) {
                    if (!existing[i].children.length) { existing[i].remove(); toRemove--; }
                }
                const remaining = Array.from(row.querySelectorAll(':scope > .b-col'));
                for (let i = remaining.length - 1; i >= 0 && toRemove > 0; i--) {
                    remaining[i].remove(); toRemove--;
                }
            }
            row.className = `b-row ${colClass}`;
            row.style.gridTemplateColumns = '';
            this.bindElementEvents();
            this.savePage();
            this.saveHistory();
            this.toast(`Layout changed to ${targetCols} column${targetCols>1?'s':''}`, 'success', 1200);
        },

        setCustomColWidths(val) {
            const row = this.getParentRow();
            if (!row || !val.trim()) return;
            row.style.gridTemplateColumns = val.trim();
            this.savePage();
        },

        setFullBleed(enabled) {
            const section = this.getParentSection();
            if (!section) return;
            if (enabled) { section.classList.add('full-bleed'); } 
            else { section.classList.remove('full-bleed'); }
            this.savePage();
        },

        toggleFullBleed() {
            const section = this.getParentSection();
            if (!section) { this.toast('Select a section first', 'warning'); return; }
            const isFullBleed = section.classList.toggle('full-bleed');
            document.getElementById('toggle-fullbleed').checked = isFullBleed;
            this.savePage();
            this.toast(isFullBleed ? 'Full-width on' : 'Full-width off', 'info', 1200);
        },

        setSectionInnerStyle(prop, val) {
            const section = this.getParentSection();
            if (!section) return;
            const inner = section.querySelector('.b-section-inner');
            if (inner) inner.style[prop] = val;
            this.savePage();
        },

        setRowStyle(prop, val) {
            const row = this.getParentRow();
            if (row) { row.style[prop] = val; this.savePage(); }
        },

        addSpacer() {
            const sp = document.createElement('div');
            sp.className = 'b-el spacer';
            sp.setAttribute('data-label', 'Spacer');
            sp.style.height = '50px';
            this.insertElement(sp);
            this.toast('Spacer added', 'success', 1200);
        }
    });
}