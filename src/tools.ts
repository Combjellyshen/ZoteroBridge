/**
 * ZoteroBridge - MCP Tool Definitions (Consolidated)
 * 
 * Defines all available MCP tools for Zotero operations
 * Tools are consolidated to reduce total count while maintaining functionality
 * 
 * @author Combjellyshen
 */

import { z } from 'zod';

// ============================================
// Collection Tools (Consolidated)
// ============================================

export const manageCollectionSchema = z.object({
  action: z.enum(['list', 'get', 'create', 'rename', 'move', 'delete', 'get_subcollections', 'add_item', 'remove_item', 'get_items'])
    .describe('Action to perform: list, get, create, rename, move, delete, get_subcollections, add_item, remove_item, get_items'),
  collectionID: z.number().optional().describe('Collection ID (for get/rename/move/delete/get_subcollections/add_item/remove_item/get_items)'),
  name: z.string().optional().describe('Collection name (for get by name or create)'),
  newName: z.string().optional().describe('New name (for rename)'),
  parentCollectionID: z.number().nullable().optional().describe('Parent collection ID (for create/move, null for root)'),
  itemID: z.number().optional().describe('Item ID (for add_item/remove_item)'),
  libraryID: z.number().optional().default(1).describe('Library ID')
});

// ============================================
// Tag Tools (Consolidated)
// ============================================

export const manageTagsSchema = z.object({
  action: z.enum(['list', 'get_item_tags', 'add', 'remove', 'create'])
    .describe('Action: list (all tags), get_item_tags, add (to item), remove (from item), create'),
  itemID: z.number().optional().describe('Item ID (for get_item_tags/add/remove)'),
  tagName: z.string().optional().describe('Tag name (for add/remove/create)'),
  type: z.number().optional().default(0).describe('Tag type (0=user, 1=automatic)')
});

// ============================================
// Item Tools
// ============================================

export const searchItemsSchema = z.object({
  query: z.string().describe('Search query for item titles'),
  limit: z.number().optional().default(50).describe('Maximum number of results'),
  libraryID: z.number().optional().default(1).describe('Library ID')
});

export const getItemDetailsSchema = z.object({
  itemID: z.number().optional().describe('Item ID'),
  itemKey: z.string().optional().describe('Item key')
});

// ============================================
// Abstract/Note Tools (Consolidated)
// ============================================

export const manageItemContentSchema = z.object({
  action: z.enum(['get_abstract', 'set_abstract', 'get_notes', 'add_note'])
    .describe('Action: get_abstract, set_abstract, get_notes, add_note'),
  itemID: z.number().describe('Item ID'),
  abstract: z.string().optional().describe('Abstract text (for set_abstract)'),
  noteContent: z.string().optional().describe('Note content in HTML (for add_note)'),
  noteTitle: z.string().optional().default('').describe('Note title (for add_note)')
});

// ============================================
// PDF Tools (Consolidated)
// ============================================

export const managePDFSchema = z.object({
  action: z.enum(['extract_text', 'get_summary', 'list', 'search', 'generate_abstract'])
    .describe('Action: extract_text, get_summary, list (PDFs for item), search, generate_abstract'),
  attachmentItemID: z.number().optional().describe('Attachment item ID (for extract_text/get_summary/search/generate_abstract)'),
  parentItemID: z.number().optional().describe('Parent item ID (for list)'),
  query: z.string().optional().describe('Search query (for search)'),
  caseSensitive: z.boolean().optional().default(false).describe('Case sensitive search'),
  maxLength: z.number().optional().default(1000).describe('Max abstract length (for generate_abstract)'),
  saveToItem: z.boolean().optional().default(false).describe('Save abstract to parent item')
});

// ============================================
// Identifier Tools (Consolidated - single tool)
// ============================================

export const findByIdentifierSchema = z.object({
  identifier: z.string().describe('Identifier value (DOI, ISBN, PMID, arXiv ID, or URL)'),
  type: z.enum(['doi', 'isbn', 'pmid', 'arxiv', 'url', 'auto']).optional().default('auto')
    .describe('Identifier type. Use "auto" to detect automatically')
});

// ============================================
// Annotation Tools (Consolidated)
// ============================================

export const getAnnotationsSchema = z.object({
  itemID: z.number().optional().describe('Parent item ID to get annotations from'),
  attachmentID: z.number().optional().describe('Specific attachment ID'),
  types: z.array(z.string()).optional().describe('Filter by types: highlight, note, image, ink, underline'),
  colors: z.array(z.string()).optional().describe('Filter by colors (hex codes like #ffff00)'),
  searchQuery: z.string().optional().describe('Search in annotation text/comments')
});

// ============================================
// Fulltext Search Tools (Consolidated)
// ============================================

export const searchFulltextSchema = z.object({
  query: z.string().optional().describe('Search query for fulltext content'),
  attachmentID: z.number().optional().describe('Get fulltext for specific attachment (if no query)'),
  contextLength: z.number().optional().default(100).describe('Characters of context around matches'),
  libraryID: z.number().optional().default(1).describe('Library ID')
});

