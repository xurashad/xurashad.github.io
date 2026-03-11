/**
 * ============================================================================
 * FILE EXTRACTION MODULE
 * ============================================================================
 * Handles text extraction from various file types (.txt, .pdf, .docx, etc.).
 */

/**
 * Extracts text from standard text-based files (.txt, .md, .csv, .html).
 * @param {File} file - The file to parse.
 * @returns {Promise<string>} The extracted text.
 */
async function readAsText(file) {
    return new Promise((resolve, reject) => {
        const reader = new FileReader();
        reader.onload = e => resolve(e.target.result);
        reader.onerror = e => reject(e);
        reader.readAsText(file);
    });
}

/**
 * Extracts text from Microsoft Word (.docx) files.
 * @param {File} file - The file to parse.
 * @returns {Promise<string>} The extracted text.
 */
async function readDocx(file) {
    const arrayBuffer = await file.arrayBuffer();
    // Mammoth.js is loaded globally via CDN in index.html
    const result = await mammoth.extractRawText({ arrayBuffer: arrayBuffer });
    return result.value;
}

/**
 * Extracts text from PDF files.
 * @param {File} file - The file to parse.
 * @returns {Promise<string>} The extracted text.
 */
async function readPdf(file) {
    const arrayBuffer = await file.arrayBuffer();
    // pdfjsLib is loaded globally via CDN in index.html
    const pdf = await pdfjsLib.getDocument({ data: arrayBuffer }).promise;
    
    let fullText = "";
    
    // Iterate through each page to extract text
    for (let i = 1; i <= pdf.numPages; i++) {
        const page = await pdf.getPage(i);
        const textContent = await page.getTextContent();
        const pageText = textContent.items.map(item => item.str).join(" ");
        fullText += pageText + "\n\n";
    }
    
    return fullText;
}

/**
 * Master API function to route the file to the correct parser.
 * @param {File} file - The file to parse.
 * @returns {Promise<string>} The extracted text.
 */
export async function extractTextFromFile(file) {
    const extension = file.name.split('.').pop().toLowerCase();

    try {
        if (['txt', 'md', 'html', 'csv'].includes(extension)) {
            return await readAsText(file);
        } else if (['docx', 'doc'].includes(extension)) {
            return await readDocx(file);
        } else if (extension === 'pdf') {
            return await readPdf(file);
        } else {
            throw new Error(`Unsupported file type: .${extension}`);
        }
    } catch (error) {
        console.error("Error reading file:", error);
        throw new Error("Could not extract text from this document. It may be corrupted or encrypted.");
    }
}