import { writable } from 'svelte/store';

// Store for UI-related state
export const uiStore = writable({
	isSettingsSidebarOpen: false
});

// Helper functions to manipulate the UI state
export const toggleSettingsSidebar = () => {
	uiStore.update((state) => ({
		...state,
		isSettingsSidebarOpen: !state.isSettingsSidebarOpen
	}));
};

export const closeSettingsSidebar = () => {
	uiStore.update((state) => ({
		...state,
		isSettingsSidebarOpen: false
	}));
};
