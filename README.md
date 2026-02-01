# ZoteroBridge

<p align="center">
  <a href="#中文">🇨🇳 简体中文</a> | <a href="#english">🇬🇧 English</a>
</p>

<p align="center">
  <a href="https://www.zotero.org/"><img src="https://img.shields.io/badge/Zotero-7.0+-red" alt="Zotero"></a>
  <a href="https://nodejs.org/"><img src="https://img.shields.io/badge/Node.js-18+-green" alt="Node.js"></a>
  <a href="https://www.typescriptlang.org/"><img src="https://img.shields.io/badge/TypeScript-5.0+-blue" alt="TypeScript"></a>
  <a href="https://modelcontextprotocol.io/"><img src="https://img.shields.io/badge/MCP-1.0-purple" alt="MCP"></a>
  <a href="LICENSE"><img src="https://img.shields.io/badge/License-MIT-yellow" alt="License"></a>
</p>

---

<a name="中文"></a>
# 🇨🇳 简体中文

<p align="center">
  <b>连接 Zotero SQLite 数据库的模型上下文协议 (MCP) 服务器</b>
</p>

## 📚 概述

ZoteroBridge 是一个模型上下文协议 (MCP) 服务器，可直接连接到 Zotero 的 SQLite 数据库 (`zotero.sqlite`)，让 AI 助手（如 Claude、ChatGPT 等）能够与您的 Zotero 文献库进行交互。

### ✨ 主要特性

- 🗂️ **文件夹管理** - 创建、重命名、移动和删除 Zotero 文件夹（集合）
- 🏷️ **标签管理** - 为文献添加、删除和查询标签
- 📖 **条目操作** - 搜索条目、获取详情、管理文件夹关系
- 📝 **摘要管理** - 读取和设置条目摘要，添加笔记
- 📄 **PDF 处理** - 提取 PDF 全文、生成摘要、全文搜索

---

## 🚀 快速开始

### 前置要求

- Node.js 18.0 或更高版本
- Zotero 7.0 或更高版本
- 支持 MCP 的 AI 客户端（如 Claude Desktop、Cursor）

