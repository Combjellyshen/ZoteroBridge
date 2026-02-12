# ZoteroBridge

<p align="right">
  <b>🇨🇳 简体中文</b> | <a href="README-en.md">🇬🇧 English</a>
</p>

<p align="center">
  <b>连接 Zotero SQLite 数据库的模型上下文协议 (MCP) 服务器</b>
</p>

<p align="center">
  <a href="https://www.npmjs.com/package/zotero-bridge"><img src="https://img.shields.io/npm/v/zotero-bridge" alt="npm version"></a>
  <a href="https://www.zotero.org/"><img src="https://img.shields.io/badge/Zotero-7.0+-red" alt="Zotero"></a>
  <a href="https://nodejs.org/"><img src="https://img.shields.io/badge/Node.js-18+-green" alt="Node.js"></a>
  <a href="https://www.typescriptlang.org/"><img src="https://img.shields.io/badge/TypeScript-5.0+-blue" alt="TypeScript"></a>
  <a href="https://modelcontextprotocol.io/"><img src="https://img.shields.io/badge/MCP-1.0-purple" alt="MCP"></a>
  <a href="LICENSE"><img src="https://img.shields.io/badge/License-MIT-yellow" alt="License"></a>
</p>

## 概述

ZoteroBridge 是一个模型上下文协议 (MCP) 服务器，可直接连接到 Zotero 的 SQLite 数据库 (`zotero.sqlite`)，让 AI 助手（如 Claude、ChatGPT、GitHub Copilot 等）能够与您的 Zotero 文献库进行交互。

### 主要特性

- 🗂️ **文件夹管理** - 创建、重命名、移动和删除 Zotero 文件夹（集合）
- 🏷️ **标签管理** - 为文献添加、删除和查询标签
- 📖 **条目操作** - 搜索条目、获取详情、管理文件夹关系
- 📝 **内容管理** - 读取/设置摘要，添加笔记
- 📄 **PDF 处理** - 提取全文、生成摘要、全文搜索、获取标注
- 🔍 **标识符搜索** - 通过 DOI、ISBN、PMID、arXiv、URL 查找文献
- 🔗 **相关条目** - 查找手动关联、共享标签/作者的相似文献
- 🛠️ **库维护** - 查找重复项、验证附件、清理孤立记录、合并条目

---

## 更新日志
### v1.1.5 (2026-02-01)

🗑️ **回收站识别功能**
- ✅ 所有查询函数现在正确排除 `deletedItems` 表中的条目
- ✅ `getItemDetails` 新增 `isDeleted` 和 `dateDeleted` 字段
- ✅ `findItemByDOI/ISBN/Identifier` 自动跳过回收站中的条目
- ✅ 新增 `isItemDeleted()` 方法检查条目是否在回收站
- ✅ 新增 `getDeletedItems()` 方法获取回收站内容
- ✅ 新增 `getDeletedItemsCount()` 方法获取回收站条目数量
- ✅ 附件查询也排除已删除的附件
### v1.1.3 (2026-02-01)

🔧 **修复**
- ✅ 修复了集合（文件夹）创建功能 - 添加了必需的 `clientDateModified` 字段
- ✅ 修复了集合重命名功能 - 正确更新 `clientDateModified` 时间戳
- ✅ 修复了集合移动功能 - 确保父子关系正确建立
- ✅ 所有集合操作现在完全符合 Zotero 官方数据库规范

现在可以正常使用：
- 创建新集合（顶级文件夹）
- 创建子集合（支持多层嵌套）
- 重命名集合
- 移动集合到其他父集合
- 获取子集合列表

### v1.1.2

- 改进数据库连接稳定性
- 优化错误处理机制

### v1.1.0

- 将 42 个工具整合为 13 个基于动作的工具
- 简化接口同时保持全部功能

---

## 快速开始

### 前置要求

- Node.js 18.0 或更高版本
- Zotero 7.0 或更高版本
- 支持 MCP 的 AI 客户端（如 Claude Desktop、Cursor、VS Code Copilot）

### 安装方式

#### 方式一：通过 npm 全局安装（推荐）

```bash
npm install -g zotero-bridge
```

#### 方式二：从源码构建

```bash
# 克隆仓库
git clone https://github.com/Combjellyshen/ZoteroBridge.git
cd ZoteroBridge

# 安装依赖
npm install

# 构建项目
npm run build
```

### 配置 AI 客户端

#### Claude Desktop

添加到 Claude Desktop 配置文件：

**Windows**: `%APPDATA%\Claude\claude_desktop_config.json`  
**macOS**: `~/Library/Application Support/Claude/claude_desktop_config.json`

