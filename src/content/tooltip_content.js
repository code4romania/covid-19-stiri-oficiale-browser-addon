/*global tippyInstances, emergencyNewsConfig*/

// eslint-disable-next-line no-unused-vars
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
    let headerElement = document.createElement("div");
    headerElement.classList.add("emergency_news_title_wrapper");

    let titleElement = document.createElement("b");
    titleElement.textContent = titleText;

    let tooltipWrapper = document.createElement("div");
    tooltipWrapper.classList.add("emergency_news_mark_as_read_tooltip");

    let markAsReadImage = document.createElement("img");
    markAsReadImage.src = browser.runtime.getURL("images/check.svg");

    let tooltiptext = document.createElement("span");
    tooltiptext.textContent = `Marchează ca citit '${titleText}' și ascunde pe viitor`;
    tooltiptext.classList.add("emergency_news_mark_as_read_tooltiptext");

    headerElement.onclick = () => {
        browser.runtime.sendMessage({ type: "DISABLE_TERM", termId: id });
        const elements = document.querySelectorAll(`.emergency_news_item_${id}`);
        elements.forEach((element) => {
            tippyInstances[id].forEach((instance) => {
                instance.destroy();
            });
            element.classList.remove("emergency_news");
        });
        tippy(elements).destroy();
    };

    parent.appendChild(headerElement);
    headerElement.appendChild(titleElement);
    headerElement.appendChild(tooltipWrapper);
    tooltipWrapper.appendChild(markAsReadImage);
    tooltipWrapper.appendChild(tooltiptext);
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
        if (emergencyNewsConfig.links[link]) {
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
    chart.on('click', function () {
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
        return entry.complete === false ? [] : formattedShortDateString(dateFromTimestamp(entry.datePublished));
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