/**
 * ZoteroBridge - MCP Tool Definitions
 * 
 * Defines all available MCP tools for Zotero operations
 * 
 * @author Combjellyshen
 */

import { z } from 'zod';

// ============================================
// Collection/Directory Tools
// ============================================

export const listCollectionsSchema = z.object({
  libraryID: z.number().optional().default(1).describe('Library ID (default: 1 for personal library)')
});

export const getCollectionSchema = z.object({
  collectionID: z.number().optional().describe('Collection ID'),
  name: z.string().optional().describe('Collection name'),
  libraryID: z.number().optional().default(1).describe('Library ID')
});

export const createCollectionSchema = z.object({
  name: z.string().describe('Name of the new collection'),
  parentCollectionID: z.number().optional().describe('Parent collection ID (null for root)'),
  libraryID: z.number().optional().default(1).describe('Library ID')
});

export const renameCollectionSchema = z.object({
  collectionID: z.number().describe('Collection ID to rename'),
  newName: z.string().describe('New name for the collection')
});

export const moveCollectionSchema = z.object({
  collectionID: z.number().describe('Collection ID to move'),
  newParentID: z.number().nullable().describe('New parent collection ID (null for root)')
});

export const deleteCollectionSchema = z.object({
  collectionID: z.number().describe('Collection ID to delete')
});

export const getSubcollectionsSchema = z.object({
  parentCollectionID: z.number().describe('Parent collection ID')
});

// ============================================
// Tag Tools
// ============================================

export const listTagsSchema = z.object({});

export const addTagSchema = z.object({
  itemID: z.number().describe('Item ID to add tag to'),
  tagName: z.string().describe('Tag name to add'),
  type: z.number().optional().default(0).describe('Tag type (0=user, 1=automatic)')
});

export const removeTagSchema = z.object({
  itemID: z.number().describe('Item ID to remove tag from'),
  tagName: z.string().describe('Tag name to remove')
});

export const getItemTagsSchema = z.object({
  itemID: z.number().describe('Item ID to get tags for')
});

