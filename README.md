# SmartOne: AI Summarisation & Translation Chrome Extension

A powerful Chrome Extension that leverages Chrome's built-in AI capabilities to provide intelligent text summarization and translation. This tool helps users quickly understand and translate content across the web without leaving their current page.

## Problem Statement
While browsing text based websites, especially review-heavy websites (like Yelp, Booking, or Airbnb), users often face these challenges:
- Need to summarise specific sections that they can select freely rather than entire pages
- Long, detailed reviews that take too much time to read
- Language barriers for non-native English speakers
- Difficulty in quickly grasping key points from multiple reviews

Although many extensions offer whole-page summarization, Smart Summary stands out by letting you:
- Focus on specific content you care about - Perfect for individual reviews or comments
- Get instant translations of the summary in their preferred language
- Customize summaries to your exact needs
- Maintain customization options when switching text selections.

## Key Features
- **Selective Text Processing**: 
  - Summarize or translate any selected text portion
  - Perfect for part of the page, like long reviews, comments, or articles

- **Smart Text Summarization**:
  - Generate concise summaries using Chrome's AI
  - Customizable Summary Options  
    - Summary types: 
      - Key Points
      - TL;DR
      - Teaser
      - Headline
  - Format options:
    - Plain Text 
    - Markdown
  - Length variations: 
    - Short
    - Medium
    - Long

- **Multi-language Translation**:
  - Support for 9 major languages
  - Remembers your language preference
  - Combined summarization and translation in one click

- **User-Friendly Interface**:
  - Quick-access popup on text selection
  - Right-click context menu integration
  - Side panel display for results
  - Persistent settings between uses

## Installation
1. Clone this repository
```bash
git clone https://github.com/JasmineSong666/Chrome-Extension-SmartOne-AI-Summary-and-Translation.git
```
2. Open Chrome and navigate to `chrome://extensions/`
3. Enable "Developer mode" in the top right
4. Click "Load unpacked" and select the extension directory

## How to Use
1. Select any text on a webpage
2. Choose your action:
   - Click the popup buttons that appear
   - Use the right-click context menu
3. View results in the side panel
4. Customize summary options and language as needed

## API Implementation Details
### APIs Used
- Chrome Summarizer API
- Chrome Translator API

### Summarizer API
- Real-time text processing with customizable outputs 
- Persistent format and length preferences 

Use Summarizer API processes text content and generates concise summaries based on user preferences. It handles:
- Content analysis
- Key information extraction
- Format conversion
- Length optimization

### Translator API
- Seamless integration with summarization 
- Smart language preference management 
- Asynchronous processing for smooth user experience

Use Translator API to translate text content into different languages. It handles:
- Language detection
- Text translation
- Language switching

## Development
1. **Foundation**
   - Built using vanilla JavaScript for core functionality
   - Utilized Chrome's Extension Manifest V3
   - Integrated Chrome's built-in AI APIs for summarization and translation
     - Chrome Summarizer API for intelligent text processing
     - Chrome Translator API for accurate translations

2. **Architecture**
   - content-script.js for user interaction and text selection
   - service-worker.js for background processes and context menu integration
   - sidepanel.js and sidepanel.html for displaying results and user controls
   - style folder to store CSS files: popup.css and sidepanel.css.
   - manifest.json and images folder in root directory

3. **UI/UX Design**
   - HTML/CSS/JavaScript for the UI
   - Implemented a floating popup for quick actions
   - Created a responsive side panel with customization options
   - Designed with accessibility and user experience

## Testing Instructions
1. Load the extension in developer mode
2. Select any text on a webpage
3. Test both summarization and summarization & translation features by clicking the popup buttons or right-click context menu
4. Try different summarization options
5. Test multiple target languages

## Technical Challenges and Solutions

### Challenge 1: Managing Chrome AI API States
The Chrome AI APIs (Summarizer and Translator) can be in different states: 'readily' available, needs downloading, or not available.

### Solution:
Implemented a robust state checking and handling system:
```javascript
javascript:sidepanel.js
// Check API availability and handle different states
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
// Show download progress to user
summarizer.addEventListener('downloadprogress', (e) => {
outputElement.innerText = Loading summarizer: ${Math.round((e.loaded / e.total) * 100)}%;
});
await summarizer.ready;
}
```
### Challenge 2: Language Package Download Handling
Users might not have required language packages installed for translation.