### 安装

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
      "command": "node",
      "args": ["path/to/ZoteroBridge/dist/index.js"]
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
    "command": "node",
    "args": ["path/to/ZoteroBridge/dist/index.js"]
  }
}
```

请将 `path/to/ZoteroBridge/dist/index.js` 替换为实际的绝对路径。

#### 自定义数据库路径

如果您的 Zotero 数据库不在默认位置：

```json
{
  "mcpServers": {
    "zotero-bridge": {
      "command": "node",
      "args": [
        "path/to/ZoteroBridge/dist/index.js",
        "--db", "D:/MyZotero/zotero.sqlite"
      ]
    }
  }
}
```

---

## 🛠️ 可用工具

### 文件夹管理

| 工具 | 描述 |
|------|------|
| `list_collections` | 列出所有文件夹 |
| `get_collection` | 获取文件夹详情 |
| `create_collection` | 创建新文件夹 |
| `rename_collection` | 重命名文件夹 |
| `move_collection` | 移动文件夹到新父级 |
| `delete_collection` | 删除文件夹 |
| `get_subcollections` | 获取子文件夹 |

### 标签管理

| 工具 | 描述 |
|------|------|
| `list_tags` | 列出所有标签 |
| `create_tag` | 创建新标签 |
| `add_tag` | 为条目添加标签 |
| `remove_tag` | 从条目移除标签 |
| `get_item_tags` | 获取条目的所有标签 |

### 条目操作

| 工具 | 描述 |
|------|------|
| `search_items` | 按标题搜索条目 |
| `get_item_details` | 获取条目详细信息 |
| `add_item_to_collection` | 将条目添加到文件夹 |
| `remove_item_from_collection` | 从文件夹移除条目 |
| `get_collection_items` | 获取文件夹中的所有条目 |

### 摘要和笔记

| 工具 | 描述 |
|------|------|
| `get_item_abstract` | 获取条目摘要 |
| `set_item_abstract` | 设置条目摘要 |
| `get_item_notes` | 获取条目笔记 |
| `add_item_note` | 为条目添加笔记 |

### PDF 处理

| 工具 | 描述 |
|------|------|
| `extract_pdf_text` | 从 PDF 提取全文 |
| `get_pdf_summary` | 获取 PDF 摘要信息 |
| `get_item_pdfs` | 获取条目的 PDF 附件 |
| `search_pdf` | 在 PDF 中搜索文本 |
| `generate_abstract_from_pdf` | 从 PDF 内容生成摘要 |

### 实用工具

| 工具 | 描述 |
|------|------|
| `get_database_info` | 获取数据库信息 |
| `raw_query` | 执行原始 SQL 查询（仅 SELECT） |

### 标识符搜索（DOI/ISBN）

| 工具 | 描述 |
|------|------|
| `find_by_doi` | 通过 DOI 查找条目 |
| `find_by_isbn` | 通过 ISBN 查找条目 |
| `find_by_identifier` | 通过任意标识符查找条目（DOI、ISBN、PMID、arXiv） |

### PDF 标注

| 工具 | 描述 |
|------|------|
| `get_item_annotations` | 获取条目的所有标注（高亮、笔记等） |
| `get_attachment_annotations` | 获取特定附件的标注 |
| `get_annotations_by_type` | 按类型筛选标注（高亮、笔记等） |
| `get_annotations_by_color` | 按颜色筛选标注 |
| `search_annotations` | 在标注内容中搜索 |

### 全文搜索

| 工具 | 描述 |
|------|------|
| `search_fulltext` | 在全文索引中搜索 |
| `get_fulltext_content` | 获取附件的全文内容 |
| `search_fulltext_with_context` | 带上下文片段的全文搜索 |

### 相关条目

| 工具 | 描述 |
|------|------|
| `get_related_items` | 获取手动关联的相关条目 |
| `find_similar_by_tags` | 通过共享标签查找相似条目 |
| `find_similar_by_creators` | 通过共享作者查找相似条目 |
| `find_similar_by_collection` | 在同一文件夹中查找相似条目 |

---

## 📖 使用示例

### 与 Claude 配合使用

```
# 列出所有文件夹
列出我 Zotero 文献库中的所有文件夹

# 创建新文件夹
创建一个名为"机器学习论文"的新文件夹

# 搜索条目
搜索标题中包含"深度学习"的条目

# 提取 PDF 内容
提取这个条目 PDF 的全文并生成摘要

# 添加标签
为这个条目添加"重要"和"待读"标签
```

---

## 🏗️ 项目结构

```
ZoteroBridge/
├── src/
│   ├── index.ts      # MCP 服务器入口
│   ├── database.ts   # Zotero SQLite 数据库操作
│   ├── pdf.ts        # PDF 处理模块
│   └── tools.ts      # MCP 工具定义
├── dist/             # 编译输出
├── package.json
├── tsconfig.json
└── README.md
```

---

## 👨‍💻 开发指南

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
node dist/index.js --help

# 指定数据库路径
node dist/index.js --db /path/to/zotero.sqlite

# 只读模式
node dist/index.js --readonly
```

---

## ⚠️ 注意事项

1. **关闭 Zotero**：使用写入功能时，请关闭 Zotero 客户端以避免数据库锁定
2. **备份数据**：在进行修改前备份 `zotero.sqlite`
3. **只读模式**：仅读取数据时使用 `--readonly` 参数更安全

---

## 📄 许可证

本项目采用 [MIT 许可证](LICENSE)。

---

## 🙏 致谢

