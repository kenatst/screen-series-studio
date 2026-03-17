import { createRoot } from "react-dom/client";
import { ThemeProvider } from "next-themes";
import App from "./App.tsx";
import "./index.css";
import "./i18n/index.ts";
import { ThemeMetaColor } from "@/components/theme/ThemeMetaColor";

createRoot(document.getElementById("root")!).render(
  <ThemeProvider attribute="class" defaultTheme="system" enableSystem disableTransitionOnChange>
    <ThemeMetaColor />
    <App />
  </ThemeProvider>,
);
