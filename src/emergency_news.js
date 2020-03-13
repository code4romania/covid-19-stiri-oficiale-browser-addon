setTimeout(() => {
	walk(document.body);
}, 1000);

const terms = {
	"coronavirus": {
		"title": "Coronavirus",
		"explanation": "Coronaviruses (CoV) are a large family of viruses that cause illness ranging from the common cold to more severe diseases",
		"link": "https://www.who.int/health-topics/coronavirus"
	},
	"COVID-19": {
		"title": "Covid-19",
		"explanation": "Coronavirus disease 2019 (COVID-19) is an infectious disease caused by the severe acute respiratory syndrome coronavirus 2 (SARS-CoV-2). The disease has spread globally since 2019, resulting in the 2019–20 coronavirus pandemic. Common symptoms include fever, cough and shortness of breath. Muscle pain, sputum production and sore throat are some of the less common symptoms.0 While the majority of cases result in mild symptoms, some progress to pneumonia and multi-organ failure. The case fatality rate is estimated at between 1% and 5% but varies by age and other health conditions.",
		"link": "https://en.m.wikipedia.org/wiki/Coronavirus_disease_2019"
	}
};

function walk(node) {
	// I stole this function from here:
	// http://is.gd/mwZp7E

	var child, next;

	var tagName = node.tagName ? node.tagName.toLowerCase() : "";
	if (tagName == 'input' || tagName == 'textarea') {
		return;
	}
	if (node.classList && node.classList.contains('ace_editor')) {
		return;
	}

	switch (node.nodeType) {
		case 1:  // Element
		case 9:  // Document
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

let tooltipCount = 0;

function handleText(textNode) {
	for (var term in terms) {
		if (terms.hasOwnProperty(term)) {
			var termData = terms[term];
			try {
				const matchIndex = textNode.nodeValue.indexOf(term);
				if (matchIndex > 0) {
					const splitText = textNode.nodeValue.split(term);
					const textBefore = splitText[0];
					const textAfter = splitText[1];

					const before = document.createTextNode(textBefore);
					const after = textNode;
					after.nodeValue = textAfter;
					textNode.parentNode.insertBefore(before, after);
					var divWithTooltip = document.createElement("span");
					tooltipCount++;
					divWithTooltip.classList.add("emergency_news");
					divWithTooltip.classList.add("emergency_news_item" + tooltipCount);
					divWithTooltip.textContent = term;

					textNode.parentNode.insertBefore(divWithTooltip, after);
					tippy('.emergency_news_item' +  + tooltipCount, {
						content: `
						<div><b>${termData.title}</b></div>
						<div>${termData.explanation} <a href="${termData.link}">${termData.link}</a></div>`,
						allowHTML: true,
						interactive: true,
						theme: 'light'
					});
					
				}
			} finally { }
		}
	}

}


