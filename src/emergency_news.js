
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

function simplifyText(input) {
	const noComas = input.toLowerCase()
		.split('ș').join('s')
		.split('ț').join('t')
		.split('ă').join('a')
		.split('â').join('a')
		.split('î').join('i')
		;
	const noCedila = noComas.toLowerCase()
		.split('ş').join('s')
		.split('ţ').join('t')
		;
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
					divWithTooltip.textContent = term;

					textNode.parentNode.insertBefore(divWithTooltip, after);
					createTooltip(termData, tooltipCount);
				}
			} catch{ }
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
	return {
		begin,
		end,
		matchType
	}
}

function createTooltip(termData, tooltipCount) {
	let content = `
	<div class="emergency_news_header">
		<img src="images/logo.png" class="emergency_news_logo"></img>
		<span>Un proiect dezvoltat de</span>
		<span class="emergency_news_code4ro_logo"></span>
		<span>În parteneriat cu</span>
		<span class="emergency_news_gov_logo"></span>
	</div>
	<div><b>${termData.title}</b></div>`;
	if (termData.explanation) {
		content += `<div>${termData.explanation}"</div>`;
	}
	for (let i = 0; i < termData.links.length; i++) {
		const link = termData.links[i];
		content += `<div><a href="${link}">${link}</a></div>`;
	}

	tippy('.emergency_news_item' + + tooltipCount, {
		content: content,
		allowHTML: true,
		interactive: true,
		theme: 'light',
		trigger: 'click'
	});
}