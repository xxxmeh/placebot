if (typeof browser === "undefined") {
	var browser = chrome;
}

var design = undefined
var token = undefined;
const version = 1.2

function notif(notification) {
	let elem = document.getElementsByTagName("h1")[0]
	elem.innerText = notification;
	elem.style.color = "red"
}
function notif_sub(notification) {
	let elem = document.getElementsByTagName("h2")[0]
	document.title = notification;
	elem.innerText = notification;
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

var minInterval = 302100;
var maxInterval = 1000000000;

function update_design(cont) {
	fetch("https://raw.githubusercontent.com/xxxmeh/placebot/master/design.json", {cache: "no-store"}).then((resp) => {
		if (!resp.ok) {
			throw new Error("HTTP error " + resp.status);
		}
		return resp.json();

	}).then(json => {
		design = json
		console.log("Received design:", design)
		if (design.stableVersion != version) {
			notif("YOUR VERSION IS OUTDATED! PLEASE UPDATE TO THE NEWEST ONE")
			notif_sub(`<a href="https://github.com/xxxmeh/placebot">https://github.com/xxxmeh/placebot</a>`);
		}
		cont(2000); // initial delay should hopefully be long enough to fetch down new design
	})
}

const CANVAS_REQUEST = {
    "id": "0",
    "type": "start",
    "payload": {
        "variables": {
            "input": {
                "channel": {
                    "teamOwner": "AFD2022",
                    "category": "CANVAS",
                    "tag": "0"
                }
            }
        },
        "extensions": {},
        "operationName": "replace",
        "query": "subscription replace($input: SubscribeInput!) {\n  subscribe(input: $input) {\n    id\n    ... on BasicMessage {\n      data {\n        __typename\n        ... on FullFrameMessageData {\n          __typename\n          name\n          timestamp\n        }\n        ... on DiffFrameMessageData {\n          __typename\n          name\n          currentTimestamp\n          previousTimestamp\n        }\n      }\n      __typename\n    }\n    __typename\n  }\n}\n"
    }
}

function fetch_canvas_urls(cont, auth) {
	let packet_id = 0;
	let urls = { "first": undefined, "second": undefined}
	ws = new WebSocket("wss://gql-realtime-2.reddit.com/query");
	ws.onerror = function (err) { console.log(err); notif_sub("WEBSOCKET ERROR (check console)") }
	ws.onopen = function () {
		ws.onmessage = function (msg) {
			console.log("received ws message: ", JSON.parse(msg.data));
			if (JSON.parse(msg.data)["type"] == "ka") {
				ws.onmessage = function (msg) {
					let image_url = JSON.parse(msg.data).payload.data.subscribe.data.name;
					if (image_url.includes("0-f-")) {
						console.log("Received first url:", image_url)
						urls.first = image_url;
					} else if (image_url.includes("1-f-")) {
						console.log("Received second url:", image_url)
						urls.second = image_url
					} else if (image_url.includes("2-f-")) {
						console.log("Received third url:", image_url)
						urls.third = image_url
					} else if (image_url.includes("3-f-")) {
						console.log("Received fourth url:", image_url)
						urls.fourth = image_url
					}
					if (urls.first && urls.second && urls.third && urls.fourth) { ws.close();  cont([urls.first, urls.second, urls.third, urls.fourth]) }
				}
				let object = {};
				for (let i = 0; i < 4; i++) {
					Object.assign(object, CANVAS_REQUEST);
					packet_id += 1;
					object.id = packet_id.toString();
					object.payload.variables.input.channel.tag = i.toString()
					ws.send(JSON.stringify(object))
				}
			}
		}
		ws.send(JSON.stringify({
			"type": "connection_init",
			"payload": { "Authorization": auth },
		}))
	}
}

function get_board_image(cont, auth) {
	fetch_canvas_urls((urls) => {
		console.log("fetching board urls", urls)
		browser.runtime.sendMessage({ contentScriptQuery: 'getBoard', urls, x: design.x, y: design.y, dx: design.width, dy: design.height }, cont)
	}, auth)
}

function get_reference_image(cont) {
	browser.runtime.sendMessage({contentScriptQuery: 'getImage', url: design.url, x: 0, y: 0, dx: design.width, dy: design.height }, cont);
}

const MAX_CHANGES = 5000;
// Takes two arrays of pixels
function calculate_changes(cur_array, ref_array) {
	function toHexString(byteArray) {
		var s = '0x';
		byteArray.forEach(function(byte) {
			s += ('0' + (byte & 0xFF).toString(16)).slice(-2);
		});
		return s;
	}

	var changes = []
	for (let i = 0; i < cur_array.length; i += 4) {
		if (changes.length >= MAX_CHANGES) { return changes }
		let cur_array_slice = cur_array.slice(i, i + 3);
		let ref_array_slice = ref_array.slice(i, i + 3);
		if (cur_array_slice.every((value, index) => value !== ref_array_slice[index])) {
			let hex_color = toHexString(ref_array_slice).slice(2)
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

function send_change(cont, x, y, color) {
	let place_x = x;
	let place_y = y;
	console.log("Changing Pixel:", { x, y, color });
	let canvas_index = 0
	if (place_x >= 1000) {
		place_x -= 1000;
		canvas_index = 1
		if (place_y >= 1000) {
			place_y -= 1000
			if (canvas_index == 1) { canvas_index = 3 }
			else { canvas_index = 2 }
		}
	}

	fetch("https://gql-realtime-2.reddit.com/query", {
		"headers": {
			"accept": "*/*",
			"authorization": token,
			"content-type": "application/json",
		},
		"body": JSON.stringify({ "operationName": "pixelHistory", "variables": { "input": { "actionName": "r/replace:get_tile_history", "PixelMessageData": { "coordinate": { "x": x, "y": y }, "colorIndex": color, "canvasIndex": canvas_index } } }, "query": "mutation pixelHistory($input: ActInput!) {\n  act(input: $input) {\n    data {\n      ... on BasicMessage {\n        id\n        data {\n          ... on GetTileHistoryResponseMessageData {\n            lastModifiedTimestamp\n            userInfo {\n              userID\n              username\n              __typename\n            }\n            __typename\n          }\n          __typename\n        }\n        __typename\n      }\n      __typename\n    }\n    __typename\n  }\n}\n" }),
		"method": "POST"
	}).then(() => {
		fetch("https://gql-realtime-2.reddit.com/query", {
			"headers": {
				"accept": "*/*",
				"authorization": token,
				"content-type": "application/json",
				},
			"body": JSON.stringify({"operationName":"setPixel","variables":{"input":{"actionName":"r/replace:set_pixel","PixelMessageData":{"coordinate":{"x":place_x,"y":place_y},"colorIndex":color,"canvasIndex":canvas_index}}},"query":"mutation setPixel($input: ActInput!) {\n  act(input: $input) {\n    data {\n      ... on BasicMessage {\n        id\n        data {\n          ... on GetUserCooldownResponseMessageData {\n            nextAvailablePixelTimestamp\n            __typename\n          }\n          ... on SetPixelResponseMessageData {\n            timestamp\n            __typename\n          }\n          __typename\n        }\n        __typename\n      }\n      __typename\n    }\n    __typename\n  }\n}\n"}),
			"method": "POST"
		}).then((resp) => resp.json()).then((json) => {
			console.log("Change Pixel Response:", json)
			cont(json)
		})
	})

}

var override_ineffective = false;
function check_map_and_place(cont) {
	console.log("Running Map Check")
	if (design !== undefined && token !== undefined) {
		get_board_image((current_image) => {
			console.log("loaded board image")
			get_reference_image((reference_image) => {
				console.log("Found both images")
				let changes = calculate_changes(current_image, reference_image)
				console.log("Found changes:", changes)
				if (changes.length > 0) {
					console.log(changes.length + " changes found");
					if (changes.length >= MAX_CHANGES) {
						if (override_ineffective) {
							notif_sub("There are a lot of changes")
						} else {
							notif_sub("There are too many changes, check if the design is old or invalid or change the MAX_CHANGES variable")
							cont(minInterval)
							return
						}
					} else if (override_ineffective) { override_ineffective = false }
					let change = select_change(changes)
					change.x += design.x;
					change.y += design.y;
					send_change((resp) => {
                        if(resp) {
                            if(resp.errors) {
                                if(resp.errors[0].message === "Ratelimited") {
                                    if(resp.errors[0].extensions) {
                                        let waitFor = resp.errors[0].extensions.nextAvailablePixelTs - new Date();
                                        if (waitFor) {
                                            console.log("Rate limiting says to wait for " + waitFor + " ms");
                                            cont(waitFor);
                                            return;
                                        }
                                    }
                                }
                                console.log("Rate limited but don't know how long to wait, exiting");
                            }
                            else if (resp.data) {
                                pixels_placed_counter += 1;
								notif(`Pixels Placed: ${pixels_placed_counter}`);
								notif_sub(`Last Placed at (${change.x}, ${change.y}), color: ${change.color}`)
                                let innerData = resp.data.act.data;
                                if (innerData.length === 1) {
                                    if(innerData[0].data) {
                                        if(innerData[0].nextAvailablePixelTimestamp) {
                                            let waitFor = innerData[0].nextAvailablePixelTimestamp - new Date()
                                            if (waitFor < minInterval) {
                                                console.log("Exiting, got a next available time which is less than expected " + waitFor)
                                            } else {
                                                console.log("Told to wait for " + waitFor + " ms before the next change...");
                                                cont(waitFor);
                                                return;
                                            }
                                        } else {
                                            console.log("Did not get expected response data[5]. Exiting to make sure we dont get account rate limited");
                                        }
                                    } else {
                                        console.log("Did not get expected response data[4]. Exiting to make sure we dont get account rate limited");
                                    }
                                }
                                else if(innerData.length === 2) {
                                    console.log("Normalish operation... using default wait time of " + minInterval + " ms");
                                    cont(minInterval);
                                    return;
                                } else {
                                    console.log("Did not get expected response data[3]. Exiting to make sure we dont get account rate limited");
                                }
                            } else {
                                console.log("Did not get expected response data[2]. Exiting to make sure we dont get account rate limited");
                            }
                        } else {
                            console.log("Did not get expected response data[1]. Exiting to make sure we dont get account rate limited");
                        }
					}, change.x, change.y, change.color)
				} else {
					console.log("No unmatching pixels found")
					cont(minInterval)
				}

			}, design.url, design.width, design.height)
		}, token, design.x, design.y, design.width, design.height)
	} else {
		console.log("Exiting: missing token or design", token, design)
	}
}

// Background script will send token
browser.runtime.onMessage.addListener(function (msg, sender, sendResponse) {
	if (msg.token) {
		token = msg.token;
		console.log("Extracted token: ", token);
	}
    sendResponse({});
});
update_design(timeout_map_check)

console.log("Hello Place!");
notif("Thank you for contributing to Monero's r/place! The bot is running.");

var pixels_placed_counter = 0
var firstRun = true;
function timeout_map_check(waitTime) {
    if (firstRun === false) {
        if (waitTime < minInterval) {
            console.log("Wait time too short, increasing to min wait time.");
            waitTime = minInterval;
        }
        if (waitTime > maxInterval) {
            console.error("Wait time too long. Is the account blocked?");
            return;
        }
    }
    firstRun = false;
    console.log("Starting timer for another iteration...")
	setTimeout(() => {
		update_design((wait) => { })
        check_map_and_place(timeout_map_check)
    }, waitTime);
}