- [Zotero](https://www.zotero.org/) - 优秀的开源文献管理工具
- [Model Context Protocol](https://modelcontextprotocol.io/) - AI 工具集成协议
- [cookjohn/zotero-mcp](https://github.com/cookjohn/zotero-mcp) - 项目参考

---

## 📬 联系方式

- 作者：Combjellyshen
- GitHub：[https://github.com/Combjellyshen/ZoteroBridge](https://github.com/Combjellyshen/ZoteroBridge)

欢迎提交 Issue 或 Pull Request！

---

<br><br>

<a name="english"></a>
# 🇬🇧 English

<p align="center">
  <b>Model Context Protocol (MCP) Server for Zotero SQLite Database</b>
</p>

## 📚 Overview

ZoteroBridge is a Model Context Protocol (MCP) server that connects directly to Zotero's SQLite database (`zotero.sqlite`), enabling AI assistants (like Claude, ChatGPT, etc.) to interact with your Zotero reference library.

### ✨ Key Features

- 🗂️ **Collection Management** - Create, rename, move, and delete Zotero collections (folders)
- 🏷️ **Tag Management** - Add, remove, and query tags for references
- 📖 **Item Operations** - Search items, get details, manage collection relationships
- 📝 **Abstract Management** - Read and set item abstracts, add notes
- 📄 **PDF Processing** - Extract PDF full text, generate summaries, full-text search

---

## 🚀 Quick Start

### Prerequisites

- Node.js 18.0 or higher
- Zotero 7.0 or higher
- An MCP-compatible AI client (e.g., Claude Desktop, Cursor)

### Installation

```bash
# Clone the repository
git clone https://github.com/Combjellyshen/ZoteroBridge.git
cd ZoteroBridge

# Install dependencies
npm install

# Build the project
npm run build
```

### Configure AI Clients

#### Claude Desktop

Add to your Claude Desktop configuration file:

**Windows**: `%APPDATA%\Claude\claude_desktop_config.json`  
**macOS**: `~/Library/Application Support/Claude/claude_desktop_config.json`

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

Create `.cursor/mcp.json` in your project root:

```json
{
  "mcpServers": {
    "zotero-bridge": {
      "command": "node",
      "args": ["path/to/ZoteroBridge/dist/index.js"]
    }
  }
}
```

#### VS Code Copilot

1. Open VS Code Settings (`Ctrl+,`).
2. Search for `github.copilot.chat.mcpServers`.
3. Click "Edit in settings.json".
4. Add the following configuration:

```json
"github.copilot.chat.mcpServers": {
  "zotero-bridge": {
    "command": "node",
    "args": ["path/to/ZoteroBridge/dist/index.js"]
  }
}
```
Make sure to replace `path/to/ZoteroBridge/dist/index.js` with the actual absolute path.

#### Custom Database Path

If your Zotero database is not in the default location:

```json
{
  "mcpServers": {
    "zotero-bridge": {
      "command": "node",
      "args": [
        "path/to/ZoteroBridge/dist/index.js",
        "--db", "D:/MyZotero/zotero.sqlite"
      ]
    }
  }
}
```

---

## 🛠️ Available Tools

### Collection Management

| Tool | Description |
|------|-------------|
| `list_collections` | List all collections |
| `get_collection` | Get collection details |
| `create_collection` | Create a new collection |
| `rename_collection` | Rename a collection |
| `move_collection` | Move collection to new parent |
| `delete_collection` | Delete a collection |
| `get_subcollections` | Get subcollections |

### Tag Management

| Tool | Description |
|------|-------------|
| `list_tags` | List all tags |
| `create_tag` | Create a new tag |
| `add_tag` | Add a tag to an item |
| `remove_tag` | Remove a tag from an item |
| `get_item_tags` | Get all tags for an item |

### Item Operations

| Tool | Description |
|------|-------------|
| `search_items` | Search items by title |
| `get_item_details` | Get detailed item information |
| `add_item_to_collection` | Add item to a collection |
| `remove_item_from_collection` | Remove item from a collection |
| `get_collection_items` | Get all items in a collection |

### Abstract and Notes

| Tool | Description |
|------|-------------|
| `get_item_abstract` | Get item abstract |
| `set_item_abstract` | Set item abstract |
| `get_item_notes` | Get item notes |
| `add_item_note` | Add a note to an item |

### PDF Processing

| Tool | Description |
|------|-------------|
| `extract_pdf_text` | Extract full text from PDF |
| `get_pdf_summary` | Get PDF summary information |
| `get_item_pdfs` | Get PDF attachments for an item |
| `search_pdf` | Search text within a PDF |
| `generate_abstract_from_pdf` | Generate abstract from PDF content |

### Utilities

| Tool | Description |
|------|-------------|
| `get_database_info` | Get database information |
| `raw_query` | Execute raw SQL query (SELECT only) |

### Identifier Search (DOI/ISBN)

| Tool | Description |
|------|-------------|
| `find_by_doi` | Find item by DOI |
| `find_by_isbn` | Find item by ISBN |
| `find_by_identifier` | Find item by any identifier (DOI, ISBN, PMID, arXiv) |

### PDF Annotations

| Tool | Description |
|------|-------------|
| `get_item_annotations` | Get all annotations for an item (highlights, notes, etc.) |
| `get_attachment_annotations` | Get annotations from a specific attachment |
| `get_annotations_by_type` | Filter annotations by type (highlight, note, etc.) |
| `get_annotations_by_color` | Filter annotations by color |
| `search_annotations` | Search within annotation content |

### Fulltext Search

| Tool | Description |
|------|-------------|
| `search_fulltext` | Search in fulltext index |
| `get_fulltext_content` | Get fulltext content of an attachment |
| `search_fulltext_with_context` | Fulltext search with context snippets |

### Related Items

| Tool | Description |
|------|-------------|
| `get_related_items` | Get manually linked related items |
| `find_similar_by_tags` | Find similar items by shared tags |
| `find_similar_by_creators` | Find similar items by shared authors |
| `find_similar_by_collection` | Find similar items in same collection |

---

## 📖 Usage Examples

### Using with Claude

```
# List all collections
List all collections in my Zotero library

# Create a new collection
Create a new collection called "Machine Learning Papers"

# Search items
Search for items with "deep learning" in the title

# Extract PDF content
Extract the full text from this item's PDF and generate a summary

# Add tags
Add "important" and "to-read" tags to this item
```

---

## 🏗️ Project Structure

```
ZoteroBridge/
├── src/
│   ├── index.ts      # MCP server entry point
│   ├── database.ts   # Zotero SQLite database operations
│   ├── pdf.ts        # PDF processing module
│   └── tools.ts      # MCP tool definitions
├── dist/             # Compiled output
├── package.json
├── tsconfig.json
└── README.md
```

---

## 👨‍💻 Development Guide

### Development Mode

```bash
# Watch for file changes and auto-compile
npm run dev
```

### Build

```bash
npm run build
```

### Command Line Arguments

```bash
# Show help
node dist/index.js --help

# Specify database path
node dist/index.js --db /path/to/zotero.sqlite

# Read-only mode
node dist/index.js --readonly
```

---

## ⚠️ Important Notes

1. **Close Zotero**: When using write features, close the Zotero client to avoid database locking
2. **Backup Data**: Backup `zotero.sqlite` before making modifications
3. **Read-only Mode**: Use `--readonly` flag when only reading data for safety

---

## 📄 License

This project is licensed under the [MIT License](LICENSE).

---

## 🙏 Acknowledgements

- [Zotero](https://www.zotero.org/) - Excellent open-source reference management tool
- [Model Context Protocol](https://modelcontextprotocol.io/) - AI tool integration protocol
- [cookjohn/zotero-mcp](https://github.com/cookjohn/zotero-mcp) - Project reference

---

## 📬 Contact

- Author: Combjellyshen
- GitHub: [https://github.com/Combjellyshen/ZoteroBridge](https://github.com/Combjellyshen/ZoteroBridge)

Feel free to submit Issues or Pull Requests!
