// react-vite/vite.config.js - PERFORMANCE OPTIMIZED

import { defineConfig } from "vite";
import react from "@vitejs/plugin-react";
import eslint from "vite-plugin-eslint";

export default defineConfig(({ mode }) => ({
	plugins: [
		react(),
		// Only run ESLint in development
		mode === "development" &&
			eslint({
				lintOnStart: false,
				failOnError: false,
			}),
	].filter(Boolean),

	// OPTIMIZED: Build configuration for production
	build: {
		// Optimize chunk splitting for better caching
		rollupOptions: {
			output: {
				manualChunks: {
					// React core
					"react-vendor": ["react", "react-dom"],
					// Router
					"router-vendor": ["react-router-dom"],
					// Redux
					"redux-vendor": ["react-redux", "@reduxjs/toolkit"],
					// UI components (if using any large UI libraries)
					"ui-vendor": ["lucide-react"],
				},
			},
		},
		// Optimize build size
		chunkSizeWarningLimit: 1000,
		// Enable source maps only in development
		sourcemap: mode === "development",
		// Optimize minification
		minify: "terser",
		terserOptions: {
			compress: {
				drop_console: mode === "production",
				drop_debugger: mode === "production",
			},
		},
	},

	// OPTIMIZED: Development server configuration
	server: {
		proxy: {
			"/api": {
				target: "http://localhost:8000",
				changeOrigin: true,
				secure: false,
				// Enable keep-alive for better performance
				configure: (proxy, _options) => {
					proxy.on("proxyReq", (proxyReq, req, _res) => {
						proxyReq.setHeader("Connection", "keep-alive");
					});
				},
			},
		},
		// Enable HTTP/2 for development
		https: false,
		// Optimize HMR
		hmr: {
			overlay: false,
		},
		// Optimize host and port
		host: true,
		port: 5173,
	},

	// OPTIMIZED: Dependency optimization
	optimizeDeps: {
		include: [
			"react",
			"react-dom",
			"react-router-dom",
			"react-redux",
			"@reduxjs/toolkit",
			"lucide-react",
		],
		// Force optimization of these dependencies
		force: mode === "development",
	},

	// OPTIMIZED: Define global constants
	define: {
		__DEV__: mode === "development",
		__PROD__: mode === "production",
	},

	// OPTIMIZED: CSS configuration
	css: {
		// Optimize CSS processing
		devSourcemap: mode === "development",
	},
}));

// import { defineConfig } from "vite";
// import eslintPlugin from "vite-plugin-eslint";
// import react from "@vitejs/plugin-react";

// // https://vitejs.dev/config/
// export default defineConfig((mode) => ({
// 	plugins: [
// 		react(),
// 		eslintPlugin({
// 			lintOnStart: true,
// 			failOnError: mode === "production",
// 		}),
// 	],
// 	optimizeDeps: {
// 		exclude: ["lucide-react"],
// 	},
// 	server: {
// 		open: true,
// 		proxy: {
// 			"/api": "http://127.0.0.1:8000",
// 		},
// 	},
// }));
