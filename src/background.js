let terms = {};

async function loadData() {
    const httpData = await fetch("https://raw.githubusercontent.com/code4romania/emergency-news-addon/master/terms.json");
    terms = await httpData.json();
}


function handleMessage(request, sender, sendResponse) {
    sendResponse({ terms });
}

browser.runtime.onMessage.addListener(handleMessage);

loadData();