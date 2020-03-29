let config = {};

const isFirefox = navigator.userAgent.toLocaleLowerCase().indexOf('firefox') !== -1;
const isAndroid = navigator.userAgent.toLocaleLowerCase().indexOf('android') !== -1;
const isDevMode = browser.runtime.getManifest().version === '0.0.0';

async function loadData() {
    let configLocation;
    if (isDevMode) {
        configLocation = './config.json';
    } else {
        configLocation = 'https://raw.githubusercontent.com/code4romania/emergency-news-addon/master/src/config.json';
    }
    const httpData = await fetch(configLocation);
    config = expandConfig(await httpData.json());
    config.isDevMode = isDevMode;
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
    const scripts = [];
    if (!isFirefox) {
        scripts.push('dependencies/browser-polyfill.js');
    }
    scripts.push('dependencies/popper.js');
    scripts.push('dependencies/tippy-bundle.umd.js');
    scripts.push('emergency_news.js');
    scripts.forEach(async (file) => {
        await browser.tabs.executeScript(tabId, { file })
            .then(() => { }, (error) => {
                console.error(`Error while loading file ${file}: ${error}`);
            });
    });
}

async function onComplete(e) {
    if (e.frameId === 0) {
        const currentDomain = getDomain(e.url);
        const domainSettings = await LocalOrSyncStorage.getFromCacheStorageOrDefault(currentDomain, { enabledOnPage: true });
        refreshBrowserAction(e.tabId, domainSettings.enabledOnPage, currentDomain);
        if (domainSettings.enabledOnPage) {
            await injectContentScriptInTab(e.tabId);
        }
    }
}

browser.webNavigation.onDOMContentLoaded.addListener(onComplete,
    { url: [{ schemes: ["http", "https"] }] }
);

function getDomain(url) {
    return new URL(url).host;
}

async function refreshBrowserAction(tabId, enabledOnPage, domain) {
    const actionName = enabledOnPage ? 'Dezactivează' : 'Activează';
    let title = `${actionName} ȘTIRI OFICIALE`;
    if (!isAndroid) {
        title = `${title} pe ${domain}`;
        browser.contextMenus.update('toggle-on-domain', {
            title
        });
    }
    browser.browserAction.setTitle({ title, tabId });
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
    refreshBrowserAction(currentTabId, domainSettings.enabledOnPage, domain);
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

if (!isAndroid) {
    browser.contextMenus.create({
        id: "toggle-on-domain",
        title: "Activează/Dezactivează pe pagină",
        contexts: ["all"]
    });
    if (isFirefox) {
        browser.contextMenus.onShown.addListener(async (info, tab) => {
            if (info.pageUrl.startsWith('http')) {
                const domain = getDomain(info.pageUrl);
                const domainSettings = await LocalOrSyncStorage.getFromCacheStorageOrDefault(domain, { enabledOnPage: true });
                refreshBrowserAction(tab.id, domainSettings.enabledOnPage, domain);
            }
        });
    } else {
        browser.tabs.onActivated.addListener(async (activeInfo) => {
            let tabInfo = await browser.tabs.get(activeInfo.tabId);
            if (tabInfo.url) {
                const domain = getDomain(tabInfo.url);
                const domainSettings = await LocalOrSyncStorage.getFromCacheStorageOrDefault(domain, { enabledOnPage: true });
                refreshBrowserAction(activeInfo.tabId, domainSettings.enabledOnPage, domain);
            }
        });
    }
    browser.contextMenus.onClicked.addListener(toggleCurrentDomain);
}