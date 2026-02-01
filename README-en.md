# ZoteroBridge

<p align="right">
  <a href="README.md">🇨🇳 简体中文</a> | <b>🇬🇧 English</b>
</p>

<p align="center">
  <b>Model Context Protocol (MCP) Server for Zotero SQLite Database</b>
</p>

<p align="center">
  <a href="https://www.npmjs.com/package/zotero-bridge"><img src="https://img.shields.io/npm/v/zotero-bridge" alt="npm version"></a>
  <a href="https://www.zotero.org/"><img src="https://img.shields.io/badge/Zotero-7.0+-red" alt="Zotero"></a>
  <a href="https://nodejs.org/"><img src="https://img.shields.io/badge/Node.js-18+-green" alt="Node.js"></a>
  <a href="https://www.typescriptlang.org/"><img src="https://img.shields.io/badge/TypeScript-5.0+-blue" alt="TypeScript"></a>
  <a href="https://modelcontextprotocol.io/"><img src="https://img.shields.io/badge/MCP-1.0-purple" alt="MCP"></a>
  <a href="LICENSE"><img src="https://img.shields.io/badge/License-MIT-yellow" alt="License"></a>
</p>

---

## 📚 Overview

ZoteroBridge is a Model Context Protocol (MCP) server that connects directly to Zotero''s SQLite database (`zotero.sqlite`), enabling AI assistants (like Claude, ChatGPT, GitHub Copilot, etc.) to interact with your Zotero reference library.

### ✨ Key Features

- 🗂️ **Collection Management** - Create, rename, move, and delete Zotero collections (folders)
- 🏷️ **Tag Management** - Add, remove, and query tags for references
- 📖 **Item Operations** - Search items, get details, manage collection relationships
- 📝 **Content Management** - Read/set abstracts, add notes
- 📄 **PDF Processing** - Extract full text, generate summaries, full-text search, get annotations
- 🔍 **Identifier Search** - Find items by DOI, ISBN, PMID, arXiv, URL
- 🔗 **Related Items** - Find similar items by manual links, shared tags/creators
- 🛠️ **Library Maintenance** - Find duplicates, validate attachments, cleanup orphans, merge items

---

## � Changelog
### v1.1.4 (2026-02-01)

🔧 **Critical Fixes - Database Compatibility**
- ✅ Fixed duplicate query inconsistency - `findItemByDOI/ISBN` now always returns the most recently modified item
- ✅ Fixed `itemTags.type` field - this field is NOT NULL and must be provided
- ✅ Dynamic retrieval of `note`/`attachment` itemTypeID instead of hardcoding
- ✅ All queries now exclude items in the `deletedItems` table

🚀 **New Features**
- ✨ Added transaction support (`beginTransaction/commitTransaction/rollbackTransaction`)
- ✨ `mergeItems` now uses transactions to ensure data consistency
- ✨ `mergeItems` now includes attachment transfer functionality
- ✨ Duplicate queries now return `_duplicateWarning` information

🛡️ **Security Improvements**
- All write operations check Zotero process status first
- Automatic database backup before modifications
- Batch operations protected by transactions
### v1.1.3 (2026-02-01)

🔧 **Fixes**
- ✅ Fixed collection (folder) creation - added required `clientDateModified` field
- ✅ Fixed collection rename - properly updates `clientDateModified` timestamp
- ✅ Fixed collection move - ensures parent-child relationships are correctly established
- ✅ All collection operations now fully comply with Zotero's official database schema

Now working properly:
- Create new collections (top-level folders)
- Create subcollections (supports multi-level nesting)
- Rename collections
- Move collections to other parent collections
- Get subcollection lists

### v1.1.2

- Improved database connection stability
- Optimized error handling mechanisms

### v1.1.0

- Consolidated 42 tools into 13 action-based tools
- Simplified interface while maintaining all functionality

---

## �🚀 Quick Start

### Prerequisites

- Node.js 18.0 or higher
- Zotero 7.0 or higher
- An MCP-compatible AI client (e.g., Claude Desktop, Cursor, VS Code Copilot)

### Installation

#### Option 1: Install via npm (Recommended)

```bash
npm install -g zotero-bridge
```

#### Option 2: Build from Source

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
      "command": "npx",
      "args": ["-y", "zotero-bridge"],
      "env": {}
    }
  }
}
```

If building from source:

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
      "command": "npx",
      "args": ["-y", "zotero-bridge"]
    }
  }
}
```

#### VS Code Copilot

1. Open VS Code Settings (`Ctrl+,`)
2. Search for `github.copilot.chat.mcpServers`
3. Click "Edit in settings.json"
4. Add the following configuration:

```json
"github.copilot.chat.mcpServers": {
  "zotero-bridge": {
    "command": "npx",
    "args": ["-y", "zotero-bridge"]
  }
}
```

#### Custom Database Path

If your Zotero database is not in the default location:

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

## 🛠️ Available Tools (13 Consolidated Tools)

> Version 1.1.0+ consolidates the original 42 tools into 13 action-based tools, simplifying the interface while maintaining full functionality.

### manage_collection - Collection Management

All operations for managing Zotero collections (folders).

| Action | Description |
|--------|-------------|
| `list` | List all collections |
| `get` | Get collection details |
| `create` | Create a new collection |
| `rename` | Rename a collection |
| `move` | Move collection to new parent |
| `delete` | Delete a collection |
| `get_subcollections` | Get subcollections |
| `add_item` | Add item to collection |
| `remove_item` | Remove item from collection |
| `get_items` | Get all items in collection |

