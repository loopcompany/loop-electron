const test = require("node:test");
const assert = require("node:assert/strict");
const fs = require("node:fs");
const path = require("node:path");
const vm = require("node:vm");
const { createRequire } = require("node:module");
const source = require("../renderer/mobileDir");
const sourceRequire = createRequire(path.join(source, "package.json"));
const babel = sourceRequire("@babel/core");
const cache = new Map();
function load(file) {
  if (cache.has(file)) return cache.get(file).exports;
  const module = { exports: {} };
  cache.set(file, module);
  const { code } = babel.transformSync(fs.readFileSync(file, "utf8"), {
    filename: file,
    configFile: false,
    babelrc: false,
    plugins: [
      sourceRequire.resolve("@babel/plugin-transform-modules-commonjs"),
    ],
  });
  vm.runInThisContext(`(function(require,module,exports){${code}\n})`, {
    filename: file,
  })(
    (name) => {
      if (name.startsWith("@assets/")) return name;
      if (name === "@services/URL") return { uri: "https://example.invalid/api" };
      if (name === "@react-native-async-storage/async-storage") return {};
      for (const alias of ["services", "utils"]) {
        if (name.startsWith(`@${alias}/`))
          return load(path.join(source, alias, name.slice(alias.length + 2) + ".js"));
      }
      if (name === "@org/orgI18n")
        return { L: (value) => value, LO: (options) => options };
      if (name === "@helpers/Common")
        return { ltr: String, parsePickerDate: () => null };
      if (name.startsWith("@org/"))
        return load(path.join(source, "org", name.slice(5) + ".js"));
      if (name.startsWith("."))
        return load(
          path.resolve(
            path.dirname(file),
            name + (path.extname(name) ? "" : ".js"),
          ),
        );
      return sourceRequire(name);
    },
    module,
    module.exports,
  );
  return module.exports;
}

test("category change isolates answers and ignores late requests", () => {
  const slice = load(path.join(source, "slices/stepSlice.js"));
  const reduce = slice.default;
  let state = reduce(undefined, slice.fetchSteps.pending("old", { categoryId: 1 }));
  state = reduce(state, slice.fetchSteps.fulfilled([[{ id: "old-field" }]], "old", { categoryId: 1 }));
  state = reduce(state, slice.setAddressId(42));
  state = reduce(state, slice.setMaleCount(1));
  state = reduce(state, slice.fetchSteps.pending("latest", { categoryId: 12 }));
  assert.equal(state.categoryId, "12");
  assert.equal(state.addressId, null);
  assert.equal(state.maleCount, 0);
  assert.equal(state.data.length, 0);
  state = reduce(state, slice.fetchSteps.fulfilled([[{ id: "stale" }]], "old", { categoryId: 1 }));
  assert.equal(state.data.length, 0);
  state = reduce(state, slice.fetchSteps.fulfilled([[{ id: "new-field" }]], "latest", { categoryId: 12 }));
  assert.equal(state.data[0][0].id, "new-field");
  state = reduce(state, slice.fetchSteps.pending("cancelled", { categoryId: 8 }));
  state = reduce(state, slice.emptySteps());
  state = reduce(state, slice.fetchSteps.fulfilled([[{ id: "cancelled" }]], "cancelled", { categoryId: 8 }));
  assert.equal(state.categoryId, null);
  assert.equal(state.data.length, 0);
});

for (const kind of ["Comprehensive", "Systematic"]) {
  test(`${kind}: pre-receipt preserves procurement notes and chosen address`, () => {
    const createReceipt = load(
      path.join(source, `services/receipt/from${kind}.js`),
    )[`receiptFrom${kind}`];
    const procurement = {
      laptop: { new: 2, used: 1, desc: "  QA laptop specification  " },
    };
    const receipt = createReceipt({
      categoryId: "laptop",
      answers: { procurement },
      procurementItems: procurement,
      addresses: [{ id: 42, address: "QA chosen address" }],
      selectedAddressId: "42",
    });
    assert.equal(receipt.items.length, 2);
    assert.match(receipt.items[0].title, /\(QA laptop specification\)$/);
    assert.equal(receipt.items[0].qty, 2);
    assert.equal(receipt.items[1].qty, 1);
    assert.match(receipt.customer.address, /QA chosen address/);
  });
}
const { SYSTEMATIC_FLOWS, getFlow, getVisibleFlow } = load(
  path.join(source, "org/systematicFlows.js"),
);
for (const category of Object.keys(SYSTEMATIC_FLOWS)) {
  test(`${category}: wizard passes the address step and reaches final actions`, () => {
    for (const flow of [
      getFlow(category),
      getVisibleFlow(category),
      getVisibleFlow(category, {
        device_type: { selected: "industrial_copier" },
      }),
    ]) {
      const ids = flow.map((step) => step.id);
      assert.equal(
        new Set(ids).size,
        ids.length,
        `duplicate step IDs trap Next/Back: ${ids.filter((id, i) => ids.indexOf(id) !== i).join(", ")}`,
      );
      const addresses = flow.filter((step) => step.type === "address");
      assert.equal(addresses.length, 1);
      assert.equal(addresses[0].required, true);
      const index = flow.findIndex((step) => step.id === addresses[0].id);
      assert.equal(flow[index + 1]?.type, "orderActions");
      assert.equal(flow.at(-1).type, "orderActions");
      // WizardLayout resolves both directions by ID; every transition must move.
      for (let i = 0; i < ids.length - 1; i++) {
        assert.equal(ids.indexOf(ids[i + 1]), i + 1);
        assert.equal(ids.indexOf(ids[i]), i);
      }
    }
  });
}
