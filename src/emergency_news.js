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

function appendLinkImgElement(parent, href, imgSrc, imgClass) {
    const imgUrl = browser.runtime.getURL(imgSrc);
    let linkElement = document.createElement("a");
    linkElement.setAttribute("target", "_blank");
    if (href.startsWith("http")) {
        linkElement.setAttribute("href", href);
    }
    let imgElement = document.createElement("img");
    imgElement.setAttribute("src", imgUrl);
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

function appendParagraphElements(parent, paragraphs) {
    let paragraphsParent = document.createElement("div");
    paragraphs.forEach((paragraphData) => {
        let paragraph = document.createElement("p");
        paragraph.textContent = paragraphData;
        paragraphsParent.appendChild(paragraph);
    });
    parent.appendChild(paragraphsParent);
}

function appendLinkElements(parent, links) {
    let linksParent = document.createElement("div");
    let listElement = document.createElement("ol");
    links.forEach((link) => {
        let listItemElement = document.createElement("li");
        let linkElement = document.createElement("a");
        let linkTitle;
        if (!!emergencyNewsConfig.links[link]) {
            linkTitle = emergencyNewsConfig.links[link]
        } else {
            linkTitle = link;
        }
        linkElement.setAttribute("target", "_blank");
        if (link.startsWith("http")) {
            linkElement.setAttribute("href", link);
        }
        linkElement.textContent = linkTitle;
        listItemElement.appendChild(linkElement);
        listElement.appendChild(listItemElement);
    });
    linksParent.appendChild(listElement);
    parent.appendChild(linksParent);
}

function createTooltip(termData, tooltipCount) {
    const tippyData = {
        content: () => {
            const newBody = new App();
            let emergencyNewsHeader = document.createElement("div");
            emergencyNewsHeader.classList.add("emergency_news_header");
            appendLinkImgElement(emergencyNewsHeader, "https://code4.ro/ro/apps/stiri-oficiale/", "images/logo-news-full.png", "emergency_news_logo");
            appendLinkImgElement(emergencyNewsHeader, "https://code4.ro/", "images/logo-code4ro.svg", "emergency_news_code4ro_logo");
            appendLinkImgElement(emergencyNewsHeader, "http://adr.gov.ro/", "images/logo-gov.png", "emergency_news_gov_logo");

            let emergencyNewsBody = document.createElement("div");
            emergencyNewsBody.classList.add("emergency_news_body");
            appendTitleElement(emergencyNewsBody, termData.title);
            appendParagraphElements(emergencyNewsBody, termData.paragraphs);
            appendLinkElements(emergencyNewsBody, termData.links);

            let emergencyNewsContent = document.createElement("div");
            emergencyNewsContent.appendChild(emergencyNewsHeader);
            emergencyNewsContent.appendChild(emergencyNewsBody);
            newBody.appendChild(emergencyNewsContent);
            return newBody;
            // return emergencyNewsContent;
        },
        interactive: true,
        maxWidth: 600,
        theme: 'light'
    };
    if (emergencyNewsConfig.isDevMode) {
        tippyData.trigger = 'click';
    }
    tippy('.emergency_news_item' + (+tooltipCount), tippyData);
}

const template = document.createElement("template");
template.innerHTML = `
<style>
:host {
    display: block;
    all: unset;
    font-weight: normal !important;
}
:host {
    background-color: #f9f9f9;
    padding: 0px 0px;
}

:host .emergency_news_header {
    background-color: #ffffff;
    display: flex;
    align-items: center;
    justify-content: space-evenly;
    flex-wrap: wrap;
    padding: 5px;
}

:host .emergency_news_header div {
    font-size: 12px !important;
}

@media (max-width: 800px) {
    :host .emergency_news_header div {
        display: none;
    }
}

:host .emergency_news_body {
    padding: 10px;
}

:host .tippy-box .emergency_news_body a {
    color: #1c1080;
}

:host .emergency_news_body div {
    padding-top: 3px;
}

:host img.emergency_news_logo {
    height: 35px !important;
    padding: 5px 60px 5px 5px;
}

:host img.emergency_news_code4ro_logo {
    height: 35px !important;
    padding: 5px 10px 5px 5px;
}

:host img.emergency_news_gov_logo {
    height: 35px !important;
    padding: 5px;
}
</style>
<div>
  <div class="emergency_news_header">
      <a target="_blank" href="https://code4.ro/ro/apps/stiri-oficiale/">
          <img src="moz-extension://7e5890dc-5f27-45d7-bd80-9764b1f0dd45/images/logo-news-full.png"
              class="emergency_news_logo">
      </a>
      <a target="_blank" href="https://code4.ro/">
          <img src="moz-extension://7e5890dc-5f27-45d7-bd80-9764b1f0dd45/images/logo-code4ro.svg"
              class="emergency_news_code4ro_logo">
      </a>
      <a target="_blank" href="http://adr.gov.ro/">
          <img src="moz-extension://7e5890dc-5f27-45d7-bd80-9764b1f0dd45/images/logo-gov.png"
              class="emergency_news_gov_logo">
      </a>
  </div>
  <div class="emergency_news_body">
      <div><b>Transmitere Coronavirus</b></div>
      <div>
          <p>Coronavirus poate fi transmis de la o persoană la alta, de obicei după un contact strâns cu o persoană
              infectată. Virusul se transmite mai ales pe cale respiratorie, dar poate intra în corp prin ochi, nas și
              gură, astfel eviați atingerea dacă nu v-ați spălat bine mâinile. Animalele de companie nu transmit
              coronavirus.</p>
          <p>Mai multe informații găsiți aici:</p>
      </div>
      <div>
          <ol>
              <li><a target="_blank"
                      href="https://www.prefectura.mai.gov.ro/ce-trebuie-sa-stiti-despre-noul-coronavirus">Instituțiile
                      prefectului Portalul instituțiilor prefectului din Romania</a></li>
          </ol>
      </div>
  </div>
</div>`;

class App extends HTMLElement {
    constructor() {
        super();
        const shadow = this.attachShadow({ mode: "open" });
        shadow.appendChild(template.content.cloneNode(true));
    }
}

customElements.define("extension-app", App);