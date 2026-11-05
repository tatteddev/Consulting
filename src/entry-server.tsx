import { renderToString } from "react-dom/server";
import { App } from "./App.tsx";
import { structuredDataJson } from "../shared/seo.ts";

export function render() {
  return { markup: renderToString(<App />), structuredDataJson };
}
