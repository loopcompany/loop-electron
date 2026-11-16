const test = require("node:test");
const assert = require("node:assert/strict");
const path = require("node:path");
const { spawnSync } = require("node:child_process");
test("renderer local imports match actual snapshot and desktop exports", () => {
  const result = spawnSync(
    process.execPath,
    [path.join(__dirname, "../scripts/check-renderer-imports.js")],
    { encoding: "utf8" },
  );
  assert.equal(result.status, 0, result.stdout + result.stderr);
});