### manage_tags - Tag Management

All operations for managing tags.

| Action | Description |
|--------|-------------|
| `list` | List all tags |
| `get_item_tags` | Get all tags for an item |
| `add` | Add tag to an item |
| `remove` | Remove tag from an item |
| `create` | Create a new tag |

### search_items - Search Items

Search Zotero items by title.

### get_item_details - Get Item Details

Get detailed information about an item by ID or key.

### manage_item_content - Content Management

Manage item abstracts and notes.

| Action | Description |
|--------|-------------|
| `get_abstract` | Get item abstract |
| `set_abstract` | Set item abstract |
| `get_notes` | Get item notes |
| `add_note` | Add a note to item |

### manage_pdf - PDF Operations

Various operations for PDF files.

| Action | Description |
|--------|-------------|
| `extract_text` | Extract full text from PDF |
| `get_summary` | Get PDF summary information |
| `list` | Get PDF attachments for an item |
| `search` | Search text within PDF |
| `generate_abstract` | Generate abstract from PDF content |

### find_by_identifier - Identifier Search

Find items by various identifiers with auto-detection support.

| Type | Description |
|------|-------------|
| `doi` | Find by DOI |
| `isbn` | Find by ISBN |
| `pmid` | Find by PubMed ID |
| `arxiv` | Find by arXiv ID |
| `url` | Find by URL |
| `auto` | Auto-detect identifier type |

### get_annotations - Get Annotations

Get PDF annotations (highlights, notes, etc.) with optional filters by type, color, or search query.

### search_fulltext - Full-text Search

Search in Zotero''s full-text index or get full-text content of an attachment.

### find_related_items - Find Related Items

Find related items through multiple methods.

| Method | Description |
|--------|-------------|
| `manual` | Get manually linked items |
| `tags` | Find by shared tags |
| `creators` | Find by shared authors |
| `collection` | Find in same collection |
| `all` | Use all methods |

### get_database_info - Database Info

Get Zotero database information (path, storage, statistics).

### raw_query - Raw SQL Query

Execute raw SQL queries (SELECT only, read-only).

### library_maintenance - Library Maintenance 🆕

Tools for maintaining and cleaning up your Zotero library.

| Action | Description |
|--------|-------------|
| `find_duplicates` | Find duplicate items (by title, DOI, or ISBN) |
| `validate_attachments` | Validate if attachment files exist |
| `get_valid_attachment` | Get valid attachment for an item |
| `find_with_valid_pdf` | Find items with valid PDFs |
| `cleanup_orphans` | Cleanup orphan attachment records (supports dry-run) |
| `merge_items` | Merge duplicate items |

---

## 📖 Usage Examples

### Using with Claude/Copilot

```
# Search items
Search for items with "deep learning" in the title

# Get details
Get detailed information for item ID 1234

# Manage collections
Create a new collection called "Machine Learning Papers"
Add item 1234 to collection 5678

# PDF operations
Extract full text from attachment ID 100
Search for "neural network" in this PDF

# Find by DOI
Find the item with DOI 10.1126/science.aaa2397

# Get annotations
Get all highlight annotations for item 1234

# Library maintenance
Find duplicate items in my library
Check if attachments for item 1234 are valid
```

---

## 🏗️ Project Structure

```
ZoteroBridge/
├── src/
│   ├── index.ts      # MCP server entry point
│   ├── database.ts   # Zotero SQLite database operations
│   ├── pdf.ts        # PDF processing module
│   └── tools.ts      # MCP tool definitions (13 consolidated tools)
├── dist/             # Compiled output
├── test/             # Test files
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
zotero-bridge --help

# Specify database path
zotero-bridge --db /path/to/zotero.sqlite

# Read-only mode
zotero-bridge --readonly
```

---

## ⚠️ Important Notes

1. **Close Zotero**: When using write features, close the Zotero client to avoid database locking
2. **Backup Data**: Backup `zotero.sqlite` before making modifications
3. **Read-only Mode**: Use `--readonly` flag when only reading data for safety
4. **Attachment Validation**: Use `library_maintenance` with `validate_attachments` to check if files exist

---

## 📝 Changelog
### v1.1.5 (2026-02-01)

🗑️ **Trash Recognition**
- ✅ All query functions now correctly exclude items in `deletedItems` table
- ✅ `getItemDetails` now includes `isDeleted` and `dateDeleted` fields
- ✅ `findItemByDOI/ISBN/Identifier` automatically skips trashed items
- ✅ Added `isItemDeleted()` method to check if item is in trash
- ✅ Added `getDeletedItems()` method to get trash contents
- ✅ Added `getDeletedItemsCount()` method to get trash item count
- ✅ Attachment queries also exclude deleted attachments
### v1.1.2 (2025-02-01)
- Updated all dependencies to latest versions
- Fixed Zod 4.x compatibility issues
- Fixed pdf-parse 2.x ESM import issues

### v1.1.1 (2025-02-01)
- Consolidated 42 tools into 13 action-based tools
- Added `library_maintenance` tool (duplicate detection, attachment validation, orphan cleanup, item merging)

### v1.1.0
- Initial consolidated version

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
- npm: [https://www.npmjs.com/package/zotero-bridge](https://www.npmjs.com/package/zotero-bridge)

Feel free to submit Issues or Pull Requests!
