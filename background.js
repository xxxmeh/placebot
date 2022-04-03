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

function load_image_url(cont, url) {
	console.log("fetching image:", url);
	fetch(url).then(r => r.blob()).then(blob => createImageBitmap(blob)).then(cont)
}

function extract_image_section_data(image, x, y, dx, dy) {
	console.log("extracting image:", image)
	var canvas = new OffscreenCanvas(image.width, image.height)
	canvas.width = image.width;
	canvas.height = image.height;
	var ctx = canvas.getContext('2d')
	ctx.drawImage(image, 0, 0)
	let data = Array.from(ctx.getImageData(x, y, dx, dy).data);
	console.log("pixel data:", data)
	return data
}

browser.runtime.onMessage.addListener(
	function(request, sender, sendResponse) {
		if (request.contentScriptQuery == 'getImage') {
			load_image_url((image) => {
				sendResponse(extract_image_section_data(image, request.x, request.y, request.dx, request.dy))
			}, request.url)
			return true;  // Will respond asynchronously.
		} else {
			return false;
		}
	}
);