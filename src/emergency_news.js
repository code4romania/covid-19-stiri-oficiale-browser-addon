var terms = {};

browser.runtime.sendMessage({}).then((message) => {
    terms = message.terms;
    walk(document.body);
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
            handleText(node);
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
    return noCedila;
}

var tooltipCount = 0;

function handleText(textNode) {
    if (textNode.nodeValue.indexOf("http://") === 0 || textNode.nodeValue.indexOf("https://") === 0) {
        return;
    }
    for (let term in terms) {
        if (terms.hasOwnProperty(term)) {
            let termData = terms[term];
            try {
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
            } catch {}
        }
    }

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

let logoNews = "https://raw.githubusercontent.com/code4romania/emergency-news-addon/master/src/images/logo-news-full.png";
let logoCode4Ro = "https://code4.ro/images/logo-full.svg";
let logoGov = "https://raw.githubusercontent.com/code4romania/emergency-news-addon/4a30a4ae177827ea7c124a4ce2cc8a11ffaad509/src/images/logo-gov.png";

if (navigator.userAgent.toLocaleLowerCase().indexOf('firefox') > 0) {
    logoNews = browser.runtime.getURL("images/logo-news-full.png");
    logoCode4Ro = browser.runtime.getURL("images/logo-code4ro.svg");
    logoGov = browser.runtime.getURL("images/logo-gov.png");
}

function createTooltip(termData, tooltipCount) {
    let links = "";
    for (let i = 0; i < termData.links.length; i++) {
        const link = termData.links[i];
        links += `<div><a href="${link}">${link}</a></div>`;
    }

    let content = `
    <div class="emergency_news_header">
        <a href="https://code4.ro/ro/apps/stiri-oficiale/">
            <img src="${logoNews}" class="emergency_news_logo"></img>
        </a>
		<div>Un proiect dezvoltat de</div>
        <a href="https://code4.ro/">
    		<img src="${logoCode4Ro}" class="emergency_news_code4ro_logo"></img>
        </a>
		<div>În parteneriat cu</div>
        <a href="https://www.gov.ro/">
    		<img src="${logoGov}" class="emergency_news_gov_logo"></img>
        </a>
	</div>
	<div class="emergency_news_body">
        <div><b>${termData.title}</b></div>
        <div>${termData.explanation || ""}</div>
        <div>${links}</div>
    </div>`;

    tippy('.emergency_news_item' + +tooltipCount, {
        content: content,
        allowHTML: true,
        interactive: true,
        theme: 'light'
    });
}