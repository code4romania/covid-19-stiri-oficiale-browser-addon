let terms = {};

async function loadData() {
    let termsLocation = './terms.json';
    if(navigator.userAgent.toLocaleLowerCase().indexOf('firefox') > 0){
        termsLocation = 'https://raw.githubusercontent.com/code4romania/emergency-news-addon/master/terms.json';
    }
    const httpData = await fetch(termsLocation);
    terms = await httpData.json();
    setTimeout(loadData, 1000 * 60 * 60 * 12);
}

browser.runtime.onMessage.addListener((request, sender, sendResponse) => {
    sendResponse({ terms });
});

loadData();

if (!!chrome.contextMenus) {

    chrome.contextMenus.create({
        id: "highlight-terms",
        title: "Evidențiează surse oficiale",
        contexts: ["all"]
    }, () => { });

    chrome.contextMenus.onClicked.addListener(function (info, tab) {
        if (info.menuItemId == "highlight-terms") {
            const styles = [
                "dependencies/light.css",
                "emergency_news.css",
            ];
            styles.forEach((stylesName) => {
                chrome.tabs.insertCSS(tab.id, {
                    file: stylesName,
                }, () => { });
            })
            const scripts = [
                "dependencies/browser-polyfill.js",
                "dependencies/popper.js",
                "dependencies/tippy-bundle.umd.js",
                "emergency_news.js"
            ];
            scripts.forEach((scriptName) => {
                chrome.tabs.executeScript(tab.id, {
                    file: scriptName,
                }, () => { });
            })
        }
    });
}
