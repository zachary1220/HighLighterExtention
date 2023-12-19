//contentScript.js
//version:1.3.0
//支持在网页上选中词汇，点击鼠标右键可添加到词典，可以修改已存在的词汇或删除已有词汇
//修改词典后需要再次点击插件上的高亮按钮
let dictionaryData; // 在全局范围内定义变量
let wordsToHighlight;
let refreshFlag = true;
dictionaryData = JSON.parse(localStorage.getItem("dictionaryData"));
if (dictionaryData !== null) {
  console.log("init dictionary done");
} else {
  console.log("init dictionary failed");
}
document.body.onload = function() {
  //通知backgroud页面已加载完毕
  console.log("DOMContentLoaded")
  chrome.runtime.sendMessage({ action: "pageLoaded" });

  // 创建一个 MutationObserver 实例
  const observer = new MutationObserver(function(mutationsList, observer) {
    for (let mutation of mutationsList) {
        if (mutation.type === 'characterData' && mutation.target.wholeText!=='') {
          //childList暂不纳入监控//mutation.type === 'childList' || 
            //console.log('内容发生变化:', mutation.target);
            // 在这里可以添加你想要执行的操作
            refreshFlag = true
        }
    }
  });

  // 配置 MutationObserver 以监视整个文档的变化
  const config = { childList: true, subtree: true, characterData: true };

  // 将整个文档传递给观察者，并开始观察变化
  observer.observe(document.body, config);
}





// 在选中文本时发送消息给 background script
document.body.addEventListener("mouseup", function(event) {
  let selectedText = window.getSelection().toString().trim();
  if (selectedText !== "") {
    chrome.runtime.sendMessage({ action: "addToDictionaryClicked", text: selectedText }, function(response) {
      if (chrome.runtime.lastError) {
        console.error(chrome.runtime.lastError.message);
      } else {
        console.log("Message sent. Response:", response);
      }
    });
  }
});



chrome.runtime.onMessage.addListener(function (request, sender, sendResponse) {
  // Inside the 'loadDictionary' action block
  if (request.action === "loadDictionary") {
    console.log("start loadDictionary");
    loadDictionary();
  }
  //Inside the 'exportDictionary' action block
  if (request.action === "exportDictionary") {
    console.log("start exportDictionary");
    exportDictionary();
  }
  // Inside the 'updateLocalStorage' action block
  if (request.action === "updateLocalStorage") {
    console.log("start updateLocalStorage:"+request.text);
    updateLocalStorage(request.text);
    sendResponse({ text: "success" });
    refreshFlag = true
  }
  // Inside the 'delFromLocalStorage' action block
  if (request.action === "delFromLocalStorage") {
    console.log("start delFromLocalStorage:"+request.text);
    delFromLocalStorage(request.text);
    //词典更新后需要重新传给dictionaryData变量
    dictionaryData = JSON.parse(localStorage.getItem("dictionaryData"));
    sendResponse({ text: "success" });
    refreshFlag = true
  }
  // Inside the 'refreshHighlight' action block
  if (request.action === "refreshHighlight") {
    sendResponse({ text: "success" });
    console.log("deal with refreshHighlight:"+refreshFlag);
    if(refreshFlag) {
      console.log("start refreshHighlight");
      highLightWords();
    }
    
    
  }

  if (request.action === "highlightWords") {
    // 使用加载的词典数据进行相应操作
    if (dictionaryData) {
      console.log("start highLightWords with dictionary");
      highLightWords();
    } else {
      // 处理数据不存在的情况
      console.log("No dictionary data found in localStorage");
      loadDictionary();
    }
  }
});

function isHighlighted(node) {
  return (
    node.parentNode.tagName === "SPAN" &&
    node.parentNode.style.textDecoration === "underline" &&
    node.parentNode.style.textDecorationStyle === "wavy" &&
    node.parentNode.style.textDecorationColor === "orange"
  );
}
function highLightWords() {
  wordsToHighlight = dictionaryData;
  console.log("dictionary loaded");

  // 移除所有已存在的高亮样式
  const highlightedWords = document.querySelectorAll("span[style*='text-decoration: underline wavy orange;']");
  //console.log(highlightedWords)
  highlightedWords.forEach((highlightedWord) => {
    const parent = highlightedWord.parentNode;
    const textNode = document.createTextNode(highlightedWord.textContent.trim());
    parent.replaceChild(textNode, highlightedWord);
  });

  // 执行原有的高亮逻辑
  const textNodes = getTextNodes();
  const rangesToHighlight = [];

  textNodes.forEach((node) => {
    wordsToHighlight.forEach((word) => {
      const reg = new RegExp(word.name, "gi");
      let match;
      while ((match = reg.exec(node.textContent)) !== null) {
        const range = document.createRange();
        range.setStart(node, match.index);
        range.setEnd(node, match.index + word.name.length);
        rangesToHighlight.push({ range, word });
      }
    });
  });

  rangesToHighlight.forEach(({ range, word }) => {
    const span = document.createElement("span");
    span.textContent = range.toString();
    span.style.textDecoration = "underline";
    span.style.textDecorationStyle = "wavy";
    span.style.textDecorationColor = "orange";
    range.deleteContents();
    range.insertNode(span);
  });

  document.body.addEventListener("mouseover", function (event) {
    const target = event.target;
    if (target.tagName === "SPAN" && !isHighlighted(target.firstChild)) {
      const word = getWordDescription(target.textContent.trim(), wordsToHighlight);
      if (word) {
        showTooltip(word.name + ": " + word.desc);
        target.style.cursor = "pointer";
      }
    }
  });

  document.body.addEventListener("mouseout", function (event) {
    const target = event.target;
    if (target.tagName === "SPAN") {
      hideTooltip();
      target.style.cursor = "";
    }
  });
  refreshFlag = false;
}


