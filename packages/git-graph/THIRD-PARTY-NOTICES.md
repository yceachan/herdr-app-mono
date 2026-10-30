# 第三方来源

固定版本见 [upstream.json](upstream.json)。

| 来源 | 本仓库路径 | 许可 | 修改 |
| --- | --- | --- | --- |
| [herdr-app](https://github.com/herdrdev/herdr-app) 0.1.9 的已安装默认文件 | `layouts/main-graph.json`、`mods/tabs-graph/` | Apache-2.0，见 `licenses/Apache-2.0.txt` | 克隆 main 与 tabs，仅增加 Graph 面板、入口与布局预览 |
| [Git Graph](https://github.com/rabeeh-ta/herdr-git-graph/tree/24a0afb9743ab3e3640c049b5e6b03d597d1a045) | `mods/git-graph/`、`tests/git-graph.test.mjs` | MIT，Copyright (c) 2026 Rabeeh T A，见 `licenses/git-graph-MIT.txt` | 移除左键双击 checkout，暂停隐藏侧栏的后台读取与预取，增加交互测试 |
| Lucide 风格图标 | `mods/git-graph/icons/` | ISC / Feather MIT 来源声明 | 保留上游 `LICENSE-lucide.txt` |

标签栏顶部标注改动来源，布局以 `cloned_from` 标识来源。

## 运行权限

Git Graph 通过 `exec("git", argv, {cwd, on})` 读取焦点终端所在仓库的历史、refs、状态与 diff；通过文件监听保持本地视图更新，远程仓库每 15 秒刷新。侧栏隐藏时暂停新读取与预取，展开后刷新。未跟踪文件的 diff 可读取仓库内文件。读操作使用上游禁用 index 刷新的参数。

右键菜单可执行 Git 写操作；Fetch、push、删除远程分支等显式操作连接仓库配置的 remote。组件不额外引入分析或遥测服务。
