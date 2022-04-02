if (typeof browser === "undefined") {
    var browser = chrome;
}

var url = window.location.href;
var token = undefined;

// Background script will send token
browser.runtime.onMessage.addListener(function (msg, sendResponse) {
    token = msg;
    console.log("token", token);

    // HERE YOU MIGHT WANT TO ADD AUTOMATION
});

// Refresh page after an hour (I think the token is only available when loading the page, and the token might expire)
setInterval(function () { window.location.reload(); }, 3600000);
