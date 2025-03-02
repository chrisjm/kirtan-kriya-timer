/** @type {import('tailwindcss').Config} */
export default {
	content: ['./src/**/*.{html,js,svelte,ts}'],
	theme: {
		extend: {
			colors: {
				primary: '#10B981', // emerald-500
				success: '#059669', // emerald-600
				warning: '#D97706', // amber-600
				error: '#DC2626', // red-600
			}
		}
	},
	plugins: [require("@tailwindcss/typography")]
};
