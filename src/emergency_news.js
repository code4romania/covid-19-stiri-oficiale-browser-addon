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
            emergencyNewsConfig.terms.forEach((term) => {
                createTooltip(term.value);
            });
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
        const termData = termKv.value;
        termData.aliases.forEach((alias) => {
            try {
                const splittedText = splitTextByTerm(textNode.nodeValue, alias);
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
                    divWithTooltip.classList.add(`emergency_news_item_${termData.id}`);
                    divWithTooltip.textContent = splittedText.originalTerm;

                    textNode.parentNode.insertBefore(divWithTooltip, after);
                }
            } catch (error) {
                console.error(error);
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
    }
    return {
        begin,
        end,
        matchType,
        originalTerm
    };
}

function appendLinkImgElement(parent, href, imgSrc, itemClass) {
    const imgUrl = browser.runtime.getURL(imgSrc);
    let linkElement = document.createElement("a");
    linkElement.setAttribute("target", "_blank");
    linkElement.classList.add(itemClass);
    if (href.startsWith("http")) {
        linkElement.setAttribute("href", href);
    }
    let imgElement = document.createElement("img");
    imgElement.setAttribute("src", imgUrl);
    imgElement.classList.add(itemClass);
    linkElement.appendChild(imgElement);
    parent.appendChild(linkElement);
}

function appendTitleElement(id, parent, titleText) {
    let div = document.createElement("div");
    div.classList.add("emergency_news_title_wrapper");
    let bold = document.createElement("b");
    bold.textContent = titleText;
    div.appendChild(bold);

    let markAsRead = document.createElement("img");
    markAsRead.src = browser.runtime.getURL("images/check.svg");
    markAsRead.classList.add("emergency_news_mark_as_read");
    div.appendChild(markAsRead);

    let tooltiptext = document.createElement("span");
    tooltiptext.textContent = `Marchează ca citit '${titleText}' și ascunde pe viitor`;
    tooltiptext.classList.add("emergency_news_mark_as_read_tooltip");
    markAsRead.appendChild(tooltiptext);

    div.onclick = () => {
        document.querySelectorAll(`.emergency_news_item_${id}`).forEach((element) => {
            element.classList.remove("emergency_news");
            tippyInstances[id].forEach((instance) => {
                instance.hide();
                instance.destroy();
            });
        });
    };
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
    let listElement = document.createElement("ol");
    links.forEach((link) => {
        let listItemElement = document.createElement("li");
        let linkElement = document.createElement("a");
        let linkTitle;
        if (!!emergencyNewsConfig.links[link]) {
            linkTitle = emergencyNewsConfig.links[link];
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
    parent.appendChild(listElement);
}

function appendChartElement(parent, chartData) {
    let chartWrapper = document.createElement("div");
    const chart = echarts.init(chartWrapper);
    const options = convertStateToChartOptions(chartData.state);
    chart.setOption(options);
    chart.on('click', function (params) {
        window.open(chartData.href, '_blank');
    });
    parent.appendChild(chartWrapper);
    chartWrapper.classList.add("emergency_news_chart");
    if (typeof ResizeObserver !== 'undefined') {
        new ResizeObserver(() => {
            chart.resize();
        }).observe(parent);
    } else {
        chartWrapper.style = "width:300px; height:300px";
        chart.resize();
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

class EmergencyNewsTooltipContent extends HTMLElement {
    constructor(id, title, paragraphs, links, chart) {
        super();
        const shadow = this.attachShadow({ mode: "open" });
        const tooltipStyle = browser.runtime.getURL("emergency_news_tooltip.css");
        var style = document.createElement('link');
        style.type = "text/css";
        style.rel = "stylesheet";
        style.href = tooltipStyle;
        shadow.appendChild(style);
        let emergencyNewsHeader = document.createElement("div");
        emergencyNewsHeader.classList.add("emergency_news_header");
        appendLinkImgElement(emergencyNewsHeader, "https://code4.ro/ro/apps/stiri-oficiale/", "images/logo-news-full.png", "emergency_news_logo");
        appendLinkImgElement(emergencyNewsHeader, "https://code4.ro/", "images/logo-code4ro.svg", "emergency_news_code4ro_logo");
        appendLinkImgElement(emergencyNewsHeader, "http://adr.gov.ro/", "images/logo-gov.png", "emergency_news_gov_logo");

        let emergencyNewsBody = document.createElement("div");
        emergencyNewsBody.classList.add("emergency_news_body");
        appendTitleElement(id, emergencyNewsBody, title);
        appendParagraphElements(emergencyNewsBody, paragraphs);
        if (chart) {
            appendChartElement(emergencyNewsBody, chart);
        }
        appendLinkElements(emergencyNewsBody, links);

        const emergencyNewsContent = document.createElement('div');
        emergencyNewsContent.appendChild(emergencyNewsHeader);
        emergencyNewsContent.appendChild(emergencyNewsBody);
        shadow.appendChild(emergencyNewsContent);
    }
}

customElements.define("emergency-news-tooltip-content", EmergencyNewsTooltipContent);

var Constants = {
    confirmedColor: '#66A4FB',
    curedColor: '#65E0E0',
    deathColor: 'black'
};
function dateFromTimestamp(timestamp) {
    return new Date(timestamp * 1000);
}
function formattedShortDateString(date) {
    const months = [
        'Ian',
        'Feb',
        'Mar',
        'Apr',
        'Mai',
        'Iun',
        'Iul',
        'Aug',
        'Sep',
        'Oct',
        'Nov',
        'Dec'
    ];
    return date.getDate() + ' ' + months[date.getMonth()];
}

function convertStateToChartOptions(state) {
    const history = state.dailyStats.history;
    const confirmedCasesHistory = history.flatMap((entry) => {
        return entry.complete === false ? [] : Math.max(entry.infected, 0);
    });
    const curedCasesHistory = history.flatMap((entry) => {
        return entry.complete === false ? [] : Math.max(entry.cured, 0);
    });
    const deathCasesHistory = history.flatMap((entry) => {
        return entry.complete === false ? [] : Math.max(entry.deaths, 0);
    });
    const dateStrings = history.flatMap((entry) => {
        return entry.complete === false ? [] : this.formattedShortDateString(this.dateFromTimestamp(entry.datePublished));
    });

    var labels = ['Confirmați', 'Vindecați', 'Decedaţi'];
    return {
        xAxis: {
            type: 'category',
            data: dateStrings,
            axisLabel: {
                color: 'gray'
            }
        },
        yAxis: {
            type: 'value',
            axisLabel: {
                color: 'gray'
            }
        },
        tooltip: {
            trigger: 'axis',
            axisPointer: {
                axis: 'x'
            },
            formatter: '<h4 style="color: white">{b}</h4><span>{a2}: {c2}<br />{a1}: {c1}<br />{a0}: {c0}</span>'
        },
        legend: {
            data: labels,
            bottom: '0px',
            icon: 'circle',
        },
        grid: {
            left: '1%',
            right: 0,
            bottom: '50px',
            top: '20%',
            containLabel: true
        }, series: [
            {
                data: confirmedCasesHistory,
                name: labels[0],
                stack: 'one',
                type: 'bar',
                color: Constants.confirmedColor
            },
            {
                data: curedCasesHistory,
                name: labels[1],
                stack: 'one',
                type: 'bar',
                color: Constants.curedColor
            },
            {
                data: deathCasesHistory,
                name: labels[2],
                stack: 'one',
                type: 'bar',
                color: Constants.deathColor
            }
        ]
    };
}