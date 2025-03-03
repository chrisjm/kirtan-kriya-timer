/** @type {import('tailwindcss').Config} */
export default {
	content: ['./src/**/*.{html,js,svelte,ts}'],
	darkMode: 'class',
	theme: {
		extend: {
			colors: {
				primary: '#10B981', // emerald-500
				success: '#059669', // emerald-600
				warning: '#D97706', // amber-600
				error: '#DC2626', // red-600
			},
			backgroundImage: {
				'gradient-radial': 'radial-gradient(var(--tw-gradient-stops))',
			}
		}
	},
	plugins: [require("@tailwindcss/typography")]
};
