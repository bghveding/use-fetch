export const getHeader = (headers, keyToFind) => {
  if (!headers) {
    return null;
  }

  // Headers' get() is case insensitive
  if (headers instanceof Headers) {
    return headers.get(keyToFind);
  }

  const keyToFindLowercase = keyToFind.toLowerCase();
  // Convert keys to lowerCase so we don't run into case sensitivity issues
  const headerKey = Object.keys(headers).find(
    headerKey => headerKey.toLowerCase() === keyToFindLowerCase
  );

  return headerKey ? headers[headerKey] : null;
};

export const stringifyIfJSON = fetchOptions => {
  const contentType = getHeader(fetchOptions.headers, "Content-Type");

  if (contentType && contentType.indexOf("application/json") !== -1) {
    return JSON.stringify(fetchOptions.body);
  }

  return fetchOptions.body;
};

export const isReadRequest = method => {
  method = method.toUpperCase();

  return method === "GET" || method === "HEAD" || method === "OPTIONS";
};
