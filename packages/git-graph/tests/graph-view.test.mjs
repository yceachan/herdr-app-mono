import assert from "node:assert/strict";
import { readFile } from "node:fs/promises";
import { test } from "node:test";
import vm from "node:vm";
import * as git from "../mods/git-graph/git.js";
import * as lanes from "../mods/git-graph/lanes.js";

async function loadGraph(state = {}) {
  const calls = [], tasks = [], timers = [];
  function element() {
    const proxy = new Proxy({}, { get(_t, key) {
      if (key === "when") return (condition, build) => condition ? build(proxy) : proxy;
      return () => proxy;
    }});
    return proxy;
  }
  const api = {
    spaces: () => [], panes: () => [], focused: () => ({ cwd: "/repo" }),
    props: () => state.props ?? {}, layout: () => state.layout, theme: () => ({}),
    settings: () => ({ zoom: 1 }), shared: () => null, home: () => "/home/test",
    exec: (...args) => { calls.push(["exec", ...args]); throw new Error("Unexpected Git command"); },
    watchFolder: () => { throw new Error("Unexpected watch"); }, readTextFile: () => {},
    openOverlay: spec => calls.push(["overlay", spec]),
  };
  const modules = {
    "gpui-kit": { div: element, svg: element, PathBuilder: {} },
    "gpui-base": { v_flex: element, h_flex: element, Scrollbar: {}, v_virtual_list: element },
    herdr: api, "./git.js": git, "./lanes.js": lanes,
    "./act.js": { perform: (...args) => calls.push(["perform", ...args]), showChanges() {} },
    "./menu.js": { icon: value => value },
  };
  const context = vm.createContext({});
  const module = new vm.SourceTextModule(await readFile(new URL("../mods/git-graph/graph.js", import.meta.url), "utf8"), { context });
  await module.link(name => new vm.SyntheticModule(Object.keys(modules[name]), function () {
    for (const [key, value] of Object.entries(modules[name])) this.setExport(key, value);
  }, { context }));
  await module.evaluate();
  const graph = new module.namespace.Graph();
  const cx = {
    spawn: task => tasks.push(task), notify() {}, focus_handle: () => ({ focus() {} }),
    timer: { after: (_ms, fn) => timers.push(fn), every: (_ms, fn) => timers.push(fn) },
  };
  return { graph, cx, calls, tasks, timers };
}

for (const kind of ["branch", "remote", "tag", "detached"]) {
  test(`double clicking a ${kind} label never checks out or opens a Git dialog`, async () => {
    const { graph, cx, calls, tasks } = await loadGraph();
    const commit = { hash: "a", parents: [], subject: "subject", refs: [{ kind, name: kind === "remote" ? "origin/topic" : "topic" }] };
    graph.commits = [commit]; graph.index = new Map([["a", 0]]);
    graph.labels = new Map([["a", git.labelsOf(commit)]]);
    let picked = 0;
    graph.pick = value => { assert.equal(value, commit); picked++; };
    graph.press = { count: 1, x: 50 }; graph.clicked("a", cx);
    graph.press = { count: 2, x: 50 }; graph.clicked("a", cx);
    assert.equal(picked, 1, "second click preserves the first click's details");
    assert.equal(graph.checkout, undefined, "direct checkout handler is removed");
    assert.equal(tasks.length, 0); assert.deepEqual(calls, []);
  });
}

test("hidden panel skips initial reads, watcher refreshes, timers and prefetch; showing refreshes once", async () => {
  const graphNode = { id: "graph", type: "block" };
  const stack = { id: "panel-body", type: "stack", active: "graph", children: [graphNode] };
  const panel = { id: "panel", type: "column", hidden: true, children: [stack] };
  const state = { props: { role: "panel" }, layout: { id: "root", children: [panel] } };
  const { graph, cx, calls, tasks, timers } = await loadGraph(state);
  graph.init(cx);
  for (const timer of timers) timer(cx);
  graph.refresh(cx, false); graph.warm(cx); graph.render(cx);
  assert.equal(tasks.length, 0); assert.deepEqual(calls, []);
  assert.equal(graph.needsRefresh, true);
  panel.hidden = false;
  graph.refresh = () => { graph.needsRefresh = false; graph.context = graph.key(); calls.push(["refresh"]); };
  graph.render(cx); graph.render(cx);
  assert.deepEqual(calls, [["refresh"]]);
  stack.active = "files";
  assert.equal(graph.visible(), false, "an inactive stack child is not visible");
  state.props = { folder: "/repo" };
  assert.equal(graph.visible(), true, "standalone panes retain their own lifecycle");
});

test("right-click branch menu retains explicit Checkout", () => {
  const items = git.menuFor({ kind: "branch", name: "topic", commit: { hash: "a", parents: [] } }, { current: "main", branches: ["main", "topic"], remotes: [] });
  assert.ok(items.some(item => item.action?.type === "checkout"));
});
