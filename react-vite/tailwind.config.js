/** @type {import('tailwindcss').Config} */
export default {
	content: ["./index.html", "./src/**/*.{js,ts,jsx,tsx}"],
	theme: {
		extend: {
			colors: {
				"steel-blue": "#3b99d9",
				peach: "#ea8d89",
				orangy: "#e08f2c",
				"light-gray": "#dddddc",
				"deep-blue": "#223f5c",
				"white-smoke": "#ecf0f1",
				silver: "#bec3c7",
				"dim-gray-2": "#49647b",
				"dark-slate-gray-2": "#404047",
				black: "#192024",
				"dim-gray-3": "#676770",
				"light-slate-gray": "#8e8e9c",
			},
		},
	},
	plugins: [],
};
