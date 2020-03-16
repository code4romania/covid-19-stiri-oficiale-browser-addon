let terms = {};

async function loadData() {
    let termsLocation = './terms.json';
    if (navigator.userAgent.toLocaleLowerCase().indexOf('firefox') > 0) {
        const isProd = browser.runtime.id === "{2164fef6-64f4-4a8b-9a6d-9dd9c500dd88}";
        if (isProd) {
            termsLocation = 'https://raw.githubusercontent.com/code4romania/emergency-news-addon/master/src/terms.json';
        }
    }
    const httpData = await fetch(termsLocation);
    terms = expandTerms(await httpData.json());
    setTimeout(loadData, 1000 * 60 * 60);
}

function expandTerms(termsInput) {
    let newTerms = {};
    for (let term in termsInput) {
        if (termsInput.hasOwnProperty(term)) {
            newTerms[term] = termsInput[term];
            if (termsInput[term].hasOwnProperty("aliases")) {
                let aliases = termsInput[term].aliases;
                aliases.forEach(function(alias) {
                    newTerms[alias] = termsInput[term];
                });
            }
        }
    }
    let orderedTerms = new Map();
    Object.keys(newTerms)
        .sort((a, b) => {
            return b.length - a.length || b.localeCompare(a);
        })
        .forEach(function(key) {
            orderedTerms.set(key, newTerms[key]);
        });
    return orderedTerms;
}

browser.runtime.onMessage.addListener((request, sender) => {
    return Promise.resolve({ terms });
});

loadData();

if (!!chrome.contextMenus) {

    chrome.contextMenus.create({
        id: "highlight-terms",
        title: "Evidențiează surse oficiale",
        contexts: ["all"]
    }, () => {});

    chrome.contextMenus.onClicked.addListener(function(info, tab) {
        if (info.menuItemId == "highlight-terms") {
            const styles = [
                "dependencies/light.css",
                "emergency_news.css",
            ];
            styles.forEach((stylesName) => {
                chrome.tabs.insertCSS(tab.id, {
                    file: stylesName,
                }, () => {});
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
                }, () => {});
            })
        }
    });
}