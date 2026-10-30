import assert from "node:assert/strict";
import { readFile } from "node:fs/promises";
import { test } from "node:test";
import vm from "node:vm";

const main = JSON.parse(await readFile(new URL("../layouts/main-graph.json", import.meta.url)));
const find = (node, id) => node.id === id ? node : node.children?.map(n => find(n, id)).find(Boolean);

// Exercise the actual tab-bar callbacks with a minimal native-builder stand-in.
async function load(state) {
  const buttons = new Map(), calls = [], storage = new Map();
  function element() {
    const target = {};
    const proxy = new Proxy(target, { get(_t, key) {
      if (key === "when") return (condition, build) => condition ? build(proxy) : proxy;
      if (key === "id") return id => { target.id = id; return proxy; };
      if (key === "on_click") return callback => { buttons.set(target.id, callback); return proxy; };
      return () => proxy;
    }});
    return proxy;
  }
  const api = {
    spaces: () => state.spaces, panes: () => [],
    run: (name, args) => calls.push([name, structuredClone(args)]),
    openOverlay: () => {}, theme: () => ({}),
    window: () => ({ platform: "linux", buttons: false }), shared: () => state.enabled,
    layout: () => state.layout, settings: () => ({ zoom: 1 }),
  };
  const context = vm.createContext({
    localStorage: { getItem: key => storage.get(key) ?? null, setItem: (key, value) => storage.set(key, value) },
  });
  const exports = { "gpui-kit": { View: class {}, div: element, svg: element, image: element },
    "gpui-base": { h_flex: element }, herdr: api };
  const mod = new vm.SourceTextModule(await readFile(new URL("../mods/tabs-graph/main.js", import.meta.url), "utf8"), { context });
  await mod.link(name => new vm.SyntheticModule(Object.keys(exports[name]), function () {
    for (const [key, value] of Object.entries(exports[name])) this.setExport(key, value);
  }, { context }));
  await mod.evaluate();
  const view = new mod.namespace.default();
  view.init();
  return { view, buttons, calls };
}

test("Graph is added alongside Files and Changes without changing the default pane header", () => {
  assert.equal(find(main, "main").content.tab, "active");
  assert.equal(find(main, "main").content.pane.header.content.mod, "pane");
  assert.equal(find(main, "tabs").content.mod, "tabs-graph");
  assert.equal(find(main, "graph").content.mod, "git-graph");
  assert.deepEqual(find(main, "panel-body").children.map(n => n.id), ["files", "changes", "graph"]);
});

test("Graph stays enabled, toggles and retains the per-space panel choice", async () => {
  const state = { layout: structuredClone(main), enabled: ["files"], spaces: [{ id: "s1", active: true, tabs: [] }] };
  const { view, buttons, calls } = await load(state);
  view.render();
  assert.ok(buttons.has("panel-files"));
  assert.ok(!buttons.has("panel-changes"));
  buttons.get("panel-graph")();
  assert.deepEqual(calls.splice(0), [["layout.select", { stack: "panel-body", child: "graph" }], ["layout.show", { id: "panel" }]]);
  find(state.layout, "panel").hidden = false;
  find(state.layout, "panel-body").active = "graph";
  view.render();
  buttons.get("panel-graph")();
  assert.deepEqual(calls.splice(0), [["layout.hide", { id: "panel" }]]);
  state.spaces = [{ id: "s2", active: true, tabs: [] }];
  view.render(); calls.length = 0;
  find(state.layout, "panel").hidden = true;
  state.spaces = [{ id: "s1", active: true, tabs: [] }];
  view.render();
  assert.deepEqual(calls, [["layout.select", { stack: "panel-body", child: "graph" }], ["layout.show", { id: "panel" }]]);
});
