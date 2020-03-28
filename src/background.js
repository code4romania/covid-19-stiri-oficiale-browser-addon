let config = {};

const isFirefox = navigator.userAgent.toLocaleLowerCase().indexOf('firefox') !== -1;
const isFirefoxProd = browser.runtime.id === "{2164fef6-64f4-4a8b-9a6d-9dd9c500dd88}";
const isChromeProd = browser.runtime.id === "pdcpkplohipjhdfdchpmgekifmcdbnha";

async function loadData() {
    let configLocation = './config.json';
    if (isFirefoxProd || isChromeProd) {
        configLocation = 'https://raw.githubusercontent.com/code4romania/emergency-news-addon/master/src/config.json';
    }
    const httpData = await fetch(configLocation);
    config = expandConfig(await httpData.json());
    setTimeout(loadData, 1000 * 60 * 60);
}

function expandConfig(configInput) {
    let newTerms = [];
    configInput.terms.forEach((term) => {
        if (!!term.aliases) {
            term.aliases.forEach(function (alias) {
                newTerms.push({
                    "key": alias,
                    "value": term
                });
            });
        }
    });
    newTerms.sort((a, b) => {
        return b.key.length - a.key.length || b.key.localeCompare(a.key);
    });
    configInput.terms = newTerms;

    let newLinks = {};
    configInput.links.forEach((link) => {
        newLinks[link.href] = link.title;
    });
    configInput.links = newLinks;
    return configInput;
}

chrome.runtime.onMessage.addListener((request, sender, sendResponse) => {
    sendResponse(config);
});

loadData();

async function onComplete(e) {
    if (e.frameId === 0) {
        await browser.tabs.insertCSS(e.tabId, { file: "dependencies/light.css" });
        await browser.tabs.insertCSS(e.tabId, { file: "emergency_news.css" });
        if (!isFirefox) {
            await browser.tabs.executeScript(e.tabId, { file: 'dependencies/browser-polyfill.js' });
        }
        await browser.tabs.executeScript(e.tabId, { file: 'dependencies/popper.js' });
        await browser.tabs.executeScript(e.tabId, { file: 'dependencies/tippy-bundle.umd.js' });
        await browser.tabs.executeScript(e.tabId, { file: 'emergency_news.js' });
    }
}

browser.webNavigation.onCompleted.addListener(onComplete,
    { url: [{ schemes: ["http", "https"] }] }
);