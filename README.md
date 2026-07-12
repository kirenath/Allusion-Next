# Allusion-Next

本项目 fork 自 [RafaUC/Allusion](https://github.com/RafaUC/Allusion),而 RafaUC/Allusion 本身又是 fork 自原版 [Allusion](https://github.com/allusion-app/Allusion/)。

## 本 Fork 的改动

- 修改包管理为pnpm
- 翻译界面，增加i18n
- 增加noto sans字体
- 重构前端显示

---

## RafaUC/Allusion

[RafaUC/Allusion](https://github.com/RafaUC/Allusion) 在原版 Allusion 基础上增加了以下功能:
- 视频支持。
  - 视频和 GIF 播放选项。
- 批量标签。
- 隐含标签关系。
  - 隐含标签的自动继承。
  - 与高级搜索完全兼容。
- 额外属性(Extra Properties)。
  - 允许为文件定义额外属性。
  - 按额外属性值对文件排序。
  - 在高级搜索中使用这些额外属性。
- 体验优化。
  - 刷新快捷键。
  - 修复标签树在拖拽/展开时的奇怪行为。
  - 在标签树中使用并组合修饰键实现多样化的标签选择。
    - 按住 Alt 选中整个标签集合(某个标签及其所有子标签);否则只选中可见的标签。
    - 按住 Command/Control 启用增量/排除式选择。
    - 按住 Shift 启用范围多选。
  - 改进了文件变化时的缩略图更新逻辑。
  - 当缩略图生成耗时过长时自动重试。
  - 标签编辑器可以移动到主画廊的侧边。
  - 在标签编辑器的右键菜单中查找标签。
  - 画廊中缩略图的间距可调整。
  - 多项性能优化与 bug 修复。
  - 更多细节请参见 Releases 页面中的更新日志。

感谢 [RafaUC](https://github.com/RafaUC) 以及所有为该 fork 做出贡献的人!❤️

---

## 关于 Allusion

Allusion 是一款为艺术家打造的工具,旨在帮助你整理你的**视觉素材库(Visual Library)** —— 一个集中存放你所有参考图、灵感图以及其他各类图片的地方。

[了解更多关于 Allusion →](https://allusion-app.github.io/)

感谢 [allusion-app/Allusion](https://github.com/allusion-app/Allusion) 的原开发者以及社区的辛勤付出!❤️

## 安装

在 [Releases](https://github.com/kirenath/Allusion-Next/releases) 页面获取本 fork 的最新版本。

## 开发

### 快速开始

你需要安装 [NodeJS](https://nodejs.org/en/download/) 以及 [pnpm](https://pnpm.io/installation)。
然后运行以下命令开始开发:

1. 运行 `pnpm install` 安装或更新所有必要的依赖。
2. 运行 `pnpm dev` 将项目文件构建到 `/build` 目录。该命令会持续运行,并在文件变化时立即重新构建。
3. 打开第二个终端,运行 `pnpm start` 启动应用。修改文件后需刷新窗口(Ctrl/Cmd + R)以加载更新后的构建文件。

### 发布构建

可以使用 `pnpm package` 为你的平台构建可安装的可执行文件,生成结果位于 `/dist` 目录。构建过程使用 [electron-builder](https://www.electron.build/) 包完成,相关配置位于 `package.json` 文件中。

## 更多信息

原始仓库有一份 [wiki](https://github.com/allusion-app/Allusion/wiki) 文档。
