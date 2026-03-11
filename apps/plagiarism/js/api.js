import { stripHtml, decodeOpenAlexAbstract } from './nlp.js';

/**
 * ============================================================================
 * SEARCH API MODULE (Targeted N-Gram Precision)
 * ============================================================================
 * Handles all external API requests. 
 * Now processes targeted chunk queries to avoid false blank searches.
 */

const TIMEOUT_MS = 8000; 

async function fetchWithTimeout(resource, options = {}) {
    const { timeout = TIMEOUT_MS, externalSignal } = options;
    const controller = new AbortController();
    const id = setTimeout(() => controller.abort(), timeout);
    
    // If an external abort signal is provided (like a user clicking Cancel), link it to the fetch
    const signal = externalSignal ? (externalSignal.aborted ? externalSignal : controller.signal) : controller.signal;
    if (externalSignal && !externalSignal.aborted) {
        externalSignal.addEventListener('abort', () => controller.abort({ reason: 'User Cancelled' }));
    }

    try {
        const response = await fetch(resource, {
            ...options,
            signal: signal  
        });
        clearTimeout(id);
        return response;
    } catch (e) {
        clearTimeout(id);
        throw e;
    }
}

/**
 * 1. WIKIPEDIA SEARCH
 * @param {string} exactQuery - A targeted N-Gram chunk.
 * @param {AbortSignal} signal - Signal to abort the request.
 * @returns {Promise<Array>} List of Wikipedia sources.
 */
export async function searchWikipedia(exactQuery, signal) {
    // "..." enforces strict exact phrase matching on Wikipedia
    const url = `https://en.wikipedia.org/w/api.php?action=query&list=search&srsearch=${encodeURIComponent(`"${exactQuery}"`)}&utf8=&format=json&origin=*`;
    
    try {
        let res = await fetchWithTimeout(url, { externalSignal: signal });
        if (!res.ok) return [];
        let data = await res.json();
        return data.query.search.map(item => ({
            title: item.title,
            url: `https://en.wikipedia.org/wiki/${encodeURIComponent(item.title.replace(/ /g, '_'))}`,
            snippet: stripHtml(item.snippet),
            sourceType: 'Wikipedia'
        }));
    } catch (e) {
        return [];
    }
}

/**
 * 2. ACADEMIC SEARCH (OpenAlex with Abstract Decoding)
 * @param {string} exactQuery - A targeted N-Gram chunk.
 * @param {AbortSignal} signal - Signal to abort the request.
 * @returns {Promise<Array>} List of academic sources with decoded abstracts.
 */
export async function searchAcademic(exactQuery, signal) {
    const url = `https://api.openalex.org/works?search=${encodeURIComponent(`"${exactQuery}"`)}&per-page=3`;
    
    try {
        let res = await fetchWithTimeout(url, { externalSignal: signal });
        if (!res.ok) return [];
        let data = await res.json();
        
        return data.results.map(item => {
            // FIX: Rebuild the actual readable abstract from OpenAlex's inverted index format
            let decodedAbstract = "";
            if (item.abstract_inverted_index) {
                decodedAbstract = decodeOpenAlexAbstract(item.abstract_inverted_index);
            }
            
            return {
                title: item.title || 'Research Paper',
                url: item.id || (item.primary_location && item.primary_location.landing_page_url) || '#',
                snippet: decodedAbstract || item.title, // Compare against the TRUE abstract now!
                sourceType: 'Academic Journal'
            };
        });
    } catch (e) {
        return [];
    }
}

/**
 * 3. WEB SEARCH (SearXNG Aggregator)
 * Queries open-source proxy instances that aggregate Google, Bing, and DDG.
 * Bypasses the strict bot blocks of DuckDuckGo Lite.
 * @param {string} query - A targeted N-Gram chunk.
 * @param {boolean} exact - Whether to wrap the query in quotes.
 * @param {AbortSignal} signal - Signal to abort the request.
 * @returns {Promise<Array>} List of general web sources.
 */
export async function searchWeb(query, exact = true, signal) {
    // Generate the query string
    const finalQuery = exact ? `"${query}"` : query;
    
    // Stable SearXNG public instances that allow CORS
    const instances = [
        `https://search.ononoki.org/search?q=${encodeURIComponent(finalQuery)}&format=json`,
        `https://paulgo.io/search?q=${encodeURIComponent(finalQuery)}&format=json`,
        `https://searx.be/search?q=${encodeURIComponent(finalQuery)}&format=json`
    ];

    for (let url of instances) {
        try {
            let res = await fetchWithTimeout(url, { headers: { 'Accept': 'application/json' }, externalSignal: signal });
            if (!res.ok) continue;
            
            let data = await res.json();
            if (!data.results || data.results.length === 0) return [];
            
            let results = data.results.map(item => ({
                title: item.title || "Web Article",
                url: item.url,
                snippet: stripHtml(item.content || item.title),
                sourceType: 'Web Article'
            }));

            // If we found results, return immediately (do not hit proxies/fallback)
            return results.slice(0, 3);
            
        } catch (e) {
            console.warn("SearXNG instance failed, trying next...");
        }
    }
    
    // If all SearXNG instances fail, try DuckDuckGo HTML proxy
    let ddgResults = await searchDuckDuckGoFallback(finalQuery, signal);
    if (ddgResults.length > 0) return ddgResults;

    // Finally, fallback to Yahoo
    return await searchYahooFallback(finalQuery, signal);
}

