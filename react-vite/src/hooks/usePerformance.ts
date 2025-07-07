import { useState, useEffect, useCallback, useMemo, useRef } from "react";
import { useSelector } from "react-redux";
import { RootState } from "../types";

// Hook for debounced search with caching
export const useDebounceSearch = (
	initialValue: string = "",
	delay: number = 300,
) => {
	const [value, setValue] = useState(initialValue);
	const [debouncedValue, setDebouncedValue] = useState(initialValue);

	useEffect(() => {
		const handler = setTimeout(() => {
			setDebouncedValue(value);
		}, delay);

		return () => {
			clearTimeout(handler);
		};
	}, [value, delay]);

	return [value, debouncedValue, setValue] as const;
};

// Hook for optimized user data with memoization
export const useOptimizedUser = () => {
	const sessionUser = useSelector((state: RootState) => state.session.user);

	const userMemoized = useMemo(() => {
		if (!sessionUser) return null;

		return {
			id: sessionUser.id,
			username: sessionUser.username,
			firstName: sessionUser.firstName,
			lastName: sessionUser.lastName,
			email: sessionUser.email,
			profileImage: sessionUser.profileImage,
			bio: sessionUser.bio,
			usersTags: sessionUser.usersTags || [],
			posts: sessionUser.posts || [],
			group: sessionUser.group || [],
			events: sessionUser.events || [],
			userComments: sessionUser.userComments || [],
		};
	}, [sessionUser]);

	return userMemoized;
};

// Hook for pagination with URL state
export const usePagination = (
	initialPage: number = 1,
	initialPerPage: number = 20,
) => {
	const [page, setPage] = useState(initialPage);
	const [perPage, setPerPage] = useState(Math.min(initialPerPage, 50)); // Cap at 50
	const [totalPages, setTotalPages] = useState(0);
	const [totalItems, setTotalItems] = useState(0);

	// Update URL with pagination params
	const updateURL = useCallback((newPage: number, newPerPage: number) => {
		const url = new URL(window.location.href);
		url.searchParams.set("page", newPage.toString());
		url.searchParams.set("per_page", newPerPage.toString());
		window.history.replaceState({}, "", url.toString());
	}, []);

	const goToPage = useCallback(
		(newPage: number) => {
			setPage(newPage);
			updateURL(newPage, perPage);
		},
		[perPage, updateURL],
	);

	const changePerPage = useCallback(
		(newPerPage: number) => {
			const cappedPerPage = Math.min(newPerPage, 50);
			setPerPage(cappedPerPage);
			setPage(1); // Reset to first page
			updateURL(1, cappedPerPage);
		},
		[updateURL],
	);

	// Initialize from URL params
	useEffect(() => {
		const urlParams = new URLSearchParams(window.location.search);
		const urlPage = parseInt(urlParams.get("page") || "1");
		const urlPerPage = Math.min(
			parseInt(urlParams.get("per_page") || "20"),
			50,
		);

		if (urlPage !== page) setPage(urlPage);
		if (urlPerPage !== perPage) setPerPage(urlPerPage);
	}, [page, perPage]);

	return {
		page,
		perPage,
		totalPages,
		totalItems,
		setTotalPages,
		setTotalItems,
		goToPage,
		changePerPage,
		hasNext: page < totalPages,
		hasPrev: page > 1,
	};
};

// Define filter and sort function types
type FilterFunction<T, F> = (item: T, filters: F) => boolean;
type SortFunction<T> = (a: T, b: T, sortBy: string) => number;

// Hook for filtering and sorting
export const useFilterAndSort = <T, F extends Record<string, unknown>>(
	data: T[],
	filterFn: FilterFunction<T, F>,
	sortFn: SortFunction<T>,
	initialFilters: F,
	initialSortBy: string = "recent",
) => {
	const [filters, setFilters] = useState<F>(initialFilters);
	const [sortBy, setSortBy] = useState(initialSortBy);

	const filteredAndSortedData = useMemo(() => {
		let result = [...data];

		// Apply filters
		if (Object.keys(filters).some((key) => filters[key])) {
			result = result.filter((item) => filterFn(item, filters));
		}

		// Apply sorting
		result.sort((a, b) => sortFn(a, b, sortBy));

		return result;
	}, [data, filters, sortBy, filterFn, sortFn]);

	const updateFilter = useCallback(<K extends keyof F>(key: K, value: F[K]) => {
		setFilters((prev: F) => ({ ...prev, [key]: value }));
	}, []);

	const clearFilters = useCallback(() => {
		setFilters(initialFilters);
	}, [initialFilters]);

	return {
		filteredData: filteredAndSortedData,
		filters,
		sortBy,
		updateFilter,
		setSortBy,
		clearFilters,
		hasActiveFilters: Object.keys(filters).some((key) => filters[key]),
	};
};

