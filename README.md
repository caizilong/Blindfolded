# 三阶盲拧编码训练器

一个本地运行的三阶魔方盲拧编码训练工具。项目按固定配色、观察方向和缓冲块分析打乱，并生成棱块编码、角块编码、奇偶提示、翻棱、扭角以及小循环起点。

## 功能

- 粘贴或手动输入三阶打乱公式
- 随机生成新的 3x3 练习题
- 回看之前练习过的公式
- 显示打乱后的魔方展开图
- 可选显示面块字母编码
- 先隐藏答案，完成心算后再揭晓
- 输出棱块与角块编码，并自动两两分组
- 判断棱块编码奇偶和 Jb 处理
- 识别翻棱、扭角和小循环起点
- 复制打乱公式或完整答案

## 固定约定

这不是一个可自由切换配色和缓冲的通用编码器。当前实现固定使用：

- 观察方向：黄顶红前
- 棱块缓冲：`CE`
- 角块缓冲：`EDM`
- 棱块编码为奇数时：棱块完成后做一次完整 Jb

Jb 公式：

```text
U' R U R' F' R U R' U' R' F R2 U' R'
```

## 运行环境

- Node.js `>= 22.13.0`
- pnpm `11.9.0`

查看当前版本：

```bash
node --version
pnpm --version
```

如果已安装 Node.js，但系统找不到 `pnpm`，可以通过 Corepack 启用项目指定的版本：

```bash
corepack enable
corepack prepare pnpm@11.9.0 --activate
```

## 安装与启动

进入项目目录：

```bash
cd /home/pi/czl/projects/Blindfolded
```

首次运行时安装依赖：

```bash
pnpm install
```

启动开发服务器：

```bash
pnpm dev
```

然后打开终端输出中的 `Local` 地址。默认通常为：

```text
http://localhost:5173/
```

如果 5173 端口已被占用，开发服务器会选择其他端口，请以终端实际显示的地址为准。

## 停止项目

在正在运行开发服务器的终端中按：

```text
Ctrl + C
```

如果找不到原来的终端，可以先查询监听端口的进程：

```bash
lsof -nP -iTCP:5173 -sTCP:LISTEN
```

再使用查询结果中的 PID 停止它：

```bash
kill <PID>
```

如果开发服务器使用的不是 5173，请将上述命令中的端口替换为实际端口。

## 使用方法

1. 在顶部输入框中粘贴打乱公式，或点击“随机下一个公式”；需要时可点击“回看上一个公式”。
2. 点击“应用公式”，也可使用 `Command + Enter` / `Ctrl + Enter`。
3. 在“状态”区域观察魔方；需要时打开“显示编码”。
4. 自己完成棱块、奇偶和角块编码。
5. 点击“揭晓答案”，核对编码、翻棱、扭角与小循环。

支持的打乱记号为 `U D L R F B`，每个动作可以带 `'` 或 `2`，例如：

```text
R U R' U' F2
```

当前不支持宽转、中层转动、整体转体或带括号的公式。

## 项目入口

- `app/page.tsx`：主页面与交互逻辑
- `app/cube-engine.mjs`：魔方转动、编码、奇偶、翻棱和扭角分析
- `app/cube-engine.d.mts`：分析引擎的 TypeScript 类型定义
- `app/globals.css`：页面样式与响应式布局
- `app/layout.tsx`：根布局、页面标题和描述
- `worker/index.ts`：Cloudflare Worker 运行时入口
- `vite.config.ts`：Vinext、Vite 与 Cloudflare 本地开发配置
- `tests/cube-engine.test.mjs`：魔方引擎与编码回归测试
- `tests/rendered-html.test.mjs`：服务端页面渲染测试

## 目录结构

```text
Blindfolded/
├── app/                    # 页面、样式和魔方引擎
├── build/                  # Sites / Vite 集成代码
├── db/                     # Drizzle 数据库入口与空 schema
├── examples/d1/            # 可选的 D1 示例
├── public/                 # 静态资源
├── tests/                  # 自动化测试
├── worker/                 # Cloudflare Worker 入口
├── package.json            # 脚本和依赖
├── pnpm-lock.yaml          # 锁定依赖版本
└── vite.config.ts          # 构建与开发服务器配置
```

## 常用命令

```bash
# 启动开发服务器
pnpm dev

# 生成生产构建
pnpm build

# 启动已构建的生产版本
pnpm start

# 运行自动化测试
pnpm test

# 检查代码规范
pnpm lint

# 生成 Drizzle 迁移
pnpm db:generate
```

建议在提交代码前执行完整检查：

```bash
pnpm check
```

## Cloudflare 部署

先确认 Wrangler 当前登录账户，再执行完整检查和部署：

```bash
pnpm exec wrangler whoami
pnpm check
pnpm deploy
```

当前正式地址和备用地址为：

```text
https://cube.coisinic.com
https://blindfolded-cube-trainer.coisinic243.workers.dev
```

GitHub Actions 部署需要配置 `CLOUDFLARE_ACCOUNT_ID` 和 `CLOUDFLARE_API_TOKEN` Secrets；本机部署与回滚步骤记录在工作区根目录的 `deploy.md`。

## 技术栈

- React 19
- Next.js App Router 兼容页面结构
- Vinext
- Vite
- Cloudflare Workers
- TypeScript / JavaScript
- Node.js Test Runner

## 常见问题

### `pnpm: command not found`

确认 Node.js 已正确安装，然后通过 Corepack 启用 pnpm：

```bash
corepack enable
corepack prepare pnpm@11.9.0 --activate
```

### Node.js 版本过低

项目要求 Node.js `>= 22.13.0`。请升级 Node.js，重新执行 `pnpm install` 后再启动。

### 5173 端口打不开

先检查执行 `pnpm dev` 的终端是否仍在运行，并以终端中的 `Local` 地址为准。端口被占用时，实际地址可能是 `http://localhost:5174/` 或其他端口。

### 打乱公式无法识别

确保每个动作之间有空格，并且只使用 `U D L R F B`、`'` 和 `2`。
