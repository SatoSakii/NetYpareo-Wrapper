import fs from "fs";
import path from "path";

fs.writeFileSync(
    path.join(process.cwd(), "dist/cjs/package.json"),
    JSON.stringify(
        {
            type: "commonjs",
        },
        null,
        2,
    ),
);
