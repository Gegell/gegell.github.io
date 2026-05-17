function walk(node, visitor) {
	if (!node || typeof node !== 'object') return;
	visitor(node);

	if (Array.isArray(node.children)) {
		for (const child of node.children) {
			walk(child, visitor);
		}
	}
}

export default function remarkFootnoteNumbering() {
	return (tree) => {
		const order = [];
		const numbering = new Map();

		walk(tree, (node) => {
			if (node.type !== 'footnoteReference' || !node.identifier) {
				return;
			}

			const id = String(node.identifier);

			if (!numbering.has(id)) {
				order.push(id);
				numbering.set(id, String(order.length));
			}

			node.label = numbering.get(id);
		});
	};
}