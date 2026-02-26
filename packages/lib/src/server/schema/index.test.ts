import fs from "node:fs";
import { expect, it } from "vitest";

import { stripeTables } from "./index";

it("schema/index.ts includes all model files", () => {
    const modelFiles = fs.globSync("src/server/schema/models/*.ts");
    const modelNames = modelFiles.map((file) => file.split("/").pop()?.replace(".ts", ""));

    const schemaContent = fs.readFileSync("src/server/schema/index.ts", "utf-8");

    modelNames.forEach((name) => {
        expect(schemaContent).toContain(`from "@/schema/models/${name}"`);
    });
});

it("stripeTables includes expected number of tables", () => {
    const modelFiles = fs.globSync("src/server/schema/models/*.ts");

    const tableCount = Object.keys(stripeTables).length;

    expect(tableCount).toBeGreaterThanOrEqual(modelFiles.length);
});
