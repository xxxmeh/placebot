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
				chrome.tabs.sendMessage(object.tabId, { token: token });
			}
		});
	},
	{ urls: ["<all_urls>"] },
	["requestHeaders"]
);

function load_image_url(url, cont) {
	fetch(url, {cache: "no-store"}).then(r => r.blob()).then(blob => createImageBitmap(blob)).then(cont)
}

function extract_images_section_data(images, canvas_width, canvas_height, x, y, dx, dy) {
	console.log("extracting image:", images)
	var canvas = new OffscreenCanvas(canvas_width, canvas_height)
	canvas.width = canvas_width;
	canvas.height = canvas_height;
	var ctx = canvas.getContext('2d')
	for (const image of images) {
		ctx.drawImage(image.image, image.x, image.y)
	}
	let data = Array.from(ctx.getImageData(x, y, dx, dy).data);
	console.log("pixel data:", data)
	return data
}

browser.runtime.onMessage.addListener(
	function(request, sender, sendResponse) {
		if (request.contentScriptQuery == 'getImage') {
			load_image_url(request.url, (image) => {
				sendResponse(extract_images_section_data([{ image: image, x: 0, y: 0 }], image.width, image.height, request.x, request.y, request.dx, request.dy))
			})
			return true
		} else if (request.contentScriptQuery == 'getBoard') {
			load_image_url(request.urls[0], (image1) => {
				load_image_url(request.urls[1], (image2) => {
					load_image_url(request.urls[2], (image3) => {
						load_image_url(request.urls[3], (image4) => {
							let images = [
								{ image: image1, x: 0, y: 0 },
								{ image: image2, x: 1000, y: 0 },
								{ image: image3, x: 0, y: 1000 },
								{ image: image4, x: 1000, y: 1000 },
							]
		
							sendResponse(extract_images_section_data(images, 2000, 2000, request.x, request.y, request.dx, request.dy))
						});
					});
				});
			});
			return true
		} else { return true }
	}
);