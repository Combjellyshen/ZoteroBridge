#!/usr/bin/env node

/**
 * ZoteroBridge - MCP Server for Zotero SQLite Database
 * 
 * A Model Context Protocol server that provides direct access to Zotero's
 * SQLite database for collection management, tagging, PDF reading, and more.
 * 
 * @author Combjellyshen
 * @version 1.0.0
 */

import { Server } from '@modelcontextprotocol/sdk/server/index.js';
import { StdioServerTransport } from '@modelcontextprotocol/sdk/server/stdio.js';
import {
  CallToolRequestSchema,
  ListToolsRequestSchema,
} from '@modelcontextprotocol/sdk/types.js';
import { z } from 'zod';

import { ZoteroDatabase } from './database.js';
import { PDFProcessor } from './pdf.js';
import {
  toolDefinitions,
  listCollectionsSchema,
  getCollectionSchema,
  createCollectionSchema,
  renameCollectionSchema,
  moveCollectionSchema,
  deleteCollectionSchema,
  getSubcollectionsSchema,
  listTagsSchema,
  addTagSchema,
  removeTagSchema,
  getItemTagsSchema,
  createTagSchema,
  searchItemsSchema,
  getItemDetailsSchema,
  addItemToCollectionSchema,
  removeItemFromCollectionSchema,
  getCollectionItemsSchema,
  getItemAbstractSchema,
  setItemAbstractSchema,
  getItemNotesSchema,
  addItemNoteSchema,
  extractPDFTextSchema,
  getPDFSummarySchema,
  getItemPDFsSchema,
  searchPDFSchema,
  generateAbstractFromPDFSchema,
  getDatabaseInfoSchema,
  rawQuerySchema,
  // New schemas
  findByDOISchema,
  findByISBNSchema,
  findByIdentifierSchema,
  getItemAnnotationsSchema,
  getAttachmentAnnotationsSchema,
  getAnnotationsByTypeSchema,
  getAnnotationsByColorSchema,
  searchAnnotationsSchema,
  searchFulltextSchema,
  getFulltextContentSchema,
  searchFulltextWithContextSchema,
  getRelatedItemsSchema,
  findSimilarByTagsSchema,
  findSimilarByCreatorsSchema,
  findSimilarByCollectionSchema
} from './tools.js';

// Server configuration
const SERVER_NAME = 'zotero-bridge';
const SERVER_VERSION = '1.0.0';

// Parse command line arguments
function parseArgs(): { dbPath?: string; readonly: boolean } {
  const args = process.argv.slice(2);
  let dbPath: string | undefined;
  let readonly = false;

  for (let i = 0; i < args.length; i++) {
    if (args[i] === '--db' || args[i] === '-d') {
      dbPath = args[i + 1];
      i++;
    } else if (args[i] === '--readonly' || args[i] === '-r') {
      readonly = true;
    } else if (args[i] === '--help' || args[i] === '-h') {
      console.log(`
ZoteroBridge - MCP Server for Zotero SQLite Database

Usage: zotero-bridge [options]

Options:
  -d, --db <path>     Path to zotero.sqlite database
  -r, --readonly      Open database in read-only mode
  -h, --help          Show this help message

Example:
  zotero-bridge --db ~/Zotero/zotero.sqlite
  zotero-bridge --readonly
      `);
      process.exit(0);
    }
  }

  return { dbPath, readonly };
}

