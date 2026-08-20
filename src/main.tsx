import ReactDOM from "react-dom/client";
import App from "./App";
import { LanguageProvider } from "./i18n/LanguageContext";

ReactDOM.createRoot(document.getElementById("root") as HTMLElement).render(
  <LanguageProvider>
    <App />
  </LanguageProvider>,
);