export const createTagSchema = z.object({
  name: z.string().describe('Tag name to create'),
  type: z.number().optional().default(0).describe('Tag type')
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

export const addItemToCollectionSchema = z.object({
  itemID: z.number().describe('Item ID to add'),
  collectionID: z.number().describe('Collection ID to add item to')
});

export const removeItemFromCollectionSchema = z.object({
  itemID: z.number().describe('Item ID to remove'),
  collectionID: z.number().describe('Collection ID to remove item from')
});

export const getCollectionItemsSchema = z.object({
  collectionID: z.number().describe('Collection ID to get items from')
});

// ============================================
// Abstract/Note Tools
// ============================================

export const getItemAbstractSchema = z.object({
  itemID: z.number().describe('Item ID to get abstract for')
});

export const setItemAbstractSchema = z.object({
  itemID: z.number().describe('Item ID to set abstract for'),
  abstract: z.string().describe('Abstract text')
});

export const getItemNotesSchema = z.object({
  itemID: z.number().describe('Item ID to get notes for')
});

export const addItemNoteSchema = z.object({
  itemID: z.number().describe('Parent item ID'),
  content: z.string().describe('Note content (can include HTML)'),
  title: z.string().optional().default('').describe('Note title')
});

// ============================================
// PDF Tools
// ============================================

export const extractPDFTextSchema = z.object({
  attachmentItemID: z.number().describe('Attachment item ID of the PDF')
});

export const getPDFSummarySchema = z.object({
  attachmentItemID: z.number().describe('Attachment item ID of the PDF')
});

export const getItemPDFsSchema = z.object({
  parentItemID: z.number().describe('Parent item ID to get PDFs from')
});

export const searchPDFSchema = z.object({
  attachmentItemID: z.number().describe('Attachment item ID of the PDF'),
  query: z.string().describe('Search query'),
  caseSensitive: z.boolean().optional().default(false).describe('Case sensitive search')
});

export const generateAbstractFromPDFSchema = z.object({
  attachmentItemID: z.number().describe('Attachment item ID of the PDF'),
  maxLength: z.number().optional().default(1000).describe('Maximum length of generated abstract'),
  saveToItem: z.boolean().optional().default(false).describe('Save generated abstract to parent item')
});

// ============================================
// Identifier Tools (DOI/ISBN)
// ============================================

export const findByDOISchema = z.object({
  doi: z.string().describe('DOI to search for (with or without doi.org prefix)')
});

export const findByISBNSchema = z.object({
  isbn: z.string().describe('ISBN to search for (with or without hyphens)')
});

export const findByIdentifierSchema = z.object({
  identifier: z.string().describe('Identifier value (DOI, ISBN, PMID, etc.)'),
  type: z.string().optional().describe('Identifier type: doi, isbn, pmid, arxiv, url')
});

// ============================================
// Annotation Tools
// ============================================

export const getItemAnnotationsSchema = z.object({
  itemID: z.number().describe('Parent item ID to get annotations from')
});

export const getAttachmentAnnotationsSchema = z.object({
  attachmentID: z.number().describe('Attachment item ID to get annotations from')
});

export const getAnnotationsByTypeSchema = z.object({
  itemID: z.number().describe('Parent item ID'),
  types: z.array(z.string()).describe('Annotation types: highlight, note, image, ink, underline')
});

export const getAnnotationsByColorSchema = z.object({
  itemID: z.number().describe('Parent item ID'),
  colors: z.array(z.string()).describe('Annotation colors (hex codes like #ffff00)')
});

export const searchAnnotationsSchema = z.object({
  query: z.string().describe('Search query for annotation text/comments'),
  itemID: z.number().optional().describe('Limit search to specific item')
});

// ============================================
// Fulltext Search Tools
// ============================================

export const searchFulltextSchema = z.object({
  query: z.string().describe('Search query for fulltext content'),
  libraryID: z.number().optional().default(1).describe('Library ID')
});

export const getFulltextContentSchema = z.object({
  attachmentID: z.number().describe('Attachment item ID to get fulltext from')
});

export const searchFulltextWithContextSchema = z.object({
  query: z.string().describe('Search query'),
  contextLength: z.number().optional().default(100).describe('Characters of context around matches'),
  libraryID: z.number().optional().default(1).describe('Library ID')
});

// ============================================
// Similar Items Tools
// ============================================

export const getRelatedItemsSchema = z.object({
  itemID: z.number().describe('Item ID to get related items for')
});

export const findSimilarByTagsSchema = z.object({
  itemID: z.number().describe('Item ID to find similar items for'),
  minSharedTags: z.number().optional().default(2).describe('Minimum number of shared tags')
});

export const findSimilarByCreatorsSchema = z.object({
  itemID: z.number().describe('Item ID to find similar items for')
});

export const findSimilarByCollectionSchema = z.object({
  itemID: z.number().describe('Item ID to find similar items for')
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
// Tool Definitions
// ============================================

export const toolDefinitions = [
  // Collection Tools
  {
    name: 'list_collections',
    description: 'List all collections (folders) in the Zotero library',
    inputSchema: listCollectionsSchema
  },
  {
    name: 'get_collection',
    description: 'Get a collection by ID or name',
    inputSchema: getCollectionSchema
  },
  {
    name: 'create_collection',
    description: 'Create a new collection (folder)',
    inputSchema: createCollectionSchema
  },
  {
    name: 'rename_collection',
    description: 'Rename an existing collection',
    inputSchema: renameCollectionSchema
  },
  {
    name: 'move_collection',
    description: 'Move a collection to a new parent (or root)',
    inputSchema: moveCollectionSchema
  },
  {
    name: 'delete_collection',
    description: 'Delete a collection',
    inputSchema: deleteCollectionSchema
  },
  {
    name: 'get_subcollections',
    description: 'Get all subcollections of a collection',
    inputSchema: getSubcollectionsSchema
  },

  // Tag Tools
  {
    name: 'list_tags',
    description: 'List all tags in the library',
    inputSchema: listTagsSchema
  },
  {
    name: 'add_tag',
    description: 'Add a tag to an item',
    inputSchema: addTagSchema
  },
  {
    name: 'remove_tag',
    description: 'Remove a tag from an item',
    inputSchema: removeTagSchema
  },
  {
    name: 'get_item_tags',
    description: 'Get all tags for an item',
    inputSchema: getItemTagsSchema
  },
  {
    name: 'create_tag',
    description: 'Create a new tag',
    inputSchema: createTagSchema
  },

  // Item Tools
  {
    name: 'search_items',
    description: 'Search items by title',
    inputSchema: searchItemsSchema
  },
  {
    name: 'get_item_details',
    description: 'Get detailed information about an item',
    inputSchema: getItemDetailsSchema
  },
  {
    name: 'add_item_to_collection',
    description: 'Add an item to a collection',
    inputSchema: addItemToCollectionSchema
  },
  {
    name: 'remove_item_from_collection',
    description: 'Remove an item from a collection',
    inputSchema: removeItemFromCollectionSchema
  },
  {
    name: 'get_collection_items',
    description: 'Get all items in a collection',
    inputSchema: getCollectionItemsSchema
  },

  // Abstract/Note Tools
  {
    name: 'get_item_abstract',
    description: 'Get the abstract of an item',
    inputSchema: getItemAbstractSchema
  },
  {
    name: 'set_item_abstract',
    description: 'Set or update the abstract of an item',
    inputSchema: setItemAbstractSchema
  },
  {
    name: 'get_item_notes',
    description: 'Get all notes attached to an item',
    inputSchema: getItemNotesSchema
  },
  {
    name: 'add_item_note',
    description: 'Add a note to an item',
    inputSchema: addItemNoteSchema
  },

  // PDF Tools
  {
    name: 'extract_pdf_text',
    description: 'Extract full text from a PDF attachment',
    inputSchema: extractPDFTextSchema
  },
  {
    name: 'get_pdf_summary',
    description: 'Get summary information about a PDF',
    inputSchema: getPDFSummarySchema
  },
  {
    name: 'get_item_pdfs',
    description: 'Get all PDF attachments for an item',
    inputSchema: getItemPDFsSchema
  },
  {
    name: 'search_pdf',
    description: 'Search within a PDF for specific text',
    inputSchema: searchPDFSchema
  },
  {
    name: 'generate_abstract_from_pdf',
    description: 'Extract and generate an abstract from PDF content',
    inputSchema: generateAbstractFromPDFSchema
  },

  // Identifier Tools
  {
    name: 'find_by_doi',
    description: 'Find an item by its DOI',
    inputSchema: findByDOISchema
  },
  {
    name: 'find_by_isbn',
    description: 'Find an item by its ISBN',
    inputSchema: findByISBNSchema
  },
  {
    name: 'find_by_identifier',
    description: 'Find an item by any identifier (DOI, ISBN, PMID, arXiv, URL)',
    inputSchema: findByIdentifierSchema
  },

  // Annotation Tools
  {
    name: 'get_item_annotations',
    description: 'Get all annotations (highlights, notes, etc.) from an item\'s PDF attachments',
    inputSchema: getItemAnnotationsSchema
  },
  {
    name: 'get_attachment_annotations',
    description: 'Get annotations from a specific PDF attachment',
    inputSchema: getAttachmentAnnotationsSchema
  },
  {
    name: 'get_annotations_by_type',
    description: 'Get annotations filtered by type (highlight, note, image, ink, underline)',
    inputSchema: getAnnotationsByTypeSchema
  },
  {
    name: 'get_annotations_by_color',
    description: 'Get annotations filtered by color',
    inputSchema: getAnnotationsByColorSchema
  },
  {
    name: 'search_annotations',
    description: 'Search annotations by text content',
    inputSchema: searchAnnotationsSchema
  },

  // Fulltext Search Tools
  {
    name: 'search_fulltext',
    description: 'Search in Zotero\'s fulltext index (searches indexed PDF content)',
    inputSchema: searchFulltextSchema
  },
  {
    name: 'get_fulltext_content',
    description: 'Get the indexed fulltext content of an attachment',
    inputSchema: getFulltextContentSchema
  },
  {
    name: 'search_fulltext_with_context',
    description: 'Search fulltext and return matching context snippets',
    inputSchema: searchFulltextWithContextSchema
  },

  // Similar Items Tools
  {
    name: 'get_related_items',
    description: 'Get manually linked related items',
    inputSchema: getRelatedItemsSchema
  },
  {
    name: 'find_similar_by_tags',
    description: 'Find items with similar tags',
    inputSchema: findSimilarByTagsSchema
  },
  {
    name: 'find_similar_by_creators',
    description: 'Find items by the same authors/creators',
    inputSchema: findSimilarByCreatorsSchema
  },
  {
    name: 'find_similar_by_collection',
    description: 'Find items in the same collections',
    inputSchema: findSimilarByCollectionSchema
  },

  // Utility Tools
  {
    name: 'get_database_info',
    description: 'Get information about the Zotero database',
    inputSchema: getDatabaseInfoSchema
  },
  {
    name: 'raw_query',
    description: 'Execute a raw SQL SELECT query (read-only)',
    inputSchema: rawQuerySchema
  }
];