// ============================================
// Similar/Related Items Tools (Consolidated)
// ============================================

export const findRelatedItemsSchema = z.object({
  itemID: z.number().describe('Item ID to find related items for'),
  method: z.enum(['manual', 'tags', 'creators', 'collection', 'all']).optional().default('all')
    .describe('Method: manual (linked), tags, creators, collection, or all'),
  minSharedTags: z.number().optional().default(2).describe('Min shared tags (for tags method)')
});

// ============================================
// Utility Tools
// ============================================

export const getDatabaseInfoSchema = z.object({});

export const rawQuerySchema = z.object({
  sql: z.string().describe('SQL query to execute (SELECT only)'),
  params: z.array(z.any()).optional().default([]).describe('Query parameters')
});

// ============================================
// Library Maintenance Tools (Consolidated)
// ============================================

export const libraryMaintenanceSchema = z.object({
  action: z.enum(['find_duplicates', 'validate_attachments', 'get_valid_attachment', 'find_with_valid_pdf', 'cleanup_orphans', 'merge_items'])
    .describe('Action: find_duplicates, validate_attachments, get_valid_attachment, find_with_valid_pdf, cleanup_orphans, merge_items'),
  // For find_duplicates
  duplicateField: z.enum(['title', 'doi', 'isbn']).optional().default('title').describe('Field to check for duplicates'),
  // For validate_attachments
  itemID: z.number().optional().describe('Item ID to check attachments for'),
  checkAll: z.boolean().optional().default(false).describe('Check all attachments in library'),
  // For get_valid_attachment / find_with_valid_pdf
  parentItemID: z.number().optional().describe('Parent item ID'),
  contentType: z.string().optional().default('application/pdf').describe('Content type filter'),
  title: z.string().optional().describe('Search by title'),
  doi: z.string().optional().describe('Search by DOI'),
  requireValidPDF: z.boolean().optional().default(true).describe('Only return items with valid PDFs'),
  // For cleanup_orphans
  dryRun: z.boolean().optional().default(true).describe('Only report, do not delete'),
  // For merge_items
  targetItemID: z.number().optional().describe('Target item to keep'),
  sourceItemIDs: z.array(z.number()).optional().describe('Source items to merge from'),
  libraryID: z.number().optional().default(1).describe('Library ID')
});

// ============================================
// Tool Definitions (Consolidated: 42 → 12 tools)
// ============================================

export const toolDefinitions = [
  // Collection Management (7 → 1)
  {
    name: 'manage_collection',
    description: 'Manage Zotero collections: list, get, create, rename, move, delete, get_subcollections, add/remove items, get collection items',
    inputSchema: manageCollectionSchema
  },

  // Tag Management (5 → 1)
  {
    name: 'manage_tags',
    description: 'Manage tags: list all, get item tags, add/remove tags from items, create new tags',
    inputSchema: manageTagsSchema
  },

  // Item Search & Details (kept separate as core functionality)
  {
    name: 'search_items',
    description: 'Search items by title',
    inputSchema: searchItemsSchema
  },
  {
    name: 'get_item_details',
    description: 'Get detailed information about an item by ID or key',
    inputSchema: getItemDetailsSchema
  },

  // Abstract & Notes (4 → 1)
  {
    name: 'manage_item_content',
    description: 'Manage item content: get/set abstract, get/add notes',
    inputSchema: manageItemContentSchema
  },

  // PDF Operations (5 → 1)
  {
    name: 'manage_pdf',
    description: 'PDF operations: extract text, get summary, list PDFs, search within PDF, generate abstract',
    inputSchema: managePDFSchema
  },

  // Identifier Lookup (3 → 1)
  {
    name: 'find_by_identifier',
    description: 'Find item by identifier (DOI, ISBN, PMID, arXiv, URL) with auto-detection',
    inputSchema: findByIdentifierSchema
  },

  // Annotations (5 → 1)
  {
    name: 'get_annotations',
    description: 'Get annotations from PDFs with optional filters by type, color, or search query',
    inputSchema: getAnnotationsSchema
  },

  // Fulltext Search (3 → 1)
  {
    name: 'search_fulltext',
    description: 'Search Zotero fulltext index or get fulltext content of an attachment',
    inputSchema: searchFulltextSchema
  },

  // Related Items (4 → 1)
  {
    name: 'find_related_items',
    description: 'Find related items by manual links, shared tags, creators, or collection',
    inputSchema: findRelatedItemsSchema
  },

  // Utilities
  {
    name: 'get_database_info',
    description: 'Get Zotero database information (path, storage, counts)',
    inputSchema: getDatabaseInfoSchema
  },
  {
    name: 'raw_query',
    description: 'Execute raw SQL SELECT query (read-only)',
    inputSchema: rawQuerySchema
  },

  // Library Maintenance (6 → 1)
  {
    name: 'library_maintenance',
    description: 'Library maintenance: find duplicates, validate attachments, get valid attachment, find items with valid PDF, cleanup orphans, merge items',
    inputSchema: libraryMaintenanceSchema
  }
];
