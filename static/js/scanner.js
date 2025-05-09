document.addEventListener('DOMContentLoaded', function() {
  const scanForm = document.getElementById('scan-form');
  const urlInput = document.getElementById('url-input');
  const loadingSection = document.getElementById('loading');
  const resultsSection = document.getElementById('results');
  const scannedUrlEl = document.getElementById('scanned-url');
  const scanTimeEl = document.getElementById('scan-time');
  const threatLevelEl = document.getElementById('threat-level');
  const copyUrlButton = document.getElementById('copy-url');
  const newScanButton = document.getElementById('new-scan-button');
  const shareResultsButton = document.getElementById('share-results-button');
  const clearHistoryButton = document.getElementById('clear-history');
  const historySection = document.getElementById('scan-history');
  
  // Handlers for scan form submission
  scanForm.addEventListener('submit', function(e) {
    e.preventDefault();
    const url = urlInput.value.trim();
    
    if (!url) {
      showAlert('Please enter a URL to scan');
      return;
    }
    
    // Show loading animation
    loadingSection.classList.remove('hidden');
    resultsSection.classList.add('hidden');
    
    // Send API request
    scanUrl(url);
  });
  
  // Handle scan URL through API
  function scanUrl(url) {
    const formData = new FormData();
    formData.append('url', url);
    
    fetch('/scan', {
      method: 'POST',
      body: formData
    })
    .then(response => {
      if (!response.ok) {
        return response.json().then(err => { throw err; });
      }
      return response.json();
    })
    .then(data => {
      displayResults(data);
      updateHistory(data);
    })
    .catch(error => {
      loadingSection.classList.add('hidden');
      showAlert(error.error || 'Error scanning URL. Please try again.');
    });
  }
  
  // Display scan results
  function displayResults(data) {
    // Hide loading, show results
    loadingSection.classList.add('hidden');
    resultsSection.classList.remove('hidden');
    
    // Update UI with scan data
    scannedUrlEl.textContent = data.url;
    scanTimeEl.textContent = data.time;
    
    // Update threat level
    threatLevelEl.className = 'threat-badge';
    let iconClass = '';
    
    switch (data.threat_level) {
      case 'Safe':
        threatLevelEl.classList.add('safe');
        iconClass = 'fa-shield-check';
        break;
      case 'Low Risk':
        threatLevelEl.classList.add('low-risk');
        iconClass = 'fa-exclamation';
        break;
      case 'Moderate Risk':
        threatLevelEl.classList.add('moderate-risk');
        iconClass = 'fa-exclamation-triangle';
        break;
      case 'High Risk':
        threatLevelEl.classList.add('high-risk');
        iconClass = 'fa-skull-crossbones';
        break;
    }
    
    threatLevelEl.innerHTML = `<i class="fas ${iconClass}"></i><span>${data.threat_level}</span>`;
    
    // Update stat counts
    document.querySelector('#harmless-stat .stat-count').textContent = data.stats.harmless;
    document.querySelector('#suspicious-stat .stat-count').textContent = data.stats.suspicious;
    document.querySelector('#malicious-stat .stat-count').textContent = data.stats.malicious;
    document.querySelector('#undetected-stat .stat-count').textContent = data.stats.undetected;
  }

  // Update history section with new scan
  function updateHistory(data) {
    const historyItem = createHistoryItem(data);
    const historyList = historySection.querySelector('.history-list');
    
    if (!historyList) {
      // Create new history list if it doesn't exist
      const newHistoryList = document.createElement('div');
      newHistoryList.className = 'history-list';
      newHistoryList.appendChild(historyItem);
      historySection.innerHTML = '';
      historySection.appendChild(newHistoryList);
      
      // Show clear history button
      if (clearHistoryButton) {
        clearHistoryButton.style.display = 'flex';
      }
    } else {
      // Add new item to existing list
      historyList.insertBefore(historyItem, historyList.firstChild);
    }
  }

  // Create history item element
  function createHistoryItem(data) {
    const item = document.createElement('div');
    item.className = 'history-item';
    item.dataset.url = data.url;
    item.dataset.stats = JSON.stringify(data.stats);

    let iconClass = '';
    let indicatorClass = '';
    
    switch (data.threat_level) {
      case 'Safe':
        iconClass = 'fa-shield-check';
        indicatorClass = 'safe';
        break;
      case 'Low Risk':
        iconClass = 'fa-exclamation';
        indicatorClass = 'low-risk';
        break;
      case 'Moderate Risk':
        iconClass = 'fa-exclamation-triangle';
        indicatorClass = 'moderate-risk';
        break;
      case 'High Risk':
        iconClass = 'fa-skull-crossbones';
        indicatorClass = 'high-risk';
        break;
    }

    item.innerHTML = `
      <div class="history-threat-indicator ${indicatorClass}">
        <i class="fas ${iconClass}"></i>
      </div>
      <div class="history-info">
        <div class="history-url">${data.url}</div>
        <div class="history-meta">
          <span class="history-time">${data.time}</span>
          <span class="history-status ${indicatorClass}">${data.threat_level}</span>
        </div>
      </div>
      <button class="history-action" aria-label="View details">
        <i class="fas fa-chevron-right"></i>
      </button>
    `;

    return item;
  }
  
  // Copy URL to clipboard
  copyUrlButton.addEventListener('click', function() {
    const urlText = scannedUrlEl.textContent;
    navigator.clipboard.writeText(urlText).then(() => {
      showToast('URL copied to clipboard');
    });
  });
  
  // Start a new scan
  newScanButton.addEventListener('click', function() {
    resultsSection.classList.add('hidden');
    scanForm.reset();
    urlInput.focus();
  });
  
  // Share results
  shareResultsButton.addEventListener('click', function() {
    if (navigator.share) {
      navigator.share({
        title: 'URL Scan Results',
        text: `Scan results for ${scannedUrlEl.textContent}: ${threatLevelEl.textContent}`,
        url: window.location.href
      })
      .catch(error => {
        console.error('Error sharing results:', error);
      });
    } else {
      const shareText = `Scan results for ${scannedUrlEl.textContent}: ${threatLevelEl.textContent}`;
      navigator.clipboard.writeText(shareText).then(() => {
        showToast('Results copied to clipboard for sharing');
      });
    }
  });
  
  // Clear history
  if (clearHistoryButton) {
    clearHistoryButton.addEventListener('click', function() {
      if (confirm('Are you sure you want to clear all scan history?')) {
        fetch('/clear_history', {
          method: 'POST'
        })
        .then(response => response.json())
        .then(() => {
          historySection.innerHTML = `
            <div class="empty-history">
              <i class="fas fa-history"></i>
              <p>No scan history available</p>
            </div>
          `;
          clearHistoryButton.style.display = 'none';
        });
      }
    });
  }
  
  // Clicking on history items
  document.addEventListener('click', function(e) {
    const historyItem = e.target.closest('.history-item');
    if (historyItem) {
      const url = historyItem.dataset.url;
      urlInput.value = url;
      document.querySelector('.scan-section').scrollIntoView({ behavior: 'smooth' });
    }
  });
  
  // Show toast notification
  function showToast(message) {
    const toast = document.createElement('div');
    toast.className = 'toast';
    toast.textContent = message;
    
    Object.assign(toast.style, {
      position: 'fixed',
      bottom: '20px',
      right: '20px',
      backgroundColor: 'var(--blue-600)',
      color: 'white',
      padding: '10px 20px',
      borderRadius: '4px',
      boxShadow: '0 2px 10px rgba(0,0,0,0.1)',
      zIndex: '1000',
      transition: 'all 0.3s ease',
      opacity: '0',
      transform: 'translateY(10px)'
    });
    
    document.body.appendChild(toast);
    
    setTimeout(() => {
      toast.style.opacity = '1';
      toast.style.transform = 'translateY(0)';
    }, 10);
    
    setTimeout(() => {
      toast.style.opacity = '0';
      toast.style.transform = 'translateY(10px)';
      
      setTimeout(() => {
        document.body.removeChild(toast);
      }, 300);
    }, 3000);
  }
  
  // Show alert message
  function showAlert(message) {
    const alert = document.createElement('div');
    alert.className = 'alert';
    alert.innerHTML = `
      <div class="alert-content">
        <i class="fas fa-exclamation-circle"></i>
        <span>${message}</span>
      </div>
      <button class="alert-close">&times;</button>
    `;
    
    Object.assign(alert.style, {
      position: 'fixed',
      top: '20px',
      left: '50%',
      transform: 'translateX(-50%)',
      backgroundColor: '#FEF2F2',
      color: '#EF4444',
      padding: '10px 20px',
      borderRadius: '4px',
      boxShadow: '0 2px 10px rgba(0,0,0,0.1)',
      zIndex: '1000',
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'space-between',
      maxWidth: '90%',
      width: '400px'
    });
    
    const alertContent = alert.querySelector('.alert-content');
    Object.assign(alertContent.style, {
      display: 'flex',
      alignItems: 'center',
      gap: '10px'
    });
    
    const closeButton = alert.querySelector('.alert-close');
    Object.assign(closeButton.style, {
      background: 'none',
      border: 'none',
      color: '#EF4444',
      fontSize: '1.25rem',
      cursor: 'pointer'
    });
    
    closeButton.addEventListener('click', function() {
      document.body.removeChild(alert);
    });
    
    document.body.appendChild(alert);
    
    setTimeout(() => {
      if (document.body.contains(alert)) {
        document.body.removeChild(alert);
      }
    }, 5000);
  }
});
