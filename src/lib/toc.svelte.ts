export const toc = $state({
	available: false,
	open: true,
	toggle() {
		this.open = !this.open;
	}
});
