const fs = require("fs"),
  path = require("path"),
  { createRequire } = require("module");
const root = path.resolve(__dirname, ".."),
  source = require(path.join(root, "renderer/mobileDir"));
const parser = createRequire(path.join(source, "package.json"))(
  "@babel/parser",
);
const overrides = path.join(root, "renderer/overrides"),
  parsed = new Map(),
  exportsCache = new Map();
const aliases = Object.fromEntries(
  [
    "assets",
    "components",
    "contexts",
    "helpers",
    "i18n",
    "hooks",
    "navigation",
    "org",
    "screens",
    "services",
    "slices",
    "store",
    "styles",
    "theme",
    "utils",
  ].map((n) => ["@" + n, path.join(source, n)]),
);
aliases["@desktop"] = path.join(root, "renderer/desktop");
aliases["@mobile"] = source;
function resolve(from, name) {
  let p;
  if (name.startsWith(".")) p = path.resolve(path.dirname(from), name);
  else {
    const a = Object.keys(aliases).find(
      (a) => name === a || name.startsWith(a + "/"),
    );
    if (!a) return null;
    p = aliases[a] + name.slice(a.length);
  }
  return [
    p.replace(/\.js$/, ".web.js"),
    p + ".web.js",
    p,
    p + ".js",
    p + ".jsx",
    path.join(p, "index.web.js"),
    path.join(p, "index.js"),
  ].find((p) => fs.existsSync(p) && fs.statSync(p).isFile());
}
function physical(file) {
  const rel = path.relative(source, file);
  if (!rel.startsWith("..")) {
    let o = path.join(overrides, rel);
    if (fs.existsSync(o)) return o;
  }
  return file;
}
function parse(file) {
  if (parsed.has(file)) return parsed.get(file);
  const text = fs.readFileSync(physical(file), "utf8");
  let data = {
    ast: parser.parse(text, {
      sourceType: "unambiguous",
      plugins: ["jsx", "flow"],
    }).program.body,
    dynamic: /module\.exports|exports\./.test(text),
  };
  parsed.set(file, data);
  return data;
}
function bindings(id) {
  if (!id) return [];
  if (id.type === "Identifier") return [id.name];
  if (id.type === "ObjectPattern")
    return id.properties.flatMap((p) => bindings(p.value || p.argument));
  if (id.type === "ArrayPattern") return id.elements.flatMap(bindings);
  if (id.type === "AssignmentPattern") return bindings(id.left);
  return [];
}
function exportsOf(file) {
  if (exportsCache.has(file)) return exportsCache.get(file);
  let names = new Set();
  exportsCache.set(file, names);
  if (file.endsWith(".json")) {
    names.add("default");
    return names;
  }
  const p = parse(file);
  if (p.dynamic) names.add("*");
  for (const n of p.ast) {
    if (n.type === "ExportDefaultDeclaration") names.add("default");
    if (n.type === "ExportNamedDeclaration") {
      for (const s of n.specifiers || [])
        names.add(s.exported.name || s.exported.value);
      if (n.declaration) {
        if (n.declaration.id?.name) names.add(n.declaration.id.name);
        for (const d of n.declaration.declarations || [])
          for (const name of bindings(d.id)) names.add(name);
      }
    }
    if (n.type === "ExportAllDeclaration") {
      let t = resolve(file, n.source.value);
      if (t) for (const e of exportsOf(t)) if (e !== "default") names.add(e);
    }
  }
  return names;
}
function files(dir) {
  return fs
    .readdirSync(dir, { withFileTypes: true })
    .flatMap((e) =>
      e.isDirectory()
        ? ["node_modules", "__tests__", ".git", ".expo"].includes(e.name)
          ? []
          : files(path.join(dir, e.name))
        : e.name.endsWith(".js")
          ? [path.join(dir, e.name)]
          : [],
    );
}
let errors = [],
  count = 0;
for (const file of [
  ...files(source),
  ...files(path.join(root, "renderer/desktop")),
]) {
  for (const n of parse(file).ast.filter(
    (n) => n.type === "ImportDeclaration",
  )) {
    const target = resolve(file, n.source.value);
    if (!target || !target.endsWith(".js")) continue;
    const names = exportsOf(target);
    for (const s of n.specifiers) {
      let name =
        s.type === "ImportDefaultSpecifier"
          ? "default"
          : s.type === "ImportSpecifier"
            ? s.imported.name
            : null;
      if (!name) continue;
      count++;
      if (!names.has(name) && !names.has("*"))
        errors.push({
          file: path.relative(source, file),
          target: n.source.value,
          name,
        });
    }
  }
}
console.log(JSON.stringify({ checked: count, errors }, null, 2));
process.exitCode = errors.length ? 1 : 0;
