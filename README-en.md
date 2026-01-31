# ZoteroBridge

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
