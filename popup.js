document.addEventListener('DOMContentLoaded', function() {
  document.getElementById('highlightButton').addEventListener('click', function() {
    chrome.tabs.query({ active: true, currentWindow: true }, function(tabs) {
      chrome.tabs.sendMessage(tabs[0].id, { action: 'highlightWords' });
    });
  });
});
document.addEventListener('DOMContentLoaded', function() {
  document.getElementById('loadButton').addEventListener('click', function() {
      chrome.tabs.query({ active: true, currentWindow: true }, function(tabs) {
        chrome.tabs.sendMessage(tabs[0].id, { action: 'loadDictionary' });
      });
    });
});
document.addEventListener('DOMContentLoaded', function() {
  document.getElementById('exportButton').addEventListener('click', function() {
      chrome.tabs.query({ active: true, currentWindow: true }, function(tabs) {
        chrome.tabs.sendMessage(tabs[0].id, { action: 'exportDictionary' });
      });
    });
});


