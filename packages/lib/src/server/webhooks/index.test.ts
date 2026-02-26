import fs from "node:fs";
import { expect, it } from "vitest";

import { WEBHOOK_HANDLERS } from "./index";

it("WEBHOOK_HANDLERS includes all handler files", () => {
    expect(
        fs.globSync("src/server/webhooks/handlers/*.handler.ts"),
    ).toHaveLength(WEBHOOK_HANDLERS.length);
});
