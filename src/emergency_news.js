let terms = {};

browser.runtime.sendMessage({}).then((message) => {
	terms = message.terms;
	walk(document.body);
});

function walk(node) {
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
	var r = new RegExp();
	for (var term in terms) {
		if (terms.hasOwnProperty(term)) {
			r.compile(term, 'ig');
			var termData = terms[term];
			try {
				const matchIndex = textNode.nodeValue.match(r);
				if (matchIndex && matchIndex.length > 0) {
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

					let content = `<div><b>${termData.title}</b></div>`;
					if (termData.explanation) {
						content += `<div><a href="${termData.link}"></div>`;
					}
					for (var i = 0; i < termData.links.length; i++) {
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
			} finally { }
		}
	}

}


