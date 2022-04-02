if (typeof browser === "undefined") {
    var browser = chrome;
}

var token = undefined;
var running = false;

let beginx = 913
let beginy = 422
let width = 46
let height = 46
let color = 8
let rows = 0
let chars = 0

function sleep(ms) {
    return new Promise((resolve) => {
        setTimeout(resolve, ms);
    });
}

function getRandomInt(min, max) {
    min = Math.ceil(min);
    max = Math.floor(max);
    return Math.floor(Math.random() * (max - min + 1)) + min;
}

// All this code was copied from 2b2t's bot
async function run() {
    running = true;
    alert("The bot is running");

    for (let i = 0; i < 10000; i++) {
        let image = `gggggggggggggggggggggggggggggggggggggggggggggg
        gggggggggggggggggggggggggggggggggggggggggggggg
        ggggrrrrrrrrggggggrrrrgggggggggggggggggggggggg
        ggggrrrrrrrrggggggrrrrgggggggggggggggggggggggg
        ggrrrrggggrrrrggggrrrrgggggggggggggggggggggggg
        ggrrrrggggrrrrggggrrrrgggggggggggggggggggggggg
        ggrrrrggggrrrrggggrrrrgggggggggggggggggggggggg
        ggrrrrggggrrrrggggrrrrgggggggggggggggggggggggg
        ggggggggggrrrrggggrrrrrrrrrrgggggggggggggggggg
        ggggggggggrrrrggggrrrrrrrrrrgggggggggggggggggg
        ggggggggrrrrggggggrrrrggggrrrrgggggggggggggggg
        ggggggggrrrrggggggrrrrggggrrrrgggggggggggggggg
        ggggggrrrrggggggggrrrrggggrrrrgggggggggggggggg
        ggggggrrrrggggggggrrrrggggrrrrgggggggggggggggg
        ggggrrrrggggggggggrrrrggggrrrrgggggggggggggggg
        ggggrrrrggggggggggrrrrggggrrrrgggggggggggggggg
        ggrrrrggggggggggggrrrrggggrrrrgggggggggggggggg
        ggrrrrggggggggggggrrrrggggrrrrgggggggggggggggg
        ggrrrrggggggggggggrrrrggggrrrrgggggggggggggggg
        ggrrrrggggggggggggrrrrggggrrrrgggggggggggggggg
        ggrrrrrrrrrrrrggggrrrrrrrrrrrggggggggggggggggg
        ggrrrrrrrrrrrrggggrrrrrrrrrrrggggggggggggggggg
        gggggggggggggggggggggggggggggggggggggggggggggg
        gggggggggggggggggggggggggggggggggggggggggggggg
        gggggggggggggggggggggggggbbbbbbbbggggggggggggg
        gggggggggggggggggggggggggbbbbbbbbggggggggggggg
        ggggggggggggggggggggggbbbbggggbbbbggggbbbbgggg
        ggggggggggggggggggggggbbbbggggbbbbggggbbbbgggg
        ggggggggggggggggggggggbbbbggggbbbbggggbbbbgggg
        ggggggggggggggggggggggbbbbggggbbbbggggbbbbgggg
        ggggggggggggggggggggggggggggggbbbbgggbbbbbbbgg
        ggggggggggggggggggggggggggggggbbbbgggbbbbbbbgg
        ggggggggggggggggggggggggggggbbbbggggggbbbbgggg
        ggggggggggggggggggggggggggggbbbbggggggbbbbgggg
        ggggggggggggggggggggggggggbbbbggggggggbbbbgggg
        ggggggggggggggggggggggggggbbbbggggggggbbbbgggg
        ggggggggggggggggggggggggbbbbggggggggggbbbbgggg
        ggggggggggggggggggggggggbbbbggggggggggbbbbgggg
        ggggggggggggggggggggggbbbbggggggggggggbbbbgggg
        ggggggggggggggggggggggbbbbggggggggggggbbbbgggg
        ggggggggggggggggggggggbbbbggggggggggggbbbbgggg
        ggggggggggggggggggggggbbbbggggggggggggbbbbgggg
        ggggggggggggggggggggggbbbbbbbbbbbbggggggbbbbgg
        ggggggggggggggggggggggbbbbbbbbbbbbggggggbbbbgg
        gggggggggggggggggggggggggggggggggggggggggggggg
        gggggggggggggggggggggggggggggggggggggggggggggg`;
        let bearer = token;
        let accounts = bearer.split('\n')
    
        for (const account of accounts) {
            const lines = image.split('\n')
            x = getRandomInt(beginx, beginx + width - 1)
            y = getRandomInt(beginy, beginy + height - 1)
            rows = x - beginx
            chars = y - beginy
            console.log(`(${x},${y})`)
    
            if (lines[rows][chars] == "r") { // red
                color = 2
            } else if (lines[rows][chars] == "g") { // light green
                color = 8
            } else if (lines[rows][chars] == "b") { // dark blue
                color = 12
            } else if (lines[rows][chars] == "o") { // orange
                color = 3
            } else if (lines[rows][chars] == "x") { // gray
                color = 29
            } else if (lines[rows][chars] == "w") { // white
                color = 31
            } else if (lines[rows][chars] == "y") { // yellow
                color = 4
            } else if (lines[rows][chars] == "1") { // dark green
                color = 6
            } else if (lines[rows][chars] == "2") { // light blue
                color = 14
            } else if (lines[rows][chars] == "3") { // dark purple
                color = 18
            } else if (lines[rows][chars] == "p") { // purple
                color = 19
            } else if (lines[rows][chars] == "4") { // light pink
                color = 23
            } else if (lines[rows][chars] == "5") { // brown
                color = 25 
            } else if (lines[rows][chars] == "6") { // light gray
                color = 30
            } else if (lines[rows][chars] == "q") { // black
                color = 27
            } else { // if it doesnt recognize the character it just puts black
                color = 27
            }
    
    /*
      "body": "{\"operationName\":\"setPixel\",\"variables\":{\"input\":{\"actionName\":\"r/replace:set_pixel\",\"PixelMessageData\":{\"coordinate\":{\"x\":61,\"y\":466},\"colorIndex\":27,\"canvasIndex\":1}}},\"query\":\"mutation setPixel($input: ActInput!) {\\n  act(input: $input) {\\n    data {\\n      ... on BasicMessage {\\n        id\\n        data {\\n          ... on GetUserCooldownResponseMessageData {\\n            nextAvailablePixelTimestamp\\n            __typename\\n          }\\n          ... on SetPixelResponseMessageData {\\n            timestamp\\n            __typename\\n          }\\n          __typename\\n        }\\n        __typename\\n      }\\n      __typename\\n    }\\n    __typename\\n  }\\n}\\n\"}",
      "method": "POST"
    */
            const postResponse = await fetch("https://gql-realtime-2.reddit.com/query", {
            "headers": {
                "accept": "*/*",
                "authorization": account.trim(),
                "content-type": "application/json",
            },
    /*
            "body": `{\"operationName\":\"setPixel\",\"variables\":{\"input\":{\"actionName\":\"r/replace:set_pixel\",\"PixelMessageData\":{\"coordinate\":{\"x\":${x},\"y\":${y}},\"colorIndex\":${color},\"canvasIndex\":1}}},\"query\":\"mutation setPixel($input: ActInput!) {\\n  act(input: $input) {\\n    data {\\n      ... on BasicMessage {\\n        id\\n        data {\\n          ... on GetUserCooldownResponseMessageData {\\n            nextAvailablePixelTimestamp\\n            __typename\\n          }\\n          ... on SetPixelResponseMessageData {\\n            timestamp\\n            __typename\\n          }\\n          __typename\\n        }\\n        __typename\\n      }\\n      __typename\\n    }\\n    __typename\\n  }\\n}\\n\"}`,
            "method": "POST"
    */
            "body": `{\"operationName\":\"setPixel\",\"variables\":{\"input\":{\"actionName\":\"r/replace:set_pixel\",\"PixelMessageData\":{\"coordinate\":{\"x\":${x},\"y\":${y}},\"colorIndex\":${color},\"canvasIndex\":1}}},\"query\":\"mutation setPixel($input: ActInput!) {\\n  act(input: $input) {\\n    data {\\n      ... on BasicMessage {\\n        id\\n        data {\\n          ... on GetUserCooldownResponseMessageData {\\n            nextAvailablePixelTimestamp\\n            __typename\\n          }\\n          ... on SetPixelResponseMessageData {\\n            timestamp\\n            __typename\\n          }\\n          __typename\\n        }\\n        __typename\\n      }\\n      __typename\\n    }\\n    __typename\\n  }\\n}\\n\"}`,
            "method": "POST"
      
            })
            const postData = await postResponse.json();
            const postString = JSON.stringify(postData)
            //console.log(postData)
            let date_ob = new Date();
            console.log(" at " + date_ob.getHours() + ":" + date_ob.getMinutes() + " account: " + account)
    
            if (postString.includes("error")){
                console.log("error: ")
                console.log(postString)
            } else {
                console.log(postString.includes("error"))
            }
        }
        await sleep(302000) //wait 5 mins and 2 seconds for safety
    }
}

// Background script will send token
browser.runtime.onMessage.addListener(function (msg, sendResponse) {
    token = msg;
    console.log("token", token);

    if (running === false) {
        run(token).then(result => console.log(result));    
    }
});

console.log("hello world");

// Refresh page after an hour (I think the token is only available when loading the page, and the token might expire)
setInterval(function () { window.location.reload(); }, 3600000);
