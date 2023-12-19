// dict_manager.js
document.addEventListener('DOMContentLoaded', function() {

  const wordInput = document.getElementById('wordInput');
  const addWordButton = document.getElementById('addWordButton');
  const wordList = document.getElementById('wordList');

  const exportButton = document.getElementById('exportButton');
  const importFile = document.getElementById('importFile');
  const importButton = document.getElementById('importButton');

  addWordButton.addEventListener('click', function() {
    const newWord = wordInput.value.trim();
    if (newWord !== '') {
      const listItem = document.createElement('li');
      listItem.textContent = newWord;
      wordList.appendChild(listItem);
      wordInput.value = '';
  
      // 从本地加载现有的词汇列表
      chrome.runtime.getPackageDirectoryEntry(function(root) {
        root.getFile('dictionary.json', { create: true }, function(fileEntry) {
          fileEntry.file(function(file) {
            const reader = new FileReader();
            reader.onloadend = function() {
              let words = JSON.parse(reader.result) || [];
              words.push(newWord);
  
              // 将更新后的词汇列表写入到本地 JSON 文件中
              const blob = new Blob([JSON.stringify(words)], { type: 'application/json' });
              const fileWriter = new FileWriter(fileEntry);
              fileWriter.write(blob);
  
              console.log('Word added:', newWord);
            };
            reader.readAsText(file);
          });
        });
      });
    }
  });
  

  exportButton.addEventListener('click', function() {
    const words = Array.from(wordList.children).map(li => li.textContent);
    const json = JSON.stringify({ words });

    const blob = new Blob([json], { type: 'application/json' });
    const url = URL.createObjectURL(blob);

    const a = document.createElement('a');
    a.href = url;
    a.download = 'dictionary.json';
    a.click();
    URL.revokeObjectURL(url);
  });

  importButton.addEventListener('click', function() {
    const file = importFile.files[0];
    if (file) {
      const reader = new FileReader();
      reader.onload = function(event) {
        const content = event.target.result;
        try {
          const data = JSON.parse(content);
          const { words } = data;
          words.forEach(word => {
            const listItem = document.createElement('li');
            listItem.textContent = word;
            wordList.appendChild(listItem);
          });
        } catch (error) {
          console.error('Invalid file format');
        }
      };
      reader.readAsText(file);
    }
  });
});
