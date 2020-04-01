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
        } catch (error) {
            console.error(error);
        }
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

function createTooltip(termData, tooltipCount) {
    const tippyData = {
        content: () => {
            try {
                return new EmergencyNewsTooltipContent(termData.title, termData.paragraphs, termData.links);
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
    tippy('.emergency_news_item' + (+tooltipCount), tippyData);
}

class EmergencyNewsTooltipContent extends HTMLElement {
    constructor(title, paragraphs, links) {
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
        appendTitleElement(emergencyNewsBody, "Date La Zi");
        // appendTitleElement(emergencyNewsBody, title);
        // appendParagraphElements(emergencyNewsBody, paragraphs);
        let chart = document.createElement("div");
        chart.style = "width:400px; height:400px;";
        chart.classList.add("emergency_news_chart");
        emergencyNewsBody.appendChild(chart);
        var myChart = echarts.init(chart);
        myChart.setOption(option);
        myChart.on('click', function (params) {
            window.open('https://datelazi.ro', '_blank');
        });

        // appendLinkElements(emergencyNewsBody, links);

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

var dateLaZiData = {
    "ageHistogram": {
        "datePublished": 1585681080,
        "datePublishedString": "2020-03-31",
        "last_updated_on": 1585681080,
        "last_updated_on_string": "31 Martie la 21:58",
        "histogram": {
            "0-9": 30,
            "10-19": 47,
            "20-29": 165,
            "30-39": 337,
            "40-49": 501,
            "50-59": 373,
            "60-69": 228,
            "70-79": 126,
            ">80": 29,
            "în procesare": 116
        },
        "total": 1952
    },
    "dailyStats": {
        "last_updated_on": 1585681080,
        "last_updated_on_string": "31 Martie la 21:58",
        "currentDay": {
            "datePublished": 1585681080,
            "datePublishedString": "2020-03-31",
            "infected": 2245,
            "cured": 220,
            "deaths": 82,
            "averageAge": "46",
            "complete": true
        },
        "history": [
            {
                "datePublished": 1584530100,
                "datePublishedString": "2020-03-18",
                "infected": 43,
                "cured": 0,
                "deaths": 0,
                "averageAge": "41",
                "complete": true
            },
            {
                "datePublished": 1584616500,
                "datePublishedString": "2020-03-19",
                "infected": 17,
                "cured": 6,
                "deaths": 0,
                "averageAge": "41",
                "complete": true
            },
            {
                "datePublished": 1584702900,
                "datePublishedString": "2020-03-20",
                "infected": 31,
                "cured": 6,
                "deaths": 0,
                "averageAge": "41",
                "complete": true
            },
            {
                "datePublished": 1584789300,
                "datePublishedString": "2020-03-21",
                "infected": 59,
                "cured": 21,
                "deaths": 0,
                "averageAge": "41",
                "complete": true
            },
            {
                "datePublished": 1584875700,
                "datePublishedString": "2020-03-22",
                "infected": 66,
                "cured": 12,
                "deaths": 2,
                "averageAge": "41",
                "complete": true
            },
            {
                "datePublished": 1584962100,
                "datePublishedString": "2020-03-23",
                "infected": 143,
                "cured": 9,
                "deaths": 2,
                "averageAge": "42",
                "complete": true
            },
            {
                "datePublished": 1585048500,
                "datePublishedString": "2020-03-24",
                "infected": 186,
                "cured": 6,
                "deaths": 4,
                "averageAge": "43",
                "complete": true
            },
            {
                "datePublished": 1585134900,
                "datePublishedString": "2020-03-25",
                "infected": 144,
                "cured": 7,
                "deaths": 9,
                "averageAge": "43",
                "complete": true
            },
            {
                "datePublished": 1585256040,
                "datePublishedString": "2020-03-26",
                "infected": 123,
                "cured": 8,
                "deaths": 6,
                "averageAge": "45",
                "complete": true
            },
            {
                "datePublished": 1585333080,
                "datePublishedString": "2020-03-27",
                "infected": 263,
                "cured": 21,
                "deaths": 3,
                "averageAge": "45",
                "complete": true
            },
            {
                "datePublished": 1585432140,
                "datePublishedString": "2020-03-28",
                "infected": 160,
                "cured": 24,
                "deaths": 11,
                "averageAge": "46",
                "complete": true
            },
            {
                "datePublished": 1585506480,
                "datePublishedString": "2020-03-29",
                "infected": 308,
                "cured": 30,
                "deaths": 6,
                "averageAge": "46",
                "complete": true
            },
            {
                "datePublished": 1585595280,
                "datePublishedString": "2020-03-30",
                "infected": 192,
                "cured": 11,
                "deaths": 22,
                "averageAge": "46",
                "complete": true
            },
            {
                "datePublished": 1585681080,
                "datePublishedString": "2020-03-31",
                "infected": 293,
                "cured": 40,
                "deaths": 17,
                "averageAge": "46",
                "complete": true
            }
        ]
    },
    "genderStats": {
        "datePublished": 1585681080,
        "datePublishedString": "2020-03-31",
        "last_updated_on": 1585681080,
        "last_updated_on_string": "31 Martie la 21:58",
        "percentageOfMen": 41.0,
        "percentageOfWomen": 55.0,
        "percentageOfChildren": 4.0,
        "totalPercentage": 100.0,
        "totalNumber": 2245
    },
    "lastDataUpdateDetails": {
        "last_updated_on": 1585681080,
        "last_updated_on_string": "31 Martie la 21:58"
    },
    "quickStats": {
        "last_updated_on": 1585681080,
        "last_updated_on_string": "31 Martie la 21:58",
        "date": 0,
        "totals": {
            "date": 1585681080,
            "date_string": "2020-03-31",
            "confirmed": 2245,
            "cured": 220,
            "deaths": 82
        },
        "history": [
            {
                "date": 1584530100,
                "date_string": "2020-03-18",
                "confirmed": 260,
                "cured": 19,
                "deaths": 0
            },
            {
                "date": 1584616500,
                "date_string": "2020-03-19",
                "confirmed": 277,
                "cured": 25,
                "deaths": 0
            },
            {
                "date": 1584702900,
                "date_string": "2020-03-20",
                "confirmed": 308,
                "cured": 31,
                "deaths": 0
            },
            {
                "date": 1584789300,
                "date_string": "2020-03-21",
                "confirmed": 367,
                "cured": 52,
                "deaths": 0
            },
            {
                "date": 1584875700,
                "date_string": "2020-03-22",
                "confirmed": 433,
                "cured": 64,
                "deaths": 2
            },
            {
                "date": 1584962100,
                "date_string": "2020-03-23",
                "confirmed": 576,
                "cured": 73,
                "deaths": 4
            },
            {
                "date": 1585048500,
                "date_string": "2020-03-24",
                "confirmed": 762,
                "cured": 79,
                "deaths": 8
            },
            {
                "date": 1585134900,
                "date_string": "2020-03-25",
                "confirmed": 906,
                "cured": 86,
                "deaths": 17
            },
            {
                "date": 1585256040,
                "date_string": "2020-03-26",
                "confirmed": 1029,
                "cured": 94,
                "deaths": 23
            },
            {
                "date": 1585333080,
                "date_string": "2020-03-27",
                "confirmed": 1292,
                "cured": 115,
                "deaths": 26
            },
            {
                "date": 1585432140,
                "date_string": "2020-03-28",
                "confirmed": 1452,
                "cured": 139,
                "deaths": 37
            },
            {
                "date": 1585506480,
                "date_string": "2020-03-29",
                "confirmed": 1760,
                "cured": 169,
                "deaths": 43
            },
            {
                "date": 1585595280,
                "date_string": "2020-03-30",
                "confirmed": 1952,
                "cured": 180,
                "deaths": 65
            },
            {
                "date": 1585681080,
                "date_string": "2020-03-31",
                "confirmed": 2245,
                "cured": 220,
                "deaths": 82
            }
        ]
    }
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

const history = dateLaZiData.dailyStats.history;
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

const state = {
    // isLoaded: true,
    // startDate: startDateStr,
    // endDate: endDateStr,
    dates: dateStrings,
    confirmedCasesHistory: confirmedCasesHistory,
    curedCasesHistory: curedCasesHistory,
    deathCasesHistory: deathCasesHistory,
};

var labels = ['Confirmați', 'Vindecați', 'Decedaţi'];
var option = {
    xAxis: {
        type: 'category',
        data: state.dates,
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
            data: state.confirmedCasesHistory,
            name: labels[0],
            stack: 'one',
            type: 'bar',
            color: Constants.confirmedColor
        },
        {
            data: state.curedCasesHistory,
            name: labels[1],
            stack: 'one',
            type: 'bar',
            color: Constants.curedColor
        },
        {
            data: state.deathCasesHistory,
            name: labels[2],
            stack: 'one',
            type: 'bar',
            color: Constants.deathColor
        }
    ]
};
