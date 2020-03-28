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

async function injectContentScriptInTab(tabId) {
    await browser.tabs.insertCSS(tabId, { file: "dependencies/light.css" });
    await browser.tabs.insertCSS(tabId, { file: "emergency_news.css" });
    if (!isFirefox) {
        await browser.tabs.executeScript(tabId, { file: 'dependencies/browser-polyfill.js' });
    }
    await browser.tabs.executeScript(tabId, { file: 'dependencies/popper.js' });
    await browser.tabs.executeScript(tabId, { file: 'dependencies/tippy-bundle.umd.js' });
    await browser.tabs.executeScript(tabId, { file: 'emergency_news.js' });
}

async function onComplete(e) {
    if (e.frameId === 0) {
        const domainSettings = await LocalOrSyncStorage.getFromCacheStorageOrDefault(getDomain(e.url), { enabledOnPage: true });
        if (domainSettings.enabledOnPage) {
            await injectContentScriptInTab(e.tabId);
        }
    }
}

browser.webNavigation.onCompleted.addListener(onComplete,
    { url: [{ schemes: ["http", "https"] }] }
);

function getDomain(url) {
    return new URL(url).host;
}

async function toggleCurrentDomain() {
    const foundTabs = await browser.tabs.query({
        currentWindow: true,
        active: true
    });

    var currentTabId = foundTabs[0].id;
    const domain = getDomain(foundTabs[0].url);
    const domainSettings = await LocalOrSyncStorage.getFromCacheStorageOrDefault(domain, { enabledOnPage: true });
    domainSettings.enabledOnPage = !domainSettings.enabledOnPage;
    LocalOrSyncStorage.save(domain, domainSettings);
    if (!domainSettings.enabledOnPage) {
        browser.tabs.executeScript(
            currentTabId, {
            code: `window.location = window.location; ""`
        });
    } else {
        injectContentScriptInTab(currentTabId);
    }
}

browser.browserAction.onClicked.addListener(toggleCurrentDomain);

class LocalOrSyncStorage {
    static async getFromCacheStorageOrDefault(key, defaultValue) {
        let item = await this.getStorage().get(key);
        item = item[key];
        if (!item) {
            item = defaultValue;
            LocalOrSyncStorage.save(key, item);
        }
        return item;
    }

    static async save(key, value) {
        let objectToStore = {};
        objectToStore[key] = value;
        return this.getStorage().set(objectToStore);
    }

    static getStorage() {
        if (!!browser.storage.sync) {
            return browser.storage.sync;
        } else {
            return browser.storage.local;
        }
    }

}

if (!!browser.contextMenus) {
    browser.contextMenus.create({
        id: "toggle-on-domain",
        title: "Activează/Dezactivează pe pagină",
        contexts: ["all"]
    });

    browser.contextMenus.onClicked.addListener(toggleCurrentDomain);
}