/**
 * DOUBLE FALLBACK: DuckDuckGo HTML Search
 * Highly accurate snippet scraping
 */
async function searchDuckDuckGoFallback(finalQuery, signal) {
    const searchUrl = `https://html.duckduckgo.com/html/?q=${encodeURIComponent(finalQuery)}`;
    const proxyUrl = `https://api.allorigins.win/get?url=${encodeURIComponent(searchUrl)}`;
    
    try {
        let res = await fetchWithTimeout(proxyUrl, { cache: 'no-store', externalSignal: signal });
        if (!res.ok) return [];
        
        let data = await res.json();
        let htmlText = data.contents;
        let parser = new DOMParser();
        let doc = parser.parseFromString(htmlText, 'text/html');
        
        let results = [];
        doc.querySelectorAll('.result').forEach(resultEl => {
            let aTag = resultEl.querySelector('.result__snippet');
            if (aTag && aTag.href) {
                results.push({
                    title: "Web Source",
                    url: aTag.href,
                    snippet: stripHtml(aTag.innerHTML),
                    sourceType: 'Web Article'
                });
            }
        });
        return results.slice(0, 3);
    } catch (e) {
        return [];
    }
}

/**
 * FALLBACK WEB ENGINE
 * @param {string} finalQuery - A targeted N-Gram chunk (quoted or unquoted).
 * @param {AbortSignal} signal - Signal to abort the request.
 * @returns {Promise<Array>} List of general web sources.
 */
async function searchYahooFallback(finalQuery, signal) {
    const searchUrl = `https://search.yahoo.com/search?p=${encodeURIComponent(finalQuery)}`;
    const proxyUrl = `https://api.allorigins.win/get?url=${encodeURIComponent(searchUrl)}`;
    
    try {
        let res = await fetchWithTimeout(proxyUrl, { cache: 'no-store', externalSignal: signal });
        if (!res.ok) return [];
        
        let data = await res.json();
        let htmlText = data.contents;
        let parser = new DOMParser();
        let doc = parser.parseFromString(htmlText, 'text/html');
        
        let results = [];
        doc.querySelectorAll('div.compTitle a').forEach(aTag => {
            let wrapper = aTag.closest('div') ? aTag.closest('div').parentElement : null;
            let snippetEl = wrapper ? wrapper.querySelector('.compText') : null;
            let cleanUrl = aTag.href.includes('RU=') ? decodeURIComponent(aTag.href.split('RU=')[1].split('/')[0]) : aTag.href;
            
            if (snippetEl && cleanUrl && !cleanUrl.includes('yahoo.com/news')) {
                // Strip the Yahoo boilerplate bolding <b> tags from snippet
                let snippetClean = stripHtml(snippetEl.innerHTML);
                results.push({
                    title: aTag.innerText || "Web Source",
                    url: cleanUrl,
                    snippet: snippetClean,
                    sourceType: 'Web Article'
                });
            }
        });
        return results.slice(0, 3);
    } catch (e) {
        return [];
    }
}

/**
 * 4. DEEP URL FETCHING
 * Downloads the entire raw text of a target website to bypass snippet truncation.
 * @param {string} url - The URL to scrape.
 * @param {AbortSignal} signal - Signal to abort the request.
 * @returns {Promise<string>} The extracted plain text of the webpage.
 */
export async function fetchFullWebpageText(url, signal) {
    if (!url || typeof url !== 'string' || !url.startsWith('http')) return "";

    const proxies = [
        `https://api.allorigins.win/get?url=${encodeURIComponent(url)}`,
        `https://api.codetabs.com/v1/proxy?quest=${encodeURIComponent(url)}`
    ];

    for (let proxy of proxies) {
        try {
            let res = await fetchWithTimeout(proxy, { cache: 'no-store', externalSignal: signal });
            if (!res.ok) continue;

            let htmlText = "";
            if (proxy.includes('allorigins')) {
                let data = await res.json();
                htmlText = data.contents;
            } else {
                htmlText = await res.text();
            }

            if (!htmlText) continue;

            let parser = new DOMParser();
            let doc = parser.parseFromString(htmlText, 'text/html');
            
            // Prefer <article> or <main> if they exist, otherwise <body>
            let contentNode = doc.querySelector('article') || doc.querySelector('main') || doc.body;
            
            if (contentNode) {
                // Remove scripts, styles, and other non-text elements
                const elementsToRemove = contentNode.querySelectorAll('script, style, nav, header, footer, iframe, noscript');
                elementsToRemove.forEach(el => el.remove());
                
                return stripHtml(contentNode.innerHTML);
            }
        } catch (e) {
            console.warn(`Deep fetch timeout or block on proxy...`);
        }
    }
    return "";
}