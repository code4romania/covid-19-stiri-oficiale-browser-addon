var emergencyNewsConfig = {};

browser.runtime.sendMessage({}).then((message) => {
    if (!emergencyNewsConfig.terms) {
        emergencyNewsConfig = message;
        const simplifiedInnerContent = simplifyText(document.body.innerText);

        const termIndex = emergencyNewsConfig.pageEnablingTerms.findIndex(function (enablingTerm) {
            return simplifiedInnerContent.indexOf(enablingTerm) > -1;
        });
        if (termIndex > -1) {
            terms = message.terms;
            walk(document.body);
        }
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

var logoNews = browser.runtime.getURL("images/logo-news-full.png");
var logoCode4Ro = browser.runtime.getURL("images/logo-code4ro.svg");
var logoGov = browser.runtime.getURL("images/logo-gov.png");

function createTooltip(termData, tooltipCount) {
    let links = "<ol>";
    for (let i = 0; i < termData.links.length; i++) {
        const link = termData.links[i];
        let linkTitle;
        if (!!emergencyNewsConfig.links[link]) {
            linkTitle = emergencyNewsConfig.links[link]
        } else {
            linkTitle = link;
        }
        links += `<li><a target="_blank" href="${link}">${linkTitle}</a></li>`;
    }
    links += "</ol>";
    let paragraphs = "";
    for (let i = 0; i < termData.paragraphs.length; i++) {
        const paragraph = termData.paragraphs[i];
        paragraphs += `<p>${paragraph}</p>`;
    }

    let content = `
    <div class="emergency_news_header">
        <a target="_blank" href="https://code4.ro/ro/apps/stiri-oficiale/">
            <img src="${logoNews}" class="emergency_news_logo"></img>
        </a>
		<div>Un proiect dezvoltat de</div>
        <a target="_blank" href="https://code4.ro/">
    		<img src="${logoCode4Ro}" class="emergency_news_code4ro_logo"></img>
        </a>
        <a target="_blank" href="http://adr.gov.ro/">
    		<img src="${logoGov}" class="emergency_news_gov_logo"></img>
        </a>
	</div>
	<div class="emergency_news_body">
        <div><b>${termData.title}</b></div>
        <div>${paragraphs || ""}</div>
        <div>${links}</div>
    </div>`;

    tippy('.emergency_news_item' + +tooltipCount, {
        content: content,
        allowHTML: true,
        interactive: true,
        theme: 'light'
    });
}