function loadDictionary() {
  // Open a file input dialog to allow the user to select a local JSON file
  const input = document.createElement("input");
  input.type = "file";
  input.accept = "application/json";

  input.addEventListener("change", function (event) {
    const file = event.target.files[0];
    const reader = new FileReader();

    reader.onload = function (event) {
      const fileContent = event.target.result;
      try {
        // Parse JSON content and store it in localStorage
        const jsonData = JSON.parse(fileContent);
        localStorage.setItem("dictionaryData", JSON.stringify(jsonData));
        dictionaryData = jsonData; // Update the global variable
        console.log("Dictionary data loaded successfully");
        highLightWords();
        console.log("Words highlight complete");
      } catch (error) {
        console.error("Error parsing JSON file:", error);
      }
    };

    reader.readAsText(file);
  });

  input.click(); // Simulate click on the file input element to trigger file selection
}

function exportDictionary() {
  const jsonData = localStorage.getItem("dictionaryData");

  if (jsonData) {
    try {
      const fileContent = jsonData;
      const blob = new Blob([fileContent], { type: "application/json" });

      const a = document.createElement("a");
      a.href = URL.createObjectURL(blob);
      a.setAttribute("download", "dictionary.json");

      // Trigger a click event to prompt the user to save the file
      a.dispatchEvent(new MouseEvent("click"));
    } catch (error) {
      console.error("Error exporting dictionary:", error);
    }
  } else {
    console.error("No dictionary data found in localStorage");
  }
}

function updateLocalStorage(text) {
  if (dictionaryData) {
    const index = dictionaryData.findIndex((word) => word.name === text);

    if (index === -1) {
      const userInput = window.prompt("Enter description for the new word:");

      if (userInput !== null && userInput !== "") {
        const newWord = {
          name: text,
          desc: userInput,
          URL: window.location.href // Add the current webpage URL to the word properties
        };
        dictionaryData.push(newWord);
        localStorage.setItem("dictionaryData", JSON.stringify(dictionaryData));
        console.log("New word added to dictionary");
      } else {
        console.log("Description not provided. New word not added.");
      }
    } else {
      const currentDesc = dictionaryData[index].desc;
      const userInput = window.prompt(
        `Word already exists in dictionary! Current description: ${currentDesc}\nEnter new description:`
      );

      if (userInput !== null) {
        dictionaryData[index].desc = userInput;
        localStorage.setItem("dictionaryData", JSON.stringify(dictionaryData));
        console.log("Description updated for existing word");
      } else {
        console.log("Description not updated.");
      }
    }
  } else {
    const userInput = window.prompt("Enter description for the new word:");

    if (userInput !== null && userInput !== "") {
      const newWord = {
        name: text,
        desc: userInput,
        URL: window.location.href // Add the current webpage URL to the word properties
      };
      dictionaryData = [];
      dictionaryData.push(newWord);
      localStorage.setItem("dictionaryData", JSON.stringify(dictionaryData));
      console.log("New word added to dictionary");
    } else {
      console.log("Description not provided. New word not added.");
    }
  }
}

function delFromLocalStorage(text) {
  if (dictionaryData) {
    // 在现有的字典数据中查找要更新的单词
    const index = dictionaryData.findIndex((word) => word.name === text);

    if (index === -1) {
      // 如果单词不存在，提示用户
      alert("Can't remove a word that does not exist");
    } else {
      // 如果词汇已存在，弹出确认框，用户点击确认时才删除该词汇
      const confirmed = window.confirm("Are you sure you want to remove this word?【"+text+"】");
      
      if (confirmed) {
        dictionaryData.splice(index, 1);
        localStorage.setItem("dictionaryData", JSON.stringify(dictionaryData));
        console.log("Word removed from dictionary");
      } else {
        console.log("Word removal cancelled");
      }
    }
  } else {
    console.log("No dictionary data found in localStorage");
  }
}






function getTextNodes() {
  const textNodes = [];

  function traverse(node) {
    if (node.nodeType === 3) {
      textNodes.push(node);
    } else {
      for (let i = 0; i < node.childNodes.length; i++) {
        traverse(node.childNodes[i]);
      }
    }
  }

  traverse(document.body);
  return textNodes;
}

function getWordDescription(text, wordsToHighlight) {
  return wordsToHighlight.find((word) => word.name === text);
}

// Functions to show and hide tooltip
function showTooltip(content) {
  const tooltip = document.createElement("div");
  tooltip.className = "tooltip";
  tooltip.textContent = content;
  tooltip.style.position = "fixed";
  tooltip.style.backgroundColor = "rgba(0, 0, 0, 0.7)";
  tooltip.style.color = "#fff";
  tooltip.style.padding = "8px";
  tooltip.style.borderRadius = "4px";
  tooltip.style.zIndex = "9999";

  // Calculate tooltip position relative to the cursor
  const mouseX = window.event.clientX;
  const mouseY = window.event.clientY;
  const tooltipWidth = 120; // Set tooltip width

  // Position the tooltip to the right of the cursor
  tooltip.style.left = `${mouseX + 15}px`; // Adjust 15px to provide spacing from the cursor
  tooltip.style.top = `${mouseY}px`;

  // Append tooltip to the body
  document.body.appendChild(tooltip);
}

function hideTooltip() {
  // Hide or remove the tooltip here
  const tooltip = document.querySelector(".tooltip");
  if (tooltip) {
    tooltip.remove();
  }
}
