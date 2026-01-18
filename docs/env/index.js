// src/env/index.mjs
var myHeaders = new Headers();
var envInit = {
  method: "GET",
  headers: myHeaders,
  mode: "cors",
  cache: "default"
};
var Index = {};
try {
  const url = new URL("./env.json", import.meta.url);
  const myRequest = new Request(url, envInit);
  const response = await fetch(myRequest);
  Index = await response.json();
} catch (e) {
  console.error("ERROR FETCH JSON", e);
}
var env = (props) => {
  return Index;
};
export {
  env
};
//# sourceMappingURL=index.js.map
