let selectedText//定义全局变量
let setIntervalFlag = true
chrome.runtime.onInstalled.addListener(function () {
    chrome.contextMenus.create({
      title: "添加到词典",
      contexts: ["selection"],
      id: "addToDictionary",
    });
    chrome.contextMenus.create({
        title: "从词典中删除",
        contexts: ["selection"],
        id: "delFromDictionary",
      });
  });
  
  
// 监听来自 content script 的消息
chrome.runtime.onMessage.addListener(function (request, tabs, sendResponse) {
    console.log("pageLoaded")
    if(request.action === "pageLoaded") {
        if(setIntervalFlag) {
            // 调用函数开始执行
            highlightEvery2Seconds(tabs.tab.id);
            setIntervalFlag = false;
        }
    }
    if(request.action === "addToDictionaryClicked") {
        // 在这里处理接收到的文本信息，可以执行相应的操作或者返回响应
        selectedText = request.text
        sendResponse(request.text);
        
        
    }

});

// 处理右键菜单点击事件
chrome.contextMenus.onClicked.addListener(function (info, tab) {
if (info.menuItemId === "addToDictionary") {
    // 将选中的文本添加到词典中
    addToDictionary(info.selectionText);
}else if(info.menuItemId === "delFromDictionary"){
    // 将选中的文本从词典中删除
    delFromDictionary(info.selectionText);
}
});

// 添加到词典的函数
function addToDictionary(text) {
// 在这里实现将文本添加到词典的逻辑
console.log("添加到词典：" + text);
// 此处可以进行添加到词典的具体操作
// 发送消息到 content script
chrome.tabs.query({ active: true, currentWindow: true }, function(tabs) {
    chrome.tabs.sendMessage(tabs[0].id, { action: "updateLocalStorage", text: selectedText }, function(response) {
        console.log("Message sent to content script:", response);
    });
});

}

// 删除词典中的词汇的函数
function delFromDictionary(text) {
    // 在这里实现将文本从词典中删除的逻辑
    console.log("从词典中删除：" + text);
    
    // 发送消息到 content script
    chrome.tabs.query({ active: true, currentWindow: true }, function(tabs) {
        console.log(tabs[0].id);
        chrome.tabs.sendMessage(tabs[0].id, { action: "delFromLocalStorage", text: selectedText }, function(response) {
            console.log("Message sent to content script:", response);
        });
    });
    
    }

function highlightEvery2Seconds(tabid) {
    setInterval(function() {
        // 这里放置你的高亮标记功能的代码
        // 可以调用你之前编写的高亮标记函数或者相应的操作
        // 发送消息到 content script
        chrome.tabs.query({ active: true, currentWindow: true }, function(tabs) {
            chrome.tabs.sendMessage(tabid, { action: "refreshHighlight" }, function(response) {
                console.log("Message sent to content script:", response);
            });
        });
    }, 3000); // 设置时间间隔为 3000 毫秒（即 3 秒）
    }
    
    



  