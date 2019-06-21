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

See more examples in the examples section [examples section ](https://github.com/bghveding/use-fetch#Examples).

## API
`useFetch` accepts an object that supports the following properties

| Key | Default value | Description |
|------|--------------|--------------|
| url | | URL to send request to |
| method | GET | HTTP method |
| lazy | null | Lazy mode determines if a request should be done on mount and when the request parameters change (e.g. URL) or not. When null only GET requests are initiated when mounted and if for example the URL changes. If `true` this applies to all requests regardless of HTTP method. If `false`, requests are only initiated manually by calling `doFetch`, a function returned by `useFetch`|
| init | {} | See https://developer.mozilla.org/en-US/docs/Web/API/WindowOrWorkerGlobalScope/fetch `init` argument for which keys are supported |
| dedupeOptions | {} | See https://github.com/jamesplease/fetch-dedupe#user-content-api `dedupeOptions` argument for which keys are supported |
| cacheResponse | true if read request, false if write | Cache response or not |
| requestKey | null | requestKey is used as cache key and to prevent duplicate requests. Generated automatically if nothing is passed. |
| cachePolicy | null | [Caching strategy](https://github.com/bghveding/use-fetch#cachepolicy) |
| refreshDoFetch | Function | By default doFetch method is memoized (by `useCallback`) by using the request (url+method+body). Use this to override if you get a stale doFetch. It receives one argument, the default request key. e.g. `requestKey => requestKey + 'something'` |
| onError | Function | A callback function that is called anytime a fetch fails. Receives an `Error` as only argument. Logs to console by default |
| onSuccess | Function | A callback function that is called anytime a fetch succeeds. Receives a fetch [`Response`](https://developer.mozilla.org/en-US/docs/Web/API/Response) as only argument. Does nothing by default (noop) |

Return value

| Key | type | Description |
|------|-------------|---------------|
| response | [`Response`](https://developer.mozilla.org/en-US/docs/Web/API/Response) | [`Response`](https://developer.mozilla.org/en-US/docs/Web/API/Response) |
| data | * | Request data response |
| fetching | Boolean | Whether request is in-flight or not |
| error | [`Response`](https://developer.mozilla.org/en-US/docs/Web/API/Response) | Any errors from `fetch` |
| requestKey | String | The key used as cache key and to prevent duplicate requests |
| doFetch | Function | A function to initiate a request manually. Takes one argument: `init`, an object that is sent to `fetch`. See https://developer.mozilla.org/en-US/docs/Web/API/WindowOrWorkerGlobalScope/fetch (`init` argument for which keys are supported). Returns a promise. |

NOTE: Requests with `Content-type` set to `application/json` will automatically have their body
stringified (`JSON.stringify`)

### `cachePolicy`
* `cache-first` - Uses response in cache if available. Makes request if not.
* `cache-and-network` - Uses response in cache if available, but will also always make a new request in the background in order to refresh any stale data.
* `network-only` - Ignores cache and always makes a request.

Read requests (GET, OPTIONS, HEAD) default to `cache-first`.

Write requests (POST, DELETE, PUT, PATCH) default to `network-only`.

## Examples

### POST request and update view afterwards

```jsx
function Demo() {
  // Fetch list of posts
  const posts = useFetch({
    url: "https://jsonplaceholder.typicode.com/posts"
  });

  // Prepare create request
  // This will not be initiated until you call `createPost.doFetch()`
  const createPost = useFetch({
    url: "https://jsonplaceholder.typicode.com/posts",
    method: "POST",
    init: {
      headers: {
        "Content-type": "application/json"
      }
    }
  });

  return (
    <div>
      <button
        onClick={() =>
          createPost
            .doFetch({
              body: {
                title: "foo",
                body: "bar",
                userId: 1
              }
            })
            .then(response => {
              if (response.ok) {
                // POST request was successful, refetch list of posts
                posts.doFetch();
              } else {
                // Do something with error response
              }
            })
        }
        disabled={createPost.fetching}
      >
        Create post
      </button>

      {!posts.data && posts.fetching && "Loading..."}
      {posts.data && posts.data.map(x => <h2 key={x.id}>{x.title}</h2>)}
    </div>
  );
}
```

### Delay fetching using the `lazy` prop

Setting the `lazy` parameter to `true` tells `useFetch` to not start requesting on mount or when
the request parameters change.

You can change this at any time. A common pattern where this feature is useful is when you want the
user to apply some filters before you initiate a request.

Below is an example where a request is delayed until a search input contains at least two characters.

```jsx
function LazyDemo() {
  const [searchFilter, setSearchFilter] = useState("");
  const posts = useFetch({
    url: `/posts?search=${searchFilter}`,
    lazy: searchFilter.length < 2 // Request is lazy as long as the input has less than two characters
  });

  return (
    <div>
      <input onChange={event => setSearchFilter(event.target.value)} />

      {posts.data && posts.data.map(x => <div key={x.id}>{x.title}</div>)}
    </div>
  );
}
```

### How to set base URL, default headers and so on

Create your custom fetch hook. For example:

```jsx
import { useFetch } from "@bjornagh/use-fetch";

function useCustomUseFetch({ url, init = {}, ...rest }) {
  // Prefix URL with API root
  const apiRoot = "https://my-api-url.com/";
  const finalUrl = `${apiRoot}${url}`;

  // Set a default header
  const finalHeaders = { ...init.headers };
  finalHeaders["Content-type"] = "application/json";

  // Ensure headers are sent to fetch
  init.headers = finalHeaders;

  return useFetch({ url: finalUrl, init, ...rest });
}
```

With a custom hook you could also set up a default error handler that show a toast message for example.

## Credits

This library is heavily inspired by the excellent React library [react-request](https://github.com/jamesplease/react-request)
