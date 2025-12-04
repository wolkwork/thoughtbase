var FeedbackWidget = (function(exports) {
	Object.defineProperty(exports, Symbol.toStringTag, { value: "Module" });
	var __create = Object.create;
	var __defProp = Object.defineProperty;
	var __getOwnPropDesc = Object.getOwnPropertyDescriptor;
	var __getOwnPropNames = Object.getOwnPropertyNames;
	var __getProtoOf = Object.getPrototypeOf;
	var __hasOwnProp = Object.prototype.hasOwnProperty;
	var __commonJSMin = (cb, mod) => () => (mod || cb((mod = { exports: {} }).exports, mod), mod.exports);
	var __copyProps = (to, from, except, desc) => {
		if (from && typeof from === "object" || typeof from === "function") for (var keys = __getOwnPropNames(from), i = 0, n = keys.length, key; i < n; i++) {
			key = keys[i];
			if (!__hasOwnProp.call(to, key) && key !== except) __defProp(to, key, {
				get: ((k) => from[k]).bind(null, key),
				enumerable: !(desc = __getOwnPropDesc(from, key)) || desc.enumerable
			});
		}
		return to;
	};
	var __toESM = (mod, isNodeMode, target) => (target = mod != null ? __create(__getProtoOf(mod)) : {}, __copyProps(isNodeMode || !mod || !mod.__esModule ? __defProp(target, "default", {
		value: mod,
		enumerable: true
	}) : target, mod));
	var Subscribable = class {
		constructor() {
			this.listeners = /* @__PURE__ */ new Set();
			this.subscribe = this.subscribe.bind(this);
		}
		subscribe(listener) {
			this.listeners.add(listener);
			this.onSubscribe();
			return () => {
				this.listeners.delete(listener);
				this.onUnsubscribe();
			};
		}
		hasListeners() {
			return this.listeners.size > 0;
		}
		onSubscribe() {}
		onUnsubscribe() {}
	};
	var defaultTimeoutProvider = {
		setTimeout: (callback, delay) => setTimeout(callback, delay),
		clearTimeout: (timeoutId) => clearTimeout(timeoutId),
		setInterval: (callback, delay) => setInterval(callback, delay),
		clearInterval: (intervalId) => clearInterval(intervalId)
	};
	var TimeoutManager = class {
		#provider = defaultTimeoutProvider;
		#providerCalled = false;
		setTimeoutProvider(provider) {
			this.#provider = provider;
		}
		setTimeout(callback, delay) {
			return this.#provider.setTimeout(callback, delay);
		}
		clearTimeout(timeoutId) {
			this.#provider.clearTimeout(timeoutId);
		}
		setInterval(callback, delay) {
			return this.#provider.setInterval(callback, delay);
		}
		clearInterval(intervalId) {
			this.#provider.clearInterval(intervalId);
		}
	};
	var timeoutManager = new TimeoutManager();
	function systemSetTimeoutZero(callback) {
		setTimeout(callback, 0);
	}
	var isServer = typeof window === "undefined" || "Deno" in globalThis;
	function noop$3() {}
	function functionalUpdate(updater, input) {
		return typeof updater === "function" ? updater(input) : updater;
	}
	function isValidTimeout(value) {
		return typeof value === "number" && value >= 0 && value !== Infinity;
	}
	function timeUntilStale(updatedAt, staleTime) {
		return Math.max(updatedAt + (staleTime || 0) - Date.now(), 0);
	}
	function resolveStaleTime(staleTime, query) {
		return typeof staleTime === "function" ? staleTime(query) : staleTime;
	}
	function resolveEnabled(enabled, query) {
		return typeof enabled === "function" ? enabled(query) : enabled;
	}
	function matchQuery(filters, query) {
		const { type = "all", exact, fetchStatus, predicate, queryKey, stale } = filters;
		if (queryKey) {
			if (exact) {
				if (query.queryHash !== hashQueryKeyByOptions(queryKey, query.options)) return false;
			} else if (!partialMatchKey(query.queryKey, queryKey)) return false;
		}
		if (type !== "all") {
			const isActive = query.isActive();
			if (type === "active" && !isActive) return false;
			if (type === "inactive" && isActive) return false;
		}
		if (typeof stale === "boolean" && query.isStale() !== stale) return false;
		if (fetchStatus && fetchStatus !== query.state.fetchStatus) return false;
		if (predicate && !predicate(query)) return false;
		return true;
	}
	function matchMutation(filters, mutation) {
		const { exact, status, predicate, mutationKey } = filters;
		if (mutationKey) {
			if (!mutation.options.mutationKey) return false;
			if (exact) {
				if (hashKey(mutation.options.mutationKey) !== hashKey(mutationKey)) return false;
			} else if (!partialMatchKey(mutation.options.mutationKey, mutationKey)) return false;
		}
		if (status && mutation.state.status !== status) return false;
		if (predicate && !predicate(mutation)) return false;
		return true;
	}
	function hashQueryKeyByOptions(queryKey, options$1) {
		return (options$1?.queryKeyHashFn || hashKey)(queryKey);
	}
	function hashKey(queryKey) {
		return JSON.stringify(queryKey, (_, val) => isPlainObject(val) ? Object.keys(val).sort().reduce((result, key) => {
			result[key] = val[key];
			return result;
		}, {}) : val);
	}
	function partialMatchKey(a$1, b) {
		if (a$1 === b) return true;
		if (typeof a$1 !== typeof b) return false;
		if (a$1 && b && typeof a$1 === "object" && typeof b === "object") return Object.keys(b).every((key) => partialMatchKey(a$1[key], b[key]));
		return false;
	}
	var hasOwn = Object.prototype.hasOwnProperty;
	function replaceEqualDeep(a$1, b) {
		if (a$1 === b) return a$1;
		const array = isPlainArray(a$1) && isPlainArray(b);
		if (!array && !(isPlainObject(a$1) && isPlainObject(b))) return b;
		const aSize = (array ? a$1 : Object.keys(a$1)).length;
		const bItems = array ? b : Object.keys(b);
		const bSize = bItems.length;
		const copy = array ? new Array(bSize) : {};
		let equalItems = 0;
		for (let i = 0; i < bSize; i++) {
			const key = array ? i : bItems[i];
			const aItem = a$1[key];
			const bItem = b[key];
			if (aItem === bItem) {
				copy[key] = aItem;
				if (array ? i < aSize : hasOwn.call(a$1, key)) equalItems++;
				continue;
			}
			if (aItem === null || bItem === null || typeof aItem !== "object" || typeof bItem !== "object") {
				copy[key] = bItem;
				continue;
			}
			const v = replaceEqualDeep(aItem, bItem);
			copy[key] = v;
			if (v === aItem) equalItems++;
		}
		return aSize === bSize && equalItems === aSize ? a$1 : copy;
	}
	function shallowEqualObjects(a$1, b) {
		if (!b || Object.keys(a$1).length !== Object.keys(b).length) return false;
		for (const key in a$1) if (a$1[key] !== b[key]) return false;
		return true;
	}
	function isPlainArray(value) {
		return Array.isArray(value) && value.length === Object.keys(value).length;
	}
	function isPlainObject(o$2) {
		if (!hasObjectPrototype(o$2)) return false;
		const ctor = o$2.constructor;
		if (ctor === void 0) return true;
		const prot = ctor.prototype;
		if (!hasObjectPrototype(prot)) return false;
		if (!prot.hasOwnProperty("isPrototypeOf")) return false;
		if (Object.getPrototypeOf(o$2) !== Object.prototype) return false;
		return true;
	}
	function hasObjectPrototype(o$2) {
		return Object.prototype.toString.call(o$2) === "[object Object]";
	}
	function sleep(timeout) {
		return new Promise((resolve) => {
			timeoutManager.setTimeout(resolve, timeout);
		});
	}
	function replaceData(prevData, data, options$1) {
		if (typeof options$1.structuralSharing === "function") return options$1.structuralSharing(prevData, data);
		else if (options$1.structuralSharing !== false) return replaceEqualDeep(prevData, data);
		return data;
	}
	function addToEnd(items, item, max = 0) {
		const newItems = [...items, item];
		return max && newItems.length > max ? newItems.slice(1) : newItems;
	}
	function addToStart(items, item, max = 0) {
		const newItems = [item, ...items];
		return max && newItems.length > max ? newItems.slice(0, -1) : newItems;
	}
	var skipToken = Symbol();
	function ensureQueryFn(options$1, fetchOptions) {
		if (!options$1.queryFn && fetchOptions?.initialPromise) return () => fetchOptions.initialPromise;
		if (!options$1.queryFn || options$1.queryFn === skipToken) return () => Promise.reject(/* @__PURE__ */ new Error(`Missing queryFn: '${options$1.queryHash}'`));
		return options$1.queryFn;
	}
	function shouldThrowError(throwOnError, params) {
		if (typeof throwOnError === "function") return throwOnError(...params);
		return !!throwOnError;
	}
	var FocusManager = class extends Subscribable {
		#focused;
		#cleanup;
		#setup;
		constructor() {
			super();
			this.#setup = (onFocus) => {
				if (!isServer && window.addEventListener) {
					const listener = () => onFocus();
					window.addEventListener("visibilitychange", listener, false);
					return () => {
						window.removeEventListener("visibilitychange", listener);
					};
				}
			};
		}
		onSubscribe() {
			if (!this.#cleanup) this.setEventListener(this.#setup);
		}
		onUnsubscribe() {
			if (!this.hasListeners()) {
				this.#cleanup?.();
				this.#cleanup = void 0;
			}
		}
		setEventListener(setup) {
			this.#setup = setup;
			this.#cleanup?.();
			this.#cleanup = setup((focused) => {
				if (typeof focused === "boolean") this.setFocused(focused);
				else this.onFocus();
			});
		}
		setFocused(focused) {
			if (this.#focused !== focused) {
				this.#focused = focused;
				this.onFocus();
			}
		}
		onFocus() {
			const isFocused = this.isFocused();
			this.listeners.forEach((listener) => {
				listener(isFocused);
			});
		}
		isFocused() {
			if (typeof this.#focused === "boolean") return this.#focused;
			return globalThis.document?.visibilityState !== "hidden";
		}
	};
	var focusManager = new FocusManager();
	function pendingThenable() {
		let resolve;
		let reject;
		const thenable = new Promise((_resolve, _reject) => {
			resolve = _resolve;
			reject = _reject;
		});
		thenable.status = "pending";
		thenable.catch(() => {});
		function finalize(data) {
			Object.assign(thenable, data);
			delete thenable.resolve;
			delete thenable.reject;
		}
		thenable.resolve = (value) => {
			finalize({
				status: "fulfilled",
				value
			});
			resolve(value);
		};
		thenable.reject = (reason) => {
			finalize({
				status: "rejected",
				reason
			});
			reject(reason);
		};
		return thenable;
	}
	var defaultScheduler = systemSetTimeoutZero;
	function createNotifyManager() {
		let queue = [];
		let transactions = 0;
		let notifyFn = (callback) => {
			callback();
		};
		let batchNotifyFn = (callback) => {
			callback();
		};
		let scheduleFn = defaultScheduler;
		const schedule = (callback) => {
			if (transactions) queue.push(callback);
			else scheduleFn(() => {
				notifyFn(callback);
			});
		};
		const flush = () => {
			const originalQueue = queue;
			queue = [];
			if (originalQueue.length) scheduleFn(() => {
				batchNotifyFn(() => {
					originalQueue.forEach((callback) => {
						notifyFn(callback);
					});
				});
			});
		};
		return {
			batch: (callback) => {
				let result;
				transactions++;
				try {
					result = callback();
				} finally {
					transactions--;
					if (!transactions) flush();
				}
				return result;
			},
			batchCalls: (callback) => {
				return (...args) => {
					schedule(() => {
						callback(...args);
					});
				};
			},
			schedule,
			setNotifyFunction: (fn) => {
				notifyFn = fn;
			},
			setBatchNotifyFunction: (fn) => {
				batchNotifyFn = fn;
			},
			setScheduler: (fn) => {
				scheduleFn = fn;
			}
		};
	}
	var notifyManager = createNotifyManager();
	var OnlineManager = class extends Subscribable {
		#online = true;
		#cleanup;
		#setup;
		constructor() {
			super();
			this.#setup = (onOnline) => {
				if (!isServer && window.addEventListener) {
					const onlineListener = () => onOnline(true);
					const offlineListener = () => onOnline(false);
					window.addEventListener("online", onlineListener, false);
					window.addEventListener("offline", offlineListener, false);
					return () => {
						window.removeEventListener("online", onlineListener);
						window.removeEventListener("offline", offlineListener);
					};
				}
			};
		}
		onSubscribe() {
			if (!this.#cleanup) this.setEventListener(this.#setup);
		}
		onUnsubscribe() {
			if (!this.hasListeners()) {
				this.#cleanup?.();
				this.#cleanup = void 0;
			}
		}
		setEventListener(setup) {
			this.#setup = setup;
			this.#cleanup?.();
			this.#cleanup = setup(this.setOnline.bind(this));
		}
		setOnline(online) {
			if (this.#online !== online) {
				this.#online = online;
				this.listeners.forEach((listener) => {
					listener(online);
				});
			}
		}
		isOnline() {
			return this.#online;
		}
	};
	var onlineManager = new OnlineManager();
	function defaultRetryDelay(failureCount) {
		return Math.min(1e3 * 2 ** failureCount, 3e4);
	}
	function canFetch(networkMode) {
		return (networkMode ?? "online") === "online" ? onlineManager.isOnline() : true;
	}
	var CancelledError = class extends Error {
		constructor(options$1) {
			super("CancelledError");
			this.revert = options$1?.revert;
			this.silent = options$1?.silent;
		}
	};
	function createRetryer(config) {
		let isRetryCancelled = false;
		let failureCount = 0;
		let continueFn;
		const thenable = pendingThenable();
		const isResolved = () => thenable.status !== "pending";
		const cancel = (cancelOptions) => {
			if (!isResolved()) {
				const error = new CancelledError(cancelOptions);
				reject(error);
				config.onCancel?.(error);
			}
		};
		const cancelRetry = () => {
			isRetryCancelled = true;
		};
		const continueRetry = () => {
			isRetryCancelled = false;
		};
		const canContinue = () => focusManager.isFocused() && (config.networkMode === "always" || onlineManager.isOnline()) && config.canRun();
		const canStart = () => canFetch(config.networkMode) && config.canRun();
		const resolve = (value) => {
			if (!isResolved()) {
				continueFn?.();
				thenable.resolve(value);
			}
		};
		const reject = (value) => {
			if (!isResolved()) {
				continueFn?.();
				thenable.reject(value);
			}
		};
		const pause = () => {
			return new Promise((continueResolve) => {
				continueFn = (value) => {
					if (isResolved() || canContinue()) continueResolve(value);
				};
				config.onPause?.();
			}).then(() => {
				continueFn = void 0;
				if (!isResolved()) config.onContinue?.();
			});
		};
		const run = () => {
			if (isResolved()) return;
			let promiseOrValue;
			const initialPromise = failureCount === 0 ? config.initialPromise : void 0;
			try {
				promiseOrValue = initialPromise ?? config.fn();
			} catch (error) {
				promiseOrValue = Promise.reject(error);
			}
			Promise.resolve(promiseOrValue).then(resolve).catch((error) => {
				if (isResolved()) return;
				const retry = config.retry ?? (isServer ? 0 : 3);
				const retryDelay = config.retryDelay ?? defaultRetryDelay;
				const delay = typeof retryDelay === "function" ? retryDelay(failureCount, error) : retryDelay;
				const shouldRetry = retry === true || typeof retry === "number" && failureCount < retry || typeof retry === "function" && retry(failureCount, error);
				if (isRetryCancelled || !shouldRetry) {
					reject(error);
					return;
				}
				failureCount++;
				config.onFail?.(failureCount, error);
				sleep(delay).then(() => {
					return canContinue() ? void 0 : pause();
				}).then(() => {
					if (isRetryCancelled) reject(error);
					else run();
				});
			});
		};
		return {
			promise: thenable,
			status: () => thenable.status,
			cancel,
			continue: () => {
				continueFn?.();
				return thenable;
			},
			cancelRetry,
			continueRetry,
			canStart,
			start: () => {
				if (canStart()) run();
				else pause().then(run);
				return thenable;
			}
		};
	}
	var Removable = class {
		#gcTimeout;
		destroy() {
			this.clearGcTimeout();
		}
		scheduleGc() {
			this.clearGcTimeout();
			if (isValidTimeout(this.gcTime)) this.#gcTimeout = timeoutManager.setTimeout(() => {
				this.optionalRemove();
			}, this.gcTime);
		}
		updateGcTime(newGcTime) {
			this.gcTime = Math.max(this.gcTime || 0, newGcTime ?? (isServer ? Infinity : 300 * 1e3));
		}
		clearGcTimeout() {
			if (this.#gcTimeout) {
				timeoutManager.clearTimeout(this.#gcTimeout);
				this.#gcTimeout = void 0;
			}
		}
	};
	var Query = class extends Removable {
		#initialState;
		#revertState;
		#cache;
		#client;
		#retryer;
		#defaultOptions;
		#abortSignalConsumed;
		constructor(config) {
			super();
			this.#abortSignalConsumed = false;
			this.#defaultOptions = config.defaultOptions;
			this.setOptions(config.options);
			this.observers = [];
			this.#client = config.client;
			this.#cache = this.#client.getQueryCache();
			this.queryKey = config.queryKey;
			this.queryHash = config.queryHash;
			this.#initialState = getDefaultState$1(this.options);
			this.state = config.state ?? this.#initialState;
			this.scheduleGc();
		}
		get meta() {
			return this.options.meta;
		}
		get promise() {
			return this.#retryer?.promise;
		}
		setOptions(options$1) {
			this.options = {
				...this.#defaultOptions,
				...options$1
			};
			this.updateGcTime(this.options.gcTime);
			if (this.state && this.state.data === void 0) {
				const defaultState = getDefaultState$1(this.options);
				if (defaultState.data !== void 0) {
					this.setState(successState(defaultState.data, defaultState.dataUpdatedAt));
					this.#initialState = defaultState;
				}
			}
		}
		optionalRemove() {
			if (!this.observers.length && this.state.fetchStatus === "idle") this.#cache.remove(this);
		}
		setData(newData, options$1) {
			const data = replaceData(this.state.data, newData, this.options);
			this.#dispatch({
				data,
				type: "success",
				dataUpdatedAt: options$1?.updatedAt,
				manual: options$1?.manual
			});
			return data;
		}
		setState(state, setStateOptions) {
			this.#dispatch({
				type: "setState",
				state,
				setStateOptions
			});
		}
		cancel(options$1) {
			const promise = this.#retryer?.promise;
			this.#retryer?.cancel(options$1);
			return promise ? promise.then(noop$3).catch(noop$3) : Promise.resolve();
		}
		destroy() {
			super.destroy();
			this.cancel({ silent: true });
		}
		reset() {
			this.destroy();
			this.setState(this.#initialState);
		}
		isActive() {
			return this.observers.some((observer) => resolveEnabled(observer.options.enabled, this) !== false);
		}
		isDisabled() {
			if (this.getObserversCount() > 0) return !this.isActive();
			return this.options.queryFn === skipToken || this.state.dataUpdateCount + this.state.errorUpdateCount === 0;
		}
		isStatic() {
			if (this.getObserversCount() > 0) return this.observers.some((observer) => resolveStaleTime(observer.options.staleTime, this) === "static");
			return false;
		}
		isStale() {
			if (this.getObserversCount() > 0) return this.observers.some((observer) => observer.getCurrentResult().isStale);
			return this.state.data === void 0 || this.state.isInvalidated;
		}
		isStaleByTime(staleTime = 0) {
			if (this.state.data === void 0) return true;
			if (staleTime === "static") return false;
			if (this.state.isInvalidated) return true;
			return !timeUntilStale(this.state.dataUpdatedAt, staleTime);
		}
		onFocus() {
			this.observers.find((x) => x.shouldFetchOnWindowFocus())?.refetch({ cancelRefetch: false });
			this.#retryer?.continue();
		}
		onOnline() {
			this.observers.find((x) => x.shouldFetchOnReconnect())?.refetch({ cancelRefetch: false });
			this.#retryer?.continue();
		}
		addObserver(observer) {
			if (!this.observers.includes(observer)) {
				this.observers.push(observer);
				this.clearGcTimeout();
				this.#cache.notify({
					type: "observerAdded",
					query: this,
					observer
				});
			}
		}
		removeObserver(observer) {
			if (this.observers.includes(observer)) {
				this.observers = this.observers.filter((x) => x !== observer);
				if (!this.observers.length) {
					if (this.#retryer) if (this.#abortSignalConsumed) this.#retryer.cancel({ revert: true });
					else this.#retryer.cancelRetry();
					this.scheduleGc();
				}
				this.#cache.notify({
					type: "observerRemoved",
					query: this,
					observer
				});
			}
		}
		getObserversCount() {
			return this.observers.length;
		}
		invalidate() {
			if (!this.state.isInvalidated) this.#dispatch({ type: "invalidate" });
		}
		async fetch(options$1, fetchOptions) {
			if (this.state.fetchStatus !== "idle" && this.#retryer?.status() !== "rejected") {
				if (this.state.data !== void 0 && fetchOptions?.cancelRefetch) this.cancel({ silent: true });
				else if (this.#retryer) {
					this.#retryer.continueRetry();
					return this.#retryer.promise;
				}
			}
			if (options$1) this.setOptions(options$1);
			if (!this.options.queryFn) {
				const observer = this.observers.find((x) => x.options.queryFn);
				if (observer) this.setOptions(observer.options);
			}
			const abortController = new AbortController();
			const addSignalProperty = (object) => {
				Object.defineProperty(object, "signal", {
					enumerable: true,
					get: () => {
						this.#abortSignalConsumed = true;
						return abortController.signal;
					}
				});
			};
			const fetchFn = () => {
				const queryFn = ensureQueryFn(this.options, fetchOptions);
				const createQueryFnContext = () => {
					const queryFnContext2 = {
						client: this.#client,
						queryKey: this.queryKey,
						meta: this.meta
					};
					addSignalProperty(queryFnContext2);
					return queryFnContext2;
				};
				const queryFnContext = createQueryFnContext();
				this.#abortSignalConsumed = false;
				if (this.options.persister) return this.options.persister(queryFn, queryFnContext, this);
				return queryFn(queryFnContext);
			};
			const createFetchContext = () => {
				const context2 = {
					fetchOptions,
					options: this.options,
					queryKey: this.queryKey,
					client: this.#client,
					state: this.state,
					fetchFn
				};
				addSignalProperty(context2);
				return context2;
			};
			const context = createFetchContext();
			this.options.behavior?.onFetch(context, this);
			this.#revertState = this.state;
			if (this.state.fetchStatus === "idle" || this.state.fetchMeta !== context.fetchOptions?.meta) this.#dispatch({
				type: "fetch",
				meta: context.fetchOptions?.meta
			});
			this.#retryer = createRetryer({
				initialPromise: fetchOptions?.initialPromise,
				fn: context.fetchFn,
				onCancel: (error) => {
					if (error instanceof CancelledError && error.revert) this.setState({
						...this.#revertState,
						fetchStatus: "idle"
					});
					abortController.abort();
				},
				onFail: (failureCount, error) => {
					this.#dispatch({
						type: "failed",
						failureCount,
						error
					});
				},
				onPause: () => {
					this.#dispatch({ type: "pause" });
				},
				onContinue: () => {
					this.#dispatch({ type: "continue" });
				},
				retry: context.options.retry,
				retryDelay: context.options.retryDelay,
				networkMode: context.options.networkMode,
				canRun: () => true
			});
			try {
				const data = await this.#retryer.start();
				if (data === void 0) throw new Error(`${this.queryHash} data is undefined`);
				this.setData(data);
				this.#cache.config.onSuccess?.(data, this);
				this.#cache.config.onSettled?.(data, this.state.error, this);
				return data;
			} catch (error) {
				if (error instanceof CancelledError) {
					if (error.silent) return this.#retryer.promise;
					else if (error.revert) {
						if (this.state.data === void 0) throw error;
						return this.state.data;
					}
				}
				this.#dispatch({
					type: "error",
					error
				});
				this.#cache.config.onError?.(error, this);
				this.#cache.config.onSettled?.(this.state.data, error, this);
				throw error;
			} finally {
				this.scheduleGc();
			}
		}
		#dispatch(action) {
			const reducer = (state) => {
				switch (action.type) {
					case "failed": return {
						...state,
						fetchFailureCount: action.failureCount,
						fetchFailureReason: action.error
					};
					case "pause": return {
						...state,
						fetchStatus: "paused"
					};
					case "continue": return {
						...state,
						fetchStatus: "fetching"
					};
					case "fetch": return {
						...state,
						...fetchState(state.data, this.options),
						fetchMeta: action.meta ?? null
					};
					case "success":
						const newState = {
							...state,
							...successState(action.data, action.dataUpdatedAt),
							dataUpdateCount: state.dataUpdateCount + 1,
							...!action.manual && {
								fetchStatus: "idle",
								fetchFailureCount: 0,
								fetchFailureReason: null
							}
						};
						this.#revertState = action.manual ? newState : void 0;
						return newState;
					case "error":
						const error = action.error;
						return {
							...state,
							error,
							errorUpdateCount: state.errorUpdateCount + 1,
							errorUpdatedAt: Date.now(),
							fetchFailureCount: state.fetchFailureCount + 1,
							fetchFailureReason: error,
							fetchStatus: "idle",
							status: "error"
						};
					case "invalidate": return {
						...state,
						isInvalidated: true
					};
					case "setState": return {
						...state,
						...action.state
					};
				}
			};
			this.state = reducer(this.state);
			notifyManager.batch(() => {
				this.observers.forEach((observer) => {
					observer.onQueryUpdate();
				});
				this.#cache.notify({
					query: this,
					type: "updated",
					action
				});
			});
		}
	};
	function fetchState(data, options$1) {
		return {
			fetchFailureCount: 0,
			fetchFailureReason: null,
			fetchStatus: canFetch(options$1.networkMode) ? "fetching" : "paused",
			...data === void 0 && {
				error: null,
				status: "pending"
			}
		};
	}
	function successState(data, dataUpdatedAt) {
		return {
			data,
			dataUpdatedAt: dataUpdatedAt ?? Date.now(),
			error: null,
			isInvalidated: false,
			status: "success"
		};
	}
	function getDefaultState$1(options$1) {
		const data = typeof options$1.initialData === "function" ? options$1.initialData() : options$1.initialData;
		const hasData = data !== void 0;
		const initialDataUpdatedAt = hasData ? typeof options$1.initialDataUpdatedAt === "function" ? options$1.initialDataUpdatedAt() : options$1.initialDataUpdatedAt : 0;
		return {
			data,
			dataUpdateCount: 0,
			dataUpdatedAt: hasData ? initialDataUpdatedAt ?? Date.now() : 0,
			error: null,
			errorUpdateCount: 0,
			errorUpdatedAt: 0,
			fetchFailureCount: 0,
			fetchFailureReason: null,
			fetchMeta: null,
			isInvalidated: false,
			status: hasData ? "success" : "pending",
			fetchStatus: "idle"
		};
	}
	var QueryObserver = class extends Subscribable {
		constructor(client, options$1) {
			super();
			this.options = options$1;
			this.#client = client;
			this.#selectError = null;
			this.#currentThenable = pendingThenable();
			this.bindMethods();
			this.setOptions(options$1);
		}
		#client;
		#currentQuery = void 0;
		#currentQueryInitialState = void 0;
		#currentResult = void 0;
		#currentResultState;
		#currentResultOptions;
		#currentThenable;
		#selectError;
		#selectFn;
		#selectResult;
		#lastQueryWithDefinedData;
		#staleTimeoutId;
		#refetchIntervalId;
		#currentRefetchInterval;
		#trackedProps = /* @__PURE__ */ new Set();
		bindMethods() {
			this.refetch = this.refetch.bind(this);
		}
		onSubscribe() {
			if (this.listeners.size === 1) {
				this.#currentQuery.addObserver(this);
				if (shouldFetchOnMount(this.#currentQuery, this.options)) this.#executeFetch();
				else this.updateResult();
				this.#updateTimers();
			}
		}
		onUnsubscribe() {
			if (!this.hasListeners()) this.destroy();
		}
		shouldFetchOnReconnect() {
			return shouldFetchOn(this.#currentQuery, this.options, this.options.refetchOnReconnect);
		}
		shouldFetchOnWindowFocus() {
			return shouldFetchOn(this.#currentQuery, this.options, this.options.refetchOnWindowFocus);
		}
		destroy() {
			this.listeners = /* @__PURE__ */ new Set();
			this.#clearStaleTimeout();
			this.#clearRefetchInterval();
			this.#currentQuery.removeObserver(this);
		}
		setOptions(options$1) {
			const prevOptions = this.options;
			const prevQuery = this.#currentQuery;
			this.options = this.#client.defaultQueryOptions(options$1);
			if (this.options.enabled !== void 0 && typeof this.options.enabled !== "boolean" && typeof this.options.enabled !== "function" && typeof resolveEnabled(this.options.enabled, this.#currentQuery) !== "boolean") throw new Error("Expected enabled to be a boolean or a callback that returns a boolean");
			this.#updateQuery();
			this.#currentQuery.setOptions(this.options);
			if (prevOptions._defaulted && !shallowEqualObjects(this.options, prevOptions)) this.#client.getQueryCache().notify({
				type: "observerOptionsUpdated",
				query: this.#currentQuery,
				observer: this
			});
			const mounted = this.hasListeners();
			if (mounted && shouldFetchOptionally(this.#currentQuery, prevQuery, this.options, prevOptions)) this.#executeFetch();
			this.updateResult();
			if (mounted && (this.#currentQuery !== prevQuery || resolveEnabled(this.options.enabled, this.#currentQuery) !== resolveEnabled(prevOptions.enabled, this.#currentQuery) || resolveStaleTime(this.options.staleTime, this.#currentQuery) !== resolveStaleTime(prevOptions.staleTime, this.#currentQuery))) this.#updateStaleTimeout();
			const nextRefetchInterval = this.#computeRefetchInterval();
			if (mounted && (this.#currentQuery !== prevQuery || resolveEnabled(this.options.enabled, this.#currentQuery) !== resolveEnabled(prevOptions.enabled, this.#currentQuery) || nextRefetchInterval !== this.#currentRefetchInterval)) this.#updateRefetchInterval(nextRefetchInterval);
		}
		getOptimisticResult(options$1) {
			const query = this.#client.getQueryCache().build(this.#client, options$1);
			const result = this.createResult(query, options$1);
			if (shouldAssignObserverCurrentProperties(this, result)) {
				this.#currentResult = result;
				this.#currentResultOptions = this.options;
				this.#currentResultState = this.#currentQuery.state;
			}
			return result;
		}
		getCurrentResult() {
			return this.#currentResult;
		}
		trackResult(result, onPropTracked) {
			return new Proxy(result, { get: (target, key) => {
				this.trackProp(key);
				onPropTracked?.(key);
				if (key === "promise") {
					this.trackProp("data");
					if (!this.options.experimental_prefetchInRender && this.#currentThenable.status === "pending") this.#currentThenable.reject(/* @__PURE__ */ new Error("experimental_prefetchInRender feature flag is not enabled"));
				}
				return Reflect.get(target, key);
			} });
		}
		trackProp(key) {
			this.#trackedProps.add(key);
		}
		getCurrentQuery() {
			return this.#currentQuery;
		}
		refetch({ ...options$1 } = {}) {
			return this.fetch({ ...options$1 });
		}
		fetchOptimistic(options$1) {
			const defaultedOptions = this.#client.defaultQueryOptions(options$1);
			const query = this.#client.getQueryCache().build(this.#client, defaultedOptions);
			return query.fetch().then(() => this.createResult(query, defaultedOptions));
		}
		fetch(fetchOptions) {
			return this.#executeFetch({
				...fetchOptions,
				cancelRefetch: fetchOptions.cancelRefetch ?? true
			}).then(() => {
				this.updateResult();
				return this.#currentResult;
			});
		}
		#executeFetch(fetchOptions) {
			this.#updateQuery();
			let promise = this.#currentQuery.fetch(this.options, fetchOptions);
			if (!fetchOptions?.throwOnError) promise = promise.catch(noop$3);
			return promise;
		}
		#updateStaleTimeout() {
			this.#clearStaleTimeout();
			const staleTime = resolveStaleTime(this.options.staleTime, this.#currentQuery);
			if (isServer || this.#currentResult.isStale || !isValidTimeout(staleTime)) return;
			const timeout = timeUntilStale(this.#currentResult.dataUpdatedAt, staleTime) + 1;
			this.#staleTimeoutId = timeoutManager.setTimeout(() => {
				if (!this.#currentResult.isStale) this.updateResult();
			}, timeout);
		}
		#computeRefetchInterval() {
			return (typeof this.options.refetchInterval === "function" ? this.options.refetchInterval(this.#currentQuery) : this.options.refetchInterval) ?? false;
		}
		#updateRefetchInterval(nextInterval) {
			this.#clearRefetchInterval();
			this.#currentRefetchInterval = nextInterval;
			if (isServer || resolveEnabled(this.options.enabled, this.#currentQuery) === false || !isValidTimeout(this.#currentRefetchInterval) || this.#currentRefetchInterval === 0) return;
			this.#refetchIntervalId = timeoutManager.setInterval(() => {
				if (this.options.refetchIntervalInBackground || focusManager.isFocused()) this.#executeFetch();
			}, this.#currentRefetchInterval);
		}
		#updateTimers() {
			this.#updateStaleTimeout();
			this.#updateRefetchInterval(this.#computeRefetchInterval());
		}
		#clearStaleTimeout() {
			if (this.#staleTimeoutId) {
				timeoutManager.clearTimeout(this.#staleTimeoutId);
				this.#staleTimeoutId = void 0;
			}
		}
		#clearRefetchInterval() {
			if (this.#refetchIntervalId) {
				timeoutManager.clearInterval(this.#refetchIntervalId);
				this.#refetchIntervalId = void 0;
			}
		}
		createResult(query, options$1) {
			const prevQuery = this.#currentQuery;
			const prevOptions = this.options;
			const prevResult = this.#currentResult;
			const prevResultState = this.#currentResultState;
			const prevResultOptions = this.#currentResultOptions;
			const queryInitialState = query !== prevQuery ? query.state : this.#currentQueryInitialState;
			const { state } = query;
			let newState = { ...state };
			let isPlaceholderData = false;
			let data;
			if (options$1._optimisticResults) {
				const mounted = this.hasListeners();
				const fetchOnMount = !mounted && shouldFetchOnMount(query, options$1);
				const fetchOptionally = mounted && shouldFetchOptionally(query, prevQuery, options$1, prevOptions);
				if (fetchOnMount || fetchOptionally) newState = {
					...newState,
					...fetchState(state.data, query.options)
				};
				if (options$1._optimisticResults === "isRestoring") newState.fetchStatus = "idle";
			}
			let { error, errorUpdatedAt, status } = newState;
			data = newState.data;
			let skipSelect = false;
			if (options$1.placeholderData !== void 0 && data === void 0 && status === "pending") {
				let placeholderData;
				if (prevResult?.isPlaceholderData && options$1.placeholderData === prevResultOptions?.placeholderData) {
					placeholderData = prevResult.data;
					skipSelect = true;
				} else placeholderData = typeof options$1.placeholderData === "function" ? options$1.placeholderData(this.#lastQueryWithDefinedData?.state.data, this.#lastQueryWithDefinedData) : options$1.placeholderData;
				if (placeholderData !== void 0) {
					status = "success";
					data = replaceData(prevResult?.data, placeholderData, options$1);
					isPlaceholderData = true;
				}
			}
			if (options$1.select && data !== void 0 && !skipSelect) if (prevResult && data === prevResultState?.data && options$1.select === this.#selectFn) data = this.#selectResult;
			else try {
				this.#selectFn = options$1.select;
				data = options$1.select(data);
				data = replaceData(prevResult?.data, data, options$1);
				this.#selectResult = data;
				this.#selectError = null;
			} catch (selectError) {
				this.#selectError = selectError;
			}
			if (this.#selectError) {
				error = this.#selectError;
				data = this.#selectResult;
				errorUpdatedAt = Date.now();
				status = "error";
			}
			const isFetching = newState.fetchStatus === "fetching";
			const isPending = status === "pending";
			const isError = status === "error";
			const isLoading = isPending && isFetching;
			const hasData = data !== void 0;
			const nextResult = {
				status,
				fetchStatus: newState.fetchStatus,
				isPending,
				isSuccess: status === "success",
				isError,
				isInitialLoading: isLoading,
				isLoading,
				data,
				dataUpdatedAt: newState.dataUpdatedAt,
				error,
				errorUpdatedAt,
				failureCount: newState.fetchFailureCount,
				failureReason: newState.fetchFailureReason,
				errorUpdateCount: newState.errorUpdateCount,
				isFetched: newState.dataUpdateCount > 0 || newState.errorUpdateCount > 0,
				isFetchedAfterMount: newState.dataUpdateCount > queryInitialState.dataUpdateCount || newState.errorUpdateCount > queryInitialState.errorUpdateCount,
				isFetching,
				isRefetching: isFetching && !isPending,
				isLoadingError: isError && !hasData,
				isPaused: newState.fetchStatus === "paused",
				isPlaceholderData,
				isRefetchError: isError && hasData,
				isStale: isStale(query, options$1),
				refetch: this.refetch,
				promise: this.#currentThenable,
				isEnabled: resolveEnabled(options$1.enabled, query) !== false
			};
			if (this.options.experimental_prefetchInRender) {
				const finalizeThenableIfPossible = (thenable) => {
					if (nextResult.status === "error") thenable.reject(nextResult.error);
					else if (nextResult.data !== void 0) thenable.resolve(nextResult.data);
				};
				const recreateThenable = () => {
					finalizeThenableIfPossible(this.#currentThenable = nextResult.promise = pendingThenable());
				};
				const prevThenable = this.#currentThenable;
				switch (prevThenable.status) {
					case "pending":
						if (query.queryHash === prevQuery.queryHash) finalizeThenableIfPossible(prevThenable);
						break;
					case "fulfilled":
						if (nextResult.status === "error" || nextResult.data !== prevThenable.value) recreateThenable();
						break;
					case "rejected":
						if (nextResult.status !== "error" || nextResult.error !== prevThenable.reason) recreateThenable();
						break;
				}
			}
			return nextResult;
		}
		updateResult() {
			const prevResult = this.#currentResult;
			const nextResult = this.createResult(this.#currentQuery, this.options);
			this.#currentResultState = this.#currentQuery.state;
			this.#currentResultOptions = this.options;
			if (this.#currentResultState.data !== void 0) this.#lastQueryWithDefinedData = this.#currentQuery;
			if (shallowEqualObjects(nextResult, prevResult)) return;
			this.#currentResult = nextResult;
			const shouldNotifyListeners = () => {
				if (!prevResult) return true;
				const { notifyOnChangeProps } = this.options;
				const notifyOnChangePropsValue = typeof notifyOnChangeProps === "function" ? notifyOnChangeProps() : notifyOnChangeProps;
				if (notifyOnChangePropsValue === "all" || !notifyOnChangePropsValue && !this.#trackedProps.size) return true;
				const includedProps = new Set(notifyOnChangePropsValue ?? this.#trackedProps);
				if (this.options.throwOnError) includedProps.add("error");
				return Object.keys(this.#currentResult).some((key) => {
					const typedKey = key;
					return this.#currentResult[typedKey] !== prevResult[typedKey] && includedProps.has(typedKey);
				});
			};
			this.#notify({ listeners: shouldNotifyListeners() });
		}
		#updateQuery() {
			const query = this.#client.getQueryCache().build(this.#client, this.options);
			if (query === this.#currentQuery) return;
			const prevQuery = this.#currentQuery;
			this.#currentQuery = query;
			this.#currentQueryInitialState = query.state;
			if (this.hasListeners()) {
				prevQuery?.removeObserver(this);
				query.addObserver(this);
			}
		}
		onQueryUpdate() {
			this.updateResult();
			if (this.hasListeners()) this.#updateTimers();
		}
		#notify(notifyOptions) {
			notifyManager.batch(() => {
				if (notifyOptions.listeners) this.listeners.forEach((listener) => {
					listener(this.#currentResult);
				});
				this.#client.getQueryCache().notify({
					query: this.#currentQuery,
					type: "observerResultsUpdated"
				});
			});
		}
	};
	function shouldLoadOnMount(query, options$1) {
		return resolveEnabled(options$1.enabled, query) !== false && query.state.data === void 0 && !(query.state.status === "error" && options$1.retryOnMount === false);
	}
	function shouldFetchOnMount(query, options$1) {
		return shouldLoadOnMount(query, options$1) || query.state.data !== void 0 && shouldFetchOn(query, options$1, options$1.refetchOnMount);
	}
	function shouldFetchOn(query, options$1, field) {
		if (resolveEnabled(options$1.enabled, query) !== false && resolveStaleTime(options$1.staleTime, query) !== "static") {
			const value = typeof field === "function" ? field(query) : field;
			return value === "always" || value !== false && isStale(query, options$1);
		}
		return false;
	}
	function shouldFetchOptionally(query, prevQuery, options$1, prevOptions) {
		return (query !== prevQuery || resolveEnabled(prevOptions.enabled, query) === false) && (!options$1.suspense || query.state.status !== "error") && isStale(query, options$1);
	}
	function isStale(query, options$1) {
		return resolveEnabled(options$1.enabled, query) !== false && query.isStaleByTime(resolveStaleTime(options$1.staleTime, query));
	}
	function shouldAssignObserverCurrentProperties(observer, optimisticResult) {
		if (!shallowEqualObjects(observer.getCurrentResult(), optimisticResult)) return true;
		return false;
	}
	function infiniteQueryBehavior(pages) {
		return { onFetch: (context, query) => {
			const options$1 = context.options;
			const direction = context.fetchOptions?.meta?.fetchMore?.direction;
			const oldPages = context.state.data?.pages || [];
			const oldPageParams = context.state.data?.pageParams || [];
			let result = {
				pages: [],
				pageParams: []
			};
			let currentPage = 0;
			const fetchFn = async () => {
				let cancelled = false;
				const addSignalProperty = (object) => {
					Object.defineProperty(object, "signal", {
						enumerable: true,
						get: () => {
							if (context.signal.aborted) cancelled = true;
							else context.signal.addEventListener("abort", () => {
								cancelled = true;
							});
							return context.signal;
						}
					});
				};
				const queryFn = ensureQueryFn(context.options, context.fetchOptions);
				const fetchPage = async (data, param, previous) => {
					if (cancelled) return Promise.reject();
					if (param == null && data.pages.length) return Promise.resolve(data);
					const createQueryFnContext = () => {
						const queryFnContext2 = {
							client: context.client,
							queryKey: context.queryKey,
							pageParam: param,
							direction: previous ? "backward" : "forward",
							meta: context.options.meta
						};
						addSignalProperty(queryFnContext2);
						return queryFnContext2;
					};
					const page = await queryFn(createQueryFnContext());
					const { maxPages } = context.options;
					const addTo = previous ? addToStart : addToEnd;
					return {
						pages: addTo(data.pages, page, maxPages),
						pageParams: addTo(data.pageParams, param, maxPages)
					};
				};
				if (direction && oldPages.length) {
					const previous = direction === "backward";
					const pageParamFn = previous ? getPreviousPageParam : getNextPageParam;
					const oldData = {
						pages: oldPages,
						pageParams: oldPageParams
					};
					result = await fetchPage(oldData, pageParamFn(options$1, oldData), previous);
				} else {
					const remainingPages = pages ?? oldPages.length;
					do {
						const param = currentPage === 0 ? oldPageParams[0] ?? options$1.initialPageParam : getNextPageParam(options$1, result);
						if (currentPage > 0 && param == null) break;
						result = await fetchPage(result, param);
						currentPage++;
					} while (currentPage < remainingPages);
				}
				return result;
			};
			if (context.options.persister) context.fetchFn = () => {
				return context.options.persister?.(fetchFn, {
					client: context.client,
					queryKey: context.queryKey,
					meta: context.options.meta,
					signal: context.signal
				}, query);
			};
			else context.fetchFn = fetchFn;
		} };
	}
	function getNextPageParam(options$1, { pages, pageParams }) {
		const lastIndex = pages.length - 1;
		return pages.length > 0 ? options$1.getNextPageParam(pages[lastIndex], pages, pageParams[lastIndex], pageParams) : void 0;
	}
	function getPreviousPageParam(options$1, { pages, pageParams }) {
		return pages.length > 0 ? options$1.getPreviousPageParam?.(pages[0], pages, pageParams[0], pageParams) : void 0;
	}
	var Mutation = class extends Removable {
		#client;
		#observers;
		#mutationCache;
		#retryer;
		constructor(config) {
			super();
			this.#client = config.client;
			this.mutationId = config.mutationId;
			this.#mutationCache = config.mutationCache;
			this.#observers = [];
			this.state = config.state || getDefaultState();
			this.setOptions(config.options);
			this.scheduleGc();
		}
		setOptions(options$1) {
			this.options = options$1;
			this.updateGcTime(this.options.gcTime);
		}
		get meta() {
			return this.options.meta;
		}
		addObserver(observer) {
			if (!this.#observers.includes(observer)) {
				this.#observers.push(observer);
				this.clearGcTimeout();
				this.#mutationCache.notify({
					type: "observerAdded",
					mutation: this,
					observer
				});
			}
		}
		removeObserver(observer) {
			this.#observers = this.#observers.filter((x) => x !== observer);
			this.scheduleGc();
			this.#mutationCache.notify({
				type: "observerRemoved",
				mutation: this,
				observer
			});
		}
		optionalRemove() {
			if (!this.#observers.length) if (this.state.status === "pending") this.scheduleGc();
			else this.#mutationCache.remove(this);
		}
		continue() {
			return this.#retryer?.continue() ?? this.execute(this.state.variables);
		}
		async execute(variables) {
			const onContinue = () => {
				this.#dispatch({ type: "continue" });
			};
			const mutationFnContext = {
				client: this.#client,
				meta: this.options.meta,
				mutationKey: this.options.mutationKey
			};
			this.#retryer = createRetryer({
				fn: () => {
					if (!this.options.mutationFn) return Promise.reject(/* @__PURE__ */ new Error("No mutationFn found"));
					return this.options.mutationFn(variables, mutationFnContext);
				},
				onFail: (failureCount, error) => {
					this.#dispatch({
						type: "failed",
						failureCount,
						error
					});
				},
				onPause: () => {
					this.#dispatch({ type: "pause" });
				},
				onContinue,
				retry: this.options.retry ?? 0,
				retryDelay: this.options.retryDelay,
				networkMode: this.options.networkMode,
				canRun: () => this.#mutationCache.canRun(this)
			});
			const restored = this.state.status === "pending";
			const isPaused = !this.#retryer.canStart();
			try {
				if (restored) onContinue();
				else {
					this.#dispatch({
						type: "pending",
						variables,
						isPaused
					});
					await this.#mutationCache.config.onMutate?.(variables, this, mutationFnContext);
					const context = await this.options.onMutate?.(variables, mutationFnContext);
					if (context !== this.state.context) this.#dispatch({
						type: "pending",
						context,
						variables,
						isPaused
					});
				}
				const data = await this.#retryer.start();
				await this.#mutationCache.config.onSuccess?.(data, variables, this.state.context, this, mutationFnContext);
				await this.options.onSuccess?.(data, variables, this.state.context, mutationFnContext);
				await this.#mutationCache.config.onSettled?.(data, null, this.state.variables, this.state.context, this, mutationFnContext);
				await this.options.onSettled?.(data, null, variables, this.state.context, mutationFnContext);
				this.#dispatch({
					type: "success",
					data
				});
				return data;
			} catch (error) {
				try {
					await this.#mutationCache.config.onError?.(error, variables, this.state.context, this, mutationFnContext);
					await this.options.onError?.(error, variables, this.state.context, mutationFnContext);
					await this.#mutationCache.config.onSettled?.(void 0, error, this.state.variables, this.state.context, this, mutationFnContext);
					await this.options.onSettled?.(void 0, error, variables, this.state.context, mutationFnContext);
					throw error;
				} finally {
					this.#dispatch({
						type: "error",
						error
					});
				}
			} finally {
				this.#mutationCache.runNext(this);
			}
		}
		#dispatch(action) {
			const reducer = (state) => {
				switch (action.type) {
					case "failed": return {
						...state,
						failureCount: action.failureCount,
						failureReason: action.error
					};
					case "pause": return {
						...state,
						isPaused: true
					};
					case "continue": return {
						...state,
						isPaused: false
					};
					case "pending": return {
						...state,
						context: action.context,
						data: void 0,
						failureCount: 0,
						failureReason: null,
						error: null,
						isPaused: action.isPaused,
						status: "pending",
						variables: action.variables,
						submittedAt: Date.now()
					};
					case "success": return {
						...state,
						data: action.data,
						failureCount: 0,
						failureReason: null,
						error: null,
						status: "success",
						isPaused: false
					};
					case "error": return {
						...state,
						data: void 0,
						error: action.error,
						failureCount: state.failureCount + 1,
						failureReason: action.error,
						isPaused: false,
						status: "error"
					};
				}
			};
			this.state = reducer(this.state);
			notifyManager.batch(() => {
				this.#observers.forEach((observer) => {
					observer.onMutationUpdate(action);
				});
				this.#mutationCache.notify({
					mutation: this,
					type: "updated",
					action
				});
			});
		}
	};
	function getDefaultState() {
		return {
			context: void 0,
			data: void 0,
			error: null,
			failureCount: 0,
			failureReason: null,
			isPaused: false,
			status: "idle",
			variables: void 0,
			submittedAt: 0
		};
	}
	var MutationCache = class extends Subscribable {
		constructor(config = {}) {
			super();
			this.config = config;
			this.#mutations = /* @__PURE__ */ new Set();
			this.#scopes = /* @__PURE__ */ new Map();
			this.#mutationId = 0;
		}
		#mutations;
		#scopes;
		#mutationId;
		build(client, options$1, state) {
			const mutation = new Mutation({
				client,
				mutationCache: this,
				mutationId: ++this.#mutationId,
				options: client.defaultMutationOptions(options$1),
				state
			});
			this.add(mutation);
			return mutation;
		}
		add(mutation) {
			this.#mutations.add(mutation);
			const scope = scopeFor(mutation);
			if (typeof scope === "string") {
				const scopedMutations = this.#scopes.get(scope);
				if (scopedMutations) scopedMutations.push(mutation);
				else this.#scopes.set(scope, [mutation]);
			}
			this.notify({
				type: "added",
				mutation
			});
		}
		remove(mutation) {
			if (this.#mutations.delete(mutation)) {
				const scope = scopeFor(mutation);
				if (typeof scope === "string") {
					const scopedMutations = this.#scopes.get(scope);
					if (scopedMutations) {
						if (scopedMutations.length > 1) {
							const index$1 = scopedMutations.indexOf(mutation);
							if (index$1 !== -1) scopedMutations.splice(index$1, 1);
						} else if (scopedMutations[0] === mutation) this.#scopes.delete(scope);
					}
				}
			}
			this.notify({
				type: "removed",
				mutation
			});
		}
		canRun(mutation) {
			const scope = scopeFor(mutation);
			if (typeof scope === "string") {
				const firstPendingMutation = this.#scopes.get(scope)?.find((m) => m.state.status === "pending");
				return !firstPendingMutation || firstPendingMutation === mutation;
			} else return true;
		}
		runNext(mutation) {
			const scope = scopeFor(mutation);
			if (typeof scope === "string") return (this.#scopes.get(scope)?.find((m) => m !== mutation && m.state.isPaused))?.continue() ?? Promise.resolve();
			else return Promise.resolve();
		}
		clear() {
			notifyManager.batch(() => {
				this.#mutations.forEach((mutation) => {
					this.notify({
						type: "removed",
						mutation
					});
				});
				this.#mutations.clear();
				this.#scopes.clear();
			});
		}
		getAll() {
			return Array.from(this.#mutations);
		}
		find(filters) {
			const defaultedFilters = {
				exact: true,
				...filters
			};
			return this.getAll().find((mutation) => matchMutation(defaultedFilters, mutation));
		}
		findAll(filters = {}) {
			return this.getAll().filter((mutation) => matchMutation(filters, mutation));
		}
		notify(event) {
			notifyManager.batch(() => {
				this.listeners.forEach((listener) => {
					listener(event);
				});
			});
		}
		resumePausedMutations() {
			const pausedMutations = this.getAll().filter((x) => x.state.isPaused);
			return notifyManager.batch(() => Promise.all(pausedMutations.map((mutation) => mutation.continue().catch(noop$3))));
		}
	};
	function scopeFor(mutation) {
		return mutation.options.scope?.id;
	}
	var MutationObserver = class extends Subscribable {
		#client;
		#currentResult = void 0;
		#currentMutation;
		#mutateOptions;
		constructor(client, options$1) {
			super();
			this.#client = client;
			this.setOptions(options$1);
			this.bindMethods();
			this.#updateResult();
		}
		bindMethods() {
			this.mutate = this.mutate.bind(this);
			this.reset = this.reset.bind(this);
		}
		setOptions(options$1) {
			const prevOptions = this.options;
			this.options = this.#client.defaultMutationOptions(options$1);
			if (!shallowEqualObjects(this.options, prevOptions)) this.#client.getMutationCache().notify({
				type: "observerOptionsUpdated",
				mutation: this.#currentMutation,
				observer: this
			});
			if (prevOptions?.mutationKey && this.options.mutationKey && hashKey(prevOptions.mutationKey) !== hashKey(this.options.mutationKey)) this.reset();
			else if (this.#currentMutation?.state.status === "pending") this.#currentMutation.setOptions(this.options);
		}
		onUnsubscribe() {
			if (!this.hasListeners()) this.#currentMutation?.removeObserver(this);
		}
		onMutationUpdate(action) {
			this.#updateResult();
			this.#notify(action);
		}
		getCurrentResult() {
			return this.#currentResult;
		}
		reset() {
			this.#currentMutation?.removeObserver(this);
			this.#currentMutation = void 0;
			this.#updateResult();
			this.#notify();
		}
		mutate(variables, options$1) {
			this.#mutateOptions = options$1;
			this.#currentMutation?.removeObserver(this);
			this.#currentMutation = this.#client.getMutationCache().build(this.#client, this.options);
			this.#currentMutation.addObserver(this);
			return this.#currentMutation.execute(variables);
		}
		#updateResult() {
			const state = this.#currentMutation?.state ?? getDefaultState();
			this.#currentResult = {
				...state,
				isPending: state.status === "pending",
				isSuccess: state.status === "success",
				isError: state.status === "error",
				isIdle: state.status === "idle",
				mutate: this.mutate,
				reset: this.reset
			};
		}
		#notify(action) {
			notifyManager.batch(() => {
				if (this.#mutateOptions && this.hasListeners()) {
					const variables = this.#currentResult.variables;
					const onMutateResult = this.#currentResult.context;
					const context = {
						client: this.#client,
						meta: this.options.meta,
						mutationKey: this.options.mutationKey
					};
					if (action?.type === "success") {
						this.#mutateOptions.onSuccess?.(action.data, variables, onMutateResult, context);
						this.#mutateOptions.onSettled?.(action.data, null, variables, onMutateResult, context);
					} else if (action?.type === "error") {
						this.#mutateOptions.onError?.(action.error, variables, onMutateResult, context);
						this.#mutateOptions.onSettled?.(void 0, action.error, variables, onMutateResult, context);
					}
				}
				this.listeners.forEach((listener) => {
					listener(this.#currentResult);
				});
			});
		}
	};
	var QueryCache = class extends Subscribable {
		constructor(config = {}) {
			super();
			this.config = config;
			this.#queries = /* @__PURE__ */ new Map();
		}
		#queries;
		build(client, options$1, state) {
			const queryKey = options$1.queryKey;
			const queryHash = options$1.queryHash ?? hashQueryKeyByOptions(queryKey, options$1);
			let query = this.get(queryHash);
			if (!query) {
				query = new Query({
					client,
					queryKey,
					queryHash,
					options: client.defaultQueryOptions(options$1),
					state,
					defaultOptions: client.getQueryDefaults(queryKey)
				});
				this.add(query);
			}
			return query;
		}
		add(query) {
			if (!this.#queries.has(query.queryHash)) {
				this.#queries.set(query.queryHash, query);
				this.notify({
					type: "added",
					query
				});
			}
		}
		remove(query) {
			const queryInMap = this.#queries.get(query.queryHash);
			if (queryInMap) {
				query.destroy();
				if (queryInMap === query) this.#queries.delete(query.queryHash);
				this.notify({
					type: "removed",
					query
				});
			}
		}
		clear() {
			notifyManager.batch(() => {
				this.getAll().forEach((query) => {
					this.remove(query);
				});
			});
		}
		get(queryHash) {
			return this.#queries.get(queryHash);
		}
		getAll() {
			return [...this.#queries.values()];
		}
		find(filters) {
			const defaultedFilters = {
				exact: true,
				...filters
			};
			return this.getAll().find((query) => matchQuery(defaultedFilters, query));
		}
		findAll(filters = {}) {
			const queries = this.getAll();
			return Object.keys(filters).length > 0 ? queries.filter((query) => matchQuery(filters, query)) : queries;
		}
		notify(event) {
			notifyManager.batch(() => {
				this.listeners.forEach((listener) => {
					listener(event);
				});
			});
		}
		onFocus() {
			notifyManager.batch(() => {
				this.getAll().forEach((query) => {
					query.onFocus();
				});
			});
		}
		onOnline() {
			notifyManager.batch(() => {
				this.getAll().forEach((query) => {
					query.onOnline();
				});
			});
		}
	};
	var QueryClient = class {
		#queryCache;
		#mutationCache;
		#defaultOptions;
		#queryDefaults;
		#mutationDefaults;
		#mountCount;
		#unsubscribeFocus;
		#unsubscribeOnline;
		constructor(config = {}) {
			this.#queryCache = config.queryCache || new QueryCache();
			this.#mutationCache = config.mutationCache || new MutationCache();
			this.#defaultOptions = config.defaultOptions || {};
			this.#queryDefaults = /* @__PURE__ */ new Map();
			this.#mutationDefaults = /* @__PURE__ */ new Map();
			this.#mountCount = 0;
		}
		mount() {
			this.#mountCount++;
			if (this.#mountCount !== 1) return;
			this.#unsubscribeFocus = focusManager.subscribe(async (focused) => {
				if (focused) {
					await this.resumePausedMutations();
					this.#queryCache.onFocus();
				}
			});
			this.#unsubscribeOnline = onlineManager.subscribe(async (online) => {
				if (online) {
					await this.resumePausedMutations();
					this.#queryCache.onOnline();
				}
			});
		}
		unmount() {
			this.#mountCount--;
			if (this.#mountCount !== 0) return;
			this.#unsubscribeFocus?.();
			this.#unsubscribeFocus = void 0;
			this.#unsubscribeOnline?.();
			this.#unsubscribeOnline = void 0;
		}
		isFetching(filters) {
			return this.#queryCache.findAll({
				...filters,
				fetchStatus: "fetching"
			}).length;
		}
		isMutating(filters) {
			return this.#mutationCache.findAll({
				...filters,
				status: "pending"
			}).length;
		}
		getQueryData(queryKey) {
			const options$1 = this.defaultQueryOptions({ queryKey });
			return this.#queryCache.get(options$1.queryHash)?.state.data;
		}
		ensureQueryData(options$1) {
			const defaultedOptions = this.defaultQueryOptions(options$1);
			const query = this.#queryCache.build(this, defaultedOptions);
			const cachedData = query.state.data;
			if (cachedData === void 0) return this.fetchQuery(options$1);
			if (options$1.revalidateIfStale && query.isStaleByTime(resolveStaleTime(defaultedOptions.staleTime, query))) this.prefetchQuery(defaultedOptions);
			return Promise.resolve(cachedData);
		}
		getQueriesData(filters) {
			return this.#queryCache.findAll(filters).map(({ queryKey, state }) => {
				return [queryKey, state.data];
			});
		}
		setQueryData(queryKey, updater, options$1) {
			const defaultedOptions = this.defaultQueryOptions({ queryKey });
			const prevData = this.#queryCache.get(defaultedOptions.queryHash)?.state.data;
			const data = functionalUpdate(updater, prevData);
			if (data === void 0) return;
			return this.#queryCache.build(this, defaultedOptions).setData(data, {
				...options$1,
				manual: true
			});
		}
		setQueriesData(filters, updater, options$1) {
			return notifyManager.batch(() => this.#queryCache.findAll(filters).map(({ queryKey }) => [queryKey, this.setQueryData(queryKey, updater, options$1)]));
		}
		getQueryState(queryKey) {
			const options$1 = this.defaultQueryOptions({ queryKey });
			return this.#queryCache.get(options$1.queryHash)?.state;
		}
		removeQueries(filters) {
			const queryCache = this.#queryCache;
			notifyManager.batch(() => {
				queryCache.findAll(filters).forEach((query) => {
					queryCache.remove(query);
				});
			});
		}
		resetQueries(filters, options$1) {
			const queryCache = this.#queryCache;
			return notifyManager.batch(() => {
				queryCache.findAll(filters).forEach((query) => {
					query.reset();
				});
				return this.refetchQueries({
					type: "active",
					...filters
				}, options$1);
			});
		}
		cancelQueries(filters, cancelOptions = {}) {
			const defaultedCancelOptions = {
				revert: true,
				...cancelOptions
			};
			const promises = notifyManager.batch(() => this.#queryCache.findAll(filters).map((query) => query.cancel(defaultedCancelOptions)));
			return Promise.all(promises).then(noop$3).catch(noop$3);
		}
		invalidateQueries(filters, options$1 = {}) {
			return notifyManager.batch(() => {
				this.#queryCache.findAll(filters).forEach((query) => {
					query.invalidate();
				});
				if (filters?.refetchType === "none") return Promise.resolve();
				return this.refetchQueries({
					...filters,
					type: filters?.refetchType ?? filters?.type ?? "active"
				}, options$1);
			});
		}
		refetchQueries(filters, options$1 = {}) {
			const fetchOptions = {
				...options$1,
				cancelRefetch: options$1.cancelRefetch ?? true
			};
			const promises = notifyManager.batch(() => this.#queryCache.findAll(filters).filter((query) => !query.isDisabled() && !query.isStatic()).map((query) => {
				let promise = query.fetch(void 0, fetchOptions);
				if (!fetchOptions.throwOnError) promise = promise.catch(noop$3);
				return query.state.fetchStatus === "paused" ? Promise.resolve() : promise;
			}));
			return Promise.all(promises).then(noop$3);
		}
		fetchQuery(options$1) {
			const defaultedOptions = this.defaultQueryOptions(options$1);
			if (defaultedOptions.retry === void 0) defaultedOptions.retry = false;
			const query = this.#queryCache.build(this, defaultedOptions);
			return query.isStaleByTime(resolveStaleTime(defaultedOptions.staleTime, query)) ? query.fetch(defaultedOptions) : Promise.resolve(query.state.data);
		}
		prefetchQuery(options$1) {
			return this.fetchQuery(options$1).then(noop$3).catch(noop$3);
		}
		fetchInfiniteQuery(options$1) {
			options$1.behavior = infiniteQueryBehavior(options$1.pages);
			return this.fetchQuery(options$1);
		}
		prefetchInfiniteQuery(options$1) {
			return this.fetchInfiniteQuery(options$1).then(noop$3).catch(noop$3);
		}
		ensureInfiniteQueryData(options$1) {
			options$1.behavior = infiniteQueryBehavior(options$1.pages);
			return this.ensureQueryData(options$1);
		}
		resumePausedMutations() {
			if (onlineManager.isOnline()) return this.#mutationCache.resumePausedMutations();
			return Promise.resolve();
		}
		getQueryCache() {
			return this.#queryCache;
		}
		getMutationCache() {
			return this.#mutationCache;
		}
		getDefaultOptions() {
			return this.#defaultOptions;
		}
		setDefaultOptions(options$1) {
			this.#defaultOptions = options$1;
		}
		setQueryDefaults(queryKey, options$1) {
			this.#queryDefaults.set(hashKey(queryKey), {
				queryKey,
				defaultOptions: options$1
			});
		}
		getQueryDefaults(queryKey) {
			const defaults = [...this.#queryDefaults.values()];
			const result = {};
			defaults.forEach((queryDefault) => {
				if (partialMatchKey(queryKey, queryDefault.queryKey)) Object.assign(result, queryDefault.defaultOptions);
			});
			return result;
		}
		setMutationDefaults(mutationKey, options$1) {
			this.#mutationDefaults.set(hashKey(mutationKey), {
				mutationKey,
				defaultOptions: options$1
			});
		}
		getMutationDefaults(mutationKey) {
			const defaults = [...this.#mutationDefaults.values()];
			const result = {};
			defaults.forEach((queryDefault) => {
				if (partialMatchKey(mutationKey, queryDefault.mutationKey)) Object.assign(result, queryDefault.defaultOptions);
			});
			return result;
		}
		defaultQueryOptions(options$1) {
			if (options$1._defaulted) return options$1;
			const defaultedOptions = {
				...this.#defaultOptions.queries,
				...this.getQueryDefaults(options$1.queryKey),
				...options$1,
				_defaulted: true
			};
			if (!defaultedOptions.queryHash) defaultedOptions.queryHash = hashQueryKeyByOptions(defaultedOptions.queryKey, defaultedOptions);
			if (defaultedOptions.refetchOnReconnect === void 0) defaultedOptions.refetchOnReconnect = defaultedOptions.networkMode !== "always";
			if (defaultedOptions.throwOnError === void 0) defaultedOptions.throwOnError = !!defaultedOptions.suspense;
			if (!defaultedOptions.networkMode && defaultedOptions.persister) defaultedOptions.networkMode = "offlineFirst";
			if (defaultedOptions.queryFn === skipToken) defaultedOptions.enabled = false;
			return defaultedOptions;
		}
		defaultMutationOptions(options$1) {
			if (options$1?._defaulted) return options$1;
			return {
				...this.#defaultOptions.mutations,
				...options$1?.mutationKey && this.getMutationDefaults(options$1.mutationKey),
				...options$1,
				_defaulted: true
			};
		}
		clear() {
			this.#queryCache.clear();
			this.#mutationCache.clear();
		}
	};
	/**
	* @license React
	* react.production.js
	*
	* Copyright (c) Meta Platforms, Inc. and affiliates.
	*
	* This source code is licensed under the MIT license found in the
	* LICENSE file in the root directory of this source tree.
	*/
	var require_react_production = /* @__PURE__ */ __commonJSMin(((exports) => {
		var REACT_ELEMENT_TYPE$2 = Symbol.for("react.transitional.element"), REACT_PORTAL_TYPE$2 = Symbol.for("react.portal"), REACT_FRAGMENT_TYPE$2 = Symbol.for("react.fragment"), REACT_STRICT_MODE_TYPE$1 = Symbol.for("react.strict_mode"), REACT_PROFILER_TYPE$1 = Symbol.for("react.profiler"), REACT_CONSUMER_TYPE$1 = Symbol.for("react.consumer"), REACT_CONTEXT_TYPE$1 = Symbol.for("react.context"), REACT_FORWARD_REF_TYPE$1 = Symbol.for("react.forward_ref"), REACT_SUSPENSE_TYPE$1 = Symbol.for("react.suspense"), REACT_MEMO_TYPE$1 = Symbol.for("react.memo"), REACT_LAZY_TYPE$2 = Symbol.for("react.lazy"), REACT_ACTIVITY_TYPE$1 = Symbol.for("react.activity"), MAYBE_ITERATOR_SYMBOL$1 = Symbol.iterator;
		function getIteratorFn$1(maybeIterable) {
			if (null === maybeIterable || "object" !== typeof maybeIterable) return null;
			maybeIterable = MAYBE_ITERATOR_SYMBOL$1 && maybeIterable[MAYBE_ITERATOR_SYMBOL$1] || maybeIterable["@@iterator"];
			return "function" === typeof maybeIterable ? maybeIterable : null;
		}
		var ReactNoopUpdateQueue = {
			isMounted: function() {
				return !1;
			},
			enqueueForceUpdate: function() {},
			enqueueReplaceState: function() {},
			enqueueSetState: function() {}
		}, assign$1 = Object.assign, emptyObject = {};
		function Component(props, context, updater) {
			this.props = props;
			this.context = context;
			this.refs = emptyObject;
			this.updater = updater || ReactNoopUpdateQueue;
		}
		Component.prototype.isReactComponent = {};
		Component.prototype.setState = function(partialState, callback) {
			if ("object" !== typeof partialState && "function" !== typeof partialState && null != partialState) throw Error("takes an object of state variables to update or a function which returns an object of state variables.");
			this.updater.enqueueSetState(this, partialState, callback, "setState");
		};
		Component.prototype.forceUpdate = function(callback) {
			this.updater.enqueueForceUpdate(this, callback, "forceUpdate");
		};
		function ComponentDummy() {}
		ComponentDummy.prototype = Component.prototype;
		function PureComponent(props, context, updater) {
			this.props = props;
			this.context = context;
			this.refs = emptyObject;
			this.updater = updater || ReactNoopUpdateQueue;
		}
		var pureComponentPrototype = PureComponent.prototype = new ComponentDummy();
		pureComponentPrototype.constructor = PureComponent;
		assign$1(pureComponentPrototype, Component.prototype);
		pureComponentPrototype.isPureReactComponent = !0;
		var isArrayImpl$1 = Array.isArray;
		function noop$4() {}
		var ReactSharedInternals$2 = {
			H: null,
			A: null,
			T: null,
			S: null
		}, hasOwnProperty$1 = Object.prototype.hasOwnProperty;
		function ReactElement(type, key, props) {
			var refProp = props.ref;
			return {
				$$typeof: REACT_ELEMENT_TYPE$2,
				type,
				key,
				ref: void 0 !== refProp ? refProp : null,
				props
			};
		}
		function cloneAndReplaceKey(oldElement, newKey) {
			return ReactElement(oldElement.type, newKey, oldElement.props);
		}
		function isValidElement(object) {
			return "object" === typeof object && null !== object && object.$$typeof === REACT_ELEMENT_TYPE$2;
		}
		function escape(key) {
			var escaperLookup = {
				"=": "=0",
				":": "=2"
			};
			return "$" + key.replace(/[=:]/g, function(match) {
				return escaperLookup[match];
			});
		}
		var userProvidedKeyEscapeRegex = /\/+/g;
		function getElementKey(element, index$1) {
			return "object" === typeof element && null !== element && null != element.key ? escape("" + element.key) : index$1.toString(36);
		}
		function resolveThenable(thenable) {
			switch (thenable.status) {
				case "fulfilled": return thenable.value;
				case "rejected": throw thenable.reason;
				default: switch ("string" === typeof thenable.status ? thenable.then(noop$4, noop$4) : (thenable.status = "pending", thenable.then(function(fulfilledValue) {
					"pending" === thenable.status && (thenable.status = "fulfilled", thenable.value = fulfilledValue);
				}, function(error) {
					"pending" === thenable.status && (thenable.status = "rejected", thenable.reason = error);
				})), thenable.status) {
					case "fulfilled": return thenable.value;
					case "rejected": throw thenable.reason;
				}
			}
			throw thenable;
		}
		function mapIntoArray(children, array, escapedPrefix, nameSoFar, callback) {
			var type = typeof children;
			if ("undefined" === type || "boolean" === type) children = null;
			var invokeCallback = !1;
			if (null === children) invokeCallback = !0;
			else switch (type) {
				case "bigint":
				case "string":
				case "number":
					invokeCallback = !0;
					break;
				case "object": switch (children.$$typeof) {
					case REACT_ELEMENT_TYPE$2:
					case REACT_PORTAL_TYPE$2:
						invokeCallback = !0;
						break;
					case REACT_LAZY_TYPE$2: return invokeCallback = children._init, mapIntoArray(invokeCallback(children._payload), array, escapedPrefix, nameSoFar, callback);
				}
			}
			if (invokeCallback) return callback = callback(children), invokeCallback = "" === nameSoFar ? "." + getElementKey(children, 0) : nameSoFar, isArrayImpl$1(callback) ? (escapedPrefix = "", null != invokeCallback && (escapedPrefix = invokeCallback.replace(userProvidedKeyEscapeRegex, "$&/") + "/"), mapIntoArray(callback, array, escapedPrefix, "", function(c) {
				return c;
			})) : null != callback && (isValidElement(callback) && (callback = cloneAndReplaceKey(callback, escapedPrefix + (null == callback.key || children && children.key === callback.key ? "" : ("" + callback.key).replace(userProvidedKeyEscapeRegex, "$&/") + "/") + invokeCallback)), array.push(callback)), 1;
			invokeCallback = 0;
			var nextNamePrefix = "" === nameSoFar ? "." : nameSoFar + ":";
			if (isArrayImpl$1(children)) for (var i = 0; i < children.length; i++) nameSoFar = children[i], type = nextNamePrefix + getElementKey(nameSoFar, i), invokeCallback += mapIntoArray(nameSoFar, array, escapedPrefix, type, callback);
			else if (i = getIteratorFn$1(children), "function" === typeof i) for (children = i.call(children), i = 0; !(nameSoFar = children.next()).done;) nameSoFar = nameSoFar.value, type = nextNamePrefix + getElementKey(nameSoFar, i++), invokeCallback += mapIntoArray(nameSoFar, array, escapedPrefix, type, callback);
			else if ("object" === type) {
				if ("function" === typeof children.then) return mapIntoArray(resolveThenable(children), array, escapedPrefix, nameSoFar, callback);
				array = String(children);
				throw Error("Objects are not valid as a React child (found: " + ("[object Object]" === array ? "object with keys {" + Object.keys(children).join(", ") + "}" : array) + "). If you meant to render a collection of children, use an array instead.");
			}
			return invokeCallback;
		}
		function mapChildren(children, func, context) {
			if (null == children) return children;
			var result = [], count = 0;
			mapIntoArray(children, result, "", "", function(child) {
				return func.call(context, child, count++);
			});
			return result;
		}
		function lazyInitializer(payload) {
			if (-1 === payload._status) {
				var ctor = payload._result;
				ctor = ctor();
				ctor.then(function(moduleObject) {
					if (0 === payload._status || -1 === payload._status) payload._status = 1, payload._result = moduleObject;
				}, function(error) {
					if (0 === payload._status || -1 === payload._status) payload._status = 2, payload._result = error;
				});
				-1 === payload._status && (payload._status = 0, payload._result = ctor);
			}
			if (1 === payload._status) return payload._result.default;
			throw payload._result;
		}
		var reportGlobalError$1 = "function" === typeof reportError ? reportError : function(error) {
			if ("object" === typeof window && "function" === typeof window.ErrorEvent) {
				var event = new window.ErrorEvent("error", {
					bubbles: !0,
					cancelable: !0,
					message: "object" === typeof error && null !== error && "string" === typeof error.message ? String(error.message) : String(error),
					error
				});
				if (!window.dispatchEvent(event)) return;
			} else if ("object" === typeof process && "function" === typeof process.emit) {
				process.emit("uncaughtException", error);
				return;
			}
			console.error(error);
		}, Children = {
			map: mapChildren,
			forEach: function(children, forEachFunc, forEachContext) {
				mapChildren(children, function() {
					forEachFunc.apply(this, arguments);
				}, forEachContext);
			},
			count: function(children) {
				var n = 0;
				mapChildren(children, function() {
					n++;
				});
				return n;
			},
			toArray: function(children) {
				return mapChildren(children, function(child) {
					return child;
				}) || [];
			},
			only: function(children) {
				if (!isValidElement(children)) throw Error("React.Children.only expected to receive a single React element child.");
				return children;
			}
		};
		exports.Activity = REACT_ACTIVITY_TYPE$1;
		exports.Children = Children;
		exports.Component = Component;
		exports.Fragment = REACT_FRAGMENT_TYPE$2;
		exports.Profiler = REACT_PROFILER_TYPE$1;
		exports.PureComponent = PureComponent;
		exports.StrictMode = REACT_STRICT_MODE_TYPE$1;
		exports.Suspense = REACT_SUSPENSE_TYPE$1;
		exports.__CLIENT_INTERNALS_DO_NOT_USE_OR_WARN_USERS_THEY_CANNOT_UPGRADE = ReactSharedInternals$2;
		exports.__COMPILER_RUNTIME = {
			__proto__: null,
			c: function(size) {
				return ReactSharedInternals$2.H.useMemoCache(size);
			}
		};
		exports.cache = function(fn) {
			return function() {
				return fn.apply(null, arguments);
			};
		};
		exports.cacheSignal = function() {
			return null;
		};
		exports.cloneElement = function(element, config, children) {
			if (null === element || void 0 === element) throw Error("The argument must be a React element, but you passed " + element + ".");
			var props = assign$1({}, element.props), key = element.key;
			if (null != config) for (propName in void 0 !== config.key && (key = "" + config.key), config) !hasOwnProperty$1.call(config, propName) || "key" === propName || "__self" === propName || "__source" === propName || "ref" === propName && void 0 === config.ref || (props[propName] = config[propName]);
			var propName = arguments.length - 2;
			if (1 === propName) props.children = children;
			else if (1 < propName) {
				for (var childArray = Array(propName), i = 0; i < propName; i++) childArray[i] = arguments[i + 2];
				props.children = childArray;
			}
			return ReactElement(element.type, key, props);
		};
		exports.createContext = function(defaultValue) {
			defaultValue = {
				$$typeof: REACT_CONTEXT_TYPE$1,
				_currentValue: defaultValue,
				_currentValue2: defaultValue,
				_threadCount: 0,
				Provider: null,
				Consumer: null
			};
			defaultValue.Provider = defaultValue;
			defaultValue.Consumer = {
				$$typeof: REACT_CONSUMER_TYPE$1,
				_context: defaultValue
			};
			return defaultValue;
		};
		exports.createElement = function(type, config, children) {
			var propName, props = {}, key = null;
			if (null != config) for (propName in void 0 !== config.key && (key = "" + config.key), config) hasOwnProperty$1.call(config, propName) && "key" !== propName && "__self" !== propName && "__source" !== propName && (props[propName] = config[propName]);
			var childrenLength = arguments.length - 2;
			if (1 === childrenLength) props.children = children;
			else if (1 < childrenLength) {
				for (var childArray = Array(childrenLength), i = 0; i < childrenLength; i++) childArray[i] = arguments[i + 2];
				props.children = childArray;
			}
			if (type && type.defaultProps) for (propName in childrenLength = type.defaultProps, childrenLength) void 0 === props[propName] && (props[propName] = childrenLength[propName]);
			return ReactElement(type, key, props);
		};
		exports.createRef = function() {
			return { current: null };
		};
		exports.forwardRef = function(render) {
			return {
				$$typeof: REACT_FORWARD_REF_TYPE$1,
				render
			};
		};
		exports.isValidElement = isValidElement;
		exports.lazy = function(ctor) {
			return {
				$$typeof: REACT_LAZY_TYPE$2,
				_payload: {
					_status: -1,
					_result: ctor
				},
				_init: lazyInitializer
			};
		};
		exports.memo = function(type, compare$1) {
			return {
				$$typeof: REACT_MEMO_TYPE$1,
				type,
				compare: void 0 === compare$1 ? null : compare$1
			};
		};
		exports.startTransition = function(scope) {
			var prevTransition = ReactSharedInternals$2.T, currentTransition = {};
			ReactSharedInternals$2.T = currentTransition;
			try {
				var returnValue = scope(), onStartTransitionFinish = ReactSharedInternals$2.S;
				null !== onStartTransitionFinish && onStartTransitionFinish(currentTransition, returnValue);
				"object" === typeof returnValue && null !== returnValue && "function" === typeof returnValue.then && returnValue.then(noop$4, reportGlobalError$1);
			} catch (error) {
				reportGlobalError$1(error);
			} finally {
				null !== prevTransition && null !== currentTransition.types && (prevTransition.types = currentTransition.types), ReactSharedInternals$2.T = prevTransition;
			}
		};
		exports.unstable_useCacheRefresh = function() {
			return ReactSharedInternals$2.H.useCacheRefresh();
		};
		exports.use = function(usable) {
			return ReactSharedInternals$2.H.use(usable);
		};
		exports.useActionState = function(action, initialState, permalink) {
			return ReactSharedInternals$2.H.useActionState(action, initialState, permalink);
		};
		exports.useCallback = function(callback, deps) {
			return ReactSharedInternals$2.H.useCallback(callback, deps);
		};
		exports.useContext = function(Context) {
			return ReactSharedInternals$2.H.useContext(Context);
		};
		exports.useDebugValue = function() {};
		exports.useDeferredValue = function(value, initialValue) {
			return ReactSharedInternals$2.H.useDeferredValue(value, initialValue);
		};
		exports.useEffect = function(create, deps) {
			return ReactSharedInternals$2.H.useEffect(create, deps);
		};
		exports.useEffectEvent = function(callback) {
			return ReactSharedInternals$2.H.useEffectEvent(callback);
		};
		exports.useId = function() {
			return ReactSharedInternals$2.H.useId();
		};
		exports.useImperativeHandle = function(ref, create, deps) {
			return ReactSharedInternals$2.H.useImperativeHandle(ref, create, deps);
		};
		exports.useInsertionEffect = function(create, deps) {
			return ReactSharedInternals$2.H.useInsertionEffect(create, deps);
		};
		exports.useLayoutEffect = function(create, deps) {
			return ReactSharedInternals$2.H.useLayoutEffect(create, deps);
		};
		exports.useMemo = function(create, deps) {
			return ReactSharedInternals$2.H.useMemo(create, deps);
		};
		exports.useOptimistic = function(passthrough, reducer) {
			return ReactSharedInternals$2.H.useOptimistic(passthrough, reducer);
		};
		exports.useReducer = function(reducer, initialArg, init) {
			return ReactSharedInternals$2.H.useReducer(reducer, initialArg, init);
		};
		exports.useRef = function(initialValue) {
			return ReactSharedInternals$2.H.useRef(initialValue);
		};
		exports.useState = function(initialState) {
			return ReactSharedInternals$2.H.useState(initialState);
		};
		exports.useSyncExternalStore = function(subscribe, getSnapshot, getServerSnapshot) {
			return ReactSharedInternals$2.H.useSyncExternalStore(subscribe, getSnapshot, getServerSnapshot);
		};
		exports.useTransition = function() {
			return ReactSharedInternals$2.H.useTransition();
		};
		exports.version = "19.2.0";
	}));
	var require_react = /* @__PURE__ */ __commonJSMin(((exports, module) => {
		module.exports = require_react_production();
	}));
	/**
	* @license React
	* react-jsx-runtime.production.js
	*
	* Copyright (c) Meta Platforms, Inc. and affiliates.
	*
	* This source code is licensed under the MIT license found in the
	* LICENSE file in the root directory of this source tree.
	*/
	var require_react_jsx_runtime_production = /* @__PURE__ */ __commonJSMin(((exports) => {
		var REACT_ELEMENT_TYPE$1 = Symbol.for("react.transitional.element");
		function jsxProd(type, config, maybeKey) {
			var key = null;
			void 0 !== maybeKey && (key = "" + maybeKey);
			void 0 !== config.key && (key = "" + config.key);
			if ("key" in config) {
				maybeKey = {};
				for (var propName in config) "key" !== propName && (maybeKey[propName] = config[propName]);
			} else maybeKey = config;
			config = maybeKey.ref;
			return {
				$$typeof: REACT_ELEMENT_TYPE$1,
				type,
				key,
				ref: void 0 !== config ? config : null,
				props: maybeKey
			};
		}
		exports.jsx = jsxProd;
		exports.jsxs = jsxProd;
	}));
	var require_jsx_runtime = /* @__PURE__ */ __commonJSMin(((exports, module) => {
		module.exports = require_react_jsx_runtime_production();
	}));
	var import_react = /* @__PURE__ */ __toESM(require_react(), 1);
	var import_jsx_runtime = /* @__PURE__ */ __toESM(require_jsx_runtime(), 1);
	var QueryClientContext = import_react.createContext(void 0);
	var useQueryClient = (queryClient$1) => {
		const client = import_react.useContext(QueryClientContext);
		if (queryClient$1) return queryClient$1;
		if (!client) throw new Error("No QueryClient set, use QueryClientProvider to set one");
		return client;
	};
	var QueryClientProvider = ({ client, children }) => {
		import_react.useEffect(() => {
			client.mount();
			return () => {
				client.unmount();
			};
		}, [client]);
		return /* @__PURE__ */ (0, import_jsx_runtime.jsx)(QueryClientContext.Provider, {
			value: client,
			children
		});
	};
	var IsRestoringContext = import_react.createContext(false);
	var useIsRestoring = () => import_react.useContext(IsRestoringContext);
	IsRestoringContext.Provider;
	function createValue() {
		let isReset = false;
		return {
			clearReset: () => {
				isReset = false;
			},
			reset: () => {
				isReset = true;
			},
			isReset: () => {
				return isReset;
			}
		};
	}
	var QueryErrorResetBoundaryContext = import_react.createContext(createValue());
	var useQueryErrorResetBoundary = () => import_react.useContext(QueryErrorResetBoundaryContext);
	var ensurePreventErrorBoundaryRetry = (options$1, errorResetBoundary) => {
		if (options$1.suspense || options$1.throwOnError || options$1.experimental_prefetchInRender) {
			if (!errorResetBoundary.isReset()) options$1.retryOnMount = false;
		}
	};
	var useClearResetErrorBoundary = (errorResetBoundary) => {
		import_react.useEffect(() => {
			errorResetBoundary.clearReset();
		}, [errorResetBoundary]);
	};
	var getHasError = ({ result, errorResetBoundary, throwOnError, query, suspense }) => {
		return result.isError && !errorResetBoundary.isReset() && !result.isFetching && query && (suspense && result.data === void 0 || shouldThrowError(throwOnError, [result.error, query]));
	};
	var ensureSuspenseTimers = (defaultedOptions) => {
		if (defaultedOptions.suspense) {
			const MIN_SUSPENSE_TIME_MS = 1e3;
			const clamp = (value) => value === "static" ? value : Math.max(value ?? MIN_SUSPENSE_TIME_MS, MIN_SUSPENSE_TIME_MS);
			const originalStaleTime = defaultedOptions.staleTime;
			defaultedOptions.staleTime = typeof originalStaleTime === "function" ? (...args) => clamp(originalStaleTime(...args)) : clamp(originalStaleTime);
			if (typeof defaultedOptions.gcTime === "number") defaultedOptions.gcTime = Math.max(defaultedOptions.gcTime, MIN_SUSPENSE_TIME_MS);
		}
	};
	var willFetch = (result, isRestoring) => result.isLoading && result.isFetching && !isRestoring;
	var shouldSuspend = (defaultedOptions, result) => defaultedOptions?.suspense && result.isPending;
	var fetchOptimistic = (defaultedOptions, observer, errorResetBoundary) => observer.fetchOptimistic(defaultedOptions).catch(() => {
		errorResetBoundary.clearReset();
	});
	function useBaseQuery(options$1, Observer$1, queryClient$1) {
		const isRestoring = useIsRestoring();
		const errorResetBoundary = useQueryErrorResetBoundary();
		const client = useQueryClient(queryClient$1);
		const defaultedOptions = client.defaultQueryOptions(options$1);
		client.getDefaultOptions().queries?._experimental_beforeQuery?.(defaultedOptions);
		defaultedOptions._optimisticResults = isRestoring ? "isRestoring" : "optimistic";
		ensureSuspenseTimers(defaultedOptions);
		ensurePreventErrorBoundaryRetry(defaultedOptions, errorResetBoundary);
		useClearResetErrorBoundary(errorResetBoundary);
		const isNewCacheEntry = !client.getQueryCache().get(defaultedOptions.queryHash);
		const [observer] = import_react.useState(() => new Observer$1(client, defaultedOptions));
		const result = observer.getOptimisticResult(defaultedOptions);
		const shouldSubscribe = !isRestoring && options$1.subscribed !== false;
		import_react.useSyncExternalStore(import_react.useCallback((onStoreChange) => {
			const unsubscribe = shouldSubscribe ? observer.subscribe(notifyManager.batchCalls(onStoreChange)) : noop$3;
			observer.updateResult();
			return unsubscribe;
		}, [observer, shouldSubscribe]), () => observer.getCurrentResult(), () => observer.getCurrentResult());
		import_react.useEffect(() => {
			observer.setOptions(defaultedOptions);
		}, [defaultedOptions, observer]);
		if (shouldSuspend(defaultedOptions, result)) throw fetchOptimistic(defaultedOptions, observer, errorResetBoundary);
		if (getHasError({
			result,
			errorResetBoundary,
			throwOnError: defaultedOptions.throwOnError,
			query: client.getQueryCache().get(defaultedOptions.queryHash),
			suspense: defaultedOptions.suspense
		})) throw result.error;
		client.getDefaultOptions().queries?._experimental_afterQuery?.(defaultedOptions, result);
		if (defaultedOptions.experimental_prefetchInRender && !isServer && willFetch(result, isRestoring)) (isNewCacheEntry ? fetchOptimistic(defaultedOptions, observer, errorResetBoundary) : client.getQueryCache().get(defaultedOptions.queryHash)?.promise)?.catch(noop$3).finally(() => {
			observer.updateResult();
		});
		return !defaultedOptions.notifyOnChangeProps ? observer.trackResult(result) : result;
	}
	function useQuery(options$1, queryClient$1) {
		return useBaseQuery(options$1, QueryObserver, queryClient$1);
	}
	function useMutation(options$1, queryClient$1) {
		const client = useQueryClient(queryClient$1);
		const [observer] = import_react.useState(() => new MutationObserver(client, options$1));
		import_react.useEffect(() => {
			observer.setOptions(options$1);
		}, [observer, options$1]);
		const result = import_react.useSyncExternalStore(import_react.useCallback((onStoreChange) => observer.subscribe(notifyManager.batchCalls(onStoreChange)), [observer]), () => observer.getCurrentResult(), () => observer.getCurrentResult());
		const mutate = import_react.useCallback((variables, mutateOptions) => {
			observer.mutate(variables, mutateOptions).catch(noop$3);
		}, [observer]);
		if (result.error && shouldThrowError(observer.options.throwOnError, [result.error])) throw result.error;
		return {
			...result,
			mutate,
			mutateAsync: result.mutate
		};
	}
	/**
	* @license lucide-react v0.555.0 - ISC
	*
	* This source code is licensed under the ISC license.
	* See the LICENSE file in the root directory of this source tree.
	*/
	var toKebabCase = (string) => string.replace(/([a-z0-9])([A-Z])/g, "$1-$2").toLowerCase();
	var toCamelCase = (string) => string.replace(/^([A-Z])|[\s-_]+(\w)/g, (match, p1, p2) => p2 ? p2.toUpperCase() : p1.toLowerCase());
	var toPascalCase = (string) => {
		const camelCase = toCamelCase(string);
		return camelCase.charAt(0).toUpperCase() + camelCase.slice(1);
	};
	var mergeClasses = (...classes) => classes.filter((className, index$1, array) => {
		return Boolean(className) && className.trim() !== "" && array.indexOf(className) === index$1;
	}).join(" ").trim();
	var hasA11yProp = (props) => {
		for (const prop in props) if (prop.startsWith("aria-") || prop === "role" || prop === "title") return true;
	};
	/**
	* @license lucide-react v0.555.0 - ISC
	*
	* This source code is licensed under the ISC license.
	* See the LICENSE file in the root directory of this source tree.
	*/
	var defaultAttributes = {
		xmlns: "http://www.w3.org/2000/svg",
		width: 24,
		height: 24,
		viewBox: "0 0 24 24",
		fill: "none",
		stroke: "currentColor",
		strokeWidth: 2,
		strokeLinecap: "round",
		strokeLinejoin: "round"
	};
	/**
	* @license lucide-react v0.555.0 - ISC
	*
	* This source code is licensed under the ISC license.
	* See the LICENSE file in the root directory of this source tree.
	*/
	var Icon = (0, import_react.forwardRef)(({ color = "currentColor", size = 24, strokeWidth = 2, absoluteStrokeWidth, className = "", children, iconNode, ...rest }, ref) => (0, import_react.createElement)("svg", {
		ref,
		...defaultAttributes,
		width: size,
		height: size,
		stroke: color,
		strokeWidth: absoluteStrokeWidth ? Number(strokeWidth) * 24 / Number(size) : strokeWidth,
		className: mergeClasses("lucide", className),
		...!children && !hasA11yProp(rest) && { "aria-hidden": "true" },
		...rest
	}, [...iconNode.map(([tag, attrs]) => (0, import_react.createElement)(tag, attrs)), ...Array.isArray(children) ? children : [children]]));
	/**
	* @license lucide-react v0.555.0 - ISC
	*
	* This source code is licensed under the ISC license.
	* See the LICENSE file in the root directory of this source tree.
	*/
	var createLucideIcon = (iconName, iconNode) => {
		const Component$1 = (0, import_react.forwardRef)(({ className, ...props }, ref) => (0, import_react.createElement)(Icon, {
			ref,
			iconNode,
			className: mergeClasses(`lucide-${toKebabCase(toPascalCase(iconName))}`, `lucide-${iconName}`, className),
			...props
		}));
		Component$1.displayName = toPascalCase(iconName);
		return Component$1;
	};
	var Clock8 = createLucideIcon("clock-8", [["path", {
		d: "M12 6v6l-4 2",
		key: "imc3wl"
	}], ["circle", {
		cx: "12",
		cy: "12",
		r: "10",
		key: "1mglay"
	}]]);
	var Gift = createLucideIcon("gift", [
		["rect", {
			x: "3",
			y: "8",
			width: "18",
			height: "4",
			rx: "1",
			key: "bkv52"
		}],
		["path", {
			d: "M12 8v13",
			key: "1c76mn"
		}],
		["path", {
			d: "M19 12v7a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2v-7",
			key: "6wjy6b"
		}],
		["path", {
			d: "M7.5 8a2.5 2.5 0 0 1 0-5A4.8 8 0 0 1 12 8a4.8 8 0 0 1 4.5-5 2.5 2.5 0 0 1 0 5",
			key: "1ihvrl"
		}]
	]);
	var Map$1 = createLucideIcon("map", [
		["path", {
			d: "M14.106 5.553a2 2 0 0 0 1.788 0l3.659-1.83A1 1 0 0 1 21 4.619v12.764a1 1 0 0 1-.553.894l-4.553 2.277a2 2 0 0 1-1.788 0l-4.212-2.106a2 2 0 0 0-1.788 0l-3.659 1.83A1 1 0 0 1 3 19.381V6.618a1 1 0 0 1 .553-.894l4.553-2.277a2 2 0 0 1 1.788 0z",
			key: "169xi5"
		}],
		["path", {
			d: "M15 5.764v15",
			key: "1pn4in"
		}],
		["path", {
			d: "M9 3.236v15",
			key: "1uimfh"
		}]
	]);
	var MessageCircleHeart = createLucideIcon("message-circle-heart", [["path", {
		d: "M2.992 16.342a2 2 0 0 1 .094 1.167l-1.065 3.29a1 1 0 0 0 1.236 1.168l3.413-.998a2 2 0 0 1 1.099.092 10 10 0 1 0-4.777-4.719",
		key: "1sd12s"
	}], ["path", {
		d: "M7.828 13.07A3 3 0 0 1 12 8.764a3 3 0 0 1 5.004 2.224 3 3 0 0 1-.832 2.083l-3.447 3.62a1 1 0 0 1-1.45-.001z",
		key: "hoo97p"
	}]]);
	var X = createLucideIcon("x", [["path", {
		d: "M18 6 6 18",
		key: "1bl5f8"
	}], ["path", {
		d: "m6 6 12 12",
		key: "d8bk6v"
	}]]);
	/**
	* @license React
	* scheduler.production.js
	*
	* Copyright (c) Meta Platforms, Inc. and affiliates.
	*
	* This source code is licensed under the MIT license found in the
	* LICENSE file in the root directory of this source tree.
	*/
	var require_scheduler_production = /* @__PURE__ */ __commonJSMin(((exports) => {
		function push$1(heap, node) {
			var index$1 = heap.length;
			heap.push(node);
			a: for (; 0 < index$1;) {
				var parentIndex = index$1 - 1 >>> 1, parent = heap[parentIndex];
				if (0 < compare(parent, node)) heap[parentIndex] = node, heap[index$1] = parent, index$1 = parentIndex;
				else break a;
			}
		}
		function peek(heap) {
			return 0 === heap.length ? null : heap[0];
		}
		function pop$1(heap) {
			if (0 === heap.length) return null;
			var first = heap[0], last = heap.pop();
			if (last !== first) {
				heap[0] = last;
				a: for (var index$1 = 0, length = heap.length, halfLength = length >>> 1; index$1 < halfLength;) {
					var leftIndex = 2 * (index$1 + 1) - 1, left = heap[leftIndex], rightIndex = leftIndex + 1, right = heap[rightIndex];
					if (0 > compare(left, last)) rightIndex < length && 0 > compare(right, left) ? (heap[index$1] = right, heap[rightIndex] = last, index$1 = rightIndex) : (heap[index$1] = left, heap[leftIndex] = last, index$1 = leftIndex);
					else if (rightIndex < length && 0 > compare(right, last)) heap[index$1] = right, heap[rightIndex] = last, index$1 = rightIndex;
					else break a;
				}
			}
			return first;
		}
		function compare(a$1, b) {
			var diff = a$1.sortIndex - b.sortIndex;
			return 0 !== diff ? diff : a$1.id - b.id;
		}
		exports.unstable_now = void 0;
		if ("object" === typeof performance && "function" === typeof performance.now) {
			var localPerformance = performance;
			exports.unstable_now = function() {
				return localPerformance.now();
			};
		} else {
			var localDate = Date, initialTime = localDate.now();
			exports.unstable_now = function() {
				return localDate.now() - initialTime;
			};
		}
		var taskQueue = [], timerQueue = [], taskIdCounter = 1, currentTask = null, currentPriorityLevel = 3, isPerformingWork = !1, isHostCallbackScheduled = !1, isHostTimeoutScheduled = !1, needsPaint = !1, localSetTimeout = "function" === typeof setTimeout ? setTimeout : null, localClearTimeout = "function" === typeof clearTimeout ? clearTimeout : null, localSetImmediate = "undefined" !== typeof setImmediate ? setImmediate : null;
		function advanceTimers(currentTime) {
			for (var timer = peek(timerQueue); null !== timer;) {
				if (null === timer.callback) pop$1(timerQueue);
				else if (timer.startTime <= currentTime) pop$1(timerQueue), timer.sortIndex = timer.expirationTime, push$1(taskQueue, timer);
				else break;
				timer = peek(timerQueue);
			}
		}
		function handleTimeout(currentTime) {
			isHostTimeoutScheduled = !1;
			advanceTimers(currentTime);
			if (!isHostCallbackScheduled) if (null !== peek(taskQueue)) isHostCallbackScheduled = !0, isMessageLoopRunning || (isMessageLoopRunning = !0, schedulePerformWorkUntilDeadline());
			else {
				var firstTimer = peek(timerQueue);
				null !== firstTimer && requestHostTimeout(handleTimeout, firstTimer.startTime - currentTime);
			}
		}
		var isMessageLoopRunning = !1, taskTimeoutID = -1, frameInterval = 5, startTime = -1;
		function shouldYieldToHost() {
			return needsPaint ? !0 : exports.unstable_now() - startTime < frameInterval ? !1 : !0;
		}
		function performWorkUntilDeadline() {
			needsPaint = !1;
			if (isMessageLoopRunning) {
				var currentTime = exports.unstable_now();
				startTime = currentTime;
				var hasMoreWork = !0;
				try {
					a: {
						isHostCallbackScheduled = !1;
						isHostTimeoutScheduled && (isHostTimeoutScheduled = !1, localClearTimeout(taskTimeoutID), taskTimeoutID = -1);
						isPerformingWork = !0;
						var previousPriorityLevel = currentPriorityLevel;
						try {
							b: {
								advanceTimers(currentTime);
								for (currentTask = peek(taskQueue); null !== currentTask && !(currentTask.expirationTime > currentTime && shouldYieldToHost());) {
									var callback = currentTask.callback;
									if ("function" === typeof callback) {
										currentTask.callback = null;
										currentPriorityLevel = currentTask.priorityLevel;
										var continuationCallback = callback(currentTask.expirationTime <= currentTime);
										currentTime = exports.unstable_now();
										if ("function" === typeof continuationCallback) {
											currentTask.callback = continuationCallback;
											advanceTimers(currentTime);
											hasMoreWork = !0;
											break b;
										}
										currentTask === peek(taskQueue) && pop$1(taskQueue);
										advanceTimers(currentTime);
									} else pop$1(taskQueue);
									currentTask = peek(taskQueue);
								}
								if (null !== currentTask) hasMoreWork = !0;
								else {
									var firstTimer = peek(timerQueue);
									null !== firstTimer && requestHostTimeout(handleTimeout, firstTimer.startTime - currentTime);
									hasMoreWork = !1;
								}
							}
							break a;
						} finally {
							currentTask = null, currentPriorityLevel = previousPriorityLevel, isPerformingWork = !1;
						}
						hasMoreWork = void 0;
					}
				} finally {
					hasMoreWork ? schedulePerformWorkUntilDeadline() : isMessageLoopRunning = !1;
				}
			}
		}
		var schedulePerformWorkUntilDeadline;
		if ("function" === typeof localSetImmediate) schedulePerformWorkUntilDeadline = function() {
			localSetImmediate(performWorkUntilDeadline);
		};
		else if ("undefined" !== typeof MessageChannel) {
			var channel = new MessageChannel(), port = channel.port2;
			channel.port1.onmessage = performWorkUntilDeadline;
			schedulePerformWorkUntilDeadline = function() {
				port.postMessage(null);
			};
		} else schedulePerformWorkUntilDeadline = function() {
			localSetTimeout(performWorkUntilDeadline, 0);
		};
		function requestHostTimeout(callback, ms) {
			taskTimeoutID = localSetTimeout(function() {
				callback(exports.unstable_now());
			}, ms);
		}
		exports.unstable_IdlePriority = 5;
		exports.unstable_ImmediatePriority = 1;
		exports.unstable_LowPriority = 4;
		exports.unstable_NormalPriority = 3;
		exports.unstable_Profiling = null;
		exports.unstable_UserBlockingPriority = 2;
		exports.unstable_cancelCallback = function(task) {
			task.callback = null;
		};
		exports.unstable_forceFrameRate = function(fps) {
			0 > fps || 125 < fps ? console.error("forceFrameRate takes a positive int between 0 and 125, forcing frame rates higher than 125 fps is not supported") : frameInterval = 0 < fps ? Math.floor(1e3 / fps) : 5;
		};
		exports.unstable_getCurrentPriorityLevel = function() {
			return currentPriorityLevel;
		};
		exports.unstable_next = function(eventHandler) {
			switch (currentPriorityLevel) {
				case 1:
				case 2:
				case 3:
					var priorityLevel = 3;
					break;
				default: priorityLevel = currentPriorityLevel;
			}
			var previousPriorityLevel = currentPriorityLevel;
			currentPriorityLevel = priorityLevel;
			try {
				return eventHandler();
			} finally {
				currentPriorityLevel = previousPriorityLevel;
			}
		};
		exports.unstable_requestPaint = function() {
			needsPaint = !0;
		};
		exports.unstable_runWithPriority = function(priorityLevel, eventHandler) {
			switch (priorityLevel) {
				case 1:
				case 2:
				case 3:
				case 4:
				case 5: break;
				default: priorityLevel = 3;
			}
			var previousPriorityLevel = currentPriorityLevel;
			currentPriorityLevel = priorityLevel;
			try {
				return eventHandler();
			} finally {
				currentPriorityLevel = previousPriorityLevel;
			}
		};
		exports.unstable_scheduleCallback = function(priorityLevel, callback, options$1) {
			var currentTime = exports.unstable_now();
			"object" === typeof options$1 && null !== options$1 ? (options$1 = options$1.delay, options$1 = "number" === typeof options$1 && 0 < options$1 ? currentTime + options$1 : currentTime) : options$1 = currentTime;
			switch (priorityLevel) {
				case 1:
					var timeout = -1;
					break;
				case 2:
					timeout = 250;
					break;
				case 5:
					timeout = 1073741823;
					break;
				case 4:
					timeout = 1e4;
					break;
				default: timeout = 5e3;
			}
			timeout = options$1 + timeout;
			priorityLevel = {
				id: taskIdCounter++,
				callback,
				priorityLevel,
				startTime: options$1,
				expirationTime: timeout,
				sortIndex: -1
			};
			options$1 > currentTime ? (priorityLevel.sortIndex = options$1, push$1(timerQueue, priorityLevel), null === peek(taskQueue) && priorityLevel === peek(timerQueue) && (isHostTimeoutScheduled ? (localClearTimeout(taskTimeoutID), taskTimeoutID = -1) : isHostTimeoutScheduled = !0, requestHostTimeout(handleTimeout, options$1 - currentTime))) : (priorityLevel.sortIndex = timeout, push$1(taskQueue, priorityLevel), isHostCallbackScheduled || isPerformingWork || (isHostCallbackScheduled = !0, isMessageLoopRunning || (isMessageLoopRunning = !0, schedulePerformWorkUntilDeadline())));
			return priorityLevel;
		};
		exports.unstable_shouldYield = shouldYieldToHost;
		exports.unstable_wrapCallback = function(callback) {
			var parentPriorityLevel = currentPriorityLevel;
			return function() {
				var previousPriorityLevel = currentPriorityLevel;
				currentPriorityLevel = parentPriorityLevel;
				try {
					return callback.apply(this, arguments);
				} finally {
					currentPriorityLevel = previousPriorityLevel;
				}
			};
		};
	}));
	var require_scheduler = /* @__PURE__ */ __commonJSMin(((exports, module) => {
		module.exports = require_scheduler_production();
	}));
	/**
	* @license React
	* react-dom.production.js
	*
	* Copyright (c) Meta Platforms, Inc. and affiliates.
	*
	* This source code is licensed under the MIT license found in the
	* LICENSE file in the root directory of this source tree.
	*/
	var require_react_dom_production = /* @__PURE__ */ __commonJSMin(((exports) => {
		var React$2 = require_react();
		function formatProdErrorMessage$1(code) {
			var url = "https://react.dev/errors/" + code;
			if (1 < arguments.length) {
				url += "?args[]=" + encodeURIComponent(arguments[1]);
				for (var i = 2; i < arguments.length; i++) url += "&args[]=" + encodeURIComponent(arguments[i]);
			}
			return "Minified React error #" + code + "; visit " + url + " for the full message or use the non-minified dev environment for full errors and additional helpful warnings.";
		}
		function noop$2() {}
		var Internals = {
			d: {
				f: noop$2,
				r: function() {
					throw Error(formatProdErrorMessage$1(522));
				},
				D: noop$2,
				C: noop$2,
				L: noop$2,
				m: noop$2,
				X: noop$2,
				S: noop$2,
				M: noop$2
			},
			p: 0,
			findDOMNode: null
		}, REACT_PORTAL_TYPE$1 = Symbol.for("react.portal");
		function createPortal$1(children, containerInfo, implementation) {
			var key = 3 < arguments.length && void 0 !== arguments[3] ? arguments[3] : null;
			return {
				$$typeof: REACT_PORTAL_TYPE$1,
				key: null == key ? null : "" + key,
				children,
				containerInfo,
				implementation
			};
		}
		var ReactSharedInternals$1 = React$2.__CLIENT_INTERNALS_DO_NOT_USE_OR_WARN_USERS_THEY_CANNOT_UPGRADE;
		function getCrossOriginStringAs(as, input) {
			if ("font" === as) return "";
			if ("string" === typeof input) return "use-credentials" === input ? input : "";
		}
		exports.__DOM_INTERNALS_DO_NOT_USE_OR_WARN_USERS_THEY_CANNOT_UPGRADE = Internals;
		exports.createPortal = function(children, container) {
			var key = 2 < arguments.length && void 0 !== arguments[2] ? arguments[2] : null;
			if (!container || 1 !== container.nodeType && 9 !== container.nodeType && 11 !== container.nodeType) throw Error(formatProdErrorMessage$1(299));
			return createPortal$1(children, container, null, key);
		};
		exports.flushSync = function(fn) {
			var previousTransition = ReactSharedInternals$1.T, previousUpdatePriority = Internals.p;
			try {
				if (ReactSharedInternals$1.T = null, Internals.p = 2, fn) return fn();
			} finally {
				ReactSharedInternals$1.T = previousTransition, Internals.p = previousUpdatePriority, Internals.d.f();
			}
		};
		exports.preconnect = function(href, options$1) {
			"string" === typeof href && (options$1 ? (options$1 = options$1.crossOrigin, options$1 = "string" === typeof options$1 ? "use-credentials" === options$1 ? options$1 : "" : void 0) : options$1 = null, Internals.d.C(href, options$1));
		};
		exports.prefetchDNS = function(href) {
			"string" === typeof href && Internals.d.D(href);
		};
		exports.preinit = function(href, options$1) {
			if ("string" === typeof href && options$1 && "string" === typeof options$1.as) {
				var as = options$1.as, crossOrigin = getCrossOriginStringAs(as, options$1.crossOrigin), integrity = "string" === typeof options$1.integrity ? options$1.integrity : void 0, fetchPriority = "string" === typeof options$1.fetchPriority ? options$1.fetchPriority : void 0;
				"style" === as ? Internals.d.S(href, "string" === typeof options$1.precedence ? options$1.precedence : void 0, {
					crossOrigin,
					integrity,
					fetchPriority
				}) : "script" === as && Internals.d.X(href, {
					crossOrigin,
					integrity,
					fetchPriority,
					nonce: "string" === typeof options$1.nonce ? options$1.nonce : void 0
				});
			}
		};
		exports.preinitModule = function(href, options$1) {
			if ("string" === typeof href) if ("object" === typeof options$1 && null !== options$1) {
				if (null == options$1.as || "script" === options$1.as) {
					var crossOrigin = getCrossOriginStringAs(options$1.as, options$1.crossOrigin);
					Internals.d.M(href, {
						crossOrigin,
						integrity: "string" === typeof options$1.integrity ? options$1.integrity : void 0,
						nonce: "string" === typeof options$1.nonce ? options$1.nonce : void 0
					});
				}
			} else options$1 ?? Internals.d.M(href);
		};
		exports.preload = function(href, options$1) {
			if ("string" === typeof href && "object" === typeof options$1 && null !== options$1 && "string" === typeof options$1.as) {
				var as = options$1.as, crossOrigin = getCrossOriginStringAs(as, options$1.crossOrigin);
				Internals.d.L(href, as, {
					crossOrigin,
					integrity: "string" === typeof options$1.integrity ? options$1.integrity : void 0,
					nonce: "string" === typeof options$1.nonce ? options$1.nonce : void 0,
					type: "string" === typeof options$1.type ? options$1.type : void 0,
					fetchPriority: "string" === typeof options$1.fetchPriority ? options$1.fetchPriority : void 0,
					referrerPolicy: "string" === typeof options$1.referrerPolicy ? options$1.referrerPolicy : void 0,
					imageSrcSet: "string" === typeof options$1.imageSrcSet ? options$1.imageSrcSet : void 0,
					imageSizes: "string" === typeof options$1.imageSizes ? options$1.imageSizes : void 0,
					media: "string" === typeof options$1.media ? options$1.media : void 0
				});
			}
		};
		exports.preloadModule = function(href, options$1) {
			if ("string" === typeof href) if (options$1) {
				var crossOrigin = getCrossOriginStringAs(options$1.as, options$1.crossOrigin);
				Internals.d.m(href, {
					as: "string" === typeof options$1.as && "script" !== options$1.as ? options$1.as : void 0,
					crossOrigin,
					integrity: "string" === typeof options$1.integrity ? options$1.integrity : void 0
				});
			} else Internals.d.m(href);
		};
		exports.requestFormReset = function(form) {
			Internals.d.r(form);
		};
		exports.unstable_batchedUpdates = function(fn, a$1) {
			return fn(a$1);
		};
		exports.useFormState = function(action, initialState, permalink) {
			return ReactSharedInternals$1.H.useFormState(action, initialState, permalink);
		};
		exports.useFormStatus = function() {
			return ReactSharedInternals$1.H.useHostTransitionStatus();
		};
		exports.version = "19.2.0";
	}));
	var require_react_dom = /* @__PURE__ */ __commonJSMin(((exports, module) => {
		function checkDCE$1() {
			if (typeof __REACT_DEVTOOLS_GLOBAL_HOOK__ === "undefined" || typeof __REACT_DEVTOOLS_GLOBAL_HOOK__.checkDCE !== "function") return;
			try {
				__REACT_DEVTOOLS_GLOBAL_HOOK__.checkDCE(checkDCE$1);
			} catch (err) {
				console.error(err);
			}
		}
		checkDCE$1();
		module.exports = require_react_dom_production();
	}));
	/**
	* @license React
	* react-dom-client.production.js
	*
	* Copyright (c) Meta Platforms, Inc. and affiliates.
	*
	* This source code is licensed under the MIT license found in the
	* LICENSE file in the root directory of this source tree.
	*/
	var require_react_dom_client_production = /* @__PURE__ */ __commonJSMin(((exports) => {
		var Scheduler = require_scheduler(), React$1 = require_react(), ReactDOM$2 = require_react_dom();
		function formatProdErrorMessage(code) {
			var url = "https://react.dev/errors/" + code;
			if (1 < arguments.length) {
				url += "?args[]=" + encodeURIComponent(arguments[1]);
				for (var i = 2; i < arguments.length; i++) url += "&args[]=" + encodeURIComponent(arguments[i]);
			}
			return "Minified React error #" + code + "; visit " + url + " for the full message or use the non-minified dev environment for full errors and additional helpful warnings.";
		}
		function isValidContainer(node) {
			return !(!node || 1 !== node.nodeType && 9 !== node.nodeType && 11 !== node.nodeType);
		}
		function getNearestMountedFiber(fiber) {
			var node = fiber, nearestMounted = fiber;
			if (fiber.alternate) for (; node.return;) node = node.return;
			else {
				fiber = node;
				do
					node = fiber, 0 !== (node.flags & 4098) && (nearestMounted = node.return), fiber = node.return;
				while (fiber);
			}
			return 3 === node.tag ? nearestMounted : null;
		}
		function getSuspenseInstanceFromFiber(fiber) {
			if (13 === fiber.tag) {
				var suspenseState = fiber.memoizedState;
				null === suspenseState && (fiber = fiber.alternate, null !== fiber && (suspenseState = fiber.memoizedState));
				if (null !== suspenseState) return suspenseState.dehydrated;
			}
			return null;
		}
		function getActivityInstanceFromFiber(fiber) {
			if (31 === fiber.tag) {
				var activityState = fiber.memoizedState;
				null === activityState && (fiber = fiber.alternate, null !== fiber && (activityState = fiber.memoizedState));
				if (null !== activityState) return activityState.dehydrated;
			}
			return null;
		}
		function assertIsMounted(fiber) {
			if (getNearestMountedFiber(fiber) !== fiber) throw Error(formatProdErrorMessage(188));
		}
		function findCurrentFiberUsingSlowPath(fiber) {
			var alternate = fiber.alternate;
			if (!alternate) {
				alternate = getNearestMountedFiber(fiber);
				if (null === alternate) throw Error(formatProdErrorMessage(188));
				return alternate !== fiber ? null : fiber;
			}
			for (var a$1 = fiber, b = alternate;;) {
				var parentA = a$1.return;
				if (null === parentA) break;
				var parentB = parentA.alternate;
				if (null === parentB) {
					b = parentA.return;
					if (null !== b) {
						a$1 = b;
						continue;
					}
					break;
				}
				if (parentA.child === parentB.child) {
					for (parentB = parentA.child; parentB;) {
						if (parentB === a$1) return assertIsMounted(parentA), fiber;
						if (parentB === b) return assertIsMounted(parentA), alternate;
						parentB = parentB.sibling;
					}
					throw Error(formatProdErrorMessage(188));
				}
				if (a$1.return !== b.return) a$1 = parentA, b = parentB;
				else {
					for (var didFindChild = !1, child$0 = parentA.child; child$0;) {
						if (child$0 === a$1) {
							didFindChild = !0;
							a$1 = parentA;
							b = parentB;
							break;
						}
						if (child$0 === b) {
							didFindChild = !0;
							b = parentA;
							a$1 = parentB;
							break;
						}
						child$0 = child$0.sibling;
					}
					if (!didFindChild) {
						for (child$0 = parentB.child; child$0;) {
							if (child$0 === a$1) {
								didFindChild = !0;
								a$1 = parentB;
								b = parentA;
								break;
							}
							if (child$0 === b) {
								didFindChild = !0;
								b = parentB;
								a$1 = parentA;
								break;
							}
							child$0 = child$0.sibling;
						}
						if (!didFindChild) throw Error(formatProdErrorMessage(189));
					}
				}
				if (a$1.alternate !== b) throw Error(formatProdErrorMessage(190));
			}
			if (3 !== a$1.tag) throw Error(formatProdErrorMessage(188));
			return a$1.stateNode.current === a$1 ? fiber : alternate;
		}
		function findCurrentHostFiberImpl(node) {
			var tag = node.tag;
			if (5 === tag || 26 === tag || 27 === tag || 6 === tag) return node;
			for (node = node.child; null !== node;) {
				tag = findCurrentHostFiberImpl(node);
				if (null !== tag) return tag;
				node = node.sibling;
			}
			return null;
		}
		var assign = Object.assign, REACT_LEGACY_ELEMENT_TYPE = Symbol.for("react.element"), REACT_ELEMENT_TYPE = Symbol.for("react.transitional.element"), REACT_PORTAL_TYPE = Symbol.for("react.portal"), REACT_FRAGMENT_TYPE = Symbol.for("react.fragment"), REACT_STRICT_MODE_TYPE = Symbol.for("react.strict_mode"), REACT_PROFILER_TYPE = Symbol.for("react.profiler"), REACT_CONSUMER_TYPE = Symbol.for("react.consumer"), REACT_CONTEXT_TYPE = Symbol.for("react.context"), REACT_FORWARD_REF_TYPE = Symbol.for("react.forward_ref"), REACT_SUSPENSE_TYPE = Symbol.for("react.suspense"), REACT_SUSPENSE_LIST_TYPE = Symbol.for("react.suspense_list"), REACT_MEMO_TYPE = Symbol.for("react.memo"), REACT_LAZY_TYPE$1 = Symbol.for("react.lazy");
		var REACT_ACTIVITY_TYPE = Symbol.for("react.activity");
		var REACT_MEMO_CACHE_SENTINEL = Symbol.for("react.memo_cache_sentinel");
		var MAYBE_ITERATOR_SYMBOL = Symbol.iterator;
		function getIteratorFn(maybeIterable) {
			if (null === maybeIterable || "object" !== typeof maybeIterable) return null;
			maybeIterable = MAYBE_ITERATOR_SYMBOL && maybeIterable[MAYBE_ITERATOR_SYMBOL] || maybeIterable["@@iterator"];
			return "function" === typeof maybeIterable ? maybeIterable : null;
		}
		var REACT_CLIENT_REFERENCE = Symbol.for("react.client.reference");
		function getComponentNameFromType(type) {
			if (null == type) return null;
			if ("function" === typeof type) return type.$$typeof === REACT_CLIENT_REFERENCE ? null : type.displayName || type.name || null;
			if ("string" === typeof type) return type;
			switch (type) {
				case REACT_FRAGMENT_TYPE: return "Fragment";
				case REACT_PROFILER_TYPE: return "Profiler";
				case REACT_STRICT_MODE_TYPE: return "StrictMode";
				case REACT_SUSPENSE_TYPE: return "Suspense";
				case REACT_SUSPENSE_LIST_TYPE: return "SuspenseList";
				case REACT_ACTIVITY_TYPE: return "Activity";
			}
			if ("object" === typeof type) switch (type.$$typeof) {
				case REACT_PORTAL_TYPE: return "Portal";
				case REACT_CONTEXT_TYPE: return type.displayName || "Context";
				case REACT_CONSUMER_TYPE: return (type._context.displayName || "Context") + ".Consumer";
				case REACT_FORWARD_REF_TYPE:
					var innerType = type.render;
					type = type.displayName;
					type || (type = innerType.displayName || innerType.name || "", type = "" !== type ? "ForwardRef(" + type + ")" : "ForwardRef");
					return type;
				case REACT_MEMO_TYPE: return innerType = type.displayName || null, null !== innerType ? innerType : getComponentNameFromType(type.type) || "Memo";
				case REACT_LAZY_TYPE$1:
					innerType = type._payload;
					type = type._init;
					try {
						return getComponentNameFromType(type(innerType));
					} catch (x) {}
			}
			return null;
		}
		var isArrayImpl = Array.isArray, ReactSharedInternals = React$1.__CLIENT_INTERNALS_DO_NOT_USE_OR_WARN_USERS_THEY_CANNOT_UPGRADE, ReactDOMSharedInternals = ReactDOM$2.__DOM_INTERNALS_DO_NOT_USE_OR_WARN_USERS_THEY_CANNOT_UPGRADE, sharedNotPendingObject = {
			pending: !1,
			data: null,
			method: null,
			action: null
		}, valueStack = [], index = -1;
		function createCursor(defaultValue) {
			return { current: defaultValue };
		}
		function pop(cursor) {
			0 > index || (cursor.current = valueStack[index], valueStack[index] = null, index--);
		}
		function push(cursor, value) {
			index++;
			valueStack[index] = cursor.current;
			cursor.current = value;
		}
		var contextStackCursor = createCursor(null), contextFiberStackCursor = createCursor(null), rootInstanceStackCursor = createCursor(null), hostTransitionProviderCursor = createCursor(null);
		function pushHostContainer(fiber, nextRootInstance) {
			push(rootInstanceStackCursor, nextRootInstance);
			push(contextFiberStackCursor, fiber);
			push(contextStackCursor, null);
			switch (nextRootInstance.nodeType) {
				case 9:
				case 11:
					fiber = (fiber = nextRootInstance.documentElement) ? (fiber = fiber.namespaceURI) ? getOwnHostContext(fiber) : 0 : 0;
					break;
				default: if (fiber = nextRootInstance.tagName, nextRootInstance = nextRootInstance.namespaceURI) nextRootInstance = getOwnHostContext(nextRootInstance), fiber = getChildHostContextProd(nextRootInstance, fiber);
				else switch (fiber) {
					case "svg":
						fiber = 1;
						break;
					case "math":
						fiber = 2;
						break;
					default: fiber = 0;
				}
			}
			pop(contextStackCursor);
			push(contextStackCursor, fiber);
		}
		function popHostContainer() {
			pop(contextStackCursor);
			pop(contextFiberStackCursor);
			pop(rootInstanceStackCursor);
		}
		function pushHostContext(fiber) {
			null !== fiber.memoizedState && push(hostTransitionProviderCursor, fiber);
			var context = contextStackCursor.current;
			var JSCompiler_inline_result = getChildHostContextProd(context, fiber.type);
			context !== JSCompiler_inline_result && (push(contextFiberStackCursor, fiber), push(contextStackCursor, JSCompiler_inline_result));
		}
		function popHostContext(fiber) {
			contextFiberStackCursor.current === fiber && (pop(contextStackCursor), pop(contextFiberStackCursor));
			hostTransitionProviderCursor.current === fiber && (pop(hostTransitionProviderCursor), HostTransitionContext._currentValue = sharedNotPendingObject);
		}
		var prefix, suffix;
		function describeBuiltInComponentFrame(name) {
			if (void 0 === prefix) try {
				throw Error();
			} catch (x) {
				var match = x.stack.trim().match(/\n( *(at )?)/);
				prefix = match && match[1] || "";
				suffix = -1 < x.stack.indexOf("\n    at") ? " (<anonymous>)" : -1 < x.stack.indexOf("@") ? "@unknown:0:0" : "";
			}
			return "\n" + prefix + name + suffix;
		}
		var reentry = !1;
		function describeNativeComponentFrame(fn, construct) {
			if (!fn || reentry) return "";
			reentry = !0;
			var previousPrepareStackTrace = Error.prepareStackTrace;
			Error.prepareStackTrace = void 0;
			try {
				var RunInRootFrame = { DetermineComponentFrameRoot: function() {
					try {
						if (construct) {
							var Fake = function() {
								throw Error();
							};
							Object.defineProperty(Fake.prototype, "props", { set: function() {
								throw Error();
							} });
							if ("object" === typeof Reflect && Reflect.construct) {
								try {
									Reflect.construct(Fake, []);
								} catch (x) {
									var control = x;
								}
								Reflect.construct(fn, [], Fake);
							} else {
								try {
									Fake.call();
								} catch (x$1) {
									control = x$1;
								}
								fn.call(Fake.prototype);
							}
						} else {
							try {
								throw Error();
							} catch (x$2) {
								control = x$2;
							}
							(Fake = fn()) && "function" === typeof Fake.catch && Fake.catch(function() {});
						}
					} catch (sample) {
						if (sample && control && "string" === typeof sample.stack) return [sample.stack, control.stack];
					}
					return [null, null];
				} };
				RunInRootFrame.DetermineComponentFrameRoot.displayName = "DetermineComponentFrameRoot";
				var namePropDescriptor = Object.getOwnPropertyDescriptor(RunInRootFrame.DetermineComponentFrameRoot, "name");
				namePropDescriptor && namePropDescriptor.configurable && Object.defineProperty(RunInRootFrame.DetermineComponentFrameRoot, "name", { value: "DetermineComponentFrameRoot" });
				var _RunInRootFrame$Deter = RunInRootFrame.DetermineComponentFrameRoot(), sampleStack = _RunInRootFrame$Deter[0], controlStack = _RunInRootFrame$Deter[1];
				if (sampleStack && controlStack) {
					var sampleLines = sampleStack.split("\n"), controlLines = controlStack.split("\n");
					for (namePropDescriptor = RunInRootFrame = 0; RunInRootFrame < sampleLines.length && !sampleLines[RunInRootFrame].includes("DetermineComponentFrameRoot");) RunInRootFrame++;
					for (; namePropDescriptor < controlLines.length && !controlLines[namePropDescriptor].includes("DetermineComponentFrameRoot");) namePropDescriptor++;
					if (RunInRootFrame === sampleLines.length || namePropDescriptor === controlLines.length) for (RunInRootFrame = sampleLines.length - 1, namePropDescriptor = controlLines.length - 1; 1 <= RunInRootFrame && 0 <= namePropDescriptor && sampleLines[RunInRootFrame] !== controlLines[namePropDescriptor];) namePropDescriptor--;
					for (; 1 <= RunInRootFrame && 0 <= namePropDescriptor; RunInRootFrame--, namePropDescriptor--) if (sampleLines[RunInRootFrame] !== controlLines[namePropDescriptor]) {
						if (1 !== RunInRootFrame || 1 !== namePropDescriptor) do
							if (RunInRootFrame--, namePropDescriptor--, 0 > namePropDescriptor || sampleLines[RunInRootFrame] !== controlLines[namePropDescriptor]) {
								var frame = "\n" + sampleLines[RunInRootFrame].replace(" at new ", " at ");
								fn.displayName && frame.includes("<anonymous>") && (frame = frame.replace("<anonymous>", fn.displayName));
								return frame;
							}
						while (1 <= RunInRootFrame && 0 <= namePropDescriptor);
						break;
					}
				}
			} finally {
				reentry = !1, Error.prepareStackTrace = previousPrepareStackTrace;
			}
			return (previousPrepareStackTrace = fn ? fn.displayName || fn.name : "") ? describeBuiltInComponentFrame(previousPrepareStackTrace) : "";
		}
		function describeFiber(fiber, childFiber) {
			switch (fiber.tag) {
				case 26:
				case 27:
				case 5: return describeBuiltInComponentFrame(fiber.type);
				case 16: return describeBuiltInComponentFrame("Lazy");
				case 13: return fiber.child !== childFiber && null !== childFiber ? describeBuiltInComponentFrame("Suspense Fallback") : describeBuiltInComponentFrame("Suspense");
				case 19: return describeBuiltInComponentFrame("SuspenseList");
				case 0:
				case 15: return describeNativeComponentFrame(fiber.type, !1);
				case 11: return describeNativeComponentFrame(fiber.type.render, !1);
				case 1: return describeNativeComponentFrame(fiber.type, !0);
				case 31: return describeBuiltInComponentFrame("Activity");
				default: return "";
			}
		}
		function getStackByFiberInDevAndProd(workInProgress$1) {
			try {
				var info = "", previous = null;
				do
					info += describeFiber(workInProgress$1, previous), previous = workInProgress$1, workInProgress$1 = workInProgress$1.return;
				while (workInProgress$1);
				return info;
			} catch (x) {
				return "\nError generating stack: " + x.message + "\n" + x.stack;
			}
		}
		var hasOwnProperty = Object.prototype.hasOwnProperty, scheduleCallback$3 = Scheduler.unstable_scheduleCallback, cancelCallback$1 = Scheduler.unstable_cancelCallback, shouldYield = Scheduler.unstable_shouldYield, requestPaint = Scheduler.unstable_requestPaint, now = Scheduler.unstable_now, getCurrentPriorityLevel = Scheduler.unstable_getCurrentPriorityLevel, ImmediatePriority = Scheduler.unstable_ImmediatePriority, UserBlockingPriority = Scheduler.unstable_UserBlockingPriority, NormalPriority$1 = Scheduler.unstable_NormalPriority, LowPriority = Scheduler.unstable_LowPriority, IdlePriority = Scheduler.unstable_IdlePriority, log$1 = Scheduler.log, unstable_setDisableYieldValue = Scheduler.unstable_setDisableYieldValue, rendererID = null, injectedHook = null;
		function setIsStrictModeForDevtools(newIsStrictMode) {
			"function" === typeof log$1 && unstable_setDisableYieldValue(newIsStrictMode);
			if (injectedHook && "function" === typeof injectedHook.setStrictMode) try {
				injectedHook.setStrictMode(rendererID, newIsStrictMode);
			} catch (err) {}
		}
		var clz32 = Math.clz32 ? Math.clz32 : clz32Fallback, log = Math.log, LN2 = Math.LN2;
		function clz32Fallback(x) {
			x >>>= 0;
			return 0 === x ? 32 : 31 - (log(x) / LN2 | 0) | 0;
		}
		var nextTransitionUpdateLane = 256, nextTransitionDeferredLane = 262144, nextRetryLane = 4194304;
		function getHighestPriorityLanes(lanes) {
			var pendingSyncLanes = lanes & 42;
			if (0 !== pendingSyncLanes) return pendingSyncLanes;
			switch (lanes & -lanes) {
				case 1: return 1;
				case 2: return 2;
				case 4: return 4;
				case 8: return 8;
				case 16: return 16;
				case 32: return 32;
				case 64: return 64;
				case 128: return 128;
				case 256:
				case 512:
				case 1024:
				case 2048:
				case 4096:
				case 8192:
				case 16384:
				case 32768:
				case 65536:
				case 131072: return lanes & 261888;
				case 262144:
				case 524288:
				case 1048576:
				case 2097152: return lanes & 3932160;
				case 4194304:
				case 8388608:
				case 16777216:
				case 33554432: return lanes & 62914560;
				case 67108864: return 67108864;
				case 134217728: return 134217728;
				case 268435456: return 268435456;
				case 536870912: return 536870912;
				case 1073741824: return 0;
				default: return lanes;
			}
		}
		function getNextLanes(root$1, wipLanes, rootHasPendingCommit) {
			var pendingLanes = root$1.pendingLanes;
			if (0 === pendingLanes) return 0;
			var nextLanes = 0, suspendedLanes = root$1.suspendedLanes, pingedLanes = root$1.pingedLanes;
			root$1 = root$1.warmLanes;
			var nonIdlePendingLanes = pendingLanes & 134217727;
			0 !== nonIdlePendingLanes ? (pendingLanes = nonIdlePendingLanes & ~suspendedLanes, 0 !== pendingLanes ? nextLanes = getHighestPriorityLanes(pendingLanes) : (pingedLanes &= nonIdlePendingLanes, 0 !== pingedLanes ? nextLanes = getHighestPriorityLanes(pingedLanes) : rootHasPendingCommit || (rootHasPendingCommit = nonIdlePendingLanes & ~root$1, 0 !== rootHasPendingCommit && (nextLanes = getHighestPriorityLanes(rootHasPendingCommit))))) : (nonIdlePendingLanes = pendingLanes & ~suspendedLanes, 0 !== nonIdlePendingLanes ? nextLanes = getHighestPriorityLanes(nonIdlePendingLanes) : 0 !== pingedLanes ? nextLanes = getHighestPriorityLanes(pingedLanes) : rootHasPendingCommit || (rootHasPendingCommit = pendingLanes & ~root$1, 0 !== rootHasPendingCommit && (nextLanes = getHighestPriorityLanes(rootHasPendingCommit))));
			return 0 === nextLanes ? 0 : 0 !== wipLanes && wipLanes !== nextLanes && 0 === (wipLanes & suspendedLanes) && (suspendedLanes = nextLanes & -nextLanes, rootHasPendingCommit = wipLanes & -wipLanes, suspendedLanes >= rootHasPendingCommit || 32 === suspendedLanes && 0 !== (rootHasPendingCommit & 4194048)) ? wipLanes : nextLanes;
		}
		function checkIfRootIsPrerendering(root$1, renderLanes$1) {
			return 0 === (root$1.pendingLanes & ~(root$1.suspendedLanes & ~root$1.pingedLanes) & renderLanes$1);
		}
		function computeExpirationTime(lane, currentTime) {
			switch (lane) {
				case 1:
				case 2:
				case 4:
				case 8:
				case 64: return currentTime + 250;
				case 16:
				case 32:
				case 128:
				case 256:
				case 512:
				case 1024:
				case 2048:
				case 4096:
				case 8192:
				case 16384:
				case 32768:
				case 65536:
				case 131072:
				case 262144:
				case 524288:
				case 1048576:
				case 2097152: return currentTime + 5e3;
				case 4194304:
				case 8388608:
				case 16777216:
				case 33554432: return -1;
				case 67108864:
				case 134217728:
				case 268435456:
				case 536870912:
				case 1073741824: return -1;
				default: return -1;
			}
		}
		function claimNextRetryLane() {
			var lane = nextRetryLane;
			nextRetryLane <<= 1;
			0 === (nextRetryLane & 62914560) && (nextRetryLane = 4194304);
			return lane;
		}
		function createLaneMap(initial) {
			for (var laneMap = [], i = 0; 31 > i; i++) laneMap.push(initial);
			return laneMap;
		}
		function markRootUpdated$1(root$1, updateLane) {
			root$1.pendingLanes |= updateLane;
			268435456 !== updateLane && (root$1.suspendedLanes = 0, root$1.pingedLanes = 0, root$1.warmLanes = 0);
		}
		function markRootFinished(root$1, finishedLanes, remainingLanes, spawnedLane, updatedLanes, suspendedRetryLanes) {
			var previouslyPendingLanes = root$1.pendingLanes;
			root$1.pendingLanes = remainingLanes;
			root$1.suspendedLanes = 0;
			root$1.pingedLanes = 0;
			root$1.warmLanes = 0;
			root$1.expiredLanes &= remainingLanes;
			root$1.entangledLanes &= remainingLanes;
			root$1.errorRecoveryDisabledLanes &= remainingLanes;
			root$1.shellSuspendCounter = 0;
			var entanglements = root$1.entanglements, expirationTimes = root$1.expirationTimes, hiddenUpdates = root$1.hiddenUpdates;
			for (remainingLanes = previouslyPendingLanes & ~remainingLanes; 0 < remainingLanes;) {
				var index$7 = 31 - clz32(remainingLanes), lane = 1 << index$7;
				entanglements[index$7] = 0;
				expirationTimes[index$7] = -1;
				var hiddenUpdatesForLane = hiddenUpdates[index$7];
				if (null !== hiddenUpdatesForLane) for (hiddenUpdates[index$7] = null, index$7 = 0; index$7 < hiddenUpdatesForLane.length; index$7++) {
					var update = hiddenUpdatesForLane[index$7];
					null !== update && (update.lane &= -536870913);
				}
				remainingLanes &= ~lane;
			}
			0 !== spawnedLane && markSpawnedDeferredLane(root$1, spawnedLane, 0);
			0 !== suspendedRetryLanes && 0 === updatedLanes && 0 !== root$1.tag && (root$1.suspendedLanes |= suspendedRetryLanes & ~(previouslyPendingLanes & ~finishedLanes));
		}
		function markSpawnedDeferredLane(root$1, spawnedLane, entangledLanes) {
			root$1.pendingLanes |= spawnedLane;
			root$1.suspendedLanes &= ~spawnedLane;
			var spawnedLaneIndex = 31 - clz32(spawnedLane);
			root$1.entangledLanes |= spawnedLane;
			root$1.entanglements[spawnedLaneIndex] = root$1.entanglements[spawnedLaneIndex] | 1073741824 | entangledLanes & 261930;
		}
		function markRootEntangled(root$1, entangledLanes) {
			var rootEntangledLanes = root$1.entangledLanes |= entangledLanes;
			for (root$1 = root$1.entanglements; rootEntangledLanes;) {
				var index$8 = 31 - clz32(rootEntangledLanes), lane = 1 << index$8;
				lane & entangledLanes | root$1[index$8] & entangledLanes && (root$1[index$8] |= entangledLanes);
				rootEntangledLanes &= ~lane;
			}
		}
		function getBumpedLaneForHydration(root$1, renderLanes$1) {
			var renderLane = renderLanes$1 & -renderLanes$1;
			renderLane = 0 !== (renderLane & 42) ? 1 : getBumpedLaneForHydrationByLane(renderLane);
			return 0 !== (renderLane & (root$1.suspendedLanes | renderLanes$1)) ? 0 : renderLane;
		}
		function getBumpedLaneForHydrationByLane(lane) {
			switch (lane) {
				case 2:
					lane = 1;
					break;
				case 8:
					lane = 4;
					break;
				case 32:
					lane = 16;
					break;
				case 256:
				case 512:
				case 1024:
				case 2048:
				case 4096:
				case 8192:
				case 16384:
				case 32768:
				case 65536:
				case 131072:
				case 262144:
				case 524288:
				case 1048576:
				case 2097152:
				case 4194304:
				case 8388608:
				case 16777216:
				case 33554432:
					lane = 128;
					break;
				case 268435456:
					lane = 134217728;
					break;
				default: lane = 0;
			}
			return lane;
		}
		function lanesToEventPriority(lanes) {
			lanes &= -lanes;
			return 2 < lanes ? 8 < lanes ? 0 !== (lanes & 134217727) ? 32 : 268435456 : 8 : 2;
		}
		function resolveUpdatePriority() {
			var updatePriority = ReactDOMSharedInternals.p;
			if (0 !== updatePriority) return updatePriority;
			updatePriority = window.event;
			return void 0 === updatePriority ? 32 : getEventPriority(updatePriority.type);
		}
		function runWithPriority(priority, fn) {
			var previousPriority = ReactDOMSharedInternals.p;
			try {
				return ReactDOMSharedInternals.p = priority, fn();
			} finally {
				ReactDOMSharedInternals.p = previousPriority;
			}
		}
		var randomKey = Math.random().toString(36).slice(2), internalInstanceKey = "__reactFiber$" + randomKey, internalPropsKey = "__reactProps$" + randomKey, internalContainerInstanceKey = "__reactContainer$" + randomKey, internalEventHandlersKey = "__reactEvents$" + randomKey, internalEventHandlerListenersKey = "__reactListeners$" + randomKey, internalEventHandlesSetKey = "__reactHandles$" + randomKey, internalRootNodeResourcesKey = "__reactResources$" + randomKey, internalHoistableMarker = "__reactMarker$" + randomKey;
		function detachDeletedInstance(node) {
			delete node[internalInstanceKey];
			delete node[internalPropsKey];
			delete node[internalEventHandlersKey];
			delete node[internalEventHandlerListenersKey];
			delete node[internalEventHandlesSetKey];
		}
		function getClosestInstanceFromNode(targetNode) {
			var targetInst = targetNode[internalInstanceKey];
			if (targetInst) return targetInst;
			for (var parentNode = targetNode.parentNode; parentNode;) {
				if (targetInst = parentNode[internalContainerInstanceKey] || parentNode[internalInstanceKey]) {
					parentNode = targetInst.alternate;
					if (null !== targetInst.child || null !== parentNode && null !== parentNode.child) for (targetNode = getParentHydrationBoundary(targetNode); null !== targetNode;) {
						if (parentNode = targetNode[internalInstanceKey]) return parentNode;
						targetNode = getParentHydrationBoundary(targetNode);
					}
					return targetInst;
				}
				targetNode = parentNode;
				parentNode = targetNode.parentNode;
			}
			return null;
		}
		function getInstanceFromNode(node) {
			if (node = node[internalInstanceKey] || node[internalContainerInstanceKey]) {
				var tag = node.tag;
				if (5 === tag || 6 === tag || 13 === tag || 31 === tag || 26 === tag || 27 === tag || 3 === tag) return node;
			}
			return null;
		}
		function getNodeFromInstance(inst) {
			var tag = inst.tag;
			if (5 === tag || 26 === tag || 27 === tag || 6 === tag) return inst.stateNode;
			throw Error(formatProdErrorMessage(33));
		}
		function getResourcesFromRoot(root$1) {
			var resources = root$1[internalRootNodeResourcesKey];
			resources || (resources = root$1[internalRootNodeResourcesKey] = {
				hoistableStyles: /* @__PURE__ */ new Map(),
				hoistableScripts: /* @__PURE__ */ new Map()
			});
			return resources;
		}
		function markNodeAsHoistable(node) {
			node[internalHoistableMarker] = !0;
		}
		var allNativeEvents = /* @__PURE__ */ new Set(), registrationNameDependencies = {};
		function registerTwoPhaseEvent(registrationName, dependencies) {
			registerDirectEvent(registrationName, dependencies);
			registerDirectEvent(registrationName + "Capture", dependencies);
		}
		function registerDirectEvent(registrationName, dependencies) {
			registrationNameDependencies[registrationName] = dependencies;
			for (registrationName = 0; registrationName < dependencies.length; registrationName++) allNativeEvents.add(dependencies[registrationName]);
		}
		var VALID_ATTRIBUTE_NAME_REGEX = RegExp("^[:A-Z_a-z\\u00C0-\\u00D6\\u00D8-\\u00F6\\u00F8-\\u02FF\\u0370-\\u037D\\u037F-\\u1FFF\\u200C-\\u200D\\u2070-\\u218F\\u2C00-\\u2FEF\\u3001-\\uD7FF\\uF900-\\uFDCF\\uFDF0-\\uFFFD][:A-Z_a-z\\u00C0-\\u00D6\\u00D8-\\u00F6\\u00F8-\\u02FF\\u0370-\\u037D\\u037F-\\u1FFF\\u200C-\\u200D\\u2070-\\u218F\\u2C00-\\u2FEF\\u3001-\\uD7FF\\uF900-\\uFDCF\\uFDF0-\\uFFFD\\-.0-9\\u00B7\\u0300-\\u036F\\u203F-\\u2040]*$"), illegalAttributeNameCache = {}, validatedAttributeNameCache = {};
		function isAttributeNameSafe(attributeName) {
			if (hasOwnProperty.call(validatedAttributeNameCache, attributeName)) return !0;
			if (hasOwnProperty.call(illegalAttributeNameCache, attributeName)) return !1;
			if (VALID_ATTRIBUTE_NAME_REGEX.test(attributeName)) return validatedAttributeNameCache[attributeName] = !0;
			illegalAttributeNameCache[attributeName] = !0;
			return !1;
		}
		function setValueForAttribute(node, name, value) {
			if (isAttributeNameSafe(name)) if (null === value) node.removeAttribute(name);
			else {
				switch (typeof value) {
					case "undefined":
					case "function":
					case "symbol":
						node.removeAttribute(name);
						return;
					case "boolean":
						var prefix$10 = name.toLowerCase().slice(0, 5);
						if ("data-" !== prefix$10 && "aria-" !== prefix$10) {
							node.removeAttribute(name);
							return;
						}
				}
				node.setAttribute(name, "" + value);
			}
		}
		function setValueForKnownAttribute(node, name, value) {
			if (null === value) node.removeAttribute(name);
			else {
				switch (typeof value) {
					case "undefined":
					case "function":
					case "symbol":
					case "boolean":
						node.removeAttribute(name);
						return;
				}
				node.setAttribute(name, "" + value);
			}
		}
		function setValueForNamespacedAttribute(node, namespace, name, value) {
			if (null === value) node.removeAttribute(name);
			else {
				switch (typeof value) {
					case "undefined":
					case "function":
					case "symbol":
					case "boolean":
						node.removeAttribute(name);
						return;
				}
				node.setAttributeNS(namespace, name, "" + value);
			}
		}
		function getToStringValue(value) {
			switch (typeof value) {
				case "bigint":
				case "boolean":
				case "number":
				case "string":
				case "undefined": return value;
				case "object": return value;
				default: return "";
			}
		}
		function isCheckable(elem) {
			var type = elem.type;
			return (elem = elem.nodeName) && "input" === elem.toLowerCase() && ("checkbox" === type || "radio" === type);
		}
		function trackValueOnNode(node, valueField, currentValue) {
			var descriptor = Object.getOwnPropertyDescriptor(node.constructor.prototype, valueField);
			if (!node.hasOwnProperty(valueField) && "undefined" !== typeof descriptor && "function" === typeof descriptor.get && "function" === typeof descriptor.set) {
				var get = descriptor.get, set = descriptor.set;
				Object.defineProperty(node, valueField, {
					configurable: !0,
					get: function() {
						return get.call(this);
					},
					set: function(value) {
						currentValue = "" + value;
						set.call(this, value);
					}
				});
				Object.defineProperty(node, valueField, { enumerable: descriptor.enumerable });
				return {
					getValue: function() {
						return currentValue;
					},
					setValue: function(value) {
						currentValue = "" + value;
					},
					stopTracking: function() {
						node._valueTracker = null;
						delete node[valueField];
					}
				};
			}
		}
		function track(node) {
			if (!node._valueTracker) {
				var valueField = isCheckable(node) ? "checked" : "value";
				node._valueTracker = trackValueOnNode(node, valueField, "" + node[valueField]);
			}
		}
		function updateValueIfChanged(node) {
			if (!node) return !1;
			var tracker = node._valueTracker;
			if (!tracker) return !0;
			var lastValue = tracker.getValue();
			var value = "";
			node && (value = isCheckable(node) ? node.checked ? "true" : "false" : node.value);
			node = value;
			return node !== lastValue ? (tracker.setValue(node), !0) : !1;
		}
		function getActiveElement(doc) {
			doc = doc || ("undefined" !== typeof document ? document : void 0);
			if ("undefined" === typeof doc) return null;
			try {
				return doc.activeElement || doc.body;
			} catch (e) {
				return doc.body;
			}
		}
		var escapeSelectorAttributeValueInsideDoubleQuotesRegex = /[\n"\\]/g;
		function escapeSelectorAttributeValueInsideDoubleQuotes(value) {
			return value.replace(escapeSelectorAttributeValueInsideDoubleQuotesRegex, function(ch) {
				return "\\" + ch.charCodeAt(0).toString(16) + " ";
			});
		}
		function updateInput(element, value, defaultValue, lastDefaultValue, checked, defaultChecked, type, name) {
			element.name = "";
			null != type && "function" !== typeof type && "symbol" !== typeof type && "boolean" !== typeof type ? element.type = type : element.removeAttribute("type");
			if (null != value) if ("number" === type) {
				if (0 === value && "" === element.value || element.value != value) element.value = "" + getToStringValue(value);
			} else element.value !== "" + getToStringValue(value) && (element.value = "" + getToStringValue(value));
			else "submit" !== type && "reset" !== type || element.removeAttribute("value");
			null != value ? setDefaultValue(element, type, getToStringValue(value)) : null != defaultValue ? setDefaultValue(element, type, getToStringValue(defaultValue)) : null != lastDefaultValue && element.removeAttribute("value");
			null == checked && null != defaultChecked && (element.defaultChecked = !!defaultChecked);
			null != checked && (element.checked = checked && "function" !== typeof checked && "symbol" !== typeof checked);
			null != name && "function" !== typeof name && "symbol" !== typeof name && "boolean" !== typeof name ? element.name = "" + getToStringValue(name) : element.removeAttribute("name");
		}
		function initInput(element, value, defaultValue, checked, defaultChecked, type, name, isHydrating$1) {
			null != type && "function" !== typeof type && "symbol" !== typeof type && "boolean" !== typeof type && (element.type = type);
			if (null != value || null != defaultValue) {
				if (!("submit" !== type && "reset" !== type || void 0 !== value && null !== value)) {
					track(element);
					return;
				}
				defaultValue = null != defaultValue ? "" + getToStringValue(defaultValue) : "";
				value = null != value ? "" + getToStringValue(value) : defaultValue;
				isHydrating$1 || value === element.value || (element.value = value);
				element.defaultValue = value;
			}
			checked = null != checked ? checked : defaultChecked;
			checked = "function" !== typeof checked && "symbol" !== typeof checked && !!checked;
			element.checked = isHydrating$1 ? element.checked : !!checked;
			element.defaultChecked = !!checked;
			null != name && "function" !== typeof name && "symbol" !== typeof name && "boolean" !== typeof name && (element.name = name);
			track(element);
		}
		function setDefaultValue(node, type, value) {
			"number" === type && getActiveElement(node.ownerDocument) === node || node.defaultValue === "" + value || (node.defaultValue = "" + value);
		}
		function updateOptions(node, multiple, propValue, setDefaultSelected) {
			node = node.options;
			if (multiple) {
				multiple = {};
				for (var i = 0; i < propValue.length; i++) multiple["$" + propValue[i]] = !0;
				for (propValue = 0; propValue < node.length; propValue++) i = multiple.hasOwnProperty("$" + node[propValue].value), node[propValue].selected !== i && (node[propValue].selected = i), i && setDefaultSelected && (node[propValue].defaultSelected = !0);
			} else {
				propValue = "" + getToStringValue(propValue);
				multiple = null;
				for (i = 0; i < node.length; i++) {
					if (node[i].value === propValue) {
						node[i].selected = !0;
						setDefaultSelected && (node[i].defaultSelected = !0);
						return;
					}
					null !== multiple || node[i].disabled || (multiple = node[i]);
				}
				null !== multiple && (multiple.selected = !0);
			}
		}
		function updateTextarea(element, value, defaultValue) {
			if (null != value && (value = "" + getToStringValue(value), value !== element.value && (element.value = value), null == defaultValue)) {
				element.defaultValue !== value && (element.defaultValue = value);
				return;
			}
			element.defaultValue = null != defaultValue ? "" + getToStringValue(defaultValue) : "";
		}
		function initTextarea(element, value, defaultValue, children) {
			if (null == value) {
				if (null != children) {
					if (null != defaultValue) throw Error(formatProdErrorMessage(92));
					if (isArrayImpl(children)) {
						if (1 < children.length) throw Error(formatProdErrorMessage(93));
						children = children[0];
					}
					defaultValue = children;
				}
				defaultValue ??= "";
				value = defaultValue;
			}
			defaultValue = getToStringValue(value);
			element.defaultValue = defaultValue;
			children = element.textContent;
			children === defaultValue && "" !== children && null !== children && (element.value = children);
			track(element);
		}
		function setTextContent(node, text) {
			if (text) {
				var firstChild = node.firstChild;
				if (firstChild && firstChild === node.lastChild && 3 === firstChild.nodeType) {
					firstChild.nodeValue = text;
					return;
				}
			}
			node.textContent = text;
		}
		var unitlessNumbers = new Set("animationIterationCount aspectRatio borderImageOutset borderImageSlice borderImageWidth boxFlex boxFlexGroup boxOrdinalGroup columnCount columns flex flexGrow flexPositive flexShrink flexNegative flexOrder gridArea gridRow gridRowEnd gridRowSpan gridRowStart gridColumn gridColumnEnd gridColumnSpan gridColumnStart fontWeight lineClamp lineHeight opacity order orphans scale tabSize widows zIndex zoom fillOpacity floodOpacity stopOpacity strokeDasharray strokeDashoffset strokeMiterlimit strokeOpacity strokeWidth MozAnimationIterationCount MozBoxFlex MozBoxFlexGroup MozLineClamp msAnimationIterationCount msFlex msZoom msFlexGrow msFlexNegative msFlexOrder msFlexPositive msFlexShrink msGridColumn msGridColumnSpan msGridRow msGridRowSpan WebkitAnimationIterationCount WebkitBoxFlex WebKitBoxFlexGroup WebkitBoxOrdinalGroup WebkitColumnCount WebkitColumns WebkitFlex WebkitFlexGrow WebkitFlexPositive WebkitFlexShrink WebkitLineClamp".split(" "));
		function setValueForStyle(style$1, styleName, value) {
			var isCustomProperty = 0 === styleName.indexOf("--");
			null == value || "boolean" === typeof value || "" === value ? isCustomProperty ? style$1.setProperty(styleName, "") : "float" === styleName ? style$1.cssFloat = "" : style$1[styleName] = "" : isCustomProperty ? style$1.setProperty(styleName, value) : "number" !== typeof value || 0 === value || unitlessNumbers.has(styleName) ? "float" === styleName ? style$1.cssFloat = value : style$1[styleName] = ("" + value).trim() : style$1[styleName] = value + "px";
		}
		function setValueForStyles(node, styles, prevStyles) {
			if (null != styles && "object" !== typeof styles) throw Error(formatProdErrorMessage(62));
			node = node.style;
			if (null != prevStyles) {
				for (var styleName in prevStyles) !prevStyles.hasOwnProperty(styleName) || null != styles && styles.hasOwnProperty(styleName) || (0 === styleName.indexOf("--") ? node.setProperty(styleName, "") : "float" === styleName ? node.cssFloat = "" : node[styleName] = "");
				for (var styleName$16 in styles) styleName = styles[styleName$16], styles.hasOwnProperty(styleName$16) && prevStyles[styleName$16] !== styleName && setValueForStyle(node, styleName$16, styleName);
			} else for (var styleName$17 in styles) styles.hasOwnProperty(styleName$17) && setValueForStyle(node, styleName$17, styles[styleName$17]);
		}
		function isCustomElement(tagName) {
			if (-1 === tagName.indexOf("-")) return !1;
			switch (tagName) {
				case "annotation-xml":
				case "color-profile":
				case "font-face":
				case "font-face-src":
				case "font-face-uri":
				case "font-face-format":
				case "font-face-name":
				case "missing-glyph": return !1;
				default: return !0;
			}
		}
		var aliases = new Map([
			["acceptCharset", "accept-charset"],
			["htmlFor", "for"],
			["httpEquiv", "http-equiv"],
			["crossOrigin", "crossorigin"],
			["accentHeight", "accent-height"],
			["alignmentBaseline", "alignment-baseline"],
			["arabicForm", "arabic-form"],
			["baselineShift", "baseline-shift"],
			["capHeight", "cap-height"],
			["clipPath", "clip-path"],
			["clipRule", "clip-rule"],
			["colorInterpolation", "color-interpolation"],
			["colorInterpolationFilters", "color-interpolation-filters"],
			["colorProfile", "color-profile"],
			["colorRendering", "color-rendering"],
			["dominantBaseline", "dominant-baseline"],
			["enableBackground", "enable-background"],
			["fillOpacity", "fill-opacity"],
			["fillRule", "fill-rule"],
			["floodColor", "flood-color"],
			["floodOpacity", "flood-opacity"],
			["fontFamily", "font-family"],
			["fontSize", "font-size"],
			["fontSizeAdjust", "font-size-adjust"],
			["fontStretch", "font-stretch"],
			["fontStyle", "font-style"],
			["fontVariant", "font-variant"],
			["fontWeight", "font-weight"],
			["glyphName", "glyph-name"],
			["glyphOrientationHorizontal", "glyph-orientation-horizontal"],
			["glyphOrientationVertical", "glyph-orientation-vertical"],
			["horizAdvX", "horiz-adv-x"],
			["horizOriginX", "horiz-origin-x"],
			["imageRendering", "image-rendering"],
			["letterSpacing", "letter-spacing"],
			["lightingColor", "lighting-color"],
			["markerEnd", "marker-end"],
			["markerMid", "marker-mid"],
			["markerStart", "marker-start"],
			["overlinePosition", "overline-position"],
			["overlineThickness", "overline-thickness"],
			["paintOrder", "paint-order"],
			["panose-1", "panose-1"],
			["pointerEvents", "pointer-events"],
			["renderingIntent", "rendering-intent"],
			["shapeRendering", "shape-rendering"],
			["stopColor", "stop-color"],
			["stopOpacity", "stop-opacity"],
			["strikethroughPosition", "strikethrough-position"],
			["strikethroughThickness", "strikethrough-thickness"],
			["strokeDasharray", "stroke-dasharray"],
			["strokeDashoffset", "stroke-dashoffset"],
			["strokeLinecap", "stroke-linecap"],
			["strokeLinejoin", "stroke-linejoin"],
			["strokeMiterlimit", "stroke-miterlimit"],
			["strokeOpacity", "stroke-opacity"],
			["strokeWidth", "stroke-width"],
			["textAnchor", "text-anchor"],
			["textDecoration", "text-decoration"],
			["textRendering", "text-rendering"],
			["transformOrigin", "transform-origin"],
			["underlinePosition", "underline-position"],
			["underlineThickness", "underline-thickness"],
			["unicodeBidi", "unicode-bidi"],
			["unicodeRange", "unicode-range"],
			["unitsPerEm", "units-per-em"],
			["vAlphabetic", "v-alphabetic"],
			["vHanging", "v-hanging"],
			["vIdeographic", "v-ideographic"],
			["vMathematical", "v-mathematical"],
			["vectorEffect", "vector-effect"],
			["vertAdvY", "vert-adv-y"],
			["vertOriginX", "vert-origin-x"],
			["vertOriginY", "vert-origin-y"],
			["wordSpacing", "word-spacing"],
			["writingMode", "writing-mode"],
			["xmlnsXlink", "xmlns:xlink"],
			["xHeight", "x-height"]
		]), isJavaScriptProtocol = /^[\u0000-\u001F ]*j[\r\n\t]*a[\r\n\t]*v[\r\n\t]*a[\r\n\t]*s[\r\n\t]*c[\r\n\t]*r[\r\n\t]*i[\r\n\t]*p[\r\n\t]*t[\r\n\t]*:/i;
		function sanitizeURL(url) {
			return isJavaScriptProtocol.test("" + url) ? "javascript:throw new Error('React has blocked a javascript: URL as a security precaution.')" : url;
		}
		function noop$1() {}
		var currentReplayingEvent = null;
		function getEventTarget(nativeEvent) {
			nativeEvent = nativeEvent.target || nativeEvent.srcElement || window;
			nativeEvent.correspondingUseElement && (nativeEvent = nativeEvent.correspondingUseElement);
			return 3 === nativeEvent.nodeType ? nativeEvent.parentNode : nativeEvent;
		}
		var restoreTarget = null, restoreQueue = null;
		function restoreStateOfTarget(target) {
			var internalInstance = getInstanceFromNode(target);
			if (internalInstance && (target = internalInstance.stateNode)) {
				var props = target[internalPropsKey] || null;
				a: switch (target = internalInstance.stateNode, internalInstance.type) {
					case "input":
						updateInput(target, props.value, props.defaultValue, props.defaultValue, props.checked, props.defaultChecked, props.type, props.name);
						internalInstance = props.name;
						if ("radio" === props.type && null != internalInstance) {
							for (props = target; props.parentNode;) props = props.parentNode;
							props = props.querySelectorAll("input[name=\"" + escapeSelectorAttributeValueInsideDoubleQuotes("" + internalInstance) + "\"][type=\"radio\"]");
							for (internalInstance = 0; internalInstance < props.length; internalInstance++) {
								var otherNode = props[internalInstance];
								if (otherNode !== target && otherNode.form === target.form) {
									var otherProps = otherNode[internalPropsKey] || null;
									if (!otherProps) throw Error(formatProdErrorMessage(90));
									updateInput(otherNode, otherProps.value, otherProps.defaultValue, otherProps.defaultValue, otherProps.checked, otherProps.defaultChecked, otherProps.type, otherProps.name);
								}
							}
							for (internalInstance = 0; internalInstance < props.length; internalInstance++) otherNode = props[internalInstance], otherNode.form === target.form && updateValueIfChanged(otherNode);
						}
						break a;
					case "textarea":
						updateTextarea(target, props.value, props.defaultValue);
						break a;
					case "select": internalInstance = props.value, null != internalInstance && updateOptions(target, !!props.multiple, internalInstance, !1);
				}
			}
		}
		var isInsideEventHandler = !1;
		function batchedUpdates$1(fn, a$1, b) {
			if (isInsideEventHandler) return fn(a$1, b);
			isInsideEventHandler = !0;
			try {
				return fn(a$1);
			} finally {
				if (isInsideEventHandler = !1, null !== restoreTarget || null !== restoreQueue) {
					if (flushSyncWork$1(), restoreTarget && (a$1 = restoreTarget, fn = restoreQueue, restoreQueue = restoreTarget = null, restoreStateOfTarget(a$1), fn)) for (a$1 = 0; a$1 < fn.length; a$1++) restoreStateOfTarget(fn[a$1]);
				}
			}
		}
		function getListener(inst, registrationName) {
			var stateNode = inst.stateNode;
			if (null === stateNode) return null;
			var props = stateNode[internalPropsKey] || null;
			if (null === props) return null;
			stateNode = props[registrationName];
			a: switch (registrationName) {
				case "onClick":
				case "onClickCapture":
				case "onDoubleClick":
				case "onDoubleClickCapture":
				case "onMouseDown":
				case "onMouseDownCapture":
				case "onMouseMove":
				case "onMouseMoveCapture":
				case "onMouseUp":
				case "onMouseUpCapture":
				case "onMouseEnter":
					(props = !props.disabled) || (inst = inst.type, props = !("button" === inst || "input" === inst || "select" === inst || "textarea" === inst));
					inst = !props;
					break a;
				default: inst = !1;
			}
			if (inst) return null;
			if (stateNode && "function" !== typeof stateNode) throw Error(formatProdErrorMessage(231, registrationName, typeof stateNode));
			return stateNode;
		}
		var canUseDOM = !("undefined" === typeof window || "undefined" === typeof window.document || "undefined" === typeof window.document.createElement), passiveBrowserEventsSupported = !1;
		if (canUseDOM) try {
			var options = {};
			Object.defineProperty(options, "passive", { get: function() {
				passiveBrowserEventsSupported = !0;
			} });
			window.addEventListener("test", options, options);
			window.removeEventListener("test", options, options);
		} catch (e) {
			passiveBrowserEventsSupported = !1;
		}
		var root = null, startText = null, fallbackText = null;
		function getData() {
			if (fallbackText) return fallbackText;
			var start, startValue = startText, startLength = startValue.length, end, endValue = "value" in root ? root.value : root.textContent, endLength = endValue.length;
			for (start = 0; start < startLength && startValue[start] === endValue[start]; start++);
			var minEnd = startLength - start;
			for (end = 1; end <= minEnd && startValue[startLength - end] === endValue[endLength - end]; end++);
			return fallbackText = endValue.slice(start, 1 < end ? 1 - end : void 0);
		}
		function getEventCharCode(nativeEvent) {
			var keyCode = nativeEvent.keyCode;
			"charCode" in nativeEvent ? (nativeEvent = nativeEvent.charCode, 0 === nativeEvent && 13 === keyCode && (nativeEvent = 13)) : nativeEvent = keyCode;
			10 === nativeEvent && (nativeEvent = 13);
			return 32 <= nativeEvent || 13 === nativeEvent ? nativeEvent : 0;
		}
		function functionThatReturnsTrue() {
			return !0;
		}
		function functionThatReturnsFalse() {
			return !1;
		}
		function createSyntheticEvent(Interface) {
			function SyntheticBaseEvent(reactName, reactEventType, targetInst, nativeEvent, nativeEventTarget) {
				this._reactName = reactName;
				this._targetInst = targetInst;
				this.type = reactEventType;
				this.nativeEvent = nativeEvent;
				this.target = nativeEventTarget;
				this.currentTarget = null;
				for (var propName in Interface) Interface.hasOwnProperty(propName) && (reactName = Interface[propName], this[propName] = reactName ? reactName(nativeEvent) : nativeEvent[propName]);
				this.isDefaultPrevented = (null != nativeEvent.defaultPrevented ? nativeEvent.defaultPrevented : !1 === nativeEvent.returnValue) ? functionThatReturnsTrue : functionThatReturnsFalse;
				this.isPropagationStopped = functionThatReturnsFalse;
				return this;
			}
			assign(SyntheticBaseEvent.prototype, {
				preventDefault: function() {
					this.defaultPrevented = !0;
					var event = this.nativeEvent;
					event && (event.preventDefault ? event.preventDefault() : "unknown" !== typeof event.returnValue && (event.returnValue = !1), this.isDefaultPrevented = functionThatReturnsTrue);
				},
				stopPropagation: function() {
					var event = this.nativeEvent;
					event && (event.stopPropagation ? event.stopPropagation() : "unknown" !== typeof event.cancelBubble && (event.cancelBubble = !0), this.isPropagationStopped = functionThatReturnsTrue);
				},
				persist: function() {},
				isPersistent: functionThatReturnsTrue
			});
			return SyntheticBaseEvent;
		}
		var EventInterface = {
			eventPhase: 0,
			bubbles: 0,
			cancelable: 0,
			timeStamp: function(event) {
				return event.timeStamp || Date.now();
			},
			defaultPrevented: 0,
			isTrusted: 0
		}, SyntheticEvent = createSyntheticEvent(EventInterface), UIEventInterface = assign({}, EventInterface, {
			view: 0,
			detail: 0
		}), SyntheticUIEvent = createSyntheticEvent(UIEventInterface), lastMovementX, lastMovementY, lastMouseEvent, MouseEventInterface = assign({}, UIEventInterface, {
			screenX: 0,
			screenY: 0,
			clientX: 0,
			clientY: 0,
			pageX: 0,
			pageY: 0,
			ctrlKey: 0,
			shiftKey: 0,
			altKey: 0,
			metaKey: 0,
			getModifierState: getEventModifierState,
			button: 0,
			buttons: 0,
			relatedTarget: function(event) {
				return void 0 === event.relatedTarget ? event.fromElement === event.srcElement ? event.toElement : event.fromElement : event.relatedTarget;
			},
			movementX: function(event) {
				if ("movementX" in event) return event.movementX;
				event !== lastMouseEvent && (lastMouseEvent && "mousemove" === event.type ? (lastMovementX = event.screenX - lastMouseEvent.screenX, lastMovementY = event.screenY - lastMouseEvent.screenY) : lastMovementY = lastMovementX = 0, lastMouseEvent = event);
				return lastMovementX;
			},
			movementY: function(event) {
				return "movementY" in event ? event.movementY : lastMovementY;
			}
		}), SyntheticMouseEvent = createSyntheticEvent(MouseEventInterface), SyntheticDragEvent = createSyntheticEvent(assign({}, MouseEventInterface, { dataTransfer: 0 })), SyntheticFocusEvent = createSyntheticEvent(assign({}, UIEventInterface, { relatedTarget: 0 })), SyntheticAnimationEvent = createSyntheticEvent(assign({}, EventInterface, {
			animationName: 0,
			elapsedTime: 0,
			pseudoElement: 0
		})), SyntheticClipboardEvent = createSyntheticEvent(assign({}, EventInterface, { clipboardData: function(event) {
			return "clipboardData" in event ? event.clipboardData : window.clipboardData;
		} })), SyntheticCompositionEvent = createSyntheticEvent(assign({}, EventInterface, { data: 0 })), normalizeKey = {
			Esc: "Escape",
			Spacebar: " ",
			Left: "ArrowLeft",
			Up: "ArrowUp",
			Right: "ArrowRight",
			Down: "ArrowDown",
			Del: "Delete",
			Win: "OS",
			Menu: "ContextMenu",
			Apps: "ContextMenu",
			Scroll: "ScrollLock",
			MozPrintableKey: "Unidentified"
		}, translateToKey = {
			8: "Backspace",
			9: "Tab",
			12: "Clear",
			13: "Enter",
			16: "Shift",
			17: "Control",
			18: "Alt",
			19: "Pause",
			20: "CapsLock",
			27: "Escape",
			32: " ",
			33: "PageUp",
			34: "PageDown",
			35: "End",
			36: "Home",
			37: "ArrowLeft",
			38: "ArrowUp",
			39: "ArrowRight",
			40: "ArrowDown",
			45: "Insert",
			46: "Delete",
			112: "F1",
			113: "F2",
			114: "F3",
			115: "F4",
			116: "F5",
			117: "F6",
			118: "F7",
			119: "F8",
			120: "F9",
			121: "F10",
			122: "F11",
			123: "F12",
			144: "NumLock",
			145: "ScrollLock",
			224: "Meta"
		}, modifierKeyToProp = {
			Alt: "altKey",
			Control: "ctrlKey",
			Meta: "metaKey",
			Shift: "shiftKey"
		};
		function modifierStateGetter(keyArg) {
			var nativeEvent = this.nativeEvent;
			return nativeEvent.getModifierState ? nativeEvent.getModifierState(keyArg) : (keyArg = modifierKeyToProp[keyArg]) ? !!nativeEvent[keyArg] : !1;
		}
		function getEventModifierState() {
			return modifierStateGetter;
		}
		var SyntheticKeyboardEvent = createSyntheticEvent(assign({}, UIEventInterface, {
			key: function(nativeEvent) {
				if (nativeEvent.key) {
					var key = normalizeKey[nativeEvent.key] || nativeEvent.key;
					if ("Unidentified" !== key) return key;
				}
				return "keypress" === nativeEvent.type ? (nativeEvent = getEventCharCode(nativeEvent), 13 === nativeEvent ? "Enter" : String.fromCharCode(nativeEvent)) : "keydown" === nativeEvent.type || "keyup" === nativeEvent.type ? translateToKey[nativeEvent.keyCode] || "Unidentified" : "";
			},
			code: 0,
			location: 0,
			ctrlKey: 0,
			shiftKey: 0,
			altKey: 0,
			metaKey: 0,
			repeat: 0,
			locale: 0,
			getModifierState: getEventModifierState,
			charCode: function(event) {
				return "keypress" === event.type ? getEventCharCode(event) : 0;
			},
			keyCode: function(event) {
				return "keydown" === event.type || "keyup" === event.type ? event.keyCode : 0;
			},
			which: function(event) {
				return "keypress" === event.type ? getEventCharCode(event) : "keydown" === event.type || "keyup" === event.type ? event.keyCode : 0;
			}
		})), SyntheticPointerEvent = createSyntheticEvent(assign({}, MouseEventInterface, {
			pointerId: 0,
			width: 0,
			height: 0,
			pressure: 0,
			tangentialPressure: 0,
			tiltX: 0,
			tiltY: 0,
			twist: 0,
			pointerType: 0,
			isPrimary: 0
		})), SyntheticTouchEvent = createSyntheticEvent(assign({}, UIEventInterface, {
			touches: 0,
			targetTouches: 0,
			changedTouches: 0,
			altKey: 0,
			metaKey: 0,
			ctrlKey: 0,
			shiftKey: 0,
			getModifierState: getEventModifierState
		})), SyntheticTransitionEvent = createSyntheticEvent(assign({}, EventInterface, {
			propertyName: 0,
			elapsedTime: 0,
			pseudoElement: 0
		})), SyntheticWheelEvent = createSyntheticEvent(assign({}, MouseEventInterface, {
			deltaX: function(event) {
				return "deltaX" in event ? event.deltaX : "wheelDeltaX" in event ? -event.wheelDeltaX : 0;
			},
			deltaY: function(event) {
				return "deltaY" in event ? event.deltaY : "wheelDeltaY" in event ? -event.wheelDeltaY : "wheelDelta" in event ? -event.wheelDelta : 0;
			},
			deltaZ: 0,
			deltaMode: 0
		})), SyntheticToggleEvent = createSyntheticEvent(assign({}, EventInterface, {
			newState: 0,
			oldState: 0
		})), END_KEYCODES = [
			9,
			13,
			27,
			32
		], canUseCompositionEvent = canUseDOM && "CompositionEvent" in window, documentMode = null;
		canUseDOM && "documentMode" in document && (documentMode = document.documentMode);
		var canUseTextInputEvent = canUseDOM && "TextEvent" in window && !documentMode, useFallbackCompositionData = canUseDOM && (!canUseCompositionEvent || documentMode && 8 < documentMode && 11 >= documentMode), SPACEBAR_CHAR = String.fromCharCode(32), hasSpaceKeypress = !1;
		function isFallbackCompositionEnd(domEventName, nativeEvent) {
			switch (domEventName) {
				case "keyup": return -1 !== END_KEYCODES.indexOf(nativeEvent.keyCode);
				case "keydown": return 229 !== nativeEvent.keyCode;
				case "keypress":
				case "mousedown":
				case "focusout": return !0;
				default: return !1;
			}
		}
		function getDataFromCustomEvent(nativeEvent) {
			nativeEvent = nativeEvent.detail;
			return "object" === typeof nativeEvent && "data" in nativeEvent ? nativeEvent.data : null;
		}
		var isComposing = !1;
		function getNativeBeforeInputChars(domEventName, nativeEvent) {
			switch (domEventName) {
				case "compositionend": return getDataFromCustomEvent(nativeEvent);
				case "keypress":
					if (32 !== nativeEvent.which) return null;
					hasSpaceKeypress = !0;
					return SPACEBAR_CHAR;
				case "textInput": return domEventName = nativeEvent.data, domEventName === SPACEBAR_CHAR && hasSpaceKeypress ? null : domEventName;
				default: return null;
			}
		}
		function getFallbackBeforeInputChars(domEventName, nativeEvent) {
			if (isComposing) return "compositionend" === domEventName || !canUseCompositionEvent && isFallbackCompositionEnd(domEventName, nativeEvent) ? (domEventName = getData(), fallbackText = startText = root = null, isComposing = !1, domEventName) : null;
			switch (domEventName) {
				case "paste": return null;
				case "keypress":
					if (!(nativeEvent.ctrlKey || nativeEvent.altKey || nativeEvent.metaKey) || nativeEvent.ctrlKey && nativeEvent.altKey) {
						if (nativeEvent.char && 1 < nativeEvent.char.length) return nativeEvent.char;
						if (nativeEvent.which) return String.fromCharCode(nativeEvent.which);
					}
					return null;
				case "compositionend": return useFallbackCompositionData && "ko" !== nativeEvent.locale ? null : nativeEvent.data;
				default: return null;
			}
		}
		var supportedInputTypes = {
			color: !0,
			date: !0,
			datetime: !0,
			"datetime-local": !0,
			email: !0,
			month: !0,
			number: !0,
			password: !0,
			range: !0,
			search: !0,
			tel: !0,
			text: !0,
			time: !0,
			url: !0,
			week: !0
		};
		function isTextInputElement(elem) {
			var nodeName = elem && elem.nodeName && elem.nodeName.toLowerCase();
			return "input" === nodeName ? !!supportedInputTypes[elem.type] : "textarea" === nodeName ? !0 : !1;
		}
		function createAndAccumulateChangeEvent(dispatchQueue, inst, nativeEvent, target) {
			restoreTarget ? restoreQueue ? restoreQueue.push(target) : restoreQueue = [target] : restoreTarget = target;
			inst = accumulateTwoPhaseListeners(inst, "onChange");
			0 < inst.length && (nativeEvent = new SyntheticEvent("onChange", "change", null, nativeEvent, target), dispatchQueue.push({
				event: nativeEvent,
				listeners: inst
			}));
		}
		var activeElement$1 = null, activeElementInst$1 = null;
		function runEventInBatch(dispatchQueue) {
			processDispatchQueue(dispatchQueue, 0);
		}
		function getInstIfValueChanged(targetInst) {
			if (updateValueIfChanged(getNodeFromInstance(targetInst))) return targetInst;
		}
		function getTargetInstForChangeEvent(domEventName, targetInst) {
			if ("change" === domEventName) return targetInst;
		}
		var isInputEventSupported = !1;
		if (canUseDOM) {
			var JSCompiler_inline_result$jscomp$286;
			if (canUseDOM) {
				var isSupported$jscomp$inline_427 = "oninput" in document;
				if (!isSupported$jscomp$inline_427) {
					var element$jscomp$inline_428 = document.createElement("div");
					element$jscomp$inline_428.setAttribute("oninput", "return;");
					isSupported$jscomp$inline_427 = "function" === typeof element$jscomp$inline_428.oninput;
				}
				JSCompiler_inline_result$jscomp$286 = isSupported$jscomp$inline_427;
			} else JSCompiler_inline_result$jscomp$286 = !1;
			isInputEventSupported = JSCompiler_inline_result$jscomp$286 && (!document.documentMode || 9 < document.documentMode);
		}
		function stopWatchingForValueChange() {
			activeElement$1 && (activeElement$1.detachEvent("onpropertychange", handlePropertyChange), activeElementInst$1 = activeElement$1 = null);
		}
		function handlePropertyChange(nativeEvent) {
			if ("value" === nativeEvent.propertyName && getInstIfValueChanged(activeElementInst$1)) {
				var dispatchQueue = [];
				createAndAccumulateChangeEvent(dispatchQueue, activeElementInst$1, nativeEvent, getEventTarget(nativeEvent));
				batchedUpdates$1(runEventInBatch, dispatchQueue);
			}
		}
		function handleEventsForInputEventPolyfill(domEventName, target, targetInst) {
			"focusin" === domEventName ? (stopWatchingForValueChange(), activeElement$1 = target, activeElementInst$1 = targetInst, activeElement$1.attachEvent("onpropertychange", handlePropertyChange)) : "focusout" === domEventName && stopWatchingForValueChange();
		}
		function getTargetInstForInputEventPolyfill(domEventName) {
			if ("selectionchange" === domEventName || "keyup" === domEventName || "keydown" === domEventName) return getInstIfValueChanged(activeElementInst$1);
		}
		function getTargetInstForClickEvent(domEventName, targetInst) {
			if ("click" === domEventName) return getInstIfValueChanged(targetInst);
		}
		function getTargetInstForInputOrChangeEvent(domEventName, targetInst) {
			if ("input" === domEventName || "change" === domEventName) return getInstIfValueChanged(targetInst);
		}
		function is(x, y) {
			return x === y && (0 !== x || 1 / x === 1 / y) || x !== x && y !== y;
		}
		var objectIs = "function" === typeof Object.is ? Object.is : is;
		function shallowEqual(objA, objB) {
			if (objectIs(objA, objB)) return !0;
			if ("object" !== typeof objA || null === objA || "object" !== typeof objB || null === objB) return !1;
			var keysA = Object.keys(objA), keysB = Object.keys(objB);
			if (keysA.length !== keysB.length) return !1;
			for (keysB = 0; keysB < keysA.length; keysB++) {
				var currentKey = keysA[keysB];
				if (!hasOwnProperty.call(objB, currentKey) || !objectIs(objA[currentKey], objB[currentKey])) return !1;
			}
			return !0;
		}
		function getLeafNode(node) {
			for (; node && node.firstChild;) node = node.firstChild;
			return node;
		}
		function getNodeForCharacterOffset(root$1, offset) {
			var node = getLeafNode(root$1);
			root$1 = 0;
			for (var nodeEnd; node;) {
				if (3 === node.nodeType) {
					nodeEnd = root$1 + node.textContent.length;
					if (root$1 <= offset && nodeEnd >= offset) return {
						node,
						offset: offset - root$1
					};
					root$1 = nodeEnd;
				}
				a: {
					for (; node;) {
						if (node.nextSibling) {
							node = node.nextSibling;
							break a;
						}
						node = node.parentNode;
					}
					node = void 0;
				}
				node = getLeafNode(node);
			}
		}
		function containsNode(outerNode, innerNode) {
			return outerNode && innerNode ? outerNode === innerNode ? !0 : outerNode && 3 === outerNode.nodeType ? !1 : innerNode && 3 === innerNode.nodeType ? containsNode(outerNode, innerNode.parentNode) : "contains" in outerNode ? outerNode.contains(innerNode) : outerNode.compareDocumentPosition ? !!(outerNode.compareDocumentPosition(innerNode) & 16) : !1 : !1;
		}
		function getActiveElementDeep(containerInfo) {
			containerInfo = null != containerInfo && null != containerInfo.ownerDocument && null != containerInfo.ownerDocument.defaultView ? containerInfo.ownerDocument.defaultView : window;
			for (var element = getActiveElement(containerInfo.document); element instanceof containerInfo.HTMLIFrameElement;) {
				try {
					var JSCompiler_inline_result = "string" === typeof element.contentWindow.location.href;
				} catch (err) {
					JSCompiler_inline_result = !1;
				}
				if (JSCompiler_inline_result) containerInfo = element.contentWindow;
				else break;
				element = getActiveElement(containerInfo.document);
			}
			return element;
		}
		function hasSelectionCapabilities(elem) {
			var nodeName = elem && elem.nodeName && elem.nodeName.toLowerCase();
			return nodeName && ("input" === nodeName && ("text" === elem.type || "search" === elem.type || "tel" === elem.type || "url" === elem.type || "password" === elem.type) || "textarea" === nodeName || "true" === elem.contentEditable);
		}
		var skipSelectionChangeEvent = canUseDOM && "documentMode" in document && 11 >= document.documentMode, activeElement = null, activeElementInst = null, lastSelection = null, mouseDown = !1;
		function constructSelectEvent(dispatchQueue, nativeEvent, nativeEventTarget) {
			var doc = nativeEventTarget.window === nativeEventTarget ? nativeEventTarget.document : 9 === nativeEventTarget.nodeType ? nativeEventTarget : nativeEventTarget.ownerDocument;
			mouseDown || null == activeElement || activeElement !== getActiveElement(doc) || (doc = activeElement, "selectionStart" in doc && hasSelectionCapabilities(doc) ? doc = {
				start: doc.selectionStart,
				end: doc.selectionEnd
			} : (doc = (doc.ownerDocument && doc.ownerDocument.defaultView || window).getSelection(), doc = {
				anchorNode: doc.anchorNode,
				anchorOffset: doc.anchorOffset,
				focusNode: doc.focusNode,
				focusOffset: doc.focusOffset
			}), lastSelection && shallowEqual(lastSelection, doc) || (lastSelection = doc, doc = accumulateTwoPhaseListeners(activeElementInst, "onSelect"), 0 < doc.length && (nativeEvent = new SyntheticEvent("onSelect", "select", null, nativeEvent, nativeEventTarget), dispatchQueue.push({
				event: nativeEvent,
				listeners: doc
			}), nativeEvent.target = activeElement)));
		}
		function makePrefixMap(styleProp, eventName) {
			var prefixes = {};
			prefixes[styleProp.toLowerCase()] = eventName.toLowerCase();
			prefixes["Webkit" + styleProp] = "webkit" + eventName;
			prefixes["Moz" + styleProp] = "moz" + eventName;
			return prefixes;
		}
		var vendorPrefixes = {
			animationend: makePrefixMap("Animation", "AnimationEnd"),
			animationiteration: makePrefixMap("Animation", "AnimationIteration"),
			animationstart: makePrefixMap("Animation", "AnimationStart"),
			transitionrun: makePrefixMap("Transition", "TransitionRun"),
			transitionstart: makePrefixMap("Transition", "TransitionStart"),
			transitioncancel: makePrefixMap("Transition", "TransitionCancel"),
			transitionend: makePrefixMap("Transition", "TransitionEnd")
		}, prefixedEventNames = {}, style = {};
		canUseDOM && (style = document.createElement("div").style, "AnimationEvent" in window || (delete vendorPrefixes.animationend.animation, delete vendorPrefixes.animationiteration.animation, delete vendorPrefixes.animationstart.animation), "TransitionEvent" in window || delete vendorPrefixes.transitionend.transition);
		function getVendorPrefixedEventName(eventName) {
			if (prefixedEventNames[eventName]) return prefixedEventNames[eventName];
			if (!vendorPrefixes[eventName]) return eventName;
			var prefixMap = vendorPrefixes[eventName], styleProp;
			for (styleProp in prefixMap) if (prefixMap.hasOwnProperty(styleProp) && styleProp in style) return prefixedEventNames[eventName] = prefixMap[styleProp];
			return eventName;
		}
		var ANIMATION_END = getVendorPrefixedEventName("animationend"), ANIMATION_ITERATION = getVendorPrefixedEventName("animationiteration"), ANIMATION_START = getVendorPrefixedEventName("animationstart"), TRANSITION_RUN = getVendorPrefixedEventName("transitionrun"), TRANSITION_START = getVendorPrefixedEventName("transitionstart"), TRANSITION_CANCEL = getVendorPrefixedEventName("transitioncancel"), TRANSITION_END = getVendorPrefixedEventName("transitionend"), topLevelEventsToReactNames = /* @__PURE__ */ new Map(), simpleEventPluginEvents = "abort auxClick beforeToggle cancel canPlay canPlayThrough click close contextMenu copy cut drag dragEnd dragEnter dragExit dragLeave dragOver dragStart drop durationChange emptied encrypted ended error gotPointerCapture input invalid keyDown keyPress keyUp load loadedData loadedMetadata loadStart lostPointerCapture mouseDown mouseMove mouseOut mouseOver mouseUp paste pause play playing pointerCancel pointerDown pointerMove pointerOut pointerOver pointerUp progress rateChange reset resize seeked seeking stalled submit suspend timeUpdate touchCancel touchEnd touchStart volumeChange scroll toggle touchMove waiting wheel".split(" ");
		simpleEventPluginEvents.push("scrollEnd");
		function registerSimpleEvent(domEventName, reactName) {
			topLevelEventsToReactNames.set(domEventName, reactName);
			registerTwoPhaseEvent(reactName, [domEventName]);
		}
		var reportGlobalError = "function" === typeof reportError ? reportError : function(error) {
			if ("object" === typeof window && "function" === typeof window.ErrorEvent) {
				var event = new window.ErrorEvent("error", {
					bubbles: !0,
					cancelable: !0,
					message: "object" === typeof error && null !== error && "string" === typeof error.message ? String(error.message) : String(error),
					error
				});
				if (!window.dispatchEvent(event)) return;
			} else if ("object" === typeof process && "function" === typeof process.emit) {
				process.emit("uncaughtException", error);
				return;
			}
			console.error(error);
		}, concurrentQueues = [], concurrentQueuesIndex = 0, concurrentlyUpdatedLanes = 0;
		function finishQueueingConcurrentUpdates() {
			for (var endIndex = concurrentQueuesIndex, i = concurrentlyUpdatedLanes = concurrentQueuesIndex = 0; i < endIndex;) {
				var fiber = concurrentQueues[i];
				concurrentQueues[i++] = null;
				var queue = concurrentQueues[i];
				concurrentQueues[i++] = null;
				var update = concurrentQueues[i];
				concurrentQueues[i++] = null;
				var lane = concurrentQueues[i];
				concurrentQueues[i++] = null;
				if (null !== queue && null !== update) {
					var pending = queue.pending;
					null === pending ? update.next = update : (update.next = pending.next, pending.next = update);
					queue.pending = update;
				}
				0 !== lane && markUpdateLaneFromFiberToRoot(fiber, update, lane);
			}
		}
		function enqueueUpdate$1(fiber, queue, update, lane) {
			concurrentQueues[concurrentQueuesIndex++] = fiber;
			concurrentQueues[concurrentQueuesIndex++] = queue;
			concurrentQueues[concurrentQueuesIndex++] = update;
			concurrentQueues[concurrentQueuesIndex++] = lane;
			concurrentlyUpdatedLanes |= lane;
			fiber.lanes |= lane;
			fiber = fiber.alternate;
			null !== fiber && (fiber.lanes |= lane);
		}
		function enqueueConcurrentHookUpdate(fiber, queue, update, lane) {
			enqueueUpdate$1(fiber, queue, update, lane);
			return getRootForUpdatedFiber(fiber);
		}
		function enqueueConcurrentRenderForLane(fiber, lane) {
			enqueueUpdate$1(fiber, null, null, lane);
			return getRootForUpdatedFiber(fiber);
		}
		function markUpdateLaneFromFiberToRoot(sourceFiber, update, lane) {
			sourceFiber.lanes |= lane;
			var alternate = sourceFiber.alternate;
			null !== alternate && (alternate.lanes |= lane);
			for (var isHidden = !1, parent = sourceFiber.return; null !== parent;) parent.childLanes |= lane, alternate = parent.alternate, null !== alternate && (alternate.childLanes |= lane), 22 === parent.tag && (sourceFiber = parent.stateNode, null === sourceFiber || sourceFiber._visibility & 1 || (isHidden = !0)), sourceFiber = parent, parent = parent.return;
			return 3 === sourceFiber.tag ? (parent = sourceFiber.stateNode, isHidden && null !== update && (isHidden = 31 - clz32(lane), sourceFiber = parent.hiddenUpdates, alternate = sourceFiber[isHidden], null === alternate ? sourceFiber[isHidden] = [update] : alternate.push(update), update.lane = lane | 536870912), parent) : null;
		}
		function getRootForUpdatedFiber(sourceFiber) {
			if (50 < nestedUpdateCount) throw nestedUpdateCount = 0, rootWithNestedUpdates = null, Error(formatProdErrorMessage(185));
			for (var parent = sourceFiber.return; null !== parent;) sourceFiber = parent, parent = sourceFiber.return;
			return 3 === sourceFiber.tag ? sourceFiber.stateNode : null;
		}
		var emptyContextObject = {};
		function FiberNode(tag, pendingProps, key, mode) {
			this.tag = tag;
			this.key = key;
			this.sibling = this.child = this.return = this.stateNode = this.type = this.elementType = null;
			this.index = 0;
			this.refCleanup = this.ref = null;
			this.pendingProps = pendingProps;
			this.dependencies = this.memoizedState = this.updateQueue = this.memoizedProps = null;
			this.mode = mode;
			this.subtreeFlags = this.flags = 0;
			this.deletions = null;
			this.childLanes = this.lanes = 0;
			this.alternate = null;
		}
		function createFiberImplClass(tag, pendingProps, key, mode) {
			return new FiberNode(tag, pendingProps, key, mode);
		}
		function shouldConstruct(Component$1) {
			Component$1 = Component$1.prototype;
			return !(!Component$1 || !Component$1.isReactComponent);
		}
		function createWorkInProgress(current, pendingProps) {
			var workInProgress$1 = current.alternate;
			null === workInProgress$1 ? (workInProgress$1 = createFiberImplClass(current.tag, pendingProps, current.key, current.mode), workInProgress$1.elementType = current.elementType, workInProgress$1.type = current.type, workInProgress$1.stateNode = current.stateNode, workInProgress$1.alternate = current, current.alternate = workInProgress$1) : (workInProgress$1.pendingProps = pendingProps, workInProgress$1.type = current.type, workInProgress$1.flags = 0, workInProgress$1.subtreeFlags = 0, workInProgress$1.deletions = null);
			workInProgress$1.flags = current.flags & 65011712;
			workInProgress$1.childLanes = current.childLanes;
			workInProgress$1.lanes = current.lanes;
			workInProgress$1.child = current.child;
			workInProgress$1.memoizedProps = current.memoizedProps;
			workInProgress$1.memoizedState = current.memoizedState;
			workInProgress$1.updateQueue = current.updateQueue;
			pendingProps = current.dependencies;
			workInProgress$1.dependencies = null === pendingProps ? null : {
				lanes: pendingProps.lanes,
				firstContext: pendingProps.firstContext
			};
			workInProgress$1.sibling = current.sibling;
			workInProgress$1.index = current.index;
			workInProgress$1.ref = current.ref;
			workInProgress$1.refCleanup = current.refCleanup;
			return workInProgress$1;
		}
		function resetWorkInProgress(workInProgress$1, renderLanes$1) {
			workInProgress$1.flags &= 65011714;
			var current = workInProgress$1.alternate;
			null === current ? (workInProgress$1.childLanes = 0, workInProgress$1.lanes = renderLanes$1, workInProgress$1.child = null, workInProgress$1.subtreeFlags = 0, workInProgress$1.memoizedProps = null, workInProgress$1.memoizedState = null, workInProgress$1.updateQueue = null, workInProgress$1.dependencies = null, workInProgress$1.stateNode = null) : (workInProgress$1.childLanes = current.childLanes, workInProgress$1.lanes = current.lanes, workInProgress$1.child = current.child, workInProgress$1.subtreeFlags = 0, workInProgress$1.deletions = null, workInProgress$1.memoizedProps = current.memoizedProps, workInProgress$1.memoizedState = current.memoizedState, workInProgress$1.updateQueue = current.updateQueue, workInProgress$1.type = current.type, renderLanes$1 = current.dependencies, workInProgress$1.dependencies = null === renderLanes$1 ? null : {
				lanes: renderLanes$1.lanes,
				firstContext: renderLanes$1.firstContext
			});
			return workInProgress$1;
		}
		function createFiberFromTypeAndProps(type, key, pendingProps, owner, mode, lanes) {
			var fiberTag = 0;
			owner = type;
			if ("function" === typeof type) shouldConstruct(type) && (fiberTag = 1);
			else if ("string" === typeof type) fiberTag = isHostHoistableType(type, pendingProps, contextStackCursor.current) ? 26 : "html" === type || "head" === type || "body" === type ? 27 : 5;
			else a: switch (type) {
				case REACT_ACTIVITY_TYPE: return type = createFiberImplClass(31, pendingProps, key, mode), type.elementType = REACT_ACTIVITY_TYPE, type.lanes = lanes, type;
				case REACT_FRAGMENT_TYPE: return createFiberFromFragment(pendingProps.children, mode, lanes, key);
				case REACT_STRICT_MODE_TYPE:
					fiberTag = 8;
					mode |= 24;
					break;
				case REACT_PROFILER_TYPE: return type = createFiberImplClass(12, pendingProps, key, mode | 2), type.elementType = REACT_PROFILER_TYPE, type.lanes = lanes, type;
				case REACT_SUSPENSE_TYPE: return type = createFiberImplClass(13, pendingProps, key, mode), type.elementType = REACT_SUSPENSE_TYPE, type.lanes = lanes, type;
				case REACT_SUSPENSE_LIST_TYPE: return type = createFiberImplClass(19, pendingProps, key, mode), type.elementType = REACT_SUSPENSE_LIST_TYPE, type.lanes = lanes, type;
				default:
					if ("object" === typeof type && null !== type) switch (type.$$typeof) {
						case REACT_CONTEXT_TYPE:
							fiberTag = 10;
							break a;
						case REACT_CONSUMER_TYPE:
							fiberTag = 9;
							break a;
						case REACT_FORWARD_REF_TYPE:
							fiberTag = 11;
							break a;
						case REACT_MEMO_TYPE:
							fiberTag = 14;
							break a;
						case REACT_LAZY_TYPE$1:
							fiberTag = 16;
							owner = null;
							break a;
					}
					fiberTag = 29;
					pendingProps = Error(formatProdErrorMessage(130, null === type ? "null" : typeof type, ""));
					owner = null;
			}
			key = createFiberImplClass(fiberTag, pendingProps, key, mode);
			key.elementType = type;
			key.type = owner;
			key.lanes = lanes;
			return key;
		}
		function createFiberFromFragment(elements, mode, lanes, key) {
			elements = createFiberImplClass(7, elements, key, mode);
			elements.lanes = lanes;
			return elements;
		}
		function createFiberFromText(content, mode, lanes) {
			content = createFiberImplClass(6, content, null, mode);
			content.lanes = lanes;
			return content;
		}
		function createFiberFromDehydratedFragment(dehydratedNode) {
			var fiber = createFiberImplClass(18, null, null, 0);
			fiber.stateNode = dehydratedNode;
			return fiber;
		}
		function createFiberFromPortal(portal, mode, lanes) {
			mode = createFiberImplClass(4, null !== portal.children ? portal.children : [], portal.key, mode);
			mode.lanes = lanes;
			mode.stateNode = {
				containerInfo: portal.containerInfo,
				pendingChildren: null,
				implementation: portal.implementation
			};
			return mode;
		}
		var CapturedStacks = /* @__PURE__ */ new WeakMap();
		function createCapturedValueAtFiber(value, source) {
			if ("object" === typeof value && null !== value) {
				var existing = CapturedStacks.get(value);
				if (void 0 !== existing) return existing;
				source = {
					value,
					source,
					stack: getStackByFiberInDevAndProd(source)
				};
				CapturedStacks.set(value, source);
				return source;
			}
			return {
				value,
				source,
				stack: getStackByFiberInDevAndProd(source)
			};
		}
		var forkStack = [], forkStackIndex = 0, treeForkProvider = null, treeForkCount = 0, idStack = [], idStackIndex = 0, treeContextProvider = null, treeContextId = 1, treeContextOverflow = "";
		function pushTreeFork(workInProgress$1, totalChildren) {
			forkStack[forkStackIndex++] = treeForkCount;
			forkStack[forkStackIndex++] = treeForkProvider;
			treeForkProvider = workInProgress$1;
			treeForkCount = totalChildren;
		}
		function pushTreeId(workInProgress$1, totalChildren, index$1) {
			idStack[idStackIndex++] = treeContextId;
			idStack[idStackIndex++] = treeContextOverflow;
			idStack[idStackIndex++] = treeContextProvider;
			treeContextProvider = workInProgress$1;
			var baseIdWithLeadingBit = treeContextId;
			workInProgress$1 = treeContextOverflow;
			var baseLength = 32 - clz32(baseIdWithLeadingBit) - 1;
			baseIdWithLeadingBit &= ~(1 << baseLength);
			index$1 += 1;
			var length = 32 - clz32(totalChildren) + baseLength;
			if (30 < length) {
				var numberOfOverflowBits = baseLength - baseLength % 5;
				length = (baseIdWithLeadingBit & (1 << numberOfOverflowBits) - 1).toString(32);
				baseIdWithLeadingBit >>= numberOfOverflowBits;
				baseLength -= numberOfOverflowBits;
				treeContextId = 1 << 32 - clz32(totalChildren) + baseLength | index$1 << baseLength | baseIdWithLeadingBit;
				treeContextOverflow = length + workInProgress$1;
			} else treeContextId = 1 << length | index$1 << baseLength | baseIdWithLeadingBit, treeContextOverflow = workInProgress$1;
		}
		function pushMaterializedTreeId(workInProgress$1) {
			null !== workInProgress$1.return && (pushTreeFork(workInProgress$1, 1), pushTreeId(workInProgress$1, 1, 0));
		}
		function popTreeContext(workInProgress$1) {
			for (; workInProgress$1 === treeForkProvider;) treeForkProvider = forkStack[--forkStackIndex], forkStack[forkStackIndex] = null, treeForkCount = forkStack[--forkStackIndex], forkStack[forkStackIndex] = null;
			for (; workInProgress$1 === treeContextProvider;) treeContextProvider = idStack[--idStackIndex], idStack[idStackIndex] = null, treeContextOverflow = idStack[--idStackIndex], idStack[idStackIndex] = null, treeContextId = idStack[--idStackIndex], idStack[idStackIndex] = null;
		}
		function restoreSuspendedTreeContext(workInProgress$1, suspendedContext) {
			idStack[idStackIndex++] = treeContextId;
			idStack[idStackIndex++] = treeContextOverflow;
			idStack[idStackIndex++] = treeContextProvider;
			treeContextId = suspendedContext.id;
			treeContextOverflow = suspendedContext.overflow;
			treeContextProvider = workInProgress$1;
		}
		var hydrationParentFiber = null, nextHydratableInstance = null, isHydrating = !1, hydrationErrors = null, rootOrSingletonContext = !1, HydrationMismatchException = Error(formatProdErrorMessage(519));
		function throwOnHydrationMismatch(fiber) {
			queueHydrationError(createCapturedValueAtFiber(Error(formatProdErrorMessage(418, 1 < arguments.length && void 0 !== arguments[1] && arguments[1] ? "text" : "HTML", "")), fiber));
			throw HydrationMismatchException;
		}
		function prepareToHydrateHostInstance(fiber) {
			var instance = fiber.stateNode, type = fiber.type, props = fiber.memoizedProps;
			instance[internalInstanceKey] = fiber;
			instance[internalPropsKey] = props;
			switch (type) {
				case "dialog":
					listenToNonDelegatedEvent("cancel", instance);
					listenToNonDelegatedEvent("close", instance);
					break;
				case "iframe":
				case "object":
				case "embed":
					listenToNonDelegatedEvent("load", instance);
					break;
				case "video":
				case "audio":
					for (type = 0; type < mediaEventTypes.length; type++) listenToNonDelegatedEvent(mediaEventTypes[type], instance);
					break;
				case "source":
					listenToNonDelegatedEvent("error", instance);
					break;
				case "img":
				case "image":
				case "link":
					listenToNonDelegatedEvent("error", instance);
					listenToNonDelegatedEvent("load", instance);
					break;
				case "details":
					listenToNonDelegatedEvent("toggle", instance);
					break;
				case "input":
					listenToNonDelegatedEvent("invalid", instance);
					initInput(instance, props.value, props.defaultValue, props.checked, props.defaultChecked, props.type, props.name, !0);
					break;
				case "select":
					listenToNonDelegatedEvent("invalid", instance);
					break;
				case "textarea": listenToNonDelegatedEvent("invalid", instance), initTextarea(instance, props.value, props.defaultValue, props.children);
			}
			type = props.children;
			"string" !== typeof type && "number" !== typeof type && "bigint" !== typeof type || instance.textContent === "" + type || !0 === props.suppressHydrationWarning || checkForUnmatchedText(instance.textContent, type) ? (null != props.popover && (listenToNonDelegatedEvent("beforetoggle", instance), listenToNonDelegatedEvent("toggle", instance)), null != props.onScroll && listenToNonDelegatedEvent("scroll", instance), null != props.onScrollEnd && listenToNonDelegatedEvent("scrollend", instance), null != props.onClick && (instance.onclick = noop$1), instance = !0) : instance = !1;
			instance || throwOnHydrationMismatch(fiber, !0);
		}
		function popToNextHostParent(fiber) {
			for (hydrationParentFiber = fiber.return; hydrationParentFiber;) switch (hydrationParentFiber.tag) {
				case 5:
				case 31:
				case 13:
					rootOrSingletonContext = !1;
					return;
				case 27:
				case 3:
					rootOrSingletonContext = !0;
					return;
				default: hydrationParentFiber = hydrationParentFiber.return;
			}
		}
		function popHydrationState(fiber) {
			if (fiber !== hydrationParentFiber) return !1;
			if (!isHydrating) return popToNextHostParent(fiber), isHydrating = !0, !1;
			var tag = fiber.tag, JSCompiler_temp;
			if (JSCompiler_temp = 3 !== tag && 27 !== tag) {
				if (JSCompiler_temp = 5 === tag) JSCompiler_temp = fiber.type, JSCompiler_temp = !("form" !== JSCompiler_temp && "button" !== JSCompiler_temp) || shouldSetTextContent(fiber.type, fiber.memoizedProps);
				JSCompiler_temp = !JSCompiler_temp;
			}
			JSCompiler_temp && nextHydratableInstance && throwOnHydrationMismatch(fiber);
			popToNextHostParent(fiber);
			if (13 === tag) {
				fiber = fiber.memoizedState;
				fiber = null !== fiber ? fiber.dehydrated : null;
				if (!fiber) throw Error(formatProdErrorMessage(317));
				nextHydratableInstance = getNextHydratableInstanceAfterHydrationBoundary(fiber);
			} else if (31 === tag) {
				fiber = fiber.memoizedState;
				fiber = null !== fiber ? fiber.dehydrated : null;
				if (!fiber) throw Error(formatProdErrorMessage(317));
				nextHydratableInstance = getNextHydratableInstanceAfterHydrationBoundary(fiber);
			} else 27 === tag ? (tag = nextHydratableInstance, isSingletonScope(fiber.type) ? (fiber = previousHydratableOnEnteringScopedSingleton, previousHydratableOnEnteringScopedSingleton = null, nextHydratableInstance = fiber) : nextHydratableInstance = tag) : nextHydratableInstance = hydrationParentFiber ? getNextHydratable(fiber.stateNode.nextSibling) : null;
			return !0;
		}
		function resetHydrationState() {
			nextHydratableInstance = hydrationParentFiber = null;
			isHydrating = !1;
		}
		function upgradeHydrationErrorsToRecoverable() {
			var queuedErrors = hydrationErrors;
			null !== queuedErrors && (null === workInProgressRootRecoverableErrors ? workInProgressRootRecoverableErrors = queuedErrors : workInProgressRootRecoverableErrors.push.apply(workInProgressRootRecoverableErrors, queuedErrors), hydrationErrors = null);
			return queuedErrors;
		}
		function queueHydrationError(error) {
			null === hydrationErrors ? hydrationErrors = [error] : hydrationErrors.push(error);
		}
		var valueCursor = createCursor(null), currentlyRenderingFiber$1 = null, lastContextDependency = null;
		function pushProvider(providerFiber, context, nextValue) {
			push(valueCursor, context._currentValue);
			context._currentValue = nextValue;
		}
		function popProvider(context) {
			context._currentValue = valueCursor.current;
			pop(valueCursor);
		}
		function scheduleContextWorkOnParentPath(parent, renderLanes$1, propagationRoot) {
			for (; null !== parent;) {
				var alternate = parent.alternate;
				(parent.childLanes & renderLanes$1) !== renderLanes$1 ? (parent.childLanes |= renderLanes$1, null !== alternate && (alternate.childLanes |= renderLanes$1)) : null !== alternate && (alternate.childLanes & renderLanes$1) !== renderLanes$1 && (alternate.childLanes |= renderLanes$1);
				if (parent === propagationRoot) break;
				parent = parent.return;
			}
		}
		function propagateContextChanges(workInProgress$1, contexts, renderLanes$1, forcePropagateEntireTree) {
			var fiber = workInProgress$1.child;
			null !== fiber && (fiber.return = workInProgress$1);
			for (; null !== fiber;) {
				var list = fiber.dependencies;
				if (null !== list) {
					var nextFiber = fiber.child;
					list = list.firstContext;
					a: for (; null !== list;) {
						var dependency = list;
						list = fiber;
						for (var i = 0; i < contexts.length; i++) if (dependency.context === contexts[i]) {
							list.lanes |= renderLanes$1;
							dependency = list.alternate;
							null !== dependency && (dependency.lanes |= renderLanes$1);
							scheduleContextWorkOnParentPath(list.return, renderLanes$1, workInProgress$1);
							forcePropagateEntireTree || (nextFiber = null);
							break a;
						}
						list = dependency.next;
					}
				} else if (18 === fiber.tag) {
					nextFiber = fiber.return;
					if (null === nextFiber) throw Error(formatProdErrorMessage(341));
					nextFiber.lanes |= renderLanes$1;
					list = nextFiber.alternate;
					null !== list && (list.lanes |= renderLanes$1);
					scheduleContextWorkOnParentPath(nextFiber, renderLanes$1, workInProgress$1);
					nextFiber = null;
				} else nextFiber = fiber.child;
				if (null !== nextFiber) nextFiber.return = fiber;
				else for (nextFiber = fiber; null !== nextFiber;) {
					if (nextFiber === workInProgress$1) {
						nextFiber = null;
						break;
					}
					fiber = nextFiber.sibling;
					if (null !== fiber) {
						fiber.return = nextFiber.return;
						nextFiber = fiber;
						break;
					}
					nextFiber = nextFiber.return;
				}
				fiber = nextFiber;
			}
		}
		function propagateParentContextChanges(current, workInProgress$1, renderLanes$1, forcePropagateEntireTree) {
			current = null;
			for (var parent = workInProgress$1, isInsidePropagationBailout = !1; null !== parent;) {
				if (!isInsidePropagationBailout) {
					if (0 !== (parent.flags & 524288)) isInsidePropagationBailout = !0;
					else if (0 !== (parent.flags & 262144)) break;
				}
				if (10 === parent.tag) {
					var currentParent = parent.alternate;
					if (null === currentParent) throw Error(formatProdErrorMessage(387));
					currentParent = currentParent.memoizedProps;
					if (null !== currentParent) {
						var context = parent.type;
						objectIs(parent.pendingProps.value, currentParent.value) || (null !== current ? current.push(context) : current = [context]);
					}
				} else if (parent === hostTransitionProviderCursor.current) {
					currentParent = parent.alternate;
					if (null === currentParent) throw Error(formatProdErrorMessage(387));
					currentParent.memoizedState.memoizedState !== parent.memoizedState.memoizedState && (null !== current ? current.push(HostTransitionContext) : current = [HostTransitionContext]);
				}
				parent = parent.return;
			}
			null !== current && propagateContextChanges(workInProgress$1, current, renderLanes$1, forcePropagateEntireTree);
			workInProgress$1.flags |= 262144;
		}
		function checkIfContextChanged(currentDependencies) {
			for (currentDependencies = currentDependencies.firstContext; null !== currentDependencies;) {
				if (!objectIs(currentDependencies.context._currentValue, currentDependencies.memoizedValue)) return !0;
				currentDependencies = currentDependencies.next;
			}
			return !1;
		}
		function prepareToReadContext(workInProgress$1) {
			currentlyRenderingFiber$1 = workInProgress$1;
			lastContextDependency = null;
			workInProgress$1 = workInProgress$1.dependencies;
			null !== workInProgress$1 && (workInProgress$1.firstContext = null);
		}
		function readContext(context) {
			return readContextForConsumer(currentlyRenderingFiber$1, context);
		}
		function readContextDuringReconciliation(consumer, context) {
			null === currentlyRenderingFiber$1 && prepareToReadContext(consumer);
			return readContextForConsumer(consumer, context);
		}
		function readContextForConsumer(consumer, context) {
			var value = context._currentValue;
			context = {
				context,
				memoizedValue: value,
				next: null
			};
			if (null === lastContextDependency) {
				if (null === consumer) throw Error(formatProdErrorMessage(308));
				lastContextDependency = context;
				consumer.dependencies = {
					lanes: 0,
					firstContext: context
				};
				consumer.flags |= 524288;
			} else lastContextDependency = lastContextDependency.next = context;
			return value;
		}
		var AbortControllerLocal = "undefined" !== typeof AbortController ? AbortController : function() {
			var listeners = [], signal = this.signal = {
				aborted: !1,
				addEventListener: function(type, listener) {
					listeners.push(listener);
				}
			};
			this.abort = function() {
				signal.aborted = !0;
				listeners.forEach(function(listener) {
					return listener();
				});
			};
		}, scheduleCallback$2 = Scheduler.unstable_scheduleCallback, NormalPriority = Scheduler.unstable_NormalPriority, CacheContext = {
			$$typeof: REACT_CONTEXT_TYPE,
			Consumer: null,
			Provider: null,
			_currentValue: null,
			_currentValue2: null,
			_threadCount: 0
		};
		function createCache() {
			return {
				controller: new AbortControllerLocal(),
				data: /* @__PURE__ */ new Map(),
				refCount: 0
			};
		}
		function releaseCache(cache) {
			cache.refCount--;
			0 === cache.refCount && scheduleCallback$2(NormalPriority, function() {
				cache.controller.abort();
			});
		}
		var currentEntangledListeners = null, currentEntangledPendingCount = 0, currentEntangledLane = 0, currentEntangledActionThenable = null;
		function entangleAsyncAction(transition, thenable) {
			if (null === currentEntangledListeners) {
				var entangledListeners = currentEntangledListeners = [];
				currentEntangledPendingCount = 0;
				currentEntangledLane = requestTransitionLane();
				currentEntangledActionThenable = {
					status: "pending",
					value: void 0,
					then: function(resolve) {
						entangledListeners.push(resolve);
					}
				};
			}
			currentEntangledPendingCount++;
			thenable.then(pingEngtangledActionScope, pingEngtangledActionScope);
			return thenable;
		}
		function pingEngtangledActionScope() {
			if (0 === --currentEntangledPendingCount && null !== currentEntangledListeners) {
				null !== currentEntangledActionThenable && (currentEntangledActionThenable.status = "fulfilled");
				var listeners = currentEntangledListeners;
				currentEntangledListeners = null;
				currentEntangledLane = 0;
				currentEntangledActionThenable = null;
				for (var i = 0; i < listeners.length; i++) (0, listeners[i])();
			}
		}
		function chainThenableValue(thenable, result) {
			var listeners = [], thenableWithOverride = {
				status: "pending",
				value: null,
				reason: null,
				then: function(resolve) {
					listeners.push(resolve);
				}
			};
			thenable.then(function() {
				thenableWithOverride.status = "fulfilled";
				thenableWithOverride.value = result;
				for (var i = 0; i < listeners.length; i++) (0, listeners[i])(result);
			}, function(error) {
				thenableWithOverride.status = "rejected";
				thenableWithOverride.reason = error;
				for (error = 0; error < listeners.length; error++) (0, listeners[error])(void 0);
			});
			return thenableWithOverride;
		}
		var prevOnStartTransitionFinish = ReactSharedInternals.S;
		ReactSharedInternals.S = function(transition, returnValue) {
			globalMostRecentTransitionTime = now();
			"object" === typeof returnValue && null !== returnValue && "function" === typeof returnValue.then && entangleAsyncAction(transition, returnValue);
			null !== prevOnStartTransitionFinish && prevOnStartTransitionFinish(transition, returnValue);
		};
		var resumedCache = createCursor(null);
		function peekCacheFromPool() {
			var cacheResumedFromPreviousRender = resumedCache.current;
			return null !== cacheResumedFromPreviousRender ? cacheResumedFromPreviousRender : workInProgressRoot.pooledCache;
		}
		function pushTransition(offscreenWorkInProgress, prevCachePool) {
			null === prevCachePool ? push(resumedCache, resumedCache.current) : push(resumedCache, prevCachePool.pool);
		}
		function getSuspendedCache() {
			var cacheFromPool = peekCacheFromPool();
			return null === cacheFromPool ? null : {
				parent: CacheContext._currentValue,
				pool: cacheFromPool
			};
		}
		var SuspenseException = Error(formatProdErrorMessage(460)), SuspenseyCommitException = Error(formatProdErrorMessage(474)), SuspenseActionException = Error(formatProdErrorMessage(542)), noopSuspenseyCommitThenable = { then: function() {} };
		function isThenableResolved(thenable) {
			thenable = thenable.status;
			return "fulfilled" === thenable || "rejected" === thenable;
		}
		function trackUsedThenable(thenableState$2, thenable, index$1) {
			index$1 = thenableState$2[index$1];
			void 0 === index$1 ? thenableState$2.push(thenable) : index$1 !== thenable && (thenable.then(noop$1, noop$1), thenable = index$1);
			switch (thenable.status) {
				case "fulfilled": return thenable.value;
				case "rejected": throw thenableState$2 = thenable.reason, checkIfUseWrappedInAsyncCatch(thenableState$2), thenableState$2;
				default:
					if ("string" === typeof thenable.status) thenable.then(noop$1, noop$1);
					else {
						thenableState$2 = workInProgressRoot;
						if (null !== thenableState$2 && 100 < thenableState$2.shellSuspendCounter) throw Error(formatProdErrorMessage(482));
						thenableState$2 = thenable;
						thenableState$2.status = "pending";
						thenableState$2.then(function(fulfilledValue) {
							if ("pending" === thenable.status) {
								var fulfilledThenable = thenable;
								fulfilledThenable.status = "fulfilled";
								fulfilledThenable.value = fulfilledValue;
							}
						}, function(error) {
							if ("pending" === thenable.status) {
								var rejectedThenable = thenable;
								rejectedThenable.status = "rejected";
								rejectedThenable.reason = error;
							}
						});
					}
					switch (thenable.status) {
						case "fulfilled": return thenable.value;
						case "rejected": throw thenableState$2 = thenable.reason, checkIfUseWrappedInAsyncCatch(thenableState$2), thenableState$2;
					}
					suspendedThenable = thenable;
					throw SuspenseException;
			}
		}
		function resolveLazy(lazyType) {
			try {
				var init = lazyType._init;
				return init(lazyType._payload);
			} catch (x) {
				if (null !== x && "object" === typeof x && "function" === typeof x.then) throw suspendedThenable = x, SuspenseException;
				throw x;
			}
		}
		var suspendedThenable = null;
		function getSuspendedThenable() {
			if (null === suspendedThenable) throw Error(formatProdErrorMessage(459));
			var thenable = suspendedThenable;
			suspendedThenable = null;
			return thenable;
		}
		function checkIfUseWrappedInAsyncCatch(rejectedReason) {
			if (rejectedReason === SuspenseException || rejectedReason === SuspenseActionException) throw Error(formatProdErrorMessage(483));
		}
		var thenableState$1 = null, thenableIndexCounter$1 = 0;
		function unwrapThenable(thenable) {
			var index$1 = thenableIndexCounter$1;
			thenableIndexCounter$1 += 1;
			null === thenableState$1 && (thenableState$1 = []);
			return trackUsedThenable(thenableState$1, thenable, index$1);
		}
		function coerceRef(workInProgress$1, element) {
			element = element.props.ref;
			workInProgress$1.ref = void 0 !== element ? element : null;
		}
		function throwOnInvalidObjectTypeImpl(returnFiber, newChild) {
			if (newChild.$$typeof === REACT_LEGACY_ELEMENT_TYPE) throw Error(formatProdErrorMessage(525));
			returnFiber = Object.prototype.toString.call(newChild);
			throw Error(formatProdErrorMessage(31, "[object Object]" === returnFiber ? "object with keys {" + Object.keys(newChild).join(", ") + "}" : returnFiber));
		}
		function createChildReconciler(shouldTrackSideEffects) {
			function deleteChild(returnFiber, childToDelete) {
				if (shouldTrackSideEffects) {
					var deletions = returnFiber.deletions;
					null === deletions ? (returnFiber.deletions = [childToDelete], returnFiber.flags |= 16) : deletions.push(childToDelete);
				}
			}
			function deleteRemainingChildren(returnFiber, currentFirstChild) {
				if (!shouldTrackSideEffects) return null;
				for (; null !== currentFirstChild;) deleteChild(returnFiber, currentFirstChild), currentFirstChild = currentFirstChild.sibling;
				return null;
			}
			function mapRemainingChildren(currentFirstChild) {
				for (var existingChildren = /* @__PURE__ */ new Map(); null !== currentFirstChild;) null !== currentFirstChild.key ? existingChildren.set(currentFirstChild.key, currentFirstChild) : existingChildren.set(currentFirstChild.index, currentFirstChild), currentFirstChild = currentFirstChild.sibling;
				return existingChildren;
			}
			function useFiber(fiber, pendingProps) {
				fiber = createWorkInProgress(fiber, pendingProps);
				fiber.index = 0;
				fiber.sibling = null;
				return fiber;
			}
			function placeChild(newFiber, lastPlacedIndex, newIndex) {
				newFiber.index = newIndex;
				if (!shouldTrackSideEffects) return newFiber.flags |= 1048576, lastPlacedIndex;
				newIndex = newFiber.alternate;
				if (null !== newIndex) return newIndex = newIndex.index, newIndex < lastPlacedIndex ? (newFiber.flags |= 67108866, lastPlacedIndex) : newIndex;
				newFiber.flags |= 67108866;
				return lastPlacedIndex;
			}
			function placeSingleChild(newFiber) {
				shouldTrackSideEffects && null === newFiber.alternate && (newFiber.flags |= 67108866);
				return newFiber;
			}
			function updateTextNode(returnFiber, current, textContent, lanes) {
				if (null === current || 6 !== current.tag) return current = createFiberFromText(textContent, returnFiber.mode, lanes), current.return = returnFiber, current;
				current = useFiber(current, textContent);
				current.return = returnFiber;
				return current;
			}
			function updateElement(returnFiber, current, element, lanes) {
				var elementType = element.type;
				if (elementType === REACT_FRAGMENT_TYPE) return updateFragment(returnFiber, current, element.props.children, lanes, element.key);
				if (null !== current && (current.elementType === elementType || "object" === typeof elementType && null !== elementType && elementType.$$typeof === REACT_LAZY_TYPE$1 && resolveLazy(elementType) === current.type)) return current = useFiber(current, element.props), coerceRef(current, element), current.return = returnFiber, current;
				current = createFiberFromTypeAndProps(element.type, element.key, element.props, null, returnFiber.mode, lanes);
				coerceRef(current, element);
				current.return = returnFiber;
				return current;
			}
			function updatePortal(returnFiber, current, portal, lanes) {
				if (null === current || 4 !== current.tag || current.stateNode.containerInfo !== portal.containerInfo || current.stateNode.implementation !== portal.implementation) return current = createFiberFromPortal(portal, returnFiber.mode, lanes), current.return = returnFiber, current;
				current = useFiber(current, portal.children || []);
				current.return = returnFiber;
				return current;
			}
			function updateFragment(returnFiber, current, fragment, lanes, key) {
				if (null === current || 7 !== current.tag) return current = createFiberFromFragment(fragment, returnFiber.mode, lanes, key), current.return = returnFiber, current;
				current = useFiber(current, fragment);
				current.return = returnFiber;
				return current;
			}
			function createChild(returnFiber, newChild, lanes) {
				if ("string" === typeof newChild && "" !== newChild || "number" === typeof newChild || "bigint" === typeof newChild) return newChild = createFiberFromText("" + newChild, returnFiber.mode, lanes), newChild.return = returnFiber, newChild;
				if ("object" === typeof newChild && null !== newChild) {
					switch (newChild.$$typeof) {
						case REACT_ELEMENT_TYPE: return lanes = createFiberFromTypeAndProps(newChild.type, newChild.key, newChild.props, null, returnFiber.mode, lanes), coerceRef(lanes, newChild), lanes.return = returnFiber, lanes;
						case REACT_PORTAL_TYPE: return newChild = createFiberFromPortal(newChild, returnFiber.mode, lanes), newChild.return = returnFiber, newChild;
						case REACT_LAZY_TYPE$1: return newChild = resolveLazy(newChild), createChild(returnFiber, newChild, lanes);
					}
					if (isArrayImpl(newChild) || getIteratorFn(newChild)) return newChild = createFiberFromFragment(newChild, returnFiber.mode, lanes, null), newChild.return = returnFiber, newChild;
					if ("function" === typeof newChild.then) return createChild(returnFiber, unwrapThenable(newChild), lanes);
					if (newChild.$$typeof === REACT_CONTEXT_TYPE) return createChild(returnFiber, readContextDuringReconciliation(returnFiber, newChild), lanes);
					throwOnInvalidObjectTypeImpl(returnFiber, newChild);
				}
				return null;
			}
			function updateSlot(returnFiber, oldFiber, newChild, lanes) {
				var key = null !== oldFiber ? oldFiber.key : null;
				if ("string" === typeof newChild && "" !== newChild || "number" === typeof newChild || "bigint" === typeof newChild) return null !== key ? null : updateTextNode(returnFiber, oldFiber, "" + newChild, lanes);
				if ("object" === typeof newChild && null !== newChild) {
					switch (newChild.$$typeof) {
						case REACT_ELEMENT_TYPE: return newChild.key === key ? updateElement(returnFiber, oldFiber, newChild, lanes) : null;
						case REACT_PORTAL_TYPE: return newChild.key === key ? updatePortal(returnFiber, oldFiber, newChild, lanes) : null;
						case REACT_LAZY_TYPE$1: return newChild = resolveLazy(newChild), updateSlot(returnFiber, oldFiber, newChild, lanes);
					}
					if (isArrayImpl(newChild) || getIteratorFn(newChild)) return null !== key ? null : updateFragment(returnFiber, oldFiber, newChild, lanes, null);
					if ("function" === typeof newChild.then) return updateSlot(returnFiber, oldFiber, unwrapThenable(newChild), lanes);
					if (newChild.$$typeof === REACT_CONTEXT_TYPE) return updateSlot(returnFiber, oldFiber, readContextDuringReconciliation(returnFiber, newChild), lanes);
					throwOnInvalidObjectTypeImpl(returnFiber, newChild);
				}
				return null;
			}
			function updateFromMap(existingChildren, returnFiber, newIdx, newChild, lanes) {
				if ("string" === typeof newChild && "" !== newChild || "number" === typeof newChild || "bigint" === typeof newChild) return existingChildren = existingChildren.get(newIdx) || null, updateTextNode(returnFiber, existingChildren, "" + newChild, lanes);
				if ("object" === typeof newChild && null !== newChild) {
					switch (newChild.$$typeof) {
						case REACT_ELEMENT_TYPE: return existingChildren = existingChildren.get(null === newChild.key ? newIdx : newChild.key) || null, updateElement(returnFiber, existingChildren, newChild, lanes);
						case REACT_PORTAL_TYPE: return existingChildren = existingChildren.get(null === newChild.key ? newIdx : newChild.key) || null, updatePortal(returnFiber, existingChildren, newChild, lanes);
						case REACT_LAZY_TYPE$1: return newChild = resolveLazy(newChild), updateFromMap(existingChildren, returnFiber, newIdx, newChild, lanes);
					}
					if (isArrayImpl(newChild) || getIteratorFn(newChild)) return existingChildren = existingChildren.get(newIdx) || null, updateFragment(returnFiber, existingChildren, newChild, lanes, null);
					if ("function" === typeof newChild.then) return updateFromMap(existingChildren, returnFiber, newIdx, unwrapThenable(newChild), lanes);
					if (newChild.$$typeof === REACT_CONTEXT_TYPE) return updateFromMap(existingChildren, returnFiber, newIdx, readContextDuringReconciliation(returnFiber, newChild), lanes);
					throwOnInvalidObjectTypeImpl(returnFiber, newChild);
				}
				return null;
			}
			function reconcileChildrenArray(returnFiber, currentFirstChild, newChildren, lanes) {
				for (var resultingFirstChild = null, previousNewFiber = null, oldFiber = currentFirstChild, newIdx = currentFirstChild = 0, nextOldFiber = null; null !== oldFiber && newIdx < newChildren.length; newIdx++) {
					oldFiber.index > newIdx ? (nextOldFiber = oldFiber, oldFiber = null) : nextOldFiber = oldFiber.sibling;
					var newFiber = updateSlot(returnFiber, oldFiber, newChildren[newIdx], lanes);
					if (null === newFiber) {
						null === oldFiber && (oldFiber = nextOldFiber);
						break;
					}
					shouldTrackSideEffects && oldFiber && null === newFiber.alternate && deleteChild(returnFiber, oldFiber);
					currentFirstChild = placeChild(newFiber, currentFirstChild, newIdx);
					null === previousNewFiber ? resultingFirstChild = newFiber : previousNewFiber.sibling = newFiber;
					previousNewFiber = newFiber;
					oldFiber = nextOldFiber;
				}
				if (newIdx === newChildren.length) return deleteRemainingChildren(returnFiber, oldFiber), isHydrating && pushTreeFork(returnFiber, newIdx), resultingFirstChild;
				if (null === oldFiber) {
					for (; newIdx < newChildren.length; newIdx++) oldFiber = createChild(returnFiber, newChildren[newIdx], lanes), null !== oldFiber && (currentFirstChild = placeChild(oldFiber, currentFirstChild, newIdx), null === previousNewFiber ? resultingFirstChild = oldFiber : previousNewFiber.sibling = oldFiber, previousNewFiber = oldFiber);
					isHydrating && pushTreeFork(returnFiber, newIdx);
					return resultingFirstChild;
				}
				for (oldFiber = mapRemainingChildren(oldFiber); newIdx < newChildren.length; newIdx++) nextOldFiber = updateFromMap(oldFiber, returnFiber, newIdx, newChildren[newIdx], lanes), null !== nextOldFiber && (shouldTrackSideEffects && null !== nextOldFiber.alternate && oldFiber.delete(null === nextOldFiber.key ? newIdx : nextOldFiber.key), currentFirstChild = placeChild(nextOldFiber, currentFirstChild, newIdx), null === previousNewFiber ? resultingFirstChild = nextOldFiber : previousNewFiber.sibling = nextOldFiber, previousNewFiber = nextOldFiber);
				shouldTrackSideEffects && oldFiber.forEach(function(child) {
					return deleteChild(returnFiber, child);
				});
				isHydrating && pushTreeFork(returnFiber, newIdx);
				return resultingFirstChild;
			}
			function reconcileChildrenIterator(returnFiber, currentFirstChild, newChildren, lanes) {
				if (null == newChildren) throw Error(formatProdErrorMessage(151));
				for (var resultingFirstChild = null, previousNewFiber = null, oldFiber = currentFirstChild, newIdx = currentFirstChild = 0, nextOldFiber = null, step = newChildren.next(); null !== oldFiber && !step.done; newIdx++, step = newChildren.next()) {
					oldFiber.index > newIdx ? (nextOldFiber = oldFiber, oldFiber = null) : nextOldFiber = oldFiber.sibling;
					var newFiber = updateSlot(returnFiber, oldFiber, step.value, lanes);
					if (null === newFiber) {
						null === oldFiber && (oldFiber = nextOldFiber);
						break;
					}
					shouldTrackSideEffects && oldFiber && null === newFiber.alternate && deleteChild(returnFiber, oldFiber);
					currentFirstChild = placeChild(newFiber, currentFirstChild, newIdx);
					null === previousNewFiber ? resultingFirstChild = newFiber : previousNewFiber.sibling = newFiber;
					previousNewFiber = newFiber;
					oldFiber = nextOldFiber;
				}
				if (step.done) return deleteRemainingChildren(returnFiber, oldFiber), isHydrating && pushTreeFork(returnFiber, newIdx), resultingFirstChild;
				if (null === oldFiber) {
					for (; !step.done; newIdx++, step = newChildren.next()) step = createChild(returnFiber, step.value, lanes), null !== step && (currentFirstChild = placeChild(step, currentFirstChild, newIdx), null === previousNewFiber ? resultingFirstChild = step : previousNewFiber.sibling = step, previousNewFiber = step);
					isHydrating && pushTreeFork(returnFiber, newIdx);
					return resultingFirstChild;
				}
				for (oldFiber = mapRemainingChildren(oldFiber); !step.done; newIdx++, step = newChildren.next()) step = updateFromMap(oldFiber, returnFiber, newIdx, step.value, lanes), null !== step && (shouldTrackSideEffects && null !== step.alternate && oldFiber.delete(null === step.key ? newIdx : step.key), currentFirstChild = placeChild(step, currentFirstChild, newIdx), null === previousNewFiber ? resultingFirstChild = step : previousNewFiber.sibling = step, previousNewFiber = step);
				shouldTrackSideEffects && oldFiber.forEach(function(child) {
					return deleteChild(returnFiber, child);
				});
				isHydrating && pushTreeFork(returnFiber, newIdx);
				return resultingFirstChild;
			}
			function reconcileChildFibersImpl(returnFiber, currentFirstChild, newChild, lanes) {
				"object" === typeof newChild && null !== newChild && newChild.type === REACT_FRAGMENT_TYPE && null === newChild.key && (newChild = newChild.props.children);
				if ("object" === typeof newChild && null !== newChild) {
					switch (newChild.$$typeof) {
						case REACT_ELEMENT_TYPE:
							a: {
								for (var key = newChild.key; null !== currentFirstChild;) {
									if (currentFirstChild.key === key) {
										key = newChild.type;
										if (key === REACT_FRAGMENT_TYPE) {
											if (7 === currentFirstChild.tag) {
												deleteRemainingChildren(returnFiber, currentFirstChild.sibling);
												lanes = useFiber(currentFirstChild, newChild.props.children);
												lanes.return = returnFiber;
												returnFiber = lanes;
												break a;
											}
										} else if (currentFirstChild.elementType === key || "object" === typeof key && null !== key && key.$$typeof === REACT_LAZY_TYPE$1 && resolveLazy(key) === currentFirstChild.type) {
											deleteRemainingChildren(returnFiber, currentFirstChild.sibling);
											lanes = useFiber(currentFirstChild, newChild.props);
											coerceRef(lanes, newChild);
											lanes.return = returnFiber;
											returnFiber = lanes;
											break a;
										}
										deleteRemainingChildren(returnFiber, currentFirstChild);
										break;
									} else deleteChild(returnFiber, currentFirstChild);
									currentFirstChild = currentFirstChild.sibling;
								}
								newChild.type === REACT_FRAGMENT_TYPE ? (lanes = createFiberFromFragment(newChild.props.children, returnFiber.mode, lanes, newChild.key), lanes.return = returnFiber, returnFiber = lanes) : (lanes = createFiberFromTypeAndProps(newChild.type, newChild.key, newChild.props, null, returnFiber.mode, lanes), coerceRef(lanes, newChild), lanes.return = returnFiber, returnFiber = lanes);
							}
							return placeSingleChild(returnFiber);
						case REACT_PORTAL_TYPE:
							a: {
								for (key = newChild.key; null !== currentFirstChild;) {
									if (currentFirstChild.key === key) if (4 === currentFirstChild.tag && currentFirstChild.stateNode.containerInfo === newChild.containerInfo && currentFirstChild.stateNode.implementation === newChild.implementation) {
										deleteRemainingChildren(returnFiber, currentFirstChild.sibling);
										lanes = useFiber(currentFirstChild, newChild.children || []);
										lanes.return = returnFiber;
										returnFiber = lanes;
										break a;
									} else {
										deleteRemainingChildren(returnFiber, currentFirstChild);
										break;
									}
									else deleteChild(returnFiber, currentFirstChild);
									currentFirstChild = currentFirstChild.sibling;
								}
								lanes = createFiberFromPortal(newChild, returnFiber.mode, lanes);
								lanes.return = returnFiber;
								returnFiber = lanes;
							}
							return placeSingleChild(returnFiber);
						case REACT_LAZY_TYPE$1: return newChild = resolveLazy(newChild), reconcileChildFibersImpl(returnFiber, currentFirstChild, newChild, lanes);
					}
					if (isArrayImpl(newChild)) return reconcileChildrenArray(returnFiber, currentFirstChild, newChild, lanes);
					if (getIteratorFn(newChild)) {
						key = getIteratorFn(newChild);
						if ("function" !== typeof key) throw Error(formatProdErrorMessage(150));
						newChild = key.call(newChild);
						return reconcileChildrenIterator(returnFiber, currentFirstChild, newChild, lanes);
					}
					if ("function" === typeof newChild.then) return reconcileChildFibersImpl(returnFiber, currentFirstChild, unwrapThenable(newChild), lanes);
					if (newChild.$$typeof === REACT_CONTEXT_TYPE) return reconcileChildFibersImpl(returnFiber, currentFirstChild, readContextDuringReconciliation(returnFiber, newChild), lanes);
					throwOnInvalidObjectTypeImpl(returnFiber, newChild);
				}
				return "string" === typeof newChild && "" !== newChild || "number" === typeof newChild || "bigint" === typeof newChild ? (newChild = "" + newChild, null !== currentFirstChild && 6 === currentFirstChild.tag ? (deleteRemainingChildren(returnFiber, currentFirstChild.sibling), lanes = useFiber(currentFirstChild, newChild), lanes.return = returnFiber, returnFiber = lanes) : (deleteRemainingChildren(returnFiber, currentFirstChild), lanes = createFiberFromText(newChild, returnFiber.mode, lanes), lanes.return = returnFiber, returnFiber = lanes), placeSingleChild(returnFiber)) : deleteRemainingChildren(returnFiber, currentFirstChild);
			}
			return function(returnFiber, currentFirstChild, newChild, lanes) {
				try {
					thenableIndexCounter$1 = 0;
					var firstChildFiber = reconcileChildFibersImpl(returnFiber, currentFirstChild, newChild, lanes);
					thenableState$1 = null;
					return firstChildFiber;
				} catch (x) {
					if (x === SuspenseException || x === SuspenseActionException) throw x;
					var fiber = createFiberImplClass(29, x, null, returnFiber.mode);
					fiber.lanes = lanes;
					fiber.return = returnFiber;
					return fiber;
				}
			};
		}
		var reconcileChildFibers = createChildReconciler(!0), mountChildFibers = createChildReconciler(!1), hasForceUpdate = !1;
		function initializeUpdateQueue(fiber) {
			fiber.updateQueue = {
				baseState: fiber.memoizedState,
				firstBaseUpdate: null,
				lastBaseUpdate: null,
				shared: {
					pending: null,
					lanes: 0,
					hiddenCallbacks: null
				},
				callbacks: null
			};
		}
		function cloneUpdateQueue(current, workInProgress$1) {
			current = current.updateQueue;
			workInProgress$1.updateQueue === current && (workInProgress$1.updateQueue = {
				baseState: current.baseState,
				firstBaseUpdate: current.firstBaseUpdate,
				lastBaseUpdate: current.lastBaseUpdate,
				shared: current.shared,
				callbacks: null
			});
		}
		function createUpdate(lane) {
			return {
				lane,
				tag: 0,
				payload: null,
				callback: null,
				next: null
			};
		}
		function enqueueUpdate(fiber, update, lane) {
			var updateQueue = fiber.updateQueue;
			if (null === updateQueue) return null;
			updateQueue = updateQueue.shared;
			if (0 !== (executionContext & 2)) {
				var pending = updateQueue.pending;
				null === pending ? update.next = update : (update.next = pending.next, pending.next = update);
				updateQueue.pending = update;
				update = getRootForUpdatedFiber(fiber);
				markUpdateLaneFromFiberToRoot(fiber, null, lane);
				return update;
			}
			enqueueUpdate$1(fiber, updateQueue, update, lane);
			return getRootForUpdatedFiber(fiber);
		}
		function entangleTransitions(root$1, fiber, lane) {
			fiber = fiber.updateQueue;
			if (null !== fiber && (fiber = fiber.shared, 0 !== (lane & 4194048))) {
				var queueLanes = fiber.lanes;
				queueLanes &= root$1.pendingLanes;
				lane |= queueLanes;
				fiber.lanes = lane;
				markRootEntangled(root$1, lane);
			}
		}
		function enqueueCapturedUpdate(workInProgress$1, capturedUpdate) {
			var queue = workInProgress$1.updateQueue, current = workInProgress$1.alternate;
			if (null !== current && (current = current.updateQueue, queue === current)) {
				var newFirst = null, newLast = null;
				queue = queue.firstBaseUpdate;
				if (null !== queue) {
					do {
						var clone = {
							lane: queue.lane,
							tag: queue.tag,
							payload: queue.payload,
							callback: null,
							next: null
						};
						null === newLast ? newFirst = newLast = clone : newLast = newLast.next = clone;
						queue = queue.next;
					} while (null !== queue);
					null === newLast ? newFirst = newLast = capturedUpdate : newLast = newLast.next = capturedUpdate;
				} else newFirst = newLast = capturedUpdate;
				queue = {
					baseState: current.baseState,
					firstBaseUpdate: newFirst,
					lastBaseUpdate: newLast,
					shared: current.shared,
					callbacks: current.callbacks
				};
				workInProgress$1.updateQueue = queue;
				return;
			}
			workInProgress$1 = queue.lastBaseUpdate;
			null === workInProgress$1 ? queue.firstBaseUpdate = capturedUpdate : workInProgress$1.next = capturedUpdate;
			queue.lastBaseUpdate = capturedUpdate;
		}
		var didReadFromEntangledAsyncAction = !1;
		function suspendIfUpdateReadFromEntangledAsyncAction() {
			if (didReadFromEntangledAsyncAction) {
				var entangledActionThenable = currentEntangledActionThenable;
				if (null !== entangledActionThenable) throw entangledActionThenable;
			}
		}
		function processUpdateQueue(workInProgress$jscomp$0, props, instance$jscomp$0, renderLanes$1) {
			didReadFromEntangledAsyncAction = !1;
			var queue = workInProgress$jscomp$0.updateQueue;
			hasForceUpdate = !1;
			var firstBaseUpdate = queue.firstBaseUpdate, lastBaseUpdate = queue.lastBaseUpdate, pendingQueue = queue.shared.pending;
			if (null !== pendingQueue) {
				queue.shared.pending = null;
				var lastPendingUpdate = pendingQueue, firstPendingUpdate = lastPendingUpdate.next;
				lastPendingUpdate.next = null;
				null === lastBaseUpdate ? firstBaseUpdate = firstPendingUpdate : lastBaseUpdate.next = firstPendingUpdate;
				lastBaseUpdate = lastPendingUpdate;
				var current = workInProgress$jscomp$0.alternate;
				null !== current && (current = current.updateQueue, pendingQueue = current.lastBaseUpdate, pendingQueue !== lastBaseUpdate && (null === pendingQueue ? current.firstBaseUpdate = firstPendingUpdate : pendingQueue.next = firstPendingUpdate, current.lastBaseUpdate = lastPendingUpdate));
			}
			if (null !== firstBaseUpdate) {
				var newState = queue.baseState;
				lastBaseUpdate = 0;
				current = firstPendingUpdate = lastPendingUpdate = null;
				pendingQueue = firstBaseUpdate;
				do {
					var updateLane = pendingQueue.lane & -536870913, isHiddenUpdate = updateLane !== pendingQueue.lane;
					if (isHiddenUpdate ? (workInProgressRootRenderLanes & updateLane) === updateLane : (renderLanes$1 & updateLane) === updateLane) {
						0 !== updateLane && updateLane === currentEntangledLane && (didReadFromEntangledAsyncAction = !0);
						null !== current && (current = current.next = {
							lane: 0,
							tag: pendingQueue.tag,
							payload: pendingQueue.payload,
							callback: null,
							next: null
						});
						a: {
							var workInProgress$1 = workInProgress$jscomp$0, update = pendingQueue;
							updateLane = props;
							var instance = instance$jscomp$0;
							switch (update.tag) {
								case 1:
									workInProgress$1 = update.payload;
									if ("function" === typeof workInProgress$1) {
										newState = workInProgress$1.call(instance, newState, updateLane);
										break a;
									}
									newState = workInProgress$1;
									break a;
								case 3: workInProgress$1.flags = workInProgress$1.flags & -65537 | 128;
								case 0:
									workInProgress$1 = update.payload;
									updateLane = "function" === typeof workInProgress$1 ? workInProgress$1.call(instance, newState, updateLane) : workInProgress$1;
									if (null === updateLane || void 0 === updateLane) break a;
									newState = assign({}, newState, updateLane);
									break a;
								case 2: hasForceUpdate = !0;
							}
						}
						updateLane = pendingQueue.callback;
						null !== updateLane && (workInProgress$jscomp$0.flags |= 64, isHiddenUpdate && (workInProgress$jscomp$0.flags |= 8192), isHiddenUpdate = queue.callbacks, null === isHiddenUpdate ? queue.callbacks = [updateLane] : isHiddenUpdate.push(updateLane));
					} else isHiddenUpdate = {
						lane: updateLane,
						tag: pendingQueue.tag,
						payload: pendingQueue.payload,
						callback: pendingQueue.callback,
						next: null
					}, null === current ? (firstPendingUpdate = current = isHiddenUpdate, lastPendingUpdate = newState) : current = current.next = isHiddenUpdate, lastBaseUpdate |= updateLane;
					pendingQueue = pendingQueue.next;
					if (null === pendingQueue) if (pendingQueue = queue.shared.pending, null === pendingQueue) break;
					else isHiddenUpdate = pendingQueue, pendingQueue = isHiddenUpdate.next, isHiddenUpdate.next = null, queue.lastBaseUpdate = isHiddenUpdate, queue.shared.pending = null;
				} while (1);
				null === current && (lastPendingUpdate = newState);
				queue.baseState = lastPendingUpdate;
				queue.firstBaseUpdate = firstPendingUpdate;
				queue.lastBaseUpdate = current;
				null === firstBaseUpdate && (queue.shared.lanes = 0);
				workInProgressRootSkippedLanes |= lastBaseUpdate;
				workInProgress$jscomp$0.lanes = lastBaseUpdate;
				workInProgress$jscomp$0.memoizedState = newState;
			}
		}
		function callCallback(callback, context) {
			if ("function" !== typeof callback) throw Error(formatProdErrorMessage(191, callback));
			callback.call(context);
		}
		function commitCallbacks(updateQueue, context) {
			var callbacks = updateQueue.callbacks;
			if (null !== callbacks) for (updateQueue.callbacks = null, updateQueue = 0; updateQueue < callbacks.length; updateQueue++) callCallback(callbacks[updateQueue], context);
		}
		var currentTreeHiddenStackCursor = createCursor(null), prevEntangledRenderLanesCursor = createCursor(0);
		function pushHiddenContext(fiber, context) {
			fiber = entangledRenderLanes;
			push(prevEntangledRenderLanesCursor, fiber);
			push(currentTreeHiddenStackCursor, context);
			entangledRenderLanes = fiber | context.baseLanes;
		}
		function reuseHiddenContextOnStack() {
			push(prevEntangledRenderLanesCursor, entangledRenderLanes);
			push(currentTreeHiddenStackCursor, currentTreeHiddenStackCursor.current);
		}
		function popHiddenContext() {
			entangledRenderLanes = prevEntangledRenderLanesCursor.current;
			pop(currentTreeHiddenStackCursor);
			pop(prevEntangledRenderLanesCursor);
		}
		var suspenseHandlerStackCursor = createCursor(null), shellBoundary = null;
		function pushPrimaryTreeSuspenseHandler(handler) {
			var current = handler.alternate;
			push(suspenseStackCursor, suspenseStackCursor.current & 1);
			push(suspenseHandlerStackCursor, handler);
			null === shellBoundary && (null === current || null !== currentTreeHiddenStackCursor.current ? shellBoundary = handler : null !== current.memoizedState && (shellBoundary = handler));
		}
		function pushDehydratedActivitySuspenseHandler(fiber) {
			push(suspenseStackCursor, suspenseStackCursor.current);
			push(suspenseHandlerStackCursor, fiber);
			null === shellBoundary && (shellBoundary = fiber);
		}
		function pushOffscreenSuspenseHandler(fiber) {
			22 === fiber.tag ? (push(suspenseStackCursor, suspenseStackCursor.current), push(suspenseHandlerStackCursor, fiber), null === shellBoundary && (shellBoundary = fiber)) : reuseSuspenseHandlerOnStack(fiber);
		}
		function reuseSuspenseHandlerOnStack() {
			push(suspenseStackCursor, suspenseStackCursor.current);
			push(suspenseHandlerStackCursor, suspenseHandlerStackCursor.current);
		}
		function popSuspenseHandler(fiber) {
			pop(suspenseHandlerStackCursor);
			shellBoundary === fiber && (shellBoundary = null);
			pop(suspenseStackCursor);
		}
		var suspenseStackCursor = createCursor(0);
		function findFirstSuspended(row) {
			for (var node = row; null !== node;) {
				if (13 === node.tag) {
					var state = node.memoizedState;
					if (null !== state && (state = state.dehydrated, null === state || isSuspenseInstancePending(state) || isSuspenseInstanceFallback(state))) return node;
				} else if (19 === node.tag && ("forwards" === node.memoizedProps.revealOrder || "backwards" === node.memoizedProps.revealOrder || "unstable_legacy-backwards" === node.memoizedProps.revealOrder || "together" === node.memoizedProps.revealOrder)) {
					if (0 !== (node.flags & 128)) return node;
				} else if (null !== node.child) {
					node.child.return = node;
					node = node.child;
					continue;
				}
				if (node === row) break;
				for (; null === node.sibling;) {
					if (null === node.return || node.return === row) return null;
					node = node.return;
				}
				node.sibling.return = node.return;
				node = node.sibling;
			}
			return null;
		}
		var renderLanes = 0, currentlyRenderingFiber = null, currentHook = null, workInProgressHook = null, didScheduleRenderPhaseUpdate = !1, didScheduleRenderPhaseUpdateDuringThisPass = !1, shouldDoubleInvokeUserFnsInHooksDEV = !1, localIdCounter = 0, thenableIndexCounter = 0, thenableState = null, globalClientIdCounter = 0;
		function throwInvalidHookError() {
			throw Error(formatProdErrorMessage(321));
		}
		function areHookInputsEqual(nextDeps, prevDeps) {
			if (null === prevDeps) return !1;
			for (var i = 0; i < prevDeps.length && i < nextDeps.length; i++) if (!objectIs(nextDeps[i], prevDeps[i])) return !1;
			return !0;
		}
		function renderWithHooks(current, workInProgress$1, Component$1, props, secondArg, nextRenderLanes) {
			renderLanes = nextRenderLanes;
			currentlyRenderingFiber = workInProgress$1;
			workInProgress$1.memoizedState = null;
			workInProgress$1.updateQueue = null;
			workInProgress$1.lanes = 0;
			ReactSharedInternals.H = null === current || null === current.memoizedState ? HooksDispatcherOnMount : HooksDispatcherOnUpdate;
			shouldDoubleInvokeUserFnsInHooksDEV = !1;
			nextRenderLanes = Component$1(props, secondArg);
			shouldDoubleInvokeUserFnsInHooksDEV = !1;
			didScheduleRenderPhaseUpdateDuringThisPass && (nextRenderLanes = renderWithHooksAgain(workInProgress$1, Component$1, props, secondArg));
			finishRenderingHooks(current);
			return nextRenderLanes;
		}
		function finishRenderingHooks(current) {
			ReactSharedInternals.H = ContextOnlyDispatcher;
			var didRenderTooFewHooks = null !== currentHook && null !== currentHook.next;
			renderLanes = 0;
			workInProgressHook = currentHook = currentlyRenderingFiber = null;
			didScheduleRenderPhaseUpdate = !1;
			thenableIndexCounter = 0;
			thenableState = null;
			if (didRenderTooFewHooks) throw Error(formatProdErrorMessage(300));
			null === current || didReceiveUpdate || (current = current.dependencies, null !== current && checkIfContextChanged(current) && (didReceiveUpdate = !0));
		}
		function renderWithHooksAgain(workInProgress$1, Component$1, props, secondArg) {
			currentlyRenderingFiber = workInProgress$1;
			var numberOfReRenders = 0;
			do {
				didScheduleRenderPhaseUpdateDuringThisPass && (thenableState = null);
				thenableIndexCounter = 0;
				didScheduleRenderPhaseUpdateDuringThisPass = !1;
				if (25 <= numberOfReRenders) throw Error(formatProdErrorMessage(301));
				numberOfReRenders += 1;
				workInProgressHook = currentHook = null;
				if (null != workInProgress$1.updateQueue) {
					var children = workInProgress$1.updateQueue;
					children.lastEffect = null;
					children.events = null;
					children.stores = null;
					null != children.memoCache && (children.memoCache.index = 0);
				}
				ReactSharedInternals.H = HooksDispatcherOnRerender;
				children = Component$1(props, secondArg);
			} while (didScheduleRenderPhaseUpdateDuringThisPass);
			return children;
		}
		function TransitionAwareHostComponent() {
			var dispatcher = ReactSharedInternals.H, maybeThenable = dispatcher.useState()[0];
			maybeThenable = "function" === typeof maybeThenable.then ? useThenable(maybeThenable) : maybeThenable;
			dispatcher = dispatcher.useState()[0];
			(null !== currentHook ? currentHook.memoizedState : null) !== dispatcher && (currentlyRenderingFiber.flags |= 1024);
			return maybeThenable;
		}
		function checkDidRenderIdHook() {
			var didRenderIdHook = 0 !== localIdCounter;
			localIdCounter = 0;
			return didRenderIdHook;
		}
		function bailoutHooks(current, workInProgress$1, lanes) {
			workInProgress$1.updateQueue = current.updateQueue;
			workInProgress$1.flags &= -2053;
			current.lanes &= ~lanes;
		}
		function resetHooksOnUnwind(workInProgress$1) {
			if (didScheduleRenderPhaseUpdate) {
				for (workInProgress$1 = workInProgress$1.memoizedState; null !== workInProgress$1;) {
					var queue = workInProgress$1.queue;
					null !== queue && (queue.pending = null);
					workInProgress$1 = workInProgress$1.next;
				}
				didScheduleRenderPhaseUpdate = !1;
			}
			renderLanes = 0;
			workInProgressHook = currentHook = currentlyRenderingFiber = null;
			didScheduleRenderPhaseUpdateDuringThisPass = !1;
			thenableIndexCounter = localIdCounter = 0;
			thenableState = null;
		}
		function mountWorkInProgressHook() {
			var hook = {
				memoizedState: null,
				baseState: null,
				baseQueue: null,
				queue: null,
				next: null
			};
			null === workInProgressHook ? currentlyRenderingFiber.memoizedState = workInProgressHook = hook : workInProgressHook = workInProgressHook.next = hook;
			return workInProgressHook;
		}
		function updateWorkInProgressHook() {
			if (null === currentHook) {
				var nextCurrentHook = currentlyRenderingFiber.alternate;
				nextCurrentHook = null !== nextCurrentHook ? nextCurrentHook.memoizedState : null;
			} else nextCurrentHook = currentHook.next;
			var nextWorkInProgressHook = null === workInProgressHook ? currentlyRenderingFiber.memoizedState : workInProgressHook.next;
			if (null !== nextWorkInProgressHook) workInProgressHook = nextWorkInProgressHook, currentHook = nextCurrentHook;
			else {
				if (null === nextCurrentHook) {
					if (null === currentlyRenderingFiber.alternate) throw Error(formatProdErrorMessage(467));
					throw Error(formatProdErrorMessage(310));
				}
				currentHook = nextCurrentHook;
				nextCurrentHook = {
					memoizedState: currentHook.memoizedState,
					baseState: currentHook.baseState,
					baseQueue: currentHook.baseQueue,
					queue: currentHook.queue,
					next: null
				};
				null === workInProgressHook ? currentlyRenderingFiber.memoizedState = workInProgressHook = nextCurrentHook : workInProgressHook = workInProgressHook.next = nextCurrentHook;
			}
			return workInProgressHook;
		}
		function createFunctionComponentUpdateQueue() {
			return {
				lastEffect: null,
				events: null,
				stores: null,
				memoCache: null
			};
		}
		function useThenable(thenable) {
			var index$1 = thenableIndexCounter;
			thenableIndexCounter += 1;
			null === thenableState && (thenableState = []);
			thenable = trackUsedThenable(thenableState, thenable, index$1);
			index$1 = currentlyRenderingFiber;
			null === (null === workInProgressHook ? index$1.memoizedState : workInProgressHook.next) && (index$1 = index$1.alternate, ReactSharedInternals.H = null === index$1 || null === index$1.memoizedState ? HooksDispatcherOnMount : HooksDispatcherOnUpdate);
			return thenable;
		}
		function use$1(usable) {
			if (null !== usable && "object" === typeof usable) {
				if ("function" === typeof usable.then) return useThenable(usable);
				if (usable.$$typeof === REACT_CONTEXT_TYPE) return readContext(usable);
			}
			throw Error(formatProdErrorMessage(438, String(usable)));
		}
		function useMemoCache(size) {
			var memoCache = null, updateQueue = currentlyRenderingFiber.updateQueue;
			null !== updateQueue && (memoCache = updateQueue.memoCache);
			if (null == memoCache) {
				var current = currentlyRenderingFiber.alternate;
				null !== current && (current = current.updateQueue, null !== current && (current = current.memoCache, null != current && (memoCache = {
					data: current.data.map(function(array) {
						return array.slice();
					}),
					index: 0
				})));
			}
			memoCache ??= {
				data: [],
				index: 0
			};
			null === updateQueue && (updateQueue = createFunctionComponentUpdateQueue(), currentlyRenderingFiber.updateQueue = updateQueue);
			updateQueue.memoCache = memoCache;
			updateQueue = memoCache.data[memoCache.index];
			if (void 0 === updateQueue) for (updateQueue = memoCache.data[memoCache.index] = Array(size), current = 0; current < size; current++) updateQueue[current] = REACT_MEMO_CACHE_SENTINEL;
			memoCache.index++;
			return updateQueue;
		}
		function basicStateReducer(state, action) {
			return "function" === typeof action ? action(state) : action;
		}
		function updateReducer(reducer) {
			return updateReducerImpl(updateWorkInProgressHook(), currentHook, reducer);
		}
		function updateReducerImpl(hook, current, reducer) {
			var queue = hook.queue;
			if (null === queue) throw Error(formatProdErrorMessage(311));
			queue.lastRenderedReducer = reducer;
			var baseQueue = hook.baseQueue, pendingQueue = queue.pending;
			if (null !== pendingQueue) {
				if (null !== baseQueue) {
					var baseFirst = baseQueue.next;
					baseQueue.next = pendingQueue.next;
					pendingQueue.next = baseFirst;
				}
				current.baseQueue = baseQueue = pendingQueue;
				queue.pending = null;
			}
			pendingQueue = hook.baseState;
			if (null === baseQueue) hook.memoizedState = pendingQueue;
			else {
				current = baseQueue.next;
				var newBaseQueueFirst = baseFirst = null, newBaseQueueLast = null, update = current, didReadFromEntangledAsyncAction$60 = !1;
				do {
					var updateLane = update.lane & -536870913;
					if (updateLane !== update.lane ? (workInProgressRootRenderLanes & updateLane) === updateLane : (renderLanes & updateLane) === updateLane) {
						var revertLane = update.revertLane;
						if (0 === revertLane) null !== newBaseQueueLast && (newBaseQueueLast = newBaseQueueLast.next = {
							lane: 0,
							revertLane: 0,
							gesture: null,
							action: update.action,
							hasEagerState: update.hasEagerState,
							eagerState: update.eagerState,
							next: null
						}), updateLane === currentEntangledLane && (didReadFromEntangledAsyncAction$60 = !0);
						else if ((renderLanes & revertLane) === revertLane) {
							update = update.next;
							revertLane === currentEntangledLane && (didReadFromEntangledAsyncAction$60 = !0);
							continue;
						} else updateLane = {
							lane: 0,
							revertLane: update.revertLane,
							gesture: null,
							action: update.action,
							hasEagerState: update.hasEagerState,
							eagerState: update.eagerState,
							next: null
						}, null === newBaseQueueLast ? (newBaseQueueFirst = newBaseQueueLast = updateLane, baseFirst = pendingQueue) : newBaseQueueLast = newBaseQueueLast.next = updateLane, currentlyRenderingFiber.lanes |= revertLane, workInProgressRootSkippedLanes |= revertLane;
						updateLane = update.action;
						shouldDoubleInvokeUserFnsInHooksDEV && reducer(pendingQueue, updateLane);
						pendingQueue = update.hasEagerState ? update.eagerState : reducer(pendingQueue, updateLane);
					} else revertLane = {
						lane: updateLane,
						revertLane: update.revertLane,
						gesture: update.gesture,
						action: update.action,
						hasEagerState: update.hasEagerState,
						eagerState: update.eagerState,
						next: null
					}, null === newBaseQueueLast ? (newBaseQueueFirst = newBaseQueueLast = revertLane, baseFirst = pendingQueue) : newBaseQueueLast = newBaseQueueLast.next = revertLane, currentlyRenderingFiber.lanes |= updateLane, workInProgressRootSkippedLanes |= updateLane;
					update = update.next;
				} while (null !== update && update !== current);
				null === newBaseQueueLast ? baseFirst = pendingQueue : newBaseQueueLast.next = newBaseQueueFirst;
				if (!objectIs(pendingQueue, hook.memoizedState) && (didReceiveUpdate = !0, didReadFromEntangledAsyncAction$60 && (reducer = currentEntangledActionThenable, null !== reducer))) throw reducer;
				hook.memoizedState = pendingQueue;
				hook.baseState = baseFirst;
				hook.baseQueue = newBaseQueueLast;
				queue.lastRenderedState = pendingQueue;
			}
			null === baseQueue && (queue.lanes = 0);
			return [hook.memoizedState, queue.dispatch];
		}
		function rerenderReducer(reducer) {
			var hook = updateWorkInProgressHook(), queue = hook.queue;
			if (null === queue) throw Error(formatProdErrorMessage(311));
			queue.lastRenderedReducer = reducer;
			var dispatch = queue.dispatch, lastRenderPhaseUpdate = queue.pending, newState = hook.memoizedState;
			if (null !== lastRenderPhaseUpdate) {
				queue.pending = null;
				var update = lastRenderPhaseUpdate = lastRenderPhaseUpdate.next;
				do
					newState = reducer(newState, update.action), update = update.next;
				while (update !== lastRenderPhaseUpdate);
				objectIs(newState, hook.memoizedState) || (didReceiveUpdate = !0);
				hook.memoizedState = newState;
				null === hook.baseQueue && (hook.baseState = newState);
				queue.lastRenderedState = newState;
			}
			return [newState, dispatch];
		}
		function updateSyncExternalStore(subscribe, getSnapshot, getServerSnapshot) {
			var fiber = currentlyRenderingFiber, hook = updateWorkInProgressHook(), isHydrating$jscomp$0 = isHydrating;
			if (isHydrating$jscomp$0) {
				if (void 0 === getServerSnapshot) throw Error(formatProdErrorMessage(407));
				getServerSnapshot = getServerSnapshot();
			} else getServerSnapshot = getSnapshot();
			var snapshotChanged = !objectIs((currentHook || hook).memoizedState, getServerSnapshot);
			snapshotChanged && (hook.memoizedState = getServerSnapshot, didReceiveUpdate = !0);
			hook = hook.queue;
			updateEffect(subscribeToStore.bind(null, fiber, hook, subscribe), [subscribe]);
			if (hook.getSnapshot !== getSnapshot || snapshotChanged || null !== workInProgressHook && workInProgressHook.memoizedState.tag & 1) {
				fiber.flags |= 2048;
				pushSimpleEffect(9, { destroy: void 0 }, updateStoreInstance.bind(null, fiber, hook, getServerSnapshot, getSnapshot), null);
				if (null === workInProgressRoot) throw Error(formatProdErrorMessage(349));
				isHydrating$jscomp$0 || 0 !== (renderLanes & 127) || pushStoreConsistencyCheck(fiber, getSnapshot, getServerSnapshot);
			}
			return getServerSnapshot;
		}
		function pushStoreConsistencyCheck(fiber, getSnapshot, renderedSnapshot) {
			fiber.flags |= 16384;
			fiber = {
				getSnapshot,
				value: renderedSnapshot
			};
			getSnapshot = currentlyRenderingFiber.updateQueue;
			null === getSnapshot ? (getSnapshot = createFunctionComponentUpdateQueue(), currentlyRenderingFiber.updateQueue = getSnapshot, getSnapshot.stores = [fiber]) : (renderedSnapshot = getSnapshot.stores, null === renderedSnapshot ? getSnapshot.stores = [fiber] : renderedSnapshot.push(fiber));
		}
		function updateStoreInstance(fiber, inst, nextSnapshot, getSnapshot) {
			inst.value = nextSnapshot;
			inst.getSnapshot = getSnapshot;
			checkIfSnapshotChanged(inst) && forceStoreRerender(fiber);
		}
		function subscribeToStore(fiber, inst, subscribe) {
			return subscribe(function() {
				checkIfSnapshotChanged(inst) && forceStoreRerender(fiber);
			});
		}
		function checkIfSnapshotChanged(inst) {
			var latestGetSnapshot = inst.getSnapshot;
			inst = inst.value;
			try {
				var nextValue = latestGetSnapshot();
				return !objectIs(inst, nextValue);
			} catch (error) {
				return !0;
			}
		}
		function forceStoreRerender(fiber) {
			var root$1 = enqueueConcurrentRenderForLane(fiber, 2);
			null !== root$1 && scheduleUpdateOnFiber(root$1, fiber, 2);
		}
		function mountStateImpl(initialState) {
			var hook = mountWorkInProgressHook();
			if ("function" === typeof initialState) {
				var initialStateInitializer = initialState;
				initialState = initialStateInitializer();
				if (shouldDoubleInvokeUserFnsInHooksDEV) {
					setIsStrictModeForDevtools(!0);
					try {
						initialStateInitializer();
					} finally {
						setIsStrictModeForDevtools(!1);
					}
				}
			}
			hook.memoizedState = hook.baseState = initialState;
			hook.queue = {
				pending: null,
				lanes: 0,
				dispatch: null,
				lastRenderedReducer: basicStateReducer,
				lastRenderedState: initialState
			};
			return hook;
		}
		function updateOptimisticImpl(hook, current, passthrough, reducer) {
			hook.baseState = passthrough;
			return updateReducerImpl(hook, currentHook, "function" === typeof reducer ? reducer : basicStateReducer);
		}
		function dispatchActionState(fiber, actionQueue, setPendingState, setState, payload) {
			if (isRenderPhaseUpdate(fiber)) throw Error(formatProdErrorMessage(485));
			fiber = actionQueue.action;
			if (null !== fiber) {
				var actionNode = {
					payload,
					action: fiber,
					next: null,
					isTransition: !0,
					status: "pending",
					value: null,
					reason: null,
					listeners: [],
					then: function(listener) {
						actionNode.listeners.push(listener);
					}
				};
				null !== ReactSharedInternals.T ? setPendingState(!0) : actionNode.isTransition = !1;
				setState(actionNode);
				setPendingState = actionQueue.pending;
				null === setPendingState ? (actionNode.next = actionQueue.pending = actionNode, runActionStateAction(actionQueue, actionNode)) : (actionNode.next = setPendingState.next, actionQueue.pending = setPendingState.next = actionNode);
			}
		}
		function runActionStateAction(actionQueue, node) {
			var action = node.action, payload = node.payload, prevState = actionQueue.state;
			if (node.isTransition) {
				var prevTransition = ReactSharedInternals.T, currentTransition = {};
				ReactSharedInternals.T = currentTransition;
				try {
					var returnValue = action(prevState, payload), onStartTransitionFinish = ReactSharedInternals.S;
					null !== onStartTransitionFinish && onStartTransitionFinish(currentTransition, returnValue);
					handleActionReturnValue(actionQueue, node, returnValue);
				} catch (error) {
					onActionError(actionQueue, node, error);
				} finally {
					null !== prevTransition && null !== currentTransition.types && (prevTransition.types = currentTransition.types), ReactSharedInternals.T = prevTransition;
				}
			} else try {
				prevTransition = action(prevState, payload), handleActionReturnValue(actionQueue, node, prevTransition);
			} catch (error$66) {
				onActionError(actionQueue, node, error$66);
			}
		}
		function handleActionReturnValue(actionQueue, node, returnValue) {
			null !== returnValue && "object" === typeof returnValue && "function" === typeof returnValue.then ? returnValue.then(function(nextState) {
				onActionSuccess(actionQueue, node, nextState);
			}, function(error) {
				return onActionError(actionQueue, node, error);
			}) : onActionSuccess(actionQueue, node, returnValue);
		}
		function onActionSuccess(actionQueue, actionNode, nextState) {
			actionNode.status = "fulfilled";
			actionNode.value = nextState;
			notifyActionListeners(actionNode);
			actionQueue.state = nextState;
			actionNode = actionQueue.pending;
			null !== actionNode && (nextState = actionNode.next, nextState === actionNode ? actionQueue.pending = null : (nextState = nextState.next, actionNode.next = nextState, runActionStateAction(actionQueue, nextState)));
		}
		function onActionError(actionQueue, actionNode, error) {
			var last = actionQueue.pending;
			actionQueue.pending = null;
			if (null !== last) {
				last = last.next;
				do
					actionNode.status = "rejected", actionNode.reason = error, notifyActionListeners(actionNode), actionNode = actionNode.next;
				while (actionNode !== last);
			}
			actionQueue.action = null;
		}
		function notifyActionListeners(actionNode) {
			actionNode = actionNode.listeners;
			for (var i = 0; i < actionNode.length; i++) (0, actionNode[i])();
		}
		function actionStateReducer(oldState, newState) {
			return newState;
		}
		function mountActionState(action, initialStateProp) {
			if (isHydrating) {
				var ssrFormState = workInProgressRoot.formState;
				if (null !== ssrFormState) {
					a: {
						var JSCompiler_inline_result = currentlyRenderingFiber;
						if (isHydrating) {
							if (nextHydratableInstance) {
								b: {
									var JSCompiler_inline_result$jscomp$0 = nextHydratableInstance;
									for (var inRootOrSingleton = rootOrSingletonContext; 8 !== JSCompiler_inline_result$jscomp$0.nodeType;) {
										if (!inRootOrSingleton) {
											JSCompiler_inline_result$jscomp$0 = null;
											break b;
										}
										JSCompiler_inline_result$jscomp$0 = getNextHydratable(JSCompiler_inline_result$jscomp$0.nextSibling);
										if (null === JSCompiler_inline_result$jscomp$0) {
											JSCompiler_inline_result$jscomp$0 = null;
											break b;
										}
									}
									inRootOrSingleton = JSCompiler_inline_result$jscomp$0.data;
									JSCompiler_inline_result$jscomp$0 = "F!" === inRootOrSingleton || "F" === inRootOrSingleton ? JSCompiler_inline_result$jscomp$0 : null;
								}
								if (JSCompiler_inline_result$jscomp$0) {
									nextHydratableInstance = getNextHydratable(JSCompiler_inline_result$jscomp$0.nextSibling);
									JSCompiler_inline_result = "F!" === JSCompiler_inline_result$jscomp$0.data;
									break a;
								}
							}
							throwOnHydrationMismatch(JSCompiler_inline_result);
						}
						JSCompiler_inline_result = !1;
					}
					JSCompiler_inline_result && (initialStateProp = ssrFormState[0]);
				}
			}
			ssrFormState = mountWorkInProgressHook();
			ssrFormState.memoizedState = ssrFormState.baseState = initialStateProp;
			JSCompiler_inline_result = {
				pending: null,
				lanes: 0,
				dispatch: null,
				lastRenderedReducer: actionStateReducer,
				lastRenderedState: initialStateProp
			};
			ssrFormState.queue = JSCompiler_inline_result;
			ssrFormState = dispatchSetState.bind(null, currentlyRenderingFiber, JSCompiler_inline_result);
			JSCompiler_inline_result.dispatch = ssrFormState;
			JSCompiler_inline_result = mountStateImpl(!1);
			inRootOrSingleton = dispatchOptimisticSetState.bind(null, currentlyRenderingFiber, !1, JSCompiler_inline_result.queue);
			JSCompiler_inline_result = mountWorkInProgressHook();
			JSCompiler_inline_result$jscomp$0 = {
				state: initialStateProp,
				dispatch: null,
				action,
				pending: null
			};
			JSCompiler_inline_result.queue = JSCompiler_inline_result$jscomp$0;
			ssrFormState = dispatchActionState.bind(null, currentlyRenderingFiber, JSCompiler_inline_result$jscomp$0, inRootOrSingleton, ssrFormState);
			JSCompiler_inline_result$jscomp$0.dispatch = ssrFormState;
			JSCompiler_inline_result.memoizedState = action;
			return [
				initialStateProp,
				ssrFormState,
				!1
			];
		}
		function updateActionState(action) {
			return updateActionStateImpl(updateWorkInProgressHook(), currentHook, action);
		}
		function updateActionStateImpl(stateHook, currentStateHook, action) {
			currentStateHook = updateReducerImpl(stateHook, currentStateHook, actionStateReducer)[0];
			stateHook = updateReducer(basicStateReducer)[0];
			if ("object" === typeof currentStateHook && null !== currentStateHook && "function" === typeof currentStateHook.then) try {
				var state = useThenable(currentStateHook);
			} catch (x) {
				if (x === SuspenseException) throw SuspenseActionException;
				throw x;
			}
			else state = currentStateHook;
			currentStateHook = updateWorkInProgressHook();
			var actionQueue = currentStateHook.queue, dispatch = actionQueue.dispatch;
			action !== currentStateHook.memoizedState && (currentlyRenderingFiber.flags |= 2048, pushSimpleEffect(9, { destroy: void 0 }, actionStateActionEffect.bind(null, actionQueue, action), null));
			return [
				state,
				dispatch,
				stateHook
			];
		}
		function actionStateActionEffect(actionQueue, action) {
			actionQueue.action = action;
		}
		function rerenderActionState(action) {
			var stateHook = updateWorkInProgressHook(), currentStateHook = currentHook;
			if (null !== currentStateHook) return updateActionStateImpl(stateHook, currentStateHook, action);
			updateWorkInProgressHook();
			stateHook = stateHook.memoizedState;
			currentStateHook = updateWorkInProgressHook();
			var dispatch = currentStateHook.queue.dispatch;
			currentStateHook.memoizedState = action;
			return [
				stateHook,
				dispatch,
				!1
			];
		}
		function pushSimpleEffect(tag, inst, create, deps) {
			tag = {
				tag,
				create,
				deps,
				inst,
				next: null
			};
			inst = currentlyRenderingFiber.updateQueue;
			null === inst && (inst = createFunctionComponentUpdateQueue(), currentlyRenderingFiber.updateQueue = inst);
			create = inst.lastEffect;
			null === create ? inst.lastEffect = tag.next = tag : (deps = create.next, create.next = tag, tag.next = deps, inst.lastEffect = tag);
			return tag;
		}
		function updateRef() {
			return updateWorkInProgressHook().memoizedState;
		}
		function mountEffectImpl(fiberFlags, hookFlags, create, deps) {
			var hook = mountWorkInProgressHook();
			currentlyRenderingFiber.flags |= fiberFlags;
			hook.memoizedState = pushSimpleEffect(1 | hookFlags, { destroy: void 0 }, create, void 0 === deps ? null : deps);
		}
		function updateEffectImpl(fiberFlags, hookFlags, create, deps) {
			var hook = updateWorkInProgressHook();
			deps = void 0 === deps ? null : deps;
			var inst = hook.memoizedState.inst;
			null !== currentHook && null !== deps && areHookInputsEqual(deps, currentHook.memoizedState.deps) ? hook.memoizedState = pushSimpleEffect(hookFlags, inst, create, deps) : (currentlyRenderingFiber.flags |= fiberFlags, hook.memoizedState = pushSimpleEffect(1 | hookFlags, inst, create, deps));
		}
		function mountEffect(create, deps) {
			mountEffectImpl(8390656, 8, create, deps);
		}
		function updateEffect(create, deps) {
			updateEffectImpl(2048, 8, create, deps);
		}
		function useEffectEventImpl(payload) {
			currentlyRenderingFiber.flags |= 4;
			var componentUpdateQueue = currentlyRenderingFiber.updateQueue;
			if (null === componentUpdateQueue) componentUpdateQueue = createFunctionComponentUpdateQueue(), currentlyRenderingFiber.updateQueue = componentUpdateQueue, componentUpdateQueue.events = [payload];
			else {
				var events = componentUpdateQueue.events;
				null === events ? componentUpdateQueue.events = [payload] : events.push(payload);
			}
		}
		function updateEvent(callback) {
			var ref = updateWorkInProgressHook().memoizedState;
			useEffectEventImpl({
				ref,
				nextImpl: callback
			});
			return function() {
				if (0 !== (executionContext & 2)) throw Error(formatProdErrorMessage(440));
				return ref.impl.apply(void 0, arguments);
			};
		}
		function updateInsertionEffect(create, deps) {
			return updateEffectImpl(4, 2, create, deps);
		}
		function updateLayoutEffect(create, deps) {
			return updateEffectImpl(4, 4, create, deps);
		}
		function imperativeHandleEffect(create, ref) {
			if ("function" === typeof ref) {
				create = create();
				var refCleanup = ref(create);
				return function() {
					"function" === typeof refCleanup ? refCleanup() : ref(null);
				};
			}
			if (null !== ref && void 0 !== ref) return create = create(), ref.current = create, function() {
				ref.current = null;
			};
		}
		function updateImperativeHandle(ref, create, deps) {
			deps = null !== deps && void 0 !== deps ? deps.concat([ref]) : null;
			updateEffectImpl(4, 4, imperativeHandleEffect.bind(null, create, ref), deps);
		}
		function mountDebugValue() {}
		function updateCallback(callback, deps) {
			var hook = updateWorkInProgressHook();
			deps = void 0 === deps ? null : deps;
			var prevState = hook.memoizedState;
			if (null !== deps && areHookInputsEqual(deps, prevState[1])) return prevState[0];
			hook.memoizedState = [callback, deps];
			return callback;
		}
		function updateMemo(nextCreate, deps) {
			var hook = updateWorkInProgressHook();
			deps = void 0 === deps ? null : deps;
			var prevState = hook.memoizedState;
			if (null !== deps && areHookInputsEqual(deps, prevState[1])) return prevState[0];
			prevState = nextCreate();
			if (shouldDoubleInvokeUserFnsInHooksDEV) {
				setIsStrictModeForDevtools(!0);
				try {
					nextCreate();
				} finally {
					setIsStrictModeForDevtools(!1);
				}
			}
			hook.memoizedState = [prevState, deps];
			return prevState;
		}
		function mountDeferredValueImpl(hook, value, initialValue) {
			if (void 0 === initialValue || 0 !== (renderLanes & 1073741824) && 0 === (workInProgressRootRenderLanes & 261930)) return hook.memoizedState = value;
			hook.memoizedState = initialValue;
			hook = requestDeferredLane();
			currentlyRenderingFiber.lanes |= hook;
			workInProgressRootSkippedLanes |= hook;
			return initialValue;
		}
		function updateDeferredValueImpl(hook, prevValue, value, initialValue) {
			if (objectIs(value, prevValue)) return value;
			if (null !== currentTreeHiddenStackCursor.current) return hook = mountDeferredValueImpl(hook, value, initialValue), objectIs(hook, prevValue) || (didReceiveUpdate = !0), hook;
			if (0 === (renderLanes & 42) || 0 !== (renderLanes & 1073741824) && 0 === (workInProgressRootRenderLanes & 261930)) return didReceiveUpdate = !0, hook.memoizedState = value;
			hook = requestDeferredLane();
			currentlyRenderingFiber.lanes |= hook;
			workInProgressRootSkippedLanes |= hook;
			return prevValue;
		}
		function startTransition(fiber, queue, pendingState, finishedState, callback) {
			var previousPriority = ReactDOMSharedInternals.p;
			ReactDOMSharedInternals.p = 0 !== previousPriority && 8 > previousPriority ? previousPriority : 8;
			var prevTransition = ReactSharedInternals.T, currentTransition = {};
			ReactSharedInternals.T = currentTransition;
			dispatchOptimisticSetState(fiber, !1, queue, pendingState);
			try {
				var returnValue = callback(), onStartTransitionFinish = ReactSharedInternals.S;
				null !== onStartTransitionFinish && onStartTransitionFinish(currentTransition, returnValue);
				if (null !== returnValue && "object" === typeof returnValue && "function" === typeof returnValue.then) dispatchSetStateInternal(fiber, queue, chainThenableValue(returnValue, finishedState), requestUpdateLane(fiber));
				else dispatchSetStateInternal(fiber, queue, finishedState, requestUpdateLane(fiber));
			} catch (error) {
				dispatchSetStateInternal(fiber, queue, {
					then: function() {},
					status: "rejected",
					reason: error
				}, requestUpdateLane());
			} finally {
				ReactDOMSharedInternals.p = previousPriority, null !== prevTransition && null !== currentTransition.types && (prevTransition.types = currentTransition.types), ReactSharedInternals.T = prevTransition;
			}
		}
		function noop() {}
		function startHostTransition(formFiber, pendingState, action, formData) {
			if (5 !== formFiber.tag) throw Error(formatProdErrorMessage(476));
			var queue = ensureFormComponentIsStateful(formFiber).queue;
			startTransition(formFiber, queue, pendingState, sharedNotPendingObject, null === action ? noop : function() {
				requestFormReset$1(formFiber);
				return action(formData);
			});
		}
		function ensureFormComponentIsStateful(formFiber) {
			var existingStateHook = formFiber.memoizedState;
			if (null !== existingStateHook) return existingStateHook;
			existingStateHook = {
				memoizedState: sharedNotPendingObject,
				baseState: sharedNotPendingObject,
				baseQueue: null,
				queue: {
					pending: null,
					lanes: 0,
					dispatch: null,
					lastRenderedReducer: basicStateReducer,
					lastRenderedState: sharedNotPendingObject
				},
				next: null
			};
			var initialResetState = {};
			existingStateHook.next = {
				memoizedState: initialResetState,
				baseState: initialResetState,
				baseQueue: null,
				queue: {
					pending: null,
					lanes: 0,
					dispatch: null,
					lastRenderedReducer: basicStateReducer,
					lastRenderedState: initialResetState
				},
				next: null
			};
			formFiber.memoizedState = existingStateHook;
			formFiber = formFiber.alternate;
			null !== formFiber && (formFiber.memoizedState = existingStateHook);
			return existingStateHook;
		}
		function requestFormReset$1(formFiber) {
			var stateHook = ensureFormComponentIsStateful(formFiber);
			null === stateHook.next && (stateHook = formFiber.alternate.memoizedState);
			dispatchSetStateInternal(formFiber, stateHook.next.queue, {}, requestUpdateLane());
		}
		function useHostTransitionStatus() {
			return readContext(HostTransitionContext);
		}
		function updateId() {
			return updateWorkInProgressHook().memoizedState;
		}
		function updateRefresh() {
			return updateWorkInProgressHook().memoizedState;
		}
		function refreshCache(fiber) {
			for (var provider = fiber.return; null !== provider;) {
				switch (provider.tag) {
					case 24:
					case 3:
						var lane = requestUpdateLane();
						fiber = createUpdate(lane);
						var root$69 = enqueueUpdate(provider, fiber, lane);
						null !== root$69 && (scheduleUpdateOnFiber(root$69, provider, lane), entangleTransitions(root$69, provider, lane));
						provider = { cache: createCache() };
						fiber.payload = provider;
						return;
				}
				provider = provider.return;
			}
		}
		function dispatchReducerAction(fiber, queue, action) {
			var lane = requestUpdateLane();
			action = {
				lane,
				revertLane: 0,
				gesture: null,
				action,
				hasEagerState: !1,
				eagerState: null,
				next: null
			};
			isRenderPhaseUpdate(fiber) ? enqueueRenderPhaseUpdate(queue, action) : (action = enqueueConcurrentHookUpdate(fiber, queue, action, lane), null !== action && (scheduleUpdateOnFiber(action, fiber, lane), entangleTransitionUpdate(action, queue, lane)));
		}
		function dispatchSetState(fiber, queue, action) {
			dispatchSetStateInternal(fiber, queue, action, requestUpdateLane());
		}
		function dispatchSetStateInternal(fiber, queue, action, lane) {
			var update = {
				lane,
				revertLane: 0,
				gesture: null,
				action,
				hasEagerState: !1,
				eagerState: null,
				next: null
			};
			if (isRenderPhaseUpdate(fiber)) enqueueRenderPhaseUpdate(queue, update);
			else {
				var alternate = fiber.alternate;
				if (0 === fiber.lanes && (null === alternate || 0 === alternate.lanes) && (alternate = queue.lastRenderedReducer, null !== alternate)) try {
					var currentState = queue.lastRenderedState, eagerState = alternate(currentState, action);
					update.hasEagerState = !0;
					update.eagerState = eagerState;
					if (objectIs(eagerState, currentState)) return enqueueUpdate$1(fiber, queue, update, 0), null === workInProgressRoot && finishQueueingConcurrentUpdates(), !1;
				} catch (error) {}
				action = enqueueConcurrentHookUpdate(fiber, queue, update, lane);
				if (null !== action) return scheduleUpdateOnFiber(action, fiber, lane), entangleTransitionUpdate(action, queue, lane), !0;
			}
			return !1;
		}
		function dispatchOptimisticSetState(fiber, throwIfDuringRender, queue, action) {
			action = {
				lane: 2,
				revertLane: requestTransitionLane(),
				gesture: null,
				action,
				hasEagerState: !1,
				eagerState: null,
				next: null
			};
			if (isRenderPhaseUpdate(fiber)) {
				if (throwIfDuringRender) throw Error(formatProdErrorMessage(479));
			} else throwIfDuringRender = enqueueConcurrentHookUpdate(fiber, queue, action, 2), null !== throwIfDuringRender && scheduleUpdateOnFiber(throwIfDuringRender, fiber, 2);
		}
		function isRenderPhaseUpdate(fiber) {
			var alternate = fiber.alternate;
			return fiber === currentlyRenderingFiber || null !== alternate && alternate === currentlyRenderingFiber;
		}
		function enqueueRenderPhaseUpdate(queue, update) {
			didScheduleRenderPhaseUpdateDuringThisPass = didScheduleRenderPhaseUpdate = !0;
			var pending = queue.pending;
			null === pending ? update.next = update : (update.next = pending.next, pending.next = update);
			queue.pending = update;
		}
		function entangleTransitionUpdate(root$1, queue, lane) {
			if (0 !== (lane & 4194048)) {
				var queueLanes = queue.lanes;
				queueLanes &= root$1.pendingLanes;
				lane |= queueLanes;
				queue.lanes = lane;
				markRootEntangled(root$1, lane);
			}
		}
		var ContextOnlyDispatcher = {
			readContext,
			use: use$1,
			useCallback: throwInvalidHookError,
			useContext: throwInvalidHookError,
			useEffect: throwInvalidHookError,
			useImperativeHandle: throwInvalidHookError,
			useLayoutEffect: throwInvalidHookError,
			useInsertionEffect: throwInvalidHookError,
			useMemo: throwInvalidHookError,
			useReducer: throwInvalidHookError,
			useRef: throwInvalidHookError,
			useState: throwInvalidHookError,
			useDebugValue: throwInvalidHookError,
			useDeferredValue: throwInvalidHookError,
			useTransition: throwInvalidHookError,
			useSyncExternalStore: throwInvalidHookError,
			useId: throwInvalidHookError,
			useHostTransitionStatus: throwInvalidHookError,
			useFormState: throwInvalidHookError,
			useActionState: throwInvalidHookError,
			useOptimistic: throwInvalidHookError,
			useMemoCache: throwInvalidHookError,
			useCacheRefresh: throwInvalidHookError
		};
		ContextOnlyDispatcher.useEffectEvent = throwInvalidHookError;
		var HooksDispatcherOnMount = {
			readContext,
			use: use$1,
			useCallback: function(callback, deps) {
				mountWorkInProgressHook().memoizedState = [callback, void 0 === deps ? null : deps];
				return callback;
			},
			useContext: readContext,
			useEffect: mountEffect,
			useImperativeHandle: function(ref, create, deps) {
				deps = null !== deps && void 0 !== deps ? deps.concat([ref]) : null;
				mountEffectImpl(4194308, 4, imperativeHandleEffect.bind(null, create, ref), deps);
			},
			useLayoutEffect: function(create, deps) {
				return mountEffectImpl(4194308, 4, create, deps);
			},
			useInsertionEffect: function(create, deps) {
				mountEffectImpl(4, 2, create, deps);
			},
			useMemo: function(nextCreate, deps) {
				var hook = mountWorkInProgressHook();
				deps = void 0 === deps ? null : deps;
				var nextValue = nextCreate();
				if (shouldDoubleInvokeUserFnsInHooksDEV) {
					setIsStrictModeForDevtools(!0);
					try {
						nextCreate();
					} finally {
						setIsStrictModeForDevtools(!1);
					}
				}
				hook.memoizedState = [nextValue, deps];
				return nextValue;
			},
			useReducer: function(reducer, initialArg, init) {
				var hook = mountWorkInProgressHook();
				if (void 0 !== init) {
					var initialState = init(initialArg);
					if (shouldDoubleInvokeUserFnsInHooksDEV) {
						setIsStrictModeForDevtools(!0);
						try {
							init(initialArg);
						} finally {
							setIsStrictModeForDevtools(!1);
						}
					}
				} else initialState = initialArg;
				hook.memoizedState = hook.baseState = initialState;
				reducer = {
					pending: null,
					lanes: 0,
					dispatch: null,
					lastRenderedReducer: reducer,
					lastRenderedState: initialState
				};
				hook.queue = reducer;
				reducer = reducer.dispatch = dispatchReducerAction.bind(null, currentlyRenderingFiber, reducer);
				return [hook.memoizedState, reducer];
			},
			useRef: function(initialValue) {
				var hook = mountWorkInProgressHook();
				initialValue = { current: initialValue };
				return hook.memoizedState = initialValue;
			},
			useState: function(initialState) {
				initialState = mountStateImpl(initialState);
				var queue = initialState.queue, dispatch = dispatchSetState.bind(null, currentlyRenderingFiber, queue);
				queue.dispatch = dispatch;
				return [initialState.memoizedState, dispatch];
			},
			useDebugValue: mountDebugValue,
			useDeferredValue: function(value, initialValue) {
				return mountDeferredValueImpl(mountWorkInProgressHook(), value, initialValue);
			},
			useTransition: function() {
				var stateHook = mountStateImpl(!1);
				stateHook = startTransition.bind(null, currentlyRenderingFiber, stateHook.queue, !0, !1);
				mountWorkInProgressHook().memoizedState = stateHook;
				return [!1, stateHook];
			},
			useSyncExternalStore: function(subscribe, getSnapshot, getServerSnapshot) {
				var fiber = currentlyRenderingFiber, hook = mountWorkInProgressHook();
				if (isHydrating) {
					if (void 0 === getServerSnapshot) throw Error(formatProdErrorMessage(407));
					getServerSnapshot = getServerSnapshot();
				} else {
					getServerSnapshot = getSnapshot();
					if (null === workInProgressRoot) throw Error(formatProdErrorMessage(349));
					0 !== (workInProgressRootRenderLanes & 127) || pushStoreConsistencyCheck(fiber, getSnapshot, getServerSnapshot);
				}
				hook.memoizedState = getServerSnapshot;
				var inst = {
					value: getServerSnapshot,
					getSnapshot
				};
				hook.queue = inst;
				mountEffect(subscribeToStore.bind(null, fiber, inst, subscribe), [subscribe]);
				fiber.flags |= 2048;
				pushSimpleEffect(9, { destroy: void 0 }, updateStoreInstance.bind(null, fiber, inst, getServerSnapshot, getSnapshot), null);
				return getServerSnapshot;
			},
			useId: function() {
				var hook = mountWorkInProgressHook(), identifierPrefix = workInProgressRoot.identifierPrefix;
				if (isHydrating) {
					var JSCompiler_inline_result = treeContextOverflow;
					var idWithLeadingBit = treeContextId;
					JSCompiler_inline_result = (idWithLeadingBit & ~(1 << 32 - clz32(idWithLeadingBit) - 1)).toString(32) + JSCompiler_inline_result;
					identifierPrefix = "_" + identifierPrefix + "R_" + JSCompiler_inline_result;
					JSCompiler_inline_result = localIdCounter++;
					0 < JSCompiler_inline_result && (identifierPrefix += "H" + JSCompiler_inline_result.toString(32));
					identifierPrefix += "_";
				} else JSCompiler_inline_result = globalClientIdCounter++, identifierPrefix = "_" + identifierPrefix + "r_" + JSCompiler_inline_result.toString(32) + "_";
				return hook.memoizedState = identifierPrefix;
			},
			useHostTransitionStatus,
			useFormState: mountActionState,
			useActionState: mountActionState,
			useOptimistic: function(passthrough) {
				var hook = mountWorkInProgressHook();
				hook.memoizedState = hook.baseState = passthrough;
				var queue = {
					pending: null,
					lanes: 0,
					dispatch: null,
					lastRenderedReducer: null,
					lastRenderedState: null
				};
				hook.queue = queue;
				hook = dispatchOptimisticSetState.bind(null, currentlyRenderingFiber, !0, queue);
				queue.dispatch = hook;
				return [passthrough, hook];
			},
			useMemoCache,
			useCacheRefresh: function() {
				return mountWorkInProgressHook().memoizedState = refreshCache.bind(null, currentlyRenderingFiber);
			},
			useEffectEvent: function(callback) {
				var hook = mountWorkInProgressHook(), ref = { impl: callback };
				hook.memoizedState = ref;
				return function() {
					if (0 !== (executionContext & 2)) throw Error(formatProdErrorMessage(440));
					return ref.impl.apply(void 0, arguments);
				};
			}
		}, HooksDispatcherOnUpdate = {
			readContext,
			use: use$1,
			useCallback: updateCallback,
			useContext: readContext,
			useEffect: updateEffect,
			useImperativeHandle: updateImperativeHandle,
			useInsertionEffect: updateInsertionEffect,
			useLayoutEffect: updateLayoutEffect,
			useMemo: updateMemo,
			useReducer: updateReducer,
			useRef: updateRef,
			useState: function() {
				return updateReducer(basicStateReducer);
			},
			useDebugValue: mountDebugValue,
			useDeferredValue: function(value, initialValue) {
				return updateDeferredValueImpl(updateWorkInProgressHook(), currentHook.memoizedState, value, initialValue);
			},
			useTransition: function() {
				var booleanOrThenable = updateReducer(basicStateReducer)[0], start = updateWorkInProgressHook().memoizedState;
				return ["boolean" === typeof booleanOrThenable ? booleanOrThenable : useThenable(booleanOrThenable), start];
			},
			useSyncExternalStore: updateSyncExternalStore,
			useId: updateId,
			useHostTransitionStatus,
			useFormState: updateActionState,
			useActionState: updateActionState,
			useOptimistic: function(passthrough, reducer) {
				return updateOptimisticImpl(updateWorkInProgressHook(), currentHook, passthrough, reducer);
			},
			useMemoCache,
			useCacheRefresh: updateRefresh
		};
		HooksDispatcherOnUpdate.useEffectEvent = updateEvent;
		var HooksDispatcherOnRerender = {
			readContext,
			use: use$1,
			useCallback: updateCallback,
			useContext: readContext,
			useEffect: updateEffect,
			useImperativeHandle: updateImperativeHandle,
			useInsertionEffect: updateInsertionEffect,
			useLayoutEffect: updateLayoutEffect,
			useMemo: updateMemo,
			useReducer: rerenderReducer,
			useRef: updateRef,
			useState: function() {
				return rerenderReducer(basicStateReducer);
			},
			useDebugValue: mountDebugValue,
			useDeferredValue: function(value, initialValue) {
				var hook = updateWorkInProgressHook();
				return null === currentHook ? mountDeferredValueImpl(hook, value, initialValue) : updateDeferredValueImpl(hook, currentHook.memoizedState, value, initialValue);
			},
			useTransition: function() {
				var booleanOrThenable = rerenderReducer(basicStateReducer)[0], start = updateWorkInProgressHook().memoizedState;
				return ["boolean" === typeof booleanOrThenable ? booleanOrThenable : useThenable(booleanOrThenable), start];
			},
			useSyncExternalStore: updateSyncExternalStore,
			useId: updateId,
			useHostTransitionStatus,
			useFormState: rerenderActionState,
			useActionState: rerenderActionState,
			useOptimistic: function(passthrough, reducer) {
				var hook = updateWorkInProgressHook();
				if (null !== currentHook) return updateOptimisticImpl(hook, currentHook, passthrough, reducer);
				hook.baseState = passthrough;
				return [passthrough, hook.queue.dispatch];
			},
			useMemoCache,
			useCacheRefresh: updateRefresh
		};
		HooksDispatcherOnRerender.useEffectEvent = updateEvent;
		function applyDerivedStateFromProps(workInProgress$1, ctor, getDerivedStateFromProps, nextProps) {
			ctor = workInProgress$1.memoizedState;
			getDerivedStateFromProps = getDerivedStateFromProps(nextProps, ctor);
			getDerivedStateFromProps = null === getDerivedStateFromProps || void 0 === getDerivedStateFromProps ? ctor : assign({}, ctor, getDerivedStateFromProps);
			workInProgress$1.memoizedState = getDerivedStateFromProps;
			0 === workInProgress$1.lanes && (workInProgress$1.updateQueue.baseState = getDerivedStateFromProps);
		}
		var classComponentUpdater = {
			enqueueSetState: function(inst, payload, callback) {
				inst = inst._reactInternals;
				var lane = requestUpdateLane(), update = createUpdate(lane);
				update.payload = payload;
				void 0 !== callback && null !== callback && (update.callback = callback);
				payload = enqueueUpdate(inst, update, lane);
				null !== payload && (scheduleUpdateOnFiber(payload, inst, lane), entangleTransitions(payload, inst, lane));
			},
			enqueueReplaceState: function(inst, payload, callback) {
				inst = inst._reactInternals;
				var lane = requestUpdateLane(), update = createUpdate(lane);
				update.tag = 1;
				update.payload = payload;
				void 0 !== callback && null !== callback && (update.callback = callback);
				payload = enqueueUpdate(inst, update, lane);
				null !== payload && (scheduleUpdateOnFiber(payload, inst, lane), entangleTransitions(payload, inst, lane));
			},
			enqueueForceUpdate: function(inst, callback) {
				inst = inst._reactInternals;
				var lane = requestUpdateLane(), update = createUpdate(lane);
				update.tag = 2;
				void 0 !== callback && null !== callback && (update.callback = callback);
				callback = enqueueUpdate(inst, update, lane);
				null !== callback && (scheduleUpdateOnFiber(callback, inst, lane), entangleTransitions(callback, inst, lane));
			}
		};
		function checkShouldComponentUpdate(workInProgress$1, ctor, oldProps, newProps, oldState, newState, nextContext) {
			workInProgress$1 = workInProgress$1.stateNode;
			return "function" === typeof workInProgress$1.shouldComponentUpdate ? workInProgress$1.shouldComponentUpdate(newProps, newState, nextContext) : ctor.prototype && ctor.prototype.isPureReactComponent ? !shallowEqual(oldProps, newProps) || !shallowEqual(oldState, newState) : !0;
		}
		function callComponentWillReceiveProps(workInProgress$1, instance, newProps, nextContext) {
			workInProgress$1 = instance.state;
			"function" === typeof instance.componentWillReceiveProps && instance.componentWillReceiveProps(newProps, nextContext);
			"function" === typeof instance.UNSAFE_componentWillReceiveProps && instance.UNSAFE_componentWillReceiveProps(newProps, nextContext);
			instance.state !== workInProgress$1 && classComponentUpdater.enqueueReplaceState(instance, instance.state, null);
		}
		function resolveClassComponentProps(Component$1, baseProps) {
			var newProps = baseProps;
			if ("ref" in baseProps) {
				newProps = {};
				for (var propName in baseProps) "ref" !== propName && (newProps[propName] = baseProps[propName]);
			}
			if (Component$1 = Component$1.defaultProps) {
				newProps === baseProps && (newProps = assign({}, newProps));
				for (var propName$73 in Component$1) void 0 === newProps[propName$73] && (newProps[propName$73] = Component$1[propName$73]);
			}
			return newProps;
		}
		function defaultOnUncaughtError(error) {
			reportGlobalError(error);
		}
		function defaultOnCaughtError(error) {
			console.error(error);
		}
		function defaultOnRecoverableError(error) {
			reportGlobalError(error);
		}
		function logUncaughtError(root$1, errorInfo) {
			try {
				var onUncaughtError = root$1.onUncaughtError;
				onUncaughtError(errorInfo.value, { componentStack: errorInfo.stack });
			} catch (e$74) {
				setTimeout(function() {
					throw e$74;
				});
			}
		}
		function logCaughtError(root$1, boundary, errorInfo) {
			try {
				var onCaughtError = root$1.onCaughtError;
				onCaughtError(errorInfo.value, {
					componentStack: errorInfo.stack,
					errorBoundary: 1 === boundary.tag ? boundary.stateNode : null
				});
			} catch (e$75) {
				setTimeout(function() {
					throw e$75;
				});
			}
		}
		function createRootErrorUpdate(root$1, errorInfo, lane) {
			lane = createUpdate(lane);
			lane.tag = 3;
			lane.payload = { element: null };
			lane.callback = function() {
				logUncaughtError(root$1, errorInfo);
			};
			return lane;
		}
		function createClassErrorUpdate(lane) {
			lane = createUpdate(lane);
			lane.tag = 3;
			return lane;
		}
		function initializeClassErrorUpdate(update, root$1, fiber, errorInfo) {
			var getDerivedStateFromError = fiber.type.getDerivedStateFromError;
			if ("function" === typeof getDerivedStateFromError) {
				var error = errorInfo.value;
				update.payload = function() {
					return getDerivedStateFromError(error);
				};
				update.callback = function() {
					logCaughtError(root$1, fiber, errorInfo);
				};
			}
			var inst = fiber.stateNode;
			null !== inst && "function" === typeof inst.componentDidCatch && (update.callback = function() {
				logCaughtError(root$1, fiber, errorInfo);
				"function" !== typeof getDerivedStateFromError && (null === legacyErrorBoundariesThatAlreadyFailed ? legacyErrorBoundariesThatAlreadyFailed = new Set([this]) : legacyErrorBoundariesThatAlreadyFailed.add(this));
				var stack = errorInfo.stack;
				this.componentDidCatch(errorInfo.value, { componentStack: null !== stack ? stack : "" });
			});
		}
		function throwException(root$1, returnFiber, sourceFiber, value, rootRenderLanes) {
			sourceFiber.flags |= 32768;
			if (null !== value && "object" === typeof value && "function" === typeof value.then) {
				returnFiber = sourceFiber.alternate;
				null !== returnFiber && propagateParentContextChanges(returnFiber, sourceFiber, rootRenderLanes, !0);
				sourceFiber = suspenseHandlerStackCursor.current;
				if (null !== sourceFiber) {
					switch (sourceFiber.tag) {
						case 31:
						case 13: return null === shellBoundary ? renderDidSuspendDelayIfPossible() : null === sourceFiber.alternate && 0 === workInProgressRootExitStatus && (workInProgressRootExitStatus = 3), sourceFiber.flags &= -257, sourceFiber.flags |= 65536, sourceFiber.lanes = rootRenderLanes, value === noopSuspenseyCommitThenable ? sourceFiber.flags |= 16384 : (returnFiber = sourceFiber.updateQueue, null === returnFiber ? sourceFiber.updateQueue = new Set([value]) : returnFiber.add(value), attachPingListener(root$1, value, rootRenderLanes)), !1;
						case 22: return sourceFiber.flags |= 65536, value === noopSuspenseyCommitThenable ? sourceFiber.flags |= 16384 : (returnFiber = sourceFiber.updateQueue, null === returnFiber ? (returnFiber = {
							transitions: null,
							markerInstances: null,
							retryQueue: new Set([value])
						}, sourceFiber.updateQueue = returnFiber) : (sourceFiber = returnFiber.retryQueue, null === sourceFiber ? returnFiber.retryQueue = new Set([value]) : sourceFiber.add(value)), attachPingListener(root$1, value, rootRenderLanes)), !1;
					}
					throw Error(formatProdErrorMessage(435, sourceFiber.tag));
				}
				attachPingListener(root$1, value, rootRenderLanes);
				renderDidSuspendDelayIfPossible();
				return !1;
			}
			if (isHydrating) return returnFiber = suspenseHandlerStackCursor.current, null !== returnFiber ? (0 === (returnFiber.flags & 65536) && (returnFiber.flags |= 256), returnFiber.flags |= 65536, returnFiber.lanes = rootRenderLanes, value !== HydrationMismatchException && (root$1 = Error(formatProdErrorMessage(422), { cause: value }), queueHydrationError(createCapturedValueAtFiber(root$1, sourceFiber)))) : (value !== HydrationMismatchException && (returnFiber = Error(formatProdErrorMessage(423), { cause: value }), queueHydrationError(createCapturedValueAtFiber(returnFiber, sourceFiber))), root$1 = root$1.current.alternate, root$1.flags |= 65536, rootRenderLanes &= -rootRenderLanes, root$1.lanes |= rootRenderLanes, value = createCapturedValueAtFiber(value, sourceFiber), rootRenderLanes = createRootErrorUpdate(root$1.stateNode, value, rootRenderLanes), enqueueCapturedUpdate(root$1, rootRenderLanes), 4 !== workInProgressRootExitStatus && (workInProgressRootExitStatus = 2)), !1;
			var wrapperError = Error(formatProdErrorMessage(520), { cause: value });
			wrapperError = createCapturedValueAtFiber(wrapperError, sourceFiber);
			null === workInProgressRootConcurrentErrors ? workInProgressRootConcurrentErrors = [wrapperError] : workInProgressRootConcurrentErrors.push(wrapperError);
			4 !== workInProgressRootExitStatus && (workInProgressRootExitStatus = 2);
			if (null === returnFiber) return !0;
			value = createCapturedValueAtFiber(value, sourceFiber);
			sourceFiber = returnFiber;
			do {
				switch (sourceFiber.tag) {
					case 3: return sourceFiber.flags |= 65536, root$1 = rootRenderLanes & -rootRenderLanes, sourceFiber.lanes |= root$1, root$1 = createRootErrorUpdate(sourceFiber.stateNode, value, root$1), enqueueCapturedUpdate(sourceFiber, root$1), !1;
					case 1: if (returnFiber = sourceFiber.type, wrapperError = sourceFiber.stateNode, 0 === (sourceFiber.flags & 128) && ("function" === typeof returnFiber.getDerivedStateFromError || null !== wrapperError && "function" === typeof wrapperError.componentDidCatch && (null === legacyErrorBoundariesThatAlreadyFailed || !legacyErrorBoundariesThatAlreadyFailed.has(wrapperError)))) return sourceFiber.flags |= 65536, rootRenderLanes &= -rootRenderLanes, sourceFiber.lanes |= rootRenderLanes, rootRenderLanes = createClassErrorUpdate(rootRenderLanes), initializeClassErrorUpdate(rootRenderLanes, root$1, sourceFiber, value), enqueueCapturedUpdate(sourceFiber, rootRenderLanes), !1;
				}
				sourceFiber = sourceFiber.return;
			} while (null !== sourceFiber);
			return !1;
		}
		var SelectiveHydrationException = Error(formatProdErrorMessage(461)), didReceiveUpdate = !1;
		function reconcileChildren(current, workInProgress$1, nextChildren, renderLanes$1) {
			workInProgress$1.child = null === current ? mountChildFibers(workInProgress$1, null, nextChildren, renderLanes$1) : reconcileChildFibers(workInProgress$1, current.child, nextChildren, renderLanes$1);
		}
		function updateForwardRef(current, workInProgress$1, Component$1, nextProps, renderLanes$1) {
			Component$1 = Component$1.render;
			var ref = workInProgress$1.ref;
			if ("ref" in nextProps) {
				var propsWithoutRef = {};
				for (var key in nextProps) "ref" !== key && (propsWithoutRef[key] = nextProps[key]);
			} else propsWithoutRef = nextProps;
			prepareToReadContext(workInProgress$1);
			nextProps = renderWithHooks(current, workInProgress$1, Component$1, propsWithoutRef, ref, renderLanes$1);
			key = checkDidRenderIdHook();
			if (null !== current && !didReceiveUpdate) return bailoutHooks(current, workInProgress$1, renderLanes$1), bailoutOnAlreadyFinishedWork(current, workInProgress$1, renderLanes$1);
			isHydrating && key && pushMaterializedTreeId(workInProgress$1);
			workInProgress$1.flags |= 1;
			reconcileChildren(current, workInProgress$1, nextProps, renderLanes$1);
			return workInProgress$1.child;
		}
		function updateMemoComponent(current, workInProgress$1, Component$1, nextProps, renderLanes$1) {
			if (null === current) {
				var type = Component$1.type;
				if ("function" === typeof type && !shouldConstruct(type) && void 0 === type.defaultProps && null === Component$1.compare) return workInProgress$1.tag = 15, workInProgress$1.type = type, updateSimpleMemoComponent(current, workInProgress$1, type, nextProps, renderLanes$1);
				current = createFiberFromTypeAndProps(Component$1.type, null, nextProps, workInProgress$1, workInProgress$1.mode, renderLanes$1);
				current.ref = workInProgress$1.ref;
				current.return = workInProgress$1;
				return workInProgress$1.child = current;
			}
			type = current.child;
			if (!checkScheduledUpdateOrContext(current, renderLanes$1)) {
				var prevProps = type.memoizedProps;
				Component$1 = Component$1.compare;
				Component$1 = null !== Component$1 ? Component$1 : shallowEqual;
				if (Component$1(prevProps, nextProps) && current.ref === workInProgress$1.ref) return bailoutOnAlreadyFinishedWork(current, workInProgress$1, renderLanes$1);
			}
			workInProgress$1.flags |= 1;
			current = createWorkInProgress(type, nextProps);
			current.ref = workInProgress$1.ref;
			current.return = workInProgress$1;
			return workInProgress$1.child = current;
		}
		function updateSimpleMemoComponent(current, workInProgress$1, Component$1, nextProps, renderLanes$1) {
			if (null !== current) {
				var prevProps = current.memoizedProps;
				if (shallowEqual(prevProps, nextProps) && current.ref === workInProgress$1.ref) if (didReceiveUpdate = !1, workInProgress$1.pendingProps = nextProps = prevProps, checkScheduledUpdateOrContext(current, renderLanes$1)) 0 !== (current.flags & 131072) && (didReceiveUpdate = !0);
				else return workInProgress$1.lanes = current.lanes, bailoutOnAlreadyFinishedWork(current, workInProgress$1, renderLanes$1);
			}
			return updateFunctionComponent(current, workInProgress$1, Component$1, nextProps, renderLanes$1);
		}
		function updateOffscreenComponent(current, workInProgress$1, renderLanes$1, nextProps) {
			var nextChildren = nextProps.children, prevState = null !== current ? current.memoizedState : null;
			null === current && null === workInProgress$1.stateNode && (workInProgress$1.stateNode = {
				_visibility: 1,
				_pendingMarkers: null,
				_retryCache: null,
				_transitions: null
			});
			if ("hidden" === nextProps.mode) {
				if (0 !== (workInProgress$1.flags & 128)) {
					prevState = null !== prevState ? prevState.baseLanes | renderLanes$1 : renderLanes$1;
					if (null !== current) {
						nextProps = workInProgress$1.child = current.child;
						for (nextChildren = 0; null !== nextProps;) nextChildren = nextChildren | nextProps.lanes | nextProps.childLanes, nextProps = nextProps.sibling;
						nextProps = nextChildren & ~prevState;
					} else nextProps = 0, workInProgress$1.child = null;
					return deferHiddenOffscreenComponent(current, workInProgress$1, prevState, renderLanes$1, nextProps);
				}
				if (0 !== (renderLanes$1 & 536870912)) workInProgress$1.memoizedState = {
					baseLanes: 0,
					cachePool: null
				}, null !== current && pushTransition(workInProgress$1, null !== prevState ? prevState.cachePool : null), null !== prevState ? pushHiddenContext(workInProgress$1, prevState) : reuseHiddenContextOnStack(), pushOffscreenSuspenseHandler(workInProgress$1);
				else return nextProps = workInProgress$1.lanes = 536870912, deferHiddenOffscreenComponent(current, workInProgress$1, null !== prevState ? prevState.baseLanes | renderLanes$1 : renderLanes$1, renderLanes$1, nextProps);
			} else null !== prevState ? (pushTransition(workInProgress$1, prevState.cachePool), pushHiddenContext(workInProgress$1, prevState), reuseSuspenseHandlerOnStack(workInProgress$1), workInProgress$1.memoizedState = null) : (null !== current && pushTransition(workInProgress$1, null), reuseHiddenContextOnStack(), reuseSuspenseHandlerOnStack(workInProgress$1));
			reconcileChildren(current, workInProgress$1, nextChildren, renderLanes$1);
			return workInProgress$1.child;
		}
		function bailoutOffscreenComponent(current, workInProgress$1) {
			null !== current && 22 === current.tag || null !== workInProgress$1.stateNode || (workInProgress$1.stateNode = {
				_visibility: 1,
				_pendingMarkers: null,
				_retryCache: null,
				_transitions: null
			});
			return workInProgress$1.sibling;
		}
		function deferHiddenOffscreenComponent(current, workInProgress$1, nextBaseLanes, renderLanes$1, remainingChildLanes) {
			var JSCompiler_inline_result = peekCacheFromPool();
			JSCompiler_inline_result = null === JSCompiler_inline_result ? null : {
				parent: CacheContext._currentValue,
				pool: JSCompiler_inline_result
			};
			workInProgress$1.memoizedState = {
				baseLanes: nextBaseLanes,
				cachePool: JSCompiler_inline_result
			};
			null !== current && pushTransition(workInProgress$1, null);
			reuseHiddenContextOnStack();
			pushOffscreenSuspenseHandler(workInProgress$1);
			null !== current && propagateParentContextChanges(current, workInProgress$1, renderLanes$1, !0);
			workInProgress$1.childLanes = remainingChildLanes;
			return null;
		}
		function mountActivityChildren(workInProgress$1, nextProps) {
			nextProps = mountWorkInProgressOffscreenFiber({
				mode: nextProps.mode,
				children: nextProps.children
			}, workInProgress$1.mode);
			nextProps.ref = workInProgress$1.ref;
			workInProgress$1.child = nextProps;
			nextProps.return = workInProgress$1;
			return nextProps;
		}
		function retryActivityComponentWithoutHydrating(current, workInProgress$1, renderLanes$1) {
			reconcileChildFibers(workInProgress$1, current.child, null, renderLanes$1);
			current = mountActivityChildren(workInProgress$1, workInProgress$1.pendingProps);
			current.flags |= 2;
			popSuspenseHandler(workInProgress$1);
			workInProgress$1.memoizedState = null;
			return current;
		}
		function updateActivityComponent(current, workInProgress$1, renderLanes$1) {
			var nextProps = workInProgress$1.pendingProps, didSuspend = 0 !== (workInProgress$1.flags & 128);
			workInProgress$1.flags &= -129;
			if (null === current) {
				if (isHydrating) {
					if ("hidden" === nextProps.mode) return current = mountActivityChildren(workInProgress$1, nextProps), workInProgress$1.lanes = 536870912, bailoutOffscreenComponent(null, current);
					pushDehydratedActivitySuspenseHandler(workInProgress$1);
					(current = nextHydratableInstance) ? (current = canHydrateHydrationBoundary(current, rootOrSingletonContext), current = null !== current && "&" === current.data ? current : null, null !== current && (workInProgress$1.memoizedState = {
						dehydrated: current,
						treeContext: null !== treeContextProvider ? {
							id: treeContextId,
							overflow: treeContextOverflow
						} : null,
						retryLane: 536870912,
						hydrationErrors: null
					}, renderLanes$1 = createFiberFromDehydratedFragment(current), renderLanes$1.return = workInProgress$1, workInProgress$1.child = renderLanes$1, hydrationParentFiber = workInProgress$1, nextHydratableInstance = null)) : current = null;
					if (null === current) throw throwOnHydrationMismatch(workInProgress$1);
					workInProgress$1.lanes = 536870912;
					return null;
				}
				return mountActivityChildren(workInProgress$1, nextProps);
			}
			var prevState = current.memoizedState;
			if (null !== prevState) {
				var dehydrated = prevState.dehydrated;
				pushDehydratedActivitySuspenseHandler(workInProgress$1);
				if (didSuspend) if (workInProgress$1.flags & 256) workInProgress$1.flags &= -257, workInProgress$1 = retryActivityComponentWithoutHydrating(current, workInProgress$1, renderLanes$1);
				else if (null !== workInProgress$1.memoizedState) workInProgress$1.child = current.child, workInProgress$1.flags |= 128, workInProgress$1 = null;
				else throw Error(formatProdErrorMessage(558));
				else if (didReceiveUpdate || propagateParentContextChanges(current, workInProgress$1, renderLanes$1, !1), didSuspend = 0 !== (renderLanes$1 & current.childLanes), didReceiveUpdate || didSuspend) {
					nextProps = workInProgressRoot;
					if (null !== nextProps && (dehydrated = getBumpedLaneForHydration(nextProps, renderLanes$1), 0 !== dehydrated && dehydrated !== prevState.retryLane)) throw prevState.retryLane = dehydrated, enqueueConcurrentRenderForLane(current, dehydrated), scheduleUpdateOnFiber(nextProps, current, dehydrated), SelectiveHydrationException;
					renderDidSuspendDelayIfPossible();
					workInProgress$1 = retryActivityComponentWithoutHydrating(current, workInProgress$1, renderLanes$1);
				} else current = prevState.treeContext, nextHydratableInstance = getNextHydratable(dehydrated.nextSibling), hydrationParentFiber = workInProgress$1, isHydrating = !0, hydrationErrors = null, rootOrSingletonContext = !1, null !== current && restoreSuspendedTreeContext(workInProgress$1, current), workInProgress$1 = mountActivityChildren(workInProgress$1, nextProps), workInProgress$1.flags |= 4096;
				return workInProgress$1;
			}
			current = createWorkInProgress(current.child, {
				mode: nextProps.mode,
				children: nextProps.children
			});
			current.ref = workInProgress$1.ref;
			workInProgress$1.child = current;
			current.return = workInProgress$1;
			return current;
		}
		function markRef(current, workInProgress$1) {
			var ref = workInProgress$1.ref;
			if (null === ref) null !== current && null !== current.ref && (workInProgress$1.flags |= 4194816);
			else {
				if ("function" !== typeof ref && "object" !== typeof ref) throw Error(formatProdErrorMessage(284));
				if (null === current || current.ref !== ref) workInProgress$1.flags |= 4194816;
			}
		}
		function updateFunctionComponent(current, workInProgress$1, Component$1, nextProps, renderLanes$1) {
			prepareToReadContext(workInProgress$1);
			Component$1 = renderWithHooks(current, workInProgress$1, Component$1, nextProps, void 0, renderLanes$1);
			nextProps = checkDidRenderIdHook();
			if (null !== current && !didReceiveUpdate) return bailoutHooks(current, workInProgress$1, renderLanes$1), bailoutOnAlreadyFinishedWork(current, workInProgress$1, renderLanes$1);
			isHydrating && nextProps && pushMaterializedTreeId(workInProgress$1);
			workInProgress$1.flags |= 1;
			reconcileChildren(current, workInProgress$1, Component$1, renderLanes$1);
			return workInProgress$1.child;
		}
		function replayFunctionComponent(current, workInProgress$1, nextProps, Component$1, secondArg, renderLanes$1) {
			prepareToReadContext(workInProgress$1);
			workInProgress$1.updateQueue = null;
			nextProps = renderWithHooksAgain(workInProgress$1, Component$1, nextProps, secondArg);
			finishRenderingHooks(current);
			Component$1 = checkDidRenderIdHook();
			if (null !== current && !didReceiveUpdate) return bailoutHooks(current, workInProgress$1, renderLanes$1), bailoutOnAlreadyFinishedWork(current, workInProgress$1, renderLanes$1);
			isHydrating && Component$1 && pushMaterializedTreeId(workInProgress$1);
			workInProgress$1.flags |= 1;
			reconcileChildren(current, workInProgress$1, nextProps, renderLanes$1);
			return workInProgress$1.child;
		}
		function updateClassComponent(current, workInProgress$1, Component$1, nextProps, renderLanes$1) {
			prepareToReadContext(workInProgress$1);
			if (null === workInProgress$1.stateNode) {
				var context = emptyContextObject, contextType = Component$1.contextType;
				"object" === typeof contextType && null !== contextType && (context = readContext(contextType));
				context = new Component$1(nextProps, context);
				workInProgress$1.memoizedState = null !== context.state && void 0 !== context.state ? context.state : null;
				context.updater = classComponentUpdater;
				workInProgress$1.stateNode = context;
				context._reactInternals = workInProgress$1;
				context = workInProgress$1.stateNode;
				context.props = nextProps;
				context.state = workInProgress$1.memoizedState;
				context.refs = {};
				initializeUpdateQueue(workInProgress$1);
				contextType = Component$1.contextType;
				context.context = "object" === typeof contextType && null !== contextType ? readContext(contextType) : emptyContextObject;
				context.state = workInProgress$1.memoizedState;
				contextType = Component$1.getDerivedStateFromProps;
				"function" === typeof contextType && (applyDerivedStateFromProps(workInProgress$1, Component$1, contextType, nextProps), context.state = workInProgress$1.memoizedState);
				"function" === typeof Component$1.getDerivedStateFromProps || "function" === typeof context.getSnapshotBeforeUpdate || "function" !== typeof context.UNSAFE_componentWillMount && "function" !== typeof context.componentWillMount || (contextType = context.state, "function" === typeof context.componentWillMount && context.componentWillMount(), "function" === typeof context.UNSAFE_componentWillMount && context.UNSAFE_componentWillMount(), contextType !== context.state && classComponentUpdater.enqueueReplaceState(context, context.state, null), processUpdateQueue(workInProgress$1, nextProps, context, renderLanes$1), suspendIfUpdateReadFromEntangledAsyncAction(), context.state = workInProgress$1.memoizedState);
				"function" === typeof context.componentDidMount && (workInProgress$1.flags |= 4194308);
				nextProps = !0;
			} else if (null === current) {
				context = workInProgress$1.stateNode;
				var unresolvedOldProps = workInProgress$1.memoizedProps, oldProps = resolveClassComponentProps(Component$1, unresolvedOldProps);
				context.props = oldProps;
				var oldContext = context.context, contextType$jscomp$0 = Component$1.contextType;
				contextType = emptyContextObject;
				"object" === typeof contextType$jscomp$0 && null !== contextType$jscomp$0 && (contextType = readContext(contextType$jscomp$0));
				var getDerivedStateFromProps = Component$1.getDerivedStateFromProps;
				contextType$jscomp$0 = "function" === typeof getDerivedStateFromProps || "function" === typeof context.getSnapshotBeforeUpdate;
				unresolvedOldProps = workInProgress$1.pendingProps !== unresolvedOldProps;
				contextType$jscomp$0 || "function" !== typeof context.UNSAFE_componentWillReceiveProps && "function" !== typeof context.componentWillReceiveProps || (unresolvedOldProps || oldContext !== contextType) && callComponentWillReceiveProps(workInProgress$1, context, nextProps, contextType);
				hasForceUpdate = !1;
				var oldState = workInProgress$1.memoizedState;
				context.state = oldState;
				processUpdateQueue(workInProgress$1, nextProps, context, renderLanes$1);
				suspendIfUpdateReadFromEntangledAsyncAction();
				oldContext = workInProgress$1.memoizedState;
				unresolvedOldProps || oldState !== oldContext || hasForceUpdate ? ("function" === typeof getDerivedStateFromProps && (applyDerivedStateFromProps(workInProgress$1, Component$1, getDerivedStateFromProps, nextProps), oldContext = workInProgress$1.memoizedState), (oldProps = hasForceUpdate || checkShouldComponentUpdate(workInProgress$1, Component$1, oldProps, nextProps, oldState, oldContext, contextType)) ? (contextType$jscomp$0 || "function" !== typeof context.UNSAFE_componentWillMount && "function" !== typeof context.componentWillMount || ("function" === typeof context.componentWillMount && context.componentWillMount(), "function" === typeof context.UNSAFE_componentWillMount && context.UNSAFE_componentWillMount()), "function" === typeof context.componentDidMount && (workInProgress$1.flags |= 4194308)) : ("function" === typeof context.componentDidMount && (workInProgress$1.flags |= 4194308), workInProgress$1.memoizedProps = nextProps, workInProgress$1.memoizedState = oldContext), context.props = nextProps, context.state = oldContext, context.context = contextType, nextProps = oldProps) : ("function" === typeof context.componentDidMount && (workInProgress$1.flags |= 4194308), nextProps = !1);
			} else {
				context = workInProgress$1.stateNode;
				cloneUpdateQueue(current, workInProgress$1);
				contextType = workInProgress$1.memoizedProps;
				contextType$jscomp$0 = resolveClassComponentProps(Component$1, contextType);
				context.props = contextType$jscomp$0;
				getDerivedStateFromProps = workInProgress$1.pendingProps;
				oldState = context.context;
				oldContext = Component$1.contextType;
				oldProps = emptyContextObject;
				"object" === typeof oldContext && null !== oldContext && (oldProps = readContext(oldContext));
				unresolvedOldProps = Component$1.getDerivedStateFromProps;
				(oldContext = "function" === typeof unresolvedOldProps || "function" === typeof context.getSnapshotBeforeUpdate) || "function" !== typeof context.UNSAFE_componentWillReceiveProps && "function" !== typeof context.componentWillReceiveProps || (contextType !== getDerivedStateFromProps || oldState !== oldProps) && callComponentWillReceiveProps(workInProgress$1, context, nextProps, oldProps);
				hasForceUpdate = !1;
				oldState = workInProgress$1.memoizedState;
				context.state = oldState;
				processUpdateQueue(workInProgress$1, nextProps, context, renderLanes$1);
				suspendIfUpdateReadFromEntangledAsyncAction();
				var newState = workInProgress$1.memoizedState;
				contextType !== getDerivedStateFromProps || oldState !== newState || hasForceUpdate || null !== current && null !== current.dependencies && checkIfContextChanged(current.dependencies) ? ("function" === typeof unresolvedOldProps && (applyDerivedStateFromProps(workInProgress$1, Component$1, unresolvedOldProps, nextProps), newState = workInProgress$1.memoizedState), (contextType$jscomp$0 = hasForceUpdate || checkShouldComponentUpdate(workInProgress$1, Component$1, contextType$jscomp$0, nextProps, oldState, newState, oldProps) || null !== current && null !== current.dependencies && checkIfContextChanged(current.dependencies)) ? (oldContext || "function" !== typeof context.UNSAFE_componentWillUpdate && "function" !== typeof context.componentWillUpdate || ("function" === typeof context.componentWillUpdate && context.componentWillUpdate(nextProps, newState, oldProps), "function" === typeof context.UNSAFE_componentWillUpdate && context.UNSAFE_componentWillUpdate(nextProps, newState, oldProps)), "function" === typeof context.componentDidUpdate && (workInProgress$1.flags |= 4), "function" === typeof context.getSnapshotBeforeUpdate && (workInProgress$1.flags |= 1024)) : ("function" !== typeof context.componentDidUpdate || contextType === current.memoizedProps && oldState === current.memoizedState || (workInProgress$1.flags |= 4), "function" !== typeof context.getSnapshotBeforeUpdate || contextType === current.memoizedProps && oldState === current.memoizedState || (workInProgress$1.flags |= 1024), workInProgress$1.memoizedProps = nextProps, workInProgress$1.memoizedState = newState), context.props = nextProps, context.state = newState, context.context = oldProps, nextProps = contextType$jscomp$0) : ("function" !== typeof context.componentDidUpdate || contextType === current.memoizedProps && oldState === current.memoizedState || (workInProgress$1.flags |= 4), "function" !== typeof context.getSnapshotBeforeUpdate || contextType === current.memoizedProps && oldState === current.memoizedState || (workInProgress$1.flags |= 1024), nextProps = !1);
			}
			context = nextProps;
			markRef(current, workInProgress$1);
			nextProps = 0 !== (workInProgress$1.flags & 128);
			context || nextProps ? (context = workInProgress$1.stateNode, Component$1 = nextProps && "function" !== typeof Component$1.getDerivedStateFromError ? null : context.render(), workInProgress$1.flags |= 1, null !== current && nextProps ? (workInProgress$1.child = reconcileChildFibers(workInProgress$1, current.child, null, renderLanes$1), workInProgress$1.child = reconcileChildFibers(workInProgress$1, null, Component$1, renderLanes$1)) : reconcileChildren(current, workInProgress$1, Component$1, renderLanes$1), workInProgress$1.memoizedState = context.state, current = workInProgress$1.child) : current = bailoutOnAlreadyFinishedWork(current, workInProgress$1, renderLanes$1);
			return current;
		}
		function mountHostRootWithoutHydrating(current, workInProgress$1, nextChildren, renderLanes$1) {
			resetHydrationState();
			workInProgress$1.flags |= 256;
			reconcileChildren(current, workInProgress$1, nextChildren, renderLanes$1);
			return workInProgress$1.child;
		}
		var SUSPENDED_MARKER = {
			dehydrated: null,
			treeContext: null,
			retryLane: 0,
			hydrationErrors: null
		};
		function mountSuspenseOffscreenState(renderLanes$1) {
			return {
				baseLanes: renderLanes$1,
				cachePool: getSuspendedCache()
			};
		}
		function getRemainingWorkInPrimaryTree(current, primaryTreeDidDefer, renderLanes$1) {
			current = null !== current ? current.childLanes & ~renderLanes$1 : 0;
			primaryTreeDidDefer && (current |= workInProgressDeferredLane);
			return current;
		}
		function updateSuspenseComponent(current, workInProgress$1, renderLanes$1) {
			var nextProps = workInProgress$1.pendingProps, showFallback = !1, didSuspend = 0 !== (workInProgress$1.flags & 128), JSCompiler_temp;
			(JSCompiler_temp = didSuspend) || (JSCompiler_temp = null !== current && null === current.memoizedState ? !1 : 0 !== (suspenseStackCursor.current & 2));
			JSCompiler_temp && (showFallback = !0, workInProgress$1.flags &= -129);
			JSCompiler_temp = 0 !== (workInProgress$1.flags & 32);
			workInProgress$1.flags &= -33;
			if (null === current) {
				if (isHydrating) {
					showFallback ? pushPrimaryTreeSuspenseHandler(workInProgress$1) : reuseSuspenseHandlerOnStack(workInProgress$1);
					(current = nextHydratableInstance) ? (current = canHydrateHydrationBoundary(current, rootOrSingletonContext), current = null !== current && "&" !== current.data ? current : null, null !== current && (workInProgress$1.memoizedState = {
						dehydrated: current,
						treeContext: null !== treeContextProvider ? {
							id: treeContextId,
							overflow: treeContextOverflow
						} : null,
						retryLane: 536870912,
						hydrationErrors: null
					}, renderLanes$1 = createFiberFromDehydratedFragment(current), renderLanes$1.return = workInProgress$1, workInProgress$1.child = renderLanes$1, hydrationParentFiber = workInProgress$1, nextHydratableInstance = null)) : current = null;
					if (null === current) throw throwOnHydrationMismatch(workInProgress$1);
					isSuspenseInstanceFallback(current) ? workInProgress$1.lanes = 32 : workInProgress$1.lanes = 536870912;
					return null;
				}
				var nextPrimaryChildren = nextProps.children;
				nextProps = nextProps.fallback;
				if (showFallback) return reuseSuspenseHandlerOnStack(workInProgress$1), showFallback = workInProgress$1.mode, nextPrimaryChildren = mountWorkInProgressOffscreenFiber({
					mode: "hidden",
					children: nextPrimaryChildren
				}, showFallback), nextProps = createFiberFromFragment(nextProps, showFallback, renderLanes$1, null), nextPrimaryChildren.return = workInProgress$1, nextProps.return = workInProgress$1, nextPrimaryChildren.sibling = nextProps, workInProgress$1.child = nextPrimaryChildren, nextProps = workInProgress$1.child, nextProps.memoizedState = mountSuspenseOffscreenState(renderLanes$1), nextProps.childLanes = getRemainingWorkInPrimaryTree(current, JSCompiler_temp, renderLanes$1), workInProgress$1.memoizedState = SUSPENDED_MARKER, bailoutOffscreenComponent(null, nextProps);
				pushPrimaryTreeSuspenseHandler(workInProgress$1);
				return mountSuspensePrimaryChildren(workInProgress$1, nextPrimaryChildren);
			}
			var prevState = current.memoizedState;
			if (null !== prevState && (nextPrimaryChildren = prevState.dehydrated, null !== nextPrimaryChildren)) {
				if (didSuspend) workInProgress$1.flags & 256 ? (pushPrimaryTreeSuspenseHandler(workInProgress$1), workInProgress$1.flags &= -257, workInProgress$1 = retrySuspenseComponentWithoutHydrating(current, workInProgress$1, renderLanes$1)) : null !== workInProgress$1.memoizedState ? (reuseSuspenseHandlerOnStack(workInProgress$1), workInProgress$1.child = current.child, workInProgress$1.flags |= 128, workInProgress$1 = null) : (reuseSuspenseHandlerOnStack(workInProgress$1), nextPrimaryChildren = nextProps.fallback, showFallback = workInProgress$1.mode, nextProps = mountWorkInProgressOffscreenFiber({
					mode: "visible",
					children: nextProps.children
				}, showFallback), nextPrimaryChildren = createFiberFromFragment(nextPrimaryChildren, showFallback, renderLanes$1, null), nextPrimaryChildren.flags |= 2, nextProps.return = workInProgress$1, nextPrimaryChildren.return = workInProgress$1, nextProps.sibling = nextPrimaryChildren, workInProgress$1.child = nextProps, reconcileChildFibers(workInProgress$1, current.child, null, renderLanes$1), nextProps = workInProgress$1.child, nextProps.memoizedState = mountSuspenseOffscreenState(renderLanes$1), nextProps.childLanes = getRemainingWorkInPrimaryTree(current, JSCompiler_temp, renderLanes$1), workInProgress$1.memoizedState = SUSPENDED_MARKER, workInProgress$1 = bailoutOffscreenComponent(null, nextProps));
				else if (pushPrimaryTreeSuspenseHandler(workInProgress$1), isSuspenseInstanceFallback(nextPrimaryChildren)) {
					JSCompiler_temp = nextPrimaryChildren.nextSibling && nextPrimaryChildren.nextSibling.dataset;
					if (JSCompiler_temp) var digest = JSCompiler_temp.dgst;
					JSCompiler_temp = digest;
					nextProps = Error(formatProdErrorMessage(419));
					nextProps.stack = "";
					nextProps.digest = JSCompiler_temp;
					queueHydrationError({
						value: nextProps,
						source: null,
						stack: null
					});
					workInProgress$1 = retrySuspenseComponentWithoutHydrating(current, workInProgress$1, renderLanes$1);
				} else if (didReceiveUpdate || propagateParentContextChanges(current, workInProgress$1, renderLanes$1, !1), JSCompiler_temp = 0 !== (renderLanes$1 & current.childLanes), didReceiveUpdate || JSCompiler_temp) {
					JSCompiler_temp = workInProgressRoot;
					if (null !== JSCompiler_temp && (nextProps = getBumpedLaneForHydration(JSCompiler_temp, renderLanes$1), 0 !== nextProps && nextProps !== prevState.retryLane)) throw prevState.retryLane = nextProps, enqueueConcurrentRenderForLane(current, nextProps), scheduleUpdateOnFiber(JSCompiler_temp, current, nextProps), SelectiveHydrationException;
					isSuspenseInstancePending(nextPrimaryChildren) || renderDidSuspendDelayIfPossible();
					workInProgress$1 = retrySuspenseComponentWithoutHydrating(current, workInProgress$1, renderLanes$1);
				} else isSuspenseInstancePending(nextPrimaryChildren) ? (workInProgress$1.flags |= 192, workInProgress$1.child = current.child, workInProgress$1 = null) : (current = prevState.treeContext, nextHydratableInstance = getNextHydratable(nextPrimaryChildren.nextSibling), hydrationParentFiber = workInProgress$1, isHydrating = !0, hydrationErrors = null, rootOrSingletonContext = !1, null !== current && restoreSuspendedTreeContext(workInProgress$1, current), workInProgress$1 = mountSuspensePrimaryChildren(workInProgress$1, nextProps.children), workInProgress$1.flags |= 4096);
				return workInProgress$1;
			}
			if (showFallback) return reuseSuspenseHandlerOnStack(workInProgress$1), nextPrimaryChildren = nextProps.fallback, showFallback = workInProgress$1.mode, prevState = current.child, digest = prevState.sibling, nextProps = createWorkInProgress(prevState, {
				mode: "hidden",
				children: nextProps.children
			}), nextProps.subtreeFlags = prevState.subtreeFlags & 65011712, null !== digest ? nextPrimaryChildren = createWorkInProgress(digest, nextPrimaryChildren) : (nextPrimaryChildren = createFiberFromFragment(nextPrimaryChildren, showFallback, renderLanes$1, null), nextPrimaryChildren.flags |= 2), nextPrimaryChildren.return = workInProgress$1, nextProps.return = workInProgress$1, nextProps.sibling = nextPrimaryChildren, workInProgress$1.child = nextProps, bailoutOffscreenComponent(null, nextProps), nextProps = workInProgress$1.child, nextPrimaryChildren = current.child.memoizedState, null === nextPrimaryChildren ? nextPrimaryChildren = mountSuspenseOffscreenState(renderLanes$1) : (showFallback = nextPrimaryChildren.cachePool, null !== showFallback ? (prevState = CacheContext._currentValue, showFallback = showFallback.parent !== prevState ? {
				parent: prevState,
				pool: prevState
			} : showFallback) : showFallback = getSuspendedCache(), nextPrimaryChildren = {
				baseLanes: nextPrimaryChildren.baseLanes | renderLanes$1,
				cachePool: showFallback
			}), nextProps.memoizedState = nextPrimaryChildren, nextProps.childLanes = getRemainingWorkInPrimaryTree(current, JSCompiler_temp, renderLanes$1), workInProgress$1.memoizedState = SUSPENDED_MARKER, bailoutOffscreenComponent(current.child, nextProps);
			pushPrimaryTreeSuspenseHandler(workInProgress$1);
			renderLanes$1 = current.child;
			current = renderLanes$1.sibling;
			renderLanes$1 = createWorkInProgress(renderLanes$1, {
				mode: "visible",
				children: nextProps.children
			});
			renderLanes$1.return = workInProgress$1;
			renderLanes$1.sibling = null;
			null !== current && (JSCompiler_temp = workInProgress$1.deletions, null === JSCompiler_temp ? (workInProgress$1.deletions = [current], workInProgress$1.flags |= 16) : JSCompiler_temp.push(current));
			workInProgress$1.child = renderLanes$1;
			workInProgress$1.memoizedState = null;
			return renderLanes$1;
		}
		function mountSuspensePrimaryChildren(workInProgress$1, primaryChildren) {
			primaryChildren = mountWorkInProgressOffscreenFiber({
				mode: "visible",
				children: primaryChildren
			}, workInProgress$1.mode);
			primaryChildren.return = workInProgress$1;
			return workInProgress$1.child = primaryChildren;
		}
		function mountWorkInProgressOffscreenFiber(offscreenProps, mode) {
			offscreenProps = createFiberImplClass(22, offscreenProps, null, mode);
			offscreenProps.lanes = 0;
			return offscreenProps;
		}
		function retrySuspenseComponentWithoutHydrating(current, workInProgress$1, renderLanes$1) {
			reconcileChildFibers(workInProgress$1, current.child, null, renderLanes$1);
			current = mountSuspensePrimaryChildren(workInProgress$1, workInProgress$1.pendingProps.children);
			current.flags |= 2;
			workInProgress$1.memoizedState = null;
			return current;
		}
		function scheduleSuspenseWorkOnFiber(fiber, renderLanes$1, propagationRoot) {
			fiber.lanes |= renderLanes$1;
			var alternate = fiber.alternate;
			null !== alternate && (alternate.lanes |= renderLanes$1);
			scheduleContextWorkOnParentPath(fiber.return, renderLanes$1, propagationRoot);
		}
		function initSuspenseListRenderState(workInProgress$1, isBackwards, tail, lastContentRow, tailMode, treeForkCount$1) {
			var renderState = workInProgress$1.memoizedState;
			null === renderState ? workInProgress$1.memoizedState = {
				isBackwards,
				rendering: null,
				renderingStartTime: 0,
				last: lastContentRow,
				tail,
				tailMode,
				treeForkCount: treeForkCount$1
			} : (renderState.isBackwards = isBackwards, renderState.rendering = null, renderState.renderingStartTime = 0, renderState.last = lastContentRow, renderState.tail = tail, renderState.tailMode = tailMode, renderState.treeForkCount = treeForkCount$1);
		}
		function updateSuspenseListComponent(current, workInProgress$1, renderLanes$1) {
			var nextProps = workInProgress$1.pendingProps, revealOrder = nextProps.revealOrder, tailMode = nextProps.tail;
			nextProps = nextProps.children;
			var suspenseContext = suspenseStackCursor.current, shouldForceFallback = 0 !== (suspenseContext & 2);
			shouldForceFallback ? (suspenseContext = suspenseContext & 1 | 2, workInProgress$1.flags |= 128) : suspenseContext &= 1;
			push(suspenseStackCursor, suspenseContext);
			reconcileChildren(current, workInProgress$1, nextProps, renderLanes$1);
			nextProps = isHydrating ? treeForkCount : 0;
			if (!shouldForceFallback && null !== current && 0 !== (current.flags & 128)) a: for (current = workInProgress$1.child; null !== current;) {
				if (13 === current.tag) null !== current.memoizedState && scheduleSuspenseWorkOnFiber(current, renderLanes$1, workInProgress$1);
				else if (19 === current.tag) scheduleSuspenseWorkOnFiber(current, renderLanes$1, workInProgress$1);
				else if (null !== current.child) {
					current.child.return = current;
					current = current.child;
					continue;
				}
				if (current === workInProgress$1) break a;
				for (; null === current.sibling;) {
					if (null === current.return || current.return === workInProgress$1) break a;
					current = current.return;
				}
				current.sibling.return = current.return;
				current = current.sibling;
			}
			switch (revealOrder) {
				case "forwards":
					renderLanes$1 = workInProgress$1.child;
					for (revealOrder = null; null !== renderLanes$1;) current = renderLanes$1.alternate, null !== current && null === findFirstSuspended(current) && (revealOrder = renderLanes$1), renderLanes$1 = renderLanes$1.sibling;
					renderLanes$1 = revealOrder;
					null === renderLanes$1 ? (revealOrder = workInProgress$1.child, workInProgress$1.child = null) : (revealOrder = renderLanes$1.sibling, renderLanes$1.sibling = null);
					initSuspenseListRenderState(workInProgress$1, !1, revealOrder, renderLanes$1, tailMode, nextProps);
					break;
				case "backwards":
				case "unstable_legacy-backwards":
					renderLanes$1 = null;
					revealOrder = workInProgress$1.child;
					for (workInProgress$1.child = null; null !== revealOrder;) {
						current = revealOrder.alternate;
						if (null !== current && null === findFirstSuspended(current)) {
							workInProgress$1.child = revealOrder;
							break;
						}
						current = revealOrder.sibling;
						revealOrder.sibling = renderLanes$1;
						renderLanes$1 = revealOrder;
						revealOrder = current;
					}
					initSuspenseListRenderState(workInProgress$1, !0, renderLanes$1, null, tailMode, nextProps);
					break;
				case "together":
					initSuspenseListRenderState(workInProgress$1, !1, null, null, void 0, nextProps);
					break;
				default: workInProgress$1.memoizedState = null;
			}
			return workInProgress$1.child;
		}
		function bailoutOnAlreadyFinishedWork(current, workInProgress$1, renderLanes$1) {
			null !== current && (workInProgress$1.dependencies = current.dependencies);
			workInProgressRootSkippedLanes |= workInProgress$1.lanes;
			if (0 === (renderLanes$1 & workInProgress$1.childLanes)) if (null !== current) {
				if (propagateParentContextChanges(current, workInProgress$1, renderLanes$1, !1), 0 === (renderLanes$1 & workInProgress$1.childLanes)) return null;
			} else return null;
			if (null !== current && workInProgress$1.child !== current.child) throw Error(formatProdErrorMessage(153));
			if (null !== workInProgress$1.child) {
				current = workInProgress$1.child;
				renderLanes$1 = createWorkInProgress(current, current.pendingProps);
				workInProgress$1.child = renderLanes$1;
				for (renderLanes$1.return = workInProgress$1; null !== current.sibling;) current = current.sibling, renderLanes$1 = renderLanes$1.sibling = createWorkInProgress(current, current.pendingProps), renderLanes$1.return = workInProgress$1;
				renderLanes$1.sibling = null;
			}
			return workInProgress$1.child;
		}
		function checkScheduledUpdateOrContext(current, renderLanes$1) {
			if (0 !== (current.lanes & renderLanes$1)) return !0;
			current = current.dependencies;
			return null !== current && checkIfContextChanged(current) ? !0 : !1;
		}
		function attemptEarlyBailoutIfNoScheduledUpdate(current, workInProgress$1, renderLanes$1) {
			switch (workInProgress$1.tag) {
				case 3:
					pushHostContainer(workInProgress$1, workInProgress$1.stateNode.containerInfo);
					pushProvider(workInProgress$1, CacheContext, current.memoizedState.cache);
					resetHydrationState();
					break;
				case 27:
				case 5:
					pushHostContext(workInProgress$1);
					break;
				case 4:
					pushHostContainer(workInProgress$1, workInProgress$1.stateNode.containerInfo);
					break;
				case 10:
					pushProvider(workInProgress$1, workInProgress$1.type, workInProgress$1.memoizedProps.value);
					break;
				case 31:
					if (null !== workInProgress$1.memoizedState) return workInProgress$1.flags |= 128, pushDehydratedActivitySuspenseHandler(workInProgress$1), null;
					break;
				case 13:
					var state$102 = workInProgress$1.memoizedState;
					if (null !== state$102) {
						if (null !== state$102.dehydrated) return pushPrimaryTreeSuspenseHandler(workInProgress$1), workInProgress$1.flags |= 128, null;
						if (0 !== (renderLanes$1 & workInProgress$1.child.childLanes)) return updateSuspenseComponent(current, workInProgress$1, renderLanes$1);
						pushPrimaryTreeSuspenseHandler(workInProgress$1);
						current = bailoutOnAlreadyFinishedWork(current, workInProgress$1, renderLanes$1);
						return null !== current ? current.sibling : null;
					}
					pushPrimaryTreeSuspenseHandler(workInProgress$1);
					break;
				case 19:
					var didSuspendBefore = 0 !== (current.flags & 128);
					state$102 = 0 !== (renderLanes$1 & workInProgress$1.childLanes);
					state$102 || (propagateParentContextChanges(current, workInProgress$1, renderLanes$1, !1), state$102 = 0 !== (renderLanes$1 & workInProgress$1.childLanes));
					if (didSuspendBefore) {
						if (state$102) return updateSuspenseListComponent(current, workInProgress$1, renderLanes$1);
						workInProgress$1.flags |= 128;
					}
					didSuspendBefore = workInProgress$1.memoizedState;
					null !== didSuspendBefore && (didSuspendBefore.rendering = null, didSuspendBefore.tail = null, didSuspendBefore.lastEffect = null);
					push(suspenseStackCursor, suspenseStackCursor.current);
					if (state$102) break;
					else return null;
				case 22: return workInProgress$1.lanes = 0, updateOffscreenComponent(current, workInProgress$1, renderLanes$1, workInProgress$1.pendingProps);
				case 24: pushProvider(workInProgress$1, CacheContext, current.memoizedState.cache);
			}
			return bailoutOnAlreadyFinishedWork(current, workInProgress$1, renderLanes$1);
		}
		function beginWork(current, workInProgress$1, renderLanes$1) {
			if (null !== current) if (current.memoizedProps !== workInProgress$1.pendingProps) didReceiveUpdate = !0;
			else {
				if (!checkScheduledUpdateOrContext(current, renderLanes$1) && 0 === (workInProgress$1.flags & 128)) return didReceiveUpdate = !1, attemptEarlyBailoutIfNoScheduledUpdate(current, workInProgress$1, renderLanes$1);
				didReceiveUpdate = 0 !== (current.flags & 131072) ? !0 : !1;
			}
			else didReceiveUpdate = !1, isHydrating && 0 !== (workInProgress$1.flags & 1048576) && pushTreeId(workInProgress$1, treeForkCount, workInProgress$1.index);
			workInProgress$1.lanes = 0;
			switch (workInProgress$1.tag) {
				case 16:
					a: {
						var props = workInProgress$1.pendingProps;
						current = resolveLazy(workInProgress$1.elementType);
						workInProgress$1.type = current;
						if ("function" === typeof current) shouldConstruct(current) ? (props = resolveClassComponentProps(current, props), workInProgress$1.tag = 1, workInProgress$1 = updateClassComponent(null, workInProgress$1, current, props, renderLanes$1)) : (workInProgress$1.tag = 0, workInProgress$1 = updateFunctionComponent(null, workInProgress$1, current, props, renderLanes$1));
						else {
							if (void 0 !== current && null !== current) {
								var $$typeof = current.$$typeof;
								if ($$typeof === REACT_FORWARD_REF_TYPE) {
									workInProgress$1.tag = 11;
									workInProgress$1 = updateForwardRef(null, workInProgress$1, current, props, renderLanes$1);
									break a;
								} else if ($$typeof === REACT_MEMO_TYPE) {
									workInProgress$1.tag = 14;
									workInProgress$1 = updateMemoComponent(null, workInProgress$1, current, props, renderLanes$1);
									break a;
								}
							}
							workInProgress$1 = getComponentNameFromType(current) || current;
							throw Error(formatProdErrorMessage(306, workInProgress$1, ""));
						}
					}
					return workInProgress$1;
				case 0: return updateFunctionComponent(current, workInProgress$1, workInProgress$1.type, workInProgress$1.pendingProps, renderLanes$1);
				case 1: return props = workInProgress$1.type, $$typeof = resolveClassComponentProps(props, workInProgress$1.pendingProps), updateClassComponent(current, workInProgress$1, props, $$typeof, renderLanes$1);
				case 3:
					a: {
						pushHostContainer(workInProgress$1, workInProgress$1.stateNode.containerInfo);
						if (null === current) throw Error(formatProdErrorMessage(387));
						props = workInProgress$1.pendingProps;
						var prevState = workInProgress$1.memoizedState;
						$$typeof = prevState.element;
						cloneUpdateQueue(current, workInProgress$1);
						processUpdateQueue(workInProgress$1, props, null, renderLanes$1);
						var nextState = workInProgress$1.memoizedState;
						props = nextState.cache;
						pushProvider(workInProgress$1, CacheContext, props);
						props !== prevState.cache && propagateContextChanges(workInProgress$1, [CacheContext], renderLanes$1, !0);
						suspendIfUpdateReadFromEntangledAsyncAction();
						props = nextState.element;
						if (prevState.isDehydrated) if (prevState = {
							element: props,
							isDehydrated: !1,
							cache: nextState.cache
						}, workInProgress$1.updateQueue.baseState = prevState, workInProgress$1.memoizedState = prevState, workInProgress$1.flags & 256) {
							workInProgress$1 = mountHostRootWithoutHydrating(current, workInProgress$1, props, renderLanes$1);
							break a;
						} else if (props !== $$typeof) {
							$$typeof = createCapturedValueAtFiber(Error(formatProdErrorMessage(424)), workInProgress$1);
							queueHydrationError($$typeof);
							workInProgress$1 = mountHostRootWithoutHydrating(current, workInProgress$1, props, renderLanes$1);
							break a;
						} else {
							current = workInProgress$1.stateNode.containerInfo;
							switch (current.nodeType) {
								case 9:
									current = current.body;
									break;
								default: current = "HTML" === current.nodeName ? current.ownerDocument.body : current;
							}
							nextHydratableInstance = getNextHydratable(current.firstChild);
							hydrationParentFiber = workInProgress$1;
							isHydrating = !0;
							hydrationErrors = null;
							rootOrSingletonContext = !0;
							renderLanes$1 = mountChildFibers(workInProgress$1, null, props, renderLanes$1);
							for (workInProgress$1.child = renderLanes$1; renderLanes$1;) renderLanes$1.flags = renderLanes$1.flags & -3 | 4096, renderLanes$1 = renderLanes$1.sibling;
						}
						else {
							resetHydrationState();
							if (props === $$typeof) {
								workInProgress$1 = bailoutOnAlreadyFinishedWork(current, workInProgress$1, renderLanes$1);
								break a;
							}
							reconcileChildren(current, workInProgress$1, props, renderLanes$1);
						}
						workInProgress$1 = workInProgress$1.child;
					}
					return workInProgress$1;
				case 26: return markRef(current, workInProgress$1), null === current ? (renderLanes$1 = getResource(workInProgress$1.type, null, workInProgress$1.pendingProps, null)) ? workInProgress$1.memoizedState = renderLanes$1 : isHydrating || (renderLanes$1 = workInProgress$1.type, current = workInProgress$1.pendingProps, props = getOwnerDocumentFromRootContainer(rootInstanceStackCursor.current).createElement(renderLanes$1), props[internalInstanceKey] = workInProgress$1, props[internalPropsKey] = current, setInitialProperties(props, renderLanes$1, current), markNodeAsHoistable(props), workInProgress$1.stateNode = props) : workInProgress$1.memoizedState = getResource(workInProgress$1.type, current.memoizedProps, workInProgress$1.pendingProps, current.memoizedState), null;
				case 27: return pushHostContext(workInProgress$1), null === current && isHydrating && (props = workInProgress$1.stateNode = resolveSingletonInstance(workInProgress$1.type, workInProgress$1.pendingProps, rootInstanceStackCursor.current), hydrationParentFiber = workInProgress$1, rootOrSingletonContext = !0, $$typeof = nextHydratableInstance, isSingletonScope(workInProgress$1.type) ? (previousHydratableOnEnteringScopedSingleton = $$typeof, nextHydratableInstance = getNextHydratable(props.firstChild)) : nextHydratableInstance = $$typeof), reconcileChildren(current, workInProgress$1, workInProgress$1.pendingProps.children, renderLanes$1), markRef(current, workInProgress$1), null === current && (workInProgress$1.flags |= 4194304), workInProgress$1.child;
				case 5:
					if (null === current && isHydrating) {
						if ($$typeof = props = nextHydratableInstance) props = canHydrateInstance(props, workInProgress$1.type, workInProgress$1.pendingProps, rootOrSingletonContext), null !== props ? (workInProgress$1.stateNode = props, hydrationParentFiber = workInProgress$1, nextHydratableInstance = getNextHydratable(props.firstChild), rootOrSingletonContext = !1, $$typeof = !0) : $$typeof = !1;
						$$typeof || throwOnHydrationMismatch(workInProgress$1);
					}
					pushHostContext(workInProgress$1);
					$$typeof = workInProgress$1.type;
					prevState = workInProgress$1.pendingProps;
					nextState = null !== current ? current.memoizedProps : null;
					props = prevState.children;
					shouldSetTextContent($$typeof, prevState) ? props = null : null !== nextState && shouldSetTextContent($$typeof, nextState) && (workInProgress$1.flags |= 32);
					null !== workInProgress$1.memoizedState && ($$typeof = renderWithHooks(current, workInProgress$1, TransitionAwareHostComponent, null, null, renderLanes$1), HostTransitionContext._currentValue = $$typeof);
					markRef(current, workInProgress$1);
					reconcileChildren(current, workInProgress$1, props, renderLanes$1);
					return workInProgress$1.child;
				case 6:
					if (null === current && isHydrating) {
						if (current = renderLanes$1 = nextHydratableInstance) renderLanes$1 = canHydrateTextInstance(renderLanes$1, workInProgress$1.pendingProps, rootOrSingletonContext), null !== renderLanes$1 ? (workInProgress$1.stateNode = renderLanes$1, hydrationParentFiber = workInProgress$1, nextHydratableInstance = null, current = !0) : current = !1;
						current || throwOnHydrationMismatch(workInProgress$1);
					}
					return null;
				case 13: return updateSuspenseComponent(current, workInProgress$1, renderLanes$1);
				case 4: return pushHostContainer(workInProgress$1, workInProgress$1.stateNode.containerInfo), props = workInProgress$1.pendingProps, null === current ? workInProgress$1.child = reconcileChildFibers(workInProgress$1, null, props, renderLanes$1) : reconcileChildren(current, workInProgress$1, props, renderLanes$1), workInProgress$1.child;
				case 11: return updateForwardRef(current, workInProgress$1, workInProgress$1.type, workInProgress$1.pendingProps, renderLanes$1);
				case 7: return reconcileChildren(current, workInProgress$1, workInProgress$1.pendingProps, renderLanes$1), workInProgress$1.child;
				case 8: return reconcileChildren(current, workInProgress$1, workInProgress$1.pendingProps.children, renderLanes$1), workInProgress$1.child;
				case 12: return reconcileChildren(current, workInProgress$1, workInProgress$1.pendingProps.children, renderLanes$1), workInProgress$1.child;
				case 10: return props = workInProgress$1.pendingProps, pushProvider(workInProgress$1, workInProgress$1.type, props.value), reconcileChildren(current, workInProgress$1, props.children, renderLanes$1), workInProgress$1.child;
				case 9: return $$typeof = workInProgress$1.type._context, props = workInProgress$1.pendingProps.children, prepareToReadContext(workInProgress$1), $$typeof = readContext($$typeof), props = props($$typeof), workInProgress$1.flags |= 1, reconcileChildren(current, workInProgress$1, props, renderLanes$1), workInProgress$1.child;
				case 14: return updateMemoComponent(current, workInProgress$1, workInProgress$1.type, workInProgress$1.pendingProps, renderLanes$1);
				case 15: return updateSimpleMemoComponent(current, workInProgress$1, workInProgress$1.type, workInProgress$1.pendingProps, renderLanes$1);
				case 19: return updateSuspenseListComponent(current, workInProgress$1, renderLanes$1);
				case 31: return updateActivityComponent(current, workInProgress$1, renderLanes$1);
				case 22: return updateOffscreenComponent(current, workInProgress$1, renderLanes$1, workInProgress$1.pendingProps);
				case 24: return prepareToReadContext(workInProgress$1), props = readContext(CacheContext), null === current ? ($$typeof = peekCacheFromPool(), null === $$typeof && ($$typeof = workInProgressRoot, prevState = createCache(), $$typeof.pooledCache = prevState, prevState.refCount++, null !== prevState && ($$typeof.pooledCacheLanes |= renderLanes$1), $$typeof = prevState), workInProgress$1.memoizedState = {
					parent: props,
					cache: $$typeof
				}, initializeUpdateQueue(workInProgress$1), pushProvider(workInProgress$1, CacheContext, $$typeof)) : (0 !== (current.lanes & renderLanes$1) && (cloneUpdateQueue(current, workInProgress$1), processUpdateQueue(workInProgress$1, null, null, renderLanes$1), suspendIfUpdateReadFromEntangledAsyncAction()), $$typeof = current.memoizedState, prevState = workInProgress$1.memoizedState, $$typeof.parent !== props ? ($$typeof = {
					parent: props,
					cache: props
				}, workInProgress$1.memoizedState = $$typeof, 0 === workInProgress$1.lanes && (workInProgress$1.memoizedState = workInProgress$1.updateQueue.baseState = $$typeof), pushProvider(workInProgress$1, CacheContext, props)) : (props = prevState.cache, pushProvider(workInProgress$1, CacheContext, props), props !== $$typeof.cache && propagateContextChanges(workInProgress$1, [CacheContext], renderLanes$1, !0))), reconcileChildren(current, workInProgress$1, workInProgress$1.pendingProps.children, renderLanes$1), workInProgress$1.child;
				case 29: throw workInProgress$1.pendingProps;
			}
			throw Error(formatProdErrorMessage(156, workInProgress$1.tag));
		}
		function markUpdate(workInProgress$1) {
			workInProgress$1.flags |= 4;
		}
		function preloadInstanceAndSuspendIfNeeded(workInProgress$1, type, oldProps, newProps, renderLanes$1) {
			if (type = 0 !== (workInProgress$1.mode & 32)) type = !1;
			if (type) {
				if (workInProgress$1.flags |= 16777216, (renderLanes$1 & 335544128) === renderLanes$1) if (workInProgress$1.stateNode.complete) workInProgress$1.flags |= 8192;
				else if (shouldRemainOnPreviousScreen()) workInProgress$1.flags |= 8192;
				else throw suspendedThenable = noopSuspenseyCommitThenable, SuspenseyCommitException;
			} else workInProgress$1.flags &= -16777217;
		}
		function preloadResourceAndSuspendIfNeeded(workInProgress$1, resource) {
			if ("stylesheet" !== resource.type || 0 !== (resource.state.loading & 4)) workInProgress$1.flags &= -16777217;
			else if (workInProgress$1.flags |= 16777216, !preloadResource(resource)) if (shouldRemainOnPreviousScreen()) workInProgress$1.flags |= 8192;
			else throw suspendedThenable = noopSuspenseyCommitThenable, SuspenseyCommitException;
		}
		function scheduleRetryEffect(workInProgress$1, retryQueue) {
			null !== retryQueue && (workInProgress$1.flags |= 4);
			workInProgress$1.flags & 16384 && (retryQueue = 22 !== workInProgress$1.tag ? claimNextRetryLane() : 536870912, workInProgress$1.lanes |= retryQueue, workInProgressSuspendedRetryLanes |= retryQueue);
		}
		function cutOffTailIfNeeded(renderState, hasRenderedATailFallback) {
			if (!isHydrating) switch (renderState.tailMode) {
				case "hidden":
					hasRenderedATailFallback = renderState.tail;
					for (var lastTailNode = null; null !== hasRenderedATailFallback;) null !== hasRenderedATailFallback.alternate && (lastTailNode = hasRenderedATailFallback), hasRenderedATailFallback = hasRenderedATailFallback.sibling;
					null === lastTailNode ? renderState.tail = null : lastTailNode.sibling = null;
					break;
				case "collapsed":
					lastTailNode = renderState.tail;
					for (var lastTailNode$106 = null; null !== lastTailNode;) null !== lastTailNode.alternate && (lastTailNode$106 = lastTailNode), lastTailNode = lastTailNode.sibling;
					null === lastTailNode$106 ? hasRenderedATailFallback || null === renderState.tail ? renderState.tail = null : renderState.tail.sibling = null : lastTailNode$106.sibling = null;
			}
		}
		function bubbleProperties(completedWork) {
			var didBailout = null !== completedWork.alternate && completedWork.alternate.child === completedWork.child, newChildLanes = 0, subtreeFlags = 0;
			if (didBailout) for (var child$107 = completedWork.child; null !== child$107;) newChildLanes |= child$107.lanes | child$107.childLanes, subtreeFlags |= child$107.subtreeFlags & 65011712, subtreeFlags |= child$107.flags & 65011712, child$107.return = completedWork, child$107 = child$107.sibling;
			else for (child$107 = completedWork.child; null !== child$107;) newChildLanes |= child$107.lanes | child$107.childLanes, subtreeFlags |= child$107.subtreeFlags, subtreeFlags |= child$107.flags, child$107.return = completedWork, child$107 = child$107.sibling;
			completedWork.subtreeFlags |= subtreeFlags;
			completedWork.childLanes = newChildLanes;
			return didBailout;
		}
		function completeWork(current, workInProgress$1, renderLanes$1) {
			var newProps = workInProgress$1.pendingProps;
			popTreeContext(workInProgress$1);
			switch (workInProgress$1.tag) {
				case 16:
				case 15:
				case 0:
				case 11:
				case 7:
				case 8:
				case 12:
				case 9:
				case 14: return bubbleProperties(workInProgress$1), null;
				case 1: return bubbleProperties(workInProgress$1), null;
				case 3:
					renderLanes$1 = workInProgress$1.stateNode;
					newProps = null;
					null !== current && (newProps = current.memoizedState.cache);
					workInProgress$1.memoizedState.cache !== newProps && (workInProgress$1.flags |= 2048);
					popProvider(CacheContext);
					popHostContainer();
					renderLanes$1.pendingContext && (renderLanes$1.context = renderLanes$1.pendingContext, renderLanes$1.pendingContext = null);
					if (null === current || null === current.child) popHydrationState(workInProgress$1) ? markUpdate(workInProgress$1) : null === current || current.memoizedState.isDehydrated && 0 === (workInProgress$1.flags & 256) || (workInProgress$1.flags |= 1024, upgradeHydrationErrorsToRecoverable());
					bubbleProperties(workInProgress$1);
					return null;
				case 26:
					var type = workInProgress$1.type, nextResource = workInProgress$1.memoizedState;
					null === current ? (markUpdate(workInProgress$1), null !== nextResource ? (bubbleProperties(workInProgress$1), preloadResourceAndSuspendIfNeeded(workInProgress$1, nextResource)) : (bubbleProperties(workInProgress$1), preloadInstanceAndSuspendIfNeeded(workInProgress$1, type, null, newProps, renderLanes$1))) : nextResource ? nextResource !== current.memoizedState ? (markUpdate(workInProgress$1), bubbleProperties(workInProgress$1), preloadResourceAndSuspendIfNeeded(workInProgress$1, nextResource)) : (bubbleProperties(workInProgress$1), workInProgress$1.flags &= -16777217) : (current = current.memoizedProps, current !== newProps && markUpdate(workInProgress$1), bubbleProperties(workInProgress$1), preloadInstanceAndSuspendIfNeeded(workInProgress$1, type, current, newProps, renderLanes$1));
					return null;
				case 27:
					popHostContext(workInProgress$1);
					renderLanes$1 = rootInstanceStackCursor.current;
					type = workInProgress$1.type;
					if (null !== current && null != workInProgress$1.stateNode) current.memoizedProps !== newProps && markUpdate(workInProgress$1);
					else {
						if (!newProps) {
							if (null === workInProgress$1.stateNode) throw Error(formatProdErrorMessage(166));
							bubbleProperties(workInProgress$1);
							return null;
						}
						current = contextStackCursor.current;
						popHydrationState(workInProgress$1) ? prepareToHydrateHostInstance(workInProgress$1, current) : (current = resolveSingletonInstance(type, newProps, renderLanes$1), workInProgress$1.stateNode = current, markUpdate(workInProgress$1));
					}
					bubbleProperties(workInProgress$1);
					return null;
				case 5:
					popHostContext(workInProgress$1);
					type = workInProgress$1.type;
					if (null !== current && null != workInProgress$1.stateNode) current.memoizedProps !== newProps && markUpdate(workInProgress$1);
					else {
						if (!newProps) {
							if (null === workInProgress$1.stateNode) throw Error(formatProdErrorMessage(166));
							bubbleProperties(workInProgress$1);
							return null;
						}
						nextResource = contextStackCursor.current;
						if (popHydrationState(workInProgress$1)) prepareToHydrateHostInstance(workInProgress$1, nextResource);
						else {
							var ownerDocument = getOwnerDocumentFromRootContainer(rootInstanceStackCursor.current);
							switch (nextResource) {
								case 1:
									nextResource = ownerDocument.createElementNS("http://www.w3.org/2000/svg", type);
									break;
								case 2:
									nextResource = ownerDocument.createElementNS("http://www.w3.org/1998/Math/MathML", type);
									break;
								default: switch (type) {
									case "svg":
										nextResource = ownerDocument.createElementNS("http://www.w3.org/2000/svg", type);
										break;
									case "math":
										nextResource = ownerDocument.createElementNS("http://www.w3.org/1998/Math/MathML", type);
										break;
									case "script":
										nextResource = ownerDocument.createElement("div");
										nextResource.innerHTML = "<script><\/script>";
										nextResource = nextResource.removeChild(nextResource.firstChild);
										break;
									case "select":
										nextResource = "string" === typeof newProps.is ? ownerDocument.createElement("select", { is: newProps.is }) : ownerDocument.createElement("select");
										newProps.multiple ? nextResource.multiple = !0 : newProps.size && (nextResource.size = newProps.size);
										break;
									default: nextResource = "string" === typeof newProps.is ? ownerDocument.createElement(type, { is: newProps.is }) : ownerDocument.createElement(type);
								}
							}
							nextResource[internalInstanceKey] = workInProgress$1;
							nextResource[internalPropsKey] = newProps;
							a: for (ownerDocument = workInProgress$1.child; null !== ownerDocument;) {
								if (5 === ownerDocument.tag || 6 === ownerDocument.tag) nextResource.appendChild(ownerDocument.stateNode);
								else if (4 !== ownerDocument.tag && 27 !== ownerDocument.tag && null !== ownerDocument.child) {
									ownerDocument.child.return = ownerDocument;
									ownerDocument = ownerDocument.child;
									continue;
								}
								if (ownerDocument === workInProgress$1) break a;
								for (; null === ownerDocument.sibling;) {
									if (null === ownerDocument.return || ownerDocument.return === workInProgress$1) break a;
									ownerDocument = ownerDocument.return;
								}
								ownerDocument.sibling.return = ownerDocument.return;
								ownerDocument = ownerDocument.sibling;
							}
							workInProgress$1.stateNode = nextResource;
							a: switch (setInitialProperties(nextResource, type, newProps), type) {
								case "button":
								case "input":
								case "select":
								case "textarea":
									newProps = !!newProps.autoFocus;
									break a;
								case "img":
									newProps = !0;
									break a;
								default: newProps = !1;
							}
							newProps && markUpdate(workInProgress$1);
						}
					}
					bubbleProperties(workInProgress$1);
					preloadInstanceAndSuspendIfNeeded(workInProgress$1, workInProgress$1.type, null === current ? null : current.memoizedProps, workInProgress$1.pendingProps, renderLanes$1);
					return null;
				case 6:
					if (current && null != workInProgress$1.stateNode) current.memoizedProps !== newProps && markUpdate(workInProgress$1);
					else {
						if ("string" !== typeof newProps && null === workInProgress$1.stateNode) throw Error(formatProdErrorMessage(166));
						current = rootInstanceStackCursor.current;
						if (popHydrationState(workInProgress$1)) {
							current = workInProgress$1.stateNode;
							renderLanes$1 = workInProgress$1.memoizedProps;
							newProps = null;
							type = hydrationParentFiber;
							if (null !== type) switch (type.tag) {
								case 27:
								case 5: newProps = type.memoizedProps;
							}
							current[internalInstanceKey] = workInProgress$1;
							current = current.nodeValue === renderLanes$1 || null !== newProps && !0 === newProps.suppressHydrationWarning || checkForUnmatchedText(current.nodeValue, renderLanes$1) ? !0 : !1;
							current || throwOnHydrationMismatch(workInProgress$1, !0);
						} else current = getOwnerDocumentFromRootContainer(current).createTextNode(newProps), current[internalInstanceKey] = workInProgress$1, workInProgress$1.stateNode = current;
					}
					bubbleProperties(workInProgress$1);
					return null;
				case 31:
					renderLanes$1 = workInProgress$1.memoizedState;
					if (null === current || null !== current.memoizedState) {
						newProps = popHydrationState(workInProgress$1);
						if (null !== renderLanes$1) {
							if (null === current) {
								if (!newProps) throw Error(formatProdErrorMessage(318));
								current = workInProgress$1.memoizedState;
								current = null !== current ? current.dehydrated : null;
								if (!current) throw Error(formatProdErrorMessage(557));
								current[internalInstanceKey] = workInProgress$1;
							} else resetHydrationState(), 0 === (workInProgress$1.flags & 128) && (workInProgress$1.memoizedState = null), workInProgress$1.flags |= 4;
							bubbleProperties(workInProgress$1);
							current = !1;
						} else renderLanes$1 = upgradeHydrationErrorsToRecoverable(), null !== current && null !== current.memoizedState && (current.memoizedState.hydrationErrors = renderLanes$1), current = !0;
						if (!current) {
							if (workInProgress$1.flags & 256) return popSuspenseHandler(workInProgress$1), workInProgress$1;
							popSuspenseHandler(workInProgress$1);
							return null;
						}
						if (0 !== (workInProgress$1.flags & 128)) throw Error(formatProdErrorMessage(558));
					}
					bubbleProperties(workInProgress$1);
					return null;
				case 13:
					newProps = workInProgress$1.memoizedState;
					if (null === current || null !== current.memoizedState && null !== current.memoizedState.dehydrated) {
						type = popHydrationState(workInProgress$1);
						if (null !== newProps && null !== newProps.dehydrated) {
							if (null === current) {
								if (!type) throw Error(formatProdErrorMessage(318));
								type = workInProgress$1.memoizedState;
								type = null !== type ? type.dehydrated : null;
								if (!type) throw Error(formatProdErrorMessage(317));
								type[internalInstanceKey] = workInProgress$1;
							} else resetHydrationState(), 0 === (workInProgress$1.flags & 128) && (workInProgress$1.memoizedState = null), workInProgress$1.flags |= 4;
							bubbleProperties(workInProgress$1);
							type = !1;
						} else type = upgradeHydrationErrorsToRecoverable(), null !== current && null !== current.memoizedState && (current.memoizedState.hydrationErrors = type), type = !0;
						if (!type) {
							if (workInProgress$1.flags & 256) return popSuspenseHandler(workInProgress$1), workInProgress$1;
							popSuspenseHandler(workInProgress$1);
							return null;
						}
					}
					popSuspenseHandler(workInProgress$1);
					if (0 !== (workInProgress$1.flags & 128)) return workInProgress$1.lanes = renderLanes$1, workInProgress$1;
					renderLanes$1 = null !== newProps;
					current = null !== current && null !== current.memoizedState;
					renderLanes$1 && (newProps = workInProgress$1.child, type = null, null !== newProps.alternate && null !== newProps.alternate.memoizedState && null !== newProps.alternate.memoizedState.cachePool && (type = newProps.alternate.memoizedState.cachePool.pool), nextResource = null, null !== newProps.memoizedState && null !== newProps.memoizedState.cachePool && (nextResource = newProps.memoizedState.cachePool.pool), nextResource !== type && (newProps.flags |= 2048));
					renderLanes$1 !== current && renderLanes$1 && (workInProgress$1.child.flags |= 8192);
					scheduleRetryEffect(workInProgress$1, workInProgress$1.updateQueue);
					bubbleProperties(workInProgress$1);
					return null;
				case 4: return popHostContainer(), null === current && listenToAllSupportedEvents(workInProgress$1.stateNode.containerInfo), bubbleProperties(workInProgress$1), null;
				case 10: return popProvider(workInProgress$1.type), bubbleProperties(workInProgress$1), null;
				case 19:
					pop(suspenseStackCursor);
					newProps = workInProgress$1.memoizedState;
					if (null === newProps) return bubbleProperties(workInProgress$1), null;
					type = 0 !== (workInProgress$1.flags & 128);
					nextResource = newProps.rendering;
					if (null === nextResource) if (type) cutOffTailIfNeeded(newProps, !1);
					else {
						if (0 !== workInProgressRootExitStatus || null !== current && 0 !== (current.flags & 128)) for (current = workInProgress$1.child; null !== current;) {
							nextResource = findFirstSuspended(current);
							if (null !== nextResource) {
								workInProgress$1.flags |= 128;
								cutOffTailIfNeeded(newProps, !1);
								current = nextResource.updateQueue;
								workInProgress$1.updateQueue = current;
								scheduleRetryEffect(workInProgress$1, current);
								workInProgress$1.subtreeFlags = 0;
								current = renderLanes$1;
								for (renderLanes$1 = workInProgress$1.child; null !== renderLanes$1;) resetWorkInProgress(renderLanes$1, current), renderLanes$1 = renderLanes$1.sibling;
								push(suspenseStackCursor, suspenseStackCursor.current & 1 | 2);
								isHydrating && pushTreeFork(workInProgress$1, newProps.treeForkCount);
								return workInProgress$1.child;
							}
							current = current.sibling;
						}
						null !== newProps.tail && now() > workInProgressRootRenderTargetTime && (workInProgress$1.flags |= 128, type = !0, cutOffTailIfNeeded(newProps, !1), workInProgress$1.lanes = 4194304);
					}
					else {
						if (!type) if (current = findFirstSuspended(nextResource), null !== current) {
							if (workInProgress$1.flags |= 128, type = !0, current = current.updateQueue, workInProgress$1.updateQueue = current, scheduleRetryEffect(workInProgress$1, current), cutOffTailIfNeeded(newProps, !0), null === newProps.tail && "hidden" === newProps.tailMode && !nextResource.alternate && !isHydrating) return bubbleProperties(workInProgress$1), null;
						} else 2 * now() - newProps.renderingStartTime > workInProgressRootRenderTargetTime && 536870912 !== renderLanes$1 && (workInProgress$1.flags |= 128, type = !0, cutOffTailIfNeeded(newProps, !1), workInProgress$1.lanes = 4194304);
						newProps.isBackwards ? (nextResource.sibling = workInProgress$1.child, workInProgress$1.child = nextResource) : (current = newProps.last, null !== current ? current.sibling = nextResource : workInProgress$1.child = nextResource, newProps.last = nextResource);
					}
					if (null !== newProps.tail) return current = newProps.tail, newProps.rendering = current, newProps.tail = current.sibling, newProps.renderingStartTime = now(), current.sibling = null, renderLanes$1 = suspenseStackCursor.current, push(suspenseStackCursor, type ? renderLanes$1 & 1 | 2 : renderLanes$1 & 1), isHydrating && pushTreeFork(workInProgress$1, newProps.treeForkCount), current;
					bubbleProperties(workInProgress$1);
					return null;
				case 22:
				case 23: return popSuspenseHandler(workInProgress$1), popHiddenContext(), newProps = null !== workInProgress$1.memoizedState, null !== current ? null !== current.memoizedState !== newProps && (workInProgress$1.flags |= 8192) : newProps && (workInProgress$1.flags |= 8192), newProps ? 0 !== (renderLanes$1 & 536870912) && 0 === (workInProgress$1.flags & 128) && (bubbleProperties(workInProgress$1), workInProgress$1.subtreeFlags & 6 && (workInProgress$1.flags |= 8192)) : bubbleProperties(workInProgress$1), renderLanes$1 = workInProgress$1.updateQueue, null !== renderLanes$1 && scheduleRetryEffect(workInProgress$1, renderLanes$1.retryQueue), renderLanes$1 = null, null !== current && null !== current.memoizedState && null !== current.memoizedState.cachePool && (renderLanes$1 = current.memoizedState.cachePool.pool), newProps = null, null !== workInProgress$1.memoizedState && null !== workInProgress$1.memoizedState.cachePool && (newProps = workInProgress$1.memoizedState.cachePool.pool), newProps !== renderLanes$1 && (workInProgress$1.flags |= 2048), null !== current && pop(resumedCache), null;
				case 24: return renderLanes$1 = null, null !== current && (renderLanes$1 = current.memoizedState.cache), workInProgress$1.memoizedState.cache !== renderLanes$1 && (workInProgress$1.flags |= 2048), popProvider(CacheContext), bubbleProperties(workInProgress$1), null;
				case 25: return null;
				case 30: return null;
			}
			throw Error(formatProdErrorMessage(156, workInProgress$1.tag));
		}
		function unwindWork(current, workInProgress$1) {
			popTreeContext(workInProgress$1);
			switch (workInProgress$1.tag) {
				case 1: return current = workInProgress$1.flags, current & 65536 ? (workInProgress$1.flags = current & -65537 | 128, workInProgress$1) : null;
				case 3: return popProvider(CacheContext), popHostContainer(), current = workInProgress$1.flags, 0 !== (current & 65536) && 0 === (current & 128) ? (workInProgress$1.flags = current & -65537 | 128, workInProgress$1) : null;
				case 26:
				case 27:
				case 5: return popHostContext(workInProgress$1), null;
				case 31:
					if (null !== workInProgress$1.memoizedState) {
						popSuspenseHandler(workInProgress$1);
						if (null === workInProgress$1.alternate) throw Error(formatProdErrorMessage(340));
						resetHydrationState();
					}
					current = workInProgress$1.flags;
					return current & 65536 ? (workInProgress$1.flags = current & -65537 | 128, workInProgress$1) : null;
				case 13:
					popSuspenseHandler(workInProgress$1);
					current = workInProgress$1.memoizedState;
					if (null !== current && null !== current.dehydrated) {
						if (null === workInProgress$1.alternate) throw Error(formatProdErrorMessage(340));
						resetHydrationState();
					}
					current = workInProgress$1.flags;
					return current & 65536 ? (workInProgress$1.flags = current & -65537 | 128, workInProgress$1) : null;
				case 19: return pop(suspenseStackCursor), null;
				case 4: return popHostContainer(), null;
				case 10: return popProvider(workInProgress$1.type), null;
				case 22:
				case 23: return popSuspenseHandler(workInProgress$1), popHiddenContext(), null !== current && pop(resumedCache), current = workInProgress$1.flags, current & 65536 ? (workInProgress$1.flags = current & -65537 | 128, workInProgress$1) : null;
				case 24: return popProvider(CacheContext), null;
				case 25: return null;
				default: return null;
			}
		}
		function unwindInterruptedWork(current, interruptedWork) {
			popTreeContext(interruptedWork);
			switch (interruptedWork.tag) {
				case 3:
					popProvider(CacheContext);
					popHostContainer();
					break;
				case 26:
				case 27:
				case 5:
					popHostContext(interruptedWork);
					break;
				case 4:
					popHostContainer();
					break;
				case 31:
					null !== interruptedWork.memoizedState && popSuspenseHandler(interruptedWork);
					break;
				case 13:
					popSuspenseHandler(interruptedWork);
					break;
				case 19:
					pop(suspenseStackCursor);
					break;
				case 10:
					popProvider(interruptedWork.type);
					break;
				case 22:
				case 23:
					popSuspenseHandler(interruptedWork);
					popHiddenContext();
					null !== current && pop(resumedCache);
					break;
				case 24: popProvider(CacheContext);
			}
		}
		function commitHookEffectListMount(flags, finishedWork) {
			try {
				var updateQueue = finishedWork.updateQueue, lastEffect = null !== updateQueue ? updateQueue.lastEffect : null;
				if (null !== lastEffect) {
					var firstEffect = lastEffect.next;
					updateQueue = firstEffect;
					do {
						if ((updateQueue.tag & flags) === flags) {
							lastEffect = void 0;
							var create = updateQueue.create, inst = updateQueue.inst;
							lastEffect = create();
							inst.destroy = lastEffect;
						}
						updateQueue = updateQueue.next;
					} while (updateQueue !== firstEffect);
				}
			} catch (error) {
				captureCommitPhaseError(finishedWork, finishedWork.return, error);
			}
		}
		function commitHookEffectListUnmount(flags, finishedWork, nearestMountedAncestor$jscomp$0) {
			try {
				var updateQueue = finishedWork.updateQueue, lastEffect = null !== updateQueue ? updateQueue.lastEffect : null;
				if (null !== lastEffect) {
					var firstEffect = lastEffect.next;
					updateQueue = firstEffect;
					do {
						if ((updateQueue.tag & flags) === flags) {
							var inst = updateQueue.inst, destroy = inst.destroy;
							if (void 0 !== destroy) {
								inst.destroy = void 0;
								lastEffect = finishedWork;
								var nearestMountedAncestor = nearestMountedAncestor$jscomp$0, destroy_ = destroy;
								try {
									destroy_();
								} catch (error) {
									captureCommitPhaseError(lastEffect, nearestMountedAncestor, error);
								}
							}
						}
						updateQueue = updateQueue.next;
					} while (updateQueue !== firstEffect);
				}
			} catch (error) {
				captureCommitPhaseError(finishedWork, finishedWork.return, error);
			}
		}
		function commitClassCallbacks(finishedWork) {
			var updateQueue = finishedWork.updateQueue;
			if (null !== updateQueue) {
				var instance = finishedWork.stateNode;
				try {
					commitCallbacks(updateQueue, instance);
				} catch (error) {
					captureCommitPhaseError(finishedWork, finishedWork.return, error);
				}
			}
		}
		function safelyCallComponentWillUnmount(current, nearestMountedAncestor, instance) {
			instance.props = resolveClassComponentProps(current.type, current.memoizedProps);
			instance.state = current.memoizedState;
			try {
				instance.componentWillUnmount();
			} catch (error) {
				captureCommitPhaseError(current, nearestMountedAncestor, error);
			}
		}
		function safelyAttachRef(current, nearestMountedAncestor) {
			try {
				var ref = current.ref;
				if (null !== ref) {
					switch (current.tag) {
						case 26:
						case 27:
						case 5:
							var instanceToUse = current.stateNode;
							break;
						case 30:
							instanceToUse = current.stateNode;
							break;
						default: instanceToUse = current.stateNode;
					}
					"function" === typeof ref ? current.refCleanup = ref(instanceToUse) : ref.current = instanceToUse;
				}
			} catch (error) {
				captureCommitPhaseError(current, nearestMountedAncestor, error);
			}
		}
		function safelyDetachRef(current, nearestMountedAncestor) {
			var ref = current.ref, refCleanup = current.refCleanup;
			if (null !== ref) if ("function" === typeof refCleanup) try {
				refCleanup();
			} catch (error) {
				captureCommitPhaseError(current, nearestMountedAncestor, error);
			} finally {
				current.refCleanup = null, current = current.alternate, null != current && (current.refCleanup = null);
			}
			else if ("function" === typeof ref) try {
				ref(null);
			} catch (error$140) {
				captureCommitPhaseError(current, nearestMountedAncestor, error$140);
			}
			else ref.current = null;
		}
		function commitHostMount(finishedWork) {
			var type = finishedWork.type, props = finishedWork.memoizedProps, instance = finishedWork.stateNode;
			try {
				a: switch (type) {
					case "button":
					case "input":
					case "select":
					case "textarea":
						props.autoFocus && instance.focus();
						break a;
					case "img": props.src ? instance.src = props.src : props.srcSet && (instance.srcset = props.srcSet);
				}
			} catch (error) {
				captureCommitPhaseError(finishedWork, finishedWork.return, error);
			}
		}
		function commitHostUpdate(finishedWork, newProps, oldProps) {
			try {
				var domElement = finishedWork.stateNode;
				updateProperties(domElement, finishedWork.type, oldProps, newProps);
				domElement[internalPropsKey] = newProps;
			} catch (error) {
				captureCommitPhaseError(finishedWork, finishedWork.return, error);
			}
		}
		function isHostParent(fiber) {
			return 5 === fiber.tag || 3 === fiber.tag || 26 === fiber.tag || 27 === fiber.tag && isSingletonScope(fiber.type) || 4 === fiber.tag;
		}
		function getHostSibling(fiber) {
			a: for (;;) {
				for (; null === fiber.sibling;) {
					if (null === fiber.return || isHostParent(fiber.return)) return null;
					fiber = fiber.return;
				}
				fiber.sibling.return = fiber.return;
				for (fiber = fiber.sibling; 5 !== fiber.tag && 6 !== fiber.tag && 18 !== fiber.tag;) {
					if (27 === fiber.tag && isSingletonScope(fiber.type)) continue a;
					if (fiber.flags & 2) continue a;
					if (null === fiber.child || 4 === fiber.tag) continue a;
					else fiber.child.return = fiber, fiber = fiber.child;
				}
				if (!(fiber.flags & 2)) return fiber.stateNode;
			}
		}
		function insertOrAppendPlacementNodeIntoContainer(node, before, parent) {
			var tag = node.tag;
			if (5 === tag || 6 === tag) node = node.stateNode, before ? (9 === parent.nodeType ? parent.body : "HTML" === parent.nodeName ? parent.ownerDocument.body : parent).insertBefore(node, before) : (before = 9 === parent.nodeType ? parent.body : "HTML" === parent.nodeName ? parent.ownerDocument.body : parent, before.appendChild(node), parent = parent._reactRootContainer, null !== parent && void 0 !== parent || null !== before.onclick || (before.onclick = noop$1));
			else if (4 !== tag && (27 === tag && isSingletonScope(node.type) && (parent = node.stateNode, before = null), node = node.child, null !== node)) for (insertOrAppendPlacementNodeIntoContainer(node, before, parent), node = node.sibling; null !== node;) insertOrAppendPlacementNodeIntoContainer(node, before, parent), node = node.sibling;
		}
		function insertOrAppendPlacementNode(node, before, parent) {
			var tag = node.tag;
			if (5 === tag || 6 === tag) node = node.stateNode, before ? parent.insertBefore(node, before) : parent.appendChild(node);
			else if (4 !== tag && (27 === tag && isSingletonScope(node.type) && (parent = node.stateNode), node = node.child, null !== node)) for (insertOrAppendPlacementNode(node, before, parent), node = node.sibling; null !== node;) insertOrAppendPlacementNode(node, before, parent), node = node.sibling;
		}
		function commitHostSingletonAcquisition(finishedWork) {
			var singleton = finishedWork.stateNode, props = finishedWork.memoizedProps;
			try {
				for (var type = finishedWork.type, attributes = singleton.attributes; attributes.length;) singleton.removeAttributeNode(attributes[0]);
				setInitialProperties(singleton, type, props);
				singleton[internalInstanceKey] = finishedWork;
				singleton[internalPropsKey] = props;
			} catch (error) {
				captureCommitPhaseError(finishedWork, finishedWork.return, error);
			}
		}
		var offscreenSubtreeIsHidden = !1, offscreenSubtreeWasHidden = !1, needsFormReset = !1, PossiblyWeakSet = "function" === typeof WeakSet ? WeakSet : Set, nextEffect = null;
		function commitBeforeMutationEffects(root$1, firstChild) {
			root$1 = root$1.containerInfo;
			eventsEnabled = _enabled;
			root$1 = getActiveElementDeep(root$1);
			if (hasSelectionCapabilities(root$1)) {
				if ("selectionStart" in root$1) var JSCompiler_temp = {
					start: root$1.selectionStart,
					end: root$1.selectionEnd
				};
				else a: {
					JSCompiler_temp = (JSCompiler_temp = root$1.ownerDocument) && JSCompiler_temp.defaultView || window;
					var selection = JSCompiler_temp.getSelection && JSCompiler_temp.getSelection();
					if (selection && 0 !== selection.rangeCount) {
						JSCompiler_temp = selection.anchorNode;
						var anchorOffset = selection.anchorOffset, focusNode = selection.focusNode;
						selection = selection.focusOffset;
						try {
							JSCompiler_temp.nodeType, focusNode.nodeType;
						} catch (e$20) {
							JSCompiler_temp = null;
							break a;
						}
						var length = 0, start = -1, end = -1, indexWithinAnchor = 0, indexWithinFocus = 0, node = root$1, parentNode = null;
						b: for (;;) {
							for (var next;;) {
								node !== JSCompiler_temp || 0 !== anchorOffset && 3 !== node.nodeType || (start = length + anchorOffset);
								node !== focusNode || 0 !== selection && 3 !== node.nodeType || (end = length + selection);
								3 === node.nodeType && (length += node.nodeValue.length);
								if (null === (next = node.firstChild)) break;
								parentNode = node;
								node = next;
							}
							for (;;) {
								if (node === root$1) break b;
								parentNode === JSCompiler_temp && ++indexWithinAnchor === anchorOffset && (start = length);
								parentNode === focusNode && ++indexWithinFocus === selection && (end = length);
								if (null !== (next = node.nextSibling)) break;
								node = parentNode;
								parentNode = node.parentNode;
							}
							node = next;
						}
						JSCompiler_temp = -1 === start || -1 === end ? null : {
							start,
							end
						};
					} else JSCompiler_temp = null;
				}
				JSCompiler_temp = JSCompiler_temp || {
					start: 0,
					end: 0
				};
			} else JSCompiler_temp = null;
			selectionInformation = {
				focusedElem: root$1,
				selectionRange: JSCompiler_temp
			};
			_enabled = !1;
			for (nextEffect = firstChild; null !== nextEffect;) if (firstChild = nextEffect, root$1 = firstChild.child, 0 !== (firstChild.subtreeFlags & 1028) && null !== root$1) root$1.return = firstChild, nextEffect = root$1;
			else for (; null !== nextEffect;) {
				firstChild = nextEffect;
				focusNode = firstChild.alternate;
				root$1 = firstChild.flags;
				switch (firstChild.tag) {
					case 0:
						if (0 !== (root$1 & 4) && (root$1 = firstChild.updateQueue, root$1 = null !== root$1 ? root$1.events : null, null !== root$1)) for (JSCompiler_temp = 0; JSCompiler_temp < root$1.length; JSCompiler_temp++) anchorOffset = root$1[JSCompiler_temp], anchorOffset.ref.impl = anchorOffset.nextImpl;
						break;
					case 11:
					case 15: break;
					case 1:
						if (0 !== (root$1 & 1024) && null !== focusNode) {
							root$1 = void 0;
							JSCompiler_temp = firstChild;
							anchorOffset = focusNode.memoizedProps;
							focusNode = focusNode.memoizedState;
							selection = JSCompiler_temp.stateNode;
							try {
								var resolvedPrevProps = resolveClassComponentProps(JSCompiler_temp.type, anchorOffset);
								root$1 = selection.getSnapshotBeforeUpdate(resolvedPrevProps, focusNode);
								selection.__reactInternalSnapshotBeforeUpdate = root$1;
							} catch (error) {
								captureCommitPhaseError(JSCompiler_temp, JSCompiler_temp.return, error);
							}
						}
						break;
					case 3:
						if (0 !== (root$1 & 1024)) {
							if (root$1 = firstChild.stateNode.containerInfo, JSCompiler_temp = root$1.nodeType, 9 === JSCompiler_temp) clearContainerSparingly(root$1);
							else if (1 === JSCompiler_temp) switch (root$1.nodeName) {
								case "HEAD":
								case "HTML":
								case "BODY":
									clearContainerSparingly(root$1);
									break;
								default: root$1.textContent = "";
							}
						}
						break;
					case 5:
					case 26:
					case 27:
					case 6:
					case 4:
					case 17: break;
					default: if (0 !== (root$1 & 1024)) throw Error(formatProdErrorMessage(163));
				}
				root$1 = firstChild.sibling;
				if (null !== root$1) {
					root$1.return = firstChild.return;
					nextEffect = root$1;
					break;
				}
				nextEffect = firstChild.return;
			}
		}
		function commitLayoutEffectOnFiber(finishedRoot, current, finishedWork) {
			var flags = finishedWork.flags;
			switch (finishedWork.tag) {
				case 0:
				case 11:
				case 15:
					recursivelyTraverseLayoutEffects(finishedRoot, finishedWork);
					flags & 4 && commitHookEffectListMount(5, finishedWork);
					break;
				case 1:
					recursivelyTraverseLayoutEffects(finishedRoot, finishedWork);
					if (flags & 4) if (finishedRoot = finishedWork.stateNode, null === current) try {
						finishedRoot.componentDidMount();
					} catch (error) {
						captureCommitPhaseError(finishedWork, finishedWork.return, error);
					}
					else {
						var prevProps = resolveClassComponentProps(finishedWork.type, current.memoizedProps);
						current = current.memoizedState;
						try {
							finishedRoot.componentDidUpdate(prevProps, current, finishedRoot.__reactInternalSnapshotBeforeUpdate);
						} catch (error$139) {
							captureCommitPhaseError(finishedWork, finishedWork.return, error$139);
						}
					}
					flags & 64 && commitClassCallbacks(finishedWork);
					flags & 512 && safelyAttachRef(finishedWork, finishedWork.return);
					break;
				case 3:
					recursivelyTraverseLayoutEffects(finishedRoot, finishedWork);
					if (flags & 64 && (finishedRoot = finishedWork.updateQueue, null !== finishedRoot)) {
						current = null;
						if (null !== finishedWork.child) switch (finishedWork.child.tag) {
							case 27:
							case 5:
								current = finishedWork.child.stateNode;
								break;
							case 1: current = finishedWork.child.stateNode;
						}
						try {
							commitCallbacks(finishedRoot, current);
						} catch (error) {
							captureCommitPhaseError(finishedWork, finishedWork.return, error);
						}
					}
					break;
				case 27: null === current && flags & 4 && commitHostSingletonAcquisition(finishedWork);
				case 26:
				case 5:
					recursivelyTraverseLayoutEffects(finishedRoot, finishedWork);
					null === current && flags & 4 && commitHostMount(finishedWork);
					flags & 512 && safelyAttachRef(finishedWork, finishedWork.return);
					break;
				case 12:
					recursivelyTraverseLayoutEffects(finishedRoot, finishedWork);
					break;
				case 31:
					recursivelyTraverseLayoutEffects(finishedRoot, finishedWork);
					flags & 4 && commitActivityHydrationCallbacks(finishedRoot, finishedWork);
					break;
				case 13:
					recursivelyTraverseLayoutEffects(finishedRoot, finishedWork);
					flags & 4 && commitSuspenseHydrationCallbacks(finishedRoot, finishedWork);
					flags & 64 && (finishedRoot = finishedWork.memoizedState, null !== finishedRoot && (finishedRoot = finishedRoot.dehydrated, null !== finishedRoot && (finishedWork = retryDehydratedSuspenseBoundary.bind(null, finishedWork), registerSuspenseInstanceRetry(finishedRoot, finishedWork))));
					break;
				case 22:
					flags = null !== finishedWork.memoizedState || offscreenSubtreeIsHidden;
					if (!flags) {
						current = null !== current && null !== current.memoizedState || offscreenSubtreeWasHidden;
						prevProps = offscreenSubtreeIsHidden;
						var prevOffscreenSubtreeWasHidden = offscreenSubtreeWasHidden;
						offscreenSubtreeIsHidden = flags;
						(offscreenSubtreeWasHidden = current) && !prevOffscreenSubtreeWasHidden ? recursivelyTraverseReappearLayoutEffects(finishedRoot, finishedWork, 0 !== (finishedWork.subtreeFlags & 8772)) : recursivelyTraverseLayoutEffects(finishedRoot, finishedWork);
						offscreenSubtreeIsHidden = prevProps;
						offscreenSubtreeWasHidden = prevOffscreenSubtreeWasHidden;
					}
					break;
				case 30: break;
				default: recursivelyTraverseLayoutEffects(finishedRoot, finishedWork);
			}
		}
		function detachFiberAfterEffects(fiber) {
			var alternate = fiber.alternate;
			null !== alternate && (fiber.alternate = null, detachFiberAfterEffects(alternate));
			fiber.child = null;
			fiber.deletions = null;
			fiber.sibling = null;
			5 === fiber.tag && (alternate = fiber.stateNode, null !== alternate && detachDeletedInstance(alternate));
			fiber.stateNode = null;
			fiber.return = null;
			fiber.dependencies = null;
			fiber.memoizedProps = null;
			fiber.memoizedState = null;
			fiber.pendingProps = null;
			fiber.stateNode = null;
			fiber.updateQueue = null;
		}
		var hostParent = null, hostParentIsContainer = !1;
		function recursivelyTraverseDeletionEffects(finishedRoot, nearestMountedAncestor, parent) {
			for (parent = parent.child; null !== parent;) commitDeletionEffectsOnFiber(finishedRoot, nearestMountedAncestor, parent), parent = parent.sibling;
		}
		function commitDeletionEffectsOnFiber(finishedRoot, nearestMountedAncestor, deletedFiber) {
			if (injectedHook && "function" === typeof injectedHook.onCommitFiberUnmount) try {
				injectedHook.onCommitFiberUnmount(rendererID, deletedFiber);
			} catch (err) {}
			switch (deletedFiber.tag) {
				case 26:
					offscreenSubtreeWasHidden || safelyDetachRef(deletedFiber, nearestMountedAncestor);
					recursivelyTraverseDeletionEffects(finishedRoot, nearestMountedAncestor, deletedFiber);
					deletedFiber.memoizedState ? deletedFiber.memoizedState.count-- : deletedFiber.stateNode && (deletedFiber = deletedFiber.stateNode, deletedFiber.parentNode.removeChild(deletedFiber));
					break;
				case 27:
					offscreenSubtreeWasHidden || safelyDetachRef(deletedFiber, nearestMountedAncestor);
					var prevHostParent = hostParent, prevHostParentIsContainer = hostParentIsContainer;
					isSingletonScope(deletedFiber.type) && (hostParent = deletedFiber.stateNode, hostParentIsContainer = !1);
					recursivelyTraverseDeletionEffects(finishedRoot, nearestMountedAncestor, deletedFiber);
					releaseSingletonInstance(deletedFiber.stateNode);
					hostParent = prevHostParent;
					hostParentIsContainer = prevHostParentIsContainer;
					break;
				case 5: offscreenSubtreeWasHidden || safelyDetachRef(deletedFiber, nearestMountedAncestor);
				case 6:
					prevHostParent = hostParent;
					prevHostParentIsContainer = hostParentIsContainer;
					hostParent = null;
					recursivelyTraverseDeletionEffects(finishedRoot, nearestMountedAncestor, deletedFiber);
					hostParent = prevHostParent;
					hostParentIsContainer = prevHostParentIsContainer;
					if (null !== hostParent) if (hostParentIsContainer) try {
						(9 === hostParent.nodeType ? hostParent.body : "HTML" === hostParent.nodeName ? hostParent.ownerDocument.body : hostParent).removeChild(deletedFiber.stateNode);
					} catch (error) {
						captureCommitPhaseError(deletedFiber, nearestMountedAncestor, error);
					}
					else try {
						hostParent.removeChild(deletedFiber.stateNode);
					} catch (error) {
						captureCommitPhaseError(deletedFiber, nearestMountedAncestor, error);
					}
					break;
				case 18:
					null !== hostParent && (hostParentIsContainer ? (finishedRoot = hostParent, clearHydrationBoundary(9 === finishedRoot.nodeType ? finishedRoot.body : "HTML" === finishedRoot.nodeName ? finishedRoot.ownerDocument.body : finishedRoot, deletedFiber.stateNode), retryIfBlockedOn(finishedRoot)) : clearHydrationBoundary(hostParent, deletedFiber.stateNode));
					break;
				case 4:
					prevHostParent = hostParent;
					prevHostParentIsContainer = hostParentIsContainer;
					hostParent = deletedFiber.stateNode.containerInfo;
					hostParentIsContainer = !0;
					recursivelyTraverseDeletionEffects(finishedRoot, nearestMountedAncestor, deletedFiber);
					hostParent = prevHostParent;
					hostParentIsContainer = prevHostParentIsContainer;
					break;
				case 0:
				case 11:
				case 14:
				case 15:
					commitHookEffectListUnmount(2, deletedFiber, nearestMountedAncestor);
					offscreenSubtreeWasHidden || commitHookEffectListUnmount(4, deletedFiber, nearestMountedAncestor);
					recursivelyTraverseDeletionEffects(finishedRoot, nearestMountedAncestor, deletedFiber);
					break;
				case 1:
					offscreenSubtreeWasHidden || (safelyDetachRef(deletedFiber, nearestMountedAncestor), prevHostParent = deletedFiber.stateNode, "function" === typeof prevHostParent.componentWillUnmount && safelyCallComponentWillUnmount(deletedFiber, nearestMountedAncestor, prevHostParent));
					recursivelyTraverseDeletionEffects(finishedRoot, nearestMountedAncestor, deletedFiber);
					break;
				case 21:
					recursivelyTraverseDeletionEffects(finishedRoot, nearestMountedAncestor, deletedFiber);
					break;
				case 22:
					offscreenSubtreeWasHidden = (prevHostParent = offscreenSubtreeWasHidden) || null !== deletedFiber.memoizedState;
					recursivelyTraverseDeletionEffects(finishedRoot, nearestMountedAncestor, deletedFiber);
					offscreenSubtreeWasHidden = prevHostParent;
					break;
				default: recursivelyTraverseDeletionEffects(finishedRoot, nearestMountedAncestor, deletedFiber);
			}
		}
		function commitActivityHydrationCallbacks(finishedRoot, finishedWork) {
			if (null === finishedWork.memoizedState && (finishedRoot = finishedWork.alternate, null !== finishedRoot && (finishedRoot = finishedRoot.memoizedState, null !== finishedRoot))) {
				finishedRoot = finishedRoot.dehydrated;
				try {
					retryIfBlockedOn(finishedRoot);
				} catch (error) {
					captureCommitPhaseError(finishedWork, finishedWork.return, error);
				}
			}
		}
		function commitSuspenseHydrationCallbacks(finishedRoot, finishedWork) {
			if (null === finishedWork.memoizedState && (finishedRoot = finishedWork.alternate, null !== finishedRoot && (finishedRoot = finishedRoot.memoizedState, null !== finishedRoot && (finishedRoot = finishedRoot.dehydrated, null !== finishedRoot)))) try {
				retryIfBlockedOn(finishedRoot);
			} catch (error) {
				captureCommitPhaseError(finishedWork, finishedWork.return, error);
			}
		}
		function getRetryCache(finishedWork) {
			switch (finishedWork.tag) {
				case 31:
				case 13:
				case 19:
					var retryCache = finishedWork.stateNode;
					null === retryCache && (retryCache = finishedWork.stateNode = new PossiblyWeakSet());
					return retryCache;
				case 22: return finishedWork = finishedWork.stateNode, retryCache = finishedWork._retryCache, null === retryCache && (retryCache = finishedWork._retryCache = new PossiblyWeakSet()), retryCache;
				default: throw Error(formatProdErrorMessage(435, finishedWork.tag));
			}
		}
		function attachSuspenseRetryListeners(finishedWork, wakeables) {
			var retryCache = getRetryCache(finishedWork);
			wakeables.forEach(function(wakeable) {
				if (!retryCache.has(wakeable)) {
					retryCache.add(wakeable);
					var retry = resolveRetryWakeable.bind(null, finishedWork, wakeable);
					wakeable.then(retry, retry);
				}
			});
		}
		function recursivelyTraverseMutationEffects(root$jscomp$0, parentFiber) {
			var deletions = parentFiber.deletions;
			if (null !== deletions) for (var i = 0; i < deletions.length; i++) {
				var childToDelete = deletions[i], root$1 = root$jscomp$0, returnFiber = parentFiber, parent = returnFiber;
				a: for (; null !== parent;) {
					switch (parent.tag) {
						case 27:
							if (isSingletonScope(parent.type)) {
								hostParent = parent.stateNode;
								hostParentIsContainer = !1;
								break a;
							}
							break;
						case 5:
							hostParent = parent.stateNode;
							hostParentIsContainer = !1;
							break a;
						case 3:
						case 4:
							hostParent = parent.stateNode.containerInfo;
							hostParentIsContainer = !0;
							break a;
					}
					parent = parent.return;
				}
				if (null === hostParent) throw Error(formatProdErrorMessage(160));
				commitDeletionEffectsOnFiber(root$1, returnFiber, childToDelete);
				hostParent = null;
				hostParentIsContainer = !1;
				root$1 = childToDelete.alternate;
				null !== root$1 && (root$1.return = null);
				childToDelete.return = null;
			}
			if (parentFiber.subtreeFlags & 13886) for (parentFiber = parentFiber.child; null !== parentFiber;) commitMutationEffectsOnFiber(parentFiber, root$jscomp$0), parentFiber = parentFiber.sibling;
		}
		var currentHoistableRoot = null;
		function commitMutationEffectsOnFiber(finishedWork, root$1) {
			var current = finishedWork.alternate, flags = finishedWork.flags;
			switch (finishedWork.tag) {
				case 0:
				case 11:
				case 14:
				case 15:
					recursivelyTraverseMutationEffects(root$1, finishedWork);
					commitReconciliationEffects(finishedWork);
					flags & 4 && (commitHookEffectListUnmount(3, finishedWork, finishedWork.return), commitHookEffectListMount(3, finishedWork), commitHookEffectListUnmount(5, finishedWork, finishedWork.return));
					break;
				case 1:
					recursivelyTraverseMutationEffects(root$1, finishedWork);
					commitReconciliationEffects(finishedWork);
					flags & 512 && (offscreenSubtreeWasHidden || null === current || safelyDetachRef(current, current.return));
					flags & 64 && offscreenSubtreeIsHidden && (finishedWork = finishedWork.updateQueue, null !== finishedWork && (flags = finishedWork.callbacks, null !== flags && (current = finishedWork.shared.hiddenCallbacks, finishedWork.shared.hiddenCallbacks = null === current ? flags : current.concat(flags))));
					break;
				case 26:
					var hoistableRoot = currentHoistableRoot;
					recursivelyTraverseMutationEffects(root$1, finishedWork);
					commitReconciliationEffects(finishedWork);
					flags & 512 && (offscreenSubtreeWasHidden || null === current || safelyDetachRef(current, current.return));
					if (flags & 4) {
						var currentResource = null !== current ? current.memoizedState : null;
						flags = finishedWork.memoizedState;
						if (null === current) if (null === flags) if (null === finishedWork.stateNode) {
							a: {
								flags = finishedWork.type;
								current = finishedWork.memoizedProps;
								hoistableRoot = hoistableRoot.ownerDocument || hoistableRoot;
								b: switch (flags) {
									case "title":
										currentResource = hoistableRoot.getElementsByTagName("title")[0];
										if (!currentResource || currentResource[internalHoistableMarker] || currentResource[internalInstanceKey] || "http://www.w3.org/2000/svg" === currentResource.namespaceURI || currentResource.hasAttribute("itemprop")) currentResource = hoistableRoot.createElement(flags), hoistableRoot.head.insertBefore(currentResource, hoistableRoot.querySelector("head > title"));
										setInitialProperties(currentResource, flags, current);
										currentResource[internalInstanceKey] = finishedWork;
										markNodeAsHoistable(currentResource);
										flags = currentResource;
										break a;
									case "link":
										var maybeNodes = getHydratableHoistableCache("link", "href", hoistableRoot).get(flags + (current.href || ""));
										if (maybeNodes) {
											for (var i = 0; i < maybeNodes.length; i++) if (currentResource = maybeNodes[i], currentResource.getAttribute("href") === (null == current.href || "" === current.href ? null : current.href) && currentResource.getAttribute("rel") === (null == current.rel ? null : current.rel) && currentResource.getAttribute("title") === (null == current.title ? null : current.title) && currentResource.getAttribute("crossorigin") === (null == current.crossOrigin ? null : current.crossOrigin)) {
												maybeNodes.splice(i, 1);
												break b;
											}
										}
										currentResource = hoistableRoot.createElement(flags);
										setInitialProperties(currentResource, flags, current);
										hoistableRoot.head.appendChild(currentResource);
										break;
									case "meta":
										if (maybeNodes = getHydratableHoistableCache("meta", "content", hoistableRoot).get(flags + (current.content || ""))) {
											for (i = 0; i < maybeNodes.length; i++) if (currentResource = maybeNodes[i], currentResource.getAttribute("content") === (null == current.content ? null : "" + current.content) && currentResource.getAttribute("name") === (null == current.name ? null : current.name) && currentResource.getAttribute("property") === (null == current.property ? null : current.property) && currentResource.getAttribute("http-equiv") === (null == current.httpEquiv ? null : current.httpEquiv) && currentResource.getAttribute("charset") === (null == current.charSet ? null : current.charSet)) {
												maybeNodes.splice(i, 1);
												break b;
											}
										}
										currentResource = hoistableRoot.createElement(flags);
										setInitialProperties(currentResource, flags, current);
										hoistableRoot.head.appendChild(currentResource);
										break;
									default: throw Error(formatProdErrorMessage(468, flags));
								}
								currentResource[internalInstanceKey] = finishedWork;
								markNodeAsHoistable(currentResource);
								flags = currentResource;
							}
							finishedWork.stateNode = flags;
						} else mountHoistable(hoistableRoot, finishedWork.type, finishedWork.stateNode);
						else finishedWork.stateNode = acquireResource(hoistableRoot, flags, finishedWork.memoizedProps);
						else currentResource !== flags ? (null === currentResource ? null !== current.stateNode && (current = current.stateNode, current.parentNode.removeChild(current)) : currentResource.count--, null === flags ? mountHoistable(hoistableRoot, finishedWork.type, finishedWork.stateNode) : acquireResource(hoistableRoot, flags, finishedWork.memoizedProps)) : null === flags && null !== finishedWork.stateNode && commitHostUpdate(finishedWork, finishedWork.memoizedProps, current.memoizedProps);
					}
					break;
				case 27:
					recursivelyTraverseMutationEffects(root$1, finishedWork);
					commitReconciliationEffects(finishedWork);
					flags & 512 && (offscreenSubtreeWasHidden || null === current || safelyDetachRef(current, current.return));
					null !== current && flags & 4 && commitHostUpdate(finishedWork, finishedWork.memoizedProps, current.memoizedProps);
					break;
				case 5:
					recursivelyTraverseMutationEffects(root$1, finishedWork);
					commitReconciliationEffects(finishedWork);
					flags & 512 && (offscreenSubtreeWasHidden || null === current || safelyDetachRef(current, current.return));
					if (finishedWork.flags & 32) {
						hoistableRoot = finishedWork.stateNode;
						try {
							setTextContent(hoistableRoot, "");
						} catch (error) {
							captureCommitPhaseError(finishedWork, finishedWork.return, error);
						}
					}
					flags & 4 && null != finishedWork.stateNode && (hoistableRoot = finishedWork.memoizedProps, commitHostUpdate(finishedWork, hoistableRoot, null !== current ? current.memoizedProps : hoistableRoot));
					flags & 1024 && (needsFormReset = !0);
					break;
				case 6:
					recursivelyTraverseMutationEffects(root$1, finishedWork);
					commitReconciliationEffects(finishedWork);
					if (flags & 4) {
						if (null === finishedWork.stateNode) throw Error(formatProdErrorMessage(162));
						flags = finishedWork.memoizedProps;
						current = finishedWork.stateNode;
						try {
							current.nodeValue = flags;
						} catch (error) {
							captureCommitPhaseError(finishedWork, finishedWork.return, error);
						}
					}
					break;
				case 3:
					tagCaches = null;
					hoistableRoot = currentHoistableRoot;
					currentHoistableRoot = getHoistableRoot(root$1.containerInfo);
					recursivelyTraverseMutationEffects(root$1, finishedWork);
					currentHoistableRoot = hoistableRoot;
					commitReconciliationEffects(finishedWork);
					if (flags & 4 && null !== current && current.memoizedState.isDehydrated) try {
						retryIfBlockedOn(root$1.containerInfo);
					} catch (error) {
						captureCommitPhaseError(finishedWork, finishedWork.return, error);
					}
					needsFormReset && (needsFormReset = !1, recursivelyResetForms(finishedWork));
					break;
				case 4:
					flags = currentHoistableRoot;
					currentHoistableRoot = getHoistableRoot(finishedWork.stateNode.containerInfo);
					recursivelyTraverseMutationEffects(root$1, finishedWork);
					commitReconciliationEffects(finishedWork);
					currentHoistableRoot = flags;
					break;
				case 12:
					recursivelyTraverseMutationEffects(root$1, finishedWork);
					commitReconciliationEffects(finishedWork);
					break;
				case 31:
					recursivelyTraverseMutationEffects(root$1, finishedWork);
					commitReconciliationEffects(finishedWork);
					flags & 4 && (flags = finishedWork.updateQueue, null !== flags && (finishedWork.updateQueue = null, attachSuspenseRetryListeners(finishedWork, flags)));
					break;
				case 13:
					recursivelyTraverseMutationEffects(root$1, finishedWork);
					commitReconciliationEffects(finishedWork);
					finishedWork.child.flags & 8192 && null !== finishedWork.memoizedState !== (null !== current && null !== current.memoizedState) && (globalMostRecentFallbackTime = now());
					flags & 4 && (flags = finishedWork.updateQueue, null !== flags && (finishedWork.updateQueue = null, attachSuspenseRetryListeners(finishedWork, flags)));
					break;
				case 22:
					hoistableRoot = null !== finishedWork.memoizedState;
					var wasHidden = null !== current && null !== current.memoizedState, prevOffscreenSubtreeIsHidden = offscreenSubtreeIsHidden, prevOffscreenSubtreeWasHidden = offscreenSubtreeWasHidden;
					offscreenSubtreeIsHidden = prevOffscreenSubtreeIsHidden || hoistableRoot;
					offscreenSubtreeWasHidden = prevOffscreenSubtreeWasHidden || wasHidden;
					recursivelyTraverseMutationEffects(root$1, finishedWork);
					offscreenSubtreeWasHidden = prevOffscreenSubtreeWasHidden;
					offscreenSubtreeIsHidden = prevOffscreenSubtreeIsHidden;
					commitReconciliationEffects(finishedWork);
					if (flags & 8192) a: for (root$1 = finishedWork.stateNode, root$1._visibility = hoistableRoot ? root$1._visibility & -2 : root$1._visibility | 1, hoistableRoot && (null === current || wasHidden || offscreenSubtreeIsHidden || offscreenSubtreeWasHidden || recursivelyTraverseDisappearLayoutEffects(finishedWork)), current = null, root$1 = finishedWork;;) {
						if (5 === root$1.tag || 26 === root$1.tag) {
							if (null === current) {
								wasHidden = current = root$1;
								try {
									if (currentResource = wasHidden.stateNode, hoistableRoot) maybeNodes = currentResource.style, "function" === typeof maybeNodes.setProperty ? maybeNodes.setProperty("display", "none", "important") : maybeNodes.display = "none";
									else {
										i = wasHidden.stateNode;
										var styleProp = wasHidden.memoizedProps.style, display = void 0 !== styleProp && null !== styleProp && styleProp.hasOwnProperty("display") ? styleProp.display : null;
										i.style.display = null == display || "boolean" === typeof display ? "" : ("" + display).trim();
									}
								} catch (error) {
									captureCommitPhaseError(wasHidden, wasHidden.return, error);
								}
							}
						} else if (6 === root$1.tag) {
							if (null === current) {
								wasHidden = root$1;
								try {
									wasHidden.stateNode.nodeValue = hoistableRoot ? "" : wasHidden.memoizedProps;
								} catch (error) {
									captureCommitPhaseError(wasHidden, wasHidden.return, error);
								}
							}
						} else if (18 === root$1.tag) {
							if (null === current) {
								wasHidden = root$1;
								try {
									var instance = wasHidden.stateNode;
									hoistableRoot ? hideOrUnhideDehydratedBoundary(instance, !0) : hideOrUnhideDehydratedBoundary(wasHidden.stateNode, !1);
								} catch (error) {
									captureCommitPhaseError(wasHidden, wasHidden.return, error);
								}
							}
						} else if ((22 !== root$1.tag && 23 !== root$1.tag || null === root$1.memoizedState || root$1 === finishedWork) && null !== root$1.child) {
							root$1.child.return = root$1;
							root$1 = root$1.child;
							continue;
						}
						if (root$1 === finishedWork) break a;
						for (; null === root$1.sibling;) {
							if (null === root$1.return || root$1.return === finishedWork) break a;
							current === root$1 && (current = null);
							root$1 = root$1.return;
						}
						current === root$1 && (current = null);
						root$1.sibling.return = root$1.return;
						root$1 = root$1.sibling;
					}
					flags & 4 && (flags = finishedWork.updateQueue, null !== flags && (current = flags.retryQueue, null !== current && (flags.retryQueue = null, attachSuspenseRetryListeners(finishedWork, current))));
					break;
				case 19:
					recursivelyTraverseMutationEffects(root$1, finishedWork);
					commitReconciliationEffects(finishedWork);
					flags & 4 && (flags = finishedWork.updateQueue, null !== flags && (finishedWork.updateQueue = null, attachSuspenseRetryListeners(finishedWork, flags)));
					break;
				case 30: break;
				case 21: break;
				default: recursivelyTraverseMutationEffects(root$1, finishedWork), commitReconciliationEffects(finishedWork);
			}
		}
		function commitReconciliationEffects(finishedWork) {
			var flags = finishedWork.flags;
			if (flags & 2) {
				try {
					for (var hostParentFiber, parentFiber = finishedWork.return; null !== parentFiber;) {
						if (isHostParent(parentFiber)) {
							hostParentFiber = parentFiber;
							break;
						}
						parentFiber = parentFiber.return;
					}
					if (null == hostParentFiber) throw Error(formatProdErrorMessage(160));
					switch (hostParentFiber.tag) {
						case 27:
							var parent = hostParentFiber.stateNode;
							insertOrAppendPlacementNode(finishedWork, getHostSibling(finishedWork), parent);
							break;
						case 5:
							var parent$141 = hostParentFiber.stateNode;
							hostParentFiber.flags & 32 && (setTextContent(parent$141, ""), hostParentFiber.flags &= -33);
							insertOrAppendPlacementNode(finishedWork, getHostSibling(finishedWork), parent$141);
							break;
						case 3:
						case 4:
							var parent$143 = hostParentFiber.stateNode.containerInfo;
							insertOrAppendPlacementNodeIntoContainer(finishedWork, getHostSibling(finishedWork), parent$143);
							break;
						default: throw Error(formatProdErrorMessage(161));
					}
				} catch (error) {
					captureCommitPhaseError(finishedWork, finishedWork.return, error);
				}
				finishedWork.flags &= -3;
			}
			flags & 4096 && (finishedWork.flags &= -4097);
		}
		function recursivelyResetForms(parentFiber) {
			if (parentFiber.subtreeFlags & 1024) for (parentFiber = parentFiber.child; null !== parentFiber;) {
				var fiber = parentFiber;
				recursivelyResetForms(fiber);
				5 === fiber.tag && fiber.flags & 1024 && fiber.stateNode.reset();
				parentFiber = parentFiber.sibling;
			}
		}
		function recursivelyTraverseLayoutEffects(root$1, parentFiber) {
			if (parentFiber.subtreeFlags & 8772) for (parentFiber = parentFiber.child; null !== parentFiber;) commitLayoutEffectOnFiber(root$1, parentFiber.alternate, parentFiber), parentFiber = parentFiber.sibling;
		}
		function recursivelyTraverseDisappearLayoutEffects(parentFiber) {
			for (parentFiber = parentFiber.child; null !== parentFiber;) {
				var finishedWork = parentFiber;
				switch (finishedWork.tag) {
					case 0:
					case 11:
					case 14:
					case 15:
						commitHookEffectListUnmount(4, finishedWork, finishedWork.return);
						recursivelyTraverseDisappearLayoutEffects(finishedWork);
						break;
					case 1:
						safelyDetachRef(finishedWork, finishedWork.return);
						var instance = finishedWork.stateNode;
						"function" === typeof instance.componentWillUnmount && safelyCallComponentWillUnmount(finishedWork, finishedWork.return, instance);
						recursivelyTraverseDisappearLayoutEffects(finishedWork);
						break;
					case 27: releaseSingletonInstance(finishedWork.stateNode);
					case 26:
					case 5:
						safelyDetachRef(finishedWork, finishedWork.return);
						recursivelyTraverseDisappearLayoutEffects(finishedWork);
						break;
					case 22:
						null === finishedWork.memoizedState && recursivelyTraverseDisappearLayoutEffects(finishedWork);
						break;
					case 30:
						recursivelyTraverseDisappearLayoutEffects(finishedWork);
						break;
					default: recursivelyTraverseDisappearLayoutEffects(finishedWork);
				}
				parentFiber = parentFiber.sibling;
			}
		}
		function recursivelyTraverseReappearLayoutEffects(finishedRoot$jscomp$0, parentFiber, includeWorkInProgressEffects) {
			includeWorkInProgressEffects = includeWorkInProgressEffects && 0 !== (parentFiber.subtreeFlags & 8772);
			for (parentFiber = parentFiber.child; null !== parentFiber;) {
				var current = parentFiber.alternate, finishedRoot = finishedRoot$jscomp$0, finishedWork = parentFiber, flags = finishedWork.flags;
				switch (finishedWork.tag) {
					case 0:
					case 11:
					case 15:
						recursivelyTraverseReappearLayoutEffects(finishedRoot, finishedWork, includeWorkInProgressEffects);
						commitHookEffectListMount(4, finishedWork);
						break;
					case 1:
						recursivelyTraverseReappearLayoutEffects(finishedRoot, finishedWork, includeWorkInProgressEffects);
						current = finishedWork;
						finishedRoot = current.stateNode;
						if ("function" === typeof finishedRoot.componentDidMount) try {
							finishedRoot.componentDidMount();
						} catch (error) {
							captureCommitPhaseError(current, current.return, error);
						}
						current = finishedWork;
						finishedRoot = current.updateQueue;
						if (null !== finishedRoot) {
							var instance = current.stateNode;
							try {
								var hiddenCallbacks = finishedRoot.shared.hiddenCallbacks;
								if (null !== hiddenCallbacks) for (finishedRoot.shared.hiddenCallbacks = null, finishedRoot = 0; finishedRoot < hiddenCallbacks.length; finishedRoot++) callCallback(hiddenCallbacks[finishedRoot], instance);
							} catch (error) {
								captureCommitPhaseError(current, current.return, error);
							}
						}
						includeWorkInProgressEffects && flags & 64 && commitClassCallbacks(finishedWork);
						safelyAttachRef(finishedWork, finishedWork.return);
						break;
					case 27: commitHostSingletonAcquisition(finishedWork);
					case 26:
					case 5:
						recursivelyTraverseReappearLayoutEffects(finishedRoot, finishedWork, includeWorkInProgressEffects);
						includeWorkInProgressEffects && null === current && flags & 4 && commitHostMount(finishedWork);
						safelyAttachRef(finishedWork, finishedWork.return);
						break;
					case 12:
						recursivelyTraverseReappearLayoutEffects(finishedRoot, finishedWork, includeWorkInProgressEffects);
						break;
					case 31:
						recursivelyTraverseReappearLayoutEffects(finishedRoot, finishedWork, includeWorkInProgressEffects);
						includeWorkInProgressEffects && flags & 4 && commitActivityHydrationCallbacks(finishedRoot, finishedWork);
						break;
					case 13:
						recursivelyTraverseReappearLayoutEffects(finishedRoot, finishedWork, includeWorkInProgressEffects);
						includeWorkInProgressEffects && flags & 4 && commitSuspenseHydrationCallbacks(finishedRoot, finishedWork);
						break;
					case 22:
						null === finishedWork.memoizedState && recursivelyTraverseReappearLayoutEffects(finishedRoot, finishedWork, includeWorkInProgressEffects);
						safelyAttachRef(finishedWork, finishedWork.return);
						break;
					case 30: break;
					default: recursivelyTraverseReappearLayoutEffects(finishedRoot, finishedWork, includeWorkInProgressEffects);
				}
				parentFiber = parentFiber.sibling;
			}
		}
		function commitOffscreenPassiveMountEffects(current, finishedWork) {
			var previousCache = null;
			null !== current && null !== current.memoizedState && null !== current.memoizedState.cachePool && (previousCache = current.memoizedState.cachePool.pool);
			current = null;
			null !== finishedWork.memoizedState && null !== finishedWork.memoizedState.cachePool && (current = finishedWork.memoizedState.cachePool.pool);
			current !== previousCache && (null != current && current.refCount++, null != previousCache && releaseCache(previousCache));
		}
		function commitCachePassiveMountEffect(current, finishedWork) {
			current = null;
			null !== finishedWork.alternate && (current = finishedWork.alternate.memoizedState.cache);
			finishedWork = finishedWork.memoizedState.cache;
			finishedWork !== current && (finishedWork.refCount++, null != current && releaseCache(current));
		}
		function recursivelyTraversePassiveMountEffects(root$1, parentFiber, committedLanes, committedTransitions) {
			if (parentFiber.subtreeFlags & 10256) for (parentFiber = parentFiber.child; null !== parentFiber;) commitPassiveMountOnFiber(root$1, parentFiber, committedLanes, committedTransitions), parentFiber = parentFiber.sibling;
		}
		function commitPassiveMountOnFiber(finishedRoot, finishedWork, committedLanes, committedTransitions) {
			var flags = finishedWork.flags;
			switch (finishedWork.tag) {
				case 0:
				case 11:
				case 15:
					recursivelyTraversePassiveMountEffects(finishedRoot, finishedWork, committedLanes, committedTransitions);
					flags & 2048 && commitHookEffectListMount(9, finishedWork);
					break;
				case 1:
					recursivelyTraversePassiveMountEffects(finishedRoot, finishedWork, committedLanes, committedTransitions);
					break;
				case 3:
					recursivelyTraversePassiveMountEffects(finishedRoot, finishedWork, committedLanes, committedTransitions);
					flags & 2048 && (finishedRoot = null, null !== finishedWork.alternate && (finishedRoot = finishedWork.alternate.memoizedState.cache), finishedWork = finishedWork.memoizedState.cache, finishedWork !== finishedRoot && (finishedWork.refCount++, null != finishedRoot && releaseCache(finishedRoot)));
					break;
				case 12:
					if (flags & 2048) {
						recursivelyTraversePassiveMountEffects(finishedRoot, finishedWork, committedLanes, committedTransitions);
						finishedRoot = finishedWork.stateNode;
						try {
							var _finishedWork$memoize2 = finishedWork.memoizedProps, id = _finishedWork$memoize2.id, onPostCommit = _finishedWork$memoize2.onPostCommit;
							"function" === typeof onPostCommit && onPostCommit(id, null === finishedWork.alternate ? "mount" : "update", finishedRoot.passiveEffectDuration, -0);
						} catch (error) {
							captureCommitPhaseError(finishedWork, finishedWork.return, error);
						}
					} else recursivelyTraversePassiveMountEffects(finishedRoot, finishedWork, committedLanes, committedTransitions);
					break;
				case 31:
					recursivelyTraversePassiveMountEffects(finishedRoot, finishedWork, committedLanes, committedTransitions);
					break;
				case 13:
					recursivelyTraversePassiveMountEffects(finishedRoot, finishedWork, committedLanes, committedTransitions);
					break;
				case 23: break;
				case 22:
					_finishedWork$memoize2 = finishedWork.stateNode;
					id = finishedWork.alternate;
					null !== finishedWork.memoizedState ? _finishedWork$memoize2._visibility & 2 ? recursivelyTraversePassiveMountEffects(finishedRoot, finishedWork, committedLanes, committedTransitions) : recursivelyTraverseAtomicPassiveEffects(finishedRoot, finishedWork) : _finishedWork$memoize2._visibility & 2 ? recursivelyTraversePassiveMountEffects(finishedRoot, finishedWork, committedLanes, committedTransitions) : (_finishedWork$memoize2._visibility |= 2, recursivelyTraverseReconnectPassiveEffects(finishedRoot, finishedWork, committedLanes, committedTransitions, 0 !== (finishedWork.subtreeFlags & 10256) || !1));
					flags & 2048 && commitOffscreenPassiveMountEffects(id, finishedWork);
					break;
				case 24:
					recursivelyTraversePassiveMountEffects(finishedRoot, finishedWork, committedLanes, committedTransitions);
					flags & 2048 && commitCachePassiveMountEffect(finishedWork.alternate, finishedWork);
					break;
				default: recursivelyTraversePassiveMountEffects(finishedRoot, finishedWork, committedLanes, committedTransitions);
			}
		}
		function recursivelyTraverseReconnectPassiveEffects(finishedRoot$jscomp$0, parentFiber, committedLanes$jscomp$0, committedTransitions$jscomp$0, includeWorkInProgressEffects) {
			includeWorkInProgressEffects = includeWorkInProgressEffects && (0 !== (parentFiber.subtreeFlags & 10256) || !1);
			for (parentFiber = parentFiber.child; null !== parentFiber;) {
				var finishedRoot = finishedRoot$jscomp$0, finishedWork = parentFiber, committedLanes = committedLanes$jscomp$0, committedTransitions = committedTransitions$jscomp$0, flags = finishedWork.flags;
				switch (finishedWork.tag) {
					case 0:
					case 11:
					case 15:
						recursivelyTraverseReconnectPassiveEffects(finishedRoot, finishedWork, committedLanes, committedTransitions, includeWorkInProgressEffects);
						commitHookEffectListMount(8, finishedWork);
						break;
					case 23: break;
					case 22:
						var instance = finishedWork.stateNode;
						null !== finishedWork.memoizedState ? instance._visibility & 2 ? recursivelyTraverseReconnectPassiveEffects(finishedRoot, finishedWork, committedLanes, committedTransitions, includeWorkInProgressEffects) : recursivelyTraverseAtomicPassiveEffects(finishedRoot, finishedWork) : (instance._visibility |= 2, recursivelyTraverseReconnectPassiveEffects(finishedRoot, finishedWork, committedLanes, committedTransitions, includeWorkInProgressEffects));
						includeWorkInProgressEffects && flags & 2048 && commitOffscreenPassiveMountEffects(finishedWork.alternate, finishedWork);
						break;
					case 24:
						recursivelyTraverseReconnectPassiveEffects(finishedRoot, finishedWork, committedLanes, committedTransitions, includeWorkInProgressEffects);
						includeWorkInProgressEffects && flags & 2048 && commitCachePassiveMountEffect(finishedWork.alternate, finishedWork);
						break;
					default: recursivelyTraverseReconnectPassiveEffects(finishedRoot, finishedWork, committedLanes, committedTransitions, includeWorkInProgressEffects);
				}
				parentFiber = parentFiber.sibling;
			}
		}
		function recursivelyTraverseAtomicPassiveEffects(finishedRoot$jscomp$0, parentFiber) {
			if (parentFiber.subtreeFlags & 10256) for (parentFiber = parentFiber.child; null !== parentFiber;) {
				var finishedRoot = finishedRoot$jscomp$0, finishedWork = parentFiber, flags = finishedWork.flags;
				switch (finishedWork.tag) {
					case 22:
						recursivelyTraverseAtomicPassiveEffects(finishedRoot, finishedWork);
						flags & 2048 && commitOffscreenPassiveMountEffects(finishedWork.alternate, finishedWork);
						break;
					case 24:
						recursivelyTraverseAtomicPassiveEffects(finishedRoot, finishedWork);
						flags & 2048 && commitCachePassiveMountEffect(finishedWork.alternate, finishedWork);
						break;
					default: recursivelyTraverseAtomicPassiveEffects(finishedRoot, finishedWork);
				}
				parentFiber = parentFiber.sibling;
			}
		}
		var suspenseyCommitFlag = 8192;
		function recursivelyAccumulateSuspenseyCommit(parentFiber, committedLanes, suspendedState) {
			if (parentFiber.subtreeFlags & suspenseyCommitFlag) for (parentFiber = parentFiber.child; null !== parentFiber;) accumulateSuspenseyCommitOnFiber(parentFiber, committedLanes, suspendedState), parentFiber = parentFiber.sibling;
		}
		function accumulateSuspenseyCommitOnFiber(fiber, committedLanes, suspendedState) {
			switch (fiber.tag) {
				case 26:
					recursivelyAccumulateSuspenseyCommit(fiber, committedLanes, suspendedState);
					fiber.flags & suspenseyCommitFlag && null !== fiber.memoizedState && suspendResource(suspendedState, currentHoistableRoot, fiber.memoizedState, fiber.memoizedProps);
					break;
				case 5:
					recursivelyAccumulateSuspenseyCommit(fiber, committedLanes, suspendedState);
					break;
				case 3:
				case 4:
					var previousHoistableRoot = currentHoistableRoot;
					currentHoistableRoot = getHoistableRoot(fiber.stateNode.containerInfo);
					recursivelyAccumulateSuspenseyCommit(fiber, committedLanes, suspendedState);
					currentHoistableRoot = previousHoistableRoot;
					break;
				case 22:
					null === fiber.memoizedState && (previousHoistableRoot = fiber.alternate, null !== previousHoistableRoot && null !== previousHoistableRoot.memoizedState ? (previousHoistableRoot = suspenseyCommitFlag, suspenseyCommitFlag = 16777216, recursivelyAccumulateSuspenseyCommit(fiber, committedLanes, suspendedState), suspenseyCommitFlag = previousHoistableRoot) : recursivelyAccumulateSuspenseyCommit(fiber, committedLanes, suspendedState));
					break;
				default: recursivelyAccumulateSuspenseyCommit(fiber, committedLanes, suspendedState);
			}
		}
		function detachAlternateSiblings(parentFiber) {
			var previousFiber = parentFiber.alternate;
			if (null !== previousFiber && (parentFiber = previousFiber.child, null !== parentFiber)) {
				previousFiber.child = null;
				do
					previousFiber = parentFiber.sibling, parentFiber.sibling = null, parentFiber = previousFiber;
				while (null !== parentFiber);
			}
		}
		function recursivelyTraversePassiveUnmountEffects(parentFiber) {
			var deletions = parentFiber.deletions;
			if (0 !== (parentFiber.flags & 16)) {
				if (null !== deletions) for (var i = 0; i < deletions.length; i++) {
					var childToDelete = deletions[i];
					nextEffect = childToDelete;
					commitPassiveUnmountEffectsInsideOfDeletedTree_begin(childToDelete, parentFiber);
				}
				detachAlternateSiblings(parentFiber);
			}
			if (parentFiber.subtreeFlags & 10256) for (parentFiber = parentFiber.child; null !== parentFiber;) commitPassiveUnmountOnFiber(parentFiber), parentFiber = parentFiber.sibling;
		}
		function commitPassiveUnmountOnFiber(finishedWork) {
			switch (finishedWork.tag) {
				case 0:
				case 11:
				case 15:
					recursivelyTraversePassiveUnmountEffects(finishedWork);
					finishedWork.flags & 2048 && commitHookEffectListUnmount(9, finishedWork, finishedWork.return);
					break;
				case 3:
					recursivelyTraversePassiveUnmountEffects(finishedWork);
					break;
				case 12:
					recursivelyTraversePassiveUnmountEffects(finishedWork);
					break;
				case 22:
					var instance = finishedWork.stateNode;
					null !== finishedWork.memoizedState && instance._visibility & 2 && (null === finishedWork.return || 13 !== finishedWork.return.tag) ? (instance._visibility &= -3, recursivelyTraverseDisconnectPassiveEffects(finishedWork)) : recursivelyTraversePassiveUnmountEffects(finishedWork);
					break;
				default: recursivelyTraversePassiveUnmountEffects(finishedWork);
			}
		}
		function recursivelyTraverseDisconnectPassiveEffects(parentFiber) {
			var deletions = parentFiber.deletions;
			if (0 !== (parentFiber.flags & 16)) {
				if (null !== deletions) for (var i = 0; i < deletions.length; i++) {
					var childToDelete = deletions[i];
					nextEffect = childToDelete;
					commitPassiveUnmountEffectsInsideOfDeletedTree_begin(childToDelete, parentFiber);
				}
				detachAlternateSiblings(parentFiber);
			}
			for (parentFiber = parentFiber.child; null !== parentFiber;) {
				deletions = parentFiber;
				switch (deletions.tag) {
					case 0:
					case 11:
					case 15:
						commitHookEffectListUnmount(8, deletions, deletions.return);
						recursivelyTraverseDisconnectPassiveEffects(deletions);
						break;
					case 22:
						i = deletions.stateNode;
						i._visibility & 2 && (i._visibility &= -3, recursivelyTraverseDisconnectPassiveEffects(deletions));
						break;
					default: recursivelyTraverseDisconnectPassiveEffects(deletions);
				}
				parentFiber = parentFiber.sibling;
			}
		}
		function commitPassiveUnmountEffectsInsideOfDeletedTree_begin(deletedSubtreeRoot, nearestMountedAncestor) {
			for (; null !== nextEffect;) {
				var fiber = nextEffect;
				switch (fiber.tag) {
					case 0:
					case 11:
					case 15:
						commitHookEffectListUnmount(8, fiber, nearestMountedAncestor);
						break;
					case 23:
					case 22:
						if (null !== fiber.memoizedState && null !== fiber.memoizedState.cachePool) {
							var cache = fiber.memoizedState.cachePool.pool;
							null != cache && cache.refCount++;
						}
						break;
					case 24: releaseCache(fiber.memoizedState.cache);
				}
				cache = fiber.child;
				if (null !== cache) cache.return = fiber, nextEffect = cache;
				else a: for (fiber = deletedSubtreeRoot; null !== nextEffect;) {
					cache = nextEffect;
					var sibling = cache.sibling, returnFiber = cache.return;
					detachFiberAfterEffects(cache);
					if (cache === fiber) {
						nextEffect = null;
						break a;
					}
					if (null !== sibling) {
						sibling.return = returnFiber;
						nextEffect = sibling;
						break a;
					}
					nextEffect = returnFiber;
				}
			}
		}
		var DefaultAsyncDispatcher = {
			getCacheForType: function(resourceType) {
				var cache = readContext(CacheContext), cacheForType = cache.data.get(resourceType);
				void 0 === cacheForType && (cacheForType = resourceType(), cache.data.set(resourceType, cacheForType));
				return cacheForType;
			},
			cacheSignal: function() {
				return readContext(CacheContext).controller.signal;
			}
		}, PossiblyWeakMap = "function" === typeof WeakMap ? WeakMap : Map, executionContext = 0, workInProgressRoot = null, workInProgress = null, workInProgressRootRenderLanes = 0, workInProgressSuspendedReason = 0, workInProgressThrownValue = null, workInProgressRootDidSkipSuspendedSiblings = !1, workInProgressRootIsPrerendering = !1, workInProgressRootDidAttachPingListener = !1, entangledRenderLanes = 0, workInProgressRootExitStatus = 0, workInProgressRootSkippedLanes = 0, workInProgressRootInterleavedUpdatedLanes = 0, workInProgressRootPingedLanes = 0, workInProgressDeferredLane = 0, workInProgressSuspendedRetryLanes = 0, workInProgressRootConcurrentErrors = null, workInProgressRootRecoverableErrors = null, workInProgressRootDidIncludeRecursiveRenderUpdate = !1, globalMostRecentFallbackTime = 0, globalMostRecentTransitionTime = 0, workInProgressRootRenderTargetTime = Infinity, workInProgressTransitions = null, legacyErrorBoundariesThatAlreadyFailed = null, pendingEffectsStatus = 0, pendingEffectsRoot = null, pendingFinishedWork = null, pendingEffectsLanes = 0, pendingEffectsRemainingLanes = 0, pendingPassiveTransitions = null, pendingRecoverableErrors = null, nestedUpdateCount = 0, rootWithNestedUpdates = null;
		function requestUpdateLane() {
			return 0 !== (executionContext & 2) && 0 !== workInProgressRootRenderLanes ? workInProgressRootRenderLanes & -workInProgressRootRenderLanes : null !== ReactSharedInternals.T ? requestTransitionLane() : resolveUpdatePriority();
		}
		function requestDeferredLane() {
			if (0 === workInProgressDeferredLane) if (0 === (workInProgressRootRenderLanes & 536870912) || isHydrating) {
				var lane = nextTransitionDeferredLane;
				nextTransitionDeferredLane <<= 1;
				0 === (nextTransitionDeferredLane & 3932160) && (nextTransitionDeferredLane = 262144);
				workInProgressDeferredLane = lane;
			} else workInProgressDeferredLane = 536870912;
			lane = suspenseHandlerStackCursor.current;
			null !== lane && (lane.flags |= 32);
			return workInProgressDeferredLane;
		}
		function scheduleUpdateOnFiber(root$1, fiber, lane) {
			if (root$1 === workInProgressRoot && (2 === workInProgressSuspendedReason || 9 === workInProgressSuspendedReason) || null !== root$1.cancelPendingCommit) prepareFreshStack(root$1, 0), markRootSuspended(root$1, workInProgressRootRenderLanes, workInProgressDeferredLane, !1);
			markRootUpdated$1(root$1, lane);
			if (0 === (executionContext & 2) || root$1 !== workInProgressRoot) root$1 === workInProgressRoot && (0 === (executionContext & 2) && (workInProgressRootInterleavedUpdatedLanes |= lane), 4 === workInProgressRootExitStatus && markRootSuspended(root$1, workInProgressRootRenderLanes, workInProgressDeferredLane, !1)), ensureRootIsScheduled(root$1);
		}
		function performWorkOnRoot(root$jscomp$0, lanes, forceSync) {
			if (0 !== (executionContext & 6)) throw Error(formatProdErrorMessage(327));
			var shouldTimeSlice = !forceSync && 0 === (lanes & 127) && 0 === (lanes & root$jscomp$0.expiredLanes) || checkIfRootIsPrerendering(root$jscomp$0, lanes), exitStatus = shouldTimeSlice ? renderRootConcurrent(root$jscomp$0, lanes) : renderRootSync(root$jscomp$0, lanes, !0), renderWasConcurrent = shouldTimeSlice;
			do {
				if (0 === exitStatus) {
					workInProgressRootIsPrerendering && !shouldTimeSlice && markRootSuspended(root$jscomp$0, lanes, 0, !1);
					break;
				} else {
					forceSync = root$jscomp$0.current.alternate;
					if (renderWasConcurrent && !isRenderConsistentWithExternalStores(forceSync)) {
						exitStatus = renderRootSync(root$jscomp$0, lanes, !1);
						renderWasConcurrent = !1;
						continue;
					}
					if (2 === exitStatus) {
						renderWasConcurrent = lanes;
						if (root$jscomp$0.errorRecoveryDisabledLanes & renderWasConcurrent) var JSCompiler_inline_result = 0;
						else JSCompiler_inline_result = root$jscomp$0.pendingLanes & -536870913, JSCompiler_inline_result = 0 !== JSCompiler_inline_result ? JSCompiler_inline_result : JSCompiler_inline_result & 536870912 ? 536870912 : 0;
						if (0 !== JSCompiler_inline_result) {
							lanes = JSCompiler_inline_result;
							a: {
								var root$1 = root$jscomp$0;
								exitStatus = workInProgressRootConcurrentErrors;
								var wasRootDehydrated = root$1.current.memoizedState.isDehydrated;
								wasRootDehydrated && (prepareFreshStack(root$1, JSCompiler_inline_result).flags |= 256);
								JSCompiler_inline_result = renderRootSync(root$1, JSCompiler_inline_result, !1);
								if (2 !== JSCompiler_inline_result) {
									if (workInProgressRootDidAttachPingListener && !wasRootDehydrated) {
										root$1.errorRecoveryDisabledLanes |= renderWasConcurrent;
										workInProgressRootInterleavedUpdatedLanes |= renderWasConcurrent;
										exitStatus = 4;
										break a;
									}
									renderWasConcurrent = workInProgressRootRecoverableErrors;
									workInProgressRootRecoverableErrors = exitStatus;
									null !== renderWasConcurrent && (null === workInProgressRootRecoverableErrors ? workInProgressRootRecoverableErrors = renderWasConcurrent : workInProgressRootRecoverableErrors.push.apply(workInProgressRootRecoverableErrors, renderWasConcurrent));
								}
								exitStatus = JSCompiler_inline_result;
							}
							renderWasConcurrent = !1;
							if (2 !== exitStatus) continue;
						}
					}
					if (1 === exitStatus) {
						prepareFreshStack(root$jscomp$0, 0);
						markRootSuspended(root$jscomp$0, lanes, 0, !0);
						break;
					}
					a: {
						shouldTimeSlice = root$jscomp$0;
						renderWasConcurrent = exitStatus;
						switch (renderWasConcurrent) {
							case 0:
							case 1: throw Error(formatProdErrorMessage(345));
							case 4: if ((lanes & 4194048) !== lanes) break;
							case 6:
								markRootSuspended(shouldTimeSlice, lanes, workInProgressDeferredLane, !workInProgressRootDidSkipSuspendedSiblings);
								break a;
							case 2:
								workInProgressRootRecoverableErrors = null;
								break;
							case 3:
							case 5: break;
							default: throw Error(formatProdErrorMessage(329));
						}
						if ((lanes & 62914560) === lanes && (exitStatus = globalMostRecentFallbackTime + 300 - now(), 10 < exitStatus)) {
							markRootSuspended(shouldTimeSlice, lanes, workInProgressDeferredLane, !workInProgressRootDidSkipSuspendedSiblings);
							if (0 !== getNextLanes(shouldTimeSlice, 0, !0)) break a;
							pendingEffectsLanes = lanes;
							shouldTimeSlice.timeoutHandle = scheduleTimeout(commitRootWhenReady.bind(null, shouldTimeSlice, forceSync, workInProgressRootRecoverableErrors, workInProgressTransitions, workInProgressRootDidIncludeRecursiveRenderUpdate, lanes, workInProgressDeferredLane, workInProgressRootInterleavedUpdatedLanes, workInProgressSuspendedRetryLanes, workInProgressRootDidSkipSuspendedSiblings, renderWasConcurrent, "Throttled", -0, 0), exitStatus);
							break a;
						}
						commitRootWhenReady(shouldTimeSlice, forceSync, workInProgressRootRecoverableErrors, workInProgressTransitions, workInProgressRootDidIncludeRecursiveRenderUpdate, lanes, workInProgressDeferredLane, workInProgressRootInterleavedUpdatedLanes, workInProgressSuspendedRetryLanes, workInProgressRootDidSkipSuspendedSiblings, renderWasConcurrent, null, -0, 0);
					}
				}
				break;
			} while (1);
			ensureRootIsScheduled(root$jscomp$0);
		}
		function commitRootWhenReady(root$1, finishedWork, recoverableErrors, transitions, didIncludeRenderPhaseUpdate, lanes, spawnedLane, updatedLanes, suspendedRetryLanes, didSkipSuspendedSiblings, exitStatus, suspendedCommitReason, completedRenderStartTime, completedRenderEndTime) {
			root$1.timeoutHandle = -1;
			suspendedCommitReason = finishedWork.subtreeFlags;
			if (suspendedCommitReason & 8192 || 16785408 === (suspendedCommitReason & 16785408)) {
				suspendedCommitReason = {
					stylesheets: null,
					count: 0,
					imgCount: 0,
					imgBytes: 0,
					suspenseyImages: [],
					waitingForImages: !0,
					waitingForViewTransition: !1,
					unsuspend: noop$1
				};
				accumulateSuspenseyCommitOnFiber(finishedWork, lanes, suspendedCommitReason);
				var timeoutOffset = (lanes & 62914560) === lanes ? globalMostRecentFallbackTime - now() : (lanes & 4194048) === lanes ? globalMostRecentTransitionTime - now() : 0;
				timeoutOffset = waitForCommitToBeReady(suspendedCommitReason, timeoutOffset);
				if (null !== timeoutOffset) {
					pendingEffectsLanes = lanes;
					root$1.cancelPendingCommit = timeoutOffset(commitRoot.bind(null, root$1, finishedWork, lanes, recoverableErrors, transitions, didIncludeRenderPhaseUpdate, spawnedLane, updatedLanes, suspendedRetryLanes, exitStatus, suspendedCommitReason, null, completedRenderStartTime, completedRenderEndTime));
					markRootSuspended(root$1, lanes, spawnedLane, !didSkipSuspendedSiblings);
					return;
				}
			}
			commitRoot(root$1, finishedWork, lanes, recoverableErrors, transitions, didIncludeRenderPhaseUpdate, spawnedLane, updatedLanes, suspendedRetryLanes);
		}
		function isRenderConsistentWithExternalStores(finishedWork) {
			for (var node = finishedWork;;) {
				var tag = node.tag;
				if ((0 === tag || 11 === tag || 15 === tag) && node.flags & 16384 && (tag = node.updateQueue, null !== tag && (tag = tag.stores, null !== tag))) for (var i = 0; i < tag.length; i++) {
					var check = tag[i], getSnapshot = check.getSnapshot;
					check = check.value;
					try {
						if (!objectIs(getSnapshot(), check)) return !1;
					} catch (error) {
						return !1;
					}
				}
				tag = node.child;
				if (node.subtreeFlags & 16384 && null !== tag) tag.return = node, node = tag;
				else {
					if (node === finishedWork) break;
					for (; null === node.sibling;) {
						if (null === node.return || node.return === finishedWork) return !0;
						node = node.return;
					}
					node.sibling.return = node.return;
					node = node.sibling;
				}
			}
			return !0;
		}
		function markRootSuspended(root$1, suspendedLanes, spawnedLane, didAttemptEntireTree) {
			suspendedLanes &= ~workInProgressRootPingedLanes;
			suspendedLanes &= ~workInProgressRootInterleavedUpdatedLanes;
			root$1.suspendedLanes |= suspendedLanes;
			root$1.pingedLanes &= ~suspendedLanes;
			didAttemptEntireTree && (root$1.warmLanes |= suspendedLanes);
			didAttemptEntireTree = root$1.expirationTimes;
			for (var lanes = suspendedLanes; 0 < lanes;) {
				var index$6 = 31 - clz32(lanes), lane = 1 << index$6;
				didAttemptEntireTree[index$6] = -1;
				lanes &= ~lane;
			}
			0 !== spawnedLane && markSpawnedDeferredLane(root$1, spawnedLane, suspendedLanes);
		}
		function flushSyncWork$1() {
			return 0 === (executionContext & 6) ? (flushSyncWorkAcrossRoots_impl(0, !1), !1) : !0;
		}
		function resetWorkInProgressStack() {
			if (null !== workInProgress) {
				if (0 === workInProgressSuspendedReason) var interruptedWork = workInProgress.return;
				else interruptedWork = workInProgress, lastContextDependency = currentlyRenderingFiber$1 = null, resetHooksOnUnwind(interruptedWork), thenableState$1 = null, thenableIndexCounter$1 = 0, interruptedWork = workInProgress;
				for (; null !== interruptedWork;) unwindInterruptedWork(interruptedWork.alternate, interruptedWork), interruptedWork = interruptedWork.return;
				workInProgress = null;
			}
		}
		function prepareFreshStack(root$1, lanes) {
			var timeoutHandle = root$1.timeoutHandle;
			-1 !== timeoutHandle && (root$1.timeoutHandle = -1, cancelTimeout(timeoutHandle));
			timeoutHandle = root$1.cancelPendingCommit;
			null !== timeoutHandle && (root$1.cancelPendingCommit = null, timeoutHandle());
			pendingEffectsLanes = 0;
			resetWorkInProgressStack();
			workInProgressRoot = root$1;
			workInProgress = timeoutHandle = createWorkInProgress(root$1.current, null);
			workInProgressRootRenderLanes = lanes;
			workInProgressSuspendedReason = 0;
			workInProgressThrownValue = null;
			workInProgressRootDidSkipSuspendedSiblings = !1;
			workInProgressRootIsPrerendering = checkIfRootIsPrerendering(root$1, lanes);
			workInProgressRootDidAttachPingListener = !1;
			workInProgressSuspendedRetryLanes = workInProgressDeferredLane = workInProgressRootPingedLanes = workInProgressRootInterleavedUpdatedLanes = workInProgressRootSkippedLanes = workInProgressRootExitStatus = 0;
			workInProgressRootRecoverableErrors = workInProgressRootConcurrentErrors = null;
			workInProgressRootDidIncludeRecursiveRenderUpdate = !1;
			0 !== (lanes & 8) && (lanes |= lanes & 32);
			var allEntangledLanes = root$1.entangledLanes;
			if (0 !== allEntangledLanes) for (root$1 = root$1.entanglements, allEntangledLanes &= lanes; 0 < allEntangledLanes;) {
				var index$4 = 31 - clz32(allEntangledLanes), lane = 1 << index$4;
				lanes |= root$1[index$4];
				allEntangledLanes &= ~lane;
			}
			entangledRenderLanes = lanes;
			finishQueueingConcurrentUpdates();
			return timeoutHandle;
		}
		function handleThrow(root$1, thrownValue) {
			currentlyRenderingFiber = null;
			ReactSharedInternals.H = ContextOnlyDispatcher;
			thrownValue === SuspenseException || thrownValue === SuspenseActionException ? (thrownValue = getSuspendedThenable(), workInProgressSuspendedReason = 3) : thrownValue === SuspenseyCommitException ? (thrownValue = getSuspendedThenable(), workInProgressSuspendedReason = 4) : workInProgressSuspendedReason = thrownValue === SelectiveHydrationException ? 8 : null !== thrownValue && "object" === typeof thrownValue && "function" === typeof thrownValue.then ? 6 : 1;
			workInProgressThrownValue = thrownValue;
			null === workInProgress && (workInProgressRootExitStatus = 1, logUncaughtError(root$1, createCapturedValueAtFiber(thrownValue, root$1.current)));
		}
		function shouldRemainOnPreviousScreen() {
			var handler = suspenseHandlerStackCursor.current;
			return null === handler ? !0 : (workInProgressRootRenderLanes & 4194048) === workInProgressRootRenderLanes ? null === shellBoundary ? !0 : !1 : (workInProgressRootRenderLanes & 62914560) === workInProgressRootRenderLanes || 0 !== (workInProgressRootRenderLanes & 536870912) ? handler === shellBoundary : !1;
		}
		function pushDispatcher() {
			var prevDispatcher = ReactSharedInternals.H;
			ReactSharedInternals.H = ContextOnlyDispatcher;
			return null === prevDispatcher ? ContextOnlyDispatcher : prevDispatcher;
		}
		function pushAsyncDispatcher() {
			var prevAsyncDispatcher = ReactSharedInternals.A;
			ReactSharedInternals.A = DefaultAsyncDispatcher;
			return prevAsyncDispatcher;
		}
		function renderDidSuspendDelayIfPossible() {
			workInProgressRootExitStatus = 4;
			workInProgressRootDidSkipSuspendedSiblings || (workInProgressRootRenderLanes & 4194048) !== workInProgressRootRenderLanes && null !== suspenseHandlerStackCursor.current || (workInProgressRootIsPrerendering = !0);
			0 === (workInProgressRootSkippedLanes & 134217727) && 0 === (workInProgressRootInterleavedUpdatedLanes & 134217727) || null === workInProgressRoot || markRootSuspended(workInProgressRoot, workInProgressRootRenderLanes, workInProgressDeferredLane, !1);
		}
		function renderRootSync(root$1, lanes, shouldYieldForPrerendering) {
			var prevExecutionContext = executionContext;
			executionContext |= 2;
			var prevDispatcher = pushDispatcher(), prevAsyncDispatcher = pushAsyncDispatcher();
			if (workInProgressRoot !== root$1 || workInProgressRootRenderLanes !== lanes) workInProgressTransitions = null, prepareFreshStack(root$1, lanes);
			lanes = !1;
			var exitStatus = workInProgressRootExitStatus;
			a: do
				try {
					if (0 !== workInProgressSuspendedReason && null !== workInProgress) {
						var unitOfWork = workInProgress, thrownValue = workInProgressThrownValue;
						switch (workInProgressSuspendedReason) {
							case 8:
								resetWorkInProgressStack();
								exitStatus = 6;
								break a;
							case 3:
							case 2:
							case 9:
							case 6:
								null === suspenseHandlerStackCursor.current && (lanes = !0);
								var reason = workInProgressSuspendedReason;
								workInProgressSuspendedReason = 0;
								workInProgressThrownValue = null;
								throwAndUnwindWorkLoop(root$1, unitOfWork, thrownValue, reason);
								if (shouldYieldForPrerendering && workInProgressRootIsPrerendering) {
									exitStatus = 0;
									break a;
								}
								break;
							default: reason = workInProgressSuspendedReason, workInProgressSuspendedReason = 0, workInProgressThrownValue = null, throwAndUnwindWorkLoop(root$1, unitOfWork, thrownValue, reason);
						}
					}
					workLoopSync();
					exitStatus = workInProgressRootExitStatus;
					break;
				} catch (thrownValue$165) {
					handleThrow(root$1, thrownValue$165);
				}
			while (1);
			lanes && root$1.shellSuspendCounter++;
			lastContextDependency = currentlyRenderingFiber$1 = null;
			executionContext = prevExecutionContext;
			ReactSharedInternals.H = prevDispatcher;
			ReactSharedInternals.A = prevAsyncDispatcher;
			null === workInProgress && (workInProgressRoot = null, workInProgressRootRenderLanes = 0, finishQueueingConcurrentUpdates());
			return exitStatus;
		}
		function workLoopSync() {
			for (; null !== workInProgress;) performUnitOfWork(workInProgress);
		}
		function renderRootConcurrent(root$1, lanes) {
			var prevExecutionContext = executionContext;
			executionContext |= 2;
			var prevDispatcher = pushDispatcher(), prevAsyncDispatcher = pushAsyncDispatcher();
			workInProgressRoot !== root$1 || workInProgressRootRenderLanes !== lanes ? (workInProgressTransitions = null, workInProgressRootRenderTargetTime = now() + 500, prepareFreshStack(root$1, lanes)) : workInProgressRootIsPrerendering = checkIfRootIsPrerendering(root$1, lanes);
			a: do
				try {
					if (0 !== workInProgressSuspendedReason && null !== workInProgress) {
						lanes = workInProgress;
						var thrownValue = workInProgressThrownValue;
						b: switch (workInProgressSuspendedReason) {
							case 1:
								workInProgressSuspendedReason = 0;
								workInProgressThrownValue = null;
								throwAndUnwindWorkLoop(root$1, lanes, thrownValue, 1);
								break;
							case 2:
							case 9:
								if (isThenableResolved(thrownValue)) {
									workInProgressSuspendedReason = 0;
									workInProgressThrownValue = null;
									replaySuspendedUnitOfWork(lanes);
									break;
								}
								lanes = function() {
									2 !== workInProgressSuspendedReason && 9 !== workInProgressSuspendedReason || workInProgressRoot !== root$1 || (workInProgressSuspendedReason = 7);
									ensureRootIsScheduled(root$1);
								};
								thrownValue.then(lanes, lanes);
								break a;
							case 3:
								workInProgressSuspendedReason = 7;
								break a;
							case 4:
								workInProgressSuspendedReason = 5;
								break a;
							case 7:
								isThenableResolved(thrownValue) ? (workInProgressSuspendedReason = 0, workInProgressThrownValue = null, replaySuspendedUnitOfWork(lanes)) : (workInProgressSuspendedReason = 0, workInProgressThrownValue = null, throwAndUnwindWorkLoop(root$1, lanes, thrownValue, 7));
								break;
							case 5:
								var resource = null;
								switch (workInProgress.tag) {
									case 26: resource = workInProgress.memoizedState;
									case 5:
									case 27:
										var hostFiber = workInProgress;
										if (resource ? preloadResource(resource) : hostFiber.stateNode.complete) {
											workInProgressSuspendedReason = 0;
											workInProgressThrownValue = null;
											var sibling = hostFiber.sibling;
											if (null !== sibling) workInProgress = sibling;
											else {
												var returnFiber = hostFiber.return;
												null !== returnFiber ? (workInProgress = returnFiber, completeUnitOfWork(returnFiber)) : workInProgress = null;
											}
											break b;
										}
								}
								workInProgressSuspendedReason = 0;
								workInProgressThrownValue = null;
								throwAndUnwindWorkLoop(root$1, lanes, thrownValue, 5);
								break;
							case 6:
								workInProgressSuspendedReason = 0;
								workInProgressThrownValue = null;
								throwAndUnwindWorkLoop(root$1, lanes, thrownValue, 6);
								break;
							case 8:
								resetWorkInProgressStack();
								workInProgressRootExitStatus = 6;
								break a;
							default: throw Error(formatProdErrorMessage(462));
						}
					}
					workLoopConcurrentByScheduler();
					break;
				} catch (thrownValue$167) {
					handleThrow(root$1, thrownValue$167);
				}
			while (1);
			lastContextDependency = currentlyRenderingFiber$1 = null;
			ReactSharedInternals.H = prevDispatcher;
			ReactSharedInternals.A = prevAsyncDispatcher;
			executionContext = prevExecutionContext;
			if (null !== workInProgress) return 0;
			workInProgressRoot = null;
			workInProgressRootRenderLanes = 0;
			finishQueueingConcurrentUpdates();
			return workInProgressRootExitStatus;
		}
		function workLoopConcurrentByScheduler() {
			for (; null !== workInProgress && !shouldYield();) performUnitOfWork(workInProgress);
		}
		function performUnitOfWork(unitOfWork) {
			var next = beginWork(unitOfWork.alternate, unitOfWork, entangledRenderLanes);
			unitOfWork.memoizedProps = unitOfWork.pendingProps;
			null === next ? completeUnitOfWork(unitOfWork) : workInProgress = next;
		}
		function replaySuspendedUnitOfWork(unitOfWork) {
			var next = unitOfWork;
			var current = next.alternate;
			switch (next.tag) {
				case 15:
				case 0:
					next = replayFunctionComponent(current, next, next.pendingProps, next.type, void 0, workInProgressRootRenderLanes);
					break;
				case 11:
					next = replayFunctionComponent(current, next, next.pendingProps, next.type.render, next.ref, workInProgressRootRenderLanes);
					break;
				case 5: resetHooksOnUnwind(next);
				default: unwindInterruptedWork(current, next), next = workInProgress = resetWorkInProgress(next, entangledRenderLanes), next = beginWork(current, next, entangledRenderLanes);
			}
			unitOfWork.memoizedProps = unitOfWork.pendingProps;
			null === next ? completeUnitOfWork(unitOfWork) : workInProgress = next;
		}
		function throwAndUnwindWorkLoop(root$1, unitOfWork, thrownValue, suspendedReason) {
			lastContextDependency = currentlyRenderingFiber$1 = null;
			resetHooksOnUnwind(unitOfWork);
			thenableState$1 = null;
			thenableIndexCounter$1 = 0;
			var returnFiber = unitOfWork.return;
			try {
				if (throwException(root$1, returnFiber, unitOfWork, thrownValue, workInProgressRootRenderLanes)) {
					workInProgressRootExitStatus = 1;
					logUncaughtError(root$1, createCapturedValueAtFiber(thrownValue, root$1.current));
					workInProgress = null;
					return;
				}
			} catch (error) {
				if (null !== returnFiber) throw workInProgress = returnFiber, error;
				workInProgressRootExitStatus = 1;
				logUncaughtError(root$1, createCapturedValueAtFiber(thrownValue, root$1.current));
				workInProgress = null;
				return;
			}
			if (unitOfWork.flags & 32768) {
				if (isHydrating || 1 === suspendedReason) root$1 = !0;
				else if (workInProgressRootIsPrerendering || 0 !== (workInProgressRootRenderLanes & 536870912)) root$1 = !1;
				else if (workInProgressRootDidSkipSuspendedSiblings = root$1 = !0, 2 === suspendedReason || 9 === suspendedReason || 3 === suspendedReason || 6 === suspendedReason) suspendedReason = suspenseHandlerStackCursor.current, null !== suspendedReason && 13 === suspendedReason.tag && (suspendedReason.flags |= 16384);
				unwindUnitOfWork(unitOfWork, root$1);
			} else completeUnitOfWork(unitOfWork);
		}
		function completeUnitOfWork(unitOfWork) {
			var completedWork = unitOfWork;
			do {
				if (0 !== (completedWork.flags & 32768)) {
					unwindUnitOfWork(completedWork, workInProgressRootDidSkipSuspendedSiblings);
					return;
				}
				unitOfWork = completedWork.return;
				var next = completeWork(completedWork.alternate, completedWork, entangledRenderLanes);
				if (null !== next) {
					workInProgress = next;
					return;
				}
				completedWork = completedWork.sibling;
				if (null !== completedWork) {
					workInProgress = completedWork;
					return;
				}
				workInProgress = completedWork = unitOfWork;
			} while (null !== completedWork);
			0 === workInProgressRootExitStatus && (workInProgressRootExitStatus = 5);
		}
		function unwindUnitOfWork(unitOfWork, skipSiblings) {
			do {
				var next = unwindWork(unitOfWork.alternate, unitOfWork);
				if (null !== next) {
					next.flags &= 32767;
					workInProgress = next;
					return;
				}
				next = unitOfWork.return;
				null !== next && (next.flags |= 32768, next.subtreeFlags = 0, next.deletions = null);
				if (!skipSiblings && (unitOfWork = unitOfWork.sibling, null !== unitOfWork)) {
					workInProgress = unitOfWork;
					return;
				}
				workInProgress = unitOfWork = next;
			} while (null !== unitOfWork);
			workInProgressRootExitStatus = 6;
			workInProgress = null;
		}
		function commitRoot(root$1, finishedWork, lanes, recoverableErrors, transitions, didIncludeRenderPhaseUpdate, spawnedLane, updatedLanes, suspendedRetryLanes) {
			root$1.cancelPendingCommit = null;
			do
				flushPendingEffects();
			while (0 !== pendingEffectsStatus);
			if (0 !== (executionContext & 6)) throw Error(formatProdErrorMessage(327));
			if (null !== finishedWork) {
				if (finishedWork === root$1.current) throw Error(formatProdErrorMessage(177));
				didIncludeRenderPhaseUpdate = finishedWork.lanes | finishedWork.childLanes;
				didIncludeRenderPhaseUpdate |= concurrentlyUpdatedLanes;
				markRootFinished(root$1, lanes, didIncludeRenderPhaseUpdate, spawnedLane, updatedLanes, suspendedRetryLanes);
				root$1 === workInProgressRoot && (workInProgress = workInProgressRoot = null, workInProgressRootRenderLanes = 0);
				pendingFinishedWork = finishedWork;
				pendingEffectsRoot = root$1;
				pendingEffectsLanes = lanes;
				pendingEffectsRemainingLanes = didIncludeRenderPhaseUpdate;
				pendingPassiveTransitions = transitions;
				pendingRecoverableErrors = recoverableErrors;
				0 !== (finishedWork.subtreeFlags & 10256) || 0 !== (finishedWork.flags & 10256) ? (root$1.callbackNode = null, root$1.callbackPriority = 0, scheduleCallback$1(NormalPriority$1, function() {
					flushPassiveEffects();
					return null;
				})) : (root$1.callbackNode = null, root$1.callbackPriority = 0);
				recoverableErrors = 0 !== (finishedWork.flags & 13878);
				if (0 !== (finishedWork.subtreeFlags & 13878) || recoverableErrors) {
					recoverableErrors = ReactSharedInternals.T;
					ReactSharedInternals.T = null;
					transitions = ReactDOMSharedInternals.p;
					ReactDOMSharedInternals.p = 2;
					spawnedLane = executionContext;
					executionContext |= 4;
					try {
						commitBeforeMutationEffects(root$1, finishedWork, lanes);
					} finally {
						executionContext = spawnedLane, ReactDOMSharedInternals.p = transitions, ReactSharedInternals.T = recoverableErrors;
					}
				}
				pendingEffectsStatus = 1;
				flushMutationEffects();
				flushLayoutEffects();
				flushSpawnedWork();
			}
		}
		function flushMutationEffects() {
			if (1 === pendingEffectsStatus) {
				pendingEffectsStatus = 0;
				var root$1 = pendingEffectsRoot, finishedWork = pendingFinishedWork, rootMutationHasEffect = 0 !== (finishedWork.flags & 13878);
				if (0 !== (finishedWork.subtreeFlags & 13878) || rootMutationHasEffect) {
					rootMutationHasEffect = ReactSharedInternals.T;
					ReactSharedInternals.T = null;
					var previousPriority = ReactDOMSharedInternals.p;
					ReactDOMSharedInternals.p = 2;
					var prevExecutionContext = executionContext;
					executionContext |= 4;
					try {
						commitMutationEffectsOnFiber(finishedWork, root$1);
						var priorSelectionInformation = selectionInformation, curFocusedElem = getActiveElementDeep(root$1.containerInfo), priorFocusedElem = priorSelectionInformation.focusedElem, priorSelectionRange = priorSelectionInformation.selectionRange;
						if (curFocusedElem !== priorFocusedElem && priorFocusedElem && priorFocusedElem.ownerDocument && containsNode(priorFocusedElem.ownerDocument.documentElement, priorFocusedElem)) {
							if (null !== priorSelectionRange && hasSelectionCapabilities(priorFocusedElem)) {
								var start = priorSelectionRange.start, end = priorSelectionRange.end;
								void 0 === end && (end = start);
								if ("selectionStart" in priorFocusedElem) priorFocusedElem.selectionStart = start, priorFocusedElem.selectionEnd = Math.min(end, priorFocusedElem.value.length);
								else {
									var doc = priorFocusedElem.ownerDocument || document, win = doc && doc.defaultView || window;
									if (win.getSelection) {
										var selection = win.getSelection(), length = priorFocusedElem.textContent.length, start$jscomp$0 = Math.min(priorSelectionRange.start, length), end$jscomp$0 = void 0 === priorSelectionRange.end ? start$jscomp$0 : Math.min(priorSelectionRange.end, length);
										!selection.extend && start$jscomp$0 > end$jscomp$0 && (curFocusedElem = end$jscomp$0, end$jscomp$0 = start$jscomp$0, start$jscomp$0 = curFocusedElem);
										var startMarker = getNodeForCharacterOffset(priorFocusedElem, start$jscomp$0), endMarker = getNodeForCharacterOffset(priorFocusedElem, end$jscomp$0);
										if (startMarker && endMarker && (1 !== selection.rangeCount || selection.anchorNode !== startMarker.node || selection.anchorOffset !== startMarker.offset || selection.focusNode !== endMarker.node || selection.focusOffset !== endMarker.offset)) {
											var range = doc.createRange();
											range.setStart(startMarker.node, startMarker.offset);
											selection.removeAllRanges();
											start$jscomp$0 > end$jscomp$0 ? (selection.addRange(range), selection.extend(endMarker.node, endMarker.offset)) : (range.setEnd(endMarker.node, endMarker.offset), selection.addRange(range));
										}
									}
								}
							}
							doc = [];
							for (selection = priorFocusedElem; selection = selection.parentNode;) 1 === selection.nodeType && doc.push({
								element: selection,
								left: selection.scrollLeft,
								top: selection.scrollTop
							});
							"function" === typeof priorFocusedElem.focus && priorFocusedElem.focus();
							for (priorFocusedElem = 0; priorFocusedElem < doc.length; priorFocusedElem++) {
								var info = doc[priorFocusedElem];
								info.element.scrollLeft = info.left;
								info.element.scrollTop = info.top;
							}
						}
						_enabled = !!eventsEnabled;
						selectionInformation = eventsEnabled = null;
					} finally {
						executionContext = prevExecutionContext, ReactDOMSharedInternals.p = previousPriority, ReactSharedInternals.T = rootMutationHasEffect;
					}
				}
				root$1.current = finishedWork;
				pendingEffectsStatus = 2;
			}
		}
		function flushLayoutEffects() {
			if (2 === pendingEffectsStatus) {
				pendingEffectsStatus = 0;
				var root$1 = pendingEffectsRoot, finishedWork = pendingFinishedWork, rootHasLayoutEffect = 0 !== (finishedWork.flags & 8772);
				if (0 !== (finishedWork.subtreeFlags & 8772) || rootHasLayoutEffect) {
					rootHasLayoutEffect = ReactSharedInternals.T;
					ReactSharedInternals.T = null;
					var previousPriority = ReactDOMSharedInternals.p;
					ReactDOMSharedInternals.p = 2;
					var prevExecutionContext = executionContext;
					executionContext |= 4;
					try {
						commitLayoutEffectOnFiber(root$1, finishedWork.alternate, finishedWork);
					} finally {
						executionContext = prevExecutionContext, ReactDOMSharedInternals.p = previousPriority, ReactSharedInternals.T = rootHasLayoutEffect;
					}
				}
				pendingEffectsStatus = 3;
			}
		}
		function flushSpawnedWork() {
			if (4 === pendingEffectsStatus || 3 === pendingEffectsStatus) {
				pendingEffectsStatus = 0;
				requestPaint();
				var root$1 = pendingEffectsRoot, finishedWork = pendingFinishedWork, lanes = pendingEffectsLanes, recoverableErrors = pendingRecoverableErrors;
				0 !== (finishedWork.subtreeFlags & 10256) || 0 !== (finishedWork.flags & 10256) ? pendingEffectsStatus = 5 : (pendingEffectsStatus = 0, pendingFinishedWork = pendingEffectsRoot = null, releaseRootPooledCache(root$1, root$1.pendingLanes));
				var remainingLanes = root$1.pendingLanes;
				0 === remainingLanes && (legacyErrorBoundariesThatAlreadyFailed = null);
				lanesToEventPriority(lanes);
				finishedWork = finishedWork.stateNode;
				if (injectedHook && "function" === typeof injectedHook.onCommitFiberRoot) try {
					injectedHook.onCommitFiberRoot(rendererID, finishedWork, void 0, 128 === (finishedWork.current.flags & 128));
				} catch (err) {}
				if (null !== recoverableErrors) {
					finishedWork = ReactSharedInternals.T;
					remainingLanes = ReactDOMSharedInternals.p;
					ReactDOMSharedInternals.p = 2;
					ReactSharedInternals.T = null;
					try {
						for (var onRecoverableError = root$1.onRecoverableError, i = 0; i < recoverableErrors.length; i++) {
							var recoverableError = recoverableErrors[i];
							onRecoverableError(recoverableError.value, { componentStack: recoverableError.stack });
						}
					} finally {
						ReactSharedInternals.T = finishedWork, ReactDOMSharedInternals.p = remainingLanes;
					}
				}
				0 !== (pendingEffectsLanes & 3) && flushPendingEffects();
				ensureRootIsScheduled(root$1);
				remainingLanes = root$1.pendingLanes;
				0 !== (lanes & 261930) && 0 !== (remainingLanes & 42) ? root$1 === rootWithNestedUpdates ? nestedUpdateCount++ : (nestedUpdateCount = 0, rootWithNestedUpdates = root$1) : nestedUpdateCount = 0;
				flushSyncWorkAcrossRoots_impl(0, !1);
			}
		}
		function releaseRootPooledCache(root$1, remainingLanes) {
			0 === (root$1.pooledCacheLanes &= remainingLanes) && (remainingLanes = root$1.pooledCache, null != remainingLanes && (root$1.pooledCache = null, releaseCache(remainingLanes)));
		}
		function flushPendingEffects() {
			flushMutationEffects();
			flushLayoutEffects();
			flushSpawnedWork();
			return flushPassiveEffects();
		}
		function flushPassiveEffects() {
			if (5 !== pendingEffectsStatus) return !1;
			var root$1 = pendingEffectsRoot, remainingLanes = pendingEffectsRemainingLanes;
			pendingEffectsRemainingLanes = 0;
			var renderPriority = lanesToEventPriority(pendingEffectsLanes), prevTransition = ReactSharedInternals.T, previousPriority = ReactDOMSharedInternals.p;
			try {
				ReactDOMSharedInternals.p = 32 > renderPriority ? 32 : renderPriority;
				ReactSharedInternals.T = null;
				renderPriority = pendingPassiveTransitions;
				pendingPassiveTransitions = null;
				var root$jscomp$0 = pendingEffectsRoot, lanes = pendingEffectsLanes;
				pendingEffectsStatus = 0;
				pendingFinishedWork = pendingEffectsRoot = null;
				pendingEffectsLanes = 0;
				if (0 !== (executionContext & 6)) throw Error(formatProdErrorMessage(331));
				var prevExecutionContext = executionContext;
				executionContext |= 4;
				commitPassiveUnmountOnFiber(root$jscomp$0.current);
				commitPassiveMountOnFiber(root$jscomp$0, root$jscomp$0.current, lanes, renderPriority);
				executionContext = prevExecutionContext;
				flushSyncWorkAcrossRoots_impl(0, !1);
				if (injectedHook && "function" === typeof injectedHook.onPostCommitFiberRoot) try {
					injectedHook.onPostCommitFiberRoot(rendererID, root$jscomp$0);
				} catch (err) {}
				return !0;
			} finally {
				ReactDOMSharedInternals.p = previousPriority, ReactSharedInternals.T = prevTransition, releaseRootPooledCache(root$1, remainingLanes);
			}
		}
		function captureCommitPhaseErrorOnRoot(rootFiber, sourceFiber, error) {
			sourceFiber = createCapturedValueAtFiber(error, sourceFiber);
			sourceFiber = createRootErrorUpdate(rootFiber.stateNode, sourceFiber, 2);
			rootFiber = enqueueUpdate(rootFiber, sourceFiber, 2);
			null !== rootFiber && (markRootUpdated$1(rootFiber, 2), ensureRootIsScheduled(rootFiber));
		}
		function captureCommitPhaseError(sourceFiber, nearestMountedAncestor, error) {
			if (3 === sourceFiber.tag) captureCommitPhaseErrorOnRoot(sourceFiber, sourceFiber, error);
			else for (; null !== nearestMountedAncestor;) {
				if (3 === nearestMountedAncestor.tag) {
					captureCommitPhaseErrorOnRoot(nearestMountedAncestor, sourceFiber, error);
					break;
				} else if (1 === nearestMountedAncestor.tag) {
					var instance = nearestMountedAncestor.stateNode;
					if ("function" === typeof nearestMountedAncestor.type.getDerivedStateFromError || "function" === typeof instance.componentDidCatch && (null === legacyErrorBoundariesThatAlreadyFailed || !legacyErrorBoundariesThatAlreadyFailed.has(instance))) {
						sourceFiber = createCapturedValueAtFiber(error, sourceFiber);
						error = createClassErrorUpdate(2);
						instance = enqueueUpdate(nearestMountedAncestor, error, 2);
						null !== instance && (initializeClassErrorUpdate(error, instance, nearestMountedAncestor, sourceFiber), markRootUpdated$1(instance, 2), ensureRootIsScheduled(instance));
						break;
					}
				}
				nearestMountedAncestor = nearestMountedAncestor.return;
			}
		}
		function attachPingListener(root$1, wakeable, lanes) {
			var pingCache = root$1.pingCache;
			if (null === pingCache) {
				pingCache = root$1.pingCache = new PossiblyWeakMap();
				var threadIDs = /* @__PURE__ */ new Set();
				pingCache.set(wakeable, threadIDs);
			} else threadIDs = pingCache.get(wakeable), void 0 === threadIDs && (threadIDs = /* @__PURE__ */ new Set(), pingCache.set(wakeable, threadIDs));
			threadIDs.has(lanes) || (workInProgressRootDidAttachPingListener = !0, threadIDs.add(lanes), root$1 = pingSuspendedRoot.bind(null, root$1, wakeable, lanes), wakeable.then(root$1, root$1));
		}
		function pingSuspendedRoot(root$1, wakeable, pingedLanes) {
			var pingCache = root$1.pingCache;
			null !== pingCache && pingCache.delete(wakeable);
			root$1.pingedLanes |= root$1.suspendedLanes & pingedLanes;
			root$1.warmLanes &= ~pingedLanes;
			workInProgressRoot === root$1 && (workInProgressRootRenderLanes & pingedLanes) === pingedLanes && (4 === workInProgressRootExitStatus || 3 === workInProgressRootExitStatus && (workInProgressRootRenderLanes & 62914560) === workInProgressRootRenderLanes && 300 > now() - globalMostRecentFallbackTime ? 0 === (executionContext & 2) && prepareFreshStack(root$1, 0) : workInProgressRootPingedLanes |= pingedLanes, workInProgressSuspendedRetryLanes === workInProgressRootRenderLanes && (workInProgressSuspendedRetryLanes = 0));
			ensureRootIsScheduled(root$1);
		}
		function retryTimedOutBoundary(boundaryFiber, retryLane) {
			0 === retryLane && (retryLane = claimNextRetryLane());
			boundaryFiber = enqueueConcurrentRenderForLane(boundaryFiber, retryLane);
			null !== boundaryFiber && (markRootUpdated$1(boundaryFiber, retryLane), ensureRootIsScheduled(boundaryFiber));
		}
		function retryDehydratedSuspenseBoundary(boundaryFiber) {
			var suspenseState = boundaryFiber.memoizedState, retryLane = 0;
			null !== suspenseState && (retryLane = suspenseState.retryLane);
			retryTimedOutBoundary(boundaryFiber, retryLane);
		}
		function resolveRetryWakeable(boundaryFiber, wakeable) {
			var retryLane = 0;
			switch (boundaryFiber.tag) {
				case 31:
				case 13:
					var retryCache = boundaryFiber.stateNode;
					var suspenseState = boundaryFiber.memoizedState;
					null !== suspenseState && (retryLane = suspenseState.retryLane);
					break;
				case 19:
					retryCache = boundaryFiber.stateNode;
					break;
				case 22:
					retryCache = boundaryFiber.stateNode._retryCache;
					break;
				default: throw Error(formatProdErrorMessage(314));
			}
			null !== retryCache && retryCache.delete(wakeable);
			retryTimedOutBoundary(boundaryFiber, retryLane);
		}
		function scheduleCallback$1(priorityLevel, callback) {
			return scheduleCallback$3(priorityLevel, callback);
		}
		var firstScheduledRoot = null, lastScheduledRoot = null, didScheduleMicrotask = !1, mightHavePendingSyncWork = !1, isFlushingWork = !1, currentEventTransitionLane = 0;
		function ensureRootIsScheduled(root$1) {
			root$1 !== lastScheduledRoot && null === root$1.next && (null === lastScheduledRoot ? firstScheduledRoot = lastScheduledRoot = root$1 : lastScheduledRoot = lastScheduledRoot.next = root$1);
			mightHavePendingSyncWork = !0;
			didScheduleMicrotask || (didScheduleMicrotask = !0, scheduleImmediateRootScheduleTask());
		}
		function flushSyncWorkAcrossRoots_impl(syncTransitionLanes, onlyLegacy) {
			if (!isFlushingWork && mightHavePendingSyncWork) {
				isFlushingWork = !0;
				do {
					var didPerformSomeWork = !1;
					for (var root$170 = firstScheduledRoot; null !== root$170;) {
						if (!onlyLegacy) if (0 !== syncTransitionLanes) {
							var pendingLanes = root$170.pendingLanes;
							if (0 === pendingLanes) var JSCompiler_inline_result = 0;
							else {
								var suspendedLanes = root$170.suspendedLanes, pingedLanes = root$170.pingedLanes;
								JSCompiler_inline_result = (1 << 31 - clz32(42 | syncTransitionLanes) + 1) - 1;
								JSCompiler_inline_result &= pendingLanes & ~(suspendedLanes & ~pingedLanes);
								JSCompiler_inline_result = JSCompiler_inline_result & 201326741 ? JSCompiler_inline_result & 201326741 | 1 : JSCompiler_inline_result ? JSCompiler_inline_result | 2 : 0;
							}
							0 !== JSCompiler_inline_result && (didPerformSomeWork = !0, performSyncWorkOnRoot(root$170, JSCompiler_inline_result));
						} else JSCompiler_inline_result = workInProgressRootRenderLanes, JSCompiler_inline_result = getNextLanes(root$170, root$170 === workInProgressRoot ? JSCompiler_inline_result : 0, null !== root$170.cancelPendingCommit || -1 !== root$170.timeoutHandle), 0 === (JSCompiler_inline_result & 3) || checkIfRootIsPrerendering(root$170, JSCompiler_inline_result) || (didPerformSomeWork = !0, performSyncWorkOnRoot(root$170, JSCompiler_inline_result));
						root$170 = root$170.next;
					}
				} while (didPerformSomeWork);
				isFlushingWork = !1;
			}
		}
		function processRootScheduleInImmediateTask() {
			processRootScheduleInMicrotask();
		}
		function processRootScheduleInMicrotask() {
			mightHavePendingSyncWork = didScheduleMicrotask = !1;
			var syncTransitionLanes = 0;
			0 !== currentEventTransitionLane && shouldAttemptEagerTransition() && (syncTransitionLanes = currentEventTransitionLane);
			for (var currentTime = now(), prev = null, root$1 = firstScheduledRoot; null !== root$1;) {
				var next = root$1.next, nextLanes = scheduleTaskForRootDuringMicrotask(root$1, currentTime);
				if (0 === nextLanes) root$1.next = null, null === prev ? firstScheduledRoot = next : prev.next = next, null === next && (lastScheduledRoot = prev);
				else if (prev = root$1, 0 !== syncTransitionLanes || 0 !== (nextLanes & 3)) mightHavePendingSyncWork = !0;
				root$1 = next;
			}
			0 !== pendingEffectsStatus && 5 !== pendingEffectsStatus || flushSyncWorkAcrossRoots_impl(syncTransitionLanes, !1);
			0 !== currentEventTransitionLane && (currentEventTransitionLane = 0);
		}
		function scheduleTaskForRootDuringMicrotask(root$1, currentTime) {
			for (var suspendedLanes = root$1.suspendedLanes, pingedLanes = root$1.pingedLanes, expirationTimes = root$1.expirationTimes, lanes = root$1.pendingLanes & -62914561; 0 < lanes;) {
				var index$5 = 31 - clz32(lanes), lane = 1 << index$5, expirationTime = expirationTimes[index$5];
				if (-1 === expirationTime) {
					if (0 === (lane & suspendedLanes) || 0 !== (lane & pingedLanes)) expirationTimes[index$5] = computeExpirationTime(lane, currentTime);
				} else expirationTime <= currentTime && (root$1.expiredLanes |= lane);
				lanes &= ~lane;
			}
			currentTime = workInProgressRoot;
			suspendedLanes = workInProgressRootRenderLanes;
			suspendedLanes = getNextLanes(root$1, root$1 === currentTime ? suspendedLanes : 0, null !== root$1.cancelPendingCommit || -1 !== root$1.timeoutHandle);
			pingedLanes = root$1.callbackNode;
			if (0 === suspendedLanes || root$1 === currentTime && (2 === workInProgressSuspendedReason || 9 === workInProgressSuspendedReason) || null !== root$1.cancelPendingCommit) return null !== pingedLanes && null !== pingedLanes && cancelCallback$1(pingedLanes), root$1.callbackNode = null, root$1.callbackPriority = 0;
			if (0 === (suspendedLanes & 3) || checkIfRootIsPrerendering(root$1, suspendedLanes)) {
				currentTime = suspendedLanes & -suspendedLanes;
				if (currentTime === root$1.callbackPriority) return currentTime;
				null !== pingedLanes && cancelCallback$1(pingedLanes);
				switch (lanesToEventPriority(suspendedLanes)) {
					case 2:
					case 8:
						suspendedLanes = UserBlockingPriority;
						break;
					case 32:
						suspendedLanes = NormalPriority$1;
						break;
					case 268435456:
						suspendedLanes = IdlePriority;
						break;
					default: suspendedLanes = NormalPriority$1;
				}
				pingedLanes = performWorkOnRootViaSchedulerTask.bind(null, root$1);
				suspendedLanes = scheduleCallback$3(suspendedLanes, pingedLanes);
				root$1.callbackPriority = currentTime;
				root$1.callbackNode = suspendedLanes;
				return currentTime;
			}
			null !== pingedLanes && null !== pingedLanes && cancelCallback$1(pingedLanes);
			root$1.callbackPriority = 2;
			root$1.callbackNode = null;
			return 2;
		}
		function performWorkOnRootViaSchedulerTask(root$1, didTimeout) {
			if (0 !== pendingEffectsStatus && 5 !== pendingEffectsStatus) return root$1.callbackNode = null, root$1.callbackPriority = 0, null;
			var originalCallbackNode = root$1.callbackNode;
			if (flushPendingEffects() && root$1.callbackNode !== originalCallbackNode) return null;
			var workInProgressRootRenderLanes$jscomp$0 = workInProgressRootRenderLanes;
			workInProgressRootRenderLanes$jscomp$0 = getNextLanes(root$1, root$1 === workInProgressRoot ? workInProgressRootRenderLanes$jscomp$0 : 0, null !== root$1.cancelPendingCommit || -1 !== root$1.timeoutHandle);
			if (0 === workInProgressRootRenderLanes$jscomp$0) return null;
			performWorkOnRoot(root$1, workInProgressRootRenderLanes$jscomp$0, didTimeout);
			scheduleTaskForRootDuringMicrotask(root$1, now());
			return null != root$1.callbackNode && root$1.callbackNode === originalCallbackNode ? performWorkOnRootViaSchedulerTask.bind(null, root$1) : null;
		}
		function performSyncWorkOnRoot(root$1, lanes) {
			if (flushPendingEffects()) return null;
			performWorkOnRoot(root$1, lanes, !0);
		}
		function scheduleImmediateRootScheduleTask() {
			scheduleMicrotask(function() {
				0 !== (executionContext & 6) ? scheduleCallback$3(ImmediatePriority, processRootScheduleInImmediateTask) : processRootScheduleInMicrotask();
			});
		}
		function requestTransitionLane() {
			if (0 === currentEventTransitionLane) {
				var actionScopeLane = currentEntangledLane;
				0 === actionScopeLane && (actionScopeLane = nextTransitionUpdateLane, nextTransitionUpdateLane <<= 1, 0 === (nextTransitionUpdateLane & 261888) && (nextTransitionUpdateLane = 256));
				currentEventTransitionLane = actionScopeLane;
			}
			return currentEventTransitionLane;
		}
		function coerceFormActionProp(actionProp) {
			return null == actionProp || "symbol" === typeof actionProp || "boolean" === typeof actionProp ? null : "function" === typeof actionProp ? actionProp : sanitizeURL("" + actionProp);
		}
		function createFormDataWithSubmitter(form, submitter) {
			var temp = submitter.ownerDocument.createElement("input");
			temp.name = submitter.name;
			temp.value = submitter.value;
			form.id && temp.setAttribute("form", form.id);
			submitter.parentNode.insertBefore(temp, submitter);
			form = new FormData(form);
			temp.parentNode.removeChild(temp);
			return form;
		}
		function extractEvents$1(dispatchQueue, domEventName, maybeTargetInst, nativeEvent, nativeEventTarget) {
			if ("submit" === domEventName && maybeTargetInst && maybeTargetInst.stateNode === nativeEventTarget) {
				var action = coerceFormActionProp((nativeEventTarget[internalPropsKey] || null).action), submitter = nativeEvent.submitter;
				submitter && (domEventName = (domEventName = submitter[internalPropsKey] || null) ? coerceFormActionProp(domEventName.formAction) : submitter.getAttribute("formAction"), null !== domEventName && (action = domEventName, submitter = null));
				var event = new SyntheticEvent("action", "action", null, nativeEvent, nativeEventTarget);
				dispatchQueue.push({
					event,
					listeners: [{
						instance: null,
						listener: function() {
							if (nativeEvent.defaultPrevented) {
								if (0 !== currentEventTransitionLane) {
									var formData = submitter ? createFormDataWithSubmitter(nativeEventTarget, submitter) : new FormData(nativeEventTarget);
									startHostTransition(maybeTargetInst, {
										pending: !0,
										data: formData,
										method: nativeEventTarget.method,
										action
									}, null, formData);
								}
							} else "function" === typeof action && (event.preventDefault(), formData = submitter ? createFormDataWithSubmitter(nativeEventTarget, submitter) : new FormData(nativeEventTarget), startHostTransition(maybeTargetInst, {
								pending: !0,
								data: formData,
								method: nativeEventTarget.method,
								action
							}, action, formData));
						},
						currentTarget: nativeEventTarget
					}]
				});
			}
		}
		for (var i$jscomp$inline_1577 = 0; i$jscomp$inline_1577 < simpleEventPluginEvents.length; i$jscomp$inline_1577++) {
			var eventName$jscomp$inline_1578 = simpleEventPluginEvents[i$jscomp$inline_1577];
			registerSimpleEvent(eventName$jscomp$inline_1578.toLowerCase(), "on" + (eventName$jscomp$inline_1578[0].toUpperCase() + eventName$jscomp$inline_1578.slice(1)));
		}
		registerSimpleEvent(ANIMATION_END, "onAnimationEnd");
		registerSimpleEvent(ANIMATION_ITERATION, "onAnimationIteration");
		registerSimpleEvent(ANIMATION_START, "onAnimationStart");
		registerSimpleEvent("dblclick", "onDoubleClick");
		registerSimpleEvent("focusin", "onFocus");
		registerSimpleEvent("focusout", "onBlur");
		registerSimpleEvent(TRANSITION_RUN, "onTransitionRun");
		registerSimpleEvent(TRANSITION_START, "onTransitionStart");
		registerSimpleEvent(TRANSITION_CANCEL, "onTransitionCancel");
		registerSimpleEvent(TRANSITION_END, "onTransitionEnd");
		registerDirectEvent("onMouseEnter", ["mouseout", "mouseover"]);
		registerDirectEvent("onMouseLeave", ["mouseout", "mouseover"]);
		registerDirectEvent("onPointerEnter", ["pointerout", "pointerover"]);
		registerDirectEvent("onPointerLeave", ["pointerout", "pointerover"]);
		registerTwoPhaseEvent("onChange", "change click focusin focusout input keydown keyup selectionchange".split(" "));
		registerTwoPhaseEvent("onSelect", "focusout contextmenu dragend focusin keydown keyup mousedown mouseup selectionchange".split(" "));
		registerTwoPhaseEvent("onBeforeInput", [
			"compositionend",
			"keypress",
			"textInput",
			"paste"
		]);
		registerTwoPhaseEvent("onCompositionEnd", "compositionend focusout keydown keypress keyup mousedown".split(" "));
		registerTwoPhaseEvent("onCompositionStart", "compositionstart focusout keydown keypress keyup mousedown".split(" "));
		registerTwoPhaseEvent("onCompositionUpdate", "compositionupdate focusout keydown keypress keyup mousedown".split(" "));
		var mediaEventTypes = "abort canplay canplaythrough durationchange emptied encrypted ended error loadeddata loadedmetadata loadstart pause play playing progress ratechange resize seeked seeking stalled suspend timeupdate volumechange waiting".split(" "), nonDelegatedEvents = new Set("beforetoggle cancel close invalid load scroll scrollend toggle".split(" ").concat(mediaEventTypes));
		function processDispatchQueue(dispatchQueue, eventSystemFlags) {
			eventSystemFlags = 0 !== (eventSystemFlags & 4);
			for (var i = 0; i < dispatchQueue.length; i++) {
				var _dispatchQueue$i = dispatchQueue[i], event = _dispatchQueue$i.event;
				_dispatchQueue$i = _dispatchQueue$i.listeners;
				a: {
					var previousInstance = void 0;
					if (eventSystemFlags) for (var i$jscomp$0 = _dispatchQueue$i.length - 1; 0 <= i$jscomp$0; i$jscomp$0--) {
						var _dispatchListeners$i = _dispatchQueue$i[i$jscomp$0], instance = _dispatchListeners$i.instance, currentTarget = _dispatchListeners$i.currentTarget;
						_dispatchListeners$i = _dispatchListeners$i.listener;
						if (instance !== previousInstance && event.isPropagationStopped()) break a;
						previousInstance = _dispatchListeners$i;
						event.currentTarget = currentTarget;
						try {
							previousInstance(event);
						} catch (error) {
							reportGlobalError(error);
						}
						event.currentTarget = null;
						previousInstance = instance;
					}
					else for (i$jscomp$0 = 0; i$jscomp$0 < _dispatchQueue$i.length; i$jscomp$0++) {
						_dispatchListeners$i = _dispatchQueue$i[i$jscomp$0];
						instance = _dispatchListeners$i.instance;
						currentTarget = _dispatchListeners$i.currentTarget;
						_dispatchListeners$i = _dispatchListeners$i.listener;
						if (instance !== previousInstance && event.isPropagationStopped()) break a;
						previousInstance = _dispatchListeners$i;
						event.currentTarget = currentTarget;
						try {
							previousInstance(event);
						} catch (error) {
							reportGlobalError(error);
						}
						event.currentTarget = null;
						previousInstance = instance;
					}
				}
			}
		}
		function listenToNonDelegatedEvent(domEventName, targetElement) {
			var JSCompiler_inline_result = targetElement[internalEventHandlersKey];
			void 0 === JSCompiler_inline_result && (JSCompiler_inline_result = targetElement[internalEventHandlersKey] = /* @__PURE__ */ new Set());
			var listenerSetKey = domEventName + "__bubble";
			JSCompiler_inline_result.has(listenerSetKey) || (addTrappedEventListener(targetElement, domEventName, 2, !1), JSCompiler_inline_result.add(listenerSetKey));
		}
		function listenToNativeEvent(domEventName, isCapturePhaseListener, target) {
			var eventSystemFlags = 0;
			isCapturePhaseListener && (eventSystemFlags |= 4);
			addTrappedEventListener(target, domEventName, eventSystemFlags, isCapturePhaseListener);
		}
		var listeningMarker = "_reactListening" + Math.random().toString(36).slice(2);
		function listenToAllSupportedEvents(rootContainerElement) {
			if (!rootContainerElement[listeningMarker]) {
				rootContainerElement[listeningMarker] = !0;
				allNativeEvents.forEach(function(domEventName) {
					"selectionchange" !== domEventName && (nonDelegatedEvents.has(domEventName) || listenToNativeEvent(domEventName, !1, rootContainerElement), listenToNativeEvent(domEventName, !0, rootContainerElement));
				});
				var ownerDocument = 9 === rootContainerElement.nodeType ? rootContainerElement : rootContainerElement.ownerDocument;
				null === ownerDocument || ownerDocument[listeningMarker] || (ownerDocument[listeningMarker] = !0, listenToNativeEvent("selectionchange", !1, ownerDocument));
			}
		}
		function addTrappedEventListener(targetContainer, domEventName, eventSystemFlags, isCapturePhaseListener) {
			switch (getEventPriority(domEventName)) {
				case 2:
					var listenerWrapper = dispatchDiscreteEvent;
					break;
				case 8:
					listenerWrapper = dispatchContinuousEvent;
					break;
				default: listenerWrapper = dispatchEvent;
			}
			eventSystemFlags = listenerWrapper.bind(null, domEventName, eventSystemFlags, targetContainer);
			listenerWrapper = void 0;
			!passiveBrowserEventsSupported || "touchstart" !== domEventName && "touchmove" !== domEventName && "wheel" !== domEventName || (listenerWrapper = !0);
			isCapturePhaseListener ? void 0 !== listenerWrapper ? targetContainer.addEventListener(domEventName, eventSystemFlags, {
				capture: !0,
				passive: listenerWrapper
			}) : targetContainer.addEventListener(domEventName, eventSystemFlags, !0) : void 0 !== listenerWrapper ? targetContainer.addEventListener(domEventName, eventSystemFlags, { passive: listenerWrapper }) : targetContainer.addEventListener(domEventName, eventSystemFlags, !1);
		}
		function dispatchEventForPluginEventSystem(domEventName, eventSystemFlags, nativeEvent, targetInst$jscomp$0, targetContainer) {
			var ancestorInst = targetInst$jscomp$0;
			if (0 === (eventSystemFlags & 1) && 0 === (eventSystemFlags & 2) && null !== targetInst$jscomp$0) a: for (;;) {
				if (null === targetInst$jscomp$0) return;
				var nodeTag = targetInst$jscomp$0.tag;
				if (3 === nodeTag || 4 === nodeTag) {
					var container = targetInst$jscomp$0.stateNode.containerInfo;
					if (container === targetContainer) break;
					if (4 === nodeTag) for (nodeTag = targetInst$jscomp$0.return; null !== nodeTag;) {
						var grandTag = nodeTag.tag;
						if ((3 === grandTag || 4 === grandTag) && nodeTag.stateNode.containerInfo === targetContainer) return;
						nodeTag = nodeTag.return;
					}
					for (; null !== container;) {
						nodeTag = getClosestInstanceFromNode(container);
						if (null === nodeTag) return;
						grandTag = nodeTag.tag;
						if (5 === grandTag || 6 === grandTag || 26 === grandTag || 27 === grandTag) {
							targetInst$jscomp$0 = ancestorInst = nodeTag;
							continue a;
						}
						container = container.parentNode;
					}
				}
				targetInst$jscomp$0 = targetInst$jscomp$0.return;
			}
			batchedUpdates$1(function() {
				var targetInst = ancestorInst, nativeEventTarget = getEventTarget(nativeEvent), dispatchQueue = [];
				a: {
					var reactName = topLevelEventsToReactNames.get(domEventName);
					if (void 0 !== reactName) {
						var SyntheticEventCtor = SyntheticEvent, reactEventType = domEventName;
						switch (domEventName) {
							case "keypress": if (0 === getEventCharCode(nativeEvent)) break a;
							case "keydown":
							case "keyup":
								SyntheticEventCtor = SyntheticKeyboardEvent;
								break;
							case "focusin":
								reactEventType = "focus";
								SyntheticEventCtor = SyntheticFocusEvent;
								break;
							case "focusout":
								reactEventType = "blur";
								SyntheticEventCtor = SyntheticFocusEvent;
								break;
							case "beforeblur":
							case "afterblur":
								SyntheticEventCtor = SyntheticFocusEvent;
								break;
							case "click": if (2 === nativeEvent.button) break a;
							case "auxclick":
							case "dblclick":
							case "mousedown":
							case "mousemove":
							case "mouseup":
							case "mouseout":
							case "mouseover":
							case "contextmenu":
								SyntheticEventCtor = SyntheticMouseEvent;
								break;
							case "drag":
							case "dragend":
							case "dragenter":
							case "dragexit":
							case "dragleave":
							case "dragover":
							case "dragstart":
							case "drop":
								SyntheticEventCtor = SyntheticDragEvent;
								break;
							case "touchcancel":
							case "touchend":
							case "touchmove":
							case "touchstart":
								SyntheticEventCtor = SyntheticTouchEvent;
								break;
							case ANIMATION_END:
							case ANIMATION_ITERATION:
							case ANIMATION_START:
								SyntheticEventCtor = SyntheticAnimationEvent;
								break;
							case TRANSITION_END:
								SyntheticEventCtor = SyntheticTransitionEvent;
								break;
							case "scroll":
							case "scrollend":
								SyntheticEventCtor = SyntheticUIEvent;
								break;
							case "wheel":
								SyntheticEventCtor = SyntheticWheelEvent;
								break;
							case "copy":
							case "cut":
							case "paste":
								SyntheticEventCtor = SyntheticClipboardEvent;
								break;
							case "gotpointercapture":
							case "lostpointercapture":
							case "pointercancel":
							case "pointerdown":
							case "pointermove":
							case "pointerout":
							case "pointerover":
							case "pointerup":
								SyntheticEventCtor = SyntheticPointerEvent;
								break;
							case "toggle":
							case "beforetoggle": SyntheticEventCtor = SyntheticToggleEvent;
						}
						var inCapturePhase = 0 !== (eventSystemFlags & 4), accumulateTargetOnly = !inCapturePhase && ("scroll" === domEventName || "scrollend" === domEventName), reactEventName = inCapturePhase ? null !== reactName ? reactName + "Capture" : null : reactName;
						inCapturePhase = [];
						for (var instance = targetInst, lastHostComponent; null !== instance;) {
							var _instance = instance;
							lastHostComponent = _instance.stateNode;
							_instance = _instance.tag;
							5 !== _instance && 26 !== _instance && 27 !== _instance || null === lastHostComponent || null === reactEventName || (_instance = getListener(instance, reactEventName), null != _instance && inCapturePhase.push(createDispatchListener(instance, _instance, lastHostComponent)));
							if (accumulateTargetOnly) break;
							instance = instance.return;
						}
						0 < inCapturePhase.length && (reactName = new SyntheticEventCtor(reactName, reactEventType, null, nativeEvent, nativeEventTarget), dispatchQueue.push({
							event: reactName,
							listeners: inCapturePhase
						}));
					}
				}
				if (0 === (eventSystemFlags & 7)) {
					a: {
						reactName = "mouseover" === domEventName || "pointerover" === domEventName;
						SyntheticEventCtor = "mouseout" === domEventName || "pointerout" === domEventName;
						if (reactName && nativeEvent !== currentReplayingEvent && (reactEventType = nativeEvent.relatedTarget || nativeEvent.fromElement) && (getClosestInstanceFromNode(reactEventType) || reactEventType[internalContainerInstanceKey])) break a;
						if (SyntheticEventCtor || reactName) {
							reactName = nativeEventTarget.window === nativeEventTarget ? nativeEventTarget : (reactName = nativeEventTarget.ownerDocument) ? reactName.defaultView || reactName.parentWindow : window;
							if (SyntheticEventCtor) {
								if (reactEventType = nativeEvent.relatedTarget || nativeEvent.toElement, SyntheticEventCtor = targetInst, reactEventType = reactEventType ? getClosestInstanceFromNode(reactEventType) : null, null !== reactEventType && (accumulateTargetOnly = getNearestMountedFiber(reactEventType), inCapturePhase = reactEventType.tag, reactEventType !== accumulateTargetOnly || 5 !== inCapturePhase && 27 !== inCapturePhase && 6 !== inCapturePhase)) reactEventType = null;
							} else SyntheticEventCtor = null, reactEventType = targetInst;
							if (SyntheticEventCtor !== reactEventType) {
								inCapturePhase = SyntheticMouseEvent;
								_instance = "onMouseLeave";
								reactEventName = "onMouseEnter";
								instance = "mouse";
								if ("pointerout" === domEventName || "pointerover" === domEventName) inCapturePhase = SyntheticPointerEvent, _instance = "onPointerLeave", reactEventName = "onPointerEnter", instance = "pointer";
								accumulateTargetOnly = null == SyntheticEventCtor ? reactName : getNodeFromInstance(SyntheticEventCtor);
								lastHostComponent = null == reactEventType ? reactName : getNodeFromInstance(reactEventType);
								reactName = new inCapturePhase(_instance, instance + "leave", SyntheticEventCtor, nativeEvent, nativeEventTarget);
								reactName.target = accumulateTargetOnly;
								reactName.relatedTarget = lastHostComponent;
								_instance = null;
								getClosestInstanceFromNode(nativeEventTarget) === targetInst && (inCapturePhase = new inCapturePhase(reactEventName, instance + "enter", reactEventType, nativeEvent, nativeEventTarget), inCapturePhase.target = lastHostComponent, inCapturePhase.relatedTarget = accumulateTargetOnly, _instance = inCapturePhase);
								accumulateTargetOnly = _instance;
								if (SyntheticEventCtor && reactEventType) b: {
									inCapturePhase = getParent;
									reactEventName = SyntheticEventCtor;
									instance = reactEventType;
									lastHostComponent = 0;
									for (_instance = reactEventName; _instance; _instance = inCapturePhase(_instance)) lastHostComponent++;
									_instance = 0;
									for (var tempB = instance; tempB; tempB = inCapturePhase(tempB)) _instance++;
									for (; 0 < lastHostComponent - _instance;) reactEventName = inCapturePhase(reactEventName), lastHostComponent--;
									for (; 0 < _instance - lastHostComponent;) instance = inCapturePhase(instance), _instance--;
									for (; lastHostComponent--;) {
										if (reactEventName === instance || null !== instance && reactEventName === instance.alternate) {
											inCapturePhase = reactEventName;
											break b;
										}
										reactEventName = inCapturePhase(reactEventName);
										instance = inCapturePhase(instance);
									}
									inCapturePhase = null;
								}
								else inCapturePhase = null;
								null !== SyntheticEventCtor && accumulateEnterLeaveListenersForEvent(dispatchQueue, reactName, SyntheticEventCtor, inCapturePhase, !1);
								null !== reactEventType && null !== accumulateTargetOnly && accumulateEnterLeaveListenersForEvent(dispatchQueue, accumulateTargetOnly, reactEventType, inCapturePhase, !0);
							}
						}
					}
					a: {
						reactName = targetInst ? getNodeFromInstance(targetInst) : window;
						SyntheticEventCtor = reactName.nodeName && reactName.nodeName.toLowerCase();
						if ("select" === SyntheticEventCtor || "input" === SyntheticEventCtor && "file" === reactName.type) var getTargetInstFunc = getTargetInstForChangeEvent;
						else if (isTextInputElement(reactName)) if (isInputEventSupported) getTargetInstFunc = getTargetInstForInputOrChangeEvent;
						else {
							getTargetInstFunc = getTargetInstForInputEventPolyfill;
							var handleEventFunc = handleEventsForInputEventPolyfill;
						}
						else SyntheticEventCtor = reactName.nodeName, !SyntheticEventCtor || "input" !== SyntheticEventCtor.toLowerCase() || "checkbox" !== reactName.type && "radio" !== reactName.type ? targetInst && isCustomElement(targetInst.elementType) && (getTargetInstFunc = getTargetInstForChangeEvent) : getTargetInstFunc = getTargetInstForClickEvent;
						if (getTargetInstFunc && (getTargetInstFunc = getTargetInstFunc(domEventName, targetInst))) {
							createAndAccumulateChangeEvent(dispatchQueue, getTargetInstFunc, nativeEvent, nativeEventTarget);
							break a;
						}
						handleEventFunc && handleEventFunc(domEventName, reactName, targetInst);
						"focusout" === domEventName && targetInst && "number" === reactName.type && null != targetInst.memoizedProps.value && setDefaultValue(reactName, "number", reactName.value);
					}
					handleEventFunc = targetInst ? getNodeFromInstance(targetInst) : window;
					switch (domEventName) {
						case "focusin":
							if (isTextInputElement(handleEventFunc) || "true" === handleEventFunc.contentEditable) activeElement = handleEventFunc, activeElementInst = targetInst, lastSelection = null;
							break;
						case "focusout":
							lastSelection = activeElementInst = activeElement = null;
							break;
						case "mousedown":
							mouseDown = !0;
							break;
						case "contextmenu":
						case "mouseup":
						case "dragend":
							mouseDown = !1;
							constructSelectEvent(dispatchQueue, nativeEvent, nativeEventTarget);
							break;
						case "selectionchange": if (skipSelectionChangeEvent) break;
						case "keydown":
						case "keyup": constructSelectEvent(dispatchQueue, nativeEvent, nativeEventTarget);
					}
					var fallbackData;
					if (canUseCompositionEvent) b: {
						switch (domEventName) {
							case "compositionstart":
								var eventType = "onCompositionStart";
								break b;
							case "compositionend":
								eventType = "onCompositionEnd";
								break b;
							case "compositionupdate":
								eventType = "onCompositionUpdate";
								break b;
						}
						eventType = void 0;
					}
					else isComposing ? isFallbackCompositionEnd(domEventName, nativeEvent) && (eventType = "onCompositionEnd") : "keydown" === domEventName && 229 === nativeEvent.keyCode && (eventType = "onCompositionStart");
					eventType && (useFallbackCompositionData && "ko" !== nativeEvent.locale && (isComposing || "onCompositionStart" !== eventType ? "onCompositionEnd" === eventType && isComposing && (fallbackData = getData()) : (root = nativeEventTarget, startText = "value" in root ? root.value : root.textContent, isComposing = !0)), handleEventFunc = accumulateTwoPhaseListeners(targetInst, eventType), 0 < handleEventFunc.length && (eventType = new SyntheticCompositionEvent(eventType, domEventName, null, nativeEvent, nativeEventTarget), dispatchQueue.push({
						event: eventType,
						listeners: handleEventFunc
					}), fallbackData ? eventType.data = fallbackData : (fallbackData = getDataFromCustomEvent(nativeEvent), null !== fallbackData && (eventType.data = fallbackData))));
					if (fallbackData = canUseTextInputEvent ? getNativeBeforeInputChars(domEventName, nativeEvent) : getFallbackBeforeInputChars(domEventName, nativeEvent)) eventType = accumulateTwoPhaseListeners(targetInst, "onBeforeInput"), 0 < eventType.length && (handleEventFunc = new SyntheticCompositionEvent("onBeforeInput", "beforeinput", null, nativeEvent, nativeEventTarget), dispatchQueue.push({
						event: handleEventFunc,
						listeners: eventType
					}), handleEventFunc.data = fallbackData);
					extractEvents$1(dispatchQueue, domEventName, targetInst, nativeEvent, nativeEventTarget);
				}
				processDispatchQueue(dispatchQueue, eventSystemFlags);
			});
		}
		function createDispatchListener(instance, listener, currentTarget) {
			return {
				instance,
				listener,
				currentTarget
			};
		}
		function accumulateTwoPhaseListeners(targetFiber, reactName) {
			for (var captureName = reactName + "Capture", listeners = []; null !== targetFiber;) {
				var _instance2 = targetFiber, stateNode = _instance2.stateNode;
				_instance2 = _instance2.tag;
				5 !== _instance2 && 26 !== _instance2 && 27 !== _instance2 || null === stateNode || (_instance2 = getListener(targetFiber, captureName), null != _instance2 && listeners.unshift(createDispatchListener(targetFiber, _instance2, stateNode)), _instance2 = getListener(targetFiber, reactName), null != _instance2 && listeners.push(createDispatchListener(targetFiber, _instance2, stateNode)));
				if (3 === targetFiber.tag) return listeners;
				targetFiber = targetFiber.return;
			}
			return [];
		}
		function getParent(inst) {
			if (null === inst) return null;
			do
				inst = inst.return;
			while (inst && 5 !== inst.tag && 27 !== inst.tag);
			return inst ? inst : null;
		}
		function accumulateEnterLeaveListenersForEvent(dispatchQueue, event, target, common, inCapturePhase) {
			for (var registrationName = event._reactName, listeners = []; null !== target && target !== common;) {
				var _instance3 = target, alternate = _instance3.alternate, stateNode = _instance3.stateNode;
				_instance3 = _instance3.tag;
				if (null !== alternate && alternate === common) break;
				5 !== _instance3 && 26 !== _instance3 && 27 !== _instance3 || null === stateNode || (alternate = stateNode, inCapturePhase ? (stateNode = getListener(target, registrationName), null != stateNode && listeners.unshift(createDispatchListener(target, stateNode, alternate))) : inCapturePhase || (stateNode = getListener(target, registrationName), null != stateNode && listeners.push(createDispatchListener(target, stateNode, alternate))));
				target = target.return;
			}
			0 !== listeners.length && dispatchQueue.push({
				event,
				listeners
			});
		}
		var NORMALIZE_NEWLINES_REGEX = /\r\n?/g, NORMALIZE_NULL_AND_REPLACEMENT_REGEX = /\u0000|\uFFFD/g;
		function normalizeMarkupForTextOrAttribute(markup) {
			return ("string" === typeof markup ? markup : "" + markup).replace(NORMALIZE_NEWLINES_REGEX, "\n").replace(NORMALIZE_NULL_AND_REPLACEMENT_REGEX, "");
		}
		function checkForUnmatchedText(serverText, clientText) {
			clientText = normalizeMarkupForTextOrAttribute(clientText);
			return normalizeMarkupForTextOrAttribute(serverText) === clientText ? !0 : !1;
		}
		function setProp(domElement, tag, key, value, props, prevValue) {
			switch (key) {
				case "children":
					"string" === typeof value ? "body" === tag || "textarea" === tag && "" === value || setTextContent(domElement, value) : ("number" === typeof value || "bigint" === typeof value) && "body" !== tag && setTextContent(domElement, "" + value);
					break;
				case "className":
					setValueForKnownAttribute(domElement, "class", value);
					break;
				case "tabIndex":
					setValueForKnownAttribute(domElement, "tabindex", value);
					break;
				case "dir":
				case "role":
				case "viewBox":
				case "width":
				case "height":
					setValueForKnownAttribute(domElement, key, value);
					break;
				case "style":
					setValueForStyles(domElement, value, prevValue);
					break;
				case "data": if ("object" !== tag) {
					setValueForKnownAttribute(domElement, "data", value);
					break;
				}
				case "src":
				case "href":
					if ("" === value && ("a" !== tag || "href" !== key)) {
						domElement.removeAttribute(key);
						break;
					}
					if (null == value || "function" === typeof value || "symbol" === typeof value || "boolean" === typeof value) {
						domElement.removeAttribute(key);
						break;
					}
					value = sanitizeURL("" + value);
					domElement.setAttribute(key, value);
					break;
				case "action":
				case "formAction":
					if ("function" === typeof value) {
						domElement.setAttribute(key, "javascript:throw new Error('A React form was unexpectedly submitted. If you called form.submit() manually, consider using form.requestSubmit() instead. If you\\'re trying to use event.stopPropagation() in a submit event handler, consider also calling event.preventDefault().')");
						break;
					} else "function" === typeof prevValue && ("formAction" === key ? ("input" !== tag && setProp(domElement, tag, "name", props.name, props, null), setProp(domElement, tag, "formEncType", props.formEncType, props, null), setProp(domElement, tag, "formMethod", props.formMethod, props, null), setProp(domElement, tag, "formTarget", props.formTarget, props, null)) : (setProp(domElement, tag, "encType", props.encType, props, null), setProp(domElement, tag, "method", props.method, props, null), setProp(domElement, tag, "target", props.target, props, null)));
					if (null == value || "symbol" === typeof value || "boolean" === typeof value) {
						domElement.removeAttribute(key);
						break;
					}
					value = sanitizeURL("" + value);
					domElement.setAttribute(key, value);
					break;
				case "onClick":
					null != value && (domElement.onclick = noop$1);
					break;
				case "onScroll":
					null != value && listenToNonDelegatedEvent("scroll", domElement);
					break;
				case "onScrollEnd":
					null != value && listenToNonDelegatedEvent("scrollend", domElement);
					break;
				case "dangerouslySetInnerHTML":
					if (null != value) {
						if ("object" !== typeof value || !("__html" in value)) throw Error(formatProdErrorMessage(61));
						key = value.__html;
						if (null != key) {
							if (null != props.children) throw Error(formatProdErrorMessage(60));
							domElement.innerHTML = key;
						}
					}
					break;
				case "multiple":
					domElement.multiple = value && "function" !== typeof value && "symbol" !== typeof value;
					break;
				case "muted":
					domElement.muted = value && "function" !== typeof value && "symbol" !== typeof value;
					break;
				case "suppressContentEditableWarning":
				case "suppressHydrationWarning":
				case "defaultValue":
				case "defaultChecked":
				case "innerHTML":
				case "ref": break;
				case "autoFocus": break;
				case "xlinkHref":
					if (null == value || "function" === typeof value || "boolean" === typeof value || "symbol" === typeof value) {
						domElement.removeAttribute("xlink:href");
						break;
					}
					key = sanitizeURL("" + value);
					domElement.setAttributeNS("http://www.w3.org/1999/xlink", "xlink:href", key);
					break;
				case "contentEditable":
				case "spellCheck":
				case "draggable":
				case "value":
				case "autoReverse":
				case "externalResourcesRequired":
				case "focusable":
				case "preserveAlpha":
					null != value && "function" !== typeof value && "symbol" !== typeof value ? domElement.setAttribute(key, "" + value) : domElement.removeAttribute(key);
					break;
				case "inert":
				case "allowFullScreen":
				case "async":
				case "autoPlay":
				case "controls":
				case "default":
				case "defer":
				case "disabled":
				case "disablePictureInPicture":
				case "disableRemotePlayback":
				case "formNoValidate":
				case "hidden":
				case "loop":
				case "noModule":
				case "noValidate":
				case "open":
				case "playsInline":
				case "readOnly":
				case "required":
				case "reversed":
				case "scoped":
				case "seamless":
				case "itemScope":
					value && "function" !== typeof value && "symbol" !== typeof value ? domElement.setAttribute(key, "") : domElement.removeAttribute(key);
					break;
				case "capture":
				case "download":
					!0 === value ? domElement.setAttribute(key, "") : !1 !== value && null != value && "function" !== typeof value && "symbol" !== typeof value ? domElement.setAttribute(key, value) : domElement.removeAttribute(key);
					break;
				case "cols":
				case "rows":
				case "size":
				case "span":
					null != value && "function" !== typeof value && "symbol" !== typeof value && !isNaN(value) && 1 <= value ? domElement.setAttribute(key, value) : domElement.removeAttribute(key);
					break;
				case "rowSpan":
				case "start":
					null == value || "function" === typeof value || "symbol" === typeof value || isNaN(value) ? domElement.removeAttribute(key) : domElement.setAttribute(key, value);
					break;
				case "popover":
					listenToNonDelegatedEvent("beforetoggle", domElement);
					listenToNonDelegatedEvent("toggle", domElement);
					setValueForAttribute(domElement, "popover", value);
					break;
				case "xlinkActuate":
					setValueForNamespacedAttribute(domElement, "http://www.w3.org/1999/xlink", "xlink:actuate", value);
					break;
				case "xlinkArcrole":
					setValueForNamespacedAttribute(domElement, "http://www.w3.org/1999/xlink", "xlink:arcrole", value);
					break;
				case "xlinkRole":
					setValueForNamespacedAttribute(domElement, "http://www.w3.org/1999/xlink", "xlink:role", value);
					break;
				case "xlinkShow":
					setValueForNamespacedAttribute(domElement, "http://www.w3.org/1999/xlink", "xlink:show", value);
					break;
				case "xlinkTitle":
					setValueForNamespacedAttribute(domElement, "http://www.w3.org/1999/xlink", "xlink:title", value);
					break;
				case "xlinkType":
					setValueForNamespacedAttribute(domElement, "http://www.w3.org/1999/xlink", "xlink:type", value);
					break;
				case "xmlBase":
					setValueForNamespacedAttribute(domElement, "http://www.w3.org/XML/1998/namespace", "xml:base", value);
					break;
				case "xmlLang":
					setValueForNamespacedAttribute(domElement, "http://www.w3.org/XML/1998/namespace", "xml:lang", value);
					break;
				case "xmlSpace":
					setValueForNamespacedAttribute(domElement, "http://www.w3.org/XML/1998/namespace", "xml:space", value);
					break;
				case "is":
					setValueForAttribute(domElement, "is", value);
					break;
				case "innerText":
				case "textContent": break;
				default: if (!(2 < key.length) || "o" !== key[0] && "O" !== key[0] || "n" !== key[1] && "N" !== key[1]) key = aliases.get(key) || key, setValueForAttribute(domElement, key, value);
			}
		}
		function setPropOnCustomElement(domElement, tag, key, value, props, prevValue) {
			switch (key) {
				case "style":
					setValueForStyles(domElement, value, prevValue);
					break;
				case "dangerouslySetInnerHTML":
					if (null != value) {
						if ("object" !== typeof value || !("__html" in value)) throw Error(formatProdErrorMessage(61));
						key = value.__html;
						if (null != key) {
							if (null != props.children) throw Error(formatProdErrorMessage(60));
							domElement.innerHTML = key;
						}
					}
					break;
				case "children":
					"string" === typeof value ? setTextContent(domElement, value) : ("number" === typeof value || "bigint" === typeof value) && setTextContent(domElement, "" + value);
					break;
				case "onScroll":
					null != value && listenToNonDelegatedEvent("scroll", domElement);
					break;
				case "onScrollEnd":
					null != value && listenToNonDelegatedEvent("scrollend", domElement);
					break;
				case "onClick":
					null != value && (domElement.onclick = noop$1);
					break;
				case "suppressContentEditableWarning":
				case "suppressHydrationWarning":
				case "innerHTML":
				case "ref": break;
				case "innerText":
				case "textContent": break;
				default: if (!registrationNameDependencies.hasOwnProperty(key)) a: {
					if ("o" === key[0] && "n" === key[1] && (props = key.endsWith("Capture"), tag = key.slice(2, props ? key.length - 7 : void 0), prevValue = domElement[internalPropsKey] || null, prevValue = null != prevValue ? prevValue[key] : null, "function" === typeof prevValue && domElement.removeEventListener(tag, prevValue, props), "function" === typeof value)) {
						"function" !== typeof prevValue && null !== prevValue && (key in domElement ? domElement[key] = null : domElement.hasAttribute(key) && domElement.removeAttribute(key));
						domElement.addEventListener(tag, value, props);
						break a;
					}
					key in domElement ? domElement[key] = value : !0 === value ? domElement.setAttribute(key, "") : setValueForAttribute(domElement, key, value);
				}
			}
		}
		function setInitialProperties(domElement, tag, props) {
			switch (tag) {
				case "div":
				case "span":
				case "svg":
				case "path":
				case "a":
				case "g":
				case "p":
				case "li": break;
				case "img":
					listenToNonDelegatedEvent("error", domElement);
					listenToNonDelegatedEvent("load", domElement);
					var hasSrc = !1, hasSrcSet = !1, propKey;
					for (propKey in props) if (props.hasOwnProperty(propKey)) {
						var propValue = props[propKey];
						if (null != propValue) switch (propKey) {
							case "src":
								hasSrc = !0;
								break;
							case "srcSet":
								hasSrcSet = !0;
								break;
							case "children":
							case "dangerouslySetInnerHTML": throw Error(formatProdErrorMessage(137, tag));
							default: setProp(domElement, tag, propKey, propValue, props, null);
						}
					}
					hasSrcSet && setProp(domElement, tag, "srcSet", props.srcSet, props, null);
					hasSrc && setProp(domElement, tag, "src", props.src, props, null);
					return;
				case "input":
					listenToNonDelegatedEvent("invalid", domElement);
					var defaultValue = propKey = propValue = hasSrcSet = null, checked = null, defaultChecked = null;
					for (hasSrc in props) if (props.hasOwnProperty(hasSrc)) {
						var propValue$184 = props[hasSrc];
						if (null != propValue$184) switch (hasSrc) {
							case "name":
								hasSrcSet = propValue$184;
								break;
							case "type":
								propValue = propValue$184;
								break;
							case "checked":
								checked = propValue$184;
								break;
							case "defaultChecked":
								defaultChecked = propValue$184;
								break;
							case "value":
								propKey = propValue$184;
								break;
							case "defaultValue":
								defaultValue = propValue$184;
								break;
							case "children":
							case "dangerouslySetInnerHTML":
								if (null != propValue$184) throw Error(formatProdErrorMessage(137, tag));
								break;
							default: setProp(domElement, tag, hasSrc, propValue$184, props, null);
						}
					}
					initInput(domElement, propKey, defaultValue, checked, defaultChecked, propValue, hasSrcSet, !1);
					return;
				case "select":
					listenToNonDelegatedEvent("invalid", domElement);
					hasSrc = propValue = propKey = null;
					for (hasSrcSet in props) if (props.hasOwnProperty(hasSrcSet) && (defaultValue = props[hasSrcSet], null != defaultValue)) switch (hasSrcSet) {
						case "value":
							propKey = defaultValue;
							break;
						case "defaultValue":
							propValue = defaultValue;
							break;
						case "multiple": hasSrc = defaultValue;
						default: setProp(domElement, tag, hasSrcSet, defaultValue, props, null);
					}
					tag = propKey;
					props = propValue;
					domElement.multiple = !!hasSrc;
					null != tag ? updateOptions(domElement, !!hasSrc, tag, !1) : null != props && updateOptions(domElement, !!hasSrc, props, !0);
					return;
				case "textarea":
					listenToNonDelegatedEvent("invalid", domElement);
					propKey = hasSrcSet = hasSrc = null;
					for (propValue in props) if (props.hasOwnProperty(propValue) && (defaultValue = props[propValue], null != defaultValue)) switch (propValue) {
						case "value":
							hasSrc = defaultValue;
							break;
						case "defaultValue":
							hasSrcSet = defaultValue;
							break;
						case "children":
							propKey = defaultValue;
							break;
						case "dangerouslySetInnerHTML":
							if (null != defaultValue) throw Error(formatProdErrorMessage(91));
							break;
						default: setProp(domElement, tag, propValue, defaultValue, props, null);
					}
					initTextarea(domElement, hasSrc, hasSrcSet, propKey);
					return;
				case "option":
					for (checked in props) if (props.hasOwnProperty(checked) && (hasSrc = props[checked], null != hasSrc)) switch (checked) {
						case "selected":
							domElement.selected = hasSrc && "function" !== typeof hasSrc && "symbol" !== typeof hasSrc;
							break;
						default: setProp(domElement, tag, checked, hasSrc, props, null);
					}
					return;
				case "dialog":
					listenToNonDelegatedEvent("beforetoggle", domElement);
					listenToNonDelegatedEvent("toggle", domElement);
					listenToNonDelegatedEvent("cancel", domElement);
					listenToNonDelegatedEvent("close", domElement);
					break;
				case "iframe":
				case "object":
					listenToNonDelegatedEvent("load", domElement);
					break;
				case "video":
				case "audio":
					for (hasSrc = 0; hasSrc < mediaEventTypes.length; hasSrc++) listenToNonDelegatedEvent(mediaEventTypes[hasSrc], domElement);
					break;
				case "image":
					listenToNonDelegatedEvent("error", domElement);
					listenToNonDelegatedEvent("load", domElement);
					break;
				case "details":
					listenToNonDelegatedEvent("toggle", domElement);
					break;
				case "embed":
				case "source":
				case "link": listenToNonDelegatedEvent("error", domElement), listenToNonDelegatedEvent("load", domElement);
				case "area":
				case "base":
				case "br":
				case "col":
				case "hr":
				case "keygen":
				case "meta":
				case "param":
				case "track":
				case "wbr":
				case "menuitem":
					for (defaultChecked in props) if (props.hasOwnProperty(defaultChecked) && (hasSrc = props[defaultChecked], null != hasSrc)) switch (defaultChecked) {
						case "children":
						case "dangerouslySetInnerHTML": throw Error(formatProdErrorMessage(137, tag));
						default: setProp(domElement, tag, defaultChecked, hasSrc, props, null);
					}
					return;
				default: if (isCustomElement(tag)) {
					for (propValue$184 in props) props.hasOwnProperty(propValue$184) && (hasSrc = props[propValue$184], void 0 !== hasSrc && setPropOnCustomElement(domElement, tag, propValue$184, hasSrc, props, void 0));
					return;
				}
			}
			for (defaultValue in props) props.hasOwnProperty(defaultValue) && (hasSrc = props[defaultValue], null != hasSrc && setProp(domElement, tag, defaultValue, hasSrc, props, null));
		}
		function updateProperties(domElement, tag, lastProps, nextProps) {
			switch (tag) {
				case "div":
				case "span":
				case "svg":
				case "path":
				case "a":
				case "g":
				case "p":
				case "li": break;
				case "input":
					var name = null, type = null, value = null, defaultValue = null, lastDefaultValue = null, checked = null, defaultChecked = null;
					for (propKey in lastProps) {
						var lastProp = lastProps[propKey];
						if (lastProps.hasOwnProperty(propKey) && null != lastProp) switch (propKey) {
							case "checked": break;
							case "value": break;
							case "defaultValue": lastDefaultValue = lastProp;
							default: nextProps.hasOwnProperty(propKey) || setProp(domElement, tag, propKey, null, nextProps, lastProp);
						}
					}
					for (var propKey$201 in nextProps) {
						var propKey = nextProps[propKey$201];
						lastProp = lastProps[propKey$201];
						if (nextProps.hasOwnProperty(propKey$201) && (null != propKey || null != lastProp)) switch (propKey$201) {
							case "type":
								type = propKey;
								break;
							case "name":
								name = propKey;
								break;
							case "checked":
								checked = propKey;
								break;
							case "defaultChecked":
								defaultChecked = propKey;
								break;
							case "value":
								value = propKey;
								break;
							case "defaultValue":
								defaultValue = propKey;
								break;
							case "children":
							case "dangerouslySetInnerHTML":
								if (null != propKey) throw Error(formatProdErrorMessage(137, tag));
								break;
							default: propKey !== lastProp && setProp(domElement, tag, propKey$201, propKey, nextProps, lastProp);
						}
					}
					updateInput(domElement, value, defaultValue, lastDefaultValue, checked, defaultChecked, type, name);
					return;
				case "select":
					propKey = value = defaultValue = propKey$201 = null;
					for (type in lastProps) if (lastDefaultValue = lastProps[type], lastProps.hasOwnProperty(type) && null != lastDefaultValue) switch (type) {
						case "value": break;
						case "multiple": propKey = lastDefaultValue;
						default: nextProps.hasOwnProperty(type) || setProp(domElement, tag, type, null, nextProps, lastDefaultValue);
					}
					for (name in nextProps) if (type = nextProps[name], lastDefaultValue = lastProps[name], nextProps.hasOwnProperty(name) && (null != type || null != lastDefaultValue)) switch (name) {
						case "value":
							propKey$201 = type;
							break;
						case "defaultValue":
							defaultValue = type;
							break;
						case "multiple": value = type;
						default: type !== lastDefaultValue && setProp(domElement, tag, name, type, nextProps, lastDefaultValue);
					}
					tag = defaultValue;
					lastProps = value;
					nextProps = propKey;
					null != propKey$201 ? updateOptions(domElement, !!lastProps, propKey$201, !1) : !!nextProps !== !!lastProps && (null != tag ? updateOptions(domElement, !!lastProps, tag, !0) : updateOptions(domElement, !!lastProps, lastProps ? [] : "", !1));
					return;
				case "textarea":
					propKey = propKey$201 = null;
					for (defaultValue in lastProps) if (name = lastProps[defaultValue], lastProps.hasOwnProperty(defaultValue) && null != name && !nextProps.hasOwnProperty(defaultValue)) switch (defaultValue) {
						case "value": break;
						case "children": break;
						default: setProp(domElement, tag, defaultValue, null, nextProps, name);
					}
					for (value in nextProps) if (name = nextProps[value], type = lastProps[value], nextProps.hasOwnProperty(value) && (null != name || null != type)) switch (value) {
						case "value":
							propKey$201 = name;
							break;
						case "defaultValue":
							propKey = name;
							break;
						case "children": break;
						case "dangerouslySetInnerHTML":
							if (null != name) throw Error(formatProdErrorMessage(91));
							break;
						default: name !== type && setProp(domElement, tag, value, name, nextProps, type);
					}
					updateTextarea(domElement, propKey$201, propKey);
					return;
				case "option":
					for (var propKey$217 in lastProps) if (propKey$201 = lastProps[propKey$217], lastProps.hasOwnProperty(propKey$217) && null != propKey$201 && !nextProps.hasOwnProperty(propKey$217)) switch (propKey$217) {
						case "selected":
							domElement.selected = !1;
							break;
						default: setProp(domElement, tag, propKey$217, null, nextProps, propKey$201);
					}
					for (lastDefaultValue in nextProps) if (propKey$201 = nextProps[lastDefaultValue], propKey = lastProps[lastDefaultValue], nextProps.hasOwnProperty(lastDefaultValue) && propKey$201 !== propKey && (null != propKey$201 || null != propKey)) switch (lastDefaultValue) {
						case "selected":
							domElement.selected = propKey$201 && "function" !== typeof propKey$201 && "symbol" !== typeof propKey$201;
							break;
						default: setProp(domElement, tag, lastDefaultValue, propKey$201, nextProps, propKey);
					}
					return;
				case "img":
				case "link":
				case "area":
				case "base":
				case "br":
				case "col":
				case "embed":
				case "hr":
				case "keygen":
				case "meta":
				case "param":
				case "source":
				case "track":
				case "wbr":
				case "menuitem":
					for (var propKey$222 in lastProps) propKey$201 = lastProps[propKey$222], lastProps.hasOwnProperty(propKey$222) && null != propKey$201 && !nextProps.hasOwnProperty(propKey$222) && setProp(domElement, tag, propKey$222, null, nextProps, propKey$201);
					for (checked in nextProps) if (propKey$201 = nextProps[checked], propKey = lastProps[checked], nextProps.hasOwnProperty(checked) && propKey$201 !== propKey && (null != propKey$201 || null != propKey)) switch (checked) {
						case "children":
						case "dangerouslySetInnerHTML":
							if (null != propKey$201) throw Error(formatProdErrorMessage(137, tag));
							break;
						default: setProp(domElement, tag, checked, propKey$201, nextProps, propKey);
					}
					return;
				default: if (isCustomElement(tag)) {
					for (var propKey$227 in lastProps) propKey$201 = lastProps[propKey$227], lastProps.hasOwnProperty(propKey$227) && void 0 !== propKey$201 && !nextProps.hasOwnProperty(propKey$227) && setPropOnCustomElement(domElement, tag, propKey$227, void 0, nextProps, propKey$201);
					for (defaultChecked in nextProps) propKey$201 = nextProps[defaultChecked], propKey = lastProps[defaultChecked], !nextProps.hasOwnProperty(defaultChecked) || propKey$201 === propKey || void 0 === propKey$201 && void 0 === propKey || setPropOnCustomElement(domElement, tag, defaultChecked, propKey$201, nextProps, propKey);
					return;
				}
			}
			for (var propKey$232 in lastProps) propKey$201 = lastProps[propKey$232], lastProps.hasOwnProperty(propKey$232) && null != propKey$201 && !nextProps.hasOwnProperty(propKey$232) && setProp(domElement, tag, propKey$232, null, nextProps, propKey$201);
			for (lastProp in nextProps) propKey$201 = nextProps[lastProp], propKey = lastProps[lastProp], !nextProps.hasOwnProperty(lastProp) || propKey$201 === propKey || null == propKey$201 && null == propKey || setProp(domElement, tag, lastProp, propKey$201, nextProps, propKey);
		}
		function isLikelyStaticResource(initiatorType) {
			switch (initiatorType) {
				case "css":
				case "script":
				case "font":
				case "img":
				case "image":
				case "input":
				case "link": return !0;
				default: return !1;
			}
		}
		function estimateBandwidth() {
			if ("function" === typeof performance.getEntriesByType) {
				for (var count = 0, bits = 0, resourceEntries = performance.getEntriesByType("resource"), i = 0; i < resourceEntries.length; i++) {
					var entry = resourceEntries[i], transferSize = entry.transferSize, initiatorType = entry.initiatorType, duration = entry.duration;
					if (transferSize && duration && isLikelyStaticResource(initiatorType)) {
						initiatorType = 0;
						duration = entry.responseEnd;
						for (i += 1; i < resourceEntries.length; i++) {
							var overlapEntry = resourceEntries[i], overlapStartTime = overlapEntry.startTime;
							if (overlapStartTime > duration) break;
							var overlapTransferSize = overlapEntry.transferSize, overlapInitiatorType = overlapEntry.initiatorType;
							overlapTransferSize && isLikelyStaticResource(overlapInitiatorType) && (overlapEntry = overlapEntry.responseEnd, initiatorType += overlapTransferSize * (overlapEntry < duration ? 1 : (duration - overlapStartTime) / (overlapEntry - overlapStartTime)));
						}
						--i;
						bits += 8 * (transferSize + initiatorType) / (entry.duration / 1e3);
						count++;
						if (10 < count) break;
					}
				}
				if (0 < count) return bits / count / 1e6;
			}
			return navigator.connection && (count = navigator.connection.downlink, "number" === typeof count) ? count : 5;
		}
		var eventsEnabled = null, selectionInformation = null;
		function getOwnerDocumentFromRootContainer(rootContainerElement) {
			return 9 === rootContainerElement.nodeType ? rootContainerElement : rootContainerElement.ownerDocument;
		}
		function getOwnHostContext(namespaceURI) {
			switch (namespaceURI) {
				case "http://www.w3.org/2000/svg": return 1;
				case "http://www.w3.org/1998/Math/MathML": return 2;
				default: return 0;
			}
		}
		function getChildHostContextProd(parentNamespace, type) {
			if (0 === parentNamespace) switch (type) {
				case "svg": return 1;
				case "math": return 2;
				default: return 0;
			}
			return 1 === parentNamespace && "foreignObject" === type ? 0 : parentNamespace;
		}
		function shouldSetTextContent(type, props) {
			return "textarea" === type || "noscript" === type || "string" === typeof props.children || "number" === typeof props.children || "bigint" === typeof props.children || "object" === typeof props.dangerouslySetInnerHTML && null !== props.dangerouslySetInnerHTML && null != props.dangerouslySetInnerHTML.__html;
		}
		var currentPopstateTransitionEvent = null;
		function shouldAttemptEagerTransition() {
			var event = window.event;
			if (event && "popstate" === event.type) {
				if (event === currentPopstateTransitionEvent) return !1;
				currentPopstateTransitionEvent = event;
				return !0;
			}
			currentPopstateTransitionEvent = null;
			return !1;
		}
		var scheduleTimeout = "function" === typeof setTimeout ? setTimeout : void 0, cancelTimeout = "function" === typeof clearTimeout ? clearTimeout : void 0, localPromise = "function" === typeof Promise ? Promise : void 0, scheduleMicrotask = "function" === typeof queueMicrotask ? queueMicrotask : "undefined" !== typeof localPromise ? function(callback) {
			return localPromise.resolve(null).then(callback).catch(handleErrorInNextTick);
		} : scheduleTimeout;
		function handleErrorInNextTick(error) {
			setTimeout(function() {
				throw error;
			});
		}
		function isSingletonScope(type) {
			return "head" === type;
		}
		function clearHydrationBoundary(parentInstance, hydrationInstance) {
			var node = hydrationInstance, depth = 0;
			do {
				var nextNode = node.nextSibling;
				parentInstance.removeChild(node);
				if (nextNode && 8 === nextNode.nodeType) if (node = nextNode.data, "/$" === node || "/&" === node) {
					if (0 === depth) {
						parentInstance.removeChild(nextNode);
						retryIfBlockedOn(hydrationInstance);
						return;
					}
					depth--;
				} else if ("$" === node || "$?" === node || "$~" === node || "$!" === node || "&" === node) depth++;
				else if ("html" === node) releaseSingletonInstance(parentInstance.ownerDocument.documentElement);
				else if ("head" === node) {
					node = parentInstance.ownerDocument.head;
					releaseSingletonInstance(node);
					for (var node$jscomp$0 = node.firstChild; node$jscomp$0;) {
						var nextNode$jscomp$0 = node$jscomp$0.nextSibling, nodeName = node$jscomp$0.nodeName;
						node$jscomp$0[internalHoistableMarker] || "SCRIPT" === nodeName || "STYLE" === nodeName || "LINK" === nodeName && "stylesheet" === node$jscomp$0.rel.toLowerCase() || node.removeChild(node$jscomp$0);
						node$jscomp$0 = nextNode$jscomp$0;
					}
				} else "body" === node && releaseSingletonInstance(parentInstance.ownerDocument.body);
				node = nextNode;
			} while (node);
			retryIfBlockedOn(hydrationInstance);
		}
		function hideOrUnhideDehydratedBoundary(suspenseInstance, isHidden) {
			var node = suspenseInstance;
			suspenseInstance = 0;
			do {
				var nextNode = node.nextSibling;
				1 === node.nodeType ? isHidden ? (node._stashedDisplay = node.style.display, node.style.display = "none") : (node.style.display = node._stashedDisplay || "", "" === node.getAttribute("style") && node.removeAttribute("style")) : 3 === node.nodeType && (isHidden ? (node._stashedText = node.nodeValue, node.nodeValue = "") : node.nodeValue = node._stashedText || "");
				if (nextNode && 8 === nextNode.nodeType) if (node = nextNode.data, "/$" === node) if (0 === suspenseInstance) break;
				else suspenseInstance--;
				else "$" !== node && "$?" !== node && "$~" !== node && "$!" !== node || suspenseInstance++;
				node = nextNode;
			} while (node);
		}
		function clearContainerSparingly(container) {
			var nextNode = container.firstChild;
			nextNode && 10 === nextNode.nodeType && (nextNode = nextNode.nextSibling);
			for (; nextNode;) {
				var node = nextNode;
				nextNode = nextNode.nextSibling;
				switch (node.nodeName) {
					case "HTML":
					case "HEAD":
					case "BODY":
						clearContainerSparingly(node);
						detachDeletedInstance(node);
						continue;
					case "SCRIPT":
					case "STYLE": continue;
					case "LINK": if ("stylesheet" === node.rel.toLowerCase()) continue;
				}
				container.removeChild(node);
			}
		}
		function canHydrateInstance(instance, type, props, inRootOrSingleton) {
			for (; 1 === instance.nodeType;) {
				var anyProps = props;
				if (instance.nodeName.toLowerCase() !== type.toLowerCase()) {
					if (!inRootOrSingleton && ("INPUT" !== instance.nodeName || "hidden" !== instance.type)) break;
				} else if (!inRootOrSingleton) if ("input" === type && "hidden" === instance.type) {
					var name = null == anyProps.name ? null : "" + anyProps.name;
					if ("hidden" === anyProps.type && instance.getAttribute("name") === name) return instance;
				} else return instance;
				else if (!instance[internalHoistableMarker]) switch (type) {
					case "meta":
						if (!instance.hasAttribute("itemprop")) break;
						return instance;
					case "link":
						name = instance.getAttribute("rel");
						if ("stylesheet" === name && instance.hasAttribute("data-precedence")) break;
						else if (name !== anyProps.rel || instance.getAttribute("href") !== (null == anyProps.href || "" === anyProps.href ? null : anyProps.href) || instance.getAttribute("crossorigin") !== (null == anyProps.crossOrigin ? null : anyProps.crossOrigin) || instance.getAttribute("title") !== (null == anyProps.title ? null : anyProps.title)) break;
						return instance;
					case "style":
						if (instance.hasAttribute("data-precedence")) break;
						return instance;
					case "script":
						name = instance.getAttribute("src");
						if ((name !== (null == anyProps.src ? null : anyProps.src) || instance.getAttribute("type") !== (null == anyProps.type ? null : anyProps.type) || instance.getAttribute("crossorigin") !== (null == anyProps.crossOrigin ? null : anyProps.crossOrigin)) && name && instance.hasAttribute("async") && !instance.hasAttribute("itemprop")) break;
						return instance;
					default: return instance;
				}
				instance = getNextHydratable(instance.nextSibling);
				if (null === instance) break;
			}
			return null;
		}
		function canHydrateTextInstance(instance, text, inRootOrSingleton) {
			if ("" === text) return null;
			for (; 3 !== instance.nodeType;) {
				if ((1 !== instance.nodeType || "INPUT" !== instance.nodeName || "hidden" !== instance.type) && !inRootOrSingleton) return null;
				instance = getNextHydratable(instance.nextSibling);
				if (null === instance) return null;
			}
			return instance;
		}
		function canHydrateHydrationBoundary(instance, inRootOrSingleton) {
			for (; 8 !== instance.nodeType;) {
				if ((1 !== instance.nodeType || "INPUT" !== instance.nodeName || "hidden" !== instance.type) && !inRootOrSingleton) return null;
				instance = getNextHydratable(instance.nextSibling);
				if (null === instance) return null;
			}
			return instance;
		}
		function isSuspenseInstancePending(instance) {
			return "$?" === instance.data || "$~" === instance.data;
		}
		function isSuspenseInstanceFallback(instance) {
			return "$!" === instance.data || "$?" === instance.data && "loading" !== instance.ownerDocument.readyState;
		}
		function registerSuspenseInstanceRetry(instance, callback) {
			var ownerDocument = instance.ownerDocument;
			if ("$~" === instance.data) instance._reactRetry = callback;
			else if ("$?" !== instance.data || "loading" !== ownerDocument.readyState) callback();
			else {
				var listener = function() {
					callback();
					ownerDocument.removeEventListener("DOMContentLoaded", listener);
				};
				ownerDocument.addEventListener("DOMContentLoaded", listener);
				instance._reactRetry = listener;
			}
		}
		function getNextHydratable(node) {
			for (; null != node; node = node.nextSibling) {
				var nodeType = node.nodeType;
				if (1 === nodeType || 3 === nodeType) break;
				if (8 === nodeType) {
					nodeType = node.data;
					if ("$" === nodeType || "$!" === nodeType || "$?" === nodeType || "$~" === nodeType || "&" === nodeType || "F!" === nodeType || "F" === nodeType) break;
					if ("/$" === nodeType || "/&" === nodeType) return null;
				}
			}
			return node;
		}
		var previousHydratableOnEnteringScopedSingleton = null;
		function getNextHydratableInstanceAfterHydrationBoundary(hydrationInstance) {
			hydrationInstance = hydrationInstance.nextSibling;
			for (var depth = 0; hydrationInstance;) {
				if (8 === hydrationInstance.nodeType) {
					var data = hydrationInstance.data;
					if ("/$" === data || "/&" === data) {
						if (0 === depth) return getNextHydratable(hydrationInstance.nextSibling);
						depth--;
					} else "$" !== data && "$!" !== data && "$?" !== data && "$~" !== data && "&" !== data || depth++;
				}
				hydrationInstance = hydrationInstance.nextSibling;
			}
			return null;
		}
		function getParentHydrationBoundary(targetInstance) {
			targetInstance = targetInstance.previousSibling;
			for (var depth = 0; targetInstance;) {
				if (8 === targetInstance.nodeType) {
					var data = targetInstance.data;
					if ("$" === data || "$!" === data || "$?" === data || "$~" === data || "&" === data) {
						if (0 === depth) return targetInstance;
						depth--;
					} else "/$" !== data && "/&" !== data || depth++;
				}
				targetInstance = targetInstance.previousSibling;
			}
			return null;
		}
		function resolveSingletonInstance(type, props, rootContainerInstance) {
			props = getOwnerDocumentFromRootContainer(rootContainerInstance);
			switch (type) {
				case "html":
					type = props.documentElement;
					if (!type) throw Error(formatProdErrorMessage(452));
					return type;
				case "head":
					type = props.head;
					if (!type) throw Error(formatProdErrorMessage(453));
					return type;
				case "body":
					type = props.body;
					if (!type) throw Error(formatProdErrorMessage(454));
					return type;
				default: throw Error(formatProdErrorMessage(451));
			}
		}
		function releaseSingletonInstance(instance) {
			for (var attributes = instance.attributes; attributes.length;) instance.removeAttributeNode(attributes[0]);
			detachDeletedInstance(instance);
		}
		var preloadPropsMap = /* @__PURE__ */ new Map(), preconnectsSet = /* @__PURE__ */ new Set();
		function getHoistableRoot(container) {
			return "function" === typeof container.getRootNode ? container.getRootNode() : 9 === container.nodeType ? container : container.ownerDocument;
		}
		var previousDispatcher = ReactDOMSharedInternals.d;
		ReactDOMSharedInternals.d = {
			f: flushSyncWork,
			r: requestFormReset,
			D: prefetchDNS,
			C: preconnect,
			L: preload,
			m: preloadModule,
			X: preinitScript,
			S: preinitStyle,
			M: preinitModuleScript
		};
		function flushSyncWork() {
			var previousWasRendering = previousDispatcher.f(), wasRendering = flushSyncWork$1();
			return previousWasRendering || wasRendering;
		}
		function requestFormReset(form) {
			var formInst = getInstanceFromNode(form);
			null !== formInst && 5 === formInst.tag && "form" === formInst.type ? requestFormReset$1(formInst) : previousDispatcher.r(form);
		}
		var globalDocument = "undefined" === typeof document ? null : document;
		function preconnectAs(rel, href, crossOrigin) {
			var ownerDocument = globalDocument;
			if (ownerDocument && "string" === typeof href && href) {
				var limitedEscapedHref = escapeSelectorAttributeValueInsideDoubleQuotes(href);
				limitedEscapedHref = "link[rel=\"" + rel + "\"][href=\"" + limitedEscapedHref + "\"]";
				"string" === typeof crossOrigin && (limitedEscapedHref += "[crossorigin=\"" + crossOrigin + "\"]");
				preconnectsSet.has(limitedEscapedHref) || (preconnectsSet.add(limitedEscapedHref), rel = {
					rel,
					crossOrigin,
					href
				}, null === ownerDocument.querySelector(limitedEscapedHref) && (href = ownerDocument.createElement("link"), setInitialProperties(href, "link", rel), markNodeAsHoistable(href), ownerDocument.head.appendChild(href)));
			}
		}
		function prefetchDNS(href) {
			previousDispatcher.D(href);
			preconnectAs("dns-prefetch", href, null);
		}
		function preconnect(href, crossOrigin) {
			previousDispatcher.C(href, crossOrigin);
			preconnectAs("preconnect", href, crossOrigin);
		}
		function preload(href, as, options$1) {
			previousDispatcher.L(href, as, options$1);
			var ownerDocument = globalDocument;
			if (ownerDocument && href && as) {
				var preloadSelector = "link[rel=\"preload\"][as=\"" + escapeSelectorAttributeValueInsideDoubleQuotes(as) + "\"]";
				"image" === as ? options$1 && options$1.imageSrcSet ? (preloadSelector += "[imagesrcset=\"" + escapeSelectorAttributeValueInsideDoubleQuotes(options$1.imageSrcSet) + "\"]", "string" === typeof options$1.imageSizes && (preloadSelector += "[imagesizes=\"" + escapeSelectorAttributeValueInsideDoubleQuotes(options$1.imageSizes) + "\"]")) : preloadSelector += "[href=\"" + escapeSelectorAttributeValueInsideDoubleQuotes(href) + "\"]" : preloadSelector += "[href=\"" + escapeSelectorAttributeValueInsideDoubleQuotes(href) + "\"]";
				var key = preloadSelector;
				switch (as) {
					case "style":
						key = getStyleKey(href);
						break;
					case "script": key = getScriptKey(href);
				}
				preloadPropsMap.has(key) || (href = assign({
					rel: "preload",
					href: "image" === as && options$1 && options$1.imageSrcSet ? void 0 : href,
					as
				}, options$1), preloadPropsMap.set(key, href), null !== ownerDocument.querySelector(preloadSelector) || "style" === as && ownerDocument.querySelector(getStylesheetSelectorFromKey(key)) || "script" === as && ownerDocument.querySelector(getScriptSelectorFromKey(key)) || (as = ownerDocument.createElement("link"), setInitialProperties(as, "link", href), markNodeAsHoistable(as), ownerDocument.head.appendChild(as)));
			}
		}
		function preloadModule(href, options$1) {
			previousDispatcher.m(href, options$1);
			var ownerDocument = globalDocument;
			if (ownerDocument && href) {
				var as = options$1 && "string" === typeof options$1.as ? options$1.as : "script", preloadSelector = "link[rel=\"modulepreload\"][as=\"" + escapeSelectorAttributeValueInsideDoubleQuotes(as) + "\"][href=\"" + escapeSelectorAttributeValueInsideDoubleQuotes(href) + "\"]", key = preloadSelector;
				switch (as) {
					case "audioworklet":
					case "paintworklet":
					case "serviceworker":
					case "sharedworker":
					case "worker":
					case "script": key = getScriptKey(href);
				}
				if (!preloadPropsMap.has(key) && (href = assign({
					rel: "modulepreload",
					href
				}, options$1), preloadPropsMap.set(key, href), null === ownerDocument.querySelector(preloadSelector))) {
					switch (as) {
						case "audioworklet":
						case "paintworklet":
						case "serviceworker":
						case "sharedworker":
						case "worker":
						case "script": if (ownerDocument.querySelector(getScriptSelectorFromKey(key))) return;
					}
					as = ownerDocument.createElement("link");
					setInitialProperties(as, "link", href);
					markNodeAsHoistable(as);
					ownerDocument.head.appendChild(as);
				}
			}
		}
		function preinitStyle(href, precedence, options$1) {
			previousDispatcher.S(href, precedence, options$1);
			var ownerDocument = globalDocument;
			if (ownerDocument && href) {
				var styles = getResourcesFromRoot(ownerDocument).hoistableStyles, key = getStyleKey(href);
				precedence = precedence || "default";
				var resource = styles.get(key);
				if (!resource) {
					var state = {
						loading: 0,
						preload: null
					};
					if (resource = ownerDocument.querySelector(getStylesheetSelectorFromKey(key))) state.loading = 5;
					else {
						href = assign({
							rel: "stylesheet",
							href,
							"data-precedence": precedence
						}, options$1);
						(options$1 = preloadPropsMap.get(key)) && adoptPreloadPropsForStylesheet(href, options$1);
						var link = resource = ownerDocument.createElement("link");
						markNodeAsHoistable(link);
						setInitialProperties(link, "link", href);
						link._p = new Promise(function(resolve, reject) {
							link.onload = resolve;
							link.onerror = reject;
						});
						link.addEventListener("load", function() {
							state.loading |= 1;
						});
						link.addEventListener("error", function() {
							state.loading |= 2;
						});
						state.loading |= 4;
						insertStylesheet(resource, precedence, ownerDocument);
					}
					resource = {
						type: "stylesheet",
						instance: resource,
						count: 1,
						state
					};
					styles.set(key, resource);
				}
			}
		}
		function preinitScript(src, options$1) {
			previousDispatcher.X(src, options$1);
			var ownerDocument = globalDocument;
			if (ownerDocument && src) {
				var scripts = getResourcesFromRoot(ownerDocument).hoistableScripts, key = getScriptKey(src), resource = scripts.get(key);
				resource || (resource = ownerDocument.querySelector(getScriptSelectorFromKey(key)), resource || (src = assign({
					src,
					async: !0
				}, options$1), (options$1 = preloadPropsMap.get(key)) && adoptPreloadPropsForScript(src, options$1), resource = ownerDocument.createElement("script"), markNodeAsHoistable(resource), setInitialProperties(resource, "link", src), ownerDocument.head.appendChild(resource)), resource = {
					type: "script",
					instance: resource,
					count: 1,
					state: null
				}, scripts.set(key, resource));
			}
		}
		function preinitModuleScript(src, options$1) {
			previousDispatcher.M(src, options$1);
			var ownerDocument = globalDocument;
			if (ownerDocument && src) {
				var scripts = getResourcesFromRoot(ownerDocument).hoistableScripts, key = getScriptKey(src), resource = scripts.get(key);
				resource || (resource = ownerDocument.querySelector(getScriptSelectorFromKey(key)), resource || (src = assign({
					src,
					async: !0,
					type: "module"
				}, options$1), (options$1 = preloadPropsMap.get(key)) && adoptPreloadPropsForScript(src, options$1), resource = ownerDocument.createElement("script"), markNodeAsHoistable(resource), setInitialProperties(resource, "link", src), ownerDocument.head.appendChild(resource)), resource = {
					type: "script",
					instance: resource,
					count: 1,
					state: null
				}, scripts.set(key, resource));
			}
		}
		function getResource(type, currentProps, pendingProps, currentResource) {
			var JSCompiler_inline_result = (JSCompiler_inline_result = rootInstanceStackCursor.current) ? getHoistableRoot(JSCompiler_inline_result) : null;
			if (!JSCompiler_inline_result) throw Error(formatProdErrorMessage(446));
			switch (type) {
				case "meta":
				case "title": return null;
				case "style": return "string" === typeof pendingProps.precedence && "string" === typeof pendingProps.href ? (currentProps = getStyleKey(pendingProps.href), pendingProps = getResourcesFromRoot(JSCompiler_inline_result).hoistableStyles, currentResource = pendingProps.get(currentProps), currentResource || (currentResource = {
					type: "style",
					instance: null,
					count: 0,
					state: null
				}, pendingProps.set(currentProps, currentResource)), currentResource) : {
					type: "void",
					instance: null,
					count: 0,
					state: null
				};
				case "link":
					if ("stylesheet" === pendingProps.rel && "string" === typeof pendingProps.href && "string" === typeof pendingProps.precedence) {
						type = getStyleKey(pendingProps.href);
						var styles$243 = getResourcesFromRoot(JSCompiler_inline_result).hoistableStyles, resource$244 = styles$243.get(type);
						resource$244 || (JSCompiler_inline_result = JSCompiler_inline_result.ownerDocument || JSCompiler_inline_result, resource$244 = {
							type: "stylesheet",
							instance: null,
							count: 0,
							state: {
								loading: 0,
								preload: null
							}
						}, styles$243.set(type, resource$244), (styles$243 = JSCompiler_inline_result.querySelector(getStylesheetSelectorFromKey(type))) && !styles$243._p && (resource$244.instance = styles$243, resource$244.state.loading = 5), preloadPropsMap.has(type) || (pendingProps = {
							rel: "preload",
							as: "style",
							href: pendingProps.href,
							crossOrigin: pendingProps.crossOrigin,
							integrity: pendingProps.integrity,
							media: pendingProps.media,
							hrefLang: pendingProps.hrefLang,
							referrerPolicy: pendingProps.referrerPolicy
						}, preloadPropsMap.set(type, pendingProps), styles$243 || preloadStylesheet(JSCompiler_inline_result, type, pendingProps, resource$244.state)));
						if (currentProps && null === currentResource) throw Error(formatProdErrorMessage(528, ""));
						return resource$244;
					}
					if (currentProps && null !== currentResource) throw Error(formatProdErrorMessage(529, ""));
					return null;
				case "script": return currentProps = pendingProps.async, pendingProps = pendingProps.src, "string" === typeof pendingProps && currentProps && "function" !== typeof currentProps && "symbol" !== typeof currentProps ? (currentProps = getScriptKey(pendingProps), pendingProps = getResourcesFromRoot(JSCompiler_inline_result).hoistableScripts, currentResource = pendingProps.get(currentProps), currentResource || (currentResource = {
					type: "script",
					instance: null,
					count: 0,
					state: null
				}, pendingProps.set(currentProps, currentResource)), currentResource) : {
					type: "void",
					instance: null,
					count: 0,
					state: null
				};
				default: throw Error(formatProdErrorMessage(444, type));
			}
		}
		function getStyleKey(href) {
			return "href=\"" + escapeSelectorAttributeValueInsideDoubleQuotes(href) + "\"";
		}
		function getStylesheetSelectorFromKey(key) {
			return "link[rel=\"stylesheet\"][" + key + "]";
		}
		function stylesheetPropsFromRawProps(rawProps) {
			return assign({}, rawProps, {
				"data-precedence": rawProps.precedence,
				precedence: null
			});
		}
		function preloadStylesheet(ownerDocument, key, preloadProps, state) {
			ownerDocument.querySelector("link[rel=\"preload\"][as=\"style\"][" + key + "]") ? state.loading = 1 : (key = ownerDocument.createElement("link"), state.preload = key, key.addEventListener("load", function() {
				return state.loading |= 1;
			}), key.addEventListener("error", function() {
				return state.loading |= 2;
			}), setInitialProperties(key, "link", preloadProps), markNodeAsHoistable(key), ownerDocument.head.appendChild(key));
		}
		function getScriptKey(src) {
			return "[src=\"" + escapeSelectorAttributeValueInsideDoubleQuotes(src) + "\"]";
		}
		function getScriptSelectorFromKey(key) {
			return "script[async]" + key;
		}
		function acquireResource(hoistableRoot, resource, props) {
			resource.count++;
			if (null === resource.instance) switch (resource.type) {
				case "style":
					var instance = hoistableRoot.querySelector("style[data-href~=\"" + escapeSelectorAttributeValueInsideDoubleQuotes(props.href) + "\"]");
					if (instance) return resource.instance = instance, markNodeAsHoistable(instance), instance;
					var styleProps = assign({}, props, {
						"data-href": props.href,
						"data-precedence": props.precedence,
						href: null,
						precedence: null
					});
					instance = (hoistableRoot.ownerDocument || hoistableRoot).createElement("style");
					markNodeAsHoistable(instance);
					setInitialProperties(instance, "style", styleProps);
					insertStylesheet(instance, props.precedence, hoistableRoot);
					return resource.instance = instance;
				case "stylesheet":
					styleProps = getStyleKey(props.href);
					var instance$249 = hoistableRoot.querySelector(getStylesheetSelectorFromKey(styleProps));
					if (instance$249) return resource.state.loading |= 4, resource.instance = instance$249, markNodeAsHoistable(instance$249), instance$249;
					instance = stylesheetPropsFromRawProps(props);
					(styleProps = preloadPropsMap.get(styleProps)) && adoptPreloadPropsForStylesheet(instance, styleProps);
					instance$249 = (hoistableRoot.ownerDocument || hoistableRoot).createElement("link");
					markNodeAsHoistable(instance$249);
					var linkInstance = instance$249;
					linkInstance._p = new Promise(function(resolve, reject) {
						linkInstance.onload = resolve;
						linkInstance.onerror = reject;
					});
					setInitialProperties(instance$249, "link", instance);
					resource.state.loading |= 4;
					insertStylesheet(instance$249, props.precedence, hoistableRoot);
					return resource.instance = instance$249;
				case "script":
					instance$249 = getScriptKey(props.src);
					if (styleProps = hoistableRoot.querySelector(getScriptSelectorFromKey(instance$249))) return resource.instance = styleProps, markNodeAsHoistable(styleProps), styleProps;
					instance = props;
					if (styleProps = preloadPropsMap.get(instance$249)) instance = assign({}, props), adoptPreloadPropsForScript(instance, styleProps);
					hoistableRoot = hoistableRoot.ownerDocument || hoistableRoot;
					styleProps = hoistableRoot.createElement("script");
					markNodeAsHoistable(styleProps);
					setInitialProperties(styleProps, "link", instance);
					hoistableRoot.head.appendChild(styleProps);
					return resource.instance = styleProps;
				case "void": return null;
				default: throw Error(formatProdErrorMessage(443, resource.type));
			}
			else "stylesheet" === resource.type && 0 === (resource.state.loading & 4) && (instance = resource.instance, resource.state.loading |= 4, insertStylesheet(instance, props.precedence, hoistableRoot));
			return resource.instance;
		}
		function insertStylesheet(instance, precedence, root$1) {
			for (var nodes = root$1.querySelectorAll("link[rel=\"stylesheet\"][data-precedence],style[data-precedence]"), last = nodes.length ? nodes[nodes.length - 1] : null, prior = last, i = 0; i < nodes.length; i++) {
				var node = nodes[i];
				if (node.dataset.precedence === precedence) prior = node;
				else if (prior !== last) break;
			}
			prior ? prior.parentNode.insertBefore(instance, prior.nextSibling) : (precedence = 9 === root$1.nodeType ? root$1.head : root$1, precedence.insertBefore(instance, precedence.firstChild));
		}
		function adoptPreloadPropsForStylesheet(stylesheetProps, preloadProps) {
			stylesheetProps.crossOrigin ??= preloadProps.crossOrigin;
			stylesheetProps.referrerPolicy ??= preloadProps.referrerPolicy;
			stylesheetProps.title ??= preloadProps.title;
		}
		function adoptPreloadPropsForScript(scriptProps, preloadProps) {
			scriptProps.crossOrigin ??= preloadProps.crossOrigin;
			scriptProps.referrerPolicy ??= preloadProps.referrerPolicy;
			scriptProps.integrity ??= preloadProps.integrity;
		}
		var tagCaches = null;
		function getHydratableHoistableCache(type, keyAttribute, ownerDocument) {
			if (null === tagCaches) {
				var cache = /* @__PURE__ */ new Map();
				var caches = tagCaches = /* @__PURE__ */ new Map();
				caches.set(ownerDocument, cache);
			} else caches = tagCaches, cache = caches.get(ownerDocument), cache || (cache = /* @__PURE__ */ new Map(), caches.set(ownerDocument, cache));
			if (cache.has(type)) return cache;
			cache.set(type, null);
			ownerDocument = ownerDocument.getElementsByTagName(type);
			for (caches = 0; caches < ownerDocument.length; caches++) {
				var node = ownerDocument[caches];
				if (!(node[internalHoistableMarker] || node[internalInstanceKey] || "link" === type && "stylesheet" === node.getAttribute("rel")) && "http://www.w3.org/2000/svg" !== node.namespaceURI) {
					var nodeKey = node.getAttribute(keyAttribute) || "";
					nodeKey = type + nodeKey;
					var existing = cache.get(nodeKey);
					existing ? existing.push(node) : cache.set(nodeKey, [node]);
				}
			}
			return cache;
		}
		function mountHoistable(hoistableRoot, type, instance) {
			hoistableRoot = hoistableRoot.ownerDocument || hoistableRoot;
			hoistableRoot.head.insertBefore(instance, "title" === type ? hoistableRoot.querySelector("head > title") : null);
		}
		function isHostHoistableType(type, props, hostContext) {
			if (1 === hostContext || null != props.itemProp) return !1;
			switch (type) {
				case "meta":
				case "title": return !0;
				case "style":
					if ("string" !== typeof props.precedence || "string" !== typeof props.href || "" === props.href) break;
					return !0;
				case "link":
					if ("string" !== typeof props.rel || "string" !== typeof props.href || "" === props.href || props.onLoad || props.onError) break;
					switch (props.rel) {
						case "stylesheet": return type = props.disabled, "string" === typeof props.precedence && null == type;
						default: return !0;
					}
				case "script": if (props.async && "function" !== typeof props.async && "symbol" !== typeof props.async && !props.onLoad && !props.onError && props.src && "string" === typeof props.src) return !0;
			}
			return !1;
		}
		function preloadResource(resource) {
			return "stylesheet" === resource.type && 0 === (resource.state.loading & 3) ? !1 : !0;
		}
		function suspendResource(state, hoistableRoot, resource, props) {
			if ("stylesheet" === resource.type && ("string" !== typeof props.media || !1 !== matchMedia(props.media).matches) && 0 === (resource.state.loading & 4)) {
				if (null === resource.instance) {
					var key = getStyleKey(props.href), instance = hoistableRoot.querySelector(getStylesheetSelectorFromKey(key));
					if (instance) {
						hoistableRoot = instance._p;
						null !== hoistableRoot && "object" === typeof hoistableRoot && "function" === typeof hoistableRoot.then && (state.count++, state = onUnsuspend.bind(state), hoistableRoot.then(state, state));
						resource.state.loading |= 4;
						resource.instance = instance;
						markNodeAsHoistable(instance);
						return;
					}
					instance = hoistableRoot.ownerDocument || hoistableRoot;
					props = stylesheetPropsFromRawProps(props);
					(key = preloadPropsMap.get(key)) && adoptPreloadPropsForStylesheet(props, key);
					instance = instance.createElement("link");
					markNodeAsHoistable(instance);
					var linkInstance = instance;
					linkInstance._p = new Promise(function(resolve, reject) {
						linkInstance.onload = resolve;
						linkInstance.onerror = reject;
					});
					setInitialProperties(instance, "link", props);
					resource.instance = instance;
				}
				null === state.stylesheets && (state.stylesheets = /* @__PURE__ */ new Map());
				state.stylesheets.set(resource, hoistableRoot);
				(hoistableRoot = resource.state.preload) && 0 === (resource.state.loading & 3) && (state.count++, resource = onUnsuspend.bind(state), hoistableRoot.addEventListener("load", resource), hoistableRoot.addEventListener("error", resource));
			}
		}
		var estimatedBytesWithinLimit = 0;
		function waitForCommitToBeReady(state, timeoutOffset) {
			state.stylesheets && 0 === state.count && insertSuspendedStylesheets(state, state.stylesheets);
			return 0 < state.count || 0 < state.imgCount ? function(commit) {
				var stylesheetTimer = setTimeout(function() {
					state.stylesheets && insertSuspendedStylesheets(state, state.stylesheets);
					if (state.unsuspend) {
						var unsuspend = state.unsuspend;
						state.unsuspend = null;
						unsuspend();
					}
				}, 6e4 + timeoutOffset);
				0 < state.imgBytes && 0 === estimatedBytesWithinLimit && (estimatedBytesWithinLimit = 62500 * estimateBandwidth());
				var imgTimer = setTimeout(function() {
					state.waitingForImages = !1;
					if (0 === state.count && (state.stylesheets && insertSuspendedStylesheets(state, state.stylesheets), state.unsuspend)) {
						var unsuspend = state.unsuspend;
						state.unsuspend = null;
						unsuspend();
					}
				}, (state.imgBytes > estimatedBytesWithinLimit ? 50 : 800) + timeoutOffset);
				state.unsuspend = commit;
				return function() {
					state.unsuspend = null;
					clearTimeout(stylesheetTimer);
					clearTimeout(imgTimer);
				};
			} : null;
		}
		function onUnsuspend() {
			this.count--;
			if (0 === this.count && (0 === this.imgCount || !this.waitingForImages)) {
				if (this.stylesheets) insertSuspendedStylesheets(this, this.stylesheets);
				else if (this.unsuspend) {
					var unsuspend = this.unsuspend;
					this.unsuspend = null;
					unsuspend();
				}
			}
		}
		var precedencesByRoot = null;
		function insertSuspendedStylesheets(state, resources) {
			state.stylesheets = null;
			null !== state.unsuspend && (state.count++, precedencesByRoot = /* @__PURE__ */ new Map(), resources.forEach(insertStylesheetIntoRoot, state), precedencesByRoot = null, onUnsuspend.call(state));
		}
		function insertStylesheetIntoRoot(root$1, resource) {
			if (!(resource.state.loading & 4)) {
				var precedences = precedencesByRoot.get(root$1);
				if (precedences) var last = precedences.get(null);
				else {
					precedences = /* @__PURE__ */ new Map();
					precedencesByRoot.set(root$1, precedences);
					for (var nodes = root$1.querySelectorAll("link[data-precedence],style[data-precedence]"), i = 0; i < nodes.length; i++) {
						var node = nodes[i];
						if ("LINK" === node.nodeName || "not all" !== node.getAttribute("media")) precedences.set(node.dataset.precedence, node), last = node;
					}
					last && precedences.set(null, last);
				}
				nodes = resource.instance;
				node = nodes.getAttribute("data-precedence");
				i = precedences.get(node) || last;
				i === last && precedences.set(null, nodes);
				precedences.set(node, nodes);
				this.count++;
				last = onUnsuspend.bind(this);
				nodes.addEventListener("load", last);
				nodes.addEventListener("error", last);
				i ? i.parentNode.insertBefore(nodes, i.nextSibling) : (root$1 = 9 === root$1.nodeType ? root$1.head : root$1, root$1.insertBefore(nodes, root$1.firstChild));
				resource.state.loading |= 4;
			}
		}
		var HostTransitionContext = {
			$$typeof: REACT_CONTEXT_TYPE,
			Provider: null,
			Consumer: null,
			_currentValue: sharedNotPendingObject,
			_currentValue2: sharedNotPendingObject,
			_threadCount: 0
		};
		function FiberRootNode(containerInfo, tag, hydrate, identifierPrefix, onUncaughtError, onCaughtError, onRecoverableError, onDefaultTransitionIndicator, formState) {
			this.tag = 1;
			this.containerInfo = containerInfo;
			this.pingCache = this.current = this.pendingChildren = null;
			this.timeoutHandle = -1;
			this.callbackNode = this.next = this.pendingContext = this.context = this.cancelPendingCommit = null;
			this.callbackPriority = 0;
			this.expirationTimes = createLaneMap(-1);
			this.entangledLanes = this.shellSuspendCounter = this.errorRecoveryDisabledLanes = this.expiredLanes = this.warmLanes = this.pingedLanes = this.suspendedLanes = this.pendingLanes = 0;
			this.entanglements = createLaneMap(0);
			this.hiddenUpdates = createLaneMap(null);
			this.identifierPrefix = identifierPrefix;
			this.onUncaughtError = onUncaughtError;
			this.onCaughtError = onCaughtError;
			this.onRecoverableError = onRecoverableError;
			this.pooledCache = null;
			this.pooledCacheLanes = 0;
			this.formState = formState;
			this.incompleteTransitions = /* @__PURE__ */ new Map();
		}
		function createFiberRoot(containerInfo, tag, hydrate, initialChildren, hydrationCallbacks, isStrictMode, identifierPrefix, formState, onUncaughtError, onCaughtError, onRecoverableError, onDefaultTransitionIndicator) {
			containerInfo = new FiberRootNode(containerInfo, tag, hydrate, identifierPrefix, onUncaughtError, onCaughtError, onRecoverableError, onDefaultTransitionIndicator, formState);
			tag = 1;
			!0 === isStrictMode && (tag |= 24);
			isStrictMode = createFiberImplClass(3, null, null, tag);
			containerInfo.current = isStrictMode;
			isStrictMode.stateNode = containerInfo;
			tag = createCache();
			tag.refCount++;
			containerInfo.pooledCache = tag;
			tag.refCount++;
			isStrictMode.memoizedState = {
				element: initialChildren,
				isDehydrated: hydrate,
				cache: tag
			};
			initializeUpdateQueue(isStrictMode);
			return containerInfo;
		}
		function getContextForSubtree(parentComponent) {
			if (!parentComponent) return emptyContextObject;
			parentComponent = emptyContextObject;
			return parentComponent;
		}
		function updateContainerImpl(rootFiber, lane, element, container, parentComponent, callback) {
			parentComponent = getContextForSubtree(parentComponent);
			null === container.context ? container.context = parentComponent : container.pendingContext = parentComponent;
			container = createUpdate(lane);
			container.payload = { element };
			callback = void 0 === callback ? null : callback;
			null !== callback && (container.callback = callback);
			element = enqueueUpdate(rootFiber, container, lane);
			null !== element && (scheduleUpdateOnFiber(element, rootFiber, lane), entangleTransitions(element, rootFiber, lane));
		}
		function markRetryLaneImpl(fiber, retryLane) {
			fiber = fiber.memoizedState;
			if (null !== fiber && null !== fiber.dehydrated) {
				var a$1 = fiber.retryLane;
				fiber.retryLane = 0 !== a$1 && a$1 < retryLane ? a$1 : retryLane;
			}
		}
		function markRetryLaneIfNotHydrated(fiber, retryLane) {
			markRetryLaneImpl(fiber, retryLane);
			(fiber = fiber.alternate) && markRetryLaneImpl(fiber, retryLane);
		}
		function attemptContinuousHydration(fiber) {
			if (13 === fiber.tag || 31 === fiber.tag) {
				var root$1 = enqueueConcurrentRenderForLane(fiber, 67108864);
				null !== root$1 && scheduleUpdateOnFiber(root$1, fiber, 67108864);
				markRetryLaneIfNotHydrated(fiber, 67108864);
			}
		}
		function attemptHydrationAtCurrentPriority(fiber) {
			if (13 === fiber.tag || 31 === fiber.tag) {
				var lane = requestUpdateLane();
				lane = getBumpedLaneForHydrationByLane(lane);
				var root$1 = enqueueConcurrentRenderForLane(fiber, lane);
				null !== root$1 && scheduleUpdateOnFiber(root$1, fiber, lane);
				markRetryLaneIfNotHydrated(fiber, lane);
			}
		}
		var _enabled = !0;
		function dispatchDiscreteEvent(domEventName, eventSystemFlags, container, nativeEvent) {
			var prevTransition = ReactSharedInternals.T;
			ReactSharedInternals.T = null;
			var previousPriority = ReactDOMSharedInternals.p;
			try {
				ReactDOMSharedInternals.p = 2, dispatchEvent(domEventName, eventSystemFlags, container, nativeEvent);
			} finally {
				ReactDOMSharedInternals.p = previousPriority, ReactSharedInternals.T = prevTransition;
			}
		}
		function dispatchContinuousEvent(domEventName, eventSystemFlags, container, nativeEvent) {
			var prevTransition = ReactSharedInternals.T;
			ReactSharedInternals.T = null;
			var previousPriority = ReactDOMSharedInternals.p;
			try {
				ReactDOMSharedInternals.p = 8, dispatchEvent(domEventName, eventSystemFlags, container, nativeEvent);
			} finally {
				ReactDOMSharedInternals.p = previousPriority, ReactSharedInternals.T = prevTransition;
			}
		}
		function dispatchEvent(domEventName, eventSystemFlags, targetContainer, nativeEvent) {
			if (_enabled) {
				var blockedOn = findInstanceBlockingEvent(nativeEvent);
				if (null === blockedOn) dispatchEventForPluginEventSystem(domEventName, eventSystemFlags, nativeEvent, return_targetInst, targetContainer), clearIfContinuousEvent(domEventName, nativeEvent);
				else if (queueIfContinuousEvent(blockedOn, domEventName, eventSystemFlags, targetContainer, nativeEvent)) nativeEvent.stopPropagation();
				else if (clearIfContinuousEvent(domEventName, nativeEvent), eventSystemFlags & 4 && -1 < discreteReplayableEvents.indexOf(domEventName)) {
					for (; null !== blockedOn;) {
						var fiber = getInstanceFromNode(blockedOn);
						if (null !== fiber) switch (fiber.tag) {
							case 3:
								fiber = fiber.stateNode;
								if (fiber.current.memoizedState.isDehydrated) {
									var lanes = getHighestPriorityLanes(fiber.pendingLanes);
									if (0 !== lanes) {
										var root$1 = fiber;
										root$1.pendingLanes |= 2;
										for (root$1.entangledLanes |= 2; lanes;) {
											var lane = 1 << 31 - clz32(lanes);
											root$1.entanglements[1] |= lane;
											lanes &= ~lane;
										}
										ensureRootIsScheduled(fiber);
										0 === (executionContext & 6) && (workInProgressRootRenderTargetTime = now() + 500, flushSyncWorkAcrossRoots_impl(0, !1));
									}
								}
								break;
							case 31:
							case 13: root$1 = enqueueConcurrentRenderForLane(fiber, 2), null !== root$1 && scheduleUpdateOnFiber(root$1, fiber, 2), flushSyncWork$1(), markRetryLaneIfNotHydrated(fiber, 2);
						}
						fiber = findInstanceBlockingEvent(nativeEvent);
						null === fiber && dispatchEventForPluginEventSystem(domEventName, eventSystemFlags, nativeEvent, return_targetInst, targetContainer);
						if (fiber === blockedOn) break;
						blockedOn = fiber;
					}
					null !== blockedOn && nativeEvent.stopPropagation();
				} else dispatchEventForPluginEventSystem(domEventName, eventSystemFlags, nativeEvent, null, targetContainer);
			}
		}
		function findInstanceBlockingEvent(nativeEvent) {
			nativeEvent = getEventTarget(nativeEvent);
			return findInstanceBlockingTarget(nativeEvent);
		}
		var return_targetInst = null;
		function findInstanceBlockingTarget(targetNode) {
			return_targetInst = null;
			targetNode = getClosestInstanceFromNode(targetNode);
			if (null !== targetNode) {
				var nearestMounted = getNearestMountedFiber(targetNode);
				if (null === nearestMounted) targetNode = null;
				else {
					var tag = nearestMounted.tag;
					if (13 === tag) {
						targetNode = getSuspenseInstanceFromFiber(nearestMounted);
						if (null !== targetNode) return targetNode;
						targetNode = null;
					} else if (31 === tag) {
						targetNode = getActivityInstanceFromFiber(nearestMounted);
						if (null !== targetNode) return targetNode;
						targetNode = null;
					} else if (3 === tag) {
						if (nearestMounted.stateNode.current.memoizedState.isDehydrated) return 3 === nearestMounted.tag ? nearestMounted.stateNode.containerInfo : null;
						targetNode = null;
					} else nearestMounted !== targetNode && (targetNode = null);
				}
			}
			return_targetInst = targetNode;
			return null;
		}
		function getEventPriority(domEventName) {
			switch (domEventName) {
				case "beforetoggle":
				case "cancel":
				case "click":
				case "close":
				case "contextmenu":
				case "copy":
				case "cut":
				case "auxclick":
				case "dblclick":
				case "dragend":
				case "dragstart":
				case "drop":
				case "focusin":
				case "focusout":
				case "input":
				case "invalid":
				case "keydown":
				case "keypress":
				case "keyup":
				case "mousedown":
				case "mouseup":
				case "paste":
				case "pause":
				case "play":
				case "pointercancel":
				case "pointerdown":
				case "pointerup":
				case "ratechange":
				case "reset":
				case "resize":
				case "seeked":
				case "submit":
				case "toggle":
				case "touchcancel":
				case "touchend":
				case "touchstart":
				case "volumechange":
				case "change":
				case "selectionchange":
				case "textInput":
				case "compositionstart":
				case "compositionend":
				case "compositionupdate":
				case "beforeblur":
				case "afterblur":
				case "beforeinput":
				case "blur":
				case "fullscreenchange":
				case "focus":
				case "hashchange":
				case "popstate":
				case "select":
				case "selectstart": return 2;
				case "drag":
				case "dragenter":
				case "dragexit":
				case "dragleave":
				case "dragover":
				case "mousemove":
				case "mouseout":
				case "mouseover":
				case "pointermove":
				case "pointerout":
				case "pointerover":
				case "scroll":
				case "touchmove":
				case "wheel":
				case "mouseenter":
				case "mouseleave":
				case "pointerenter":
				case "pointerleave": return 8;
				case "message": switch (getCurrentPriorityLevel()) {
					case ImmediatePriority: return 2;
					case UserBlockingPriority: return 8;
					case NormalPriority$1:
					case LowPriority: return 32;
					case IdlePriority: return 268435456;
					default: return 32;
				}
				default: return 32;
			}
		}
		var hasScheduledReplayAttempt = !1, queuedFocus = null, queuedDrag = null, queuedMouse = null, queuedPointers = /* @__PURE__ */ new Map(), queuedPointerCaptures = /* @__PURE__ */ new Map(), queuedExplicitHydrationTargets = [], discreteReplayableEvents = "mousedown mouseup touchcancel touchend touchstart auxclick dblclick pointercancel pointerdown pointerup dragend dragstart drop compositionend compositionstart keydown keypress keyup input textInput copy cut paste click change contextmenu reset".split(" ");
		function clearIfContinuousEvent(domEventName, nativeEvent) {
			switch (domEventName) {
				case "focusin":
				case "focusout":
					queuedFocus = null;
					break;
				case "dragenter":
				case "dragleave":
					queuedDrag = null;
					break;
				case "mouseover":
				case "mouseout":
					queuedMouse = null;
					break;
				case "pointerover":
				case "pointerout":
					queuedPointers.delete(nativeEvent.pointerId);
					break;
				case "gotpointercapture":
				case "lostpointercapture": queuedPointerCaptures.delete(nativeEvent.pointerId);
			}
		}
		function accumulateOrCreateContinuousQueuedReplayableEvent(existingQueuedEvent, blockedOn, domEventName, eventSystemFlags, targetContainer, nativeEvent) {
			if (null === existingQueuedEvent || existingQueuedEvent.nativeEvent !== nativeEvent) return existingQueuedEvent = {
				blockedOn,
				domEventName,
				eventSystemFlags,
				nativeEvent,
				targetContainers: [targetContainer]
			}, null !== blockedOn && (blockedOn = getInstanceFromNode(blockedOn), null !== blockedOn && attemptContinuousHydration(blockedOn)), existingQueuedEvent;
			existingQueuedEvent.eventSystemFlags |= eventSystemFlags;
			blockedOn = existingQueuedEvent.targetContainers;
			null !== targetContainer && -1 === blockedOn.indexOf(targetContainer) && blockedOn.push(targetContainer);
			return existingQueuedEvent;
		}
		function queueIfContinuousEvent(blockedOn, domEventName, eventSystemFlags, targetContainer, nativeEvent) {
			switch (domEventName) {
				case "focusin": return queuedFocus = accumulateOrCreateContinuousQueuedReplayableEvent(queuedFocus, blockedOn, domEventName, eventSystemFlags, targetContainer, nativeEvent), !0;
				case "dragenter": return queuedDrag = accumulateOrCreateContinuousQueuedReplayableEvent(queuedDrag, blockedOn, domEventName, eventSystemFlags, targetContainer, nativeEvent), !0;
				case "mouseover": return queuedMouse = accumulateOrCreateContinuousQueuedReplayableEvent(queuedMouse, blockedOn, domEventName, eventSystemFlags, targetContainer, nativeEvent), !0;
				case "pointerover":
					var pointerId = nativeEvent.pointerId;
					queuedPointers.set(pointerId, accumulateOrCreateContinuousQueuedReplayableEvent(queuedPointers.get(pointerId) || null, blockedOn, domEventName, eventSystemFlags, targetContainer, nativeEvent));
					return !0;
				case "gotpointercapture": return pointerId = nativeEvent.pointerId, queuedPointerCaptures.set(pointerId, accumulateOrCreateContinuousQueuedReplayableEvent(queuedPointerCaptures.get(pointerId) || null, blockedOn, domEventName, eventSystemFlags, targetContainer, nativeEvent)), !0;
			}
			return !1;
		}
		function attemptExplicitHydrationTarget(queuedTarget) {
			var targetInst = getClosestInstanceFromNode(queuedTarget.target);
			if (null !== targetInst) {
				var nearestMounted = getNearestMountedFiber(targetInst);
				if (null !== nearestMounted) {
					if (targetInst = nearestMounted.tag, 13 === targetInst) {
						if (targetInst = getSuspenseInstanceFromFiber(nearestMounted), null !== targetInst) {
							queuedTarget.blockedOn = targetInst;
							runWithPriority(queuedTarget.priority, function() {
								attemptHydrationAtCurrentPriority(nearestMounted);
							});
							return;
						}
					} else if (31 === targetInst) {
						if (targetInst = getActivityInstanceFromFiber(nearestMounted), null !== targetInst) {
							queuedTarget.blockedOn = targetInst;
							runWithPriority(queuedTarget.priority, function() {
								attemptHydrationAtCurrentPriority(nearestMounted);
							});
							return;
						}
					} else if (3 === targetInst && nearestMounted.stateNode.current.memoizedState.isDehydrated) {
						queuedTarget.blockedOn = 3 === nearestMounted.tag ? nearestMounted.stateNode.containerInfo : null;
						return;
					}
				}
			}
			queuedTarget.blockedOn = null;
		}
		function attemptReplayContinuousQueuedEvent(queuedEvent) {
			if (null !== queuedEvent.blockedOn) return !1;
			for (var targetContainers = queuedEvent.targetContainers; 0 < targetContainers.length;) {
				var nextBlockedOn = findInstanceBlockingEvent(queuedEvent.nativeEvent);
				if (null === nextBlockedOn) {
					nextBlockedOn = queuedEvent.nativeEvent;
					var nativeEventClone = new nextBlockedOn.constructor(nextBlockedOn.type, nextBlockedOn);
					currentReplayingEvent = nativeEventClone;
					nextBlockedOn.target.dispatchEvent(nativeEventClone);
					currentReplayingEvent = null;
				} else return targetContainers = getInstanceFromNode(nextBlockedOn), null !== targetContainers && attemptContinuousHydration(targetContainers), queuedEvent.blockedOn = nextBlockedOn, !1;
				targetContainers.shift();
			}
			return !0;
		}
		function attemptReplayContinuousQueuedEventInMap(queuedEvent, key, map) {
			attemptReplayContinuousQueuedEvent(queuedEvent) && map.delete(key);
		}
		function replayUnblockedEvents() {
			hasScheduledReplayAttempt = !1;
			null !== queuedFocus && attemptReplayContinuousQueuedEvent(queuedFocus) && (queuedFocus = null);
			null !== queuedDrag && attemptReplayContinuousQueuedEvent(queuedDrag) && (queuedDrag = null);
			null !== queuedMouse && attemptReplayContinuousQueuedEvent(queuedMouse) && (queuedMouse = null);
			queuedPointers.forEach(attemptReplayContinuousQueuedEventInMap);
			queuedPointerCaptures.forEach(attemptReplayContinuousQueuedEventInMap);
		}
		function scheduleCallbackIfUnblocked(queuedEvent, unblocked) {
			queuedEvent.blockedOn === unblocked && (queuedEvent.blockedOn = null, hasScheduledReplayAttempt || (hasScheduledReplayAttempt = !0, Scheduler.unstable_scheduleCallback(Scheduler.unstable_NormalPriority, replayUnblockedEvents)));
		}
		var lastScheduledReplayQueue = null;
		function scheduleReplayQueueIfNeeded(formReplayingQueue) {
			lastScheduledReplayQueue !== formReplayingQueue && (lastScheduledReplayQueue = formReplayingQueue, Scheduler.unstable_scheduleCallback(Scheduler.unstable_NormalPriority, function() {
				lastScheduledReplayQueue === formReplayingQueue && (lastScheduledReplayQueue = null);
				for (var i = 0; i < formReplayingQueue.length; i += 3) {
					var form = formReplayingQueue[i], submitterOrAction = formReplayingQueue[i + 1], formData = formReplayingQueue[i + 2];
					if ("function" !== typeof submitterOrAction) if (null === findInstanceBlockingTarget(submitterOrAction || form)) continue;
					else break;
					var formInst = getInstanceFromNode(form);
					null !== formInst && (formReplayingQueue.splice(i, 3), i -= 3, startHostTransition(formInst, {
						pending: !0,
						data: formData,
						method: form.method,
						action: submitterOrAction
					}, submitterOrAction, formData));
				}
			}));
		}
		function retryIfBlockedOn(unblocked) {
			function unblock(queuedEvent) {
				return scheduleCallbackIfUnblocked(queuedEvent, unblocked);
			}
			null !== queuedFocus && scheduleCallbackIfUnblocked(queuedFocus, unblocked);
			null !== queuedDrag && scheduleCallbackIfUnblocked(queuedDrag, unblocked);
			null !== queuedMouse && scheduleCallbackIfUnblocked(queuedMouse, unblocked);
			queuedPointers.forEach(unblock);
			queuedPointerCaptures.forEach(unblock);
			for (var i = 0; i < queuedExplicitHydrationTargets.length; i++) {
				var queuedTarget = queuedExplicitHydrationTargets[i];
				queuedTarget.blockedOn === unblocked && (queuedTarget.blockedOn = null);
			}
			for (; 0 < queuedExplicitHydrationTargets.length && (i = queuedExplicitHydrationTargets[0], null === i.blockedOn);) attemptExplicitHydrationTarget(i), null === i.blockedOn && queuedExplicitHydrationTargets.shift();
			i = (unblocked.ownerDocument || unblocked).$$reactFormReplay;
			if (null != i) for (queuedTarget = 0; queuedTarget < i.length; queuedTarget += 3) {
				var form = i[queuedTarget], submitterOrAction = i[queuedTarget + 1], formProps = form[internalPropsKey] || null;
				if ("function" === typeof submitterOrAction) formProps || scheduleReplayQueueIfNeeded(i);
				else if (formProps) {
					var action = null;
					if (submitterOrAction && submitterOrAction.hasAttribute("formAction")) {
						if (form = submitterOrAction, formProps = submitterOrAction[internalPropsKey] || null) action = formProps.formAction;
						else if (null !== findInstanceBlockingTarget(form)) continue;
					} else action = formProps.action;
					"function" === typeof action ? i[queuedTarget + 1] = action : (i.splice(queuedTarget, 3), queuedTarget -= 3);
					scheduleReplayQueueIfNeeded(i);
				}
			}
		}
		function defaultOnDefaultTransitionIndicator() {
			function handleNavigate(event) {
				event.canIntercept && "react-transition" === event.info && event.intercept({
					handler: function() {
						return new Promise(function(resolve) {
							return pendingResolve = resolve;
						});
					},
					focusReset: "manual",
					scroll: "manual"
				});
			}
			function handleNavigateComplete() {
				null !== pendingResolve && (pendingResolve(), pendingResolve = null);
				isCancelled || setTimeout(startFakeNavigation, 20);
			}
			function startFakeNavigation() {
				if (!isCancelled && !navigation.transition) {
					var currentEntry = navigation.currentEntry;
					currentEntry && null != currentEntry.url && navigation.navigate(currentEntry.url, {
						state: currentEntry.getState(),
						info: "react-transition",
						history: "replace"
					});
				}
			}
			if ("object" === typeof navigation) {
				var isCancelled = !1, pendingResolve = null;
				navigation.addEventListener("navigate", handleNavigate);
				navigation.addEventListener("navigatesuccess", handleNavigateComplete);
				navigation.addEventListener("navigateerror", handleNavigateComplete);
				setTimeout(startFakeNavigation, 100);
				return function() {
					isCancelled = !0;
					navigation.removeEventListener("navigate", handleNavigate);
					navigation.removeEventListener("navigatesuccess", handleNavigateComplete);
					navigation.removeEventListener("navigateerror", handleNavigateComplete);
					null !== pendingResolve && (pendingResolve(), pendingResolve = null);
				};
			}
		}
		function ReactDOMRoot(internalRoot) {
			this._internalRoot = internalRoot;
		}
		ReactDOMHydrationRoot.prototype.render = ReactDOMRoot.prototype.render = function(children) {
			var root$1 = this._internalRoot;
			if (null === root$1) throw Error(formatProdErrorMessage(409));
			var current = root$1.current;
			updateContainerImpl(current, requestUpdateLane(), children, root$1, null, null);
		};
		ReactDOMHydrationRoot.prototype.unmount = ReactDOMRoot.prototype.unmount = function() {
			var root$1 = this._internalRoot;
			if (null !== root$1) {
				this._internalRoot = null;
				var container = root$1.containerInfo;
				updateContainerImpl(root$1.current, 2, null, root$1, null, null);
				flushSyncWork$1();
				container[internalContainerInstanceKey] = null;
			}
		};
		function ReactDOMHydrationRoot(internalRoot) {
			this._internalRoot = internalRoot;
		}
		ReactDOMHydrationRoot.prototype.unstable_scheduleHydration = function(target) {
			if (target) {
				var updatePriority = resolveUpdatePriority();
				target = {
					blockedOn: null,
					target,
					priority: updatePriority
				};
				for (var i = 0; i < queuedExplicitHydrationTargets.length && 0 !== updatePriority && updatePriority < queuedExplicitHydrationTargets[i].priority; i++);
				queuedExplicitHydrationTargets.splice(i, 0, target);
				0 === i && attemptExplicitHydrationTarget(target);
			}
		};
		var isomorphicReactPackageVersion$jscomp$inline_1840 = React$1.version;
		if ("19.2.0" !== isomorphicReactPackageVersion$jscomp$inline_1840) throw Error(formatProdErrorMessage(527, isomorphicReactPackageVersion$jscomp$inline_1840, "19.2.0"));
		ReactDOMSharedInternals.findDOMNode = function(componentOrElement) {
			var fiber = componentOrElement._reactInternals;
			if (void 0 === fiber) {
				if ("function" === typeof componentOrElement.render) throw Error(formatProdErrorMessage(188));
				componentOrElement = Object.keys(componentOrElement).join(",");
				throw Error(formatProdErrorMessage(268, componentOrElement));
			}
			componentOrElement = findCurrentFiberUsingSlowPath(fiber);
			componentOrElement = null !== componentOrElement ? findCurrentHostFiberImpl(componentOrElement) : null;
			componentOrElement = null === componentOrElement ? null : componentOrElement.stateNode;
			return componentOrElement;
		};
		var internals$jscomp$inline_2347 = {
			bundleType: 0,
			version: "19.2.0",
			rendererPackageName: "react-dom",
			currentDispatcherRef: ReactSharedInternals,
			reconcilerVersion: "19.2.0"
		};
		if ("undefined" !== typeof __REACT_DEVTOOLS_GLOBAL_HOOK__) {
			var hook$jscomp$inline_2348 = __REACT_DEVTOOLS_GLOBAL_HOOK__;
			if (!hook$jscomp$inline_2348.isDisabled && hook$jscomp$inline_2348.supportsFiber) try {
				rendererID = hook$jscomp$inline_2348.inject(internals$jscomp$inline_2347), injectedHook = hook$jscomp$inline_2348;
			} catch (err) {}
		}
		exports.createRoot = function(container, options$1) {
			if (!isValidContainer(container)) throw Error(formatProdErrorMessage(299));
			var isStrictMode = !1, identifierPrefix = "", onUncaughtError = defaultOnUncaughtError, onCaughtError = defaultOnCaughtError, onRecoverableError = defaultOnRecoverableError;
			null !== options$1 && void 0 !== options$1 && (!0 === options$1.unstable_strictMode && (isStrictMode = !0), void 0 !== options$1.identifierPrefix && (identifierPrefix = options$1.identifierPrefix), void 0 !== options$1.onUncaughtError && (onUncaughtError = options$1.onUncaughtError), void 0 !== options$1.onCaughtError && (onCaughtError = options$1.onCaughtError), void 0 !== options$1.onRecoverableError && (onRecoverableError = options$1.onRecoverableError));
			options$1 = createFiberRoot(container, 1, !1, null, null, isStrictMode, identifierPrefix, null, onUncaughtError, onCaughtError, onRecoverableError, defaultOnDefaultTransitionIndicator);
			container[internalContainerInstanceKey] = options$1.current;
			listenToAllSupportedEvents(container);
			return new ReactDOMRoot(options$1);
		};
	}));
	var import_client = /* @__PURE__ */ __toESM((/* @__PURE__ */ __commonJSMin(((exports, module) => {
		function checkDCE() {
			if (typeof __REACT_DEVTOOLS_GLOBAL_HOOK__ === "undefined" || typeof __REACT_DEVTOOLS_GLOBAL_HOOK__.checkDCE !== "function") return;
			try {
				__REACT_DEVTOOLS_GLOBAL_HOOK__.checkDCE(checkDCE);
			} catch (err) {
				console.error(err);
			}
		}
		checkDCE();
		module.exports = require_react_dom_client_production();
	})))(), 1);
	function ChangelogView() {
		return /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
			className: "space-y-6",
			children: [/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", { children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)("h2", {
				className: "text-2xl font-bold",
				children: "Updates"
			}), /* @__PURE__ */ (0, import_jsx_runtime.jsx)("p", {
				className: "text-muted-foreground",
				children: "Latest changelog"
			})] }), /* @__PURE__ */ (0, import_jsx_runtime.jsx)("div", {
				className: "text-muted-foreground py-12 text-center",
				children: "No updates yet."
			})]
		});
	}
	var a = /* @__PURE__ */ new Map([
		["bold", /* @__PURE__ */ import_react.createElement(import_react.Fragment, null, /* @__PURE__ */ import_react.createElement("path", { d: "M178,36c-20.09,0-37.92,7.93-50,21.56C115.92,43.93,98.09,36,78,36a66.08,66.08,0,0,0-66,66c0,72.34,105.81,130.14,110.31,132.57a12,12,0,0,0,11.38,0C138.19,232.14,244,174.34,244,102A66.08,66.08,0,0,0,178,36Zm-5.49,142.36A328.69,328.69,0,0,1,128,210.16a328.69,328.69,0,0,1-44.51-31.8C61.82,159.77,36,131.42,36,102A42,42,0,0,1,78,60c17.8,0,32.7,9.4,38.89,24.54a12,12,0,0,0,22.22,0C145.3,69.4,160.2,60,178,60a42,42,0,0,1,42,42C220,131.42,194.18,159.77,172.51,178.36Z" }))],
		["duotone", /* @__PURE__ */ import_react.createElement(import_react.Fragment, null, /* @__PURE__ */ import_react.createElement("path", {
			d: "M232,102c0,66-104,122-104,122S24,168,24,102A54,54,0,0,1,78,48c22.59,0,41.94,12.31,50,32,8.06-19.69,27.41-32,50-32A54,54,0,0,1,232,102Z",
			opacity: "0.2"
		}), /* @__PURE__ */ import_react.createElement("path", { d: "M178,40c-20.65,0-38.73,8.88-50,23.89C116.73,48.88,98.65,40,78,40a62.07,62.07,0,0,0-62,62c0,70,103.79,126.66,108.21,129a8,8,0,0,0,7.58,0C136.21,228.66,240,172,240,102A62.07,62.07,0,0,0,178,40ZM128,214.8C109.74,204.16,32,155.69,32,102A46.06,46.06,0,0,1,78,56c19.45,0,35.78,10.36,42.6,27a8,8,0,0,0,14.8,0c6.82-16.67,23.15-27,42.6-27a46.06,46.06,0,0,1,46,46C224,155.61,146.24,204.15,128,214.8Z" }))],
		["fill", /* @__PURE__ */ import_react.createElement(import_react.Fragment, null, /* @__PURE__ */ import_react.createElement("path", { d: "M240,102c0,70-103.79,126.66-108.21,129a8,8,0,0,1-7.58,0C119.79,228.66,16,172,16,102A62.07,62.07,0,0,1,78,40c20.65,0,38.73,8.88,50,23.89C139.27,48.88,157.35,40,178,40A62.07,62.07,0,0,1,240,102Z" }))],
		["light", /* @__PURE__ */ import_react.createElement(import_react.Fragment, null, /* @__PURE__ */ import_react.createElement("path", { d: "M178,42c-21,0-39.26,9.47-50,25.34C117.26,51.47,99,42,78,42a60.07,60.07,0,0,0-60,60c0,29.2,18.2,59.59,54.1,90.31a334.68,334.68,0,0,0,53.06,37,6,6,0,0,0,5.68,0,334.68,334.68,0,0,0,53.06-37C219.8,161.59,238,131.2,238,102A60.07,60.07,0,0,0,178,42ZM128,217.11C111.59,207.64,30,157.72,30,102A48.05,48.05,0,0,1,78,54c20.28,0,37.31,10.83,44.45,28.27a6,6,0,0,0,11.1,0C140.69,64.83,157.72,54,178,54a48.05,48.05,0,0,1,48,48C226,157.72,144.41,207.64,128,217.11Z" }))],
		["regular", /* @__PURE__ */ import_react.createElement(import_react.Fragment, null, /* @__PURE__ */ import_react.createElement("path", { d: "M178,40c-20.65,0-38.73,8.88-50,23.89C116.73,48.88,98.65,40,78,40a62.07,62.07,0,0,0-62,62c0,70,103.79,126.66,108.21,129a8,8,0,0,0,7.58,0C136.21,228.66,240,172,240,102A62.07,62.07,0,0,0,178,40ZM128,214.8C109.74,204.16,32,155.69,32,102A46.06,46.06,0,0,1,78,56c19.45,0,35.78,10.36,42.6,27a8,8,0,0,0,14.8,0c6.82-16.67,23.15-27,42.6-27a46.06,46.06,0,0,1,46,46C224,155.61,146.24,204.15,128,214.8Z" }))],
		["thin", /* @__PURE__ */ import_react.createElement(import_react.Fragment, null, /* @__PURE__ */ import_react.createElement("path", { d: "M178,44c-21.44,0-39.92,10.19-50,27.07C117.92,54.19,99.44,44,78,44a58.07,58.07,0,0,0-58,58c0,28.59,18,58.47,53.4,88.79a333.81,333.81,0,0,0,52.7,36.73,4,4,0,0,0,3.8,0,333.81,333.81,0,0,0,52.7-36.73C218,160.47,236,130.59,236,102A58.07,58.07,0,0,0,178,44ZM128,219.42c-14-8-100-59.35-100-117.42A50.06,50.06,0,0,1,78,52c21.11,0,38.85,11.31,46.3,29.51a4,4,0,0,0,7.4,0C139.15,63.31,156.89,52,178,52a50.06,50.06,0,0,1,50,50C228,160,142,211.46,128,219.42Z" }))]
	]);
	var o$1 = (0, import_react.createContext)({
		color: "currentColor",
		size: "1em",
		weight: "regular",
		mirrored: !1
	});
	var p = import_react.forwardRef((s, a$1) => {
		const { alt: n, color: r$2, size: t, weight: o$2, mirrored: c, children: i, weights: m, ...x } = s, { color: d = "currentColor", size: l, weight: f = "regular", mirrored: g = !1, ...w } = import_react.useContext(o$1);
		return /* @__PURE__ */ import_react.createElement("svg", {
			ref: a$1,
			xmlns: "http://www.w3.org/2000/svg",
			width: t != null ? t : l,
			height: t != null ? t : l,
			fill: r$2 != null ? r$2 : d,
			viewBox: "0 0 256 256",
			transform: c || g ? "scale(-1, 1)" : void 0,
			...w,
			...x
		}, !!n && /* @__PURE__ */ import_react.createElement("title", null, n), i, m.get(o$2 != null ? o$2 : f));
	});
	p.displayName = "IconBase";
	var o = import_react.forwardRef((r$2, t) => /* @__PURE__ */ import_react.createElement(p, {
		ref: t,
		...r$2,
		weights: a
	}));
	o.displayName = "HeartIcon";
	var BASE_URL = "http://thoughtbase.localhost:3000";
	async function getWidgetIdeas(organizationId) {
		const res = await fetch(`${BASE_URL}/api/widget/ideas?organizationId=${organizationId}`, { mode: "cors" });
		if (!res.ok) {
			const text = await res.text();
			throw new Error(`Failed to fetch ideas: ${text}`);
		}
		return res.json();
	}
	async function createWidgetIdea(data) {
		const res = await fetch(`${BASE_URL}/api/widget/ideas`, {
			method: "POST",
			headers: { "Content-Type": "application/json" },
			body: JSON.stringify(data),
			mode: "cors",
			credentials: "include"
		});
		if (!res.ok) {
			const text = await res.text();
			throw new Error(`Failed to create idea: ${text}`);
		}
		return res.json();
	}
	function RoadmapView({ organizationId, ssoToken: ssoToken$1 }) {
		const { data: ideas } = useQuery({
			queryKey: ["widget-ideas", organizationId],
			queryFn: () => getWidgetIdeas(organizationId)
		});
		const inProgressIdeas = ideas?.filter((i) => i.status === "in_progress") || [];
		const plannedIdeas = ideas?.filter((i) => i.status === "planned") || [];
		const getIdeaUrl = (idea) => {
			const baseUrl = `http://thoughtbase.localhost:3000/org/${idea.organization?.slug || "unknown"}/${idea.id}`;
			if (ssoToken$1) return `${baseUrl}?sso_token=${encodeURIComponent(ssoToken$1)}`;
			return baseUrl;
		};
		return /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
			className: "flex flex-col overflow-hidden",
			children: [
				/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
					className: "border-b px-6 pb-6",
					children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)("h2", {
						className: "text-2xl font-bold",
						children: "Coming Soon"
					}), /* @__PURE__ */ (0, import_jsx_runtime.jsx)("p", {
						className: "text-muted-foreground",
						children: "See what we're working on"
					})]
				}),
				/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
					className: "flex-1 overflow-y-auto",
					children: [inProgressIdeas.length > 0 && /* @__PURE__ */ (0, import_jsx_runtime.jsx)("div", {
						className: "flex flex-1 flex-col gap-4 px-6 pt-6 pb-2",
						children: /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
							className: "flex w-full flex-col gap-2",
							children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)("span", {
								className: "text-muted-foreground mb-3 text-[10px] tracking-widest uppercase",
								children: "In progress"
							}), inProgressIdeas.map((idea, index$1) => /* @__PURE__ */ (0, import_jsx_runtime.jsx)("div", {
								className: "group relative w-full cursor-pointer",
								children: /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("a", {
									href: getIdeaUrl(idea),
									target: "_blank",
									rel: "noopener noreferrer",
									className: "flex w-full gap-3",
									children: [/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
										className: "flex flex-col",
										children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)("div", {
											className: "flex size-5 shrink-0 items-center justify-center rounded-full bg-purple-100 text-purple-500",
											children: /* @__PURE__ */ (0, import_jsx_runtime.jsx)(Clock8, { className: "size-3" })
										}), index$1 !== inProgressIdeas.length - 1 && /* @__PURE__ */ (0, import_jsx_runtime.jsx)("div", { className: "mt-2 ml-2.5 h-full w-px -translate-x-1/2 border-l border-dashed" })]
									}), /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
										className: "w-full flex-1 pb-5",
										children: [/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
											className: "justify flex items-center justify-between gap-2",
											children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)("h4", {
												className: "text-sm leading-none font-medium",
												children: idea.title
											}), /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
												className: "text-muted-foreground flex items-center gap-1",
												children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)(o, {
													weight: "bold",
													className: "size-3.5"
												}), /* @__PURE__ */ (0, import_jsx_runtime.jsx)("span", {
													className: "mt-0.5 text-xs",
													children: idea.reactionCount
												})]
											})]
										}), /* @__PURE__ */ (0, import_jsx_runtime.jsx)("p", {
											className: "text-muted-foreground mt-2 line-clamp-2 text-xs font-light",
											children: idea.description
										})]
									})]
								})
							}, idea.id))]
						})
					}), plannedIdeas.length > 0 && /* @__PURE__ */ (0, import_jsx_runtime.jsx)("div", {
						className: "flex flex-1 flex-col gap-4 border-t px-6 pt-6 pb-2",
						children: /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
							className: "flex w-full flex-col gap-2",
							children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)("span", {
								className: "text-muted-foreground mb-3 text-[10px] tracking-widest uppercase",
								children: "Planned"
							}), plannedIdeas.map((idea, index$1) => /* @__PURE__ */ (0, import_jsx_runtime.jsx)("div", {
								className: "group relative w-full cursor-pointer",
								children: /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("a", {
									href: getIdeaUrl(idea),
									target: "_blank",
									rel: "noopener noreferrer",
									className: "flex w-full gap-3",
									children: [/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
										className: "flex flex-col",
										children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)("div", {
											className: "flex size-5 shrink-0 items-center justify-center rounded-full bg-blue-100 text-blue-500",
											children: /* @__PURE__ */ (0, import_jsx_runtime.jsx)(Clock8, { className: "size-3" })
										}), index$1 !== plannedIdeas.length - 1 && /* @__PURE__ */ (0, import_jsx_runtime.jsx)("div", { className: "mt-2 ml-2.5 h-full w-px -translate-x-1/2 border-l border-dashed" })]
									}), /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
										className: "w-full flex-1 pb-5",
										children: [/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
											className: "justify flex items-center justify-between gap-2",
											children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)("h4", {
												className: "text-sm leading-none font-medium",
												children: idea.title
											}), /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
												className: "text-muted-foreground flex items-center gap-1",
												children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)(o, {
													weight: "bold",
													className: "size-3.5"
												}), /* @__PURE__ */ (0, import_jsx_runtime.jsx)("span", {
													className: "mt-0.5 text-xs",
													children: idea.reactionCount
												})]
											})]
										}), /* @__PURE__ */ (0, import_jsx_runtime.jsx)("p", {
											className: "text-muted-foreground mt-2 line-clamp-2 text-xs font-light",
											children: idea.description
										})]
									})]
								})
							}, idea.id))]
						})
					})]
				}),
				inProgressIdeas.length === 0 && plannedIdeas.length === 0 && /* @__PURE__ */ (0, import_jsx_runtime.jsx)("div", {
					className: "text-muted-foreground py-8 text-center text-sm",
					children: "Nothing on the roadmap yet."
				})
			]
		});
	}
	require_react_dom();
	function __insertCSS(code) {
		if (!code || typeof document == "undefined") return;
		let head = document.head || document.getElementsByTagName("head")[0];
		let style$1 = document.createElement("style");
		style$1.type = "text/css";
		head.appendChild(style$1);
		style$1.styleSheet ? style$1.styleSheet.cssText = code : style$1.appendChild(document.createTextNode(code));
	}
	Array(12).fill(0);
	var toastsCounter = 1;
	var Observer = class {
		constructor() {
			this.subscribe = (subscriber) => {
				this.subscribers.push(subscriber);
				return () => {
					const index$1 = this.subscribers.indexOf(subscriber);
					this.subscribers.splice(index$1, 1);
				};
			};
			this.publish = (data) => {
				this.subscribers.forEach((subscriber) => subscriber(data));
			};
			this.addToast = (data) => {
				this.publish(data);
				this.toasts = [...this.toasts, data];
			};
			this.create = (data) => {
				var _data_id;
				const { message, ...rest } = data;
				const id = typeof (data == null ? void 0 : data.id) === "number" || ((_data_id = data.id) == null ? void 0 : _data_id.length) > 0 ? data.id : toastsCounter++;
				const alreadyExists = this.toasts.find((toast$1) => {
					return toast$1.id === id;
				});
				const dismissible = data.dismissible === void 0 ? true : data.dismissible;
				if (this.dismissedToasts.has(id)) this.dismissedToasts.delete(id);
				if (alreadyExists) this.toasts = this.toasts.map((toast$1) => {
					if (toast$1.id === id) {
						this.publish({
							...toast$1,
							...data,
							id,
							title: message
						});
						return {
							...toast$1,
							...data,
							id,
							dismissible,
							title: message
						};
					}
					return toast$1;
				});
				else this.addToast({
					title: message,
					...rest,
					dismissible,
					id
				});
				return id;
			};
			this.dismiss = (id) => {
				if (id) {
					this.dismissedToasts.add(id);
					requestAnimationFrame(() => this.subscribers.forEach((subscriber) => subscriber({
						id,
						dismiss: true
					})));
				} else this.toasts.forEach((toast$1) => {
					this.subscribers.forEach((subscriber) => subscriber({
						id: toast$1.id,
						dismiss: true
					}));
				});
				return id;
			};
			this.message = (message, data) => {
				return this.create({
					...data,
					message
				});
			};
			this.error = (message, data) => {
				return this.create({
					...data,
					message,
					type: "error"
				});
			};
			this.success = (message, data) => {
				return this.create({
					...data,
					type: "success",
					message
				});
			};
			this.info = (message, data) => {
				return this.create({
					...data,
					type: "info",
					message
				});
			};
			this.warning = (message, data) => {
				return this.create({
					...data,
					type: "warning",
					message
				});
			};
			this.loading = (message, data) => {
				return this.create({
					...data,
					type: "loading",
					message
				});
			};
			this.promise = (promise, data) => {
				if (!data) return;
				let id = void 0;
				if (data.loading !== void 0) id = this.create({
					...data,
					promise,
					type: "loading",
					message: data.loading,
					description: typeof data.description !== "function" ? data.description : void 0
				});
				const p$1 = Promise.resolve(promise instanceof Function ? promise() : promise);
				let shouldDismiss = id !== void 0;
				let result;
				const originalPromise = p$1.then(async (response) => {
					result = ["resolve", response];
					if (import_react.isValidElement(response)) {
						shouldDismiss = false;
						this.create({
							id,
							type: "default",
							message: response
						});
					} else if (isHttpResponse(response) && !response.ok) {
						shouldDismiss = false;
						const promiseData = typeof data.error === "function" ? await data.error(`HTTP error! status: ${response.status}`) : data.error;
						const description = typeof data.description === "function" ? await data.description(`HTTP error! status: ${response.status}`) : data.description;
						const toastSettings = typeof promiseData === "object" && !import_react.isValidElement(promiseData) ? promiseData : { message: promiseData };
						this.create({
							id,
							type: "error",
							description,
							...toastSettings
						});
					} else if (response instanceof Error) {
						shouldDismiss = false;
						const promiseData = typeof data.error === "function" ? await data.error(response) : data.error;
						const description = typeof data.description === "function" ? await data.description(response) : data.description;
						const toastSettings = typeof promiseData === "object" && !import_react.isValidElement(promiseData) ? promiseData : { message: promiseData };
						this.create({
							id,
							type: "error",
							description,
							...toastSettings
						});
					} else if (data.success !== void 0) {
						shouldDismiss = false;
						const promiseData = typeof data.success === "function" ? await data.success(response) : data.success;
						const description = typeof data.description === "function" ? await data.description(response) : data.description;
						const toastSettings = typeof promiseData === "object" && !import_react.isValidElement(promiseData) ? promiseData : { message: promiseData };
						this.create({
							id,
							type: "success",
							description,
							...toastSettings
						});
					}
				}).catch(async (error) => {
					result = ["reject", error];
					if (data.error !== void 0) {
						shouldDismiss = false;
						const promiseData = typeof data.error === "function" ? await data.error(error) : data.error;
						const description = typeof data.description === "function" ? await data.description(error) : data.description;
						const toastSettings = typeof promiseData === "object" && !import_react.isValidElement(promiseData) ? promiseData : { message: promiseData };
						this.create({
							id,
							type: "error",
							description,
							...toastSettings
						});
					}
				}).finally(() => {
					if (shouldDismiss) {
						this.dismiss(id);
						id = void 0;
					}
					data.finally == null || data.finally.call(data);
				});
				const unwrap = () => new Promise((resolve, reject) => originalPromise.then(() => result[0] === "reject" ? reject(result[1]) : resolve(result[1])).catch(reject));
				if (typeof id !== "string" && typeof id !== "number") return { unwrap };
				else return Object.assign(id, { unwrap });
			};
			this.custom = (jsx$3, data) => {
				const id = (data == null ? void 0 : data.id) || toastsCounter++;
				this.create({
					jsx: jsx$3(id),
					id,
					...data
				});
				return id;
			};
			this.getActiveToasts = () => {
				return this.toasts.filter((toast$1) => !this.dismissedToasts.has(toast$1.id));
			};
			this.subscribers = [];
			this.toasts = [];
			this.dismissedToasts = /* @__PURE__ */ new Set();
		}
	};
	var ToastState = new Observer();
	var toastFunction = (message, data) => {
		const id = (data == null ? void 0 : data.id) || toastsCounter++;
		ToastState.addToast({
			title: message,
			...data,
			id
		});
		return id;
	};
	var isHttpResponse = (data) => {
		return data && typeof data === "object" && "ok" in data && typeof data.ok === "boolean" && "status" in data && typeof data.status === "number";
	};
	var basicToast = toastFunction;
	var getHistory = () => ToastState.toasts;
	var getToasts = () => ToastState.getActiveToasts();
	var toast = Object.assign(basicToast, {
		success: ToastState.success,
		info: ToastState.info,
		warning: ToastState.warning,
		error: ToastState.error,
		custom: ToastState.custom,
		message: ToastState.message,
		promise: ToastState.promise,
		dismiss: ToastState.dismiss,
		loading: ToastState.loading
	}, {
		getHistory,
		getToasts
	});
	__insertCSS("[data-sonner-toaster][dir=ltr],html[dir=ltr]{--toast-icon-margin-start:-3px;--toast-icon-margin-end:4px;--toast-svg-margin-start:-1px;--toast-svg-margin-end:0px;--toast-button-margin-start:auto;--toast-button-margin-end:0;--toast-close-button-start:0;--toast-close-button-end:unset;--toast-close-button-transform:translate(-35%, -35%)}[data-sonner-toaster][dir=rtl],html[dir=rtl]{--toast-icon-margin-start:4px;--toast-icon-margin-end:-3px;--toast-svg-margin-start:0px;--toast-svg-margin-end:-1px;--toast-button-margin-start:0;--toast-button-margin-end:auto;--toast-close-button-start:unset;--toast-close-button-end:0;--toast-close-button-transform:translate(35%, -35%)}[data-sonner-toaster]{position:fixed;width:var(--width);font-family:ui-sans-serif,system-ui,-apple-system,BlinkMacSystemFont,Segoe UI,Roboto,Helvetica Neue,Arial,Noto Sans,sans-serif,Apple Color Emoji,Segoe UI Emoji,Segoe UI Symbol,Noto Color Emoji;--gray1:hsl(0, 0%, 99%);--gray2:hsl(0, 0%, 97.3%);--gray3:hsl(0, 0%, 95.1%);--gray4:hsl(0, 0%, 93%);--gray5:hsl(0, 0%, 90.9%);--gray6:hsl(0, 0%, 88.7%);--gray7:hsl(0, 0%, 85.8%);--gray8:hsl(0, 0%, 78%);--gray9:hsl(0, 0%, 56.1%);--gray10:hsl(0, 0%, 52.3%);--gray11:hsl(0, 0%, 43.5%);--gray12:hsl(0, 0%, 9%);--border-radius:8px;box-sizing:border-box;padding:0;margin:0;list-style:none;outline:0;z-index:999999999;transition:transform .4s ease}@media (hover:none) and (pointer:coarse){[data-sonner-toaster][data-lifted=true]{transform:none}}[data-sonner-toaster][data-x-position=right]{right:var(--offset-right)}[data-sonner-toaster][data-x-position=left]{left:var(--offset-left)}[data-sonner-toaster][data-x-position=center]{left:50%;transform:translateX(-50%)}[data-sonner-toaster][data-y-position=top]{top:var(--offset-top)}[data-sonner-toaster][data-y-position=bottom]{bottom:var(--offset-bottom)}[data-sonner-toast]{--y:translateY(100%);--lift-amount:calc(var(--lift) * var(--gap));z-index:var(--z-index);position:absolute;opacity:0;transform:var(--y);touch-action:none;transition:transform .4s,opacity .4s,height .4s,box-shadow .2s;box-sizing:border-box;outline:0;overflow-wrap:anywhere}[data-sonner-toast][data-styled=true]{padding:16px;background:var(--normal-bg);border:1px solid var(--normal-border);color:var(--normal-text);border-radius:var(--border-radius);box-shadow:0 4px 12px rgba(0,0,0,.1);width:var(--width);font-size:13px;display:flex;align-items:center;gap:6px}[data-sonner-toast]:focus-visible{box-shadow:0 4px 12px rgba(0,0,0,.1),0 0 0 2px rgba(0,0,0,.2)}[data-sonner-toast][data-y-position=top]{top:0;--y:translateY(-100%);--lift:1;--lift-amount:calc(1 * var(--gap))}[data-sonner-toast][data-y-position=bottom]{bottom:0;--y:translateY(100%);--lift:-1;--lift-amount:calc(var(--lift) * var(--gap))}[data-sonner-toast][data-styled=true] [data-description]{font-weight:400;line-height:1.4;color:#3f3f3f}[data-rich-colors=true][data-sonner-toast][data-styled=true] [data-description]{color:inherit}[data-sonner-toaster][data-sonner-theme=dark] [data-description]{color:#e8e8e8}[data-sonner-toast][data-styled=true] [data-title]{font-weight:500;line-height:1.5;color:inherit}[data-sonner-toast][data-styled=true] [data-icon]{display:flex;height:16px;width:16px;position:relative;justify-content:flex-start;align-items:center;flex-shrink:0;margin-left:var(--toast-icon-margin-start);margin-right:var(--toast-icon-margin-end)}[data-sonner-toast][data-promise=true] [data-icon]>svg{opacity:0;transform:scale(.8);transform-origin:center;animation:sonner-fade-in .3s ease forwards}[data-sonner-toast][data-styled=true] [data-icon]>*{flex-shrink:0}[data-sonner-toast][data-styled=true] [data-icon] svg{margin-left:var(--toast-svg-margin-start);margin-right:var(--toast-svg-margin-end)}[data-sonner-toast][data-styled=true] [data-content]{display:flex;flex-direction:column;gap:2px}[data-sonner-toast][data-styled=true] [data-button]{border-radius:4px;padding-left:8px;padding-right:8px;height:24px;font-size:12px;color:var(--normal-bg);background:var(--normal-text);margin-left:var(--toast-button-margin-start);margin-right:var(--toast-button-margin-end);border:none;font-weight:500;cursor:pointer;outline:0;display:flex;align-items:center;flex-shrink:0;transition:opacity .4s,box-shadow .2s}[data-sonner-toast][data-styled=true] [data-button]:focus-visible{box-shadow:0 0 0 2px rgba(0,0,0,.4)}[data-sonner-toast][data-styled=true] [data-button]:first-of-type{margin-left:var(--toast-button-margin-start);margin-right:var(--toast-button-margin-end)}[data-sonner-toast][data-styled=true] [data-cancel]{color:var(--normal-text);background:rgba(0,0,0,.08)}[data-sonner-toaster][data-sonner-theme=dark] [data-sonner-toast][data-styled=true] [data-cancel]{background:rgba(255,255,255,.3)}[data-sonner-toast][data-styled=true] [data-close-button]{position:absolute;left:var(--toast-close-button-start);right:var(--toast-close-button-end);top:0;height:20px;width:20px;display:flex;justify-content:center;align-items:center;padding:0;color:var(--gray12);background:var(--normal-bg);border:1px solid var(--gray4);transform:var(--toast-close-button-transform);border-radius:50%;cursor:pointer;z-index:1;transition:opacity .1s,background .2s,border-color .2s}[data-sonner-toast][data-styled=true] [data-close-button]:focus-visible{box-shadow:0 4px 12px rgba(0,0,0,.1),0 0 0 2px rgba(0,0,0,.2)}[data-sonner-toast][data-styled=true] [data-disabled=true]{cursor:not-allowed}[data-sonner-toast][data-styled=true]:hover [data-close-button]:hover{background:var(--gray2);border-color:var(--gray5)}[data-sonner-toast][data-swiping=true]::before{content:'';position:absolute;left:-100%;right:-100%;height:100%;z-index:-1}[data-sonner-toast][data-y-position=top][data-swiping=true]::before{bottom:50%;transform:scaleY(3) translateY(50%)}[data-sonner-toast][data-y-position=bottom][data-swiping=true]::before{top:50%;transform:scaleY(3) translateY(-50%)}[data-sonner-toast][data-swiping=false][data-removed=true]::before{content:'';position:absolute;inset:0;transform:scaleY(2)}[data-sonner-toast][data-expanded=true]::after{content:'';position:absolute;left:0;height:calc(var(--gap) + 1px);bottom:100%;width:100%}[data-sonner-toast][data-mounted=true]{--y:translateY(0);opacity:1}[data-sonner-toast][data-expanded=false][data-front=false]{--scale:var(--toasts-before) * 0.05 + 1;--y:translateY(calc(var(--lift-amount) * var(--toasts-before))) scale(calc(-1 * var(--scale)));height:var(--front-toast-height)}[data-sonner-toast]>*{transition:opacity .4s}[data-sonner-toast][data-x-position=right]{right:0}[data-sonner-toast][data-x-position=left]{left:0}[data-sonner-toast][data-expanded=false][data-front=false][data-styled=true]>*{opacity:0}[data-sonner-toast][data-visible=false]{opacity:0;pointer-events:none}[data-sonner-toast][data-mounted=true][data-expanded=true]{--y:translateY(calc(var(--lift) * var(--offset)));height:var(--initial-height)}[data-sonner-toast][data-removed=true][data-front=true][data-swipe-out=false]{--y:translateY(calc(var(--lift) * -100%));opacity:0}[data-sonner-toast][data-removed=true][data-front=false][data-swipe-out=false][data-expanded=true]{--y:translateY(calc(var(--lift) * var(--offset) + var(--lift) * -100%));opacity:0}[data-sonner-toast][data-removed=true][data-front=false][data-swipe-out=false][data-expanded=false]{--y:translateY(40%);opacity:0;transition:transform .5s,opacity .2s}[data-sonner-toast][data-removed=true][data-front=false]::before{height:calc(var(--initial-height) + 20%)}[data-sonner-toast][data-swiping=true]{transform:var(--y) translateY(var(--swipe-amount-y,0)) translateX(var(--swipe-amount-x,0));transition:none}[data-sonner-toast][data-swiped=true]{user-select:none}[data-sonner-toast][data-swipe-out=true][data-y-position=bottom],[data-sonner-toast][data-swipe-out=true][data-y-position=top]{animation-duration:.2s;animation-timing-function:ease-out;animation-fill-mode:forwards}[data-sonner-toast][data-swipe-out=true][data-swipe-direction=left]{animation-name:swipe-out-left}[data-sonner-toast][data-swipe-out=true][data-swipe-direction=right]{animation-name:swipe-out-right}[data-sonner-toast][data-swipe-out=true][data-swipe-direction=up]{animation-name:swipe-out-up}[data-sonner-toast][data-swipe-out=true][data-swipe-direction=down]{animation-name:swipe-out-down}@keyframes swipe-out-left{from{transform:var(--y) translateX(var(--swipe-amount-x));opacity:1}to{transform:var(--y) translateX(calc(var(--swipe-amount-x) - 100%));opacity:0}}@keyframes swipe-out-right{from{transform:var(--y) translateX(var(--swipe-amount-x));opacity:1}to{transform:var(--y) translateX(calc(var(--swipe-amount-x) + 100%));opacity:0}}@keyframes swipe-out-up{from{transform:var(--y) translateY(var(--swipe-amount-y));opacity:1}to{transform:var(--y) translateY(calc(var(--swipe-amount-y) - 100%));opacity:0}}@keyframes swipe-out-down{from{transform:var(--y) translateY(var(--swipe-amount-y));opacity:1}to{transform:var(--y) translateY(calc(var(--swipe-amount-y) + 100%));opacity:0}}@media (max-width:600px){[data-sonner-toaster]{position:fixed;right:var(--mobile-offset-right);left:var(--mobile-offset-left);width:100%}[data-sonner-toaster][dir=rtl]{left:calc(var(--mobile-offset-left) * -1)}[data-sonner-toaster] [data-sonner-toast]{left:0;right:0;width:calc(100% - var(--mobile-offset-left) * 2)}[data-sonner-toaster][data-x-position=left]{left:var(--mobile-offset-left)}[data-sonner-toaster][data-y-position=bottom]{bottom:var(--mobile-offset-bottom)}[data-sonner-toaster][data-y-position=top]{top:var(--mobile-offset-top)}[data-sonner-toaster][data-x-position=center]{left:var(--mobile-offset-left);right:var(--mobile-offset-right);transform:none}}[data-sonner-toaster][data-sonner-theme=light]{--normal-bg:#fff;--normal-border:var(--gray4);--normal-text:var(--gray12);--success-bg:hsl(143, 85%, 96%);--success-border:hsl(145, 92%, 87%);--success-text:hsl(140, 100%, 27%);--info-bg:hsl(208, 100%, 97%);--info-border:hsl(221, 91%, 93%);--info-text:hsl(210, 92%, 45%);--warning-bg:hsl(49, 100%, 97%);--warning-border:hsl(49, 91%, 84%);--warning-text:hsl(31, 92%, 45%);--error-bg:hsl(359, 100%, 97%);--error-border:hsl(359, 100%, 94%);--error-text:hsl(360, 100%, 45%)}[data-sonner-toaster][data-sonner-theme=light] [data-sonner-toast][data-invert=true]{--normal-bg:#000;--normal-border:hsl(0, 0%, 20%);--normal-text:var(--gray1)}[data-sonner-toaster][data-sonner-theme=dark] [data-sonner-toast][data-invert=true]{--normal-bg:#fff;--normal-border:var(--gray3);--normal-text:var(--gray12)}[data-sonner-toaster][data-sonner-theme=dark]{--normal-bg:#000;--normal-bg-hover:hsl(0, 0%, 12%);--normal-border:hsl(0, 0%, 20%);--normal-border-hover:hsl(0, 0%, 25%);--normal-text:var(--gray1);--success-bg:hsl(150, 100%, 6%);--success-border:hsl(147, 100%, 12%);--success-text:hsl(150, 86%, 65%);--info-bg:hsl(215, 100%, 6%);--info-border:hsl(223, 43%, 17%);--info-text:hsl(216, 87%, 65%);--warning-bg:hsl(64, 100%, 6%);--warning-border:hsl(60, 100%, 9%);--warning-text:hsl(46, 87%, 65%);--error-bg:hsl(358, 76%, 10%);--error-border:hsl(357, 89%, 16%);--error-text:hsl(358, 100%, 81%)}[data-sonner-toaster][data-sonner-theme=dark] [data-sonner-toast] [data-close-button]{background:var(--normal-bg);border-color:var(--normal-border);color:var(--normal-text)}[data-sonner-toaster][data-sonner-theme=dark] [data-sonner-toast] [data-close-button]:hover{background:var(--normal-bg-hover);border-color:var(--normal-border-hover)}[data-rich-colors=true][data-sonner-toast][data-type=success]{background:var(--success-bg);border-color:var(--success-border);color:var(--success-text)}[data-rich-colors=true][data-sonner-toast][data-type=success] [data-close-button]{background:var(--success-bg);border-color:var(--success-border);color:var(--success-text)}[data-rich-colors=true][data-sonner-toast][data-type=info]{background:var(--info-bg);border-color:var(--info-border);color:var(--info-text)}[data-rich-colors=true][data-sonner-toast][data-type=info] [data-close-button]{background:var(--info-bg);border-color:var(--info-border);color:var(--info-text)}[data-rich-colors=true][data-sonner-toast][data-type=warning]{background:var(--warning-bg);border-color:var(--warning-border);color:var(--warning-text)}[data-rich-colors=true][data-sonner-toast][data-type=warning] [data-close-button]{background:var(--warning-bg);border-color:var(--warning-border);color:var(--warning-text)}[data-rich-colors=true][data-sonner-toast][data-type=error]{background:var(--error-bg);border-color:var(--error-border);color:var(--error-text)}[data-rich-colors=true][data-sonner-toast][data-type=error] [data-close-button]{background:var(--error-bg);border-color:var(--error-border);color:var(--error-text)}.sonner-loading-wrapper{--size:16px;height:var(--size);width:var(--size);position:absolute;inset:0;z-index:10}.sonner-loading-wrapper[data-visible=false]{transform-origin:center;animation:sonner-fade-out .2s ease forwards}.sonner-spinner{position:relative;top:50%;left:50%;height:var(--size);width:var(--size)}.sonner-loading-bar{animation:sonner-spin 1.2s linear infinite;background:var(--gray11);border-radius:6px;height:8%;left:-10%;position:absolute;top:-3.9%;width:24%}.sonner-loading-bar:first-child{animation-delay:-1.2s;transform:rotate(.0001deg) translate(146%)}.sonner-loading-bar:nth-child(2){animation-delay:-1.1s;transform:rotate(30deg) translate(146%)}.sonner-loading-bar:nth-child(3){animation-delay:-1s;transform:rotate(60deg) translate(146%)}.sonner-loading-bar:nth-child(4){animation-delay:-.9s;transform:rotate(90deg) translate(146%)}.sonner-loading-bar:nth-child(5){animation-delay:-.8s;transform:rotate(120deg) translate(146%)}.sonner-loading-bar:nth-child(6){animation-delay:-.7s;transform:rotate(150deg) translate(146%)}.sonner-loading-bar:nth-child(7){animation-delay:-.6s;transform:rotate(180deg) translate(146%)}.sonner-loading-bar:nth-child(8){animation-delay:-.5s;transform:rotate(210deg) translate(146%)}.sonner-loading-bar:nth-child(9){animation-delay:-.4s;transform:rotate(240deg) translate(146%)}.sonner-loading-bar:nth-child(10){animation-delay:-.3s;transform:rotate(270deg) translate(146%)}.sonner-loading-bar:nth-child(11){animation-delay:-.2s;transform:rotate(300deg) translate(146%)}.sonner-loading-bar:nth-child(12){animation-delay:-.1s;transform:rotate(330deg) translate(146%)}@keyframes sonner-fade-in{0%{opacity:0;transform:scale(.8)}100%{opacity:1;transform:scale(1)}}@keyframes sonner-fade-out{0%{opacity:1;transform:scale(1)}100%{opacity:0;transform:scale(.8)}}@keyframes sonner-spin{0%{opacity:1}100%{opacity:.15}}@media (prefers-reduced-motion){.sonner-loading-bar,[data-sonner-toast],[data-sonner-toast]>*{transition:none!important;animation:none!important}}.sonner-loader{position:absolute;top:50%;left:50%;transform:translate(-50%,-50%);transform-origin:center;transition:opacity .2s,transform .2s}.sonner-loader[data-visible=false]{opacity:0;transform:scale(.8) translate(-50%,-50%)}");
	function setRef(ref, value) {
		if (typeof ref === "function") return ref(value);
		else if (ref !== null && ref !== void 0) ref.current = value;
	}
	function composeRefs(...refs) {
		return (node) => {
			let hasCleanup = false;
			const cleanups = refs.map((ref) => {
				const cleanup = setRef(ref, node);
				if (!hasCleanup && typeof cleanup == "function") hasCleanup = true;
				return cleanup;
			});
			if (hasCleanup) return () => {
				for (let i = 0; i < cleanups.length; i++) {
					const cleanup = cleanups[i];
					if (typeof cleanup == "function") cleanup();
					else setRef(refs[i], null);
				}
			};
		};
	}
	var REACT_LAZY_TYPE = Symbol.for("react.lazy");
	var use = import_react[" use ".trim().toString()];
	function isPromiseLike(value) {
		return typeof value === "object" && value !== null && "then" in value;
	}
	function isLazyComponent(element) {
		return element != null && typeof element === "object" && "$$typeof" in element && element.$$typeof === REACT_LAZY_TYPE && "_payload" in element && isPromiseLike(element._payload);
	}
	/* @__NO_SIDE_EFFECTS__ */
	function createSlot(ownerName) {
		const SlotClone = /* @__PURE__ */ createSlotClone(ownerName);
		const Slot2 = import_react.forwardRef((props, forwardedRef) => {
			let { children, ...slotProps } = props;
			if (isLazyComponent(children) && typeof use === "function") children = use(children._payload);
			const childrenArray = import_react.Children.toArray(children);
			const slottable = childrenArray.find(isSlottable);
			if (slottable) {
				const newElement = slottable.props.children;
				const newChildren = childrenArray.map((child) => {
					if (child === slottable) {
						if (import_react.Children.count(newElement) > 1) return import_react.Children.only(null);
						return import_react.isValidElement(newElement) ? newElement.props.children : null;
					} else return child;
				});
				return /* @__PURE__ */ (0, import_jsx_runtime.jsx)(SlotClone, {
					...slotProps,
					ref: forwardedRef,
					children: import_react.isValidElement(newElement) ? import_react.cloneElement(newElement, void 0, newChildren) : null
				});
			}
			return /* @__PURE__ */ (0, import_jsx_runtime.jsx)(SlotClone, {
				...slotProps,
				ref: forwardedRef,
				children
			});
		});
		Slot2.displayName = `${ownerName}.Slot`;
		return Slot2;
	}
	var Slot = /* @__PURE__ */ createSlot("Slot");
	/* @__NO_SIDE_EFFECTS__ */
	function createSlotClone(ownerName) {
		const SlotClone = import_react.forwardRef((props, forwardedRef) => {
			let { children, ...slotProps } = props;
			if (isLazyComponent(children) && typeof use === "function") children = use(children._payload);
			if (import_react.isValidElement(children)) {
				const childrenRef = getElementRef(children);
				const props2 = mergeProps(slotProps, children.props);
				if (children.type !== import_react.Fragment) props2.ref = forwardedRef ? composeRefs(forwardedRef, childrenRef) : childrenRef;
				return import_react.cloneElement(children, props2);
			}
			return import_react.Children.count(children) > 1 ? import_react.Children.only(null) : null;
		});
		SlotClone.displayName = `${ownerName}.SlotClone`;
		return SlotClone;
	}
	var SLOTTABLE_IDENTIFIER = Symbol("radix.slottable");
	function isSlottable(child) {
		return import_react.isValidElement(child) && typeof child.type === "function" && "__radixId" in child.type && child.type.__radixId === SLOTTABLE_IDENTIFIER;
	}
	function mergeProps(slotProps, childProps) {
		const overrideProps = { ...childProps };
		for (const propName in childProps) {
			const slotPropValue = slotProps[propName];
			const childPropValue = childProps[propName];
			if (/^on[A-Z]/.test(propName)) {
				if (slotPropValue && childPropValue) overrideProps[propName] = (...args) => {
					const result = childPropValue(...args);
					slotPropValue(...args);
					return result;
				};
				else if (slotPropValue) overrideProps[propName] = slotPropValue;
			} else if (propName === "style") overrideProps[propName] = {
				...slotPropValue,
				...childPropValue
			};
			else if (propName === "className") overrideProps[propName] = [slotPropValue, childPropValue].filter(Boolean).join(" ");
		}
		return {
			...slotProps,
			...overrideProps
		};
	}
	function getElementRef(element) {
		let getter = Object.getOwnPropertyDescriptor(element.props, "ref")?.get;
		let mayWarn = getter && "isReactWarning" in getter && getter.isReactWarning;
		if (mayWarn) return element.ref;
		getter = Object.getOwnPropertyDescriptor(element, "ref")?.get;
		mayWarn = getter && "isReactWarning" in getter && getter.isReactWarning;
		if (mayWarn) return element.props.ref;
		return element.props.ref || element.ref;
	}
	function r(e) {
		var t, f, n = "";
		if ("string" == typeof e || "number" == typeof e) n += e;
		else if ("object" == typeof e) if (Array.isArray(e)) {
			var o$2 = e.length;
			for (t = 0; t < o$2; t++) e[t] && (f = r(e[t])) && (n && (n += " "), n += f);
		} else for (f in e) e[f] && (n && (n += " "), n += f);
		return n;
	}
	function clsx() {
		for (var e, t, f = 0, n = "", o$2 = arguments.length; f < o$2; f++) (e = arguments[f]) && (t = r(e)) && (n && (n += " "), n += t);
		return n;
	}
	var falsyToString = (value) => typeof value === "boolean" ? `${value}` : value === 0 ? "0" : value;
	const cx = clsx;
	const cva = (base, config) => (props) => {
		var _config_compoundVariants;
		if ((config === null || config === void 0 ? void 0 : config.variants) == null) return cx(base, props === null || props === void 0 ? void 0 : props.class, props === null || props === void 0 ? void 0 : props.className);
		const { variants, defaultVariants } = config;
		const getVariantClassNames = Object.keys(variants).map((variant) => {
			const variantProp = props === null || props === void 0 ? void 0 : props[variant];
			const defaultVariantProp = defaultVariants === null || defaultVariants === void 0 ? void 0 : defaultVariants[variant];
			if (variantProp === null) return null;
			const variantKey = falsyToString(variantProp) || falsyToString(defaultVariantProp);
			return variants[variant][variantKey];
		});
		const propsWithoutUndefined = props && Object.entries(props).reduce((acc, param) => {
			let [key, value] = param;
			if (value === void 0) return acc;
			acc[key] = value;
			return acc;
		}, {});
		return cx(base, getVariantClassNames, config === null || config === void 0 ? void 0 : (_config_compoundVariants = config.compoundVariants) === null || _config_compoundVariants === void 0 ? void 0 : _config_compoundVariants.reduce((acc, param) => {
			let { class: cvClass, className: cvClassName, ...compoundVariantOptions } = param;
			return Object.entries(compoundVariantOptions).every((param$1) => {
				let [key, value] = param$1;
				return Array.isArray(value) ? value.includes({
					...defaultVariants,
					...propsWithoutUndefined
				}[key]) : {
					...defaultVariants,
					...propsWithoutUndefined
				}[key] === value;
			}) ? [
				...acc,
				cvClass,
				cvClassName
			] : acc;
		}, []), props === null || props === void 0 ? void 0 : props.class, props === null || props === void 0 ? void 0 : props.className);
	};
	var concatArrays = (array1, array2) => {
		const combinedArray = new Array(array1.length + array2.length);
		for (let i = 0; i < array1.length; i++) combinedArray[i] = array1[i];
		for (let i = 0; i < array2.length; i++) combinedArray[array1.length + i] = array2[i];
		return combinedArray;
	};
	var createClassValidatorObject = (classGroupId, validator) => ({
		classGroupId,
		validator
	});
	var createClassPartObject = (nextPart = /* @__PURE__ */ new Map(), validators = null, classGroupId) => ({
		nextPart,
		validators,
		classGroupId
	});
	var CLASS_PART_SEPARATOR = "-";
	var EMPTY_CONFLICTS = [];
	var ARBITRARY_PROPERTY_PREFIX = "arbitrary..";
	var createClassGroupUtils = (config) => {
		const classMap = createClassMap(config);
		const { conflictingClassGroups, conflictingClassGroupModifiers } = config;
		const getClassGroupId = (className) => {
			if (className.startsWith("[") && className.endsWith("]")) return getGroupIdForArbitraryProperty(className);
			const classParts = className.split(CLASS_PART_SEPARATOR);
			return getGroupRecursive(classParts, classParts[0] === "" && classParts.length > 1 ? 1 : 0, classMap);
		};
		const getConflictingClassGroupIds = (classGroupId, hasPostfixModifier) => {
			if (hasPostfixModifier) {
				const modifierConflicts = conflictingClassGroupModifiers[classGroupId];
				const baseConflicts = conflictingClassGroups[classGroupId];
				if (modifierConflicts) {
					if (baseConflicts) return concatArrays(baseConflicts, modifierConflicts);
					return modifierConflicts;
				}
				return baseConflicts || EMPTY_CONFLICTS;
			}
			return conflictingClassGroups[classGroupId] || EMPTY_CONFLICTS;
		};
		return {
			getClassGroupId,
			getConflictingClassGroupIds
		};
	};
	var getGroupRecursive = (classParts, startIndex, classPartObject) => {
		if (classParts.length - startIndex === 0) return classPartObject.classGroupId;
		const currentClassPart = classParts[startIndex];
		const nextClassPartObject = classPartObject.nextPart.get(currentClassPart);
		if (nextClassPartObject) {
			const result = getGroupRecursive(classParts, startIndex + 1, nextClassPartObject);
			if (result) return result;
		}
		const validators = classPartObject.validators;
		if (validators === null) return;
		const classRest = startIndex === 0 ? classParts.join(CLASS_PART_SEPARATOR) : classParts.slice(startIndex).join(CLASS_PART_SEPARATOR);
		const validatorsLength = validators.length;
		for (let i = 0; i < validatorsLength; i++) {
			const validatorObj = validators[i];
			if (validatorObj.validator(classRest)) return validatorObj.classGroupId;
		}
	};
	var getGroupIdForArbitraryProperty = (className) => className.slice(1, -1).indexOf(":") === -1 ? void 0 : (() => {
		const content = className.slice(1, -1);
		const colonIndex = content.indexOf(":");
		const property = content.slice(0, colonIndex);
		return property ? ARBITRARY_PROPERTY_PREFIX + property : void 0;
	})();
	var createClassMap = (config) => {
		const { theme, classGroups } = config;
		return processClassGroups(classGroups, theme);
	};
	var processClassGroups = (classGroups, theme) => {
		const classMap = createClassPartObject();
		for (const classGroupId in classGroups) {
			const group = classGroups[classGroupId];
			processClassesRecursively(group, classMap, classGroupId, theme);
		}
		return classMap;
	};
	var processClassesRecursively = (classGroup, classPartObject, classGroupId, theme) => {
		const len = classGroup.length;
		for (let i = 0; i < len; i++) {
			const classDefinition = classGroup[i];
			processClassDefinition(classDefinition, classPartObject, classGroupId, theme);
		}
	};
	var processClassDefinition = (classDefinition, classPartObject, classGroupId, theme) => {
		if (typeof classDefinition === "string") {
			processStringDefinition(classDefinition, classPartObject, classGroupId);
			return;
		}
		if (typeof classDefinition === "function") {
			processFunctionDefinition(classDefinition, classPartObject, classGroupId, theme);
			return;
		}
		processObjectDefinition(classDefinition, classPartObject, classGroupId, theme);
	};
	var processStringDefinition = (classDefinition, classPartObject, classGroupId) => {
		const classPartObjectToEdit = classDefinition === "" ? classPartObject : getPart(classPartObject, classDefinition);
		classPartObjectToEdit.classGroupId = classGroupId;
	};
	var processFunctionDefinition = (classDefinition, classPartObject, classGroupId, theme) => {
		if (isThemeGetter(classDefinition)) {
			processClassesRecursively(classDefinition(theme), classPartObject, classGroupId, theme);
			return;
		}
		if (classPartObject.validators === null) classPartObject.validators = [];
		classPartObject.validators.push(createClassValidatorObject(classGroupId, classDefinition));
	};
	var processObjectDefinition = (classDefinition, classPartObject, classGroupId, theme) => {
		const entries = Object.entries(classDefinition);
		const len = entries.length;
		for (let i = 0; i < len; i++) {
			const [key, value] = entries[i];
			processClassesRecursively(value, getPart(classPartObject, key), classGroupId, theme);
		}
	};
	var getPart = (classPartObject, path) => {
		let current = classPartObject;
		const parts = path.split(CLASS_PART_SEPARATOR);
		const len = parts.length;
		for (let i = 0; i < len; i++) {
			const part = parts[i];
			let next = current.nextPart.get(part);
			if (!next) {
				next = createClassPartObject();
				current.nextPart.set(part, next);
			}
			current = next;
		}
		return current;
	};
	var isThemeGetter = (func) => "isThemeGetter" in func && func.isThemeGetter === true;
	var createLruCache = (maxCacheSize) => {
		if (maxCacheSize < 1) return {
			get: () => void 0,
			set: () => {}
		};
		let cacheSize = 0;
		let cache = Object.create(null);
		let previousCache = Object.create(null);
		const update = (key, value) => {
			cache[key] = value;
			cacheSize++;
			if (cacheSize > maxCacheSize) {
				cacheSize = 0;
				previousCache = cache;
				cache = Object.create(null);
			}
		};
		return {
			get(key) {
				let value = cache[key];
				if (value !== void 0) return value;
				if ((value = previousCache[key]) !== void 0) {
					update(key, value);
					return value;
				}
			},
			set(key, value) {
				if (key in cache) cache[key] = value;
				else update(key, value);
			}
		};
	};
	var IMPORTANT_MODIFIER = "!";
	var MODIFIER_SEPARATOR = ":";
	var EMPTY_MODIFIERS = [];
	var createResultObject = (modifiers, hasImportantModifier, baseClassName, maybePostfixModifierPosition, isExternal) => ({
		modifiers,
		hasImportantModifier,
		baseClassName,
		maybePostfixModifierPosition,
		isExternal
	});
	var createParseClassName = (config) => {
		const { prefix: prefix$1, experimentalParseClassName } = config;
		let parseClassName = (className) => {
			const modifiers = [];
			let bracketDepth = 0;
			let parenDepth = 0;
			let modifierStart = 0;
			let postfixModifierPosition;
			const len = className.length;
			for (let index$1 = 0; index$1 < len; index$1++) {
				const currentCharacter = className[index$1];
				if (bracketDepth === 0 && parenDepth === 0) {
					if (currentCharacter === MODIFIER_SEPARATOR) {
						modifiers.push(className.slice(modifierStart, index$1));
						modifierStart = index$1 + 1;
						continue;
					}
					if (currentCharacter === "/") {
						postfixModifierPosition = index$1;
						continue;
					}
				}
				if (currentCharacter === "[") bracketDepth++;
				else if (currentCharacter === "]") bracketDepth--;
				else if (currentCharacter === "(") parenDepth++;
				else if (currentCharacter === ")") parenDepth--;
			}
			const baseClassNameWithImportantModifier = modifiers.length === 0 ? className : className.slice(modifierStart);
			let baseClassName = baseClassNameWithImportantModifier;
			let hasImportantModifier = false;
			if (baseClassNameWithImportantModifier.endsWith(IMPORTANT_MODIFIER)) {
				baseClassName = baseClassNameWithImportantModifier.slice(0, -1);
				hasImportantModifier = true;
			} else if (baseClassNameWithImportantModifier.startsWith(IMPORTANT_MODIFIER)) {
				baseClassName = baseClassNameWithImportantModifier.slice(1);
				hasImportantModifier = true;
			}
			const maybePostfixModifierPosition = postfixModifierPosition && postfixModifierPosition > modifierStart ? postfixModifierPosition - modifierStart : void 0;
			return createResultObject(modifiers, hasImportantModifier, baseClassName, maybePostfixModifierPosition);
		};
		if (prefix$1) {
			const fullPrefix = prefix$1 + MODIFIER_SEPARATOR;
			const parseClassNameOriginal = parseClassName;
			parseClassName = (className) => className.startsWith(fullPrefix) ? parseClassNameOriginal(className.slice(fullPrefix.length)) : createResultObject(EMPTY_MODIFIERS, false, className, void 0, true);
		}
		if (experimentalParseClassName) {
			const parseClassNameOriginal = parseClassName;
			parseClassName = (className) => experimentalParseClassName({
				className,
				parseClassName: parseClassNameOriginal
			});
		}
		return parseClassName;
	};
	var createSortModifiers = (config) => {
		const modifierWeights = /* @__PURE__ */ new Map();
		config.orderSensitiveModifiers.forEach((mod, index$1) => {
			modifierWeights.set(mod, 1e6 + index$1);
		});
		return (modifiers) => {
			const result = [];
			let currentSegment = [];
			for (let i = 0; i < modifiers.length; i++) {
				const modifier = modifiers[i];
				const isArbitrary = modifier[0] === "[";
				const isOrderSensitive = modifierWeights.has(modifier);
				if (isArbitrary || isOrderSensitive) {
					if (currentSegment.length > 0) {
						currentSegment.sort();
						result.push(...currentSegment);
						currentSegment = [];
					}
					result.push(modifier);
				} else currentSegment.push(modifier);
			}
			if (currentSegment.length > 0) {
				currentSegment.sort();
				result.push(...currentSegment);
			}
			return result;
		};
	};
	var createConfigUtils = (config) => ({
		cache: createLruCache(config.cacheSize),
		parseClassName: createParseClassName(config),
		sortModifiers: createSortModifiers(config),
		...createClassGroupUtils(config)
	});
	var SPLIT_CLASSES_REGEX = /\s+/;
	var mergeClassList = (classList, configUtils) => {
		const { parseClassName, getClassGroupId, getConflictingClassGroupIds, sortModifiers } = configUtils;
		const classGroupsInConflict = [];
		const classNames = classList.trim().split(SPLIT_CLASSES_REGEX);
		let result = "";
		for (let index$1 = classNames.length - 1; index$1 >= 0; index$1 -= 1) {
			const originalClassName = classNames[index$1];
			const { isExternal, modifiers, hasImportantModifier, baseClassName, maybePostfixModifierPosition } = parseClassName(originalClassName);
			if (isExternal) {
				result = originalClassName + (result.length > 0 ? " " + result : result);
				continue;
			}
			let hasPostfixModifier = !!maybePostfixModifierPosition;
			let classGroupId = getClassGroupId(hasPostfixModifier ? baseClassName.substring(0, maybePostfixModifierPosition) : baseClassName);
			if (!classGroupId) {
				if (!hasPostfixModifier) {
					result = originalClassName + (result.length > 0 ? " " + result : result);
					continue;
				}
				classGroupId = getClassGroupId(baseClassName);
				if (!classGroupId) {
					result = originalClassName + (result.length > 0 ? " " + result : result);
					continue;
				}
				hasPostfixModifier = false;
			}
			const variantModifier = modifiers.length === 0 ? "" : modifiers.length === 1 ? modifiers[0] : sortModifiers(modifiers).join(":");
			const modifierId = hasImportantModifier ? variantModifier + IMPORTANT_MODIFIER : variantModifier;
			const classId = modifierId + classGroupId;
			if (classGroupsInConflict.indexOf(classId) > -1) continue;
			classGroupsInConflict.push(classId);
			const conflictGroups = getConflictingClassGroupIds(classGroupId, hasPostfixModifier);
			for (let i = 0; i < conflictGroups.length; ++i) {
				const group = conflictGroups[i];
				classGroupsInConflict.push(modifierId + group);
			}
			result = originalClassName + (result.length > 0 ? " " + result : result);
		}
		return result;
	};
	var twJoin = (...classLists) => {
		let index$1 = 0;
		let argument;
		let resolvedValue;
		let string = "";
		while (index$1 < classLists.length) if (argument = classLists[index$1++]) {
			if (resolvedValue = toValue(argument)) {
				string && (string += " ");
				string += resolvedValue;
			}
		}
		return string;
	};
	var toValue = (mix) => {
		if (typeof mix === "string") return mix;
		let resolvedValue;
		let string = "";
		for (let k = 0; k < mix.length; k++) if (mix[k]) {
			if (resolvedValue = toValue(mix[k])) {
				string && (string += " ");
				string += resolvedValue;
			}
		}
		return string;
	};
	var createTailwindMerge = (createConfigFirst, ...createConfigRest) => {
		let configUtils;
		let cacheGet;
		let cacheSet;
		let functionToCall;
		const initTailwindMerge = (classList) => {
			configUtils = createConfigUtils(createConfigRest.reduce((previousConfig, createConfigCurrent) => createConfigCurrent(previousConfig), createConfigFirst()));
			cacheGet = configUtils.cache.get;
			cacheSet = configUtils.cache.set;
			functionToCall = tailwindMerge;
			return tailwindMerge(classList);
		};
		const tailwindMerge = (classList) => {
			const cachedResult = cacheGet(classList);
			if (cachedResult) return cachedResult;
			const result = mergeClassList(classList, configUtils);
			cacheSet(classList, result);
			return result;
		};
		functionToCall = initTailwindMerge;
		return (...args) => functionToCall(twJoin(...args));
	};
	var fallbackThemeArr = [];
	var fromTheme = (key) => {
		const themeGetter = (theme) => theme[key] || fallbackThemeArr;
		themeGetter.isThemeGetter = true;
		return themeGetter;
	};
	var arbitraryValueRegex = /^\[(?:(\w[\w-]*):)?(.+)\]$/i;
	var arbitraryVariableRegex = /^\((?:(\w[\w-]*):)?(.+)\)$/i;
	var fractionRegex = /^\d+\/\d+$/;
	var tshirtUnitRegex = /^(\d+(\.\d+)?)?(xs|sm|md|lg|xl)$/;
	var lengthUnitRegex = /\d+(%|px|r?em|[sdl]?v([hwib]|min|max)|pt|pc|in|cm|mm|cap|ch|ex|r?lh|cq(w|h|i|b|min|max))|\b(calc|min|max|clamp)\(.+\)|^0$/;
	var colorFunctionRegex = /^(rgba?|hsla?|hwb|(ok)?(lab|lch)|color-mix)\(.+\)$/;
	var shadowRegex = /^(inset_)?-?((\d+)?\.?(\d+)[a-z]+|0)_-?((\d+)?\.?(\d+)[a-z]+|0)/;
	var imageRegex = /^(url|image|image-set|cross-fade|element|(repeating-)?(linear|radial|conic)-gradient)\(.+\)$/;
	var isFraction = (value) => fractionRegex.test(value);
	var isNumber = (value) => !!value && !Number.isNaN(Number(value));
	var isInteger = (value) => !!value && Number.isInteger(Number(value));
	var isPercent = (value) => value.endsWith("%") && isNumber(value.slice(0, -1));
	var isTshirtSize = (value) => tshirtUnitRegex.test(value);
	var isAny = () => true;
	var isLengthOnly = (value) => lengthUnitRegex.test(value) && !colorFunctionRegex.test(value);
	var isNever = () => false;
	var isShadow = (value) => shadowRegex.test(value);
	var isImage = (value) => imageRegex.test(value);
	var isAnyNonArbitrary = (value) => !isArbitraryValue(value) && !isArbitraryVariable(value);
	var isArbitrarySize = (value) => getIsArbitraryValue(value, isLabelSize, isNever);
	var isArbitraryValue = (value) => arbitraryValueRegex.test(value);
	var isArbitraryLength = (value) => getIsArbitraryValue(value, isLabelLength, isLengthOnly);
	var isArbitraryNumber = (value) => getIsArbitraryValue(value, isLabelNumber, isNumber);
	var isArbitraryPosition = (value) => getIsArbitraryValue(value, isLabelPosition, isNever);
	var isArbitraryImage = (value) => getIsArbitraryValue(value, isLabelImage, isImage);
	var isArbitraryShadow = (value) => getIsArbitraryValue(value, isLabelShadow, isShadow);
	var isArbitraryVariable = (value) => arbitraryVariableRegex.test(value);
	var isArbitraryVariableLength = (value) => getIsArbitraryVariable(value, isLabelLength);
	var isArbitraryVariableFamilyName = (value) => getIsArbitraryVariable(value, isLabelFamilyName);
	var isArbitraryVariablePosition = (value) => getIsArbitraryVariable(value, isLabelPosition);
	var isArbitraryVariableSize = (value) => getIsArbitraryVariable(value, isLabelSize);
	var isArbitraryVariableImage = (value) => getIsArbitraryVariable(value, isLabelImage);
	var isArbitraryVariableShadow = (value) => getIsArbitraryVariable(value, isLabelShadow, true);
	var getIsArbitraryValue = (value, testLabel, testValue) => {
		const result = arbitraryValueRegex.exec(value);
		if (result) {
			if (result[1]) return testLabel(result[1]);
			return testValue(result[2]);
		}
		return false;
	};
	var getIsArbitraryVariable = (value, testLabel, shouldMatchNoLabel = false) => {
		const result = arbitraryVariableRegex.exec(value);
		if (result) {
			if (result[1]) return testLabel(result[1]);
			return shouldMatchNoLabel;
		}
		return false;
	};
	var isLabelPosition = (label) => label === "position" || label === "percentage";
	var isLabelImage = (label) => label === "image" || label === "url";
	var isLabelSize = (label) => label === "length" || label === "size" || label === "bg-size";
	var isLabelLength = (label) => label === "length";
	var isLabelNumber = (label) => label === "number";
	var isLabelFamilyName = (label) => label === "family-name";
	var isLabelShadow = (label) => label === "shadow";
	var getDefaultConfig = () => {
		const themeColor = fromTheme("color");
		const themeFont = fromTheme("font");
		const themeText = fromTheme("text");
		const themeFontWeight = fromTheme("font-weight");
		const themeTracking = fromTheme("tracking");
		const themeLeading = fromTheme("leading");
		const themeBreakpoint = fromTheme("breakpoint");
		const themeContainer = fromTheme("container");
		const themeSpacing = fromTheme("spacing");
		const themeRadius = fromTheme("radius");
		const themeShadow = fromTheme("shadow");
		const themeInsetShadow = fromTheme("inset-shadow");
		const themeTextShadow = fromTheme("text-shadow");
		const themeDropShadow = fromTheme("drop-shadow");
		const themeBlur = fromTheme("blur");
		const themePerspective = fromTheme("perspective");
		const themeAspect = fromTheme("aspect");
		const themeEase = fromTheme("ease");
		const themeAnimate = fromTheme("animate");
		const scaleBreak = () => [
			"auto",
			"avoid",
			"all",
			"avoid-page",
			"page",
			"left",
			"right",
			"column"
		];
		const scalePosition = () => [
			"center",
			"top",
			"bottom",
			"left",
			"right",
			"top-left",
			"left-top",
			"top-right",
			"right-top",
			"bottom-right",
			"right-bottom",
			"bottom-left",
			"left-bottom"
		];
		const scalePositionWithArbitrary = () => [
			...scalePosition(),
			isArbitraryVariable,
			isArbitraryValue
		];
		const scaleOverflow = () => [
			"auto",
			"hidden",
			"clip",
			"visible",
			"scroll"
		];
		const scaleOverscroll = () => [
			"auto",
			"contain",
			"none"
		];
		const scaleUnambiguousSpacing = () => [
			isArbitraryVariable,
			isArbitraryValue,
			themeSpacing
		];
		const scaleInset = () => [
			isFraction,
			"full",
			"auto",
			...scaleUnambiguousSpacing()
		];
		const scaleGridTemplateColsRows = () => [
			isInteger,
			"none",
			"subgrid",
			isArbitraryVariable,
			isArbitraryValue
		];
		const scaleGridColRowStartAndEnd = () => [
			"auto",
			{ span: [
				"full",
				isInteger,
				isArbitraryVariable,
				isArbitraryValue
			] },
			isInteger,
			isArbitraryVariable,
			isArbitraryValue
		];
		const scaleGridColRowStartOrEnd = () => [
			isInteger,
			"auto",
			isArbitraryVariable,
			isArbitraryValue
		];
		const scaleGridAutoColsRows = () => [
			"auto",
			"min",
			"max",
			"fr",
			isArbitraryVariable,
			isArbitraryValue
		];
		const scaleAlignPrimaryAxis = () => [
			"start",
			"end",
			"center",
			"between",
			"around",
			"evenly",
			"stretch",
			"baseline",
			"center-safe",
			"end-safe"
		];
		const scaleAlignSecondaryAxis = () => [
			"start",
			"end",
			"center",
			"stretch",
			"center-safe",
			"end-safe"
		];
		const scaleMargin = () => ["auto", ...scaleUnambiguousSpacing()];
		const scaleSizing = () => [
			isFraction,
			"auto",
			"full",
			"dvw",
			"dvh",
			"lvw",
			"lvh",
			"svw",
			"svh",
			"min",
			"max",
			"fit",
			...scaleUnambiguousSpacing()
		];
		const scaleColor = () => [
			themeColor,
			isArbitraryVariable,
			isArbitraryValue
		];
		const scaleBgPosition = () => [
			...scalePosition(),
			isArbitraryVariablePosition,
			isArbitraryPosition,
			{ position: [isArbitraryVariable, isArbitraryValue] }
		];
		const scaleBgRepeat = () => ["no-repeat", { repeat: [
			"",
			"x",
			"y",
			"space",
			"round"
		] }];
		const scaleBgSize = () => [
			"auto",
			"cover",
			"contain",
			isArbitraryVariableSize,
			isArbitrarySize,
			{ size: [isArbitraryVariable, isArbitraryValue] }
		];
		const scaleGradientStopPosition = () => [
			isPercent,
			isArbitraryVariableLength,
			isArbitraryLength
		];
		const scaleRadius = () => [
			"",
			"none",
			"full",
			themeRadius,
			isArbitraryVariable,
			isArbitraryValue
		];
		const scaleBorderWidth = () => [
			"",
			isNumber,
			isArbitraryVariableLength,
			isArbitraryLength
		];
		const scaleLineStyle = () => [
			"solid",
			"dashed",
			"dotted",
			"double"
		];
		const scaleBlendMode = () => [
			"normal",
			"multiply",
			"screen",
			"overlay",
			"darken",
			"lighten",
			"color-dodge",
			"color-burn",
			"hard-light",
			"soft-light",
			"difference",
			"exclusion",
			"hue",
			"saturation",
			"color",
			"luminosity"
		];
		const scaleMaskImagePosition = () => [
			isNumber,
			isPercent,
			isArbitraryVariablePosition,
			isArbitraryPosition
		];
		const scaleBlur = () => [
			"",
			"none",
			themeBlur,
			isArbitraryVariable,
			isArbitraryValue
		];
		const scaleRotate = () => [
			"none",
			isNumber,
			isArbitraryVariable,
			isArbitraryValue
		];
		const scaleScale = () => [
			"none",
			isNumber,
			isArbitraryVariable,
			isArbitraryValue
		];
		const scaleSkew = () => [
			isNumber,
			isArbitraryVariable,
			isArbitraryValue
		];
		const scaleTranslate = () => [
			isFraction,
			"full",
			...scaleUnambiguousSpacing()
		];
		return {
			cacheSize: 500,
			theme: {
				animate: [
					"spin",
					"ping",
					"pulse",
					"bounce"
				],
				aspect: ["video"],
				blur: [isTshirtSize],
				breakpoint: [isTshirtSize],
				color: [isAny],
				container: [isTshirtSize],
				"drop-shadow": [isTshirtSize],
				ease: [
					"in",
					"out",
					"in-out"
				],
				font: [isAnyNonArbitrary],
				"font-weight": [
					"thin",
					"extralight",
					"light",
					"normal",
					"medium",
					"semibold",
					"bold",
					"extrabold",
					"black"
				],
				"inset-shadow": [isTshirtSize],
				leading: [
					"none",
					"tight",
					"snug",
					"normal",
					"relaxed",
					"loose"
				],
				perspective: [
					"dramatic",
					"near",
					"normal",
					"midrange",
					"distant",
					"none"
				],
				radius: [isTshirtSize],
				shadow: [isTshirtSize],
				spacing: ["px", isNumber],
				text: [isTshirtSize],
				"text-shadow": [isTshirtSize],
				tracking: [
					"tighter",
					"tight",
					"normal",
					"wide",
					"wider",
					"widest"
				]
			},
			classGroups: {
				aspect: [{ aspect: [
					"auto",
					"square",
					isFraction,
					isArbitraryValue,
					isArbitraryVariable,
					themeAspect
				] }],
				container: ["container"],
				columns: [{ columns: [
					isNumber,
					isArbitraryValue,
					isArbitraryVariable,
					themeContainer
				] }],
				"break-after": [{ "break-after": scaleBreak() }],
				"break-before": [{ "break-before": scaleBreak() }],
				"break-inside": [{ "break-inside": [
					"auto",
					"avoid",
					"avoid-page",
					"avoid-column"
				] }],
				"box-decoration": [{ "box-decoration": ["slice", "clone"] }],
				box: [{ box: ["border", "content"] }],
				display: [
					"block",
					"inline-block",
					"inline",
					"flex",
					"inline-flex",
					"table",
					"inline-table",
					"table-caption",
					"table-cell",
					"table-column",
					"table-column-group",
					"table-footer-group",
					"table-header-group",
					"table-row-group",
					"table-row",
					"flow-root",
					"grid",
					"inline-grid",
					"contents",
					"list-item",
					"hidden"
				],
				sr: ["sr-only", "not-sr-only"],
				float: [{ float: [
					"right",
					"left",
					"none",
					"start",
					"end"
				] }],
				clear: [{ clear: [
					"left",
					"right",
					"both",
					"none",
					"start",
					"end"
				] }],
				isolation: ["isolate", "isolation-auto"],
				"object-fit": [{ object: [
					"contain",
					"cover",
					"fill",
					"none",
					"scale-down"
				] }],
				"object-position": [{ object: scalePositionWithArbitrary() }],
				overflow: [{ overflow: scaleOverflow() }],
				"overflow-x": [{ "overflow-x": scaleOverflow() }],
				"overflow-y": [{ "overflow-y": scaleOverflow() }],
				overscroll: [{ overscroll: scaleOverscroll() }],
				"overscroll-x": [{ "overscroll-x": scaleOverscroll() }],
				"overscroll-y": [{ "overscroll-y": scaleOverscroll() }],
				position: [
					"static",
					"fixed",
					"absolute",
					"relative",
					"sticky"
				],
				inset: [{ inset: scaleInset() }],
				"inset-x": [{ "inset-x": scaleInset() }],
				"inset-y": [{ "inset-y": scaleInset() }],
				start: [{ start: scaleInset() }],
				end: [{ end: scaleInset() }],
				top: [{ top: scaleInset() }],
				right: [{ right: scaleInset() }],
				bottom: [{ bottom: scaleInset() }],
				left: [{ left: scaleInset() }],
				visibility: [
					"visible",
					"invisible",
					"collapse"
				],
				z: [{ z: [
					isInteger,
					"auto",
					isArbitraryVariable,
					isArbitraryValue
				] }],
				basis: [{ basis: [
					isFraction,
					"full",
					"auto",
					themeContainer,
					...scaleUnambiguousSpacing()
				] }],
				"flex-direction": [{ flex: [
					"row",
					"row-reverse",
					"col",
					"col-reverse"
				] }],
				"flex-wrap": [{ flex: [
					"nowrap",
					"wrap",
					"wrap-reverse"
				] }],
				flex: [{ flex: [
					isNumber,
					isFraction,
					"auto",
					"initial",
					"none",
					isArbitraryValue
				] }],
				grow: [{ grow: [
					"",
					isNumber,
					isArbitraryVariable,
					isArbitraryValue
				] }],
				shrink: [{ shrink: [
					"",
					isNumber,
					isArbitraryVariable,
					isArbitraryValue
				] }],
				order: [{ order: [
					isInteger,
					"first",
					"last",
					"none",
					isArbitraryVariable,
					isArbitraryValue
				] }],
				"grid-cols": [{ "grid-cols": scaleGridTemplateColsRows() }],
				"col-start-end": [{ col: scaleGridColRowStartAndEnd() }],
				"col-start": [{ "col-start": scaleGridColRowStartOrEnd() }],
				"col-end": [{ "col-end": scaleGridColRowStartOrEnd() }],
				"grid-rows": [{ "grid-rows": scaleGridTemplateColsRows() }],
				"row-start-end": [{ row: scaleGridColRowStartAndEnd() }],
				"row-start": [{ "row-start": scaleGridColRowStartOrEnd() }],
				"row-end": [{ "row-end": scaleGridColRowStartOrEnd() }],
				"grid-flow": [{ "grid-flow": [
					"row",
					"col",
					"dense",
					"row-dense",
					"col-dense"
				] }],
				"auto-cols": [{ "auto-cols": scaleGridAutoColsRows() }],
				"auto-rows": [{ "auto-rows": scaleGridAutoColsRows() }],
				gap: [{ gap: scaleUnambiguousSpacing() }],
				"gap-x": [{ "gap-x": scaleUnambiguousSpacing() }],
				"gap-y": [{ "gap-y": scaleUnambiguousSpacing() }],
				"justify-content": [{ justify: [...scaleAlignPrimaryAxis(), "normal"] }],
				"justify-items": [{ "justify-items": [...scaleAlignSecondaryAxis(), "normal"] }],
				"justify-self": [{ "justify-self": ["auto", ...scaleAlignSecondaryAxis()] }],
				"align-content": [{ content: ["normal", ...scaleAlignPrimaryAxis()] }],
				"align-items": [{ items: [...scaleAlignSecondaryAxis(), { baseline: ["", "last"] }] }],
				"align-self": [{ self: [
					"auto",
					...scaleAlignSecondaryAxis(),
					{ baseline: ["", "last"] }
				] }],
				"place-content": [{ "place-content": scaleAlignPrimaryAxis() }],
				"place-items": [{ "place-items": [...scaleAlignSecondaryAxis(), "baseline"] }],
				"place-self": [{ "place-self": ["auto", ...scaleAlignSecondaryAxis()] }],
				p: [{ p: scaleUnambiguousSpacing() }],
				px: [{ px: scaleUnambiguousSpacing() }],
				py: [{ py: scaleUnambiguousSpacing() }],
				ps: [{ ps: scaleUnambiguousSpacing() }],
				pe: [{ pe: scaleUnambiguousSpacing() }],
				pt: [{ pt: scaleUnambiguousSpacing() }],
				pr: [{ pr: scaleUnambiguousSpacing() }],
				pb: [{ pb: scaleUnambiguousSpacing() }],
				pl: [{ pl: scaleUnambiguousSpacing() }],
				m: [{ m: scaleMargin() }],
				mx: [{ mx: scaleMargin() }],
				my: [{ my: scaleMargin() }],
				ms: [{ ms: scaleMargin() }],
				me: [{ me: scaleMargin() }],
				mt: [{ mt: scaleMargin() }],
				mr: [{ mr: scaleMargin() }],
				mb: [{ mb: scaleMargin() }],
				ml: [{ ml: scaleMargin() }],
				"space-x": [{ "space-x": scaleUnambiguousSpacing() }],
				"space-x-reverse": ["space-x-reverse"],
				"space-y": [{ "space-y": scaleUnambiguousSpacing() }],
				"space-y-reverse": ["space-y-reverse"],
				size: [{ size: scaleSizing() }],
				w: [{ w: [
					themeContainer,
					"screen",
					...scaleSizing()
				] }],
				"min-w": [{ "min-w": [
					themeContainer,
					"screen",
					"none",
					...scaleSizing()
				] }],
				"max-w": [{ "max-w": [
					themeContainer,
					"screen",
					"none",
					"prose",
					{ screen: [themeBreakpoint] },
					...scaleSizing()
				] }],
				h: [{ h: [
					"screen",
					"lh",
					...scaleSizing()
				] }],
				"min-h": [{ "min-h": [
					"screen",
					"lh",
					"none",
					...scaleSizing()
				] }],
				"max-h": [{ "max-h": [
					"screen",
					"lh",
					...scaleSizing()
				] }],
				"font-size": [{ text: [
					"base",
					themeText,
					isArbitraryVariableLength,
					isArbitraryLength
				] }],
				"font-smoothing": ["antialiased", "subpixel-antialiased"],
				"font-style": ["italic", "not-italic"],
				"font-weight": [{ font: [
					themeFontWeight,
					isArbitraryVariable,
					isArbitraryNumber
				] }],
				"font-stretch": [{ "font-stretch": [
					"ultra-condensed",
					"extra-condensed",
					"condensed",
					"semi-condensed",
					"normal",
					"semi-expanded",
					"expanded",
					"extra-expanded",
					"ultra-expanded",
					isPercent,
					isArbitraryValue
				] }],
				"font-family": [{ font: [
					isArbitraryVariableFamilyName,
					isArbitraryValue,
					themeFont
				] }],
				"fvn-normal": ["normal-nums"],
				"fvn-ordinal": ["ordinal"],
				"fvn-slashed-zero": ["slashed-zero"],
				"fvn-figure": ["lining-nums", "oldstyle-nums"],
				"fvn-spacing": ["proportional-nums", "tabular-nums"],
				"fvn-fraction": ["diagonal-fractions", "stacked-fractions"],
				tracking: [{ tracking: [
					themeTracking,
					isArbitraryVariable,
					isArbitraryValue
				] }],
				"line-clamp": [{ "line-clamp": [
					isNumber,
					"none",
					isArbitraryVariable,
					isArbitraryNumber
				] }],
				leading: [{ leading: [themeLeading, ...scaleUnambiguousSpacing()] }],
				"list-image": [{ "list-image": [
					"none",
					isArbitraryVariable,
					isArbitraryValue
				] }],
				"list-style-position": [{ list: ["inside", "outside"] }],
				"list-style-type": [{ list: [
					"disc",
					"decimal",
					"none",
					isArbitraryVariable,
					isArbitraryValue
				] }],
				"text-alignment": [{ text: [
					"left",
					"center",
					"right",
					"justify",
					"start",
					"end"
				] }],
				"placeholder-color": [{ placeholder: scaleColor() }],
				"text-color": [{ text: scaleColor() }],
				"text-decoration": [
					"underline",
					"overline",
					"line-through",
					"no-underline"
				],
				"text-decoration-style": [{ decoration: [...scaleLineStyle(), "wavy"] }],
				"text-decoration-thickness": [{ decoration: [
					isNumber,
					"from-font",
					"auto",
					isArbitraryVariable,
					isArbitraryLength
				] }],
				"text-decoration-color": [{ decoration: scaleColor() }],
				"underline-offset": [{ "underline-offset": [
					isNumber,
					"auto",
					isArbitraryVariable,
					isArbitraryValue
				] }],
				"text-transform": [
					"uppercase",
					"lowercase",
					"capitalize",
					"normal-case"
				],
				"text-overflow": [
					"truncate",
					"text-ellipsis",
					"text-clip"
				],
				"text-wrap": [{ text: [
					"wrap",
					"nowrap",
					"balance",
					"pretty"
				] }],
				indent: [{ indent: scaleUnambiguousSpacing() }],
				"vertical-align": [{ align: [
					"baseline",
					"top",
					"middle",
					"bottom",
					"text-top",
					"text-bottom",
					"sub",
					"super",
					isArbitraryVariable,
					isArbitraryValue
				] }],
				whitespace: [{ whitespace: [
					"normal",
					"nowrap",
					"pre",
					"pre-line",
					"pre-wrap",
					"break-spaces"
				] }],
				break: [{ break: [
					"normal",
					"words",
					"all",
					"keep"
				] }],
				wrap: [{ wrap: [
					"break-word",
					"anywhere",
					"normal"
				] }],
				hyphens: [{ hyphens: [
					"none",
					"manual",
					"auto"
				] }],
				content: [{ content: [
					"none",
					isArbitraryVariable,
					isArbitraryValue
				] }],
				"bg-attachment": [{ bg: [
					"fixed",
					"local",
					"scroll"
				] }],
				"bg-clip": [{ "bg-clip": [
					"border",
					"padding",
					"content",
					"text"
				] }],
				"bg-origin": [{ "bg-origin": [
					"border",
					"padding",
					"content"
				] }],
				"bg-position": [{ bg: scaleBgPosition() }],
				"bg-repeat": [{ bg: scaleBgRepeat() }],
				"bg-size": [{ bg: scaleBgSize() }],
				"bg-image": [{ bg: [
					"none",
					{
						linear: [
							{ to: [
								"t",
								"tr",
								"r",
								"br",
								"b",
								"bl",
								"l",
								"tl"
							] },
							isInteger,
							isArbitraryVariable,
							isArbitraryValue
						],
						radial: [
							"",
							isArbitraryVariable,
							isArbitraryValue
						],
						conic: [
							isInteger,
							isArbitraryVariable,
							isArbitraryValue
						]
					},
					isArbitraryVariableImage,
					isArbitraryImage
				] }],
				"bg-color": [{ bg: scaleColor() }],
				"gradient-from-pos": [{ from: scaleGradientStopPosition() }],
				"gradient-via-pos": [{ via: scaleGradientStopPosition() }],
				"gradient-to-pos": [{ to: scaleGradientStopPosition() }],
				"gradient-from": [{ from: scaleColor() }],
				"gradient-via": [{ via: scaleColor() }],
				"gradient-to": [{ to: scaleColor() }],
				rounded: [{ rounded: scaleRadius() }],
				"rounded-s": [{ "rounded-s": scaleRadius() }],
				"rounded-e": [{ "rounded-e": scaleRadius() }],
				"rounded-t": [{ "rounded-t": scaleRadius() }],
				"rounded-r": [{ "rounded-r": scaleRadius() }],
				"rounded-b": [{ "rounded-b": scaleRadius() }],
				"rounded-l": [{ "rounded-l": scaleRadius() }],
				"rounded-ss": [{ "rounded-ss": scaleRadius() }],
				"rounded-se": [{ "rounded-se": scaleRadius() }],
				"rounded-ee": [{ "rounded-ee": scaleRadius() }],
				"rounded-es": [{ "rounded-es": scaleRadius() }],
				"rounded-tl": [{ "rounded-tl": scaleRadius() }],
				"rounded-tr": [{ "rounded-tr": scaleRadius() }],
				"rounded-br": [{ "rounded-br": scaleRadius() }],
				"rounded-bl": [{ "rounded-bl": scaleRadius() }],
				"border-w": [{ border: scaleBorderWidth() }],
				"border-w-x": [{ "border-x": scaleBorderWidth() }],
				"border-w-y": [{ "border-y": scaleBorderWidth() }],
				"border-w-s": [{ "border-s": scaleBorderWidth() }],
				"border-w-e": [{ "border-e": scaleBorderWidth() }],
				"border-w-t": [{ "border-t": scaleBorderWidth() }],
				"border-w-r": [{ "border-r": scaleBorderWidth() }],
				"border-w-b": [{ "border-b": scaleBorderWidth() }],
				"border-w-l": [{ "border-l": scaleBorderWidth() }],
				"divide-x": [{ "divide-x": scaleBorderWidth() }],
				"divide-x-reverse": ["divide-x-reverse"],
				"divide-y": [{ "divide-y": scaleBorderWidth() }],
				"divide-y-reverse": ["divide-y-reverse"],
				"border-style": [{ border: [
					...scaleLineStyle(),
					"hidden",
					"none"
				] }],
				"divide-style": [{ divide: [
					...scaleLineStyle(),
					"hidden",
					"none"
				] }],
				"border-color": [{ border: scaleColor() }],
				"border-color-x": [{ "border-x": scaleColor() }],
				"border-color-y": [{ "border-y": scaleColor() }],
				"border-color-s": [{ "border-s": scaleColor() }],
				"border-color-e": [{ "border-e": scaleColor() }],
				"border-color-t": [{ "border-t": scaleColor() }],
				"border-color-r": [{ "border-r": scaleColor() }],
				"border-color-b": [{ "border-b": scaleColor() }],
				"border-color-l": [{ "border-l": scaleColor() }],
				"divide-color": [{ divide: scaleColor() }],
				"outline-style": [{ outline: [
					...scaleLineStyle(),
					"none",
					"hidden"
				] }],
				"outline-offset": [{ "outline-offset": [
					isNumber,
					isArbitraryVariable,
					isArbitraryValue
				] }],
				"outline-w": [{ outline: [
					"",
					isNumber,
					isArbitraryVariableLength,
					isArbitraryLength
				] }],
				"outline-color": [{ outline: scaleColor() }],
				shadow: [{ shadow: [
					"",
					"none",
					themeShadow,
					isArbitraryVariableShadow,
					isArbitraryShadow
				] }],
				"shadow-color": [{ shadow: scaleColor() }],
				"inset-shadow": [{ "inset-shadow": [
					"none",
					themeInsetShadow,
					isArbitraryVariableShadow,
					isArbitraryShadow
				] }],
				"inset-shadow-color": [{ "inset-shadow": scaleColor() }],
				"ring-w": [{ ring: scaleBorderWidth() }],
				"ring-w-inset": ["ring-inset"],
				"ring-color": [{ ring: scaleColor() }],
				"ring-offset-w": [{ "ring-offset": [isNumber, isArbitraryLength] }],
				"ring-offset-color": [{ "ring-offset": scaleColor() }],
				"inset-ring-w": [{ "inset-ring": scaleBorderWidth() }],
				"inset-ring-color": [{ "inset-ring": scaleColor() }],
				"text-shadow": [{ "text-shadow": [
					"none",
					themeTextShadow,
					isArbitraryVariableShadow,
					isArbitraryShadow
				] }],
				"text-shadow-color": [{ "text-shadow": scaleColor() }],
				opacity: [{ opacity: [
					isNumber,
					isArbitraryVariable,
					isArbitraryValue
				] }],
				"mix-blend": [{ "mix-blend": [
					...scaleBlendMode(),
					"plus-darker",
					"plus-lighter"
				] }],
				"bg-blend": [{ "bg-blend": scaleBlendMode() }],
				"mask-clip": [{ "mask-clip": [
					"border",
					"padding",
					"content",
					"fill",
					"stroke",
					"view"
				] }, "mask-no-clip"],
				"mask-composite": [{ mask: [
					"add",
					"subtract",
					"intersect",
					"exclude"
				] }],
				"mask-image-linear-pos": [{ "mask-linear": [isNumber] }],
				"mask-image-linear-from-pos": [{ "mask-linear-from": scaleMaskImagePosition() }],
				"mask-image-linear-to-pos": [{ "mask-linear-to": scaleMaskImagePosition() }],
				"mask-image-linear-from-color": [{ "mask-linear-from": scaleColor() }],
				"mask-image-linear-to-color": [{ "mask-linear-to": scaleColor() }],
				"mask-image-t-from-pos": [{ "mask-t-from": scaleMaskImagePosition() }],
				"mask-image-t-to-pos": [{ "mask-t-to": scaleMaskImagePosition() }],
				"mask-image-t-from-color": [{ "mask-t-from": scaleColor() }],
				"mask-image-t-to-color": [{ "mask-t-to": scaleColor() }],
				"mask-image-r-from-pos": [{ "mask-r-from": scaleMaskImagePosition() }],
				"mask-image-r-to-pos": [{ "mask-r-to": scaleMaskImagePosition() }],
				"mask-image-r-from-color": [{ "mask-r-from": scaleColor() }],
				"mask-image-r-to-color": [{ "mask-r-to": scaleColor() }],
				"mask-image-b-from-pos": [{ "mask-b-from": scaleMaskImagePosition() }],
				"mask-image-b-to-pos": [{ "mask-b-to": scaleMaskImagePosition() }],
				"mask-image-b-from-color": [{ "mask-b-from": scaleColor() }],
				"mask-image-b-to-color": [{ "mask-b-to": scaleColor() }],
				"mask-image-l-from-pos": [{ "mask-l-from": scaleMaskImagePosition() }],
				"mask-image-l-to-pos": [{ "mask-l-to": scaleMaskImagePosition() }],
				"mask-image-l-from-color": [{ "mask-l-from": scaleColor() }],
				"mask-image-l-to-color": [{ "mask-l-to": scaleColor() }],
				"mask-image-x-from-pos": [{ "mask-x-from": scaleMaskImagePosition() }],
				"mask-image-x-to-pos": [{ "mask-x-to": scaleMaskImagePosition() }],
				"mask-image-x-from-color": [{ "mask-x-from": scaleColor() }],
				"mask-image-x-to-color": [{ "mask-x-to": scaleColor() }],
				"mask-image-y-from-pos": [{ "mask-y-from": scaleMaskImagePosition() }],
				"mask-image-y-to-pos": [{ "mask-y-to": scaleMaskImagePosition() }],
				"mask-image-y-from-color": [{ "mask-y-from": scaleColor() }],
				"mask-image-y-to-color": [{ "mask-y-to": scaleColor() }],
				"mask-image-radial": [{ "mask-radial": [isArbitraryVariable, isArbitraryValue] }],
				"mask-image-radial-from-pos": [{ "mask-radial-from": scaleMaskImagePosition() }],
				"mask-image-radial-to-pos": [{ "mask-radial-to": scaleMaskImagePosition() }],
				"mask-image-radial-from-color": [{ "mask-radial-from": scaleColor() }],
				"mask-image-radial-to-color": [{ "mask-radial-to": scaleColor() }],
				"mask-image-radial-shape": [{ "mask-radial": ["circle", "ellipse"] }],
				"mask-image-radial-size": [{ "mask-radial": [{
					closest: ["side", "corner"],
					farthest: ["side", "corner"]
				}] }],
				"mask-image-radial-pos": [{ "mask-radial-at": scalePosition() }],
				"mask-image-conic-pos": [{ "mask-conic": [isNumber] }],
				"mask-image-conic-from-pos": [{ "mask-conic-from": scaleMaskImagePosition() }],
				"mask-image-conic-to-pos": [{ "mask-conic-to": scaleMaskImagePosition() }],
				"mask-image-conic-from-color": [{ "mask-conic-from": scaleColor() }],
				"mask-image-conic-to-color": [{ "mask-conic-to": scaleColor() }],
				"mask-mode": [{ mask: [
					"alpha",
					"luminance",
					"match"
				] }],
				"mask-origin": [{ "mask-origin": [
					"border",
					"padding",
					"content",
					"fill",
					"stroke",
					"view"
				] }],
				"mask-position": [{ mask: scaleBgPosition() }],
				"mask-repeat": [{ mask: scaleBgRepeat() }],
				"mask-size": [{ mask: scaleBgSize() }],
				"mask-type": [{ "mask-type": ["alpha", "luminance"] }],
				"mask-image": [{ mask: [
					"none",
					isArbitraryVariable,
					isArbitraryValue
				] }],
				filter: [{ filter: [
					"",
					"none",
					isArbitraryVariable,
					isArbitraryValue
				] }],
				blur: [{ blur: scaleBlur() }],
				brightness: [{ brightness: [
					isNumber,
					isArbitraryVariable,
					isArbitraryValue
				] }],
				contrast: [{ contrast: [
					isNumber,
					isArbitraryVariable,
					isArbitraryValue
				] }],
				"drop-shadow": [{ "drop-shadow": [
					"",
					"none",
					themeDropShadow,
					isArbitraryVariableShadow,
					isArbitraryShadow
				] }],
				"drop-shadow-color": [{ "drop-shadow": scaleColor() }],
				grayscale: [{ grayscale: [
					"",
					isNumber,
					isArbitraryVariable,
					isArbitraryValue
				] }],
				"hue-rotate": [{ "hue-rotate": [
					isNumber,
					isArbitraryVariable,
					isArbitraryValue
				] }],
				invert: [{ invert: [
					"",
					isNumber,
					isArbitraryVariable,
					isArbitraryValue
				] }],
				saturate: [{ saturate: [
					isNumber,
					isArbitraryVariable,
					isArbitraryValue
				] }],
				sepia: [{ sepia: [
					"",
					isNumber,
					isArbitraryVariable,
					isArbitraryValue
				] }],
				"backdrop-filter": [{ "backdrop-filter": [
					"",
					"none",
					isArbitraryVariable,
					isArbitraryValue
				] }],
				"backdrop-blur": [{ "backdrop-blur": scaleBlur() }],
				"backdrop-brightness": [{ "backdrop-brightness": [
					isNumber,
					isArbitraryVariable,
					isArbitraryValue
				] }],
				"backdrop-contrast": [{ "backdrop-contrast": [
					isNumber,
					isArbitraryVariable,
					isArbitraryValue
				] }],
				"backdrop-grayscale": [{ "backdrop-grayscale": [
					"",
					isNumber,
					isArbitraryVariable,
					isArbitraryValue
				] }],
				"backdrop-hue-rotate": [{ "backdrop-hue-rotate": [
					isNumber,
					isArbitraryVariable,
					isArbitraryValue
				] }],
				"backdrop-invert": [{ "backdrop-invert": [
					"",
					isNumber,
					isArbitraryVariable,
					isArbitraryValue
				] }],
				"backdrop-opacity": [{ "backdrop-opacity": [
					isNumber,
					isArbitraryVariable,
					isArbitraryValue
				] }],
				"backdrop-saturate": [{ "backdrop-saturate": [
					isNumber,
					isArbitraryVariable,
					isArbitraryValue
				] }],
				"backdrop-sepia": [{ "backdrop-sepia": [
					"",
					isNumber,
					isArbitraryVariable,
					isArbitraryValue
				] }],
				"border-collapse": [{ border: ["collapse", "separate"] }],
				"border-spacing": [{ "border-spacing": scaleUnambiguousSpacing() }],
				"border-spacing-x": [{ "border-spacing-x": scaleUnambiguousSpacing() }],
				"border-spacing-y": [{ "border-spacing-y": scaleUnambiguousSpacing() }],
				"table-layout": [{ table: ["auto", "fixed"] }],
				caption: [{ caption: ["top", "bottom"] }],
				transition: [{ transition: [
					"",
					"all",
					"colors",
					"opacity",
					"shadow",
					"transform",
					"none",
					isArbitraryVariable,
					isArbitraryValue
				] }],
				"transition-behavior": [{ transition: ["normal", "discrete"] }],
				duration: [{ duration: [
					isNumber,
					"initial",
					isArbitraryVariable,
					isArbitraryValue
				] }],
				ease: [{ ease: [
					"linear",
					"initial",
					themeEase,
					isArbitraryVariable,
					isArbitraryValue
				] }],
				delay: [{ delay: [
					isNumber,
					isArbitraryVariable,
					isArbitraryValue
				] }],
				animate: [{ animate: [
					"none",
					themeAnimate,
					isArbitraryVariable,
					isArbitraryValue
				] }],
				backface: [{ backface: ["hidden", "visible"] }],
				perspective: [{ perspective: [
					themePerspective,
					isArbitraryVariable,
					isArbitraryValue
				] }],
				"perspective-origin": [{ "perspective-origin": scalePositionWithArbitrary() }],
				rotate: [{ rotate: scaleRotate() }],
				"rotate-x": [{ "rotate-x": scaleRotate() }],
				"rotate-y": [{ "rotate-y": scaleRotate() }],
				"rotate-z": [{ "rotate-z": scaleRotate() }],
				scale: [{ scale: scaleScale() }],
				"scale-x": [{ "scale-x": scaleScale() }],
				"scale-y": [{ "scale-y": scaleScale() }],
				"scale-z": [{ "scale-z": scaleScale() }],
				"scale-3d": ["scale-3d"],
				skew: [{ skew: scaleSkew() }],
				"skew-x": [{ "skew-x": scaleSkew() }],
				"skew-y": [{ "skew-y": scaleSkew() }],
				transform: [{ transform: [
					isArbitraryVariable,
					isArbitraryValue,
					"",
					"none",
					"gpu",
					"cpu"
				] }],
				"transform-origin": [{ origin: scalePositionWithArbitrary() }],
				"transform-style": [{ transform: ["3d", "flat"] }],
				translate: [{ translate: scaleTranslate() }],
				"translate-x": [{ "translate-x": scaleTranslate() }],
				"translate-y": [{ "translate-y": scaleTranslate() }],
				"translate-z": [{ "translate-z": scaleTranslate() }],
				"translate-none": ["translate-none"],
				accent: [{ accent: scaleColor() }],
				appearance: [{ appearance: ["none", "auto"] }],
				"caret-color": [{ caret: scaleColor() }],
				"color-scheme": [{ scheme: [
					"normal",
					"dark",
					"light",
					"light-dark",
					"only-dark",
					"only-light"
				] }],
				cursor: [{ cursor: [
					"auto",
					"default",
					"pointer",
					"wait",
					"text",
					"move",
					"help",
					"not-allowed",
					"none",
					"context-menu",
					"progress",
					"cell",
					"crosshair",
					"vertical-text",
					"alias",
					"copy",
					"no-drop",
					"grab",
					"grabbing",
					"all-scroll",
					"col-resize",
					"row-resize",
					"n-resize",
					"e-resize",
					"s-resize",
					"w-resize",
					"ne-resize",
					"nw-resize",
					"se-resize",
					"sw-resize",
					"ew-resize",
					"ns-resize",
					"nesw-resize",
					"nwse-resize",
					"zoom-in",
					"zoom-out",
					isArbitraryVariable,
					isArbitraryValue
				] }],
				"field-sizing": [{ "field-sizing": ["fixed", "content"] }],
				"pointer-events": [{ "pointer-events": ["auto", "none"] }],
				resize: [{ resize: [
					"none",
					"",
					"y",
					"x"
				] }],
				"scroll-behavior": [{ scroll: ["auto", "smooth"] }],
				"scroll-m": [{ "scroll-m": scaleUnambiguousSpacing() }],
				"scroll-mx": [{ "scroll-mx": scaleUnambiguousSpacing() }],
				"scroll-my": [{ "scroll-my": scaleUnambiguousSpacing() }],
				"scroll-ms": [{ "scroll-ms": scaleUnambiguousSpacing() }],
				"scroll-me": [{ "scroll-me": scaleUnambiguousSpacing() }],
				"scroll-mt": [{ "scroll-mt": scaleUnambiguousSpacing() }],
				"scroll-mr": [{ "scroll-mr": scaleUnambiguousSpacing() }],
				"scroll-mb": [{ "scroll-mb": scaleUnambiguousSpacing() }],
				"scroll-ml": [{ "scroll-ml": scaleUnambiguousSpacing() }],
				"scroll-p": [{ "scroll-p": scaleUnambiguousSpacing() }],
				"scroll-px": [{ "scroll-px": scaleUnambiguousSpacing() }],
				"scroll-py": [{ "scroll-py": scaleUnambiguousSpacing() }],
				"scroll-ps": [{ "scroll-ps": scaleUnambiguousSpacing() }],
				"scroll-pe": [{ "scroll-pe": scaleUnambiguousSpacing() }],
				"scroll-pt": [{ "scroll-pt": scaleUnambiguousSpacing() }],
				"scroll-pr": [{ "scroll-pr": scaleUnambiguousSpacing() }],
				"scroll-pb": [{ "scroll-pb": scaleUnambiguousSpacing() }],
				"scroll-pl": [{ "scroll-pl": scaleUnambiguousSpacing() }],
				"snap-align": [{ snap: [
					"start",
					"end",
					"center",
					"align-none"
				] }],
				"snap-stop": [{ snap: ["normal", "always"] }],
				"snap-type": [{ snap: [
					"none",
					"x",
					"y",
					"both"
				] }],
				"snap-strictness": [{ snap: ["mandatory", "proximity"] }],
				touch: [{ touch: [
					"auto",
					"none",
					"manipulation"
				] }],
				"touch-x": [{ "touch-pan": [
					"x",
					"left",
					"right"
				] }],
				"touch-y": [{ "touch-pan": [
					"y",
					"up",
					"down"
				] }],
				"touch-pz": ["touch-pinch-zoom"],
				select: [{ select: [
					"none",
					"text",
					"all",
					"auto"
				] }],
				"will-change": [{ "will-change": [
					"auto",
					"scroll",
					"contents",
					"transform",
					isArbitraryVariable,
					isArbitraryValue
				] }],
				fill: [{ fill: ["none", ...scaleColor()] }],
				"stroke-w": [{ stroke: [
					isNumber,
					isArbitraryVariableLength,
					isArbitraryLength,
					isArbitraryNumber
				] }],
				stroke: [{ stroke: ["none", ...scaleColor()] }],
				"forced-color-adjust": [{ "forced-color-adjust": ["auto", "none"] }]
			},
			conflictingClassGroups: {
				overflow: ["overflow-x", "overflow-y"],
				overscroll: ["overscroll-x", "overscroll-y"],
				inset: [
					"inset-x",
					"inset-y",
					"start",
					"end",
					"top",
					"right",
					"bottom",
					"left"
				],
				"inset-x": ["right", "left"],
				"inset-y": ["top", "bottom"],
				flex: [
					"basis",
					"grow",
					"shrink"
				],
				gap: ["gap-x", "gap-y"],
				p: [
					"px",
					"py",
					"ps",
					"pe",
					"pt",
					"pr",
					"pb",
					"pl"
				],
				px: ["pr", "pl"],
				py: ["pt", "pb"],
				m: [
					"mx",
					"my",
					"ms",
					"me",
					"mt",
					"mr",
					"mb",
					"ml"
				],
				mx: ["mr", "ml"],
				my: ["mt", "mb"],
				size: ["w", "h"],
				"font-size": ["leading"],
				"fvn-normal": [
					"fvn-ordinal",
					"fvn-slashed-zero",
					"fvn-figure",
					"fvn-spacing",
					"fvn-fraction"
				],
				"fvn-ordinal": ["fvn-normal"],
				"fvn-slashed-zero": ["fvn-normal"],
				"fvn-figure": ["fvn-normal"],
				"fvn-spacing": ["fvn-normal"],
				"fvn-fraction": ["fvn-normal"],
				"line-clamp": ["display", "overflow"],
				rounded: [
					"rounded-s",
					"rounded-e",
					"rounded-t",
					"rounded-r",
					"rounded-b",
					"rounded-l",
					"rounded-ss",
					"rounded-se",
					"rounded-ee",
					"rounded-es",
					"rounded-tl",
					"rounded-tr",
					"rounded-br",
					"rounded-bl"
				],
				"rounded-s": ["rounded-ss", "rounded-es"],
				"rounded-e": ["rounded-se", "rounded-ee"],
				"rounded-t": ["rounded-tl", "rounded-tr"],
				"rounded-r": ["rounded-tr", "rounded-br"],
				"rounded-b": ["rounded-br", "rounded-bl"],
				"rounded-l": ["rounded-tl", "rounded-bl"],
				"border-spacing": ["border-spacing-x", "border-spacing-y"],
				"border-w": [
					"border-w-x",
					"border-w-y",
					"border-w-s",
					"border-w-e",
					"border-w-t",
					"border-w-r",
					"border-w-b",
					"border-w-l"
				],
				"border-w-x": ["border-w-r", "border-w-l"],
				"border-w-y": ["border-w-t", "border-w-b"],
				"border-color": [
					"border-color-x",
					"border-color-y",
					"border-color-s",
					"border-color-e",
					"border-color-t",
					"border-color-r",
					"border-color-b",
					"border-color-l"
				],
				"border-color-x": ["border-color-r", "border-color-l"],
				"border-color-y": ["border-color-t", "border-color-b"],
				translate: [
					"translate-x",
					"translate-y",
					"translate-none"
				],
				"translate-none": [
					"translate",
					"translate-x",
					"translate-y",
					"translate-z"
				],
				"scroll-m": [
					"scroll-mx",
					"scroll-my",
					"scroll-ms",
					"scroll-me",
					"scroll-mt",
					"scroll-mr",
					"scroll-mb",
					"scroll-ml"
				],
				"scroll-mx": ["scroll-mr", "scroll-ml"],
				"scroll-my": ["scroll-mt", "scroll-mb"],
				"scroll-p": [
					"scroll-px",
					"scroll-py",
					"scroll-ps",
					"scroll-pe",
					"scroll-pt",
					"scroll-pr",
					"scroll-pb",
					"scroll-pl"
				],
				"scroll-px": ["scroll-pr", "scroll-pl"],
				"scroll-py": ["scroll-pt", "scroll-pb"],
				touch: [
					"touch-x",
					"touch-y",
					"touch-pz"
				],
				"touch-x": ["touch"],
				"touch-y": ["touch"],
				"touch-pz": ["touch"]
			},
			conflictingClassGroupModifiers: { "font-size": ["leading"] },
			orderSensitiveModifiers: [
				"*",
				"**",
				"after",
				"backdrop",
				"before",
				"details-content",
				"file",
				"first-letter",
				"first-line",
				"marker",
				"placeholder",
				"selection"
			]
		};
	};
	var twMerge = /* @__PURE__ */ createTailwindMerge(getDefaultConfig);
	function cn(...inputs) {
		return twMerge(clsx(inputs));
	}
	var buttonVariants = cva("inline-flex items-center justify-center gap-2 whitespace-nowrap rounded-md text-sm font-medium transition-all disabled:pointer-events-none disabled:opacity-50 [&_svg]:pointer-events-none [&_svg:not([class*='size-'])]:size-4 shrink-0 [&_svg]:shrink-0 outline-none focus-visible:border-ring focus-visible:ring-ring/50 focus-visible:ring-[3px] aria-invalid:ring-destructive/20 dark:aria-invalid:ring-destructive/40 aria-invalid:border-destructive", {
		variants: {
			variant: {
				default: "bg-primary text-primary-foreground hover:bg-primary/90",
				destructive: "bg-destructive text-white hover:bg-destructive/90 focus-visible:ring-destructive/20 dark:focus-visible:ring-destructive/40 dark:bg-destructive/60",
				outline: "border bg-background shadow-xs hover:bg-accent hover:text-accent-foreground dark:bg-input/30 dark:border-input dark:hover:bg-input/50",
				secondary: "bg-secondary text-secondary-foreground hover:bg-secondary/80",
				ghost: "hover:bg-accent hover:text-accent-foreground dark:hover:bg-accent/50",
				link: "text-primary underline-offset-4 hover:underline"
			},
			size: {
				default: "h-9 px-4 py-2 has-[>svg]:px-3",
				sm: "h-8 rounded-md gap-1.5 px-3 has-[>svg]:px-2.5",
				lg: "h-10 rounded-md px-6 has-[>svg]:px-4",
				icon: "size-9",
				"icon-sm": "size-8",
				"icon-lg": "size-10"
			}
		},
		defaultVariants: {
			variant: "default",
			size: "default"
		}
	});
	function Button({ className, variant, size, asChild = false, ...props }) {
		return /* @__PURE__ */ (0, import_jsx_runtime.jsx)(asChild ? Slot : "button", {
			"data-slot": "button",
			className: cn(buttonVariants({
				variant,
				size,
				className
			})),
			...props
		});
	}
	function SubmitView({ organizationId, ssoToken: ssoToken$1 }) {
		const [description, setDescription] = (0, import_react.useState)("");
		const { mutate: createIdea, isPending } = useMutation({
			mutationFn: createWidgetIdea,
			onSuccess: () => {
				toast.success("Feedback submitted!");
				setDescription("");
			},
			onError: () => {
				toast.error("Failed to submit feedback");
			}
		});
		const handleSubmit = (e) => {
			e.preventDefault();
			createIdea({
				title: description.slice(0, 50),
				description,
				organizationId,
				token: ssoToken$1
			});
		};
		return /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
			className: "flex flex-1 flex-col gap-8",
			children: [/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
				className: "border-b px-6 pb-6",
				children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)("h2", {
					className: "text-2xl font-bold",
					children: "Submit Idea"
				}), /* @__PURE__ */ (0, import_jsx_runtime.jsx)("p", {
					className: "text-muted-foreground",
					children: "Share your ideas or suggestions"
				})]
			}), /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("form", {
				onSubmit: handleSubmit,
				className: "flex flex-1 flex-col gap-8 px-6 pb-6",
				children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)("textarea", {
					placeholder: "Type your idea here...",
					value: description,
					onChange: (e) => setDescription(e.target.value),
					className: "placeholder:text-muted-foreground field-sizing-content w-full resize-none text-base outline-none md:text-sm",
					required: true
				}), description.length > 0 && /* @__PURE__ */ (0, import_jsx_runtime.jsx)("div", {
					className: "animate-in fade-in mt-auto pt-2 duration-200",
					children: /* @__PURE__ */ (0, import_jsx_runtime.jsx)(Button, {
						type: "submit",
						className: "w-full",
						disabled: isPending || !description,
						children: isPending ? "Sending..." : "Submit Idea"
					})
				})]
			})]
		});
	}
	function WidgetLayout({ children, activeTab, onTabChange, onClose }) {
		return /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
			className: "bg-background text-foreground animate-in slide-in-from-bottom-4 fade-in fixed top-4 right-4 bottom-4 z-50 flex w-[380px] flex-col overflow-hidden rounded-2xl border shadow-2xl duration-100",
			children: [/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
				className: "flex flex-1 grow flex-col overflow-hidden",
				children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)("div", {
					className: "flex items-center justify-end px-4 py-4",
					children: /* @__PURE__ */ (0, import_jsx_runtime.jsx)(Button, {
						variant: "outline",
						size: "icon",
						className: "size-7",
						onClick: onClose,
						children: /* @__PURE__ */ (0, import_jsx_runtime.jsx)(X, {})
					})
				}), children]
			}), /* @__PURE__ */ (0, import_jsx_runtime.jsx)("div", {
				className: "bg-muted/20 border-t p-2",
				children: /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
					className: "flex justify-around",
					children: [
						/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("button", {
							onClick: () => onTabChange("feedback"),
							className: cn("hover:bg-muted flex flex-col items-center gap-1 rounded-lg p-2 text-xs font-medium transition-colors", activeTab === "feedback" ? "text-foreground" : "text-muted-foreground"),
							children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)(MessageCircleHeart, { className: "size-5" }), "Feedback"]
						}),
						/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("button", {
							onClick: () => onTabChange("roadmap"),
							className: cn("hover:bg-muted flex flex-col items-center gap-1 rounded-lg p-2 text-xs font-medium transition-colors", activeTab === "roadmap" ? "text-foreground" : "text-muted-foreground"),
							children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)(Map$1, { className: "h-5 w-5" }), "Roadmap"]
						}),
						/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("button", {
							onClick: () => onTabChange("updates"),
							className: cn("hover:bg-muted flex flex-col items-center gap-1 rounded-lg p-2 text-xs font-medium transition-colors", activeTab === "updates" ? "text-foreground" : "text-muted-foreground"),
							children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)(Gift, { className: "h-5 w-5" }), "Updates"]
						})
					]
				})
			})]
		});
	}
	function FeedbackWidget({ organizationId, isOpen, onClose, ssoToken: ssoToken$1 }) {
		const [activeTab, setActiveTab] = (0, import_react.useState)("feedback");
		if (!isOpen) return null;
		return /* @__PURE__ */ (0, import_jsx_runtime.jsxs)(WidgetLayout, {
			activeTab,
			onTabChange: setActiveTab,
			onClose,
			children: [
				activeTab === "feedback" && /* @__PURE__ */ (0, import_jsx_runtime.jsx)(SubmitView, {
					organizationId,
					ssoToken: ssoToken$1
				}),
				activeTab === "roadmap" && /* @__PURE__ */ (0, import_jsx_runtime.jsx)(RoadmapView, {
					organizationId,
					ssoToken: ssoToken$1
				}),
				activeTab === "updates" && /* @__PURE__ */ (0, import_jsx_runtime.jsx)(ChangelogView, {})
			]
		});
	}
	var styles_default = "/*! tailwindcss v4.1.17 | MIT License | https://tailwindcss.com */\n@layer properties {\n  @supports (((-webkit-hyphens: none)) and (not (margin-trim: inline))) or ((-moz-orient: inline) and (not (color: rgb(from red r g b)))) {\n    *, :before, :after, ::backdrop {\n      --tw-translate-x: 0;\n      --tw-translate-y: 0;\n      --tw-translate-z: 0;\n      --tw-scale-x: 1;\n      --tw-scale-y: 1;\n      --tw-scale-z: 1;\n      --tw-rotate-x: initial;\n      --tw-rotate-y: initial;\n      --tw-rotate-z: initial;\n      --tw-skew-x: initial;\n      --tw-skew-y: initial;\n      --tw-space-y-reverse: 0;\n      --tw-space-x-reverse: 0;\n      --tw-divide-y-reverse: 0;\n      --tw-border-style: solid;\n      --tw-leading: initial;\n      --tw-font-weight: initial;\n      --tw-tracking: initial;\n      --tw-ordinal: initial;\n      --tw-slashed-zero: initial;\n      --tw-numeric-figure: initial;\n      --tw-numeric-spacing: initial;\n      --tw-numeric-fraction: initial;\n      --tw-shadow: 0 0 #0000;\n      --tw-shadow-color: initial;\n      --tw-shadow-alpha: 100%;\n      --tw-inset-shadow: 0 0 #0000;\n      --tw-inset-shadow-color: initial;\n      --tw-inset-shadow-alpha: 100%;\n      --tw-ring-color: initial;\n      --tw-ring-shadow: 0 0 #0000;\n      --tw-inset-ring-color: initial;\n      --tw-inset-ring-shadow: 0 0 #0000;\n      --tw-ring-inset: initial;\n      --tw-ring-offset-width: 0px;\n      --tw-ring-offset-color: #fff;\n      --tw-ring-offset-shadow: 0 0 #0000;\n      --tw-outline-style: solid;\n      --tw-blur: initial;\n      --tw-brightness: initial;\n      --tw-contrast: initial;\n      --tw-grayscale: initial;\n      --tw-hue-rotate: initial;\n      --tw-invert: initial;\n      --tw-opacity: initial;\n      --tw-saturate: initial;\n      --tw-sepia: initial;\n      --tw-drop-shadow: initial;\n      --tw-drop-shadow-color: initial;\n      --tw-drop-shadow-alpha: 100%;\n      --tw-drop-shadow-size: initial;\n      --tw-backdrop-blur: initial;\n      --tw-backdrop-brightness: initial;\n      --tw-backdrop-contrast: initial;\n      --tw-backdrop-grayscale: initial;\n      --tw-backdrop-hue-rotate: initial;\n      --tw-backdrop-invert: initial;\n      --tw-backdrop-opacity: initial;\n      --tw-backdrop-saturate: initial;\n      --tw-backdrop-sepia: initial;\n      --tw-duration: initial;\n      --tw-ease: initial;\n      --tw-content: \"\";\n      --tw-animation-delay: 0s;\n      --tw-animation-direction: normal;\n      --tw-animation-duration: initial;\n      --tw-animation-fill-mode: none;\n      --tw-animation-iteration-count: 1;\n      --tw-enter-blur: 0;\n      --tw-enter-opacity: 1;\n      --tw-enter-rotate: 0;\n      --tw-enter-scale: 1;\n      --tw-enter-translate-x: 0;\n      --tw-enter-translate-y: 0;\n      --tw-exit-blur: 0;\n      --tw-exit-opacity: 1;\n      --tw-exit-rotate: 0;\n      --tw-exit-scale: 1;\n      --tw-exit-translate-x: 0;\n      --tw-exit-translate-y: 0;\n    }\n  }\n}\n\n@layer theme {\n  :root, :host {\n    --font-sans: ui-sans-serif, system-ui, sans-serif, \"Apple Color Emoji\", \"Segoe UI Emoji\", \"Segoe UI Symbol\", \"Noto Color Emoji\";\n    --font-mono: ui-monospace, SFMono-Regular, Menlo, Monaco, Consolas, \"Liberation Mono\", \"Courier New\", monospace;\n    --color-red-500: oklch(63.7% .237 25.331);\n    --color-red-600: oklch(57.7% .245 27.325);\n    --color-orange-500: oklch(70.5% .213 47.604);\n    --color-yellow-500: oklch(79.5% .184 86.047);\n    --color-green-500: oklch(72.3% .219 149.579);\n    --color-green-600: oklch(62.7% .194 149.214);\n    --color-green-700: oklch(52.7% .154 150.069);\n    --color-blue-50: oklch(97% .014 254.604);\n    --color-blue-100: oklch(93.2% .032 255.585);\n    --color-blue-500: oklch(62.3% .214 259.815);\n    --color-blue-600: oklch(54.6% .245 262.881);\n    --color-purple-100: oklch(94.6% .033 307.174);\n    --color-purple-500: oklch(62.7% .265 303.9);\n    --color-gray-400: oklch(70.7% .022 261.325);\n    --color-gray-500: oklch(55.1% .027 264.364);\n    --color-black: #000;\n    --color-white: #fff;\n    --spacing: .25rem;\n    --container-sm: 24rem;\n    --container-md: 28rem;\n    --container-2xl: 42rem;\n    --container-4xl: 56rem;\n    --container-6xl: 72rem;\n    --text-xs: .75rem;\n    --text-xs--line-height: calc(1 / .75);\n    --text-sm: .875rem;\n    --text-sm--line-height: calc(1.25 / .875);\n    --text-base: 1rem;\n    --text-base--line-height: calc(1.5 / 1);\n    --text-lg: 1.125rem;\n    --text-lg--line-height: calc(1.75 / 1.125);\n    --text-xl: 1.25rem;\n    --text-xl--line-height: calc(1.75 / 1.25);\n    --text-2xl: 1.5rem;\n    --text-2xl--line-height: calc(2 / 1.5);\n    --text-3xl: 1.875rem;\n    --text-3xl--line-height: calc(2.25 / 1.875);\n    --text-4xl: 2.25rem;\n    --text-4xl--line-height: calc(2.5 / 2.25);\n    --font-weight-light: 300;\n    --font-weight-normal: 400;\n    --font-weight-medium: 500;\n    --font-weight-semibold: 600;\n    --font-weight-bold: 700;\n    --tracking-tight: -.025em;\n    --tracking-wider: .05em;\n    --tracking-widest: .1em;\n    --leading-tight: 1.25;\n    --radius-xs: .125rem;\n    --radius-2xl: 1rem;\n    --ease-in-out: cubic-bezier(.4, 0, .2, 1);\n    --animate-spin: spin 1s linear infinite;\n    --animate-pulse: pulse 2s cubic-bezier(.4, 0, .6, 1) infinite;\n    --default-transition-duration: .15s;\n    --default-transition-timing-function: cubic-bezier(.4, 0, .2, 1);\n    --default-font-family: var(--font-sans);\n    --default-mono-font-family: var(--font-mono);\n    --radius: .625rem;\n    --background: oklch(100% 0 0);\n    --foreground: oklch(14.1% .005 285.823);\n    --card: oklch(100% 0 0);\n    --card-foreground: oklch(14.1% .005 285.823);\n    --popover: oklch(100% 0 0);\n    --popover-foreground: oklch(14.1% .005 285.823);\n    --primary: oklch(21% .006 285.885);\n    --primary-foreground: oklch(98.5% 0 0);\n    --secondary: oklch(96.7% .001 286.375);\n    --secondary-foreground: oklch(21% .006 285.885);\n    --muted: oklch(96.7% .001 286.375);\n    --muted-foreground: oklch(55.2% .016 285.938);\n    --accent: oklch(96.7% .001 286.375);\n    --accent-foreground: oklch(21% .006 285.885);\n    --destructive: oklch(57.7% .245 27.325);\n    --border: oklch(92% .004 286.32);\n    --input: oklch(92% .004 286.32);\n    --ring: oklch(70.5% .015 286.067);\n    --chart-1: oklch(64.6% .222 41.116);\n    --chart-2: oklch(60% .118 184.704);\n    --chart-3: oklch(39.8% .07 227.392);\n    --chart-4: oklch(82.8% .189 84.429);\n    --chart-5: oklch(76.9% .188 70.08);\n    --sidebar: oklch(98.5% 0 0);\n    --sidebar-foreground: oklch(14.1% .005 285.823);\n    --sidebar-primary: oklch(21% .006 285.885);\n    --sidebar-primary-foreground: oklch(98.5% 0 0);\n    --sidebar-accent: oklch(96.7% .001 286.375);\n    --sidebar-accent-foreground: oklch(21% .006 285.885);\n    --sidebar-border: oklch(92% .004 286.32);\n    --sidebar-ring: oklch(70.5% .015 286.067);\n  }\n}\n\n@layer base {\n  *, :after, :before, ::backdrop {\n    box-sizing: border-box;\n    border: 0 solid;\n    margin: 0;\n    padding: 0;\n  }\n\n  ::file-selector-button {\n    box-sizing: border-box;\n    border: 0 solid;\n    margin: 0;\n    padding: 0;\n  }\n\n  html, :host {\n    -webkit-text-size-adjust: 100%;\n    tab-size: 4;\n    line-height: 1.5;\n    font-family: var(--default-font-family, ui-sans-serif, system-ui, sans-serif, \"Apple Color Emoji\", \"Segoe UI Emoji\", \"Segoe UI Symbol\", \"Noto Color Emoji\");\n    font-feature-settings: var(--default-font-feature-settings, normal);\n    font-variation-settings: var(--default-font-variation-settings, normal);\n    -webkit-tap-highlight-color: transparent;\n  }\n\n  hr {\n    height: 0;\n    color: inherit;\n    border-top-width: 1px;\n  }\n\n  abbr:where([title]) {\n    -webkit-text-decoration: underline dotted;\n    text-decoration: underline dotted;\n  }\n\n  h1, h2, h3, h4, h5, h6 {\n    font-size: inherit;\n    font-weight: inherit;\n  }\n\n  a {\n    color: inherit;\n    -webkit-text-decoration: inherit;\n    -webkit-text-decoration: inherit;\n    -webkit-text-decoration: inherit;\n    text-decoration: inherit;\n  }\n\n  b, strong {\n    font-weight: bolder;\n  }\n\n  code, kbd, samp, pre {\n    font-family: var(--default-mono-font-family, ui-monospace, SFMono-Regular, Menlo, Monaco, Consolas, \"Liberation Mono\", \"Courier New\", monospace);\n    font-feature-settings: var(--default-mono-font-feature-settings, normal);\n    font-variation-settings: var(--default-mono-font-variation-settings, normal);\n    font-size: 1em;\n  }\n\n  small {\n    font-size: 80%;\n  }\n\n  sub, sup {\n    vertical-align: baseline;\n    font-size: 75%;\n    line-height: 0;\n    position: relative;\n  }\n\n  sub {\n    bottom: -.25em;\n  }\n\n  sup {\n    top: -.5em;\n  }\n\n  table {\n    text-indent: 0;\n    border-color: inherit;\n    border-collapse: collapse;\n  }\n\n  :-moz-focusring {\n    outline: auto;\n  }\n\n  progress {\n    vertical-align: baseline;\n  }\n\n  summary {\n    display: list-item;\n  }\n\n  ol, ul, menu {\n    list-style: none;\n  }\n\n  img, svg, video, canvas, audio, iframe, embed, object {\n    vertical-align: middle;\n    display: block;\n  }\n\n  img, video {\n    max-width: 100%;\n    height: auto;\n  }\n\n  button, input, select, optgroup, textarea {\n    font: inherit;\n    font-feature-settings: inherit;\n    font-variation-settings: inherit;\n    letter-spacing: inherit;\n    color: inherit;\n    opacity: 1;\n    background-color: #0000;\n    border-radius: 0;\n  }\n\n  ::file-selector-button {\n    font: inherit;\n    font-feature-settings: inherit;\n    font-variation-settings: inherit;\n    letter-spacing: inherit;\n    color: inherit;\n    opacity: 1;\n    background-color: #0000;\n    border-radius: 0;\n  }\n\n  :where(select:is([multiple], [size])) optgroup {\n    font-weight: bolder;\n  }\n\n  :where(select:is([multiple], [size])) optgroup option {\n    padding-inline-start: 20px;\n  }\n\n  ::file-selector-button {\n    margin-inline-end: 4px;\n  }\n\n  ::placeholder {\n    opacity: 1;\n  }\n\n  @supports (not ((-webkit-appearance: -apple-pay-button))) or (contain-intrinsic-size: 1px) {\n    ::placeholder {\n      color: currentColor;\n    }\n\n    @supports (color: color-mix(in lab, red, red)) {\n      ::placeholder {\n        color: color-mix(in oklab, currentcolor 50%, transparent);\n      }\n    }\n  }\n\n  textarea {\n    resize: vertical;\n  }\n\n  ::-webkit-search-decoration {\n    -webkit-appearance: none;\n  }\n\n  ::-webkit-date-and-time-value {\n    min-height: 1lh;\n    text-align: inherit;\n  }\n\n  ::-webkit-datetime-edit {\n    display: inline-flex;\n  }\n\n  ::-webkit-datetime-edit-fields-wrapper {\n    padding: 0;\n  }\n\n  ::-webkit-datetime-edit {\n    padding-block: 0;\n  }\n\n  ::-webkit-datetime-edit-year-field {\n    padding-block: 0;\n  }\n\n  ::-webkit-datetime-edit-month-field {\n    padding-block: 0;\n  }\n\n  ::-webkit-datetime-edit-day-field {\n    padding-block: 0;\n  }\n\n  ::-webkit-datetime-edit-hour-field {\n    padding-block: 0;\n  }\n\n  ::-webkit-datetime-edit-minute-field {\n    padding-block: 0;\n  }\n\n  ::-webkit-datetime-edit-second-field {\n    padding-block: 0;\n  }\n\n  ::-webkit-datetime-edit-millisecond-field {\n    padding-block: 0;\n  }\n\n  ::-webkit-datetime-edit-meridiem-field {\n    padding-block: 0;\n  }\n\n  ::-webkit-calendar-picker-indicator {\n    line-height: 1;\n  }\n\n  :-moz-ui-invalid {\n    box-shadow: none;\n  }\n\n  button, input:where([type=\"button\"], [type=\"reset\"], [type=\"submit\"]) {\n    appearance: button;\n  }\n\n  ::file-selector-button {\n    appearance: button;\n  }\n\n  ::-webkit-inner-spin-button {\n    height: auto;\n  }\n\n  ::-webkit-outer-spin-button {\n    height: auto;\n  }\n\n  [hidden]:where(:not([hidden=\"until-found\"])) {\n    display: none !important;\n  }\n\n  * {\n    border-color: var(--border);\n    outline-color: #9f9fa980;\n  }\n\n  @supports (color: color-mix(in lab, red, red)) {\n    * {\n      outline-color: color-mix(in oklab, var(--ring) 50%, transparent);\n    }\n  }\n\n  :host {\n    background-color: var(--background);\n    color: var(--foreground);\n  }\n\n  button:not(:disabled), [role=\"button\"]:not(:disabled) {\n    cursor: pointer;\n  }\n}\n\n@layer components;\n\n@layer utilities {\n  .\\@container\\/card-header {\n    container: card-header / inline-size;\n  }\n\n  .pointer-events-none {\n    pointer-events: none;\n  }\n\n  .sr-only {\n    clip-path: inset(50%);\n    white-space: nowrap;\n    border-width: 0;\n    width: 1px;\n    height: 1px;\n    margin: -1px;\n    padding: 0;\n    position: absolute;\n    overflow: hidden;\n  }\n\n  .absolute {\n    position: absolute;\n  }\n\n  .fixed {\n    position: fixed;\n  }\n\n  .relative {\n    position: relative;\n  }\n\n  .sticky {\n    position: sticky;\n  }\n\n  .inset-0 {\n    inset: calc(var(--spacing) * 0);\n  }\n\n  .inset-x-0 {\n    inset-inline: calc(var(--spacing) * 0);\n  }\n\n  .inset-y-0 {\n    inset-block: calc(var(--spacing) * 0);\n  }\n\n  .top-0 {\n    top: calc(var(--spacing) * 0);\n  }\n\n  .top-1\\.5 {\n    top: calc(var(--spacing) * 1.5);\n  }\n\n  .top-2\\.5 {\n    top: calc(var(--spacing) * 2.5);\n  }\n\n  .top-3\\.5 {\n    top: calc(var(--spacing) * 3.5);\n  }\n\n  .top-4 {\n    top: calc(var(--spacing) * 4);\n  }\n\n  .top-10 {\n    top: calc(var(--spacing) * 10);\n  }\n\n  .top-16 {\n    top: calc(var(--spacing) * 16);\n  }\n\n  .top-\\[50\\%\\] {\n    top: 50%;\n  }\n\n  .right-0 {\n    right: calc(var(--spacing) * 0);\n  }\n\n  .right-1 {\n    right: calc(var(--spacing) * 1);\n  }\n\n  .right-2 {\n    right: calc(var(--spacing) * 2);\n  }\n\n  .right-3 {\n    right: calc(var(--spacing) * 3);\n  }\n\n  .right-4 {\n    right: calc(var(--spacing) * 4);\n  }\n\n  .bottom-0 {\n    bottom: calc(var(--spacing) * 0);\n  }\n\n  .bottom-2 {\n    bottom: calc(var(--spacing) * 2);\n  }\n\n  .bottom-4 {\n    bottom: calc(var(--spacing) * 4);\n  }\n\n  .left-0 {\n    left: calc(var(--spacing) * 0);\n  }\n\n  .left-2 {\n    left: calc(var(--spacing) * 2);\n  }\n\n  .left-4 {\n    left: calc(var(--spacing) * 4);\n  }\n\n  .left-\\[50\\%\\] {\n    left: 50%;\n  }\n\n  .z-0 {\n    z-index: 0;\n  }\n\n  .z-10 {\n    z-index: 10;\n  }\n\n  .z-20 {\n    z-index: 20;\n  }\n\n  .z-50 {\n    z-index: 50;\n  }\n\n  .col-span-1 {\n    grid-column: span 1 / span 1;\n  }\n\n  .col-start-2 {\n    grid-column-start: 2;\n  }\n\n  .row-span-2 {\n    grid-row: span 2 / span 2;\n  }\n\n  .row-start-1 {\n    grid-row-start: 1;\n  }\n\n  .container {\n    width: 100%;\n  }\n\n  @media (min-width: 40rem) {\n    .container {\n      max-width: 40rem;\n    }\n  }\n\n  @media (min-width: 48rem) {\n    .container {\n      max-width: 48rem;\n    }\n  }\n\n  @media (min-width: 64rem) {\n    .container {\n      max-width: 64rem;\n    }\n  }\n\n  @media (min-width: 80rem) {\n    .container {\n      max-width: 80rem;\n    }\n  }\n\n  @media (min-width: 96rem) {\n    .container {\n      max-width: 96rem;\n    }\n  }\n\n  .-mx-1 {\n    margin-inline: calc(var(--spacing) * -1);\n  }\n\n  .mx-2 {\n    margin-inline: calc(var(--spacing) * 2);\n  }\n\n  .mx-3\\.5 {\n    margin-inline: calc(var(--spacing) * 3.5);\n  }\n\n  .mx-auto {\n    margin-inline: auto;\n  }\n\n  .my-1 {\n    margin-block: calc(var(--spacing) * 1);\n  }\n\n  .mt-0\\.5 {\n    margin-top: calc(var(--spacing) * .5);\n  }\n\n  .mt-1 {\n    margin-top: calc(var(--spacing) * 1);\n  }\n\n  .mt-2 {\n    margin-top: calc(var(--spacing) * 2);\n  }\n\n  .mt-3 {\n    margin-top: calc(var(--spacing) * 3);\n  }\n\n  .mt-4 {\n    margin-top: calc(var(--spacing) * 4);\n  }\n\n  .mt-6 {\n    margin-top: calc(var(--spacing) * 6);\n  }\n\n  .mt-8 {\n    margin-top: calc(var(--spacing) * 8);\n  }\n\n  .mt-auto {\n    margin-top: auto;\n  }\n\n  .mt-px {\n    margin-top: 1px;\n  }\n\n  .mr-0\\.5 {\n    margin-right: calc(var(--spacing) * .5);\n  }\n\n  .mr-2 {\n    margin-right: calc(var(--spacing) * 2);\n  }\n\n  .mb-1 {\n    margin-bottom: calc(var(--spacing) * 1);\n  }\n\n  .mb-2 {\n    margin-bottom: calc(var(--spacing) * 2);\n  }\n\n  .mb-3 {\n    margin-bottom: calc(var(--spacing) * 3);\n  }\n\n  .mb-4 {\n    margin-bottom: calc(var(--spacing) * 4);\n  }\n\n  .mb-5 {\n    margin-bottom: calc(var(--spacing) * 5);\n  }\n\n  .mb-6 {\n    margin-bottom: calc(var(--spacing) * 6);\n  }\n\n  .mb-8 {\n    margin-bottom: calc(var(--spacing) * 8);\n  }\n\n  .-ml-2 {\n    margin-left: calc(var(--spacing) * -2);\n  }\n\n  .ml-2 {\n    margin-left: calc(var(--spacing) * 2);\n  }\n\n  .ml-2\\.5 {\n    margin-left: calc(var(--spacing) * 2.5);\n  }\n\n  .ml-auto {\n    margin-left: auto;\n  }\n\n  .line-clamp-2 {\n    -webkit-line-clamp: 2;\n    -webkit-box-orient: vertical;\n    display: -webkit-box;\n    overflow: hidden;\n  }\n\n  .line-clamp-3 {\n    -webkit-line-clamp: 3;\n    -webkit-box-orient: vertical;\n    display: -webkit-box;\n    overflow: hidden;\n  }\n\n  .block {\n    display: block;\n  }\n\n  .flex {\n    display: flex;\n  }\n\n  .grid {\n    display: grid;\n  }\n\n  .hidden {\n    display: none;\n  }\n\n  .inline-flex {\n    display: inline-flex;\n  }\n\n  .table {\n    display: table;\n  }\n\n  .table-caption {\n    display: table-caption;\n  }\n\n  .table-cell {\n    display: table-cell;\n  }\n\n  .table-row {\n    display: table-row;\n  }\n\n  .field-sizing-content {\n    field-sizing: content;\n  }\n\n  .aspect-square {\n    aspect-ratio: 1;\n  }\n\n  .size-2 {\n    width: calc(var(--spacing) * 2);\n    height: calc(var(--spacing) * 2);\n  }\n\n  .size-2\\.5 {\n    width: calc(var(--spacing) * 2.5);\n    height: calc(var(--spacing) * 2.5);\n  }\n\n  .size-3 {\n    width: calc(var(--spacing) * 3);\n    height: calc(var(--spacing) * 3);\n  }\n\n  .size-3\\.5 {\n    width: calc(var(--spacing) * 3.5);\n    height: calc(var(--spacing) * 3.5);\n  }\n\n  .size-4 {\n    width: calc(var(--spacing) * 4);\n    height: calc(var(--spacing) * 4);\n  }\n\n  .size-4\\! {\n    width: calc(var(--spacing) * 4) !important;\n    height: calc(var(--spacing) * 4) !important;\n  }\n\n  .size-5 {\n    width: calc(var(--spacing) * 5);\n    height: calc(var(--spacing) * 5);\n  }\n\n  .size-5\\.5\\! {\n    width: calc(var(--spacing) * 5.5) !important;\n    height: calc(var(--spacing) * 5.5) !important;\n  }\n\n  .size-6 {\n    width: calc(var(--spacing) * 6);\n    height: calc(var(--spacing) * 6);\n  }\n\n  .size-7 {\n    width: calc(var(--spacing) * 7);\n    height: calc(var(--spacing) * 7);\n  }\n\n  .size-8 {\n    width: calc(var(--spacing) * 8);\n    height: calc(var(--spacing) * 8);\n  }\n\n  .size-9 {\n    width: calc(var(--spacing) * 9);\n    height: calc(var(--spacing) * 9);\n  }\n\n  .size-10 {\n    width: calc(var(--spacing) * 10);\n    height: calc(var(--spacing) * 10);\n  }\n\n  .size-full {\n    width: 100%;\n    height: 100%;\n  }\n\n  .h-2 {\n    height: calc(var(--spacing) * 2);\n  }\n\n  .h-3 {\n    height: calc(var(--spacing) * 3);\n  }\n\n  .h-4 {\n    height: calc(var(--spacing) * 4);\n  }\n\n  .h-5 {\n    height: calc(var(--spacing) * 5);\n  }\n\n  .h-6 {\n    height: calc(var(--spacing) * 6);\n  }\n\n  .h-7 {\n    height: calc(var(--spacing) * 7);\n  }\n\n  .h-8 {\n    height: calc(var(--spacing) * 8);\n  }\n\n  .h-9 {\n    height: calc(var(--spacing) * 9);\n  }\n\n  .h-10 {\n    height: calc(var(--spacing) * 10);\n  }\n\n  .h-12 {\n    height: calc(var(--spacing) * 12);\n  }\n\n  .h-14 {\n    height: calc(var(--spacing) * 14);\n  }\n\n  .h-16 {\n    height: calc(var(--spacing) * 16);\n  }\n\n  .h-24 {\n    height: calc(var(--spacing) * 24);\n  }\n\n  .h-\\[1\\.2rem\\] {\n    height: 1.2rem;\n  }\n\n  .h-\\[1\\.15rem\\] {\n    height: 1.15rem;\n  }\n\n  .h-\\[90vh\\] {\n    height: 90vh;\n  }\n\n  .h-\\[calc\\(100\\%-1px\\)\\] {\n    height: calc(100% - 1px);\n  }\n\n  .h-\\[var\\(--radix-select-trigger-height\\)\\] {\n    height: var(--radix-select-trigger-height);\n  }\n\n  .h-auto {\n    height: auto;\n  }\n\n  .h-fit {\n    height: fit-content;\n  }\n\n  .h-full {\n    height: 100%;\n  }\n\n  .h-px {\n    height: 1px;\n  }\n\n  .h-svh {\n    height: 100svh;\n  }\n\n  .max-h-\\(--radix-dropdown-menu-content-available-height\\) {\n    max-height: var(--radix-dropdown-menu-content-available-height);\n  }\n\n  .max-h-\\(--radix-select-content-available-height\\) {\n    max-height: var(--radix-select-content-available-height);\n  }\n\n  .min-h-0 {\n    min-height: calc(var(--spacing) * 0);\n  }\n\n  .min-h-\\[60px\\] {\n    min-height: 60px;\n  }\n\n  .min-h-\\[100px\\] {\n    min-height: 100px;\n  }\n\n  .min-h-\\[150px\\] {\n    min-height: 150px;\n  }\n\n  .min-h-screen {\n    min-height: 100vh;\n  }\n\n  .min-h-svh {\n    min-height: 100svh;\n  }\n\n  .w-\\(--sidebar-width\\) {\n    width: var(--sidebar-width);\n  }\n\n  .w-2 {\n    width: calc(var(--spacing) * 2);\n  }\n\n  .w-3 {\n    width: calc(var(--spacing) * 3);\n  }\n\n  .w-3\\/4 {\n    width: 75%;\n  }\n\n  .w-4 {\n    width: calc(var(--spacing) * 4);\n  }\n\n  .w-5 {\n    width: calc(var(--spacing) * 5);\n  }\n\n  .w-6 {\n    width: calc(var(--spacing) * 6);\n  }\n\n  .w-7 {\n    width: calc(var(--spacing) * 7);\n  }\n\n  .w-8 {\n    width: calc(var(--spacing) * 8);\n  }\n\n  .w-9 {\n    width: calc(var(--spacing) * 9);\n  }\n\n  .w-10 {\n    width: calc(var(--spacing) * 10);\n  }\n\n  .w-12 {\n    width: calc(var(--spacing) * 12);\n  }\n\n  .w-14 {\n    width: calc(var(--spacing) * 14);\n  }\n\n  .w-16 {\n    width: calc(var(--spacing) * 16);\n  }\n\n  .w-24 {\n    width: calc(var(--spacing) * 24);\n  }\n\n  .w-80 {\n    width: calc(var(--spacing) * 80);\n  }\n\n  .w-\\[--radix-dropdown-menu-trigger-width\\] {\n    width: --radix-dropdown-menu-trigger-width;\n  }\n\n  .w-\\[1\\.2rem\\] {\n    width: 1.2rem;\n  }\n\n  .w-\\[50px\\] {\n    width: 50px;\n  }\n\n  .w-\\[110px\\] {\n    width: 110px;\n  }\n\n  .w-\\[130px\\] {\n    width: 130px;\n  }\n\n  .w-\\[200px\\] {\n    width: 200px;\n  }\n\n  .w-\\[380px\\] {\n    width: 380px;\n  }\n\n  .w-auto {\n    width: auto;\n  }\n\n  .w-fit {\n    width: fit-content;\n  }\n\n  .w-full {\n    width: 100%;\n  }\n\n  .w-px {\n    width: 1px;\n  }\n\n  .max-w-\\(--skeleton-width\\) {\n    max-width: var(--skeleton-width);\n  }\n\n  .max-w-2xl {\n    max-width: var(--container-2xl);\n  }\n\n  .max-w-4xl {\n    max-width: var(--container-4xl);\n  }\n\n  .max-w-6xl {\n    max-width: var(--container-6xl);\n  }\n\n  .max-w-\\[120px\\] {\n    max-width: 120px;\n  }\n\n  .max-w-\\[200px\\] {\n    max-width: 200px;\n  }\n\n  .max-w-\\[calc\\(100\\%-2rem\\)\\] {\n    max-width: calc(100% - 2rem);\n  }\n\n  .max-w-md {\n    max-width: var(--container-md);\n  }\n\n  .max-w-none {\n    max-width: none;\n  }\n\n  .max-w-screen {\n    max-width: 100vw;\n  }\n\n  .max-w-sm {\n    max-width: var(--container-sm);\n  }\n\n  .min-w-0 {\n    min-width: calc(var(--spacing) * 0);\n  }\n\n  .min-w-5 {\n    min-width: calc(var(--spacing) * 5);\n  }\n\n  .min-w-56 {\n    min-width: calc(var(--spacing) * 56);\n  }\n\n  .min-w-\\[8rem\\] {\n    min-width: 8rem;\n  }\n\n  .min-w-\\[var\\(--radix-select-trigger-width\\)\\] {\n    min-width: var(--radix-select-trigger-width);\n  }\n\n  .flex-1 {\n    flex: 1;\n  }\n\n  .flex-shrink-0, .shrink-0 {\n    flex-shrink: 0;\n  }\n\n  .grow {\n    flex-grow: 1;\n  }\n\n  .caption-bottom {\n    caption-side: bottom;\n  }\n\n  .origin-\\(--radix-dropdown-menu-content-transform-origin\\) {\n    transform-origin: var(--radix-dropdown-menu-content-transform-origin);\n  }\n\n  .origin-\\(--radix-select-content-transform-origin\\) {\n    transform-origin: var(--radix-select-content-transform-origin);\n  }\n\n  .origin-\\(--radix-tooltip-content-transform-origin\\) {\n    transform-origin: var(--radix-tooltip-content-transform-origin);\n  }\n\n  .-translate-x-1\\/2 {\n    --tw-translate-x: calc(calc(1 / 2 * 100%) * -1);\n    translate: var(--tw-translate-x) var(--tw-translate-y);\n  }\n\n  .-translate-x-px {\n    --tw-translate-x: -1px;\n    translate: var(--tw-translate-x) var(--tw-translate-y);\n  }\n\n  .translate-x-1\\/2 {\n    --tw-translate-x: calc(1 / 2 * 100%);\n    translate: var(--tw-translate-x) var(--tw-translate-y);\n  }\n\n  .translate-x-\\[-50\\%\\] {\n    --tw-translate-x: -50%;\n    translate: var(--tw-translate-x) var(--tw-translate-y);\n  }\n\n  .translate-x-px {\n    --tw-translate-x: 1px;\n    translate: var(--tw-translate-x) var(--tw-translate-y);\n  }\n\n  .-translate-y-1\\/2 {\n    --tw-translate-y: calc(calc(1 / 2 * 100%) * -1);\n    translate: var(--tw-translate-x) var(--tw-translate-y);\n  }\n\n  .translate-y-\\[-50\\%\\] {\n    --tw-translate-y: -50%;\n    translate: var(--tw-translate-x) var(--tw-translate-y);\n  }\n\n  .translate-y-\\[calc\\(-50\\%_-_2px\\)\\] {\n    --tw-translate-y: calc(-50% - 2px);\n    translate: var(--tw-translate-x) var(--tw-translate-y);\n  }\n\n  .scale-0 {\n    --tw-scale-x: 0%;\n    --tw-scale-y: 0%;\n    --tw-scale-z: 0%;\n    scale: var(--tw-scale-x) var(--tw-scale-y);\n  }\n\n  .scale-100 {\n    --tw-scale-x: 100%;\n    --tw-scale-y: 100%;\n    --tw-scale-z: 100%;\n    scale: var(--tw-scale-x) var(--tw-scale-y);\n  }\n\n  .rotate-0 {\n    rotate: none;\n  }\n\n  .rotate-45 {\n    rotate: 45deg;\n  }\n\n  .rotate-90 {\n    rotate: 90deg;\n  }\n\n  .transform {\n    transform: var(--tw-rotate-x, ) var(--tw-rotate-y, ) var(--tw-rotate-z, ) var(--tw-skew-x, ) var(--tw-skew-y, );\n  }\n\n  .animate-in {\n    animation: enter var(--tw-animation-duration, var(--tw-duration, .15s)) var(--tw-ease, ease) var(--tw-animation-delay, 0s) var(--tw-animation-iteration-count, 1) var(--tw-animation-direction, normal) var(--tw-animation-fill-mode, none);\n  }\n\n  .animate-pulse {\n    animation: var(--animate-pulse);\n  }\n\n  .animate-spin {\n    animation: var(--animate-spin);\n  }\n\n  .cursor-default {\n    cursor: default;\n  }\n\n  .cursor-grab {\n    cursor: grab;\n  }\n\n  .cursor-not-allowed {\n    cursor: not-allowed;\n  }\n\n  .cursor-pointer {\n    cursor: pointer;\n  }\n\n  .resize-none {\n    resize: none;\n  }\n\n  .scroll-my-1 {\n    scroll-margin-block: calc(var(--spacing) * 1);\n  }\n\n  .auto-rows-min {\n    grid-auto-rows: min-content;\n  }\n\n  .grid-cols-1 {\n    grid-template-columns: repeat(1, minmax(0, 1fr));\n  }\n\n  .grid-cols-2 {\n    grid-template-columns: repeat(2, minmax(0, 1fr));\n  }\n\n  .grid-cols-4 {\n    grid-template-columns: repeat(4, minmax(0, 1fr));\n  }\n\n  .grid-rows-\\[auto_auto\\] {\n    grid-template-rows: auto auto;\n  }\n\n  .flex-col {\n    flex-direction: column;\n  }\n\n  .flex-col-reverse {\n    flex-direction: column-reverse;\n  }\n\n  .flex-wrap {\n    flex-wrap: wrap;\n  }\n\n  .items-center {\n    align-items: center;\n  }\n\n  .items-start {\n    align-items: flex-start;\n  }\n\n  .justify-around {\n    justify-content: space-around;\n  }\n\n  .justify-between {\n    justify-content: space-between;\n  }\n\n  .justify-center {\n    justify-content: center;\n  }\n\n  .justify-end {\n    justify-content: flex-end;\n  }\n\n  .justify-start {\n    justify-content: flex-start;\n  }\n\n  .gap-0 {\n    gap: calc(var(--spacing) * 0);\n  }\n\n  .gap-0\\.5 {\n    gap: calc(var(--spacing) * .5);\n  }\n\n  .gap-1 {\n    gap: calc(var(--spacing) * 1);\n  }\n\n  .gap-1\\.5 {\n    gap: calc(var(--spacing) * 1.5);\n  }\n\n  .gap-2 {\n    gap: calc(var(--spacing) * 2);\n  }\n\n  .gap-2\\.5 {\n    gap: calc(var(--spacing) * 2.5);\n  }\n\n  .gap-3 {\n    gap: calc(var(--spacing) * 3);\n  }\n\n  .gap-4 {\n    gap: calc(var(--spacing) * 4);\n  }\n\n  .gap-5 {\n    gap: calc(var(--spacing) * 5);\n  }\n\n  .gap-6 {\n    gap: calc(var(--spacing) * 6);\n  }\n\n  .gap-8 {\n    gap: calc(var(--spacing) * 8);\n  }\n\n  .gap-10 {\n    gap: calc(var(--spacing) * 10);\n  }\n\n  :where(.space-y-1 > :not(:last-child)) {\n    --tw-space-y-reverse: 0;\n    margin-block-start: calc(calc(var(--spacing) * 1) * var(--tw-space-y-reverse));\n    margin-block-end: calc(calc(var(--spacing) * 1) * calc(1 - var(--tw-space-y-reverse)));\n  }\n\n  :where(.space-y-2 > :not(:last-child)) {\n    --tw-space-y-reverse: 0;\n    margin-block-start: calc(calc(var(--spacing) * 2) * var(--tw-space-y-reverse));\n    margin-block-end: calc(calc(var(--spacing) * 2) * calc(1 - var(--tw-space-y-reverse)));\n  }\n\n  :where(.space-y-3 > :not(:last-child)) {\n    --tw-space-y-reverse: 0;\n    margin-block-start: calc(calc(var(--spacing) * 3) * var(--tw-space-y-reverse));\n    margin-block-end: calc(calc(var(--spacing) * 3) * calc(1 - var(--tw-space-y-reverse)));\n  }\n\n  :where(.space-y-4 > :not(:last-child)) {\n    --tw-space-y-reverse: 0;\n    margin-block-start: calc(calc(var(--spacing) * 4) * var(--tw-space-y-reverse));\n    margin-block-end: calc(calc(var(--spacing) * 4) * calc(1 - var(--tw-space-y-reverse)));\n  }\n\n  :where(.space-y-6 > :not(:last-child)) {\n    --tw-space-y-reverse: 0;\n    margin-block-start: calc(calc(var(--spacing) * 6) * var(--tw-space-y-reverse));\n    margin-block-end: calc(calc(var(--spacing) * 6) * calc(1 - var(--tw-space-y-reverse)));\n  }\n\n  :where(.space-y-8 > :not(:last-child)) {\n    --tw-space-y-reverse: 0;\n    margin-block-start: calc(calc(var(--spacing) * 8) * var(--tw-space-y-reverse));\n    margin-block-end: calc(calc(var(--spacing) * 8) * calc(1 - var(--tw-space-y-reverse)));\n  }\n\n  :where(.space-x-2 > :not(:last-child)) {\n    --tw-space-x-reverse: 0;\n    margin-inline-start: calc(calc(var(--spacing) * 2) * var(--tw-space-x-reverse));\n    margin-inline-end: calc(calc(var(--spacing) * 2) * calc(1 - var(--tw-space-x-reverse)));\n  }\n\n  :where(.divide-y > :not(:last-child)) {\n    --tw-divide-y-reverse: 0;\n    border-bottom-style: var(--tw-border-style);\n    border-top-style: var(--tw-border-style);\n    border-top-width: calc(1px * var(--tw-divide-y-reverse));\n    border-bottom-width: calc(1px * calc(1 - var(--tw-divide-y-reverse)));\n  }\n\n  :where(.divide-border > :not(:last-child)) {\n    border-color: var(--border);\n  }\n\n  .self-start {\n    align-self: flex-start;\n  }\n\n  .justify-self-end {\n    justify-self: flex-end;\n  }\n\n  .truncate {\n    text-overflow: ellipsis;\n    white-space: nowrap;\n    overflow: hidden;\n  }\n\n  .overflow-auto {\n    overflow: auto;\n  }\n\n  .overflow-hidden {\n    overflow: hidden;\n  }\n\n  .overflow-x-auto {\n    overflow-x: auto;\n  }\n\n  .overflow-x-hidden {\n    overflow-x: hidden;\n  }\n\n  .overflow-y-auto {\n    overflow-y: auto;\n  }\n\n  .rounded {\n    border-radius: .625rem;\n  }\n\n  .rounded-2xl {\n    border-radius: var(--radius-2xl);\n  }\n\n  .rounded-\\[2px\\] {\n    border-radius: 2px;\n  }\n\n  .rounded-full {\n    border-radius: 3.40282e38px;\n  }\n\n  .rounded-lg {\n    border-radius: var(--radius);\n  }\n\n  .rounded-md {\n    border-radius: calc(var(--radius)  - 2px);\n  }\n\n  .rounded-sm {\n    border-radius: calc(var(--radius)  - 4px);\n  }\n\n  .rounded-xl {\n    border-radius: calc(var(--radius)  + 4px);\n  }\n\n  .rounded-xs {\n    border-radius: var(--radius-xs);\n  }\n\n  .border {\n    border-style: var(--tw-border-style);\n    border-width: 1px;\n  }\n\n  .border-t {\n    border-top-style: var(--tw-border-style);\n    border-top-width: 1px;\n  }\n\n  .border-r {\n    border-right-style: var(--tw-border-style);\n    border-right-width: 1px;\n  }\n\n  .border-b {\n    border-bottom-style: var(--tw-border-style);\n    border-bottom-width: 1px;\n  }\n\n  .border-l {\n    border-left-style: var(--tw-border-style);\n    border-left-width: 1px;\n  }\n\n  .border-dashed {\n    --tw-border-style: dashed;\n    border-style: dashed;\n  }\n\n  .border-none\\! {\n    --tw-border-style: none !important;\n    border-style: none !important;\n  }\n\n  .border-border {\n    border-color: var(--border);\n  }\n\n  .border-input {\n    border-color: var(--input);\n  }\n\n  .border-primary {\n    border-color: var(--primary);\n  }\n\n  .border-sidebar-border {\n    border-color: var(--sidebar-border);\n  }\n\n  .border-transparent {\n    border-color: #0000;\n  }\n\n  .bg-accent {\n    background-color: var(--accent);\n  }\n\n  .bg-background {\n    background-color: var(--background);\n  }\n\n  .bg-background\\/50 {\n    background-color: #ffffff80;\n  }\n\n  @supports (color: color-mix(in lab, red, red)) {\n    .bg-background\\/50 {\n      background-color: color-mix(in oklab, var(--background) 50%, transparent);\n    }\n  }\n\n  .bg-background\\/95 {\n    background-color: #fffffff2;\n  }\n\n  @supports (color: color-mix(in lab, red, red)) {\n    .bg-background\\/95 {\n      background-color: color-mix(in oklab, var(--background) 95%, transparent);\n    }\n  }\n\n  .bg-black {\n    background-color: var(--color-black);\n  }\n\n  .bg-black\\/50 {\n    background-color: #00000080;\n  }\n\n  @supports (color: color-mix(in lab, red, red)) {\n    .bg-black\\/50 {\n      background-color: color-mix(in oklab, var(--color-black) 50%, transparent);\n    }\n  }\n\n  .bg-blue-50 {\n    background-color: var(--color-blue-50);\n  }\n\n  .bg-blue-100 {\n    background-color: var(--color-blue-100);\n  }\n\n  .bg-border {\n    background-color: var(--border);\n  }\n\n  .bg-card {\n    background-color: var(--card);\n  }\n\n  .bg-destructive {\n    background-color: var(--destructive);\n  }\n\n  .bg-foreground {\n    background-color: var(--foreground);\n  }\n\n  .bg-green-600 {\n    background-color: var(--color-green-600);\n  }\n\n  .bg-muted {\n    background-color: var(--muted);\n  }\n\n  .bg-muted-foreground\\/30 {\n    background-color: #71717b4d;\n  }\n\n  @supports (color: color-mix(in lab, red, red)) {\n    .bg-muted-foreground\\/30 {\n      background-color: color-mix(in oklab, var(--muted-foreground) 30%, transparent);\n    }\n  }\n\n  .bg-muted\\/20 {\n    background-color: #f4f4f533;\n  }\n\n  @supports (color: color-mix(in lab, red, red)) {\n    .bg-muted\\/20 {\n      background-color: color-mix(in oklab, var(--muted) 20%, transparent);\n    }\n  }\n\n  .bg-muted\\/30 {\n    background-color: #f4f4f54d;\n  }\n\n  @supports (color: color-mix(in lab, red, red)) {\n    .bg-muted\\/30 {\n      background-color: color-mix(in oklab, var(--muted) 30%, transparent);\n    }\n  }\n\n  .bg-muted\\/50 {\n    background-color: #f4f4f580;\n  }\n\n  @supports (color: color-mix(in lab, red, red)) {\n    .bg-muted\\/50 {\n      background-color: color-mix(in oklab, var(--muted) 50%, transparent);\n    }\n  }\n\n  .bg-muted\\/80 {\n    background-color: #f4f4f5cc;\n  }\n\n  @supports (color: color-mix(in lab, red, red)) {\n    .bg-muted\\/80 {\n      background-color: color-mix(in oklab, var(--muted) 80%, transparent);\n    }\n  }\n\n  .bg-popover {\n    background-color: var(--popover);\n  }\n\n  .bg-primary {\n    background-color: var(--primary);\n  }\n\n  .bg-primary\\/10 {\n    background-color: #18181b1a;\n  }\n\n  @supports (color: color-mix(in lab, red, red)) {\n    .bg-primary\\/10 {\n      background-color: color-mix(in oklab, var(--primary) 10%, transparent);\n    }\n  }\n\n  .bg-purple-100 {\n    background-color: var(--color-purple-100);\n  }\n\n  .bg-secondary {\n    background-color: var(--secondary);\n  }\n\n  .bg-sidebar {\n    background-color: var(--sidebar);\n  }\n\n  .bg-sidebar-border {\n    background-color: var(--sidebar-border);\n  }\n\n  .bg-transparent {\n    background-color: #0000;\n  }\n\n  .bg-transparent\\! {\n    background-color: #0000 !important;\n  }\n\n  .bg-white {\n    background-color: var(--color-white);\n  }\n\n  .fill-current {\n    fill: currentColor;\n  }\n\n  .fill-foreground {\n    fill: var(--foreground);\n  }\n\n  .fill-red-500 {\n    fill: var(--color-red-500);\n  }\n\n  .object-cover {\n    object-fit: cover;\n  }\n\n  .p-0 {\n    padding: calc(var(--spacing) * 0);\n  }\n\n  .p-1 {\n    padding: calc(var(--spacing) * 1);\n  }\n\n  .p-2 {\n    padding: calc(var(--spacing) * 2);\n  }\n\n  .p-3 {\n    padding: calc(var(--spacing) * 3);\n  }\n\n  .p-4 {\n    padding: calc(var(--spacing) * 4);\n  }\n\n  .p-6 {\n    padding: calc(var(--spacing) * 6);\n  }\n\n  .p-8 {\n    padding: calc(var(--spacing) * 8);\n  }\n\n  .p-\\[3px\\] {\n    padding: 3px;\n  }\n\n  .px-1 {\n    padding-inline: calc(var(--spacing) * 1);\n  }\n\n  .px-1\\.5 {\n    padding-inline: calc(var(--spacing) * 1.5);\n  }\n\n  .px-2 {\n    padding-inline: calc(var(--spacing) * 2);\n  }\n\n  .px-2\\.5 {\n    padding-inline: calc(var(--spacing) * 2.5);\n  }\n\n  .px-3 {\n    padding-inline: calc(var(--spacing) * 3);\n  }\n\n  .px-4 {\n    padding-inline: calc(var(--spacing) * 4);\n  }\n\n  .px-6 {\n    padding-inline: calc(var(--spacing) * 6);\n  }\n\n  .px-8 {\n    padding-inline: calc(var(--spacing) * 8);\n  }\n\n  .py-0 {\n    padding-block: calc(var(--spacing) * 0);\n  }\n\n  .py-0\\.5 {\n    padding-block: calc(var(--spacing) * .5);\n  }\n\n  .py-1 {\n    padding-block: calc(var(--spacing) * 1);\n  }\n\n  .py-1\\.5 {\n    padding-block: calc(var(--spacing) * 1.5);\n  }\n\n  .py-2 {\n    padding-block: calc(var(--spacing) * 2);\n  }\n\n  .py-4 {\n    padding-block: calc(var(--spacing) * 4);\n  }\n\n  .py-6 {\n    padding-block: calc(var(--spacing) * 6);\n  }\n\n  .py-8 {\n    padding-block: calc(var(--spacing) * 8);\n  }\n\n  .py-10 {\n    padding-block: calc(var(--spacing) * 10);\n  }\n\n  .py-12 {\n    padding-block: calc(var(--spacing) * 12);\n  }\n\n  .pt-2 {\n    padding-top: calc(var(--spacing) * 2);\n  }\n\n  .pt-4 {\n    padding-top: calc(var(--spacing) * 4);\n  }\n\n  .pt-6 {\n    padding-top: calc(var(--spacing) * 6);\n  }\n\n  .pr-2 {\n    padding-right: calc(var(--spacing) * 2);\n  }\n\n  .pr-3 {\n    padding-right: calc(var(--spacing) * 3);\n  }\n\n  .pr-4 {\n    padding-right: calc(var(--spacing) * 4);\n  }\n\n  .pr-8 {\n    padding-right: calc(var(--spacing) * 8);\n  }\n\n  .pb-2 {\n    padding-bottom: calc(var(--spacing) * 2);\n  }\n\n  .pb-4 {\n    padding-bottom: calc(var(--spacing) * 4);\n  }\n\n  .pb-5 {\n    padding-bottom: calc(var(--spacing) * 5);\n  }\n\n  .pb-6 {\n    padding-bottom: calc(var(--spacing) * 6);\n  }\n\n  .pb-10 {\n    padding-bottom: calc(var(--spacing) * 10);\n  }\n\n  .pl-1 {\n    padding-left: calc(var(--spacing) * 1);\n  }\n\n  .pl-2 {\n    padding-left: calc(var(--spacing) * 2);\n  }\n\n  .pl-8 {\n    padding-left: calc(var(--spacing) * 8);\n  }\n\n  .text-center {\n    text-align: center;\n  }\n\n  .text-left {\n    text-align: left;\n  }\n\n  .text-start {\n    text-align: start;\n  }\n\n  .align-middle {\n    vertical-align: middle;\n  }\n\n  .font-mono {\n    font-family: var(--font-mono);\n  }\n\n  .text-2xl {\n    font-size: var(--text-2xl);\n    line-height: var(--tw-leading, var(--text-2xl--line-height));\n  }\n\n  .text-3xl {\n    font-size: var(--text-3xl);\n    line-height: var(--tw-leading, var(--text-3xl--line-height));\n  }\n\n  .text-base {\n    font-size: var(--text-base);\n    line-height: var(--tw-leading, var(--text-base--line-height));\n  }\n\n  .text-lg {\n    font-size: var(--text-lg);\n    line-height: var(--tw-leading, var(--text-lg--line-height));\n  }\n\n  .text-sm {\n    font-size: var(--text-sm);\n    line-height: var(--tw-leading, var(--text-sm--line-height));\n  }\n\n  .text-xl {\n    font-size: var(--text-xl);\n    line-height: var(--tw-leading, var(--text-xl--line-height));\n  }\n\n  .text-xs {\n    font-size: var(--text-xs);\n    line-height: var(--tw-leading, var(--text-xs--line-height));\n  }\n\n  .text-\\[10px\\] {\n    font-size: 10px;\n  }\n\n  .text-\\[11px\\] {\n    font-size: 11px;\n  }\n\n  .leading-none {\n    --tw-leading: 1;\n    line-height: 1;\n  }\n\n  .leading-tight {\n    --tw-leading: var(--leading-tight);\n    line-height: var(--leading-tight);\n  }\n\n  .font-bold {\n    --tw-font-weight: var(--font-weight-bold);\n    font-weight: var(--font-weight-bold);\n  }\n\n  .font-light {\n    --tw-font-weight: var(--font-weight-light);\n    font-weight: var(--font-weight-light);\n  }\n\n  .font-medium {\n    --tw-font-weight: var(--font-weight-medium);\n    font-weight: var(--font-weight-medium);\n  }\n\n  .font-normal {\n    --tw-font-weight: var(--font-weight-normal);\n    font-weight: var(--font-weight-normal);\n  }\n\n  .font-semibold {\n    --tw-font-weight: var(--font-weight-semibold);\n    font-weight: var(--font-weight-semibold);\n  }\n\n  .tracking-tight {\n    --tw-tracking: var(--tracking-tight);\n    letter-spacing: var(--tracking-tight);\n  }\n\n  .tracking-wider {\n    --tw-tracking: var(--tracking-wider);\n    letter-spacing: var(--tracking-wider);\n  }\n\n  .tracking-widest {\n    --tw-tracking: var(--tracking-widest);\n    letter-spacing: var(--tracking-widest);\n  }\n\n  .text-balance {\n    text-wrap: balance;\n  }\n\n  .break-all {\n    word-break: break-all;\n  }\n\n  .text-ellipsis {\n    text-overflow: ellipsis;\n  }\n\n  .whitespace-nowrap {\n    white-space: nowrap;\n  }\n\n  .text-background {\n    color: var(--background);\n  }\n\n  .text-black {\n    color: var(--color-black);\n  }\n\n  .text-black\\/70 {\n    color: #000000b3;\n  }\n\n  @supports (color: color-mix(in lab, red, red)) {\n    .text-black\\/70 {\n      color: color-mix(in oklab, var(--color-black) 70%, transparent);\n    }\n  }\n\n  .text-blue-500 {\n    color: var(--color-blue-500);\n  }\n\n  .text-blue-600 {\n    color: var(--color-blue-600);\n  }\n\n  .text-card-foreground {\n    color: var(--card-foreground);\n  }\n\n  .text-foreground {\n    color: var(--foreground);\n  }\n\n  .text-foreground\\/80 {\n    color: #09090bcc;\n  }\n\n  @supports (color: color-mix(in lab, red, red)) {\n    .text-foreground\\/80 {\n      color: color-mix(in oklab, var(--foreground) 80%, transparent);\n    }\n  }\n\n  .text-gray-400 {\n    color: var(--color-gray-400);\n  }\n\n  .text-gray-500 {\n    color: var(--color-gray-500);\n  }\n\n  .text-green-500 {\n    color: var(--color-green-500);\n  }\n\n  .text-green-600 {\n    color: var(--color-green-600);\n  }\n\n  .text-muted-foreground {\n    color: var(--muted-foreground);\n  }\n\n  .text-orange-500 {\n    color: var(--color-orange-500);\n  }\n\n  .text-popover-foreground {\n    color: var(--popover-foreground);\n  }\n\n  .text-primary {\n    color: var(--primary);\n  }\n\n  .text-primary-foreground {\n    color: var(--primary-foreground);\n  }\n\n  .text-purple-500 {\n    color: var(--color-purple-500);\n  }\n\n  .text-red-600 {\n    color: var(--color-red-600);\n  }\n\n  .text-secondary-foreground {\n    color: var(--secondary-foreground);\n  }\n\n  .text-sidebar-foreground {\n    color: var(--sidebar-foreground);\n  }\n\n  .text-sidebar-foreground\\/70 {\n    color: #09090bb3;\n  }\n\n  @supports (color: color-mix(in lab, red, red)) {\n    .text-sidebar-foreground\\/70 {\n      color: color-mix(in oklab, var(--sidebar-foreground) 70%, transparent);\n    }\n  }\n\n  .text-sidebar-primary-foreground {\n    color: var(--sidebar-primary-foreground);\n  }\n\n  .text-white {\n    color: var(--color-white);\n  }\n\n  .text-yellow-500 {\n    color: var(--color-yellow-500);\n  }\n\n  .capitalize {\n    text-transform: capitalize;\n  }\n\n  .uppercase {\n    text-transform: uppercase;\n  }\n\n  .italic {\n    font-style: italic;\n  }\n\n  .tabular-nums {\n    --tw-numeric-spacing: tabular-nums;\n    font-variant-numeric: var(--tw-ordinal, ) var(--tw-slashed-zero, ) var(--tw-numeric-figure, ) var(--tw-numeric-spacing, ) var(--tw-numeric-fraction, );\n  }\n\n  .underline {\n    text-decoration-line: underline;\n  }\n\n  .underline-offset-4 {\n    text-underline-offset: 4px;\n  }\n\n  .opacity-0 {\n    opacity: 0;\n  }\n\n  .opacity-50 {\n    opacity: .5;\n  }\n\n  .opacity-70 {\n    opacity: .7;\n  }\n\n  .opacity-100 {\n    opacity: 1;\n  }\n\n  .shadow {\n    --tw-shadow: 0 1px 3px 0 var(--tw-shadow-color, #0000001a), 0 1px 2px -1px var(--tw-shadow-color, #0000001a);\n    box-shadow: var(--tw-inset-shadow), var(--tw-inset-ring-shadow), var(--tw-ring-offset-shadow), var(--tw-ring-shadow), var(--tw-shadow);\n  }\n\n  .shadow-2xl {\n    --tw-shadow: 0 25px 50px -12px var(--tw-shadow-color, #00000040);\n    box-shadow: var(--tw-inset-shadow), var(--tw-inset-ring-shadow), var(--tw-ring-offset-shadow), var(--tw-ring-shadow), var(--tw-shadow);\n  }\n\n  .shadow-\\[0_0_0_1px_hsl\\(var\\(--sidebar-border\\)\\)\\] {\n    --tw-shadow: 0 0 0 1px var(--tw-shadow-color, hsl(var(--sidebar-border)));\n    box-shadow: var(--tw-inset-shadow), var(--tw-inset-ring-shadow), var(--tw-ring-offset-shadow), var(--tw-ring-shadow), var(--tw-shadow);\n  }\n\n  .shadow-lg {\n    --tw-shadow: 0 10px 15px -3px var(--tw-shadow-color, #0000001a), 0 4px 6px -4px var(--tw-shadow-color, #0000001a);\n    box-shadow: var(--tw-inset-shadow), var(--tw-inset-ring-shadow), var(--tw-ring-offset-shadow), var(--tw-ring-shadow), var(--tw-shadow);\n  }\n\n  .shadow-md {\n    --tw-shadow: 0 4px 6px -1px var(--tw-shadow-color, #0000001a), 0 2px 4px -2px var(--tw-shadow-color, #0000001a);\n    box-shadow: var(--tw-inset-shadow), var(--tw-inset-ring-shadow), var(--tw-ring-offset-shadow), var(--tw-ring-shadow), var(--tw-shadow);\n  }\n\n  .shadow-none {\n    --tw-shadow: 0 0 #0000;\n    box-shadow: var(--tw-inset-shadow), var(--tw-inset-ring-shadow), var(--tw-ring-offset-shadow), var(--tw-ring-shadow), var(--tw-shadow);\n  }\n\n  .shadow-sm {\n    --tw-shadow: 0 1px 3px 0 var(--tw-shadow-color, #0000001a), 0 1px 2px -1px var(--tw-shadow-color, #0000001a);\n    box-shadow: var(--tw-inset-shadow), var(--tw-inset-ring-shadow), var(--tw-ring-offset-shadow), var(--tw-ring-shadow), var(--tw-shadow);\n  }\n\n  .shadow-xs {\n    --tw-shadow: 0 1px 2px 0 var(--tw-shadow-color, #0000000d);\n    box-shadow: var(--tw-inset-shadow), var(--tw-inset-ring-shadow), var(--tw-ring-offset-shadow), var(--tw-ring-shadow), var(--tw-shadow);\n  }\n\n  .ring-0 {\n    --tw-ring-shadow: var(--tw-ring-inset, ) 0 0 0 calc(0px + var(--tw-ring-offset-width)) var(--tw-ring-color, currentcolor);\n    box-shadow: var(--tw-inset-shadow), var(--tw-inset-ring-shadow), var(--tw-ring-offset-shadow), var(--tw-ring-shadow), var(--tw-shadow);\n  }\n\n  .ring-0\\! {\n    --tw-ring-shadow: var(--tw-ring-inset, ) 0 0 0 calc(0px + var(--tw-ring-offset-width)) var(--tw-ring-color, currentcolor) !important;\n    box-shadow: var(--tw-inset-shadow), var(--tw-inset-ring-shadow), var(--tw-ring-offset-shadow), var(--tw-ring-shadow), var(--tw-shadow) !important;\n  }\n\n  .ring-1 {\n    --tw-ring-shadow: var(--tw-ring-inset, ) 0 0 0 calc(1px + var(--tw-ring-offset-width)) var(--tw-ring-color, currentcolor);\n    box-shadow: var(--tw-inset-shadow), var(--tw-inset-ring-shadow), var(--tw-ring-offset-shadow), var(--tw-ring-shadow), var(--tw-shadow);\n  }\n\n  .ring-2 {\n    --tw-ring-shadow: var(--tw-ring-inset, ) 0 0 0 calc(2px + var(--tw-ring-offset-width)) var(--tw-ring-color, currentcolor);\n    box-shadow: var(--tw-inset-shadow), var(--tw-inset-ring-shadow), var(--tw-ring-offset-shadow), var(--tw-ring-shadow), var(--tw-shadow);\n  }\n\n  .ring-primary {\n    --tw-ring-color: var(--primary);\n  }\n\n  .ring-primary\\/20 {\n    --tw-ring-color: #18181b33;\n  }\n\n  @supports (color: color-mix(in lab, red, red)) {\n    .ring-primary\\/20 {\n      --tw-ring-color: color-mix(in oklab, var(--primary) 20%, transparent);\n    }\n  }\n\n  .ring-sidebar-ring {\n    --tw-ring-color: var(--sidebar-ring);\n  }\n\n  .ring-offset-background {\n    --tw-ring-offset-color: var(--background);\n  }\n\n  .outline-hidden {\n    --tw-outline-style: none;\n    outline-style: none;\n  }\n\n  @media (forced-colors: active) {\n    .outline-hidden {\n      outline-offset: 2px;\n      outline: 2px solid #0000;\n    }\n  }\n\n  .outline {\n    outline-style: var(--tw-outline-style);\n    outline-width: 1px;\n  }\n\n  .filter {\n    filter: var(--tw-blur, ) var(--tw-brightness, ) var(--tw-contrast, ) var(--tw-grayscale, ) var(--tw-hue-rotate, ) var(--tw-invert, ) var(--tw-saturate, ) var(--tw-sepia, ) var(--tw-drop-shadow, );\n  }\n\n  .backdrop-blur {\n    --tw-backdrop-blur: blur(8px);\n    -webkit-backdrop-filter: var(--tw-backdrop-blur, ) var(--tw-backdrop-brightness, ) var(--tw-backdrop-contrast, ) var(--tw-backdrop-grayscale, ) var(--tw-backdrop-hue-rotate, ) var(--tw-backdrop-invert, ) var(--tw-backdrop-opacity, ) var(--tw-backdrop-saturate, ) var(--tw-backdrop-sepia, );\n    backdrop-filter: var(--tw-backdrop-blur, ) var(--tw-backdrop-brightness, ) var(--tw-backdrop-contrast, ) var(--tw-backdrop-grayscale, ) var(--tw-backdrop-hue-rotate, ) var(--tw-backdrop-invert, ) var(--tw-backdrop-opacity, ) var(--tw-backdrop-saturate, ) var(--tw-backdrop-sepia, );\n  }\n\n  .transition {\n    transition-property: color, background-color, border-color, outline-color, text-decoration-color, fill, stroke, --tw-gradient-from, --tw-gradient-via, --tw-gradient-to, opacity, box-shadow, transform, translate, scale, rotate, filter, -webkit-backdrop-filter, backdrop-filter, display, content-visibility, overlay, pointer-events;\n    transition-timing-function: var(--tw-ease, var(--default-transition-timing-function));\n    transition-duration: var(--tw-duration, var(--default-transition-duration));\n  }\n\n  .transition-\\[color\\,box-shadow\\] {\n    transition-property: color, box-shadow;\n    transition-timing-function: var(--tw-ease, var(--default-transition-timing-function));\n    transition-duration: var(--tw-duration, var(--default-transition-duration));\n  }\n\n  .transition-\\[left\\,right\\,width\\] {\n    transition-property: left, right, width;\n    transition-timing-function: var(--tw-ease, var(--default-transition-timing-function));\n    transition-duration: var(--tw-duration, var(--default-transition-duration));\n  }\n\n  .transition-\\[margin\\,opacity\\] {\n    transition-property: margin, opacity;\n    transition-timing-function: var(--tw-ease, var(--default-transition-timing-function));\n    transition-duration: var(--tw-duration, var(--default-transition-duration));\n  }\n\n  .transition-\\[width\\,height\\,padding\\] {\n    transition-property: width, height, padding;\n    transition-timing-function: var(--tw-ease, var(--default-transition-timing-function));\n    transition-duration: var(--tw-duration, var(--default-transition-duration));\n  }\n\n  .transition-\\[width\\] {\n    transition-property: width;\n    transition-timing-function: var(--tw-ease, var(--default-transition-timing-function));\n    transition-duration: var(--tw-duration, var(--default-transition-duration));\n  }\n\n  .transition-all {\n    transition-property: all;\n    transition-timing-function: var(--tw-ease, var(--default-transition-timing-function));\n    transition-duration: var(--tw-duration, var(--default-transition-duration));\n  }\n\n  .transition-colors {\n    transition-property: color, background-color, border-color, outline-color, text-decoration-color, fill, stroke, --tw-gradient-from, --tw-gradient-via, --tw-gradient-to;\n    transition-timing-function: var(--tw-ease, var(--default-transition-timing-function));\n    transition-duration: var(--tw-duration, var(--default-transition-duration));\n  }\n\n  .transition-opacity {\n    transition-property: opacity;\n    transition-timing-function: var(--tw-ease, var(--default-transition-timing-function));\n    transition-duration: var(--tw-duration, var(--default-transition-duration));\n  }\n\n  .transition-transform {\n    transition-property: transform, translate, scale, rotate;\n    transition-timing-function: var(--tw-ease, var(--default-transition-timing-function));\n    transition-duration: var(--tw-duration, var(--default-transition-duration));\n  }\n\n  .duration-100 {\n    --tw-duration: .1s;\n    transition-duration: .1s;\n  }\n\n  .duration-200 {\n    --tw-duration: .2s;\n    transition-duration: .2s;\n  }\n\n  .ease-in-out {\n    --tw-ease: var(--ease-in-out);\n    transition-timing-function: var(--ease-in-out);\n  }\n\n  .ease-linear {\n    --tw-ease: linear;\n    transition-timing-function: linear;\n  }\n\n  .fade-in-0 {\n    --tw-enter-opacity: 0;\n  }\n\n  .outline-none {\n    --tw-outline-style: none;\n    outline-style: none;\n  }\n\n  .select-none {\n    -webkit-user-select: none;\n    user-select: none;\n  }\n\n  .zoom-in-95 {\n    --tw-enter-scale: .95;\n  }\n\n  .fade-in {\n    --tw-enter-opacity: 0;\n  }\n\n  .slide-in-from-bottom-4 {\n    --tw-enter-translate-y: calc(4 * var(--spacing));\n  }\n\n  .group-focus-within\\/menu-item\\:opacity-100:is(:where(.group\\/menu-item):focus-within *) {\n    opacity: 1;\n  }\n\n  @media (hover: hover) {\n    .group-hover\\:text-primary:is(:where(.group):hover *) {\n      color: var(--primary);\n    }\n\n    .group-hover\\:underline:is(:where(.group):hover *) {\n      text-decoration-line: underline;\n    }\n\n    .group-hover\\/menu-item\\:opacity-100:is(:where(.group\\/menu-item):hover *) {\n      opacity: 1;\n    }\n  }\n\n  .group-has-data-\\[sidebar\\=menu-action\\]\\/menu-item\\:pr-8:is(:where(.group\\/menu-item):has([data-sidebar=\"menu-action\"]) *) {\n    padding-right: calc(var(--spacing) * 8);\n  }\n\n  .group-data-\\[collapsible\\=icon\\]\\:-mt-8:is(:where(.group)[data-collapsible=\"icon\"] *) {\n    margin-top: calc(var(--spacing) * -8);\n  }\n\n  .group-data-\\[collapsible\\=icon\\]\\:hidden:is(:where(.group)[data-collapsible=\"icon\"] *) {\n    display: none;\n  }\n\n  .group-data-\\[collapsible\\=icon\\]\\:size-8\\!:is(:where(.group)[data-collapsible=\"icon\"] *) {\n    width: calc(var(--spacing) * 8) !important;\n    height: calc(var(--spacing) * 8) !important;\n  }\n\n  .group-data-\\[collapsible\\=icon\\]\\:w-\\(--sidebar-width-icon\\):is(:where(.group)[data-collapsible=\"icon\"] *) {\n    width: var(--sidebar-width-icon);\n  }\n\n  .group-data-\\[collapsible\\=icon\\]\\:w-\\[calc\\(var\\(--sidebar-width-icon\\)\\+\\(--spacing\\(4\\)\\)\\)\\]:is(:where(.group)[data-collapsible=\"icon\"] *) {\n    width: calc(var(--sidebar-width-icon)  + (calc(var(--spacing) * 4)));\n  }\n\n  .group-data-\\[collapsible\\=icon\\]\\:w-\\[calc\\(var\\(--sidebar-width-icon\\)\\+\\(--spacing\\(4\\)\\)\\+2px\\)\\]:is(:where(.group)[data-collapsible=\"icon\"] *) {\n    width: calc(var(--sidebar-width-icon)  + (calc(var(--spacing) * 4))  + 2px);\n  }\n\n  .group-data-\\[collapsible\\=icon\\]\\:overflow-hidden:is(:where(.group)[data-collapsible=\"icon\"] *) {\n    overflow: hidden;\n  }\n\n  .group-data-\\[collapsible\\=icon\\]\\:p-0\\!:is(:where(.group)[data-collapsible=\"icon\"] *) {\n    padding: calc(var(--spacing) * 0) !important;\n  }\n\n  .group-data-\\[collapsible\\=icon\\]\\:p-2\\!:is(:where(.group)[data-collapsible=\"icon\"] *) {\n    padding: calc(var(--spacing) * 2) !important;\n  }\n\n  .group-data-\\[collapsible\\=icon\\]\\:opacity-0:is(:where(.group)[data-collapsible=\"icon\"] *) {\n    opacity: 0;\n  }\n\n  .group-data-\\[collapsible\\=offcanvas\\]\\:right-\\[calc\\(var\\(--sidebar-width\\)\\*-1\\)\\]:is(:where(.group)[data-collapsible=\"offcanvas\"] *) {\n    right: calc(var(--sidebar-width) * -1);\n  }\n\n  .group-data-\\[collapsible\\=offcanvas\\]\\:left-\\[calc\\(var\\(--sidebar-width\\)\\*-1\\)\\]:is(:where(.group)[data-collapsible=\"offcanvas\"] *) {\n    left: calc(var(--sidebar-width) * -1);\n  }\n\n  .group-data-\\[collapsible\\=offcanvas\\]\\:w-0:is(:where(.group)[data-collapsible=\"offcanvas\"] *) {\n    width: calc(var(--spacing) * 0);\n  }\n\n  .group-data-\\[collapsible\\=offcanvas\\]\\:translate-x-0:is(:where(.group)[data-collapsible=\"offcanvas\"] *) {\n    --tw-translate-x: calc(var(--spacing) * 0);\n    translate: var(--tw-translate-x) var(--tw-translate-y);\n  }\n\n  .group-data-\\[disabled\\=true\\]\\:pointer-events-none:is(:where(.group)[data-disabled=\"true\"] *) {\n    pointer-events: none;\n  }\n\n  .group-data-\\[disabled\\=true\\]\\:opacity-50:is(:where(.group)[data-disabled=\"true\"] *) {\n    opacity: .5;\n  }\n\n  .group-data-\\[side\\=left\\]\\:-right-4:is(:where(.group)[data-side=\"left\"] *) {\n    right: calc(var(--spacing) * -4);\n  }\n\n  .group-data-\\[side\\=left\\]\\:border-r:is(:where(.group)[data-side=\"left\"] *) {\n    border-right-style: var(--tw-border-style);\n    border-right-width: 1px;\n  }\n\n  .group-data-\\[side\\=right\\]\\:left-0:is(:where(.group)[data-side=\"right\"] *) {\n    left: calc(var(--spacing) * 0);\n  }\n\n  .group-data-\\[side\\=right\\]\\:rotate-180:is(:where(.group)[data-side=\"right\"] *) {\n    rotate: 180deg;\n  }\n\n  .group-data-\\[side\\=right\\]\\:border-l:is(:where(.group)[data-side=\"right\"] *) {\n    border-left-style: var(--tw-border-style);\n    border-left-width: 1px;\n  }\n\n  .group-data-\\[variant\\=floating\\]\\:rounded-lg:is(:where(.group)[data-variant=\"floating\"] *) {\n    border-radius: var(--radius);\n  }\n\n  .group-data-\\[variant\\=floating\\]\\:border:is(:where(.group)[data-variant=\"floating\"] *) {\n    border-style: var(--tw-border-style);\n    border-width: 1px;\n  }\n\n  .group-data-\\[variant\\=floating\\]\\:border-sidebar-border:is(:where(.group)[data-variant=\"floating\"] *) {\n    border-color: var(--sidebar-border);\n  }\n\n  .group-data-\\[variant\\=floating\\]\\:shadow-sm:is(:where(.group)[data-variant=\"floating\"] *) {\n    --tw-shadow: 0 1px 3px 0 var(--tw-shadow-color, #0000001a), 0 1px 2px -1px var(--tw-shadow-color, #0000001a);\n    box-shadow: var(--tw-inset-shadow), var(--tw-inset-ring-shadow), var(--tw-ring-offset-shadow), var(--tw-ring-shadow), var(--tw-shadow);\n  }\n\n  @media (hover: hover) {\n    .peer-hover\\/menu-button\\:text-sidebar-accent-foreground:is(:where(.peer\\/menu-button):hover ~ *) {\n      color: var(--sidebar-accent-foreground);\n    }\n  }\n\n  .peer-disabled\\:cursor-not-allowed:is(:where(.peer):disabled ~ *) {\n    cursor: not-allowed;\n  }\n\n  .peer-disabled\\:opacity-50:is(:where(.peer):disabled ~ *) {\n    opacity: .5;\n  }\n\n  .peer-data-\\[active\\=true\\]\\/menu-button\\:text-sidebar-accent-foreground:is(:where(.peer\\/menu-button)[data-active=\"true\"] ~ *) {\n    color: var(--sidebar-accent-foreground);\n  }\n\n  .peer-data-\\[size\\=default\\]\\/menu-button\\:top-1\\.5:is(:where(.peer\\/menu-button)[data-size=\"default\"] ~ *) {\n    top: calc(var(--spacing) * 1.5);\n  }\n\n  .peer-data-\\[size\\=lg\\]\\/menu-button\\:top-2\\.5:is(:where(.peer\\/menu-button)[data-size=\"lg\"] ~ *) {\n    top: calc(var(--spacing) * 2.5);\n  }\n\n  .peer-data-\\[size\\=sm\\]\\/menu-button\\:top-1:is(:where(.peer\\/menu-button)[data-size=\"sm\"] ~ *) {\n    top: calc(var(--spacing) * 1);\n  }\n\n  .selection\\:bg-primary ::selection {\n    background-color: var(--primary);\n  }\n\n  .selection\\:bg-primary::selection {\n    background-color: var(--primary);\n  }\n\n  .selection\\:text-primary-foreground ::selection {\n    color: var(--primary-foreground);\n  }\n\n  .selection\\:text-primary-foreground::selection {\n    color: var(--primary-foreground);\n  }\n\n  .file\\:inline-flex::file-selector-button {\n    display: inline-flex;\n  }\n\n  .file\\:h-7::file-selector-button {\n    height: calc(var(--spacing) * 7);\n  }\n\n  .file\\:border-0::file-selector-button {\n    border-style: var(--tw-border-style);\n    border-width: 0;\n  }\n\n  .file\\:bg-transparent::file-selector-button {\n    background-color: #0000;\n  }\n\n  .file\\:text-sm::file-selector-button {\n    font-size: var(--text-sm);\n    line-height: var(--tw-leading, var(--text-sm--line-height));\n  }\n\n  .file\\:font-medium::file-selector-button {\n    --tw-font-weight: var(--font-weight-medium);\n    font-weight: var(--font-weight-medium);\n  }\n\n  .file\\:text-foreground::file-selector-button {\n    color: var(--foreground);\n  }\n\n  .placeholder\\:text-muted-foreground::placeholder {\n    color: var(--muted-foreground);\n  }\n\n  .after\\:absolute:after {\n    content: var(--tw-content);\n    position: absolute;\n  }\n\n  .after\\:-inset-2:after {\n    content: var(--tw-content);\n    inset: calc(var(--spacing) * -2);\n  }\n\n  .after\\:inset-0:after {\n    content: var(--tw-content);\n    inset: calc(var(--spacing) * 0);\n  }\n\n  .after\\:inset-y-0:after {\n    content: var(--tw-content);\n    inset-block: calc(var(--spacing) * 0);\n  }\n\n  .after\\:top-1\\/2:after {\n    content: var(--tw-content);\n    top: 50%;\n  }\n\n  .after\\:left-1\\/2:after {\n    content: var(--tw-content);\n    left: 50%;\n  }\n\n  .after\\:z-0:after {\n    content: var(--tw-content);\n    z-index: 0;\n  }\n\n  .after\\:flex:after {\n    content: var(--tw-content);\n    display: flex;\n  }\n\n  .after\\:w-\\[2px\\]:after {\n    content: var(--tw-content);\n    width: 2px;\n  }\n\n  .after\\:items-center:after {\n    content: var(--tw-content);\n    align-items: center;\n  }\n\n  .after\\:border-t:after {\n    content: var(--tw-content);\n    border-top-style: var(--tw-border-style);\n    border-top-width: 1px;\n  }\n\n  .after\\:border-border:after {\n    content: var(--tw-content);\n    border-color: var(--border);\n  }\n\n  .group-data-\\[collapsible\\=offcanvas\\]\\:after\\:left-full:is(:where(.group)[data-collapsible=\"offcanvas\"] *):after {\n    content: var(--tw-content);\n    left: 100%;\n  }\n\n  @media (hover: hover) {\n    .hover\\:scale-105:hover {\n      --tw-scale-x: 105%;\n      --tw-scale-y: 105%;\n      --tw-scale-z: 105%;\n      scale: var(--tw-scale-x) var(--tw-scale-y);\n    }\n\n    .hover\\:border-border:hover {\n      border-color: var(--border);\n    }\n\n    .hover\\:border-primary\\/50:hover {\n      border-color: #18181b80;\n    }\n\n    @supports (color: color-mix(in lab, red, red)) {\n      .hover\\:border-primary\\/50:hover {\n        border-color: color-mix(in oklab, var(--primary) 50%, transparent);\n      }\n    }\n\n    .hover\\:bg-accent:hover {\n      background-color: var(--accent);\n    }\n\n    .hover\\:bg-destructive\\/90:hover {\n      background-color: #e40014e6;\n    }\n\n    @supports (color: color-mix(in lab, red, red)) {\n      .hover\\:bg-destructive\\/90:hover {\n        background-color: color-mix(in oklab, var(--destructive) 90%, transparent);\n      }\n    }\n\n    .hover\\:bg-green-700:hover {\n      background-color: var(--color-green-700);\n    }\n\n    .hover\\:bg-muted:hover {\n      background-color: var(--muted);\n    }\n\n    .hover\\:bg-muted\\/50:hover {\n      background-color: #f4f4f580;\n    }\n\n    @supports (color: color-mix(in lab, red, red)) {\n      .hover\\:bg-muted\\/50:hover {\n        background-color: color-mix(in oklab, var(--muted) 50%, transparent);\n      }\n    }\n\n    .hover\\:bg-primary\\/90:hover {\n      background-color: #18181be6;\n    }\n\n    @supports (color: color-mix(in lab, red, red)) {\n      .hover\\:bg-primary\\/90:hover {\n        background-color: color-mix(in oklab, var(--primary) 90%, transparent);\n      }\n    }\n\n    .hover\\:bg-secondary\\/80:hover {\n      background-color: #f4f4f5cc;\n    }\n\n    @supports (color: color-mix(in lab, red, red)) {\n      .hover\\:bg-secondary\\/80:hover {\n        background-color: color-mix(in oklab, var(--secondary) 80%, transparent);\n      }\n    }\n\n    .hover\\:bg-sidebar-accent:hover {\n      background-color: var(--sidebar-accent);\n    }\n\n    .hover\\:bg-white:hover {\n      background-color: var(--color-white);\n    }\n\n    .hover\\:text-accent-foreground:hover {\n      color: var(--accent-foreground);\n    }\n\n    .hover\\:text-destructive:hover {\n      color: var(--destructive);\n    }\n\n    .hover\\:text-foreground:hover {\n      color: var(--foreground);\n    }\n\n    .hover\\:text-foreground\\/80:hover {\n      color: #09090bcc;\n    }\n\n    @supports (color: color-mix(in lab, red, red)) {\n      .hover\\:text-foreground\\/80:hover {\n        color: color-mix(in oklab, var(--foreground) 80%, transparent);\n      }\n    }\n\n    .hover\\:text-primary:hover {\n      color: var(--primary);\n    }\n\n    .hover\\:text-sidebar-accent-foreground:hover {\n      color: var(--sidebar-accent-foreground);\n    }\n\n    .hover\\:underline:hover {\n      text-decoration-line: underline;\n    }\n\n    .hover\\:opacity-100:hover {\n      opacity: 1;\n    }\n\n    .hover\\:shadow-\\[0_0_0_1px_hsl\\(var\\(--sidebar-accent\\)\\)\\]:hover {\n      --tw-shadow: 0 0 0 1px var(--tw-shadow-color, hsl(var(--sidebar-accent)));\n      box-shadow: var(--tw-inset-shadow), var(--tw-inset-ring-shadow), var(--tw-ring-offset-shadow), var(--tw-ring-shadow), var(--tw-shadow);\n    }\n\n    .hover\\:group-data-\\[collapsible\\=offcanvas\\]\\:bg-sidebar:hover:is(:where(.group)[data-collapsible=\"offcanvas\"] *) {\n      background-color: var(--sidebar);\n    }\n\n    .hover\\:after\\:bg-sidebar-border:hover:after {\n      content: var(--tw-content);\n      background-color: var(--sidebar-border);\n    }\n  }\n\n  .focus\\:bg-accent:focus {\n    background-color: var(--accent);\n  }\n\n  .focus\\:text-accent-foreground:focus {\n    color: var(--accent-foreground);\n  }\n\n  .focus\\:ring-2:focus {\n    --tw-ring-shadow: var(--tw-ring-inset, ) 0 0 0 calc(2px + var(--tw-ring-offset-width)) var(--tw-ring-color, currentcolor);\n    box-shadow: var(--tw-inset-shadow), var(--tw-inset-ring-shadow), var(--tw-ring-offset-shadow), var(--tw-ring-shadow), var(--tw-shadow);\n  }\n\n  .focus\\:ring-black:focus {\n    --tw-ring-color: var(--color-black);\n  }\n\n  .focus\\:ring-ring:focus {\n    --tw-ring-color: var(--ring);\n  }\n\n  .focus\\:ring-offset-2:focus {\n    --tw-ring-offset-width: 2px;\n    --tw-ring-offset-shadow: var(--tw-ring-inset, ) 0 0 0 var(--tw-ring-offset-width) var(--tw-ring-offset-color);\n  }\n\n  .focus\\:outline-hidden:focus {\n    --tw-outline-style: none;\n    outline-style: none;\n  }\n\n  @media (forced-colors: active) {\n    .focus\\:outline-hidden:focus {\n      outline-offset: 2px;\n      outline: 2px solid #0000;\n    }\n  }\n\n  .focus\\:outline-none:focus {\n    --tw-outline-style: none;\n    outline-style: none;\n  }\n\n  .focus-visible\\:border-ring:focus-visible {\n    border-color: var(--ring);\n  }\n\n  .focus-visible\\:ring-1:focus-visible {\n    --tw-ring-shadow: var(--tw-ring-inset, ) 0 0 0 calc(1px + var(--tw-ring-offset-width)) var(--tw-ring-color, currentcolor);\n    box-shadow: var(--tw-inset-shadow), var(--tw-inset-ring-shadow), var(--tw-ring-offset-shadow), var(--tw-ring-shadow), var(--tw-shadow);\n  }\n\n  .focus-visible\\:ring-2:focus-visible {\n    --tw-ring-shadow: var(--tw-ring-inset, ) 0 0 0 calc(2px + var(--tw-ring-offset-width)) var(--tw-ring-color, currentcolor);\n    box-shadow: var(--tw-inset-shadow), var(--tw-inset-ring-shadow), var(--tw-ring-offset-shadow), var(--tw-ring-shadow), var(--tw-shadow);\n  }\n\n  .focus-visible\\:ring-\\[3px\\]:focus-visible {\n    --tw-ring-shadow: var(--tw-ring-inset, ) 0 0 0 calc(3px + var(--tw-ring-offset-width)) var(--tw-ring-color, currentcolor);\n    box-shadow: var(--tw-inset-shadow), var(--tw-inset-ring-shadow), var(--tw-ring-offset-shadow), var(--tw-ring-shadow), var(--tw-shadow);\n  }\n\n  .focus-visible\\:ring-destructive\\/20:focus-visible {\n    --tw-ring-color: #e4001433;\n  }\n\n  @supports (color: color-mix(in lab, red, red)) {\n    .focus-visible\\:ring-destructive\\/20:focus-visible {\n      --tw-ring-color: color-mix(in oklab, var(--destructive) 20%, transparent);\n    }\n  }\n\n  .focus-visible\\:ring-ring:focus-visible {\n    --tw-ring-color: var(--ring);\n  }\n\n  .focus-visible\\:ring-ring\\/50:focus-visible {\n    --tw-ring-color: #9f9fa980;\n  }\n\n  @supports (color: color-mix(in lab, red, red)) {\n    .focus-visible\\:ring-ring\\/50:focus-visible {\n      --tw-ring-color: color-mix(in oklab, var(--ring) 50%, transparent);\n    }\n  }\n\n  .focus-visible\\:outline-1:focus-visible {\n    outline-style: var(--tw-outline-style);\n    outline-width: 1px;\n  }\n\n  .focus-visible\\:outline-ring:focus-visible {\n    outline-color: var(--ring);\n  }\n\n  .focus-visible\\:outline-none:focus-visible {\n    --tw-outline-style: none;\n    outline-style: none;\n  }\n\n  .active\\:cursor-grabbing:active {\n    cursor: grabbing;\n  }\n\n  .active\\:bg-sidebar-accent:active {\n    background-color: var(--sidebar-accent);\n  }\n\n  .active\\:text-sidebar-accent-foreground:active {\n    color: var(--sidebar-accent-foreground);\n  }\n\n  .disabled\\:pointer-events-none:disabled {\n    pointer-events: none;\n  }\n\n  .disabled\\:cursor-not-allowed:disabled {\n    cursor: not-allowed;\n  }\n\n  .disabled\\:opacity-50:disabled {\n    opacity: .5;\n  }\n\n  :where([data-side=\"left\"]) .in-data-\\[side\\=left\\]\\:cursor-w-resize {\n    cursor: w-resize;\n  }\n\n  :where([data-side=\"right\"]) .in-data-\\[side\\=right\\]\\:cursor-e-resize {\n    cursor: e-resize;\n  }\n\n  .has-data-\\[slot\\=card-action\\]\\:grid-cols-\\[1fr_auto\\]:has([data-slot=\"card-action\"]) {\n    grid-template-columns: 1fr auto;\n  }\n\n  .has-data-\\[variant\\=inset\\]\\:bg-sidebar:has([data-variant=\"inset\"]) {\n    background-color: var(--sidebar);\n  }\n\n  .has-\\[\\>svg\\]\\:px-2\\.5:has( > svg) {\n    padding-inline: calc(var(--spacing) * 2.5);\n  }\n\n  .has-\\[\\>svg\\]\\:px-3:has( > svg) {\n    padding-inline: calc(var(--spacing) * 3);\n  }\n\n  .has-\\[\\>svg\\]\\:px-4:has( > svg) {\n    padding-inline: calc(var(--spacing) * 4);\n  }\n\n  .aria-disabled\\:pointer-events-none[aria-disabled=\"true\"] {\n    pointer-events: none;\n  }\n\n  .aria-disabled\\:opacity-50[aria-disabled=\"true\"] {\n    opacity: .5;\n  }\n\n  .aria-invalid\\:border-destructive[aria-invalid=\"true\"] {\n    border-color: var(--destructive);\n  }\n\n  .aria-invalid\\:ring-destructive\\/20[aria-invalid=\"true\"] {\n    --tw-ring-color: #e4001433;\n  }\n\n  @supports (color: color-mix(in lab, red, red)) {\n    .aria-invalid\\:ring-destructive\\/20[aria-invalid=\"true\"] {\n      --tw-ring-color: color-mix(in oklab, var(--destructive) 20%, transparent);\n    }\n  }\n\n  .data-\\[active\\=true\\]\\:border-border[data-active=\"true\"] {\n    border-color: var(--border);\n  }\n\n  .data-\\[active\\=true\\]\\:bg-sidebar-accent[data-active=\"true\"] {\n    background-color: var(--sidebar-accent);\n  }\n\n  .data-\\[active\\=true\\]\\:bg-white[data-active=\"true\"] {\n    background-color: var(--color-white);\n  }\n\n  .data-\\[active\\=true\\]\\:font-medium[data-active=\"true\"] {\n    --tw-font-weight: var(--font-weight-medium);\n    font-weight: var(--font-weight-medium);\n  }\n\n  .data-\\[active\\=true\\]\\:text-sidebar-accent-foreground[data-active=\"true\"] {\n    color: var(--sidebar-accent-foreground);\n  }\n\n  .data-\\[disabled\\]\\:pointer-events-none[data-disabled] {\n    pointer-events: none;\n  }\n\n  .data-\\[disabled\\]\\:opacity-50[data-disabled] {\n    opacity: .5;\n  }\n\n  .data-\\[inset\\]\\:pl-8[data-inset] {\n    padding-left: calc(var(--spacing) * 8);\n  }\n\n  .data-\\[orientation\\=horizontal\\]\\:h-px[data-orientation=\"horizontal\"] {\n    height: 1px;\n  }\n\n  .data-\\[orientation\\=horizontal\\]\\:w-full[data-orientation=\"horizontal\"] {\n    width: 100%;\n  }\n\n  .data-\\[orientation\\=vertical\\]\\:h-full[data-orientation=\"vertical\"] {\n    height: 100%;\n  }\n\n  .data-\\[orientation\\=vertical\\]\\:w-px[data-orientation=\"vertical\"] {\n    width: 1px;\n  }\n\n  .data-\\[placeholder\\]\\:text-muted-foreground[data-placeholder] {\n    color: var(--muted-foreground);\n  }\n\n  .data-\\[side\\=bottom\\]\\:translate-y-1[data-side=\"bottom\"] {\n    --tw-translate-y: calc(var(--spacing) * 1);\n    translate: var(--tw-translate-x) var(--tw-translate-y);\n  }\n\n  .data-\\[side\\=bottom\\]\\:slide-in-from-top-2[data-side=\"bottom\"] {\n    --tw-enter-translate-y: calc(2 * var(--spacing) * -1);\n  }\n\n  .data-\\[side\\=left\\]\\:-translate-x-1[data-side=\"left\"] {\n    --tw-translate-x: calc(var(--spacing) * -1);\n    translate: var(--tw-translate-x) var(--tw-translate-y);\n  }\n\n  .data-\\[side\\=left\\]\\:slide-in-from-right-2[data-side=\"left\"] {\n    --tw-enter-translate-x: calc(2 * var(--spacing));\n  }\n\n  .data-\\[side\\=right\\]\\:translate-x-1[data-side=\"right\"] {\n    --tw-translate-x: calc(var(--spacing) * 1);\n    translate: var(--tw-translate-x) var(--tw-translate-y);\n  }\n\n  .data-\\[side\\=right\\]\\:slide-in-from-left-2[data-side=\"right\"] {\n    --tw-enter-translate-x: calc(2 * var(--spacing) * -1);\n  }\n\n  .data-\\[side\\=top\\]\\:-translate-y-1[data-side=\"top\"] {\n    --tw-translate-y: calc(var(--spacing) * -1);\n    translate: var(--tw-translate-x) var(--tw-translate-y);\n  }\n\n  .data-\\[side\\=top\\]\\:slide-in-from-bottom-2[data-side=\"top\"] {\n    --tw-enter-translate-y: calc(2 * var(--spacing));\n  }\n\n  .data-\\[size\\=default\\]\\:h-9[data-size=\"default\"] {\n    height: calc(var(--spacing) * 9);\n  }\n\n  .data-\\[size\\=sm\\]\\:h-8[data-size=\"sm\"] {\n    height: calc(var(--spacing) * 8);\n  }\n\n  :is(.\\*\\:data-\\[slot\\=select-value\\]\\:line-clamp-1 > *)[data-slot=\"select-value\"] {\n    -webkit-line-clamp: 1;\n    -webkit-box-orient: vertical;\n    display: -webkit-box;\n    overflow: hidden;\n  }\n\n  :is(.\\*\\:data-\\[slot\\=select-value\\]\\:flex > *)[data-slot=\"select-value\"] {\n    display: flex;\n  }\n\n  :is(.\\*\\:data-\\[slot\\=select-value\\]\\:items-center > *)[data-slot=\"select-value\"] {\n    align-items: center;\n  }\n\n  :is(.\\*\\:data-\\[slot\\=select-value\\]\\:gap-2 > *)[data-slot=\"select-value\"] {\n    gap: calc(var(--spacing) * 2);\n  }\n\n  .data-\\[state\\=active\\]\\:bg-background[data-state=\"active\"] {\n    background-color: var(--background);\n  }\n\n  .data-\\[state\\=active\\]\\:shadow-sm[data-state=\"active\"] {\n    --tw-shadow: 0 1px 3px 0 var(--tw-shadow-color, #0000001a), 0 1px 2px -1px var(--tw-shadow-color, #0000001a);\n    box-shadow: var(--tw-inset-shadow), var(--tw-inset-ring-shadow), var(--tw-ring-offset-shadow), var(--tw-ring-shadow), var(--tw-shadow);\n  }\n\n  .data-\\[state\\=checked\\]\\:translate-x-\\[calc\\(100\\%-2px\\)\\][data-state=\"checked\"] {\n    --tw-translate-x: calc(100% - 2px);\n    translate: var(--tw-translate-x) var(--tw-translate-y);\n  }\n\n  .data-\\[state\\=checked\\]\\:bg-primary[data-state=\"checked\"] {\n    background-color: var(--primary);\n  }\n\n  .data-\\[state\\=closed\\]\\:animate-out[data-state=\"closed\"] {\n    animation: exit var(--tw-animation-duration, var(--tw-duration, .15s)) var(--tw-ease, ease) var(--tw-animation-delay, 0s) var(--tw-animation-iteration-count, 1) var(--tw-animation-direction, normal) var(--tw-animation-fill-mode, none);\n  }\n\n  .data-\\[state\\=closed\\]\\:duration-300[data-state=\"closed\"] {\n    --tw-duration: .3s;\n    transition-duration: .3s;\n  }\n\n  .data-\\[state\\=closed\\]\\:fade-out-0[data-state=\"closed\"] {\n    --tw-exit-opacity: 0;\n  }\n\n  .data-\\[state\\=closed\\]\\:zoom-out-95[data-state=\"closed\"] {\n    --tw-exit-scale: .95;\n  }\n\n  .data-\\[state\\=closed\\]\\:slide-out-to-bottom[data-state=\"closed\"] {\n    --tw-exit-translate-y: 100%;\n  }\n\n  .data-\\[state\\=closed\\]\\:slide-out-to-left[data-state=\"closed\"] {\n    --tw-exit-translate-x: -100%;\n  }\n\n  .data-\\[state\\=closed\\]\\:slide-out-to-right[data-state=\"closed\"] {\n    --tw-exit-translate-x: 100%;\n  }\n\n  .data-\\[state\\=closed\\]\\:slide-out-to-top[data-state=\"closed\"] {\n    --tw-exit-translate-y: -100%;\n  }\n\n  .data-\\[state\\=open\\]\\:animate-in[data-state=\"open\"] {\n    animation: enter var(--tw-animation-duration, var(--tw-duration, .15s)) var(--tw-ease, ease) var(--tw-animation-delay, 0s) var(--tw-animation-iteration-count, 1) var(--tw-animation-direction, normal) var(--tw-animation-fill-mode, none);\n  }\n\n  .data-\\[state\\=open\\]\\:bg-accent[data-state=\"open\"] {\n    background-color: var(--accent);\n  }\n\n  .data-\\[state\\=open\\]\\:bg-secondary[data-state=\"open\"] {\n    background-color: var(--secondary);\n  }\n\n  .data-\\[state\\=open\\]\\:bg-sidebar-accent[data-state=\"open\"] {\n    background-color: var(--sidebar-accent);\n  }\n\n  .data-\\[state\\=open\\]\\:text-accent-foreground[data-state=\"open\"] {\n    color: var(--accent-foreground);\n  }\n\n  .data-\\[state\\=open\\]\\:text-muted-foreground[data-state=\"open\"] {\n    color: var(--muted-foreground);\n  }\n\n  .data-\\[state\\=open\\]\\:text-sidebar-accent-foreground[data-state=\"open\"] {\n    color: var(--sidebar-accent-foreground);\n  }\n\n  .data-\\[state\\=open\\]\\:opacity-100[data-state=\"open\"] {\n    opacity: 1;\n  }\n\n  .data-\\[state\\=open\\]\\:duration-500[data-state=\"open\"] {\n    --tw-duration: .5s;\n    transition-duration: .5s;\n  }\n\n  .data-\\[state\\=open\\]\\:fade-in-0[data-state=\"open\"] {\n    --tw-enter-opacity: 0;\n  }\n\n  .data-\\[state\\=open\\]\\:zoom-in-95[data-state=\"open\"] {\n    --tw-enter-scale: .95;\n  }\n\n  .data-\\[state\\=open\\]\\:slide-in-from-bottom[data-state=\"open\"] {\n    --tw-enter-translate-y: 100%;\n  }\n\n  .data-\\[state\\=open\\]\\:slide-in-from-left[data-state=\"open\"] {\n    --tw-enter-translate-x: -100%;\n  }\n\n  .data-\\[state\\=open\\]\\:slide-in-from-right[data-state=\"open\"] {\n    --tw-enter-translate-x: 100%;\n  }\n\n  .data-\\[state\\=open\\]\\:slide-in-from-top[data-state=\"open\"] {\n    --tw-enter-translate-y: -100%;\n  }\n\n  @media (hover: hover) {\n    .data-\\[state\\=open\\]\\:hover\\:text-sidebar-accent-foreground[data-state=\"open\"]:hover {\n      color: var(--sidebar-accent-foreground);\n    }\n  }\n\n  .data-\\[state\\=selected\\]\\:bg-muted[data-state=\"selected\"] {\n    background-color: var(--muted);\n  }\n\n  .data-\\[state\\=unchecked\\]\\:translate-x-0[data-state=\"unchecked\"] {\n    --tw-translate-x: calc(var(--spacing) * 0);\n    translate: var(--tw-translate-x) var(--tw-translate-y);\n  }\n\n  .data-\\[state\\=unchecked\\]\\:bg-input[data-state=\"unchecked\"] {\n    background-color: var(--input);\n  }\n\n  .data-\\[variant\\=destructive\\]\\:text-destructive[data-variant=\"destructive\"] {\n    color: var(--destructive);\n  }\n\n  .data-\\[variant\\=destructive\\]\\:focus\\:bg-destructive\\/10[data-variant=\"destructive\"]:focus {\n    background-color: #e400141a;\n  }\n\n  @supports (color: color-mix(in lab, red, red)) {\n    .data-\\[variant\\=destructive\\]\\:focus\\:bg-destructive\\/10[data-variant=\"destructive\"]:focus {\n      background-color: color-mix(in oklab, var(--destructive) 10%, transparent);\n    }\n  }\n\n  .data-\\[variant\\=destructive\\]\\:focus\\:text-destructive[data-variant=\"destructive\"]:focus {\n    color: var(--destructive);\n  }\n\n  @supports ((-webkit-backdrop-filter: var(--tw)) or (backdrop-filter: var(--tw))) {\n    .supports-backdrop-filter\\:bg-background\\/60 {\n      background-color: #fff9;\n    }\n\n    @supports (color: color-mix(in lab, red, red)) {\n      .supports-backdrop-filter\\:bg-background\\/60 {\n        background-color: color-mix(in oklab, var(--background) 60%, transparent);\n      }\n    }\n  }\n\n  @media not all and (min-width: 40rem) {\n    .max-sm\\:flex-col {\n      flex-direction: column;\n    }\n\n    .max-sm\\:text-sm {\n      font-size: var(--text-sm);\n      line-height: var(--tw-leading, var(--text-sm--line-height));\n    }\n\n    .max-sm\\:text-xs {\n      font-size: var(--text-xs);\n      line-height: var(--tw-leading, var(--text-xs--line-height));\n    }\n  }\n\n  @media (min-width: 40rem) {\n    .sm\\:block {\n      display: block;\n    }\n\n    .sm\\:flex {\n      display: flex;\n    }\n\n    .sm\\:w-\\[350px\\] {\n      width: 350px;\n    }\n\n    .sm\\:max-w-\\[425px\\] {\n      max-width: 425px;\n    }\n\n    .sm\\:max-w-sm {\n      max-width: var(--container-sm);\n    }\n\n    .sm\\:grid-cols-2 {\n      grid-template-columns: repeat(2, minmax(0, 1fr));\n    }\n\n    .sm\\:flex-row {\n      flex-direction: row;\n    }\n\n    .sm\\:items-center {\n      align-items: center;\n    }\n\n    .sm\\:justify-end {\n      justify-content: flex-end;\n    }\n\n    .sm\\:rounded-xl {\n      border-radius: calc(var(--radius)  + 4px);\n    }\n\n    .sm\\:text-left {\n      text-align: left;\n    }\n\n    .sm\\:text-4xl {\n      font-size: var(--text-4xl);\n      line-height: var(--tw-leading, var(--text-4xl--line-height));\n    }\n\n    .sm\\:text-sm {\n      font-size: var(--text-sm);\n      line-height: var(--tw-leading, var(--text-sm--line-height));\n    }\n  }\n\n  @media (min-width: 48rem) {\n    .md\\:col-span-5 {\n      grid-column: span 5 / span 5;\n    }\n\n    .md\\:col-span-7 {\n      grid-column: span 7 / span 7;\n    }\n\n    .md\\:block {\n      display: block;\n    }\n\n    .md\\:flex {\n      display: flex;\n    }\n\n    .md\\:h-\\[600px\\] {\n      height: 600px;\n    }\n\n    .md\\:max-w-sm {\n      max-width: var(--container-sm);\n    }\n\n    .md\\:grid-cols-2 {\n      grid-template-columns: repeat(2, minmax(0, 1fr));\n    }\n\n    .md\\:grid-cols-12 {\n      grid-template-columns: repeat(12, minmax(0, 1fr));\n    }\n\n    .md\\:flex-row {\n      flex-direction: row;\n    }\n\n    .md\\:items-center {\n      align-items: center;\n    }\n\n    .md\\:justify-between {\n      justify-content: space-between;\n    }\n\n    .md\\:p-8 {\n      padding: calc(var(--spacing) * 8);\n    }\n\n    .md\\:p-10 {\n      padding: calc(var(--spacing) * 10);\n    }\n\n    .md\\:text-sm {\n      font-size: var(--text-sm);\n      line-height: var(--tw-leading, var(--text-sm--line-height));\n    }\n\n    .md\\:opacity-0 {\n      opacity: 0;\n    }\n\n    .md\\:peer-data-\\[variant\\=inset\\]\\:m-2:is(:where(.peer)[data-variant=\"inset\"] ~ *) {\n      margin: calc(var(--spacing) * 2);\n    }\n\n    .md\\:peer-data-\\[variant\\=inset\\]\\:ml-0:is(:where(.peer)[data-variant=\"inset\"] ~ *) {\n      margin-left: calc(var(--spacing) * 0);\n    }\n\n    .md\\:peer-data-\\[variant\\=inset\\]\\:rounded-xl:is(:where(.peer)[data-variant=\"inset\"] ~ *) {\n      border-radius: calc(var(--radius)  + 4px);\n    }\n\n    .md\\:peer-data-\\[variant\\=inset\\]\\:shadow-sm:is(:where(.peer)[data-variant=\"inset\"] ~ *) {\n      --tw-shadow: 0 1px 3px 0 var(--tw-shadow-color, #0000001a), 0 1px 2px -1px var(--tw-shadow-color, #0000001a);\n      box-shadow: var(--tw-inset-shadow), var(--tw-inset-ring-shadow), var(--tw-ring-offset-shadow), var(--tw-ring-shadow), var(--tw-shadow);\n    }\n\n    .md\\:peer-data-\\[variant\\=inset\\]\\:peer-data-\\[state\\=collapsed\\]\\:ml-2:is(:where(.peer)[data-variant=\"inset\"] ~ *):is(:where(.peer)[data-state=\"collapsed\"] ~ *) {\n      margin-left: calc(var(--spacing) * 2);\n    }\n\n    .md\\:after\\:hidden:after {\n      content: var(--tw-content);\n      display: none;\n    }\n  }\n\n  @media (min-width: 64rem) {\n    .lg\\:col-span-2 {\n      grid-column: span 2 / span 2;\n    }\n\n    .lg\\:w-72 {\n      width: calc(var(--spacing) * 72);\n    }\n\n    .lg\\:grid-cols-3 {\n      grid-template-columns: repeat(3, minmax(0, 1fr));\n    }\n\n    .lg\\:flex-row {\n      flex-direction: row;\n    }\n\n    .lg\\:border-r {\n      border-right-style: var(--tw-border-style);\n      border-right-width: 1px;\n    }\n\n    .lg\\:border-b-0 {\n      border-bottom-style: var(--tw-border-style);\n      border-bottom-width: 0;\n    }\n  }\n\n  .dark\\:scale-0:is(.dark *) {\n    --tw-scale-x: 0%;\n    --tw-scale-y: 0%;\n    --tw-scale-z: 0%;\n    scale: var(--tw-scale-x) var(--tw-scale-y);\n  }\n\n  .dark\\:scale-100:is(.dark *) {\n    --tw-scale-x: 100%;\n    --tw-scale-y: 100%;\n    --tw-scale-z: 100%;\n    scale: var(--tw-scale-x) var(--tw-scale-y);\n  }\n\n  .dark\\:-rotate-90:is(.dark *) {\n    rotate: -90deg;\n  }\n\n  .dark\\:rotate-0:is(.dark *) {\n    rotate: none;\n  }\n\n  .dark\\:border-input:is(.dark *) {\n    border-color: var(--input);\n  }\n\n  .dark\\:bg-destructive\\/60:is(.dark *) {\n    background-color: #e4001499;\n  }\n\n  @supports (color: color-mix(in lab, red, red)) {\n    .dark\\:bg-destructive\\/60:is(.dark *) {\n      background-color: color-mix(in oklab, var(--destructive) 60%, transparent);\n    }\n  }\n\n  .dark\\:bg-input\\/30:is(.dark *) {\n    background-color: #e4e4e74d;\n  }\n\n  @supports (color: color-mix(in lab, red, red)) {\n    .dark\\:bg-input\\/30:is(.dark *) {\n      background-color: color-mix(in oklab, var(--input) 30%, transparent);\n    }\n  }\n\n  .dark\\:text-muted-foreground:is(.dark *) {\n    color: var(--muted-foreground);\n  }\n\n  @media (hover: hover) {\n    .dark\\:hover\\:bg-accent\\/50:is(.dark *):hover {\n      background-color: #f4f4f580;\n    }\n\n    @supports (color: color-mix(in lab, red, red)) {\n      .dark\\:hover\\:bg-accent\\/50:is(.dark *):hover {\n        background-color: color-mix(in oklab, var(--accent) 50%, transparent);\n      }\n    }\n\n    .dark\\:hover\\:bg-input\\/50:is(.dark *):hover {\n      background-color: #e4e4e780;\n    }\n\n    @supports (color: color-mix(in lab, red, red)) {\n      .dark\\:hover\\:bg-input\\/50:is(.dark *):hover {\n        background-color: color-mix(in oklab, var(--input) 50%, transparent);\n      }\n    }\n  }\n\n  .dark\\:focus-visible\\:ring-destructive\\/40:is(.dark *):focus-visible {\n    --tw-ring-color: #e4001466;\n  }\n\n  @supports (color: color-mix(in lab, red, red)) {\n    .dark\\:focus-visible\\:ring-destructive\\/40:is(.dark *):focus-visible {\n      --tw-ring-color: color-mix(in oklab, var(--destructive) 40%, transparent);\n    }\n  }\n\n  .dark\\:aria-invalid\\:ring-destructive\\/40:is(.dark *)[aria-invalid=\"true\"] {\n    --tw-ring-color: #e4001466;\n  }\n\n  @supports (color: color-mix(in lab, red, red)) {\n    .dark\\:aria-invalid\\:ring-destructive\\/40:is(.dark *)[aria-invalid=\"true\"] {\n      --tw-ring-color: color-mix(in oklab, var(--destructive) 40%, transparent);\n    }\n  }\n\n  .dark\\:data-\\[state\\=active\\]\\:border-input:is(.dark *)[data-state=\"active\"] {\n    border-color: var(--input);\n  }\n\n  .dark\\:data-\\[state\\=active\\]\\:bg-input\\/30:is(.dark *)[data-state=\"active\"] {\n    background-color: #e4e4e74d;\n  }\n\n  @supports (color: color-mix(in lab, red, red)) {\n    .dark\\:data-\\[state\\=active\\]\\:bg-input\\/30:is(.dark *)[data-state=\"active\"] {\n      background-color: color-mix(in oklab, var(--input) 30%, transparent);\n    }\n  }\n\n  .dark\\:data-\\[state\\=active\\]\\:text-foreground:is(.dark *)[data-state=\"active\"] {\n    color: var(--foreground);\n  }\n\n  .dark\\:data-\\[state\\=checked\\]\\:bg-primary-foreground:is(.dark *)[data-state=\"checked\"] {\n    background-color: var(--primary-foreground);\n  }\n\n  .dark\\:data-\\[state\\=unchecked\\]\\:bg-foreground:is(.dark *)[data-state=\"unchecked\"] {\n    background-color: var(--foreground);\n  }\n\n  .dark\\:data-\\[state\\=unchecked\\]\\:bg-input\\/80:is(.dark *)[data-state=\"unchecked\"] {\n    background-color: #e4e4e7cc;\n  }\n\n  @supports (color: color-mix(in lab, red, red)) {\n    .dark\\:data-\\[state\\=unchecked\\]\\:bg-input\\/80:is(.dark *)[data-state=\"unchecked\"] {\n      background-color: color-mix(in oklab, var(--input) 80%, transparent);\n    }\n  }\n\n  .dark\\:data-\\[variant\\=destructive\\]\\:focus\\:bg-destructive\\/20:is(.dark *)[data-variant=\"destructive\"]:focus {\n    background-color: #e4001433;\n  }\n\n  @supports (color: color-mix(in lab, red, red)) {\n    .dark\\:data-\\[variant\\=destructive\\]\\:focus\\:bg-destructive\\/20:is(.dark *)[data-variant=\"destructive\"]:focus {\n      background-color: color-mix(in oklab, var(--destructive) 20%, transparent);\n    }\n  }\n\n  .\\[\\&_svg\\]\\:pointer-events-none svg {\n    pointer-events: none;\n  }\n\n  .\\[\\&_svg\\]\\:shrink-0 svg {\n    flex-shrink: 0;\n  }\n\n  .\\[\\&_svg\\:not\\(\\[class\\*\\=\\'size-\\'\\]\\)\\]\\:size-4 svg:not([class*=\"size-\"]) {\n    width: calc(var(--spacing) * 4);\n    height: calc(var(--spacing) * 4);\n  }\n\n  .\\[\\&_svg\\:not\\(\\[class\\*\\=\\'text-\\'\\]\\)\\]\\:text-muted-foreground svg:not([class*=\"text-\"]) {\n    color: var(--muted-foreground);\n  }\n\n  .\\[\\&_tr\\]\\:border-b tr {\n    border-bottom-style: var(--tw-border-style);\n    border-bottom-width: 1px;\n  }\n\n  .\\[\\&_tr\\:last-child\\]\\:border-0 tr:last-child {\n    border-style: var(--tw-border-style);\n    border-width: 0;\n  }\n\n  .\\[\\&\\:has\\(\\[role\\=checkbox\\]\\)\\]\\:pr-0:has([role=\"checkbox\"]) {\n    padding-right: calc(var(--spacing) * 0);\n  }\n\n  .\\[\\.border-b\\]\\:pb-6.border-b {\n    padding-bottom: calc(var(--spacing) * 6);\n  }\n\n  .\\[\\.border-t\\]\\:pt-6.border-t {\n    padding-top: calc(var(--spacing) * 6);\n  }\n\n  :is(.\\*\\:\\[span\\]\\:last\\:flex > *):is(span):last-child {\n    display: flex;\n  }\n\n  :is(.\\*\\:\\[span\\]\\:last\\:items-center > *):is(span):last-child {\n    align-items: center;\n  }\n\n  :is(.\\*\\:\\[span\\]\\:last\\:gap-2 > *):is(span):last-child {\n    gap: calc(var(--spacing) * 2);\n  }\n\n  :is(.data-\\[variant\\=destructive\\]\\:\\*\\:\\[svg\\]\\:\\!text-destructive[data-variant=\"destructive\"] > *):is(svg) {\n    color: var(--destructive) !important;\n  }\n\n  .\\[\\&\\>\\[role\\=checkbox\\]\\]\\:translate-y-\\[2px\\] > [role=\"checkbox\"] {\n    --tw-translate-y: 2px;\n    translate: var(--tw-translate-x) var(--tw-translate-y);\n  }\n\n  .\\[\\&\\>button\\]\\:hidden > button {\n    display: none;\n  }\n\n  .\\[\\&\\>span\\:last-child\\]\\:truncate > span:last-child {\n    text-overflow: ellipsis;\n    white-space: nowrap;\n    overflow: hidden;\n  }\n\n  .\\[\\&\\>svg\\]\\:pointer-events-none > svg {\n    pointer-events: none;\n  }\n\n  .\\[\\&\\>svg\\]\\:size-3 > svg {\n    width: calc(var(--spacing) * 3);\n    height: calc(var(--spacing) * 3);\n  }\n\n  .\\[\\&\\>svg\\]\\:size-5 > svg {\n    width: calc(var(--spacing) * 5);\n    height: calc(var(--spacing) * 5);\n  }\n\n  .\\[\\&\\>svg\\]\\:shrink-0 > svg {\n    flex-shrink: 0;\n  }\n\n  .\\[\\&\\>svg\\]\\:text-sidebar-accent-foreground > svg {\n    color: var(--sidebar-accent-foreground);\n  }\n\n  .\\[\\&\\>tr\\]\\:last\\:border-b-0 > tr:last-child {\n    border-bottom-style: var(--tw-border-style);\n    border-bottom-width: 0;\n  }\n\n  [data-side=\"left\"][data-collapsible=\"offcanvas\"] .\\[\\[data-side\\=left\\]\\[data-collapsible\\=offcanvas\\]_\\&\\]\\:-right-2 {\n    right: calc(var(--spacing) * -2);\n  }\n\n  [data-side=\"left\"][data-state=\"collapsed\"] .\\[\\[data-side\\=left\\]\\[data-state\\=collapsed\\]_\\&\\]\\:cursor-e-resize {\n    cursor: e-resize;\n  }\n\n  [data-side=\"right\"][data-collapsible=\"offcanvas\"] .\\[\\[data-side\\=right\\]\\[data-collapsible\\=offcanvas\\]_\\&\\]\\:-left-2 {\n    left: calc(var(--spacing) * -2);\n  }\n\n  [data-side=\"right\"][data-state=\"collapsed\"] .\\[\\[data-side\\=right\\]\\[data-state\\=collapsed\\]_\\&\\]\\:cursor-w-resize {\n    cursor: w-resize;\n  }\n\n  @media (hover: hover) {\n    a.\\[a\\&\\]\\:hover\\:bg-accent:hover {\n      background-color: var(--accent);\n    }\n\n    a.\\[a\\&\\]\\:hover\\:bg-destructive\\/90:hover {\n      background-color: #e40014e6;\n    }\n\n    @supports (color: color-mix(in lab, red, red)) {\n      a.\\[a\\&\\]\\:hover\\:bg-destructive\\/90:hover {\n        background-color: color-mix(in oklab, var(--destructive) 90%, transparent);\n      }\n    }\n\n    a.\\[a\\&\\]\\:hover\\:bg-primary\\/90:hover {\n      background-color: #18181be6;\n    }\n\n    @supports (color: color-mix(in lab, red, red)) {\n      a.\\[a\\&\\]\\:hover\\:bg-primary\\/90:hover {\n        background-color: color-mix(in oklab, var(--primary) 90%, transparent);\n      }\n    }\n\n    a.\\[a\\&\\]\\:hover\\:bg-secondary\\/90:hover {\n      background-color: #f4f4f5e6;\n    }\n\n    @supports (color: color-mix(in lab, red, red)) {\n      a.\\[a\\&\\]\\:hover\\:bg-secondary\\/90:hover {\n        background-color: color-mix(in oklab, var(--secondary) 90%, transparent);\n      }\n    }\n\n    a.\\[a\\&\\]\\:hover\\:text-accent-foreground:hover {\n      color: var(--accent-foreground);\n    }\n  }\n}\n\n@property --tw-animation-delay {\n  syntax: \"*\";\n  inherits: false;\n  initial-value: 0s;\n}\n\n@property --tw-animation-direction {\n  syntax: \"*\";\n  inherits: false;\n  initial-value: normal;\n}\n\n@property --tw-animation-duration {\n  syntax: \"*\";\n  inherits: false\n}\n\n@property --tw-animation-fill-mode {\n  syntax: \"*\";\n  inherits: false;\n  initial-value: none;\n}\n\n@property --tw-animation-iteration-count {\n  syntax: \"*\";\n  inherits: false;\n  initial-value: 1;\n}\n\n@property --tw-enter-blur {\n  syntax: \"*\";\n  inherits: false;\n  initial-value: 0;\n}\n\n@property --tw-enter-opacity {\n  syntax: \"*\";\n  inherits: false;\n  initial-value: 1;\n}\n\n@property --tw-enter-rotate {\n  syntax: \"*\";\n  inherits: false;\n  initial-value: 0;\n}\n\n@property --tw-enter-scale {\n  syntax: \"*\";\n  inherits: false;\n  initial-value: 1;\n}\n\n@property --tw-enter-translate-x {\n  syntax: \"*\";\n  inherits: false;\n  initial-value: 0;\n}\n\n@property --tw-enter-translate-y {\n  syntax: \"*\";\n  inherits: false;\n  initial-value: 0;\n}\n\n@property --tw-exit-blur {\n  syntax: \"*\";\n  inherits: false;\n  initial-value: 0;\n}\n\n@property --tw-exit-opacity {\n  syntax: \"*\";\n  inherits: false;\n  initial-value: 1;\n}\n\n@property --tw-exit-rotate {\n  syntax: \"*\";\n  inherits: false;\n  initial-value: 0;\n}\n\n@property --tw-exit-scale {\n  syntax: \"*\";\n  inherits: false;\n  initial-value: 1;\n}\n\n@property --tw-exit-translate-x {\n  syntax: \"*\";\n  inherits: false;\n  initial-value: 0;\n}\n\n@property --tw-exit-translate-y {\n  syntax: \"*\";\n  inherits: false;\n  initial-value: 0;\n}\n\n.dark {\n  --background: oklch(14.1% .005 285.823);\n  --foreground: oklch(98.5% 0 0);\n  --card: oklch(21% .006 285.885);\n  --card-foreground: oklch(98.5% 0 0);\n  --popover: oklch(21% .006 285.885);\n  --popover-foreground: oklch(98.5% 0 0);\n  --primary: oklch(92% .004 286.32);\n  --primary-foreground: oklch(21% .006 285.885);\n  --secondary: oklch(27.4% .006 286.033);\n  --secondary-foreground: oklch(98.5% 0 0);\n  --muted: oklch(27.4% .006 286.033);\n  --muted-foreground: oklch(70.5% .015 286.067);\n  --accent: oklch(27.4% .006 286.033);\n  --accent-foreground: oklch(98.5% 0 0);\n  --destructive: oklch(70.4% .191 22.216);\n  --border: oklch(100% 0 0 / .1);\n  --input: oklch(100% 0 0 / .15);\n  --ring: oklch(55.2% .016 285.938);\n  --chart-1: oklch(48.8% .243 264.376);\n  --chart-2: oklch(69.6% .17 162.48);\n  --chart-3: oklch(76.9% .188 70.08);\n  --chart-4: oklch(62.7% .265 303.9);\n  --chart-5: oklch(64.5% .246 16.439);\n  --sidebar: oklch(21% .006 285.885);\n  --sidebar-foreground: oklch(98.5% 0 0);\n  --sidebar-primary: oklch(48.8% .243 264.376);\n  --sidebar-primary-foreground: oklch(98.5% 0 0);\n  --sidebar-accent: oklch(27.4% .006 286.033);\n  --sidebar-accent-foreground: oklch(98.5% 0 0);\n  --sidebar-border: oklch(100% 0 0 / .1);\n  --sidebar-ring: oklch(55.2% .016 285.938);\n}\n\n@property --tw-translate-x {\n  syntax: \"*\";\n  inherits: false;\n  initial-value: 0;\n}\n\n@property --tw-translate-y {\n  syntax: \"*\";\n  inherits: false;\n  initial-value: 0;\n}\n\n@property --tw-translate-z {\n  syntax: \"*\";\n  inherits: false;\n  initial-value: 0;\n}\n\n@property --tw-scale-x {\n  syntax: \"*\";\n  inherits: false;\n  initial-value: 1;\n}\n\n@property --tw-scale-y {\n  syntax: \"*\";\n  inherits: false;\n  initial-value: 1;\n}\n\n@property --tw-scale-z {\n  syntax: \"*\";\n  inherits: false;\n  initial-value: 1;\n}\n\n@property --tw-rotate-x {\n  syntax: \"*\";\n  inherits: false\n}\n\n@property --tw-rotate-y {\n  syntax: \"*\";\n  inherits: false\n}\n\n@property --tw-rotate-z {\n  syntax: \"*\";\n  inherits: false\n}\n\n@property --tw-skew-x {\n  syntax: \"*\";\n  inherits: false\n}\n\n@property --tw-skew-y {\n  syntax: \"*\";\n  inherits: false\n}\n\n@property --tw-space-y-reverse {\n  syntax: \"*\";\n  inherits: false;\n  initial-value: 0;\n}\n\n@property --tw-space-x-reverse {\n  syntax: \"*\";\n  inherits: false;\n  initial-value: 0;\n}\n\n@property --tw-divide-y-reverse {\n  syntax: \"*\";\n  inherits: false;\n  initial-value: 0;\n}\n\n@property --tw-border-style {\n  syntax: \"*\";\n  inherits: false;\n  initial-value: solid;\n}\n\n@property --tw-leading {\n  syntax: \"*\";\n  inherits: false\n}\n\n@property --tw-font-weight {\n  syntax: \"*\";\n  inherits: false\n}\n\n@property --tw-tracking {\n  syntax: \"*\";\n  inherits: false\n}\n\n@property --tw-ordinal {\n  syntax: \"*\";\n  inherits: false\n}\n\n@property --tw-slashed-zero {\n  syntax: \"*\";\n  inherits: false\n}\n\n@property --tw-numeric-figure {\n  syntax: \"*\";\n  inherits: false\n}\n\n@property --tw-numeric-spacing {\n  syntax: \"*\";\n  inherits: false\n}\n\n@property --tw-numeric-fraction {\n  syntax: \"*\";\n  inherits: false\n}\n\n@property --tw-shadow {\n  syntax: \"*\";\n  inherits: false;\n  initial-value: 0 0 #0000;\n}\n\n@property --tw-shadow-color {\n  syntax: \"*\";\n  inherits: false\n}\n\n@property --tw-shadow-alpha {\n  syntax: \"<percentage>\";\n  inherits: false;\n  initial-value: 100%;\n}\n\n@property --tw-inset-shadow {\n  syntax: \"*\";\n  inherits: false;\n  initial-value: 0 0 #0000;\n}\n\n@property --tw-inset-shadow-color {\n  syntax: \"*\";\n  inherits: false\n}\n\n@property --tw-inset-shadow-alpha {\n  syntax: \"<percentage>\";\n  inherits: false;\n  initial-value: 100%;\n}\n\n@property --tw-ring-color {\n  syntax: \"*\";\n  inherits: false\n}\n\n@property --tw-ring-shadow {\n  syntax: \"*\";\n  inherits: false;\n  initial-value: 0 0 #0000;\n}\n\n@property --tw-inset-ring-color {\n  syntax: \"*\";\n  inherits: false\n}\n\n@property --tw-inset-ring-shadow {\n  syntax: \"*\";\n  inherits: false;\n  initial-value: 0 0 #0000;\n}\n\n@property --tw-ring-inset {\n  syntax: \"*\";\n  inherits: false\n}\n\n@property --tw-ring-offset-width {\n  syntax: \"<length>\";\n  inherits: false;\n  initial-value: 0;\n}\n\n@property --tw-ring-offset-color {\n  syntax: \"*\";\n  inherits: false;\n  initial-value: #fff;\n}\n\n@property --tw-ring-offset-shadow {\n  syntax: \"*\";\n  inherits: false;\n  initial-value: 0 0 #0000;\n}\n\n@property --tw-outline-style {\n  syntax: \"*\";\n  inherits: false;\n  initial-value: solid;\n}\n\n@property --tw-blur {\n  syntax: \"*\";\n  inherits: false\n}\n\n@property --tw-brightness {\n  syntax: \"*\";\n  inherits: false\n}\n\n@property --tw-contrast {\n  syntax: \"*\";\n  inherits: false\n}\n\n@property --tw-grayscale {\n  syntax: \"*\";\n  inherits: false\n}\n\n@property --tw-hue-rotate {\n  syntax: \"*\";\n  inherits: false\n}\n\n@property --tw-invert {\n  syntax: \"*\";\n  inherits: false\n}\n\n@property --tw-opacity {\n  syntax: \"*\";\n  inherits: false\n}\n\n@property --tw-saturate {\n  syntax: \"*\";\n  inherits: false\n}\n\n@property --tw-sepia {\n  syntax: \"*\";\n  inherits: false\n}\n\n@property --tw-drop-shadow {\n  syntax: \"*\";\n  inherits: false\n}\n\n@property --tw-drop-shadow-color {\n  syntax: \"*\";\n  inherits: false\n}\n\n@property --tw-drop-shadow-alpha {\n  syntax: \"<percentage>\";\n  inherits: false;\n  initial-value: 100%;\n}\n\n@property --tw-drop-shadow-size {\n  syntax: \"*\";\n  inherits: false\n}\n\n@property --tw-backdrop-blur {\n  syntax: \"*\";\n  inherits: false\n}\n\n@property --tw-backdrop-brightness {\n  syntax: \"*\";\n  inherits: false\n}\n\n@property --tw-backdrop-contrast {\n  syntax: \"*\";\n  inherits: false\n}\n\n@property --tw-backdrop-grayscale {\n  syntax: \"*\";\n  inherits: false\n}\n\n@property --tw-backdrop-hue-rotate {\n  syntax: \"*\";\n  inherits: false\n}\n\n@property --tw-backdrop-invert {\n  syntax: \"*\";\n  inherits: false\n}\n\n@property --tw-backdrop-opacity {\n  syntax: \"*\";\n  inherits: false\n}\n\n@property --tw-backdrop-saturate {\n  syntax: \"*\";\n  inherits: false\n}\n\n@property --tw-backdrop-sepia {\n  syntax: \"*\";\n  inherits: false\n}\n\n@property --tw-duration {\n  syntax: \"*\";\n  inherits: false\n}\n\n@property --tw-ease {\n  syntax: \"*\";\n  inherits: false\n}\n\n@property --tw-content {\n  syntax: \"*\";\n  inherits: false;\n  initial-value: \"\";\n}\n\n@keyframes spin {\n  to {\n    transform: rotate(360deg);\n  }\n}\n\n@keyframes pulse {\n  50% {\n    opacity: .5;\n  }\n}\n\n@keyframes enter {\n  from {\n    opacity: var(--tw-enter-opacity, 1);\n    transform: translate3d(var(--tw-enter-translate-x, 0), var(--tw-enter-translate-y, 0), 0) scale3d(var(--tw-enter-scale, 1), var(--tw-enter-scale, 1), var(--tw-enter-scale, 1)) rotate(var(--tw-enter-rotate, 0));\n    filter: blur(var(--tw-enter-blur, 0));\n  }\n}\n\n@keyframes exit {\n  to {\n    opacity: var(--tw-exit-opacity, 1);\n    transform: translate3d(var(--tw-exit-translate-x, 0), var(--tw-exit-translate-y, 0), 0) scale3d(var(--tw-exit-scale, 1), var(--tw-exit-scale, 1), var(--tw-exit-scale, 1)) rotate(var(--tw-exit-rotate, 0));\n    filter: blur(var(--tw-exit-blur, 0));\n  }\n}\n";
	var queryClient = new QueryClient();
	var ssoToken = null;
	function WidgetContainer({ organizationId, selector }) {
		const [isOpen, setIsOpen] = (0, import_react.useState)(false);
		const [token, setToken] = (0, import_react.useState)(ssoToken);
		(0, import_react.useEffect)(() => {
			window.__setWidgetToken = setToken;
		}, []);
		(0, import_react.useEffect)(() => {
			if (selector) {
				const elements = document.querySelectorAll(selector);
				const handleClick = (e) => {
					e.preventDefault();
					setIsOpen(true);
				};
				elements.forEach((el) => el.addEventListener("click", handleClick));
				return () => {
					elements.forEach((el) => el.removeEventListener("click", handleClick));
				};
			}
		}, [selector]);
		return /* @__PURE__ */ (0, import_jsx_runtime.jsxs)(QueryClientProvider, {
			client: queryClient,
			children: [
				/* @__PURE__ */ (0, import_jsx_runtime.jsx)("style", { children: styles_default.replaceAll(":root", ":host").replaceAll("body", ":host") }),
				!selector && !isOpen && /* @__PURE__ */ (0, import_jsx_runtime.jsx)("button", {
					onClick: () => setIsOpen(true),
					className: "fixed right-4 bottom-4 z-50 flex h-14 w-14 cursor-pointer items-center justify-center rounded-full bg-black text-white shadow-lg transition-transform hover:scale-105 focus:ring-2 focus:ring-black focus:ring-offset-2 focus:outline-none",
					"aria-label": "Open feedback",
					children: /* @__PURE__ */ (0, import_jsx_runtime.jsx)(MessageCircleHeart, { className: "h-7 w-7" })
				}),
				/* @__PURE__ */ (0, import_jsx_runtime.jsx)(FeedbackWidget, {
					organizationId,
					isOpen,
					onClose: () => setIsOpen(false),
					ssoToken: token || void 0
				})
			]
		});
	}
	var activeOrganizationId = null;
	function initFeedbackWidget(config) {
		activeOrganizationId = config.organizationId;
		const containerId = "feedback-widget-container";
		if (document.getElementById(containerId)) return;
		const container = document.createElement("div");
		container.id = containerId;
		document.body.appendChild(container);
		const shadow = container.attachShadow({ mode: "open" });
		import_client.createRoot(shadow).render(/* @__PURE__ */ (0, import_jsx_runtime.jsx)(WidgetContainer, { ...config }));
	}
	function identify(token) {
		if (!activeOrganizationId) {
			console.error("Feedback Widget: Initialize widget before calling identify");
			return;
		}
		ssoToken = token;
		if (window.__setWidgetToken) window.__setWidgetToken(token);
		console.log("Feedback Widget: Identified with token");
	}
	if (typeof window !== "undefined") {
		window.initFeedbackWidget = initFeedbackWidget;
		window.feedbackWidget = { identify };
	}
	exports.identify = identify;
	exports.initFeedbackWidget = initFeedbackWidget;
	return exports;
})({});
