import { writable } from 'svelte/store';
import { browser } from '$app/environment';

// Available interval multipliers (in minutes)
export const intervalOptions = [
	{ value: 0.25, label: '30 sec' },
	{ value: 0.5, label: '1 min' },
	{ value: 0.75, label: '1 min 30 sec' },
	{ value: 1, label: '2 min' }
];

// Get stored interval multiplier or use default (1 minute)
const getStoredIntervalMultiplier = (): number => {
	if (!browser) return 1;

	const stored = localStorage.getItem('kirtan-kriya-interval-multiplier');
	if (stored) {
		const value = parseFloat(stored);
		// Validate that the stored value is one of our valid options
		if (intervalOptions.some((option) => option.value === value)) {
			return value;
		}
	}
	return 1; // Default to 1 minute
};

// Save interval multiplier to local storage
const saveIntervalMultiplier = (value: number): void => {
	if (!browser) return;
	localStorage.setItem('kirtan-kriya-interval-multiplier', value.toString());
};

// Create the interval multiplier store
const createIntervalStore = () => {
	const initialValue = getStoredIntervalMultiplier();
	const { subscribe, set } = writable<number>(initialValue);

	return {
		subscribe,
		setMultiplier: (value: number) => {
			if (intervalOptions.some((option) => option.value === value)) {
				saveIntervalMultiplier(value);
				set(value);
			}
		}
	};
};

export const intervalStore = createIntervalStore();
