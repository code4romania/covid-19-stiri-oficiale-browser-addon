let terms = {};

async function loadData() {
    const httpData = await fetch("https://raw.githubusercontent.com/code4romania/emergency-news-addon/master/terms.json");
    terms = await httpData.json();
    setTimeout(loadData, 1000*60*60*12);
}

browser.runtime.onMessage.addListener((request, sender, sendResponse) => {
    sendResponse({ terms });
});

loadData();