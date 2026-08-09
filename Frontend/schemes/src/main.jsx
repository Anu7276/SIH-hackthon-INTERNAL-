import React from "react";
import { createRoot } from "react-dom/client";
import SchemeFeed from "../SchemeFeed.jsx";

createRoot(document.getElementById("root")).render(
  <React.StrictMode>
    <SchemeFeed />
  </React.StrictMode>
);
