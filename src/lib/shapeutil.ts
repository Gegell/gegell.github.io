function bboxAnchorPos(angle_deg: number, bbox_w: number, bbox_h: number) {
	// Angle to 0-4 range (repeating)
	angle_deg /= 90;

	const tri = (val: number) => Math.abs(val - Math.round(val));
	const truncTri = (val: number) => Math.min(Math.max(tri(val / 4) * 4 - 0.5, 0), 1) - 0.5;

	return [truncTri(angle_deg + 1) * bbox_w, truncTri(angle_deg) * bbox_h];
}

export function center(el: HTMLElement) {
	const center_x = el.offsetLeft + el.offsetWidth / 2;
	const center_y = el.offsetTop + el.offsetHeight / 2;
	return [center_x, center_y];
}

export function anchor(angle_deg: number, el: HTMLElement) {
	if (!el) {
		return [0, 0];
	}
	const [center_x, center_y] = center(el);
	const [box_x, box_y] = bboxAnchorPos(angle_deg, el.offsetWidth, el.offsetHeight);
	return [center_x + box_x, center_y + box_y];
}
