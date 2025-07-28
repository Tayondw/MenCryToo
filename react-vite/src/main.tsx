import React from "react";
import ReactDOM from "react-dom/client";
import { Provider } from "react-redux";
import { RouterProvider } from "react-router-dom";
import configureStore from "./store/store";
import { router } from "./router";
import * as sessionActions from "./store/session";
import "./index.css";

// Configure store with performance settings
const store = configureStore();

// Type declarations for development globals
declare global {
	interface Window {
		store: typeof store;
		sessionActions: typeof sessionActions;
	}
}

// Attach to window only in development (without CSRF)
if (import.meta.env.MODE !== "production") {
	window.store = store;
	window.sessionActions = sessionActions;
}

// Single root render with performance optimizations
ReactDOM.createRoot(document.getElementById("root")!).render(
	<React.StrictMode>
		<Provider store={store}>
			<RouterProvider
				router={router}
				fallbackElement={
					<div className="min-h-screen bg-gradient-to-br from-orange-50 via-white to-slate-50 flex items-center justify-center">
						<div className="text-center">
							<div className="w-12 h-12 border-4 border-orange-500 border-t-transparent rounded-full animate-spin mx-auto mb-4"></div>
							<p className="text-slate-600">Loading...</p>
						</div>
					</div>
				}
			/>
		</Provider>
	</React.StrictMode>,
);
