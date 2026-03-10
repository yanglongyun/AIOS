# AIOS 项目规范

## Demo 制作规范

- 目录：`dev/demos/<应用名>/`，每个应用一个目录
- 格式：纯 HTML 高保真原型
- 命名：`v<数字>-<中文描述>.html`，如 `v1-绒面托盘.html`、`v2-打字机按键.html`
- 修改时不覆盖原文件，复制一份新版本号的文件再改
- 版本号递增，保留历史版本

## 翻新到正式代码

- AIOS 使用 Tailwind CSS 优先
- 布局、颜色、圆角、字号、间距等用 Tailwind class
- 原生 CSS 仅用于 Tailwind 无法实现的：复杂渐变纹理、多层 box-shadow、@keyframes 动画、伪元素、background-image 纹理
- 写在 `<style scoped>` 中
