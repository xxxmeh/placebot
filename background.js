if (typeof browser === "undefined") {
    var browser = chrome;
}

// Listen for token
var token = undefined;
var listener = browser.webRequest.onSendHeaders.addListener(
    function(object) {
        object.requestHeaders.forEach(function(header) {
            if (header.name == "authorization") {
                token = header.value;
                browser.webRequest.onSendHeaders.removeListener(listener);
                chrome.tabs.sendMessage(object.tabId, token);
            }
        });
    },
    { urls: ["<all_urls>"] },
    ["requestHeaders"]
);
