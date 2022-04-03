// Functional programming is neat
function curry(func) {
	return function curried(...args) {
		if (args.length >= func.length) {
			return func.apply(this, args);
		} else {
			return function(...args2) {
				return curried.apply(this, args.concat(args2));
			}
		}
	};
}

color_map = {
    "FF4500": 2,   // bright red
    "FFA800": 3,   // orange
    "FFD635": 4,   // yellow
    "00A368": 6,   // darker green
    "7EED56": 8,   // lighter green
    "2450A4": 12,  // darkest blue
    "3690EA": 13,  // medium normal blue
    "51E9F4": 14,  // cyan
    "811E9F": 18,  // darkest purple
    "B44AC0": 19,  // normal purple
    "FF99AA": 23,  // pink
    "9C6926": 25,  // brown
    "000000": 27,  // black
    "898D90": 29,  // grey
    "D4D7D9": 30,  // light grey
    "FFFFFF": 31,  // white
}

function fetch_canvas_url(cont, auth) {
	ws = new WebSocket("wss://gql-realtime-2.reddit.com/query");
	ws.onerror = function(err) { console.log(err) }
	ws.onopen = function () {
		ws.onmessage = function (msg) {
			console.log("received ws message: ", JSON.parse(msg.data));
			if (JSON.parse(msg.data)["type"] == "ka") {
				ws.onmessage = function (msg) {
					ws.close()
					let image_url = JSON.parse(msg.data).payload.data.subscribe.data.name;
					cont(image_url)
				}
				ws.send(JSON.stringify({
					"id": "2",
					"type": "start",
					"payload": {
						"variables": {
							"input": {
								"channel": {
									"teamOwner": "AFD2022",
									"category": "CANVAS",
									"tag": "0",
								}
							}
						},
						"extensions": {},
						"operationName": "replace",
						"query": "subscription replace($input: SubscribeInput!) {\n  subscribe(input: $input) {\n    id\n    ... on BasicMessage {\n      data {\n        __typename\n        ... on FullFrameMessageData {\n          __typename\n          name\n          timestamp\n        }\n        ... on DiffFrameMessageData {\n          __typename\n          name\n          currentTimestamp\n          previousTimestamp\n        }\n      }\n      __typename\n    }\n    __typename\n  }\n}\n",
					},
				}))
			}
		}
		ws.send(JSON.stringify({
			"type": "connection_init",
			"payload": { "Authorization": auth },
		}))
	}
}

function load_image_url(cont, url) {
	var image = document.createElement("img");
	image.onload = () => {
		cont(image)
	}
	image.src = url
	image.setAttribute("crossorigin", "")
}

function extract_image_section_data(image, x, y, dx, dy) {
	var canvas = document.createElement('canvas')
	canvas.width = image.width
	canvas.height = image.height
	var ctx = canvas.getContext('2d')
	ctx.drawImage(image, 0, 0)
	return ctx.getImageData(x, y, dx, dy)
}
function get_board_image(cont, auth, x, y, dx, dy) {
	image_data_section_from_url = curry(load_image_url)((image) => {
		cont(extract_image_section_data(image, x, y, dx, dy))
	})
	fetch_canvas_url(image_data_section_from_url, auth)
}
function get_reference_image(cont, reference_url, width, height) {
	load_image_url((image) => {
		cont(extract_image_section_data(image, 0, 0, width, height))
	}, reference_url)
}

var ifrm = document.createElement("iframe");
window.addEventListener('message', (msg) => {
	if (msg.data.design) {
		if (document.design != msg.data.design) {
			document.design = msg.data.design
			console.log("Found new design:", msg.data.design)
		}
	}
}, false);
window.setInterval(function() {
	reloadDesignFrame()
}, 300000);
function reloadDesignFrame() {
	// document.body.removeChild(ifrm);
	ifrm = document.createElement("iframe");
	ifrm.setAttribute("src", "https://zyansheep.github.io/placemonero/index.html");
	document.body.appendChild(ifrm);
	console.log('Fetching latest design..');
}
reloadDesignFrame()

function calculate_changes(current_image, reference_image) {
	function toHexString(byteArray) {
		var s = '0x';
		byteArray.forEach(function(byte) {
			s += ('0' + (byte & 0xFF).toString(16)).slice(-2);
		});
		return s;
	}
	
	changes = []
	let cur_array = current_image.data;
	let ref_array = reference_image.data;
	for (let i = 0; i < cur_array.length; i += 4) {
		if (changes.length >= 400) { return changes }
		let cur_array_slice = cur_array.slice(i, i + 4);
		let ref_array_slice = ref_array.slice(i, i + 4);
		if (cur_array_slice.every((value, index) => value !== ref_array_slice[index])) {
			let hex_color = toHexString(reference_image.data.slice(i, i + 4))
			let color = color_map[hex_color.toUpperCase()];
			if (color) {
				let col_index = i / 4;
				changes.push({ x: col_index % reference_image.width, y: Math.floor(col_index / reference_image.width), color })
			}
		}
	}
	return changes
}

function select_change(changes) {
	return changes[Math.floor(Math.random() * changes.length)];
}

function send_change(cont, auth, x, y, color) {
    fetch("https://gql-realtime-2.reddit.com/query", {
    "headers": {
        "accept": "*/*",
        "authorization": auth,
        "content-type": "application/json",
    },
    "body": `{\"operationName\":\"setPixel\",\"variables\":{\"input\":{\"actionName\":\"r/replace:set_pixel\",\"PixelMessageData\":{\"coordinate\":{\"x\":${x},\"y\":${y}},\"colorIndex\":${color},\"canvasIndex\":0}}},\"query\":\"mutation setPixel($input: ActInput!) {\\n  act(input: $input) {\\n    data {\\n      ... on BasicMessage {\\n        id\\n        data {\\n          ... on GetUserCooldownResponseMessageData {\\n            nextAvailablePixelTimestamp\\n            __typename\\n          }\\n          ... on SetPixelResponseMessageData {\\n            timestamp\\n            __typename\\n          }\\n          __typename\\n        }\\n        __typename\\n      }\\n      __typename\\n    }\\n    __typename\\n  }\\n}\\n\"}`,
    "method": "POST"
	}).then(cont)
}

var override_ineffective = false;
function check_map_and_place(auth_token) {
	if (document.design) {
		let design = document.design;
		get_board_image((current_image) => {
			get_reference_image((reference_image) => {
				let changes = calculate_changes(current_image, reference_image);
				if (changes.length > 0) {
					console.log(changes.length + " changes found");
					if (changes.length >= 400) {
						if (override_ineffective) {
							console.log("There are many changes, but we persevere anyway")
						} else {
							console.log("There are too many changes, the design may be old")
							return
						}
					} else if (override_ineffective) { override_ineffective = false }
					let change = select_change(changes)
					change.x += design.x;
					change.y += design.y;
					console.log("Changing Pixel:", change);
					send_change((resp) => {}, change.x, change.y, change.color)
				} else {
					console.log("No unmatching pixels found")
				}
				
			}, design.url, design.width, design.height)
		}, auth_token, design.x, design.y, design.width, design.height)
	} else {
		console.error("No design received from iframe")
	}
}
check_map_and_place(auth)
setInterval(() => {
	check_map_and_place(auth)
}, 302000)