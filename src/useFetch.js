import { useEffect, useRef, useReducer, useCallback } from "react";
import { fetchDedupe, getRequestKey } from "fetch-dedupe";
import { useFetchContext } from "./FetchProvider";
import { stringifyIfJSON, isReadRequest } from "./utils";

const CACHE_POLICIES = {
  NETWORK_ONLY: "network-only",
  CACHE_AND_NETWORK: "cache-and-network",
  CACHE_FIRST: "cache-first"
};

const getDefaultCacheStrategy = method => {
  method = method.toUpperCase();

  if (method === "GET" || method === "HEAD" || method === "OPTIONS") {
    return CACHE_POLICIES.CACHE_FIRST;
  }

  return CACHE_POLICIES.NETWORK_ONLY;
};

const defaultOnError = error => console.error(error);
const defaultOnSuccess = () => null;

function reducer(state, action) {
  switch (action.type) {
    case "in-flight": {
      // Avoid updating state unnecessarily
      // By returning unchanged state React won't re-render
      if (state.fetching === true) {
        return state;
      }

      return {
        ...state,
        fetching: true
      };
    }

    case "response": {
      return {
        ...state,
        error: null,
        fetching: action.payload.fetching,
        response: action.payload.response
      };
    }

    case "error":
      return {
        ...state,
        fetching: false,
        error: action.payload.error
      };

    default:
      return state;
  }
}

const defaultRefreshDoFetch = requestKey => requestKey;

function useFetch({
  url,
  method = "GET",
  lazy = null,
  requestKey = null,
  init = {},
  dedupeOptions = {},
  cachePolicy = null,
  cacheResponse = null,
  onError = defaultOnError,
  onSuccess = defaultOnSuccess,
  refreshDoFetch = defaultRefreshDoFetch
}) {
  const responseCache = useFetchContext();

  const abortControllerRef = useRef();

  // Default GET|HEAD|OPTIONS requests to non-lazy (automatically request onMount)
  // all else lazy (only requested when doFetch is called)
  const isLazy = lazy == null ? !isReadRequest(method) : lazy;

  const cacheStrategy =
    cachePolicy === null ? getDefaultCacheStrategy(method) : cachePolicy;

  const [state, dispatch] = useReducer(reducer, {
    response: null,
    fetching: !isLazy,
    error: null
  });

  // Builds a key based on URL, method and headers.
  // requestKey is used to determine if the request parameters have changed
  // and as key in the response cache.
  const finalRequestKey = requestKey
    ? requestKey
    : getRequestKey({ url, method: method.toUpperCase(), ...init });

  function setFetching() {
    dispatch({ type: "in-flight" });
  }

  function setResponse(response, fetching = false) {
    dispatch({ type: "response", payload: { response, fetching } });
  }

  function setError(error) {
    dispatch({ type: "error", payload: { error } });
  }

  function cancelRunningRequest() {
    if (abortControllerRef.current) {
      // Cancel current request
      abortControllerRef.current.abort();
    }
  }

  function shouldCacheResponse() {
    if (cacheResponse !== null) {
      return cacheResponse;
    }

    return isReadRequest(method);
  }

  const doFetch = useCallback(
    (doFetchInit = {}, doFetchDedupeOptions = {}) => {
      cancelRunningRequest();

      abortControllerRef.current = new AbortController();

      setFetching(true);

      const finalInit = {
        ...init,
        ...doFetchInit
      };

      const finalDedupeOptions = {
        ...dedupeOptions,
        ...doFetchDedupeOptions
      };

      return fetchDedupe(
        finalInit.url || url,
        {
          ...finalInit,
          method,
          signal: abortControllerRef.current.signal,
          body: finalInit.body ? stringifyIfJSON(finalInit) : undefined
        },
        finalDedupeOptions
      )
        .then(response => {
          if (!response.ok) {
            setError(response);
            onError(response);
          } else {
            if (shouldCacheResponse()) {
              responseCache.set(finalRequestKey, response);
            }
            setResponse(response);
            onSuccess(response);
          }

          return response;
        })
        .catch(error => {
          setError(error);
          onError(error);

          return error;
        })
        .finally(() => {
          // Remove the abort controller now that the request is done
          abortControllerRef.current = null;
        });
    },
    [refreshDoFetch(finalRequestKey)]
  );

  // Start requesting onMount if not lazy
  // Start requesting if isLazy goes from true to false
  // Start requesting every time the request key changes (i.e. URL, method, init.body or init.responseType) if not lazy
  useEffect(() => {
    // Do not start request automatically when in lazy mode
    if (isLazy === true) {
      return;
    }

    const cachedResponse = responseCache.get(finalRequestKey);

    // Return cached response if it exists
    if (cacheStrategy === CACHE_POLICIES.CACHE_FIRST && cachedResponse) {
      onSuccess(cachedResponse);
      return setResponse(cachedResponse);
    }

    // Return any cached data immediately, but initiate request anyway in order to refresh any stale data
    if (cacheStrategy === CACHE_POLICIES.CACHE_AND_NETWORK && cachedResponse) {
      onSuccess(cachedResponse);
      setResponse(cachedResponse, true);
    }

    doFetch(init);
  }, [finalRequestKey, isLazy]);

  // Cancel any running request when unmounting to avoid updating state after component has unmounted
  // This can happen if a request's promise resolves after component unmounts
  useEffect(() => {
    return () => {
      cancelRunningRequest();
    };
  }, []);

  return {
    response: state.response,
    data: state.response ? state.response.data : null,
    fetching: state.fetching,
    error: state.error,
    requestKey: finalRequestKey,
    doFetch
  };
}

export { useFetch };
