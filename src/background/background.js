/*global LocalOrSyncStorage*/
let config = {};

const isFirefox = navigator.userAgent.toLocaleLowerCase().indexOf('firefox') !== -1;
const isAndroid = navigator.userAgent.toLocaleLowerCase().indexOf('android') !== -1;
const isDevMode = browser.runtime.getManifest().version === '0.0.0';

async function loadData() {
    const version = 2;
    let localConfig = await (await fetch(`./config-v${version}.json`)).json();
    if (!isDevMode) {
        let remoteConfig = await (await fetch(`https://raw.githubusercontent.com/code4romania/emergency-news-addon/master/src/config-v${version}.json`)).json();
        if (remoteConfig.version === localConfig.version) {
            localConfig = remoteConfig;
        }
    }
    config = await expandConfig(localConfig);
    setTimeout(loadData, 1000 * 60 * 60);
}

async function expandConfig(configInput) {
    let newTerms = [];
    const termPromises = await Promise.all(configInput.terms.map(async (term) => {
        term.id = simplifyText(term.title).split(' ').join('_');
        return new Promise((resolve, reject) => {
            if (term.chart) {
                fetch(term.chart.dataSource).then((data) => {
                    data.json().then((json) => {
                        term.chart.state = json;
                        resolve(term);
                    }, (reason) => {
                        reject(reason);
                    });
                }, (reason) => {
                    reject(reason);
                });
            } else {
                resolve(term);
            }
        }).then(async (term) => {
            const termSettings = await LocalOrSyncStorage.getFromCacheStorageOrDefault(term.id, { enabled: true });
            term.enabled = termSettings.enabled;
            return term;
        });
    }));
    termPromises.forEach((term) => {
        term.aliases = term.aliases.sort((a, b) => {
            return b.length - a.length || b.localeCompare(a);
        });
        newTerms.push({
            "id": term.id,
            "value": term
        });
    });
    configInput.terms = newTerms;

    let newLinks = {};
    configInput.links.forEach((link) => {
        newLinks[link.href] = link.title;
    });
    configInput.links = newLinks;
    configInput.isDevMode = isDevMode;
    return configInput;
}

function simplifyText(input) {
    const noComas = input.toLowerCase()
        .split('ș').join('s')
        .split('ț').join('t')
        .split('ă').join('a')
        .split('â').join('a')
        .split('î').join('i');
    const noCedila = noComas.toLowerCase()
        .split('ş').join('s')
        .split('ţ').join('t');
    const noSpecialCharacters = noCedila.toLowerCase()
        .split('-').join(' ')
        .split('_').join(' ');
    return noSpecialCharacters;
}


chrome.runtime.onMessage.addListener((request, sender, sendResponse) => {
    if (request.type === "LOAD_DATA") {
        sendResponse(config);
    } else if (request.type === "DISABLE_TERM") {
        disableTerm(request.termId);
    }
});

loadData();

async function disableTerm(termId) {
    const termSettings = await LocalOrSyncStorage.getFromCacheStorageOrDefault(termId, { enabled: true });
    termSettings.enabled = false;
    LocalOrSyncStorage.save(termId, termSettings);
    const foundTerm = config.terms.find((term) => { return term.id === termId; });
    foundTerm.value.enabled = false;
}

async function injectContentScriptInTab(tabId) {
    await browser.tabs.insertCSS(tabId, { file: "node_modules/light.css" });
    await browser.tabs.insertCSS(tabId, { file: "emergency_news.css" });
    const scripts = [];
    if (!isFirefox) {
        scripts.push('node_modules/browser-polyfill.js');
        scripts.push('node_modules/webcomponents-bundle.js');
    }
    scripts.push('node_modules/popper.js');
    scripts.push('node_modules/echarts.js');
    scripts.push('node_modules/tippy-bundle.umd.js');
    scripts.push('content.js');
    scripts.forEach(async (file) => {
        try {
            await browser.tabs.executeScript(tabId, { file });
        } catch (error) {
            console.error(`Error while loading file ${file}:` + error);
        }
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

if (!isAndroid) {
    browser.contextMenus.create({
        id: "toggle-on-domain",
        title: "Activează/Dezactivează pe pagină",
        contexts: ["all"]
    });
    browser.tabs.onActivated.addListener(async (activeInfo) => {
        let tabInfo = await browser.tabs.get(activeInfo.tabId);
        if (tabInfo.url) {
            const domain = getDomain(tabInfo.url);
            const domainSettings = await LocalOrSyncStorage.getFromCacheStorageOrDefault(domain, { enabledOnPage: true });
            refreshBrowserAction(activeInfo.tabId, domainSettings.enabledOnPage, domain);
        }
    });

    browser.contextMenus.onClicked.addListener(toggleCurrentDomain);
}