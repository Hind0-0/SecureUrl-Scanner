// Dynamically update favicon based on application state
document.addEventListener('DOMContentLoaded', function() {
  const faviconLink = document.querySelector('link[rel="icon"]') || document.createElement('link');
  
  if (!document.querySelector('link[rel="icon"]')) {
    faviconLink.rel = 'icon';
    faviconLink.type = 'image/svg+xml';
    document.head.appendChild(faviconLink);
  }
  
  // Default favicon
  updateFavicon('default');
  
  // Function to update favicon
  function updateFavicon(state) {
    let color = '#3b82f6'; // Default blue
    let icon = 'shield-check';
    
    if (state === 'scanning') {
      color = '#60a5fa';
      icon = 'loader';
    } else if (state === 'safe') {
      color = '#10b981';
      icon = 'shield-check';
    } else if (state === 'warning') {
      color = '#f59e0b';
      icon = 'alert-triangle';
    } else if (state === 'danger') {
      color = '#ef4444';
      icon = 'shield-off';
    }
    
    const svgContent = `
      <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="${color}" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
        ${getIconPath(icon)}
      </svg>
    `;
    
    faviconLink.href = 'data:image/svg+xml;base64,' + btoa(svgContent);
  }
  
  // Helper function to get the appropriate icon path
  function getIconPath(icon) {
    switch (icon) {
      case 'shield-check':
        return '<path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z"></path><path d="M9 12l2 2 4-4"></path>';
      case 'loader':
        return '<line x1="12" y1="2" x2="12" y2="6"></line><line x1="12" y1="18" x2="12" y2="22"></line><line x1="4.93" y1="4.93" x2="7.76" y2="7.76"></line><line x1="16.24" y1="16.24" x2="19.07" y2="19.07"></line><line x1="2" y1="12" x2="6" y2="12"></line><line x1="18" y1="12" x2="22" y2="12"></line><line x1="4.93" y1="19.07" x2="7.76" y2="16.24"></line><line x1="16.24" y1="7.76" x2="19.07" y2="4.93"></line>';
      case 'alert-triangle':
        return '<path d="M10.29 3.86L1.82 18a2 2 0 0 0 1.71 3h16.94a2 2 0 0 0 1.71-3L13.71 3.86a2 2 0 0 0-3.42 0z"></path><line x1="12" y1="9" x2="12" y2="13"></line><line x1="12" y1="17" x2="12.01" y2="17"></line>';
      case 'shield-off':
        return '<path d="M19.69 14a6.9 6.9 0 0 0 .31-2V5l-8-3-3.16 1.18"></path><path d="M4.73 4.73L4 5v7c0 6 8 10 8 10a20.29 20.29 0 0 0 5.62-4.38"></path><line x1="1" y1="1" x2="23" y2="23"></line>';
      default:
        return '<path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z"></path>';
    }
  }
  
  // Listen for scan state changes
  document.addEventListener('scanStateChange', function(e) {
    updateFavicon(e.detail.state);
  });
  
  // For demo purposes, we'll dispatch events when scanning starts/ends
  const scanForm = document.getElementById('scan-form');
  if (scanForm) {
    scanForm.addEventListener('submit', function() {
      document.dispatchEvent(new CustomEvent('scanStateChange', { 
        detail: { state: 'scanning' } 
      }));
    });
  }
  
  // Update favicon based on scan results
  const observer = new MutationObserver(function(mutations) {
    mutations.forEach(function(mutation) {
      if (mutation.target.id === 'threat-level' && !mutation.target.classList.contains('hidden')) {
        if (mutation.target.classList.contains('safe')) {
          document.dispatchEvent(new CustomEvent('scanStateChange', { 
            detail: { state: 'safe' } 
          }));
        } else if (mutation.target.classList.contains('low-risk')) {
          document.dispatchEvent(new CustomEvent('scanStateChange', { 
            detail: { state: 'warning' } 
          }));
        } else if (mutation.target.classList.contains('high-risk')) {
          document.dispatchEvent(new CustomEvent('scanStateChange', { 
            detail: { state: 'danger' } 
          }));
        }
      }
    });
  });
  
  const threatLevel = document.getElementById('threat-level');
  if (threatLevel) {
    observer.observe(threatLevel, { attributes: true, attributeFilter: ['class'] });
  }
});