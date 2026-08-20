import { render } from "preact";
import "@core/ui/tokens.css";
import { App } from "./App";

const root = document.getElementById("root")!;
render(<App />, root);
