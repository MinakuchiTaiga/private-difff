import "./styles.css";
import { renderApp } from "./ui/renderApp";

const root = document.querySelector<HTMLElement>("#app");

if (!root) {
  throw new Error("#app element not found");
}

renderApp(root);
