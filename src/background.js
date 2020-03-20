let config = {};

async function loadData() {
    let configLocation = './config.json';
    const isFirefoxProd = browser.runtime.id === "{2164fef6-64f4-4a8b-9a6d-9dd9c500dd88}";
    const isChromeProd = browser.runtime.id === "pdcpkplohipjhdfdchpmgekifmcdbnha";
    if (isFirefoxProd || isChromeProd) {
        configLocation = 'https://raw.githubusercontent.com/code4romania/emergency-news-addon/master/src/config.json';
    }
    const httpData = await fetch(configLocation);
    config = await httpData.json();
    config.terms = expandTerms(config.terms);
    setTimeout(loadData, 1000 * 60 * 60);
}

function expandTerms(termsInput) {
    let newTerms = [];
    termsInput.forEach((term) => {
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
    })
    return newTerms;
}

chrome.runtime.onMessage.addListener((request, sender, sendResponse) => {
    console.log(config);
    sendResponse(config);
});

loadData();