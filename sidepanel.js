let currentTextToSummarize = '';
let currentShouldTranslate = false;
let lastSelectedLanguage = 'zh';

async function chromeAISummarizeAndTranslate(textToSummarize, shouldTranslate = false) {
    // Store current state
    currentTextToSummarize = textToSummarize;
    currentShouldTranslate = shouldTranslate;

    if (!textToSummarize) return;
    const summaryElement = document.getElementById('summary-result');
    const translationElement = document.getElementById('translation-result');
    const titleElement = document.body.querySelector('#panel-title');
    
    // Update title based on action
    titleElement.textContent = shouldTranslate ? "Summary and Translation" : "Summary";
    
    // Clear previous results
    summaryElement.innerHTML = '<div class="content-text">Processing...</div>';
    translationElement.innerHTML = '';
    
    // Show/hide language selector based on translation mode
    document.getElementById('language-selector-container').style.display = 
        shouldTranslate ? 'block' : 'none';

    try {
        // Get current summarization options
        const type = document.getElementById('type-selector').value;
        const format = document.getElementById('format-selector').value;
        const length = document.getElementById('length-selector').value;

        // Summarization
        const canSummarize = await ai.summarizer.capabilities();
        if (!canSummarize || canSummarize.available === 'no') {
            summaryElement.innerHTML = '<div class="content-text">Text Summarizer API not available.</div>';
            return;
        }

        let summarizer;
        if (canSummarize.available === 'readily') {
            summarizer = await ai.summarizer.create({ type, format, length });
        } else {
            summarizer = await ai.summarizer.create({ type, format, length });
            summarizer.addEventListener('downloadprogress', (e) => {
                summaryElement.innerHTML = `<div class="content-text">Loading summarizer: ${Math.round((e.loaded / e.total) * 100)}%</div>`;
            });
            await summarizer.ready;
        }

        let result = await summarizer.summarize(textToSummarize);

        // Display summary result
        summaryElement.innerHTML = `
            <div class="section-title">Summary:</div>
            <div class="content-text">${result}</div>
        `;

        // Translation if requested
        if (shouldTranslate) {
            await handleTranslation(result);
        }
    } catch (error) {
        console.error('Processing error:', error);
        summaryElement.innerHTML = '<div class="content-text">Error processing text.</div>';
        // Keep language selector visible if in translation mode
        document.getElementById('language-selector-container').style.display = 
            shouldTranslate ? 'block' : 'none';
    }
}

async function handleTranslation(textToTranslate, targetLang = null) {
    const summaryElement = document.getElementById('summary-result');
    const translationElement = document.getElementById('translation-result');
    const languageSelectorContainer = document.getElementById('language-selector-container');
    const languageSelector = document.getElementById('language-selector');

    // Clear previous translation
   
    translationElement.innerHTML = '<div class="content-text">Processing...</div>';
    
    targetLang = targetLang || lastSelectedLanguage;
    lastSelectedLanguage = targetLang;

    // Show language selector immediately
    languageSelectorContainer.style.display = 'block';
    languageSelector.value = targetLang;

    // Display original summary
    summaryElement.innerHTML = `
        <div class="section-title">English Summary:</div>
        <div class="content-text">${textToTranslate}</div>
    `;

    const languagePair = {
        sourceLanguage: 'en',
        targetLanguage: targetLang,
    };

    try {
        const canTranslate = await translation.canTranslate(languagePair);
        if (canTranslate === 'no') {
            translationElement.innerHTML = '<div class="content-text">Translation not available for this language.</div>';
            return;
        }

        let translator;
        if (canTranslate === 'readily') {
            translator = await translation.createTranslator(languagePair);
        } else {
            translator = await translation.createTranslator(languagePair);
            translationElement.innerHTML = '<div class="content-text">Loading translator...</div>';
            await translator.ready;
        }

        const translatedText = await translator.translate(textToTranslate);
        const formattedTranslation = translatedText
            .split('- ')
            .filter(text => text.trim())
            .map(text => `- ${text.trim()}`)
            .join('\n');

        translationElement.innerHTML = `
            <div class="section-title">Translation:</div>
            <div class="content-text">${formattedTranslation}</div>
        `;
    } catch (error) {
        console.error('Translation error:', error);
        translationElement.innerHTML = '<div class="content-text">Downloading the language package, please refresh the page!</div>';
    }
}

// Update the language selector event listener
document.getElementById('language-selector').addEventListener('change', async (e) => {
    lastSelectedLanguage = e.target.value;
    const summaryElement = document.getElementById('summary-result');
    const originalSummary = summaryElement.querySelector('.content-text').textContent.trim();
    await handleTranslation(originalSummary, e.target.value);
});

// Update the storage listener
chrome.storage.session.onChanged.addListener(async (changes) => {
    const textChange = changes['lastTextToSummarize'];
    const actionChange = changes['action'];
    
    if (textChange?.newValue || actionChange?.newValue) {
        chrome.storage.session.get(['lastTextToSummarize', 'action', 'lastLanguage'], (data) => {
            if (data.lastTextToSummarize) {
                const shouldTranslate = data.action === 'summarize-and-translate';
                if (data.lastLanguage) {
                    lastSelectedLanguage = data.lastLanguage;
                }
                chromeAISummarizeAndTranslate(data.lastTextToSummarize, shouldTranslate);
            }
        });
    }
});

// Initial load
chrome.storage.session.get(['lastTextToSummarize', 'action', 'lastLanguage'], (data) => {
    if (data.lastLanguage) {
        lastSelectedLanguage = data.lastLanguage;
    }
    if (data.lastTextToSummarize) {
        const shouldTranslate = data.action === 'summarize-and-translate';
        chromeAISummarizeAndTranslate(data.lastTextToSummarize, shouldTranslate);
    }
});

// Add new event listener for the apply button
document.getElementById('apply-options').addEventListener('click', async () => {
    if (currentTextToSummarize) {
        await chromeAISummarizeAndTranslate(currentTextToSummarize, currentShouldTranslate);
    }
});