# AGENTS.md

## Hard Rules (Must Follow)

1. 禁止兜底代码、兼容分支、静默修复、隐式回退。
2. 只允许单一路径实现（single path）。输入不合法时，直接返回明确错误，不得自动纠正。
3. 禁止“为了不报错而补数据”或“自动创建缺失记录”。
4. 不得引入 `fallback`、`compat`、`degrade`、`legacy path` 类型逻辑。
5. 不确定需求时先停下并提问，禁止擅自加“临时兼容”。

## Error Handling Standard

1. 所有关键入口必须做显式校验（参数、资源存在性、状态合法性）。
2. 校验失败返回可诊断错误（HTTP 状态码 + 明确错误信息）。
3. 前端仅做显式错误展示或跳转，不得本地伪造成功状态。

## Database Rules (Development Phase)

1. 处于开发阶段时，数据库结构变更必须直接改为最终结构，不做增量兼容迁移。
2. 禁止通过 `ALTER TABLE ADD COLUMN`、回填脚本、双写等方式兼容老数据。
3. 允许并鼓励直接删除旧数据库文件并重建（如 `database/aios.db`）。
4. 所有读写逻辑只面向最新 schema，不得出现“新旧 schema 并存”代码路径。
5. 提交时必须保证数据库相关代码是最终形态、标准化、可读、无历史包袱。

## Feature Removal Rules (Must Be Complete)

1. 当用户要求“移除/删除某功能”时，必须执行全链路删除，不允许只下线入口。
2. 必须同时清理：前端页面与组件、后端 API、service/repository、提示词注入、路由挂载、i18n 文案、相关目录与脚本文件。
3. 必须清理数据库层：删除对应表/字段定义；开发阶段直接重建数据库，不做数据兼容迁移。
4. 禁止保留任何占位实现、空壳模块、隐藏开关、软删除分支。
5. 删除后必须做残留扫描并汇报 0 命中，默认检查：
   - `rg -n "功能关键词|API路径|组件名|表名|提示词段名" server ui/src apps shared`

## Change Acceptance Checklist (Required Before Final Reply)

1. 说明本次改动的“唯一正确路径”是什么。
2. 说明删除了哪些兜底/兼容逻辑（如无则写“无”）。
3. 运行以下自检并汇报结果：

```bash
rg -n "fallback|compat|兼容|兜底|degrade|legacy" .
```

4. 如果业务必须兼容旧数据/旧接口，必须先得到用户明确批准，再单独实现，不得默认加入。
5. 涉及数据库结构调整时，明确说明是否重建数据库；默认采用“重建，不兼容老数据”。
