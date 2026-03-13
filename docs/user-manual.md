# AIOS 用户使用手册

本文面向最终用户，介绍如何安装、启动和日常使用 AIOS。

## 1. AIOS 是什么

AIOS 是一个由 AI 驱动的个人操作系统原型：
- 你可以在聊天窗口直接下达任务。
- 你可以使用内置应用处理笔记、记账、订阅、阅读、交易等工作。
- 应用和 AI 可以协同工作，数据保存在你自己的系统里。

## 2. 安装要求

安装前请确认：
- Node.js 22+
- Git
- 可访问 GitHub
- Linux/macOS/Windows 之一

## 3. 安装方式

### Linux (Ubuntu/Debian)

```bash
curl -fsSL https://aios.valueriver.com/install-linux.sh | bash
```

### macOS

```bash
curl -fsSL https://aios.valueriver.com/install-macos.sh | bash
```

### Windows (PowerShell)

```powershell
powershell -ExecutionPolicy Bypass -Command "iwr -useb https://aios.valueriver.com/install-windows.ps1 | iex"
```

安装完成后，打开：
- `http://localhost:9700`

## 4. 首次进入系统

首次进入时按页面引导完成初始化（管理员账号、基础设置）。
完成后进入主界面。

系统初始化与使用时，支持以下能力：
- 支持 GPT、Gemini、Claude、DeepSeek、MiniMax、Kimi、GLM 等多种 OpenAI 兼容模型接入。
- 支持聚合平台接入：OpenRouter、Together AI、Fireworks AI。
- 支持 Coding Plan（编码计划）接入：智谱、阿里云、火山引擎、腾讯云、Kimi。

## 5. CLI 命令

安装成功后可直接使用 `aios` 命令：

```bash
aios
```

常用子命令：

```bash
aios start      # 启动服务
aios stop       # 停止服务
aios restart    # 重启服务并重建前端
aios status     # 查看运行状态
aios web        # 打开 Web 界面
aios help       # 查看帮助
```

如果提示 `aios: command not found`：
- 重新打开一个终端窗口后再试。

## 6. Web 端模块说明

主界面左侧导航除“聊天、历史”外，还包含以下模块：
- 任务（`/tasks`）：查看运行中任务、历史任务；进入任务详情；创建定时/循环任务。
- 文件（`/files`）：浏览与管理系统文件。
- 技能（`/skills`）：查看可用技能并用于任务执行。
- 应用区（如 `/notebook`、`/finance`、`/subscriber`、`/cryptobot`、`/reader`、`/poker`、`/fortune`、`/banana`）：进入各业务应用。
- 创建应用（`/apps/create`）：通过对话描述需求，创建新应用。
- 社区：打开社区链接（新窗口）。
- 设置（`/settings`）：账号、模型与系统相关配置。

另外，顶部还有任务面板和侧边聊天面板的快捷入口，用于快速查看任务与发起对话。

默认地址：
- 主服务：`http://localhost:9700`
- 应用服务：`http://localhost:9701`

## 7. 技能管理（安装 / 卸载 / 使用）

当前系统只扫描项目根目录的 `skills/`，并通过 `SKILL.md` 读取技能信息。

### 7.1 安装技能

1. 在 `skills/` 下创建技能目录（目录名即技能 `id`），例如 `skills/my-skill/`。
2. 在该目录创建 `SKILL.md`，并写入 frontmatter（至少 `name` 或 `description`）：

```md
---
name: My Skill
description: 用于处理某类任务
---

这里写技能的具体说明与操作步骤。
```

3. 可选目录：`scripts/`、`references/`、`assets/`。
4. 刷新页面后，在“技能”页面（`/skills`）可看到该技能。

### 7.2 卸载技能

直接删除对应技能目录即可，例如：

```bash
rm -rf skills/my-skill
```

删除后刷新页面，“技能”列表会移除该技能。

### 7.3 使用技能

1. 在聊天中明确说明要使用的技能名称（建议写出技能名或 `id`）。
2. 系统会把已安装技能列表注入到模型上下文，模型可按技能说明执行。
3. 若技能包含脚本或参考文件，按 `SKILL.md` 中定义的流程执行。

## 8. 内置应用

当前默认内置应用（以实际版本为准）：
- Notebook（记事本）
- Finance（记账本）
- Subscriber（订阅机）
- Cryptobot（炒币机）
- Reader（阅读器）
- Poker（炸金花）
- Fortune（算一卦）
- Banana（老手机）

## 9. 常见问题

### Q1: 页面打不开

按顺序检查：
1. `aios status` 确认主服务与应用服务状态。
2. 若未运行，执行 `aios start`。
3. 若端口被占用，先释放冲突端口再重启。

### Q2: 重启后仍有异常

执行：

```bash
aios restart
```

该命令会先停止服务，再构建 UI，然后重新启动服务。

### Q3: 升级系统

进入安装目录后更新代码，再执行重启：

```bash
git pull --ff-only
npm ci
npm run build
aios restart
```

## 10. 卸载（手动）

AIOS 默认安装在：
- Linux: `/opt/aios`
- macOS/Windows: `~/aios`

卸载步骤：
1. `aios stop`
2. 删除安装目录
3. 清理系统服务（如 systemd/launchctl/计划任务）

## 11. 反馈与协作

- GitHub: `https://github.com/valueriver/AIOS`
- Website: `https://aios.valueriver.com`

如需提交问题，请附带：
- 操作系统版本
- `aios status` 输出
- 复现步骤
