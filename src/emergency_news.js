let terms = {};

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
		.replace(/ș/g, 's')
		.replace(/ț/g, 't')
		.replace(/ă/g, 'a')
		.replace(/â/g, 'a')
		.replace(/î/g, 'i')
		;
	const noCedila = input.toLowerCase()
		.replace(/ş/g, 's')
		.replace(/ţ/g, 't')
		;
	return noCedila;
}

let tooltipCount = 0;
function handleText(textNode) {
	for (let term in terms) {
		if (terms.hasOwnProperty(term)) {
			let termData = terms[term];
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

				let content = `<div><b>${termData.title}</b></div>`;
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
					theme: 'light'
				});
			}
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
	if (termIndex === 0) {
		matchType = "START";
		begin = "";
		end = fullString.substring(term.length, stop);
	} else if (fullString.length == (term.length + termIndex)) {
		matchType = "END";
		begin = fullString.substring(0, termIndex);
		end = "";
	} else if (termIndex !== -1) {
		matchType = "MID";
		begin = fullString.substring(0, termIndex);
		end = fullString.substring(termIndex - 1, stop);
	} else {
		matchType = "MISSING";
	}
	return {
		begin,
		end,
		matchType
	}
}
