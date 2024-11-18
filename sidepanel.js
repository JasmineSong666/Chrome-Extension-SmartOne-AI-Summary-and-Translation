let currentTextToSummarize = '';
let currentShouldTranslate = false;
let lastSelectedLanguage = 'zh';

async function chromeAISummarizeAndTranslate(textToSummarize, shouldTranslate = false) {
    // Store current state
    currentTextToSummarize = textToSummarize;
    currentShouldTranslate = shouldTranslate;

    if (!textToSummarize) return;
    const outputElement = document.body.querySelector('#summarization-text');
    const titleElement = document.body.querySelector('#panel-title');
    
    // Update title based on action
    titleElement.textContent = shouldTranslate ? "Summary and Translation" : "Summary";
    outputElement.innerText = "Processing...";
    outputElement.classList.add('processing');
    
    // Show/hide language selector based on translation mode, not processing state
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
            outputElement.innerText = 'Text Summarizer API not available.';
            return;
        }

        let summarizer;
        if (canSummarize.available === 'readily') {
            summarizer = await ai.summarizer.create({ type, format, length });
        } else {
            summarizer = await ai.summarizer.create({ type, format, length });
            summarizer.addEventListener('downloadprogress', (e) => {
                outputElement.innerText = `Loading summarizer: ${Math.round((e.loaded / e.total) * 100)}%`;
            });
            await summarizer.ready;
        }

        let result = await summarizer.summarize(textToSummarize);

        // Translation if requested
        if (shouldTranslate) {
            await handleTranslation(result);
        } else {
            outputElement.innerHTML = `
                <div class="section-title">Summary:</div>
                <div class="content-text">${result}</div>
            `;
        }
    } catch (error) {
        console.error('Processing error:', error);
        outputElement.innerText = 'Error processing text.';
        // Keep language selector visible if in translation mode
        document.getElementById('language-selector-container').style.display = 
            shouldTranslate ? 'block' : 'none';
    } finally {
        outputElement.classList.remove('processing');
    }
}

async function handleTranslation(textToTranslate, targetLang = null) {
    const outputElement = document.body.querySelector('#summarization-text');
    const languageSelectorContainer = document.getElementById('language-selector-container');
    const languageSelector = document.getElementById('language-selector');

    targetLang = targetLang || lastSelectedLanguage;
    lastSelectedLanguage = targetLang;

    // Show language selector immediately
    languageSelectorContainer.style.display = 'block';
    languageSelector.value = targetLang;

    const languagePair = {
        sourceLanguage: 'en',
        targetLanguage: targetLang,
    };

    try {
        const canTranslate = await translation.canTranslate(languagePair);
        if (canTranslate === 'no') {
            outputElement.innerText = textToTranslate + '\n\nTranslation not available for this language.';
            return;
        }

        let translator;
        if (canTranslate === 'readily') {
            translator = await translation.createTranslator(languagePair);
        } else {
            translator = await translation.createTranslator(languagePair);
            translator.addEventListener('downloadprogress', (e) => {
                outputElement.innerText = `Loading translator: ${Math.round((e.loaded / e.total) * 100)}%`;
            });
            await translator.ready;
        }

        const translatedText = await translator.translate(textToTranslate);
        const formattedTranslation = translatedText
            .split('- ')
            .filter(text => text.trim())
            .map(text => `- ${text.trim()}`)
            .join('\n');

        outputElement.innerHTML = `
            <div class="section-title">English Summary:</div>
            <div class="content-text">${textToTranslate}</div>
            <div class="section-title">Translation:</div>
            <div class="content-text">${formattedTranslation}</div>
        `;
    } catch (error) {
        console.error('Translation error:', error);
        outputElement.innerText = textToTranslate + '\n\nDownloading the language package, please refresh the page!';
    }
}

// Add event listener for language selection
document.getElementById('language-selector').addEventListener('change', async (e) => {
    lastSelectedLanguage = e.target.value;
    const outputElement = document.body.querySelector('#summarization-text');
    const currentText = outputElement.innerText;
    const originalSummary = currentText
        .split('Translation:')[0]
        .replace('English Summary:', '')
        .trim();
    
    outputElement.innerText = "Processing...";
    outputElement.classList.add('processing');
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