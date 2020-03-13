walk(document.body);
tippy('.emergency_news', {
	content: `
	<div><b>Coronavirus</b></div>
	<div>COVID-19 exte un virus extrem de periculos. Puteti afla mai multe pe pagina <a href="https://ncov2019.live/">ncov2019.live</a></div>`,
	allowHTML: true,
	interactive: true,
	theme: 'light'
});

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

function handleText(textNode) {
	try {
		const term = "coronavirus";
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
			divWithTooltip.className = "emergency_news";
			divWithTooltip.textContent = term;

			textNode.parentNode.insertBefore(divWithTooltip, after);
		}
	} finally { }

}


