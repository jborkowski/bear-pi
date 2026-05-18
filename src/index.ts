import type { ExtensionAPI } from "@earendil-works/pi-coding-agent";
import { registerBearTools } from "./tools";

export default function (pi: ExtensionAPI) {
  // Ensure BearCLI is available at load time. If not, this throws and prevents extension load.
  require("./bearcli");

  // Register all the Bear note tools
  registerBearTools(pi);
}