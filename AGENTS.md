# Repository Guidelines

## Project Structure & Module Organization
- `analyzer.ts`/`analyzer.test.ts`: 记忆抽取逻辑与测试。
- `index.ts`: 入口（目前只加载 dotenv）。
- `package.json`/`bun.lock`: Bun 项目依赖与锁文件。
- `.env.example`: 示例环境变量。
- `README.md`: 项目理念与使用说明。

## Build, Test, and Development Commands
- `bun install`: 安装依赖。
- `bun test`: 运行测试（依赖 `DEEPSEEK_API_KEY` 调用外部 API）。
- `bunx tsc --noEmit`: 仅类型检查（可选）。

## Coding Style & Naming Conventions
- 语言：TypeScript（ESM）。
- 缩进：2 空格。
- 文件命名：小写/中横线或驼峰与现有文件保持一致（如 `analyzer.ts`）。
- 类型与常量：`PascalCase` 类型名，`SCREAMING_SNAKE_CASE` 常量名。
- 格式化：目前未配置专用格式化/ lint 工具；保持与现有风格一致。

## Testing Guidelines
- 测试框架：`bun:test`。
- 测试文件：`*.test.ts`。
- 运行示例：`DEEPSEEK_API_KEY=xxx bun test`。
- 外部依赖：测试会访问 DeepSeek API；避免在无网络或无 Key 场景运行。

## Commit & Pull Request Guidelines
- 当前提交记录较短，建议使用简洁的动词开头信息（例如 `init bun`, `test basic profile`）。
- PR 建议包含：
  - 变更说明与动机。
  - 相关 issue 链接（如有）。
  - 若涉及 API 变更，请附示例或截图。

## Security & Configuration Tips
- 敏感配置放在 `.env`，不要提交到仓库。
- 可参考 `.env.example` 配置 `DEEPSEEK_API_KEY`。
