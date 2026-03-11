import { CONFIG } from './config.js';
import { extractSentences, calculateSimilarity, generateNGrams } from './nlp.js';
import { searchWikipedia, searchAcademic, searchWeb, fetchFullWebpageText } from './api.js';
import { UI } from './ui.js';
import { extractTextFromFile } from './fileParser.js';

/**
 * ============================================================================
 * MAIN APPLICATION CORE (Multi-Query Orchestrator enabled)
 * ============================================================================
 */

document.getElementById('themeToggle').addEventListener('click', () => {
    const htmlEl = document.documentElement;
    const newTheme = htmlEl.getAttribute('data-theme') === 'dark' ? 'light' : 'dark';
    htmlEl.setAttribute('data-theme', newTheme);
});

UI.els.textInput.addEventListener('input', () => UI.updateCounters());
UI.els.clearTextBtn.addEventListener('click', () => UI.clearText());

const dropZone = document.getElementById('dropZone');
const fileInput = document.getElementById('fileInput');
const parsingOverlay = document.getElementById('parsingOverlay');

document.getElementById('uploadBtn').addEventListener('click', () => fileInput.click());
fileInput.addEventListener('change', e => handleDocumentUpload(e.target.files[0]));

dropZone.addEventListener('dragover', e => { 
    e.preventDefault(); 
    dropZone.classList.add('drag-over'); 
});

dropZone.addEventListener('dragleave', () => dropZone.classList.remove('drag-over'));

dropZone.addEventListener('drop', e => {
    e.preventDefault(); 
    dropZone.classList.remove('drag-over');
    if (e.dataTransfer.files.length) handleDocumentUpload(e.dataTransfer.files[0]);
});

async function handleDocumentUpload(file) {
    if (!file) return;
    parsingOverlay.classList.remove('hidden');
    UI.els.textInput.disabled = true;

    try {
        const extractedText = await extractTextFromFile(file);
        UI.els.textInput.value = extractedText;
        UI.updateCounters();
    } catch (error) {
        alert(error.message);
    } finally {
        parsingOverlay.classList.add('hidden');
        UI.els.textInput.disabled = false;
        fileInput.value = ''; 
    }
}

let scanAbortController = null;

UI.els.checkBtn.addEventListener('click', async () => {
    const text = UI.els.textInput.value.trim();
    const wordCount = UI.updateCounters();

    if (wordCount < 10) return alert("Please enter at least 10 words.");

    UI.setLoading(true);
    
    // Initialize the AbortController for this scan
    scanAbortController = new AbortController();
    
    try {
        const report = await performScan(text, scanAbortController.signal);
        if (!scanAbortController.signal.aborted) {
            UI.setLoading(false);
            UI.renderResults(report);
        }
    } catch (error) {
        if (error.name === 'AbortError' || error.message === 'User Cancelled') {
            console.log("Scan cancelled by user.");
            UI.setLoading(false);
            UI.updateProgress(0, "Scan Cancelled.");
        } else {
            console.error(error);
            alert("Scan failed. Ensure you have an internet connection.");
            UI.setLoading(false);
            UI.els.emptyState.classList.remove('hidden');
        }
    } finally {
        scanAbortController = null;
    }
});

// UI Event Listener for the Cancel Button (added later in UI updates)
if (UI.els.stopBtn) {
    UI.els.stopBtn.addEventListener('click', () => {
        if (scanAbortController) {
            scanAbortController.abort();
            UI.els.stopBtn.innerHTML = '<i class="fa-solid fa-spinner fa-spin"></i> Stopping...';
        }
    });
}

const sleep = ms => new Promise(resolve => setTimeout(resolve, ms));

/**
 * Processes a single sentence.
 * ADVANCED LOGIC: Instead of searching the whole sentence (which fails exact match checks),
 * it generates an N-Gram chunk to pull related pages. It then compares those pages 
 * against the FULL sentence using the strict NLP sequential validator.
 */
