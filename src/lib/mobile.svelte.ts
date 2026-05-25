import { browser } from '$app/environment';

export const mediaQueries = {
	mobile: '(max-width: 155ch)'
} as const;

function mediaQueryState(query: string) {
	let matches = $state(false);

	if (browser) {
		const media = window.matchMedia(query);

		matches = media.matches;
		media.addEventListener('change', (event) => {
			matches = event.matches;
		});
	}

	return {
		get matches() {
			return matches;
		}
	};
}

export const mobile = mediaQueryState(mediaQueries.mobile);
