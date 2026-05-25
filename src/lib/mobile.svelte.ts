import { browser } from '$app/environment';

export const mediaQueries = {
	mobileToc: '(max-width: 155ch)',
	mobileHeader: '(max-width: 768px)'
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

export const mobileToc = mediaQueryState(mediaQueries.mobileToc);
export const mobileHeader = mediaQueryState(mediaQueries.mobileHeader);
