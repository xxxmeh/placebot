if (typeof browser === "undefined") {
	var browser = chrome;
}

var design = undefined
var token = undefined;

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

function update_design(cont) {
	fetch("https://raw.githubusercontent.com/zyansheep/placebot/master/design.json").then((resp) => {
		if (!resp.ok) {
			throw new Error("HTTP error " + resp.status);
		}
		return resp.json();
		
	}).then(json => {
		design = json
		console.log("Received design:", design)
		cont()
	})
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

function get_board_image(cont, auth, x, y, dx, dy) {
	fetch_canvas_url((url) => {
		browser.runtime.sendMessage({contentScriptQuery: 'getImage', url, x, y, dx, dy }, cont)
	}, auth)
}

function get_reference_image(cont) {
	browser.runtime.sendMessage({contentScriptQuery: 'getImage', url: design.url, x: design.x, y: design.y, dx: design.width, dy: design.height }, cont);
}

const MAX_CHANGES = 1000;
function calculate_changes(current_image, reference_image) {
	function toHexString(byteArray) {
		var s = '0x';
		byteArray.forEach(function(byte) {
			s += ('0' + (byte & 0xFF).toString(16)).slice(-2);
		});
		return s;
	}
	
	var changes = []
	let cur_array = Object.values(current_image.data);
	let ref_array = Object.values(reference_image.data);
	for (let i = 0; i < cur_array.length; i += 4) {
		if (changes.length >= MAX_CHANGES) { return changes }
		let cur_array_slice = cur_array.slice(i, i + 4);
		let ref_array_slice = ref_array.slice(i, i + 4);
		if (cur_array_slice.every((value, index) => value !== ref_array_slice[index])) {
			let hex_color = toHexString(ref_array.slice(i, i + 4)).slice(2, 8)
			let color = color_map[hex_color.toUpperCase()];
			if (color) {
				let col_index = Math.floor(i / 4);
				changes.push({ x: col_index % design.width, y: Math.floor(col_index / design.width), color })
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
function check_map_and_place(cont) {
	console.log("Running Map Check")
	if (design !== undefined && token !== undefined) {
		get_board_image((current_image) => {
			console.log("loaded board image")
			get_reference_image((reference_image) => {
				console.log("Found both images")
				let changes = calculate_changes(current_image, reference_image);
				if (changes.length > 0) {
					console.log(changes.length + " changes found");
					if (changes.length >= MAX_CHANGES) {
						if (override_ineffective) {
							console.log("There are many changes, but we persevere anyway")
						} else {
							console.log("There are too many changes, the design may be old")
							cont()
							return
						}
					} else if (override_ineffective) { override_ineffective = false }
					let change = select_change(changes)
					change.x += design.x;
					change.y += design.y;
					console.log("Changing Pixel:", change);
					send_change((resp) => { cont() }, change.x, change.y, change.color)
				} else {
					console.log("No unmatching pixels found")
					cont()
				}
		
			}, design.url, design.width, design.height)
		}, token, design.x, design.y, design.width, design.height)
	} else {
		console.log("Missing: token or design", token, design)
		cont()
	}
}



// Background script will send token
browser.runtime.onMessage.addListener(function (msg, sendResponse) {
	token = msg;
	console.log("Extracted token: ", token);
	timeout_map_check()
});
update_design(timeout_map_check)

console.log("Hello Place!");

function timeout_map_check() {
	if (design !== undefined && token !== undefined) {
		setTimeout(() => {
			check_map_and_place(() => {
				console.log("Completed map check")
				timeout_map_check()
			})
		}, 10000);
	}
}
// Refresh page after an hour (I think the token is only available when loading the page, and the token might expire)
