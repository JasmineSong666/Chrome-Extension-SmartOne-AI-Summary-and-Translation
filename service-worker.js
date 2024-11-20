function setupContextMenu() {
    chrome.contextMenus.create({
      id: 'summarize-text',
      title: 'Summarise',
      contexts: ['selection']
    });
    chrome.contextMenus.create({
      id: 'summarize-and-translate',
      title: 'Summarise and Translate',
      contexts: ['selection']
    });
  }
  
  chrome.runtime.onInstalled.addListener(() => {
    setupContextMenu();
  });
  
  // Handle context menu clicks
  chrome.contextMenus.onClicked.addListener((data, tab) => {
    storeSelection({
      text: data.selectionText,
      actionType: data.menuItemId,
      timestamp: Date.now()
    }, tab.id).then(() => {
      chrome.sidePanel.open({ tabId: tab.id });
    });
  });
  
  // Store selection data
  async function storeSelection(data) {
    try {
      await chrome.storage.session.set({ 
        lastTextToSummarize: data.text,
        action: data.actionType,
        timestamp: data.timestamp
      });
      return true;
    } catch (error) {
      console.error('Error storing selection:', error);
      return false;
    }
  }
  
  // Handle messages from content script
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
  