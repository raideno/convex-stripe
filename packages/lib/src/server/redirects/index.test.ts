import fs from "node:fs";
import { expect, it } from "vitest";

import { REDIRECT_HANDLERS } from "./index";

it("REDIRECT_HANDLERS includes all handler files", () => {
  expect(
    fs.globSync("src/server/redirects/handlers/*.handler.ts"),
  ).toHaveLength(REDIRECT_HANDLERS.length);
});
