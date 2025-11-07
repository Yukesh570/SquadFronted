import React from "react";
import ReactDOM from "react-dom/client";
import App from "./App.tsx";
import "./index.css";
import { ThemeProvider } from "./context/themeContext.tsx";
import { NavItemProvider } from "./context/navItemsContext.tsx";

ReactDOM.createRoot(document.getElementById("root")!).render(
  <React.StrictMode>
    <ThemeProvider>
      <NavItemProvider>
        <App />
      </NavItemProvider>
    </ThemeProvider>
  </React.StrictMode>
);