async function processSentence(sentence, index, totalLength, excludedDomains, signal) {
    let wordCount = sentence.trim().split(/\s+/).filter(w => w.length > 0).length;
    
    if (wordCount < CONFIG.minWordsPerSentence) {
        return { isPlagiarized: false, html: `<span>${sentence} </span>`, wordCount: wordCount };
    }

    // N-Gram Chunking: Extract targeted core phrases to query APIs with maximum hit rate
    const searchChunks = generateNGrams(sentence, CONFIG.searchChunkSize);
    
    // To maximize accuracy, query the first chunk. If it fails, fallback to a secondary chunk from later in the sentence.
    const primaryQuery = searchChunks[0];
    const secondaryQuery = searchChunks.length > 2 ? searchChunks[Math.floor(searchChunks.length / 2)] : (searchChunks.length > 1 ? searchChunks[1] : null);

    const [wikiData, academicData, webData] = await Promise.all([
        searchWikipedia(primaryQuery, signal).catch(e => { if(e.name === 'AbortError') throw e; return []; }),
        searchAcademic(primaryQuery, signal).catch(e => { if(e.name === 'AbortError') throw e; return []; }),
        searchWeb(primaryQuery, true, signal).catch(e => { if(e.name === 'AbortError') throw e; return []; })
    ]);

    let allResults = [...wikiData, ...academicData, ...webData];
    
    // ACCURACY BOOST: If the first targeted chunk failed, try a secondary chunk from the middle of the sentence
    if (allResults.length === 0 && secondaryQuery) {
        let [w2, a2, web2] = await Promise.all([
            searchWikipedia(secondaryQuery, signal).catch(e => { if(e.name === 'AbortError') throw e; return []; }),
            searchAcademic(secondaryQuery, signal).catch(e => { if(e.name === 'AbortError') throw e; return []; }),
            searchWeb(secondaryQuery, true, signal).catch(e => { if(e.name === 'AbortError') throw e; return []; })
        ]);
        allResults = [...w2, ...a2, ...web2];
    }

    // FALLBACK: If the Exact Quote search failed completely on both chunks, try an Unquoted Web Search.
    // Our strict 5-word NLP verification will prevent this from causing false positives.
    if (allResults.length === 0) {
        let fallbackWebData = await searchWeb(primaryQuery, false, signal)
            .catch(e => { if(e.name === 'AbortError') throw e; return []; });
        allResults = [...fallbackWebData];
    }

    // --- DEEP URL FETCHING ---
    // To catch plagiarism buried deep in an article, replace the tiny search engine snippet 
    // with the full webpage's raw text for the top 2 most relevant results.
    let fetchCount = 0;
    let deepFetchPromises = allResults.map(async (res) => {
        if (res.sourceType !== 'Wikipedia' && res.url && res.url.startsWith('http') && fetchCount < 2) {
            fetchCount++;
            try {
                let fullText = await fetchFullWebpageText(res.url, signal);
                if (fullText && fullText.length > res.snippet.length) {
                    res.snippet = fullText; // Overwrite the snippet with the full massive article text
                }
            } catch (e) {
                if (e.name === 'AbortError') throw e;
            }
        }
    });
    
    await Promise.all(deepFetchPromises);
    // -------------------------

    let matchedSourcesForSentence = [];
    let highestSim = 0;

    allResults.forEach(res => {
        let isExcluded = excludedDomains.some(domain => res.url.toLowerCase().includes(domain));
        if (isExcluded) return; 

        // CRITICAL UPDATE: We compare the FULL user's sentence against the returned snippet,
        // enforcing the strict 5-consecutive-word NLP rule.
        let sim = calculateSimilarity(sentence, res.snippet);
        
        if (sim > highestSim) highestSim = sim;

        if (sim >= CONFIG.partialMatchThreshold) {
            if (!matchedSourcesForSentence.some(s => s.url === res.url)) {
                matchedSourcesForSentence.push({ ...res, similarity: sim });
            }
        }
    });

    if (matchedSourcesForSentence.length > 0) {
        matchedSourcesForSentence.sort((a, b) => b.similarity - a.similarity);
        
        // Exact requires the high threshold. Otherwise, it's considered Paraphrased (Orange).
        let isExact = highestSim >= CONFIG.exactMatchThreshold;
        
        return { 
            sentence: sentence,
            isPlagiarized: true, 
            isExact: isExact,
            isParaphrased: !isExact,
            sources: matchedSourcesForSentence,
            wordCount: wordCount
        };
    } else {
        return { 
            sentence: sentence,
            isPlagiarized: false, 
            html: `<span>${sentence} </span>`,
            wordCount: wordCount
        };
    }
}

async function performScan(userText, signal) {
    const sentences = extractSentences(userText);
    let totalWords = 0;
    let plagiarizedWords = 0;
    let globalMatches = []; 
    let orderedResults = new Array(sentences.length); 

    const excludeStr = UI.els.excludeUrlsInput.value.toLowerCase();
    const excludedDomains = excludeStr.split(',')
        .map(d => d.trim().replace(/^https?:\/\//, ''))
        .filter(d => d.length > 0);

    for (let i = 0; i < sentences.length; i += CONFIG.maxConcurrentRequests) {
        // Abort check before starting a new batch
        if (signal && signal.aborted) throw new DOMException("Aborted", "AbortError");

        let batch = sentences.slice(i, i + CONFIG.maxConcurrentRequests);
        
        let batchPromises = batch.map((sentence, batchIndex) => {
            let actualIndex = i + batchIndex;
            return processSentence(sentence, actualIndex, sentences.length, excludedDomains, signal)
                .then(result => {
                    orderedResults[actualIndex] = result;
                });
        });

        await Promise.all(batchPromises);
        
        let progressPercent = Math.min(100, Math.round(((i + batch.length) / sentences.length) * 100));
        UI.updateProgress(progressPercent, `Scanned ${i + batch.length} of ${sentences.length} sentences...`);
        
        if (i + batch.length < sentences.length) {
            await sleep(CONFIG.delayBetweenBatchesMs); 
        }
    }

    let highlightedHTML = '';
    
    orderedResults.forEach(res => {
        if (!res) return;
        totalWords += res.wordCount;
        
        if (res.isPlagiarized) {
            plagiarizedWords += res.wordCount;
            let matchGroupIndex = globalMatches.length;
            
            globalMatches.push({
                sentence: res.sentence.trim(),
                isExact: res.isExact,
                isParaphrased: res.isParaphrased,
                sources: res.sources
            });
            
            // Map CSS status classes so UI.js knows how to display it
            let cssClass = res.isExact ? 'highlight-exact' : 'highlight-partial';
            highlightedHTML += `<span class="${cssClass}" data-ref="ref-group-${matchGroupIndex}" title="Found in ${res.sources.length} source(s)">${res.sentence}</span> `;
        } else {
            highlightedHTML += res.html;
        }
    });

    let pScore = totalWords > 0 ? Math.round((plagiarizedWords / totalWords) * 100) : 0;

    return {
        plagiarizedPercent: pScore,
        html: highlightedHTML.trim(),
        matches: globalMatches
    };
}