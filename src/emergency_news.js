var emergencyNewsConfig = {};

browser.runtime.sendMessage({}).then((message) => {
    if (!emergencyNewsConfig.terms) {
        emergencyNewsConfig = message;
        setTimeout(() => {
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
            walk(document.body);
        }, 500);
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

    switch (node.nodeType) {
        case 1: // Element
        case 9: // Document
        case 11: // Document fragment
            child = node.firstChild;
            while (child) {
                next = child.nextSibling;
                walk(child);
                child = next;
            }
            break;

        case 3: // Text node
            try {
                handleText(node);
            } catch { }
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

var tooltipCount = 0;
var whiteListTags = new Set(["h1", "h2", "h3", "h4", "h5", "h6", "p", "strong", "em", "b", "span", "div", "label", "b", "i", "u"]);

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
    emergencyNewsConfig.terms.forEach((termKv) => {
        try {
            const term = termKv.key;
            const termData = termKv.value;
            const splittedText = splitTextByTerm(textNode.nodeValue, term);
            if (splittedText.matchType !== "MISSING") {
                const textBefore = splittedText.begin;
                const textAfter = splittedText.end;

                const before = document.createTextNode(textBefore);
                const after = textNode;
                after.nodeValue = textAfter;
                textNode.parentNode.insertBefore(before, after);
                let divWithTooltip = document.createElement("span");
                tooltipCount++;
                divWithTooltip.classList.add("emergency_news");
                divWithTooltip.classList.add("emergency_news_item" + tooltipCount);
                divWithTooltip.textContent = splittedText.originalTerm;

                textNode.parentNode.insertBefore(divWithTooltip, after);
                createTooltip(termData, tooltipCount);
            }
        } catch { }
    })
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
    }
    return {
        begin,
        end,
        matchType,
        originalTerm
    }
}

function appendLinkElement(parent, href, imgSrc, imgClass) {
    let linkElement = document.createElement("a");
    linkElement.setAttribute("target", "_blank");
    linkElement.setAttribute("href", href);
    let imgElement = document.createElement("img");
    imgElement.setAttribute("src", imgSrc);
    imgElement.classList.add(imgClass);
    linkElement.appendChild(imgElement);
    parent.appendChild(linkElement);
}

function appendTitleElement(parent, titleText) {
    let div = document.createElement("div");
    let bold = document.createElement("b");
    bold.textContent = titleText;
    div.appendChild(bold);
    parent.appendChild(div);
}

var logoNews = browser.runtime.getURL("images/logo-news-full.png");
var logoCode4Ro = browser.runtime.getURL("images/logo-code4ro.svg");
var logoGov = browser.runtime.getURL("images/logo-gov.png");

function createTooltip(termData, tooltipCount) {
    let emergencyNewsHeader = document.createElement("div");
    emergencyNewsHeader.classList.add("emergency_news_header");
    appendLinkElement(emergencyNewsHeader, "https://code4.ro/ro/apps/stiri-oficiale/", logoNews, "emergency_news_logo");
    appendLinkElement(emergencyNewsHeader, "https://code4.ro/", logoCode4Ro, "emergency_news_code4ro_logo");
    appendLinkElement(emergencyNewsHeader, "http://adr.gov.ro/", logoGov, "emergency_news_gov_logo");

    let emergencyNewsBody = document.createElement("div");
    emergencyNewsBody.classList.add("emergency_news_body");
    appendTitleElement(emergencyNewsBody, termData.title);
    let paragraphsParent = document.createElement("div");
    termData.paragraphs.forEach((paragraphData) => {
        let paragraph = document.createElement("p");
        paragraph.textContent = paragraphData;
        paragraphsParent.appendChild(paragraph);
    });
    emergencyNewsBody.appendChild(paragraphsParent);

    let linksParent = document.createElement("div");
    let listElement = document.createElement("ol");
    termData.links.forEach((link) => {
        let listItemElement = document.createElement("li");
        let linkElement = document.createElement("a");
        let linkTitle;
        if (!!emergencyNewsConfig.links[link]) {
            linkTitle = emergencyNewsConfig.links[link]
        } else {
            linkTitle = link;
        }
        linkElement.setAttribute("target", "_blank");
        linkElement.setAttribute("href", link);
        linkElement.textContent = linkTitle;
        listItemElement.appendChild(linkElement);
        listElement.appendChild(listItemElement);
    });
    linksParent.appendChild(listElement);
    emergencyNewsBody.appendChild(linksParent);

    let emergencyNewsContent = document.createElement("div");
    emergencyNewsContent.appendChild(emergencyNewsHeader);
    emergencyNewsContent.appendChild(emergencyNewsBody);

    tippy('.emergency_news_item' + +tooltipCount, {
        content: emergencyNewsContent,
        interactive: true,
        theme: 'light'
    });
}