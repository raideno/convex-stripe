import fs from "node:fs";
import { expect, it } from "vitest";

import * as actions from "./index";

it("actions/index.ts exports all action files", () => {
    const files = fs.globSync("src/server/actions/*.ts");
    const actionFiles = files.filter(
        (file) => !file.endsWith("index.ts") && !file.endsWith(".test.ts"),
    );

    const exportNames = Object.keys(actions);

    actionFiles.forEach((file) => {
        const baseName = file.split("/").pop()?.replace(".ts", "");
        if (!baseName) return;

        const expectedExport = baseName
            .split("-")
            .map((part) => part.charAt(0).toUpperCase() + part.slice(1))
            .join("") + "Implementation";

        expect(exportNames).toContain(expectedExport);
    });

    expect(actionFiles).toHaveLength(exportNames.length);
});
