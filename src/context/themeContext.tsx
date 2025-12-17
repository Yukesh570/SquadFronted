import { createContext, useEffect, useState, type ReactNode } from "react";

interface ThemeContextProps {
  theme: "light" | "dark";
  toggleTheme: () => void;
  primaryColor: string;
  changePrimaryColor: (color: string) => void;
}

export const ThemeContext = createContext<ThemeContextProps>({
  theme: "light",
  toggleTheme: () => {},
  primaryColor: "#7F58D8",
  changePrimaryColor: () => {},
});

export const ThemeProvider = ({ children }: { children: ReactNode }) => {
  const [theme, setTheme] = useState<"light" | "dark">("light");
  const [primaryColor, setPrimaryColor] = useState("#7F58D8");

  const getLightVariant = (hex: string) => {
    hex = hex.replace("#", "");
    const r = parseInt(hex.substring(0, 2), 16);
    const g = parseInt(hex.substring(2, 4), 16);
    const b = parseInt(hex.substring(4, 6), 16);

    const mix = (c: number) => Math.round(c + (255 - c) * 0.92);
    const nr = mix(r).toString(16).padStart(2, "0");
    const ng = mix(g).toString(16).padStart(2, "0");
    const nb = mix(b).toString(16).padStart(2, "0");

    return `#${nr}${ng}${nb}`;
  };

  const updateCssVariables = (color: string) => {
    const root = document.documentElement;
    root.style.setProperty("--color-primary", color);

    const lightColor = getLightVariant(color);
    root.style.setProperty("--color-primary-light", lightColor);
    root.style.setProperty("--color-primary-dark", color);
  };

  useEffect(() => {
    const storedTheme = localStorage.getItem("theme") as
      | "light"
      | "dark"
      | null;
    const initialTheme = storedTheme || "light";
    setTheme(initialTheme);
    if (initialTheme === "dark") document.documentElement.classList.add("dark");
    else document.documentElement.classList.remove("dark");

    const storedColor = localStorage.getItem("primaryColor");
    if (storedColor) {
      setPrimaryColor(storedColor);
      updateCssVariables(storedColor);
    } else {
      updateCssVariables("#7F58D8");
    }
  }, []);

  const toggleTheme = () => {
    const newTheme = theme === "light" ? "dark" : "light";
    setTheme(newTheme);
    localStorage.setItem("theme", newTheme);
    if (newTheme === "dark") document.documentElement.classList.add("dark");
    else document.documentElement.classList.remove("dark");
  };

  const changePrimaryColor = (color: string) => {
    setPrimaryColor(color);
    localStorage.setItem("primaryColor", color);
    updateCssVariables(color);
  };

  return (
    <ThemeContext.Provider
      value={{ theme, toggleTheme, primaryColor, changePrimaryColor }}
    >
      {children}
    </ThemeContext.Provider>
  );
};
