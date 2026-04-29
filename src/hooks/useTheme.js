import { useState, useEffect } from "react";
export function useTheme() {
  const [theme, setTheme] = useState(() =>
    window.matchMedia("(prefers-color-scheme:dark)").matches ? "dark" : "light"
  );
  useEffect(() => { document.documentElement.setAttribute("data-theme", theme); }, [theme]);
  const toggle = () => setTheme(t => t === "dark" ? "light" : "dark");
  return { theme, toggle };
}
