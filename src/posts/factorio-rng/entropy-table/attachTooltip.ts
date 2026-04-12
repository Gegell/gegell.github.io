import type { Action } from 'svelte/action';
import './attachTooltip.css';

const TOOLTIP_OFFSET = 8;
const TOUCH_TOOLTIP_MS = 1200;
const VIEWPORT_PADDING = 8;
const TOOLTIP_CLASS = 'item-tooltip';

type TooltipOptions = {
	label: string;
	offset?: number;
	touchMs?: number;
	viewportPadding?: number;
	className?: string;
};

type TooltipParam = string | TooltipOptions;

function resolveOptions(param: TooltipParam): Required<TooltipOptions> {
	if (typeof param === 'string') {
		return {
			label: param,
			offset: TOOLTIP_OFFSET,
			touchMs: TOUCH_TOOLTIP_MS,
			viewportPadding: VIEWPORT_PADDING,
			className: TOOLTIP_CLASS
		};
	}

	return {
		label: param.label,
		offset: param.offset ?? TOOLTIP_OFFSET,
		touchMs: param.touchMs ?? TOUCH_TOOLTIP_MS,
		viewportPadding: param.viewportPadding ?? VIEWPORT_PADDING,
		className: param.className ?? TOOLTIP_CLASS
	};
}

export const attachTooltip: Action<HTMLElement, TooltipParam> = (node, initialParam) => {
	let options = resolveOptions(initialParam);

	const tooltip = document.createElement('div');
	tooltip.className = options.className;
	tooltip.setAttribute('aria-hidden', 'true');
	tooltip.textContent = options.label;
	document.body.appendChild(tooltip);

	const controller = new AbortController();
	const listenerOptions = { signal: controller.signal };

	let touchTimer: ReturnType<typeof setTimeout> | null = null;
	let rafId: number | null = null;
	let isVisible = false;

	function positionTooltip() {
		const rect = node.getBoundingClientRect();
		const targetCenter = rect.left + rect.width / 2;

		const tooltipRect = tooltip.getBoundingClientRect();
		const minCenter = tooltipRect.width / 2 + options.viewportPadding;
		const maxCenter = window.innerWidth - tooltipRect.width / 2 - options.viewportPadding;
		const clampedCenter = Math.min(maxCenter, Math.max(minCenter, targetCenter));

		tooltip.style.left = `${clampedCenter}px`;
		tooltip.style.top = `${rect.top - options.offset}px`;
	}

	function startTracking() {
		if (rafId !== null) {
			return;
		}

		const tick = () => {
			if (!isVisible) {
				rafId = null;
				return;
			}
			positionTooltip();
			rafId = requestAnimationFrame(tick);
		};

		rafId = requestAnimationFrame(tick);
	}

	function stopTracking() {
		if (rafId !== null) {
			cancelAnimationFrame(rafId);
			rafId = null;
		}
	}

	function show() {
		isVisible = true;
		positionTooltip();
		tooltip.dataset.visible = 'true';
		startTracking();
	}

	function hide() {
		isVisible = false;
		tooltip.dataset.visible = 'false';
		stopTracking();
		if (touchTimer) {
			clearTimeout(touchTimer);
			touchTimer = null;
		}
	}

	function onPointerDown(event: PointerEvent) {
		if (event.pointerType !== 'touch') {
			return;
		}
		show();
		if (touchTimer) {
			clearTimeout(touchTimer);
		}
		touchTimer = setTimeout(() => {
			hide();
			touchTimer = null;
		}, options.touchMs);
	}

	node.addEventListener('mouseenter', show, listenerOptions);
	node.addEventListener('mouseleave', hide, listenerOptions);
	node.addEventListener('focus', show, listenerOptions);
	node.addEventListener('blur', hide, listenerOptions);
	node.addEventListener('pointerdown', onPointerDown, listenerOptions);
	window.addEventListener('resize', positionTooltip, listenerOptions);

	return {
		update(nextParam: TooltipParam) {
			const prevClassName = options.className;
			options = resolveOptions(nextParam);
			tooltip.textContent = options.label;
			if (options.className !== prevClassName) {
				tooltip.className = options.className;
			}
			if (isVisible) {
				positionTooltip();
			}
		},
		destroy() {
			controller.abort();
			stopTracking();
			if (touchTimer) {
				clearTimeout(touchTimer);
			}
			tooltip.remove();
		}
	};
};
