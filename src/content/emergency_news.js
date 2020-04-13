/*global EmergencyNewsTooltipContent*/

let MAX_MILLIS = 500;
let MAX_HIGHLIGHT_PER_TERM = 3;
const START_AFTER_DOM_READY = 200;

var emergencyNewsConfig = {};

var start;
browser.runtime.sendMessage({ type: "LOAD_DATA" }).then((message) => {
    if (!emergencyNewsConfig.terms) {
        emergencyNewsConfig = message;
        setTimeout(async () => {
            start = Date.now();
            const isDisabledDomain = emergencyNewsConfig.disabledOn
                .findIndex((disabledUrlFragment) => {
                    return document.URL.indexOf(disabledUrlFragment) > -1;
                }) > -1;
            if (isDisabledDomain) {
                return;
            }
            const simplifiedInnerContent = simplifyText(document.body.innerText);
            const hasEnablingTerm = emergencyNewsConfig.pageEnablingTerms
                .map(simplifyText)
                .findIndex((enablingTerm) => {
                    return simplifiedInnerContent.indexOf(enablingTerm) > -1;
                }) > -1;
            if (!hasEnablingTerm) {
                return;
            }
            emergencyNewsConfig.terms
                .filter(termKv => termKv.value.enabled)
                .forEach((termKv) => {
                    termKv.value.highlightCount = 0;
                });
            walk(document.body);
            emergencyNewsConfig.terms
                .filter(termKv => termKv.value.enabled)
                .forEach((termKv) => {
                    createTooltip(termKv.value);
            });
        }, START_AFTER_DOM_READY);
    }
});

function walk(node) {
    let child, next;
    let tagName = node.tagName ? node.tagName.toLowerCase() : "";
    if (tagName == 'input' || tagName == 'textarea') {
        return;
    }
    if (node.classList && node.classList.contains('ace_editor')) {
        return;
    }
    let spentTime;
    switch (node.nodeType) {
        case 1: // Element
        case 9: // Document
        case 11: // Document fragment
            child = node.firstChild;
            while (child) {
                next = child.nextSibling;
                spentTime = Date.now() - start;
                if (spentTime < MAX_MILLIS) {
                    walk(child);
                } else {
                    break;
                }
                child = next;
            }
            break;
        case 3: // Text node
            try {
                spentTime = Date.now() - start;
                if (spentTime < MAX_MILLIS) {
                    handleText(node);
                } else {
                    break;
                }
            } catch (error) {
                console.error(error);
            }
            break;
    }
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

var whiteListTags = new Set(["h1", "h2", "h3", "h4", "h5", "h6", "p", "strong", "em", "b", "span", "div", "label", "b", "i", "u"]);

let termsMatched = 0;

function handleText(textNode) {
    if (!whiteListTags.has(textNode.parentNode.tagName.toLowerCase())) {
        return;
    }
    if (textNode.parentNode.parentNode.tagName.toLowerCase() === "a") {
        return;
    }
    if (textNode.nodeValue.indexOf("http://") === 0 || textNode.nodeValue.indexOf("https://") === 0) {
        return;
    }
    if (textNode.nodeValue.trim().length < 10) {
        return;
    }
    emergencyNewsConfig.terms
        .filter(termKv => termKv.value.enabled)
        .filter(termKv => termKv.value.highlightCount < MAX_HIGHLIGHT_PER_TERM)
        .forEach((termKv) => {
            const termData = termKv.value;
            termData.aliases.forEach((alias) => {
                if (termData.highlightCount < MAX_HIGHLIGHT_PER_TERM) {
                    try {
                        const splittedText = splitTextByTerm(textNode.nodeValue, alias);
                        if (splittedText.matchType !== "MISSING") {
                            termData.highlightCount = termData.highlightCount + 1;
                            termsMatched = termsMatched + 1;
                            const textBefore = splittedText.begin;
                            const textAfter = splittedText.end;

                            const before = document.createTextNode(textBefore);
                            const after = textNode;
                            after.nodeValue = textAfter;
                            textNode.parentNode.insertBefore(before, after);
                            let divWithTooltip = document.createElement("span");
                            divWithTooltip.classList.add("emergency_news");
                            divWithTooltip.classList.add(`emergency_news_item_${termData.id}`);
                            divWithTooltip.textContent = splittedText.originalTerm;

                            textNode.parentNode.insertBefore(divWithTooltip, after);
                        }
                    } catch (error) {
                        console.error(error);
                    }
                }
            });
        });
}


function splitTextByTerm(fullString, term) {
    const simplifiedFullString = simplifyText(fullString);
    const simplifiedTerm = simplifyText(term);

    let termIndex = simplifiedFullString.indexOf(simplifiedTerm);
    let stop = fullString.length;
    let begin;
    let end;
    let matchType;
    if (termIndex === -1) {
        matchType = "MISSING";
    } else if (termIndex === 0) {
        matchType = "START";
        begin = "";
        end = fullString.substring(term.length, stop);
    } else if (fullString.length == (term.length + termIndex)) {
        matchType = "END";
        begin = fullString.substring(0, termIndex);
        end = "";
    } else {
        matchType = "MID";
        begin = fullString.substring(0, termIndex);
        end = fullString.substring(term.length + termIndex, stop);
    }
    let originalTerm = term;
    if (termIndex > -1) {
        originalTerm = fullString.substring(termIndex, termIndex + term.length);
        if (isWordFragment(fullString, termIndex - 1) || isWordFragment(fullString, termIndex + term.length)) {
            matchType = "MISSING";
        }
    }
    return {
        begin,
        end,
        matchType,
        originalTerm
    };
}

function isWordFragment(fullString, charIndex) {
    if (charIndex < 0) {
        return false;
    } else if (charIndex > fullString.length) {
        return false;
    } else {
        return "?!()[]<>-._;: ".indexOf(fullString.charAt(charIndex)) === -1;
    }
}

const tippyInstances = [];
function createTooltip(termData) {
    const tippyData = {
        content: () => {
            try {
                return new EmergencyNewsTooltipContent(termData.id, termData.title, termData.paragraphs, termData.links, termData.chart);
            } catch (error) {
                console.error(error);
                return document.createElement('div');
            }
        },
        interactive: true,
        maxWidth: 600,
        appendTo: document.body,
        theme: 'light'
    };
    if (emergencyNewsConfig.isDevMode) {
        tippyData.trigger = 'click';
    }
    let tippyInsanceList = tippy(`.emergency_news_item_${termData.id}`, tippyData);
    tippyInstances[termData.id] = tippyInsanceList;
}
