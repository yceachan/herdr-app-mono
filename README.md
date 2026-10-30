# Herdr App 配置集合

个人 Herdr App layouts、mods 与配套配置的源码仓库。每套可独立安装的配置放在 `packages/` 中，保留自身的安装入口、测试、说明和上游来源。

## Packages

| Package | 用途 | 使用说明 |
| --- | --- | --- |
| [git-graph](packages/git-graph/) | 在默认主布局的 Files / Changes 旁加入 Git 分支、提交历史与 diff 面板 | [安装与操作](packages/git-graph/README.md) |

Git Graph 是集合中的第一个 package；后续 layout 和配置按同样方式加入各自目录。

## 目录

```text
packages/
  git-graph/
    layouts/                 布局文件
    mods/                    面板与交互
    scripts/install.py       此 package 的安装入口
    tests/                   行为与安装测试
    README.md                使用说明
    THIRD-PARTY-NOTICES.md    上游来源及许可
    upstream.json            上游版本
```

各 package 按 Herdr 的文件布局组织，通过各自安装器写入所选 app home；官方内置文件、用户设置和快捷键由相应 package 明确声明是否改动。此仓库不自动安装所有 package。

## 验证

从仓库根运行当前 packages 的测试：

```sh
npm test
```

每个 package 的 README 说明其原生检查和安装方式。运行截图、性能追踪及临时日志保存在本地 `artifacts/`，不进入 Git 历史。

## 许可证

本仓库原创代码采用 [MIT](LICENSE)。各 package 随附组件的版权与上游许可记录在其 `THIRD-PARTY-NOTICES.md` 和许可文件中。
