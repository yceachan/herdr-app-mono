# Herdr Git Graph

在官方默认布局旁新增 `main-graph`：保留 Spaces / Agents / Shell 和官方交互，仅在 Files / Changes 旁增加 Graph。

## 使用

- 点击 **Graph** 展示当前焦点终端所在仓库的分支与提交历史；再次点击收起。面板选择按 space 记忆。
- 点击提交查看详情，再点击文件查看 diff。侧栏可拖宽，Graph 支持作为独立 pane 使用。
- 双击分支标签会 checkout；右键菜单提供 merge、rebase、reset、push 等上游操作。复杂或破坏性操作有确认对话框；切换 Agent 正在使用的工作树前先协调它的工作。

## 安装与更新

基于 herdr-app **0.1.9** 默认布局；需要 git。组件在 Herdr 内运行，无需安装 Node 运行时依赖。

```sh
python3 scripts/install.py ~/.config/herdr-app
herdr-app check ~/.config/herdr-app/mods/tabs-graph
herdr-app check ~/.config/herdr-app/mods/git-graph
herdr-app do layout.switch '{"name":"main-graph"}'
```

自定义 app home 时，替换路径并为 herdr-app 命令设置相同的 HERDR_APP_HOME。

安装器只管理本包布局和 mods，保留官方 main、设置及快捷键。首次遇到同名文件会停止；更新时校验 `.herdr-app-mono-install.json`，保留被用户另行修改的文件并报错。修改本仓库后重新运行安装器同步。

main 与 tabs 是官方默认文件的克隆；Herdr 升级后可从新默认文件重新合入 Graph 面板和入口。来源与许可见 [THIRD-PARTY-NOTICES.md](THIRD-PARTY-NOTICES.md)。

## 验证与回退

```sh
npm test
herdr-app check mods/tabs-graph
herdr-app check mods/git-graph
```

离线测试需要 Node.js 22+、Python 3 和 git。返回未修改的官方布局：

```sh
herdr-app do layout.switch '{"name":"main"}'
```

## 许可证

本仓库原创集成代码以 [MIT](LICENSE) 发布。随附的上游组件分别遵循 Apache-2.0、MIT 和 ISC；对应版权与许可文本保留在 [THIRD-PARTY-NOTICES.md](THIRD-PARTY-NOTICES.md)、`licenses/` 和图标目录中。