// Hook for lazy loading with intersection observer
export const useLazyLoading = (options: IntersectionObserverInit = {}) => {
	const [isIntersecting, setIsIntersecting] = useState(false);
	const [hasLoaded, setHasLoaded] = useState(false);
	const targetRef = useRef<HTMLDivElement>(null);

	useEffect(() => {
		const currentTarget = targetRef.current; // Copy ref to variable

		const observer = new IntersectionObserver(
			([entry]) => {
				if (entry.isIntersecting && !hasLoaded) {
					setIsIntersecting(true);
					setHasLoaded(true);
				}
			},
			{
				threshold: 0.1,
				...options,
			},
		);

		if (currentTarget) {
			observer.observe(currentTarget);
		}

		return () => {
			if (currentTarget) {
				observer.unobserve(currentTarget);
			}
		};
	}, [hasLoaded, options]);

	return { targetRef, isIntersecting, hasLoaded };
};

// Hook for API caching
export const useAPICache = <T>(
	key: string,
	fetcher: () => Promise<T>,
	ttl: number = 60000,
) => {
	const [data, setData] = useState<T | null>(null);
	const [loading, setLoading] = useState(false);
	const [error, setError] = useState<Error | null>(null);
	const cacheRef = useRef<Map<string, { data: T; timestamp: number }>>(
		new Map(),
	);

	const fetchData = useCallback(
		async (force = false) => {
			const cache = cacheRef.current.get(key);
			const now = Date.now();

			// Return cached data if valid and not forced
			if (!force && cache && now - cache.timestamp < ttl) {
				setData(cache.data);
				return cache.data;
			}

			setLoading(true);
			setError(null);

			try {
				const result = await fetcher();
				cacheRef.current.set(key, { data: result, timestamp: now });
				setData(result);
				return result;
			} catch (err) {
				setError(err as Error);
				throw err;
			} finally {
				setLoading(false);
			}
		},
		[key, fetcher, ttl],
	);

	// Fetch on mount if no cached data
	useEffect(() => {
		const cache = cacheRef.current.get(key);
		if (!cache) {
			fetchData();
		} else {
			setData(cache.data);
		}
	}, [key, fetchData]);

	const invalidateCache = useCallback(() => {
		cacheRef.current.delete(key);
	}, [key]);

	const refreshData = useCallback(() => {
		return fetchData(true);
	}, [fetchData]);

	return {
		data,
		loading,
		error,
		refetch: fetchData,
		refresh: refreshData,
		invalidate: invalidateCache,
	};
};

// Hook for performance monitoring
export const usePerformanceMonitor = (componentName: string) => {
	const renderCount = useRef(0);
	const lastRenderTime = useRef(Date.now());

	useEffect(() => {
		renderCount.current += 1;
		const now = Date.now();
		const timeSinceLastRender = now - lastRenderTime.current;
		lastRenderTime.current = now;

		if (process.env.NODE_ENV === "development") {
			console.log(
				`${componentName} render #${renderCount.current}, time since last: ${timeSinceLastRender}ms`,
			);
		}
	});

	const logPerformance = useCallback(
		(action: string, startTime: number) => {
			const duration = Date.now() - startTime;
			if (process.env.NODE_ENV === "development") {
				console.log(`${componentName} ${action} took ${duration}ms`);
			}
			return duration;
		},
		[componentName],
	);

	return { renderCount: renderCount.current, logPerformance };
};

// Hook for optimized image loading
export const useOptimizedImage = (src: string, placeholder?: string) => {
	const [imageSrc, setImageSrc] = useState(placeholder || "");
	const [isLoading, setIsLoading] = useState(true);
	const [hasError, setHasError] = useState(false);

	useEffect(() => {
		if (!src) return;

		setIsLoading(true);
		setHasError(false);

		const img = new Image();

		img.onload = () => {
			setImageSrc(src);
			setIsLoading(false);
		};

		img.onerror = () => {
			setHasError(true);
			setIsLoading(false);
			if (placeholder) {
				setImageSrc(placeholder);
			}
		};

		img.src = src;

		return () => {
			img.onload = null;
			img.onerror = null;
		};
	}, [src, placeholder]);

	return { imageSrc, isLoading, hasError };
};

// Hook for local storage with performance optimization
export const useOptimizedLocalStorage = <T>(key: string, defaultValue: T) => {
	const [value, setValue] = useState<T>(() => {
		try {
			const item = localStorage.getItem(key);
			return item ? JSON.parse(item) : defaultValue;
		} catch {
			return defaultValue;
		}
	});

	const setStoredValue = useCallback(
		(newValue: T | ((val: T) => T)) => {
			try {
				const valueToStore =
					newValue instanceof Function ? newValue(value) : newValue;
				setValue(valueToStore);
				localStorage.setItem(key, JSON.stringify(valueToStore));
			} catch (error) {
				console.error(`Error saving to localStorage:`, error);
			}
		},
		[key, value],
	);

	return [value, setStoredValue] as const;
};