### Solution:
Implemented clear user feedback and download progress monitoring:
```javascript
javascript:sidepanel.js
async function handleTranslation(textToTranslate, targetLang = null) {
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
outputElement.innerText = Loading translator: ${Math.round((e.loaded / e.total) * 100)}%;
});
await translator.ready;
}
} catch (error) {
outputElement.innerText = textToTranslate + '\n\nDownloading the language package, please refresh the page!';
}
}
```

### Challenge 3: Creating an Intuitive Selection Popup
Needed to create a non-intrusive popup with direct action buttons after text selection.

### Solution:
Implemented a floating popup that appears near the selected text:
```javascript   
javascript:content-script.js
showPopup(x, y, text) {
this.removePopup();
const popup = document.createElement('div');
popup.className = 'smart-summary-popup';
popup.innerHTML = <div class="popup-buttons-container"> <button class="smart-summary-button" data-action="summarize-text">Summarise</button> <button class="smart-summary-button" data-action="summarize-and-translate">Summarise & Translate</button> </div> ;
// Position popup near selection
const popupRect = popup.getBoundingClientRect();
const viewportWidth = window.innerWidth;
const viewportHeight = window.innerHeight;
let finalX = x;
let finalY = y;
// Ensure popup stays within viewport
if (x + popupRect.width > viewportWidth) {
finalX = viewportWidth - popupRect.width - 10;
}
if (y + popupRect.height > viewportHeight) {
finalY = y - popupRect.height - 10;
}
popup.style.left = ${finalX}px;
popup.style.top = ${finalY}px;
}
```
### Challenge 4: Maintaining User Preferences
Needed to persist user's customization options between different text selections.

### Solution:
Implemented state management using Chrome's storage API and local variables:
```javascript
javascript:sidepanel.js
let currentTextToSummarize = '';
let currentShouldTranslate = false;
let lastSelectedLanguage = 'zh';
// Storage listener to maintain preferences
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
```
### Challenge 5: Real-time Updates in Side Panel
Needed to ensure the side panel updates immediately when new text is selected.

### Solution:
Implemented a message passing system between content script and service worker:
```javascript
javascript:service-worker.js
chrome.runtime.onMessage.addListener((message, sender, sendResponse) => {
if (message.action === 'storeSelection') {
storeSelection(message.data)
.then(() => sendResponse({ success: true }))
.catch(error => sendResponse({ success: false, error: error.message }));
return true;
}
if (message.action === 'openSidePanel') {
chrome.sidePanel.open({ tabId: sender.tab.id })
.then(() => sendResponse({ success: true }))
.catch(error => sendResponse({ success: false, error: error.message }));
return true;
}
});
```
These solutions not only addressed the technical challenges but also enhanced the overall user experience by providing:
- Clear feedback during API operations
- Seamless text selection and processing
- Persistent user preferences
- Smooth real-time updates

The combination of these solutions creates a robust and user-friendly extension that handles complex operations while maintaining a simple and intuitive interface.

## Accomplishments that I'm proud of
1. Created my first Chrome Extension that is fully functional and can address real-world problems I ran into when browsing websites
2. Developed an intuitive user interface that doesn't disrupt browsing using popup and side panel
3. Successfully integrated Chrome's cutting-edge AI APIs and handled different states
4. Implemented robust error handling and progress indicators

## What I learned
1. **Technical Skills**
   - Deep understanding of Chrome Extension architecture
   - Practical experience with Chrome's AI APIs
   - Popup and side panel UI design and implementation and how to use javascript to control the them
   - Advanced error handling in asynchronous operations

2. **Project Management**
   - Importance of modular code structure
   - Value of comprehensive error logging

## What's next for SmartOne
1. **Feature Enhancements**
   - History tracking for previous summaries
   - Additional language support
   - Custom summarization templates
   - Export and sharing capabilities
   - Offline mode support

2. **Technical Improvements**
   - Enhanced error recovery mechanisms
   - Improved performance optimization
   - Better memory management
   - Advanced caching strategies

3. **User Experience**
   - Customizable keyboard shortcuts
   - More summary format options
   - Enhanced accessibility features
   - User preference synchronization

The journey of SmartOne is just beginning, and I'm excited to continue evolving it based on user feedback and emerging technologies.

## Contributing
We welcome contributions! Please follow these steps:
1. Fork the repository
2. Create a feature branch
3. Commit your changes
4. Push to the branch
5. Create a Pull Request

## License
MIT License - See LICENSE file for details

## Acknowledgments
- Chrome Extensions team for the excellent API documentation
- Open source community for inspiration and support