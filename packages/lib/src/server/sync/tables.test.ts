import fs from "node:fs";
import { expect, it } from "vitest";

import { SYNC_HANDLERS } from "./tables";

it("SYNC_HANDLERS includes all handler files", () => {
    expect(
        fs.globSync("src/server/sync/handlers/*.handler.ts"),
    ).toHaveLength(SYNC_HANDLERS.length);
});