// Initialize the server
async function main() {
  const { dbPath, readonly } = parseArgs();

  // Initialize database
  const db = new ZoteroDatabase(dbPath, readonly);
  const pdf = new PDFProcessor(db);

  // Create MCP server
  const server = new Server(
    {
      name: SERVER_NAME,
      version: SERVER_VERSION,
    },
    {
      capabilities: {
        tools: {},
      },
    }
  );

  // Handle tool listing
  server.setRequestHandler(ListToolsRequestSchema, async () => {
    return {
      tools: toolDefinitions.map(tool => ({
        name: tool.name,
        description: tool.description,
        inputSchema: {
          type: 'object' as const,
          properties: Object.fromEntries(
            Object.entries(tool.inputSchema.shape || {}).map(([key, value]) => {
              const zodType = value as z.ZodTypeAny;
              return [key, {
                type: getZodType(zodType),
                description: zodType.description || ''
              }];
            })
          ),
          required: Object.entries(tool.inputSchema.shape || {})
            .filter(([_, value]) => !(value as z.ZodTypeAny).isOptional())
            .map(([key]) => key)
        }
      }))
    };
  });

  // Handle tool calls
  server.setRequestHandler(CallToolRequestSchema, async (request) => {
    const { name, arguments: args } = request.params;

    try {
      let result: any;

      switch (name) {
        // ============================================
        // Collection Tools
        // ============================================
        case 'list_collections': {
          const params = listCollectionsSchema.parse(args);
          result = db.getCollections(params.libraryID);
          break;
        }

        case 'get_collection': {
          const params = getCollectionSchema.parse(args);
          if (params.collectionID) {
            result = db.getCollectionById(params.collectionID);
          } else if (params.name) {
            result = db.getCollectionByName(params.name, params.libraryID);
          } else {
            throw new Error('Either collectionID or name is required');
          }
          break;
        }

        case 'create_collection': {
          const params = createCollectionSchema.parse(args);
          const collectionID = db.createCollection(
            params.name,
            params.parentCollectionID || null,
            params.libraryID
          );
          result = { success: true, collectionID };
          break;
        }

        case 'rename_collection': {
          const params = renameCollectionSchema.parse(args);
          const success = db.renameCollection(params.collectionID, params.newName);
          result = { success };
          break;
        }

        case 'move_collection': {
          const params = moveCollectionSchema.parse(args);
          const success = db.moveCollection(params.collectionID, params.newParentID);
          result = { success };
          break;
        }

        case 'delete_collection': {
          const params = deleteCollectionSchema.parse(args);
          const success = db.deleteCollection(params.collectionID);
          result = { success };
          break;
        }

        case 'get_subcollections': {
          const params = getSubcollectionsSchema.parse(args);
          result = db.getSubcollections(params.parentCollectionID);
          break;
        }

        // ============================================
        // Tag Tools
        // ============================================
        case 'list_tags': {
          listTagsSchema.parse(args);
          result = db.getTags();
          break;
        }

        case 'add_tag': {
          const params = addTagSchema.parse(args);
          const success = db.addTagToItem(params.itemID, params.tagName, params.type);
          result = { success };
          break;
        }

        case 'remove_tag': {
          const params = removeTagSchema.parse(args);
          const success = db.removeTagFromItem(params.itemID, params.tagName);
          result = { success };
          break;
        }

        case 'get_item_tags': {
          const params = getItemTagsSchema.parse(args);
          result = db.getItemTags(params.itemID);
          break;
        }

        case 'create_tag': {
          const params = createTagSchema.parse(args);
          const tagID = db.createTag(params.name, params.type);
          result = { success: true, tagID };
          break;
        }

        // ============================================
        // Item Tools
        // ============================================
        case 'search_items': {
          const params = searchItemsSchema.parse(args);
          result = db.searchItems(params.query, params.limit, params.libraryID);
          break;
        }

        case 'get_item_details': {
          const params = getItemDetailsSchema.parse(args);
          if (params.itemID) {
            result = db.getItemDetails(params.itemID);
          } else if (params.itemKey) {
            const item = db.getItemByKey(params.itemKey);
            if (item) {
              result = db.getItemDetails(item.itemID);
            } else {
              result = null;
            }
          } else {
            throw new Error('Either itemID or itemKey is required');
          }
          break;
        }

        case 'add_item_to_collection': {
          const params = addItemToCollectionSchema.parse(args);
          const success = db.addItemToCollection(params.itemID, params.collectionID);
          result = { success };
          break;
        }

        case 'remove_item_from_collection': {
          const params = removeItemFromCollectionSchema.parse(args);
          const success = db.removeItemFromCollection(params.itemID, params.collectionID);
          result = { success };
          break;
        }

        case 'get_collection_items': {
          const params = getCollectionItemsSchema.parse(args);
          result = db.getCollectionItems(params.collectionID);
          break;
        }

        // ============================================
        // Abstract/Note Tools
        // ============================================
        case 'get_item_abstract': {
          const params = getItemAbstractSchema.parse(args);
          result = { abstract: db.getItemAbstract(params.itemID) };
          break;
        }

        case 'set_item_abstract': {
          const params = setItemAbstractSchema.parse(args);
          const success = db.setItemAbstract(params.itemID, params.abstract);
          result = { success };
          break;
        }

        case 'get_item_notes': {
          const params = getItemNotesSchema.parse(args);
          result = db.getItemNotes(params.itemID);
          break;
        }

        case 'add_item_note': {
          const params = addItemNoteSchema.parse(args);
          const noteID = db.addItemNote(params.itemID, params.content, params.title);
          result = { success: true, noteID };
          break;
        }

        // ============================================
        // PDF Tools
        // ============================================
        case 'extract_pdf_text': {
          const params = extractPDFTextSchema.parse(args);
          result = await pdf.extractTextFromAttachment(params.attachmentItemID);
          break;
        }

        case 'get_pdf_summary': {
          const params = getPDFSummarySchema.parse(args);
          result = await pdf.getPDFSummary(params.attachmentItemID);
          break;
        }

        case 'get_item_pdfs': {
          const params = getItemPDFsSchema.parse(args);
          const attachments = db.getPDFAttachments(params.parentItemID);
          result = attachments.map(att => ({
            ...att,
            fullPath: db.getAttachmentPath(att.itemID)
          }));
          break;
        }

        case 'search_pdf': {
          const params = searchPDFSchema.parse(args);
          const content = await pdf.extractTextFromAttachment(params.attachmentItemID);
          if (content) {
            result = pdf.searchInPDF(content, params.query, params.caseSensitive);
          } else {
            result = [];
          }
          break;
        }

        case 'generate_abstract_from_pdf': {
          const params = generateAbstractFromPDFSchema.parse(args);
          const content = await pdf.extractTextFromAttachment(params.attachmentItemID);
          
          if (!content) {
            throw new Error('Could not extract PDF content');
          }
          
          const abstract = pdf.generateSimpleSummary(content, params.maxLength);
          
          if (params.saveToItem) {
            // Get parent item ID from attachment
            const attDetails = db.query(
              'SELECT parentItemID FROM itemAttachments WHERE itemID = ?',
              [params.attachmentItemID]
            )[0] as { parentItemID: number } | undefined;
            
            if (attDetails?.parentItemID) {
              db.setItemAbstract(attDetails.parentItemID, abstract);
            }
          }
          
          result = { abstract, length: abstract.length };
          break;
        }

        // ============================================
        // Utility Tools
        // ============================================
        case 'get_database_info': {
          getDatabaseInfoSchema.parse(args);
          result = {
            path: db.getPath(),
            storagePath: db.getStoragePath(),
            readonly,
            collectionsCount: db.getCollections().length,
            tagsCount: db.getTags().length
          };
          break;
        }

        case 'raw_query': {
          const params = rawQuerySchema.parse(args);
          
          // Security check - only allow SELECT queries
          if (!params.sql.trim().toUpperCase().startsWith('SELECT')) {
            throw new Error('Only SELECT queries are allowed');
          }
          
          result = db.query(params.sql, params.params);
          break;
        }

        // ============================================
        // Identifier Tools (DOI/ISBN)
        // ============================================
        case 'find_by_doi': {
          const params = findByDOISchema.parse(args);
          result = db.findItemByDOI(params.doi);
          break;
        }

        case 'find_by_isbn': {
          const params = findByISBNSchema.parse(args);
          result = db.findItemByISBN(params.isbn);
          break;
        }

        case 'find_by_identifier': {
          const params = findByIdentifierSchema.parse(args);
          result = db.findItemByIdentifier(params.identifier, params.type);
          break;
        }

        // ============================================
        // Annotation Tools
        // ============================================
        case 'get_item_annotations': {
          const params = getItemAnnotationsSchema.parse(args);
          result = db.getItemAnnotations(params.itemID);
          break;
        }

        case 'get_attachment_annotations': {
          const params = getAttachmentAnnotationsSchema.parse(args);
          result = db.getAttachmentAnnotations(params.attachmentID);
          break;
        }

        case 'get_annotations_by_type': {
          const params = getAnnotationsByTypeSchema.parse(args);
          result = db.getAnnotationsByType(params.itemID, params.types);
          break;
        }

        case 'get_annotations_by_color': {
          const params = getAnnotationsByColorSchema.parse(args);
          result = db.getAnnotationsByColor(params.itemID, params.colors);
          break;
        }

        case 'search_annotations': {
          const params = searchAnnotationsSchema.parse(args);
          result = db.searchAnnotations(params.query, params.itemID);
          break;
        }

        // ============================================
        // Fulltext Search Tools
        // ============================================
        case 'search_fulltext': {
          const params = searchFulltextSchema.parse(args);
          result = db.searchFulltext(params.query, params.libraryID);
          break;
        }

        case 'get_fulltext_content': {
          const params = getFulltextContentSchema.parse(args);
          result = { content: db.getFulltextContent(params.attachmentID) };
          break;
        }

        case 'search_fulltext_with_context': {
          const params = searchFulltextWithContextSchema.parse(args);
          result = db.searchFulltextWithContext(params.query, params.contextLength, params.libraryID);
          break;
        }

        // ============================================
        // Related/Similar Items Tools
        // ============================================
        case 'get_related_items': {
          const params = getRelatedItemsSchema.parse(args);
          result = db.getRelatedItems(params.itemID);
          break;
        }

        case 'find_similar_by_tags': {
          const params = findSimilarByTagsSchema.parse(args);
          result = db.findSimilarByTags(params.itemID, params.minSharedTags);
          break;
        }

        case 'find_similar_by_creators': {
          const params = findSimilarByCreatorsSchema.parse(args);
          result = db.findSimilarByCreators(params.itemID);
          break;
        }

        case 'find_similar_by_collection': {
          const params = findSimilarByCollectionSchema.parse(args);
          result = db.findSimilarByCollection(params.itemID);
          break;
        }

        default:
          throw new Error(`Unknown tool: ${name}`);
      }

      return {
        content: [
          {
            type: 'text',
            text: JSON.stringify(result, null, 2)
          }
        ]
      };

    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : String(error);
      return {
        content: [
          {
            type: 'text',
            text: JSON.stringify({ error: errorMessage })
          }
        ],
        isError: true
      };
    }
  });

  // Start the server
  const transport = new StdioServerTransport();
  await server.connect(transport);

  // Handle shutdown
  process.on('SIGINT', () => {
    db.disconnect();
    process.exit(0);
  });

  process.on('SIGTERM', () => {
    db.disconnect();
    process.exit(0);
  });

  console.error(`ZoteroBridge MCP Server v${SERVER_VERSION} started`);
  console.error(`Database: ${db.getPath()}`);
}

// Helper function to get Zod type as JSON Schema type
function getZodType(zodType: z.ZodTypeAny): string {
  if (zodType instanceof z.ZodString) return 'string';
  if (zodType instanceof z.ZodNumber) return 'number';
  if (zodType instanceof z.ZodBoolean) return 'boolean';
  if (zodType instanceof z.ZodArray) return 'array';
  if (zodType instanceof z.ZodObject) return 'object';
  if (zodType instanceof z.ZodOptional) return getZodType(zodType._def.innerType);
  if (zodType instanceof z.ZodDefault) return getZodType(zodType._def.innerType);
  if (zodType instanceof z.ZodNullable) return getZodType(zodType._def.innerType);
  return 'string';
}

main().catch((error) => {
  console.error('Fatal error:', error);
  process.exit(1);
});
