# @bjornagh/use-fetch

An easy-to-use React hook for doing `fetch` requests.

## Features

- 1️⃣ Dedupes requests done to the same endpoint. Only one request to the same endpoint will be initiated.
- 💨 Caches responses to improve speed and reduce amount of requests.
- 🛀 Automatically makes new requests if URL changes.
- ⚛️ Small size, with only two dependencies: `react` and `fetch-dedupe`.

## Install

```bash
npm install @bjornagh/use-fetch

# if yarn
yarn add @bjornagh/use-fetch
```

## Usage

1. Create a cache (new Map()) and render the `FetchProvider` at the top of your application.

```jsx
import { FetchProvider } from "@bjornagh/use-fetch";

const cache = new Map();

ReactDOM.render(
  <FetchProvider cache={cache}>
    <App />
  </FetchProvider>,
  document.getElementById("container")
);
```

2. Use `useFetch` in your component

```jsx
import React from "react";
import { useFetch } from "@bjornagh/use-fetch";

function MyComponent() {
  const { data, fetching } = useFetch({
    url: "https://jsonplaceholder.typicode.com/todos"
  });

  return (
    <div>
      {fetching && "Loading..."}
      {data && data.map(x => <div key={x.id}>{x.title}</div>)}
    </div>
  );
}
```

## API
`useFetch` accepts an object that supports the following properties

| Key | Default value | Description |
|------|--------------|--------------|
| url | | URL to send request to |
| method | GET | HTTP method |
| lazy | null | Lazy modes determines if a request should be done on mount or not. When null, GET requests are initiated on mount. If `true` all requests are initiated on mount, regardless of HTTP method. If `false`, requests are only initiated manually by calling `doFetch`, a function returned by `useFetch`|
| init | {} | See https://developer.mozilla.org/en-US/docs/Web/API/WindowOrWorkerGlobalScope/fetch `init` argument for which keys are supported |
| cacheResponse | true if read request, false if write | Cache response or not |
| requestKey | null | requestKey is used as cache key and to prevent duplicate requests. Generated automatically if nothing is passed. |
| cachePolicy | null | [Caching strategy](https://github.com/bghveding/use-fetch#cachepolicy) |
| onError | Function | A callback function that is called anytime a fetch fails. Receives an `Error` as only argument. Logs to console by default |
| onSuccess | Function | A callback function that is called anytime a fetch succeeds. Receives a fetch [`Response`](https://developer.mozilla.org/en-US/docs/Web/API/Response) as only argument. Does nothing by default (noop) |

Return value

| Key | type | Description |
|------|-------------|---------------|
| response | [`Response`](https://developer.mozilla.org/en-US/docs/Web/API/Response) | [`Response`](https://developer.mozilla.org/en-US/docs/Web/API/Response) |
| data | * | Request data response |
| fetching | bool | Whether request is in-flight or not |
| error | `Error` | Any errors from `fetch` |
| requestKey | string | Key used as cache key and to prevent duplicate requests |
| doFetch | Function | A function to initiate a request manually. Takes one argument: `init`, an object that is sent to `fetch`. See https://developer.mozilla.org/en-US/docs/Web/API/WindowOrWorkerGlobalScope/fetch (`init` argument for which keys are supported). Returns a promise. |

### `cachePolicy`
* `cache-first` - Uses response in cache if available. Makes request if not.
* `cache-and-network` - Uses response in cache if available, but will also always make a new request in the background in order to refresh any stale data.
* `network-only` - Ignores cache and always makes a request.

Read requests (GET, OPTIONS, HEAD) default to `cache-first`.
Write reqeusts (POST, DELETE, PUT, PATCH) default to `network-only`.

## Credits

This library is heavily inspired by the excellent React library [react-request](https://github.com/jamesplease/react-request)
