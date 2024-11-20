class PopupManager {
    constructor() {
      this.popup = null;
      this.init();
    }
  
    init() {
      document.addEventListener('mouseup', this.handleSelection.bind(this));
      document.addEventListener('mousedown', this.handleClick.bind(this));
      window.addEventListener('scroll', () => this.removePopup());
    }
  
    handleSelection(event) {
      if (event.target.closest('.smart-summary-popup')) {
        return;
      }
  
      const selection = window.getSelection();
      const text = selection.toString().trim();
  
      if (text) {
        const range = selection.getRangeAt(0);
        const rect = range.getBoundingClientRect();
        
        const x = event.pageX + 5;
        const y = event.pageY + 5;
  
        this.showPopup(x, y, text);
      } else {
        this.removePopup();
      }
    }
  
    handleClick(event) {
      if (!event.target.closest('.smart-summary-popup')) {
        this.removePopup();
      }
    }
  
    async handleButtonClick(action, text) {
      try {
        await chrome.runtime.sendMessage({ 
          action: 'storeSelection',
          data: {
            text: text,
            actionType: action,
            timestamp: Date.now()
          }
        });
  
        await chrome.runtime.sendMessage({ 
          action: 'openSidePanel'
        });
  
        this.removePopup();
      } catch (error) {
        console.error('Error handling button click:', error);
      }
    }
  
    showPopup(x, y, text) {
      this.removePopup();
  
      const popup = document.createElement('div');
      popup.className = 'smart-summary-popup';
      popup.innerHTML = `
        <div class="popup-buttons-container">
          <button class="smart-summary-button" data-action="summarize-text">Summarise</button>
          <button class="smart-summary-button" data-action="summarize-and-translate">Summarise & Translate</button>
        </div>
      `;
  
      popup.querySelectorAll('button').forEach(button => {
        button.addEventListener('click', async (e) => {
          e.preventDefault();
          e.stopPropagation();
          const action = button.dataset.action;
          await this.handleButtonClick(action, text);
        });
      });
  
      document.body.appendChild(popup);
      this.popup = popup;
  
      const popupRect = popup.getBoundingClientRect();
      const viewportWidth = window.innerWidth;
      const viewportHeight = window.innerHeight;
  
      let finalX = x;
      let finalY = y;
  
      if (x + popupRect.width > viewportWidth) {
        finalX = viewportWidth - popupRect.width - 10;
      }
      if (y + popupRect.height > viewportHeight) {
        finalY = y - popupRect.height - 10;
      }
  
      popup.style.left = `${finalX}px`;
      popup.style.top = `${finalY}px`;
    }
  
    removePopup() {
      if (this.popup) {
        this.popup.remove();
        this.popup = null;
      }
    }
  }
  
  const popupManager = new PopupManager();
  
  window.addEventListener('error', (event) => {
    console.error('Content script error:', event.error);
    popupManager.removePopup();
  });