```json
{
  "mcpServers": {
    "zotero-bridge": {
      "command": "npx",
      "args": ["-y", "zotero-bridge"],
      "env": {}
    }
  }
}
```

如果从源码构建：

```json
{
  "mcpServers": {
    "zotero-bridge": {
      "command": "node",
      "args": ["path/to/ZoteroBridge/dist/index.js"],
      "env": {}
    }
  }
}
```

#### Cursor IDE

在项目根目录创建 `.cursor/mcp.json`：

```json
{
  "mcpServers": {
    "zotero-bridge": {
      "command": "npx",
      "args": ["-y", "zotero-bridge"]
    }
  }
}
```

#### VS Code Copilot

1. 打开 VS Code 设置 (`Ctrl+,`)
2. 搜索 `github.copilot.chat.mcpServers`
3. 点击 "在 settings.json 中编辑"
4. 添加以下配置：

```json
"github.copilot.chat.mcpServers": {
  "zotero-bridge": {
    "command": "npx",
    "args": ["-y", "zotero-bridge"]
  }
}
```

#### 自定义数据库路径

如果您的 Zotero 数据库不在默认位置：

```json
{
  "mcpServers": {
    "zotero-bridge": {
      "command": "npx",
      "args": ["-y", "zotero-bridge", "--db", "D:/MyZotero/zotero.sqlite"]
    }
  }
}
```

---

## 可用工具（13 个工具）


### manage_collection - 文件夹管理

管理 Zotero 文件夹（集合）的所有操作。

| 动作 | 描述 |
|------|------|
| `list` | 列出所有文件夹 |
| `get` | 获取文件夹详情 |
| `create` | 创建新文件夹 |
| `rename` | 重命名文件夹 |
| `move` | 移动文件夹到新父级 |
| `delete` | 删除文件夹 |
| `get_subcollections` | 获取子文件夹 |
| `add_item` | 将条目添加到文件夹 |
| `remove_item` | 从文件夹移除条目 |
| `get_items` | 获取文件夹中的所有条目 |

### manage_tags - 标签管理

管理标签的所有操作。

| 动作 | 描述 |
|------|------|
| `list` | 列出所有标签 |
| `get_item_tags` | 获取条目的所有标签 |
| `add` | 为条目添加标签 |
| `remove` | 从条目移除标签 |
| `create` | 创建新标签 |

### search_items - 搜索条目

按标题搜索 Zotero 条目。

### get_item_details - 获取条目详情

通过 ID 或 Key 获取条目的详细信息。

### manage_item_content - 内容管理

管理条目的摘要和笔记。

| 动作 | 描述 |
|------|------|
| `get_abstract` | 获取条目摘要 |
| `set_abstract` | 设置条目摘要 |
| `get_notes` | 获取条目笔记 |
| `add_note` | 为条目添加笔记 |

### manage_pdf - PDF 操作

PDF 文件的各种操作。

| 动作 | 描述 |
|------|------|
| `extract_text` | 从 PDF 提取全文 |
| `get_summary` | 获取 PDF 摘要信息 |
| `list` | 获取条目的 PDF 附件列表 |
| `search` | 在 PDF 中搜索文本 |
| `generate_abstract` | 从 PDF 内容生成摘要 |

### find_by_identifier - 标识符搜索

通过各种标识符查找文献，支持自动检测。

| 类型 | 描述 |
|------|------|
| `doi` | 通过 DOI 查找 |
| `isbn` | 通过 ISBN 查找 |
| `pmid` | 通过 PubMed ID 查找 |
| `arxiv` | 通过 arXiv ID 查找 |
| `url` | 通过 URL 查找 |
| `auto` | 自动检测标识符类型 |

### get_annotations - 获取标注

获取 PDF 标注（高亮、笔记等），支持按类型、颜色筛选或搜索。

### search_fulltext - 全文搜索

在 Zotero 全文索引中搜索或获取附件的全文内容。

### find_related_items - 查找相关条目

通过多种方式查找相关文献。

| 方法 | 描述 |
|------|------|
| `manual` | 获取手动关联的条目 |
| `tags` | 通过共享标签查找 |
| `creators` | 通过共享作者查找 |
| `collection` | 在同一文件夹中查找 |
| `all` | 使用所有方法查找 |

### get_database_info - 数据库信息

获取 Zotero 数据库信息（路径、存储位置、统计数据）。

### raw_query - 原始 SQL 查询

执行原始 SQL 查询（仅支持 SELECT，只读）。

### library_maintenance - 库维护 🆕

