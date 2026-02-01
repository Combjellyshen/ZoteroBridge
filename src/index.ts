#!/usr/bin/env node

/**
 * ZoteroBridge - MCP Server for Zotero SQLite Database
 * 
 * A Model Context Protocol server that provides direct access to Zotero's
 * SQLite database for collection management, tagging, PDF reading, and more.
 * 
 * @author Combjellyshen
 * @version 1.1.0 (Consolidated tools)
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
  manageCollectionSchema,
  manageTagsSchema,
  searchItemsSchema,
  getItemDetailsSchema,
  manageItemContentSchema,
  managePDFSchema,
  findByIdentifierSchema,
  getAnnotationsSchema,
  searchFulltextSchema,
  findRelatedItemsSchema,
  getDatabaseInfoSchema,
  rawQuerySchema,
  libraryMaintenanceSchema
} from './tools.js';

// Server configuration
const SERVER_NAME = 'zotero-bridge';
const SERVER_VERSION = '1.1.0';

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
  await db.connect();
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
              const schema = zodToJsonSchema(zodType);
              return [key, {
                ...schema,
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
        // Collection Management (Consolidated)
        // ============================================
        case 'manage_collection': {
          const params = manageCollectionSchema.parse(args);
          
          switch (params.action) {
            case 'list':
              result = db.getCollections(params.libraryID);
              break;
            case 'get':
              if (params.collectionID) {
                result = db.getCollectionById(params.collectionID);
              } else if (params.name) {
                result = db.getCollectionByName(params.name, params.libraryID);
              } else {
                throw new Error('Either collectionID or name is required for get action');
              }
              break;
            case 'create':
              if (!params.name) throw new Error('Name is required for create action');
              const collectionID = db.createCollection(params.name, params.parentCollectionID || null, params.libraryID);
              result = { success: true, collectionID };
              break;
            case 'rename':
              if (!params.collectionID || !params.newName) throw new Error('collectionID and newName are required');
              result = { success: db.renameCollection(params.collectionID, params.newName) };
              break;
            case 'move':
              if (!params.collectionID) throw new Error('collectionID is required');
              result = { success: db.moveCollection(params.collectionID, params.parentCollectionID ?? null) };
              break;
            case 'delete':
              if (!params.collectionID) throw new Error('collectionID is required');
              result = { success: db.deleteCollection(params.collectionID) };
              break;
            case 'get_subcollections':
              if (!params.collectionID) throw new Error('collectionID is required');
              result = db.getSubcollections(params.collectionID);
              break;
            case 'add_item':
              if (!params.itemID || !params.collectionID) throw new Error('itemID and collectionID are required');
              result = { success: db.addItemToCollection(params.itemID, params.collectionID) };
              break;
            case 'remove_item':
              if (!params.itemID || !params.collectionID) throw new Error('itemID and collectionID are required');
              result = { success: db.removeItemFromCollection(params.itemID, params.collectionID) };
              break;
            case 'get_items':
              if (!params.collectionID) throw new Error('collectionID is required');
              result = db.getCollectionItems(params.collectionID);
              break;
            default:
              throw new Error(`Unknown action: ${params.action}`);
          }
          break;
        }

        // ============================================
        // Tag Management (Consolidated)
        // ============================================
        case 'manage_tags': {
          const params = manageTagsSchema.parse(args);
          
          switch (params.action) {
            case 'list':
              result = db.getTags();
              break;
            case 'get_item_tags':
              if (!params.itemID) throw new Error('itemID is required');
              result = db.getItemTags(params.itemID);
              break;
            case 'add':
              if (!params.itemID || !params.tagName) throw new Error('itemID and tagName are required');
              result = { success: db.addTagToItem(params.itemID, params.tagName, params.type) };
              break;
            case 'remove':
              if (!params.itemID || !params.tagName) throw new Error('itemID and tagName are required');
              result = { success: db.removeTagFromItem(params.itemID, params.tagName) };
              break;
            case 'create':
              if (!params.tagName) throw new Error('tagName is required');
              const tagID = db.createTag(params.tagName, params.type);
              result = { success: true, tagID };
              break;
            default:
              throw new Error(`Unknown action: ${params.action}`);
          }
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
            result = item ? db.getItemDetails(item.itemID) : null;
          } else {
            throw new Error('Either itemID or itemKey is required');
          }
          break;
        }

        // ============================================
        // Abstract/Note Management (Consolidated)
        // ============================================
        case 'manage_item_content': {
          const params = manageItemContentSchema.parse(args);
          
          switch (params.action) {
            case 'get_abstract':
              result = { abstract: db.getItemAbstract(params.itemID) };
              break;
            case 'set_abstract':
              if (!params.abstract) throw new Error('abstract is required');
              result = { success: db.setItemAbstract(params.itemID, params.abstract) };
              break;
            case 'get_notes':
              result = db.getItemNotes(params.itemID);
              break;
            case 'add_note':
              if (!params.noteContent) throw new Error('noteContent is required');
              const noteID = db.addItemNote(params.itemID, params.noteContent, params.noteTitle);
              result = { success: true, noteID };
              break;
            default:
              throw new Error(`Unknown action: ${params.action}`);
          }
          break;
        }

        // ============================================
        // PDF Management (Consolidated)
        // ============================================
        case 'manage_pdf': {
          const params = managePDFSchema.parse(args);
          
          switch (params.action) {
            case 'extract_text':
              if (!params.attachmentItemID) throw new Error('attachmentItemID is required');
              result = await pdf.extractTextFromAttachment(params.attachmentItemID);
              break;
            case 'get_summary':
              if (!params.attachmentItemID) throw new Error('attachmentItemID is required');
              result = await pdf.getPDFSummary(params.attachmentItemID);
              break;
            case 'list':
              if (!params.parentItemID) throw new Error('parentItemID is required');
              const attachments = db.getPDFAttachments(params.parentItemID);
              result = attachments.map(att => ({
                ...att,
                fullPath: db.getAttachmentPath(att.itemID)
              }));
              break;
            case 'search':
              if (!params.attachmentItemID || !params.query) throw new Error('attachmentItemID and query are required');
              const content = await pdf.extractTextFromAttachment(params.attachmentItemID);
              result = content ? pdf.searchInPDF(content, params.query, params.caseSensitive) : [];
              break;
            case 'generate_abstract':
              if (!params.attachmentItemID) throw new Error('attachmentItemID is required');
              const pdfContent = await pdf.extractTextFromAttachment(params.attachmentItemID);
              if (!pdfContent) throw new Error('Could not extract PDF content');
              const abstract = pdf.generateSimpleSummary(pdfContent, params.maxLength);
              if (params.saveToItem) {
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
            default:
              throw new Error(`Unknown action: ${params.action}`);
          }
          break;
        }

        // ============================================
        // Identifier Lookup (Consolidated)
        // ============================================
        case 'find_by_identifier': {
          const params = findByIdentifierSchema.parse(args);
          const identifier = params.identifier.trim();
          let type = params.type;
          
          // Auto-detect type
          if (type === 'auto') {
            if (/^10\.\d+\//.test(identifier) || /doi\.org/i.test(identifier)) {
              type = 'doi';
            } else if (/^(97[89])?\d{9}[\dXx]$/.test(identifier.replace(/[-\s]/g, ''))) {
              type = 'isbn';
            } else if (/^\d+$/.test(identifier) || /pubmed|pmid/i.test(identifier)) {
              type = 'pmid';
            } else if (/arxiv/i.test(identifier) || /^\d{4}\.\d{4,5}/.test(identifier)) {
              type = 'arxiv';
            } else if (/^https?:\/\//.test(identifier)) {
              type = 'url';
            } else {
              type = 'doi'; // Default
            }
          }
          
          result = db.findItemByIdentifier(identifier, type);
          break;
        }

        // ============================================
        // Annotations (Consolidated)
        // ============================================
        case 'get_annotations': {
          const params = getAnnotationsSchema.parse(args);
          
          if (params.searchQuery) {
            result = db.searchAnnotations(params.searchQuery, params.itemID);
          } else if (params.types && params.itemID) {
            result = db.getAnnotationsByType(params.itemID, params.types);
          } else if (params.colors && params.itemID) {
            result = db.getAnnotationsByColor(params.itemID, params.colors);
          } else if (params.attachmentID) {
            result = db.getAttachmentAnnotations(params.attachmentID);
          } else if (params.itemID) {
            result = db.getItemAnnotations(params.itemID);
          } else {
            throw new Error('At least itemID, attachmentID, or searchQuery is required');
          }
          break;
        }

        // ============================================
        // Fulltext Search (Consolidated)
        // ============================================
        case 'search_fulltext': {
          const params = searchFulltextSchema.parse(args);
          
          if (params.attachmentID && !params.query) {
            // Get fulltext content
            result = { content: db.getFulltextContent(params.attachmentID) };
          } else if (params.query) {
            // Search with context
            result = db.searchFulltextWithContext(params.query, params.contextLength, params.libraryID);
          } else {
            throw new Error('Either query or attachmentID is required');
          }
          break;
        }

        // ============================================
        // Related Items (Consolidated)
        // ============================================
        case 'find_related_items': {
          const params = findRelatedItemsSchema.parse(args);
          
          switch (params.method) {
            case 'manual':
              result = db.getRelatedItems(params.itemID);
              break;
            case 'tags':
              result = db.findSimilarByTags(params.itemID, params.minSharedTags);
              break;
            case 'creators':
              result = db.findSimilarByCreators(params.itemID);
              break;
            case 'collection':
              result = db.findSimilarByCollection(params.itemID);
              break;
            case 'all':
              result = {
                manual: db.getRelatedItems(params.itemID),
                byTags: db.findSimilarByTags(params.itemID, params.minSharedTags),
                byCreators: db.findSimilarByCreators(params.itemID),
                byCollection: db.findSimilarByCollection(params.itemID)
              };
              break;
            default:
              throw new Error(`Unknown method: ${params.method}`);
          }
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
          if (!params.sql.trim().toUpperCase().startsWith('SELECT')) {
            throw new Error('Only SELECT queries are allowed');
          }
          result = db.query(params.sql, params.params);
          break;
        }

        // ============================================
        // Library Maintenance (Consolidated)
        // ============================================
        case 'library_maintenance': {
          const params = libraryMaintenanceSchema.parse(args);
          
          switch (params.action) {
            case 'find_duplicates':
              result = db.findDuplicates(params.duplicateField, params.libraryID);
              break;
            case 'validate_attachments':
              result = db.validateAttachments(params.itemID, params.checkAll);
              break;
            case 'get_valid_attachment':
              if (!params.parentItemID) throw new Error('parentItemID is required');
              result = db.getValidAttachment(params.parentItemID, params.contentType);
              break;
            case 'find_with_valid_pdf':
              result = db.findItemsWithValidPDF({
                title: params.title,
                doi: params.doi,
                requireValidPDF: params.requireValidPDF
              });
              break;
            case 'cleanup_orphans':
              result = db.deleteOrphanAttachments(params.dryRun);
              break;
            case 'merge_items':
              if (!params.targetItemID || !params.sourceItemIDs) {
                throw new Error('targetItemID and sourceItemIDs are required');
              }
              result = db.mergeItems(params.targetItemID, params.sourceItemIDs);
              break;
            default:
              throw new Error(`Unknown action: ${params.action}`);
          }
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

// Helper function to convert Zod type to JSON Schema (Zod v4 compatible)
function zodToJsonSchema(zodType: any): Record<string, any> {
  // Get the type name from _zod property or check type directly
  const typeName = zodType?._zod?.def?.type || zodType?.constructor?.name || '';
  
  // Unwrap optional types
  if (typeName === 'optional' || zodType instanceof z.ZodOptional) {
    const inner = zodType._zod?.def?.innerType || zodType._def?.innerType;
    if (inner) return zodToJsonSchema(inner);
  }
  
  // Unwrap default types
  if (typeName === 'default' || zodType instanceof z.ZodDefault) {
    const inner = zodType._zod?.def?.innerType || zodType._def?.innerType;
    if (inner) return zodToJsonSchema(inner);
  }
  
  // Unwrap nullable types
  if (typeName === 'nullable' || zodType instanceof z.ZodNullable) {
    const inner = zodType._zod?.def?.innerType || zodType._def?.innerType;
    if (inner) return zodToJsonSchema(inner);
  }

  // Handle basic types
  if (typeName === 'string' || zodType instanceof z.ZodString) {
    return { type: 'string' };
  }
  if (typeName === 'number' || zodType instanceof z.ZodNumber) {
    return { type: 'number' };
  }
  if (typeName === 'boolean' || zodType instanceof z.ZodBoolean) {
    return { type: 'boolean' };
  }

  // Handle enum types (Zod v4 uses 'entries' instead of 'values')
  if (typeName === 'enum' || zodType instanceof z.ZodEnum) {
    const enumValues = zodType._zod?.def?.entries 
      || zodType._def?.values 
      || Object.keys(zodType._zod?.def?.entries || {});
    return { type: 'string', enum: Array.isArray(enumValues) ? enumValues : Object.keys(enumValues) };
  }

  // Handle array types
  if (typeName === 'array' || zodType instanceof z.ZodArray) {
    const elementType = zodType._zod?.def?.element || zodType._def?.type;
    if (elementType) {
      const itemSchema = zodToJsonSchema(elementType);
      if (Object.keys(itemSchema).length === 0) {
        return { type: 'array', items: { type: 'string' } };
      }
      return { type: 'array', items: itemSchema };
    }
    return { type: 'array', items: { type: 'string' } };
  }

  // Handle object types
  if (typeName === 'object' || zodType instanceof z.ZodObject) {
    return { type: 'object' };
  }

  // Handle ZodAny
  if (typeName === 'any' || zodType instanceof z.ZodAny) {
    return {};
  }

  // Default to string
  return { type: 'string' };
}

main().catch((error) => {
  console.error('Fatal error:', error);
  process.exit(1);
});
