import { writable } from "svelte/store";
import { browser } from "$app/environment";

type Theme = "light" | "dark";

// The theme is set in `app.html` to avoid a flash of the wrong theme
const userTheme = browser && localStorage.getItem("color-scheme") as Theme;

export const theme = writable<Theme>(userTheme || "light");

export function toggleTheme() {
  theme.update((current) => {
    const newTheme = current === "light" ? "dark" : "light";
    document.documentElement.setAttribute("color-scheme", newTheme);
    localStorage.setItem("color-scheme", newTheme);
    return newTheme;
  });
}

export function setTheme(newTheme: Theme) {
  localStorage.setItem("color-scheme", newTheme);
  theme.set(newTheme);
}