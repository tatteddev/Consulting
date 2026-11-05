import React from "react";
import { createRoot, hydrateRoot } from "react-dom/client";
import { App } from "./App.tsx";
import "./site.css";

const root = document.getElementById("root");
if (!root) throw new Error("Missing application root");
const app = (
  <React.StrictMode>
    <App />
  </React.StrictMode>
);
if (root.hasChildNodes()) hydrateRoot(root, app);
else createRoot(root).render(app);
