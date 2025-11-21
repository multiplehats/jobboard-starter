import { animate, type AnimationOptions, type DOMKeyframesDefinition } from 'motion';
import type { Action } from 'svelte/action';

/**
 * Parameters for the motion action
 */
export type MotionParams = {
	keyframes: DOMKeyframesDefinition;
	options?: AnimationOptions;
};

/**
 * Svelte action for animating elements using Motion.dev
 *
 * @example
 * ```svelte
 * <div use:motion={{ keyframes: { opacity: [0, 1] }, options: { duration: 0.3 } }}>
 *   Animated content
 * </div>
 * ```
 */
export const motion: Action<HTMLElement, MotionParams | undefined> = (
	node: HTMLElement,
	data: MotionParams | undefined = { keyframes: { opacity: [0, 1] } }
) => {
	if (!data) {
		return;
	}

	// Start animation immediately
	const animation = animate(node, data.keyframes, data.options);
	animation.play();

	// Return cleanup function that will be called when element is destroyed
	return {
		destroy() {
			animation.cancel();
		}
	};
};

/**
 * Common animation presets for consistent animations across the app
 */
export const animations = {
	/**
	 * Subtle fade in from bottom - good for lists and grids
	 */
	fadeInUp: (delay = 0): MotionParams => ({
		keyframes: {
			opacity: [0, 1],
			y: [8, 0]
		},
		options: {
			duration: 0.4,
			delay,
			ease: [0.22, 0.61, 0.36, 1] // Smooth deceleration
		}
	}),

	/**
	 * Subtle scale and fade in - good for cards and items
	 */
	fadeInScale: (delay = 0): MotionParams => ({
		keyframes: {
			opacity: [0, 1],
			scale: [0.95, 1]
		},
		options: {
			duration: 0.35,
			delay,
			ease: [0.34, 1.56, 0.64, 1] // Subtle bounce
		}
	}),

	/**
	 * Slide in from right - good for menus and toolbars
	 */
	slideInRight: (delay = 0): MotionParams => ({
		keyframes: {
			opacity: [0, 1],
			x: [12, 0]
		},
		options: {
			duration: 0.3,
			delay,
			ease: [0.16, 1, 0.3, 1] // Smooth entrance
		}
	}),

	/**
	 * Slide in from left
	 */
	slideInLeft: (delay = 0): MotionParams => ({
		keyframes: {
			opacity: [0, 1],
			x: [-12, 0]
		},
		options: {
			duration: 0.3,
			delay,
			ease: [0.16, 1, 0.3, 1]
		}
	}),

	/**
	 * Simple fade in
	 */
	fadeIn: (delay = 0): MotionParams => ({
		keyframes: {
			opacity: [0, 1]
		},
		options: {
			duration: 0.2,
			delay,
			ease: [0.22, 0.61, 0.36, 1]
		}
	})
};

/**
 * Magical text reveal effect that types text character by character
 * with a shimmer/glow effect
 */
export function magicalTextReveal(
	element: HTMLInputElement | HTMLTextAreaElement,
	text: string,
	options: {
		delay?: number;
		charDelay?: number;
		onComplete?: () => void;
	} = {}
) {
	const { delay = 0, charDelay = 30, onComplete } = options;

	// Clear existing value
	element.value = '';

	// Add a subtle glow effect during animation
	const originalBoxShadow = element.style.boxShadow;
	element.style.boxShadow = '0 0 0 2px rgba(139, 92, 246, 0.3), 0 0 20px rgba(139, 92, 246, 0.2)';
	element.style.transition = 'box-shadow 0.3s ease';

	// Start typing after delay
	setTimeout(() => {
		let currentIndex = 0;

		const typeInterval = setInterval(() => {
			if (currentIndex < text.length) {
				element.value = text.substring(0, currentIndex + 1);
				currentIndex++;

				// Trigger input event so form state updates
				element.dispatchEvent(new Event('input', { bubbles: true }));
			} else {
				clearInterval(typeInterval);

				// Remove glow effect
				setTimeout(() => {
					element.style.boxShadow = originalBoxShadow;
				}, 300);

				onComplete?.();
			}
		}, charDelay);
	}, delay);
}

/**
 * Magical number count-up effect for numeric inputs
 */
export function magicalNumberReveal(
	element: HTMLInputElement,
	targetValue: number,
	options: {
		delay?: number;
		duration?: number;
		onComplete?: () => void;
	} = {}
) {
	const { delay = 0, duration = 800, onComplete } = options;

	// Add a subtle glow effect during animation
	const originalBoxShadow = element.style.boxShadow;
	element.style.boxShadow = '0 0 0 2px rgba(139, 92, 246, 0.3), 0 0 20px rgba(139, 92, 246, 0.2)';
	element.style.transition = 'box-shadow 0.3s ease';

	setTimeout(() => {
		const startValue = 0;
		const startTime = Date.now();

		const animate = () => {
			const elapsed = Date.now() - startTime;
			const progress = Math.min(elapsed / duration, 1);

			// Easing function (ease-out-cubic)
			const eased = 1 - Math.pow(1 - progress, 3);
			const currentValue = Math.floor(startValue + (targetValue - startValue) * eased);

			element.value = currentValue.toString();
			element.dispatchEvent(new Event('input', { bubbles: true }));

			if (progress < 1) {
				requestAnimationFrame(animate);
			} else {
				// Ensure final value is exact
				element.value = targetValue.toString();
				element.dispatchEvent(new Event('input', { bubbles: true }));

				// Remove glow effect
				setTimeout(() => {
					element.style.boxShadow = originalBoxShadow;
				}, 300);

				onComplete?.();
			}
		};

		requestAnimationFrame(animate);
	}, delay);
}
