# ZoteroBridge

<p align="right">
  <a href="README.md">简体中文</a> | <a href="README-en.md">English</a>
</p>

<p align="center">
  <b>Model Context Protocol (MCP) Server for Zotero SQLite Database</b>
</p>

<p align="center">
  <a href="https://www.zotero.org/"><img src="https://img.shields.io/badge/Zotero-7.0+-red" alt="Zotero"></a>
  <a href="https://nodejs.org/"><img src="https://img.shields.io/badge/Node.js-18+-green" alt="Node.js"></a>
  <a href="https://www.typescriptlang.org/"><img src="https://img.shields.io/badge/TypeScript-5.0+-blue" alt="TypeScript"></a>
  <a href="https://modelcontextprotocol.io/"><img src="https://img.shields.io/badge/MCP-1.0-purple" alt="MCP"></a>
  <a href="LICENSE"><img src="https://img.shields.io/badge/License-MIT-yellow" alt="License"></a>
</p>

---

## 📚 项目概述

ZoteroBridge 是一个基于 Model Context Protocol (MCP) 的服务器，它直接连接 Zotero 的 SQLite 数据库 (`zotero.sqlite`)，为 AI 助手（如 Claude、ChatGPT 等）提供与 Zotero 文献库交互的能力。

### ✨ 主要功能

- 🗂️ **目录管理** - 创建、重命名、移动、删除 Zotero 集合（文件夹）
- 🏷️ **标签管理** - 添加、删除、查询文献标签
- 📖 **文献操作** - 搜索文献、获取详情、管理集合关系
- 📝 **摘要管理** - 读取和设置文献摘要、添加笔记
- 📄 **PDF 处理** - 提取 PDF 全文、生成摘要、全文搜索

---

## 🚀 快速开始

### 系统要求

- Node.js 18.0 或更高版本
- Zotero 7.0 或更高版本
- 一个支持 MCP 的 AI 客户端（如 Claude Desktop、Cursor 等）

### 安装

```bash
# 克隆项目
git clone https://github.com/Combjellyshen/ZoteroBridge.git
cd ZoteroBridge

# 安装依赖
npm install

# 构建项目
npm run build
```

### 配置 AI 客户端

#### Claude Desktop

在 Claude Desktop 的配置文件中添加：

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

在项目根目录创建 `.cursor/mcp.json`:

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

#### 自定义数据库路径

如果你的 Zotero 数据库不在默认位置，可以指定路径：

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

### 目录/集合管理

| 工具 | 描述 |
|------|------|
| `list_collections` | 列出所有集合 |
| `get_collection` | 获取集合详情 |
| `create_collection` | 创建新集合 |
| `rename_collection` | 重命名集合 |
| `move_collection` | 移动集合到新父级 |
| `delete_collection` | 删除集合 |
| `get_subcollections` | 获取子集合 |

### 标签管理

| 工具 | 描述 |
|------|------|
| `list_tags` | 列出所有标签 |
| `create_tag` | 创建新标签 |
| `add_tag` | 为文献添加标签 |
| `remove_tag` | 移除文献标签 |
| `get_item_tags` | 获取文献的所有标签 |

### 文献操作

| 工具 | 描述 |
|------|------|
| `search_items` | 按标题搜索文献 |
| `get_item_details` | 获取文献详细信息 |
| `add_item_to_collection` | 将文献添加到集合 |
| `remove_item_from_collection` | 从集合中移除文献 |
| `get_collection_items` | 获取集合中的所有文献 |

### 摘要和笔记

| 工具 | 描述 |
|------|------|
| `get_item_abstract` | 获取文献摘要 |
| `set_item_abstract` | 设置文献摘要 |
| `get_item_notes` | 获取文献笔记 |
| `add_item_note` | 添加笔记到文献 |

### PDF 处理

| 工具 | 描述 |
|------|------|
| `extract_pdf_text` | 提取 PDF 全文 |
| `get_pdf_summary` | 获取 PDF 摘要信息 |
| `get_item_pdfs` | 获取文献的 PDF 附件 |
| `search_pdf` | 在 PDF 中搜索文本 |
| `generate_abstract_from_pdf` | 从 PDF 生成摘要 |

### 实用工具

| 工具 | 描述 |
|------|------|
| `get_database_info` | 获取数据库信息 |
| `raw_query` | 执行原始 SQL 查询（仅 SELECT） |

### 标识符搜索 (DOI/ISBN)

| 工具 | 描述 |
|------|------|
| `find_by_doi` | 通过 DOI 查找文献 |
| `find_by_isbn` | 通过 ISBN 查找文献 |
| `find_by_identifier` | 通过任意标识符（DOI, ISBN, PMID, arXiv）查找文献 |

### PDF 注释

| 工具 | 描述 |
|------|------|
| `get_item_annotations` | 获取文献的所有注释（高亮、批注等） |
| `get_attachment_annotations` | 获取特定附件的注释 |
| `get_annotations_by_type` | 按类型筛选注释（高亮、笔记等） |
| `get_annotations_by_color` | 按颜色筛选注释 |
| `search_annotations` | 在注释内容中搜索 |

### 全文搜索

| 工具 | 描述 |
|------|------|
| `search_fulltext` | 在全文索引中搜索 |
| `get_fulltext_content` | 获取附件的全文内容 |
| `search_fulltext_with_context` | 带上下文的全文搜索 |

### 相关文献推荐

| 工具 | 描述 |
|------|------|
| `get_related_items` | 获取手动关联的相关文献 |
| `find_similar_by_tags` | 根据共同标签查找相似文献 |
| `find_similar_by_creators` | 根据共同作者查找相似文献 |
| `find_similar_by_collection` | 在同一集合中查找相似文献 |

---

## 📖 使用示例

### 在 Claude 中使用

```
# 列出所有集合
请列出我 Zotero 中的所有集合

# 创建新集合
帮我创建一个名为"机器学习论文"的新集合

# 搜索文献
搜索标题包含"deep learning"的文献

# 获取 PDF 内容
提取这篇文献的 PDF 全文并生成摘要

# 添加标签
为这篇文献添加"重要"和"待读"标签
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

1. **关闭 Zotero**: 在使用写入功能时，建议关闭 Zotero 客户端以避免数据库锁定
2. **备份数据**: 修改数据库前建议备份 `zotero.sqlite`
3. **只读模式**: 如果只需要读取数据，使用 `--readonly` 参数更安全

---

## 📄 许可证

本项目采用 [MIT License](LICENSE) 许可证。

---

## 🙏 致谢

- [Zotero](https://www.zotero.org/) - 优秀的开源文献管理工具
- [Model Context Protocol](https://modelcontextprotocol.io/) - AI 工具集成协议
- [cookjohn/zotero-mcp](https://github.com/cookjohn/zotero-mcp) - 项目参考

---

## 📬 联系方式

- 作者: Combjellyshen
- GitHub: [https://github.com/Combjellyshen/ZoteroBridge](https://github.com/Combjellyshen/ZoteroBridge)

如有问题或建议，欢迎提交 Issue 或 Pull Request！
