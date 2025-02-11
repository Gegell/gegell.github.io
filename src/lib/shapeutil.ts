export type Point = [number, number];

function bboxAnchorPos(angle_deg: number, bbox_w: number, bbox_h: number) {
	// Angle to 0-4 range (repeating)
	angle_deg /= 90;

	const tri = (val: number) => Math.abs(val - Math.round(val));
	const truncTri = (val: number) => Math.min(Math.max(tri(val / 4) * 4 - 0.5, 0), 1) - 0.5;

	return [truncTri(angle_deg + 1) * bbox_w, truncTri(angle_deg) * bbox_h];
}

export function center(el: SVGGraphicsElement) {
	const bbox = el.getBBox();
	return [bbox.x + bbox.width / 2, bbox.y + bbox.height / 2];
}

export function anchor(angle_deg: number, el: SVGGraphicsElement): Point {
	if (!el) return [0, 0];
	const bbox = el.getBBox();
	const [center_x, center_y] = center(el);
	const [box_x, box_y] = bboxAnchorPos(angle_deg, bbox.width, bbox.height);
	return [center_x + box_x, center_y + box_y];
}
