import React, { useState } from "react";
import { render } from "react-dom";
import { FetchProvider, useFetch } from "../../src";
const cache = new Map();

function Demo() {
  const [url, setUrl] = useState("https://jsonplaceholder.typicode.com/posts");
  const { data, fetching, doFetch } = useFetch({
    url: url
  });

  return (
    <div className="App">
      <button
        onClick={() => setUrl("https://jsonplaceholder.typicode.com/posts")}
      >
        set url to posts (default)
      </button>

      <button
        onClick={() => setUrl("https://jsonplaceholder.typicode.com/albums")}
      >
        set url to albums
      </button>

      <button onClick={() => doFetch().then(resp => console.log(resp))}>
        refetch current
      </button>

      <button
        onClick={() => {
          setUrl("https://jsonplaceholder.typicode.com/albums");
          setTimeout(() => {
            setUrl("https://jsonplaceholder.typicode.com/posts");
          }, 1);
        }}
      >
        abort condition (switch to albums, then immediately back to posts)
      </button>

      {fetching && <div>loading....</div>}

      {data && data.map(x => <div key={x.id}>{x.title}</div>)}
    </div>
  );
}

render(
  <FetchProvider cache={cache}>
    <Demo />
  </FetchProvider>,
  document.getElementById("demo")
);
