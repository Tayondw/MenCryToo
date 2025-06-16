import {
	legacy_createStore as createStore,
	applyMiddleware,
	compose,
	combineReducers,
	Store,
	Middleware,
} from "redux";
import thunk, { ThunkMiddleware } from "redux-thunk";
import sessionReducer from "./session";
import { RootState, SessionAction } from "../types";

const rootReducer = combineReducers({
	session: sessionReducer,
});

// Extend Window interface for Redux DevTools
declare global {
	interface Window {
		__REDUX_DEVTOOLS_EXTENSION_COMPOSE__?: typeof compose;
	}
}

let enhancer;
if (import.meta.env.MODE === "production") {
	enhancer = applyMiddleware(
		thunk as ThunkMiddleware<RootState, SessionAction>,
	);
} else {
	// Handle redux-logger import with proper typing
	let logger: Middleware | null = null;
	try {
		const reduxLogger = await import("redux-logger");
		logger = reduxLogger.default as Middleware;
	} catch (error) {
		console.warn("Redux logger not available:", error);
	}

	const composeEnhancers =
		window.__REDUX_DEVTOOLS_EXTENSION_COMPOSE__ || compose;

	if (logger) {
		enhancer = composeEnhancers(
			applyMiddleware(
				thunk as ThunkMiddleware<RootState, SessionAction>,
				logger,
			),
		);
	} else {
		enhancer = composeEnhancers(
			applyMiddleware(thunk as ThunkMiddleware<RootState, SessionAction>),
		);
	}
}

const configureStore = (
	preloadedState?: Partial<RootState>,
): Store<RootState> => {
	return createStore(rootReducer, preloadedState, enhancer);
};

export default configureStore;
