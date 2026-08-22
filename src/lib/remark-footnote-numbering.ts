import type { Content, FootnoteReference, Root } from 'mdast';

type AstNode = Root | Content;

function walk(node: AstNode, visitor: (node: AstNode) => void): void {
	visitor(node);

	if ('children' in node) {
		for (const child of node.children) {
			walk(child, visitor);
		}
	}
}

function isFootnoteReference(node: AstNode): node is FootnoteReference {
	return node.type === 'footnoteReference';
}

export default function remarkFootnoteNumbering() {
	return (tree: Root): void => {
		const order: string[] = [];
		const numbering = new Map<string, string>();

		walk(tree, (node) => {
			if (!isFootnoteReference(node)) {
				return;
			}

			const id = node.identifier;

			if (!numbering.has(id)) {
				order.push(id);
				numbering.set(id, String(order.length));
			}

			node.label = numbering.get(id);
		});
	};
}
