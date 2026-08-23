import { mkdir, writeFile } from "node:fs/promises";
import { openapiDocument } from "../src/lib/openapi";

(async () => {
  await mkdir("public", { recursive: true });
  await writeFile("public/openapi.json", `${JSON.stringify(openapiDocument, null, 2)}\n`, "utf8");
  console.log("Wrote public/openapi.json");
})();