维护和清理 Zotero 库的工具。

| 动作 | 描述 |
|------|------|
| `find_duplicates` | 查找重复条目（按标题、DOI 或 ISBN） |
| `validate_attachments` | 验证附件文件是否存在 |
| `get_valid_attachment` | 获取条目的有效附件 |
| `find_with_valid_pdf` | 查找有有效 PDF 的条目 |
| `cleanup_orphans` | 清理孤立的附件记录（支持 dry-run） |
| `merge_items` | 合并重复条目 |

---

## 使用示例

### 与 Claude/Copilot 配合使用

```
# 搜索文献
搜索标题中包含"深度学习"的条目

# 获取详情
获取 itemID 为 1234 的条目详细信息

# 管理文件夹
创建一个名为"机器学习论文"的新文件夹
将条目 1234 添加到文件夹 5678

# PDF 操作
提取附件 ID 为 100 的 PDF 全文
在这个 PDF 中搜索"neural network"

# 通过 DOI 查找
查找 DOI 为 10.1126/science.aaa2397 的文献

# 获取标注
获取条目 1234 的所有高亮标注

# 库维护
查找我的库中的重复条目
检查条目 1234 的附件是否有效
```

---

## 项目结构

```
ZoteroBridge/
├── src/
│   ├── index.ts      # MCP 服务器入口
│   ├── database.ts   # Zotero SQLite 数据库操作
│   ├── pdf.ts        # PDF 处理模块
│   └── tools.ts      # MCP 工具定义（13 个整合工具）
├── dist/             # 编译输出
├── test/             # 测试文件
├── package.json
├── tsconfig.json
└── README.md
```

---

## 开发指南

### 开发模式

```bash
# 监听文件变化并自动编译
npm run dev
```

### 构建

```bash
npm run build
```

### 命令行参数

```bash
# 显示帮助
zotero-bridge --help

# 指定数据库路径
zotero-bridge --db /path/to/zotero.sqlite

# 只读模式
zotero-bridge --readonly
```

---

## 注意事项

1. **关闭 Zotero**：使用写入功能时，请关闭 Zotero 客户端以避免数据库锁定
2. **备份数据**：在进行修改前备份 `zotero.sqlite`
3. **只读模式**：仅读取数据时使用 `--readonly` 参数更安全
4. **附件验证**：使用 `library_maintenance` 的 `validate_attachments` 检查文件是否存在

---

## 更新日志
### v1.1.4 (2026-02-01)

🔧 **重要修复 - 数据库兼容性**
- ✅ 修复重复项查询不一致问题 - `findItemByDOI/ISBN` 现在始终返回最新修改的条目
- ✅ 修复 `itemTags.type` 字段 - 该字段为 NOT NULL，必须提供值
- ✅ 动态获取 `note`/`attachment` 的 itemTypeID，不再硬编码
- ✅ 所有查询现在排除 `deletedItems` 表中的已删除条目

🚀 **新功能**
- ✨ 添加事务支持 (`beginTransaction/commitTransaction/rollbackTransaction`)
- ✨ `mergeItems` 现在使用事务保证数据一致性
- ✨ `mergeItems` 新增附件转移功能
- ✨ 重复项查询现在返回 `_duplicateWarning` 警告信息

🛡️ **安全性改进**
- 所有写操作前检查 Zotero 进程状态
- 自动创建数据库备份
- 批量操作使用事务保护
### v1.1.2 (2025-02-01)
- 更新所有依赖到最新版本
- 修复 Zod 4.x 兼容性问题
- 修复 pdf-parse 2.x ESM 导入问题

### v1.1.1 (2025-02-01)
- 将 42 个工具整合为 13 个基于动作的工具
- 新增 `library_maintenance` 工具（重复检测、附件验证、孤立清理、条目合并）

### v1.1.0
- 初始整合版本

---

## 📄 许可证

本项目采用 [MIT 许可证](LICENSE)。

---

## 🙏 致谢

- [Zotero](https://www.zotero.org/) - 开源文献管理工具
- [Model Context Protocol](https://modelcontextprotocol.io/) - AI 工具集成协议
- [cookjohn/zotero-mcp](https://github.com/cookjohn/zotero-mcp) - 项目参考

---

## 📬 联系方式

- 作者：Combjellyshen
- GitHub：[https://github.com/Combjellyshen/ZoteroBridge](https://github.com/Combjellyshen/ZoteroBridge)
- npm：[https://www.npmjs.com/package/zotero-bridge](https://www.npmjs.com/package/zotero-bridge)

欢迎提交 Issue 或 Pull Request！
