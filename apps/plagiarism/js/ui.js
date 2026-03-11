import { CONFIG } from './config.js';

/**
 * ============================================================================
 * USER INTERFACE (UI) CONTROLLER
 * ============================================================================
 * Handles DOM element bindings, state updates, and rendering results.
 */

export const UI = {
    // DOM Elements Cache
    els: {
        textInput: document.getElementById('textInput'),
        wordCount: document.getElementById('wordCount'),
        charCount: document.getElementById('charCount'),
        checkBtn: document.getElementById('checkBtn'),
        stopBtn: document.getElementById('stopBtn'),
        clearTextBtn: document.getElementById('clearTextBtn'),
        excludeUrlsInput: document.getElementById('excludeUrls'),
        emptyState: document.getElementById('emptyState'),
        loadingState: document.getElementById('loadingState'),
        resultsData: document.getElementById('resultsData'),
        progressBar: document.getElementById('progressBar'),
        progressText: document.getElementById('progressText'),
        plagScore: document.getElementById('plagScore'),
        uniqScore: document.getElementById('uniqScore'),
        donutChartContainer: document.getElementById('donutChartContainer'),
        highlightBox: document.getElementById('highlightBox'),
        referenceList: document.getElementById('referenceList'),
        statsContainer: document.querySelector('.stats'),
        // New Modal & Print Elements
        printReportBtn: document.getElementById('printReportBtn'),
        proofModal: document.getElementById('proofModal'),
        closeModalBtn: document.getElementById('closeModalBtn'),
        diffUserText: document.getElementById('diffUserText'),
        diffSourceText: document.getElementById('diffSourceText'),
        diffSourceLink: document.getElementById('diffSourceLink')
    },

    initEventListeners() {
        if (this.els.printReportBtn) {
            this.els.printReportBtn.addEventListener('click', () => window.print());
        }
        if (this.els.closeModalBtn) {
            this.els.closeModalBtn.addEventListener('click', () => this.els.proofModal.classList.add('hidden'));
        }
    },

    /**
     * Updates character and word trackers based on user input.
     * @returns {number} The current word count.
     */
    updateCounters() {
        const text = this.els.textInput.value;
        this.els.charCount.innerText = text.length;
        
        const wordCount = text.trim().split(/\s+/).filter(w => w.length > 0).length;
        this.els.wordCount.innerText = wordCount;

        return wordCount;
    },

    /**
     * Clears user input fields and resets counters.
     */
    clearText() {
        this.els.textInput.value = '';
        this.els.excludeUrlsInput.value = '';
        this.updateCounters();
        this.els.textInput.focus();
    },

    /**
     * Toggles the loading UI state during an active scan.
     * @param {boolean} isLoading - True if scanning is in progress.
     */
    setLoading(isLoading) {
        if (isLoading) {
            this.els.emptyState.classList.add('hidden');
            this.els.resultsData.classList.add('hidden');
            this.els.loadingState.classList.remove('hidden');
            this.els.checkBtn.classList.add('hidden');
            if (this.els.stopBtn) {
                this.els.stopBtn.classList.remove('hidden');
                this.els.stopBtn.innerHTML = '<i class="fa-solid fa-circle-stop"></i> Stop Scan';
            }
            this.els.progressBar.style.width = '0%';
        } else {
            this.els.loadingState.classList.add('hidden');
            this.els.checkBtn.classList.remove('hidden');
            if (this.els.stopBtn) this.els.stopBtn.classList.add('hidden');
            this.els.checkBtn.disabled = false;
            this.els.checkBtn.innerHTML = '<i class="fa-solid fa-globe"></i> Re-Check Plagiarism';
        }
    },

    /**
     * Updates the progress bar during the scan phase.
     * @param {number} percent - The percentage completed (0-100).
     * @param {string} text - The status message to display.
     */
    updateProgress(percent, text) {
        this.els.progressBar.style.width = `${percent}%`;
        this.els.progressText.innerText = text;
    },

    /**
     * Renders the final plagiarism report data onto the screen.
     * @param {Object} report - Custom object containing scores, HTML, and matched sources.
     */
    renderResults(report) {
        this.els.resultsData.classList.remove('hidden');
        
        const plagPercent = report.plagiarizedPercent;
        const uniqPercent = 100 - plagPercent;
        
        this.els.plagScore.innerText = `${plagPercent}%`;
        this.els.uniqScore.innerText = `${uniqPercent}%`;

        // Render pure SVG Animated Donut Chart
        if (this.els.donutChartContainer) {
            const radius = 50;
            const circumference = 2 * Math.PI * radius;
            const strokeDashoffset = circumference - (plagPercent / 100) * circumference;
            let strokeColor = plagPercent > 40 ? 'var(--danger)' : (plagPercent > 10 ? 'var(--warning)' : 'var(--success)');
            
            this.els.donutChartContainer.innerHTML = `
                <svg width="140" height="140" viewBox="0 0 120 120" class="donut-svg">
                    <circle cx="60" cy="60" r="${radius}" fill="none" stroke="var(--border)" stroke-width="12"></circle>
                    <circle cx="60" cy="60" r="${radius}" fill="none" class="donut-animated"
                        stroke="${strokeColor}" stroke-width="12" 
                        stroke-dasharray="${circumference}" 
                        stroke-dashoffset="${strokeDashoffset}"
                        stroke-linecap="round"
                        transform="rotate(-90 60 60)">
                    </circle>
                </svg>
            `;
        }

        this.els.highlightBox.innerHTML = report.html;

        this.els.referenceList.innerHTML = '';
        if (report.matches.length === 0) {
            this.els.referenceList.innerHTML = `<li style="color: var(--success)">100% Original. No matches found on the internet.</li>`;
            return;
        }

        // Render each matched sentence and its sources
        report.matches.forEach((matchGroup, index) => {
            let li = document.createElement('li');
            li.className = 'ref-sentence-group';
            // Paraphrased blocks get warning borders instead of danger borders
            if (matchGroup.isParaphrased) {
                li.style.borderLeftColor = 'var(--warning)';
            }
            li.id = `ref-group-${index}`;
            
            let statusTag = matchGroup.isExact ? 
                `<span class="ref-badge" style="background: var(--danger-bg); color: var(--danger);">Exact Copy</span>` : 
                `<span class="ref-badge" style="background: var(--warning-bg); color: var(--warning);">Paraphrased</span>`;

            let html = `<div class="ref-sentence-text">"${matchGroup.sentence}" ${statusTag}</div>`;
            
            matchGroup.sources.forEach((src, srcIdx) => {
                let badgeColor = src.similarity > 0.84 ? 'var(--danger)' : 'var(--warning)';
                html += `
                <div class="ref-link-item diff-trigger" data-group="${index}" data-source="${srcIdx}" style="cursor: pointer; padding: 4px; border-radius: 4px;" title="Click to view Proof Comparison">
                    <i class="fa-solid fa-scale-balanced" style="color: var(--primary)"></i>
                    <a href="javascript:void(0)">${src.title}</a>
                    <span class="ref-badge" style="border: 1px solid ${badgeColor}">${src.sourceType} (${Math.round(src.similarity * 100)}%)</span>
                </div>`;
            });

            li.innerHTML = html;
            this.els.referenceList.appendChild(li);
        });

        // -------------------------------------------------------------
        // BIND EVENT LISTENERS (Hover maps & Proof Modal)
        // -------------------------------------------------------------
        
        // 1. Proof Modal Click Listeners
        document.querySelectorAll('.diff-trigger').forEach(el => {
            el.addEventListener('click', (e) => {
                e.preventDefault();
                const groupIdx = el.getAttribute('data-group');
                const srcIdx = el.getAttribute('data-source');
                const matchData = report.matches[groupIdx];
                const srcData = matchData.sources[srcIdx];
                this.openProofModal(matchData.sentence, srcData.snippet, srcData.url);
            });
            el.addEventListener('mouseenter', () => el.style.background = 'var(--input-bg)');
            el.addEventListener('mouseleave', () => el.style.background = 'transparent');
        });
        // 2. Attach scroll event and interactive hover linking for highlighted text
        document.querySelectorAll('.highlight-exact, .highlight-partial').forEach(el => {
            let targetId = el.getAttribute('data-ref');
            const targetEl = document.getElementById(targetId);

            el.addEventListener('click', () => {
                if (targetEl) {
                    targetEl.scrollIntoView({ behavior: 'smooth', block: 'center' });
                    targetEl.style.backgroundColor = 'var(--input-bg)';
                    setTimeout(() => targetEl.style.backgroundColor = '', 1000);
                }
            });

            // Interactive hover mapping
            el.addEventListener('mouseenter', () => {
                if (targetEl) targetEl.classList.add('source-card-hovered');
            });
            el.addEventListener('mouseleave', () => {
                if (targetEl) targetEl.classList.remove('source-card-hovered');
            });
        });
    },

    /**
     * Opens the visual Diffing Modal to prove plagiarism.
     */
    openProofModal(userText, sourceText, url) {
        this.els.proofModal.classList.remove('hidden');
        this.els.diffSourceLink.href = url;

        // Simple word-intersection diffing
        const userWords = userText.split(/\s+/);
        const sourceLower = sourceText.toLowerCase();

        // Highlight matching words in user text
        const highlightedUser = userWords.map(w => {
            let clean = w.toLowerCase().replace(/[^\w]/g, '');
            if (clean.length > 3 && sourceLower.includes(clean)) {
                return `<span class="diff-match">${w}</span>`;
            }
            return w;
        }).join(" ");

        this.els.diffUserText.innerHTML = highlightedUser;
        this.els.diffSourceText.innerHTML = sourceText; // For strict exact matches we could highlight the reverse, but for now displaying the raw source snippet is sufficient.
    }
};

// Initialize listeners on load
document.addEventListener('DOMContentLoaded', () => UI.initEventListeners());