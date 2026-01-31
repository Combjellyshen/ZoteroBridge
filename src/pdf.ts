/**
 * ZoteroBridge - PDF Processing Module
 * 
 * Handles PDF text extraction and content analysis
 * 
 * @author Combjellyshen
 */

import { readFileSync, existsSync } from 'fs';
import { join } from 'path';
// @ts-ignore - pdf-parse doesn't have type definitions
import pdfParse from 'pdf-parse';
import { ZoteroDatabase } from './database.js';

export interface PDFContent {
  text: string;
  numPages: number;
  info: Record<string, any>;
  metadata: Record<string, any> | null;
}

export interface PDFSummary {
  itemID: number;
  title: string;
  numPages: number;
  wordCount: number;
  preview: string;
  path: string;
}

export class PDFProcessor {
  private db: ZoteroDatabase;

  constructor(db: ZoteroDatabase) {
    this.db = db;
  }

  /**
   * Extract text from a PDF file
   */
  async extractText(pdfPath: string): Promise<PDFContent> {
    if (!existsSync(pdfPath)) {
      throw new Error(`PDF file not found: ${pdfPath}`);
    }

    const buffer = readFileSync(pdfPath);
    const data = await pdfParse(buffer);

    return {
      text: data.text,
      numPages: data.numpages,
      info: data.info || {},
      metadata: data.metadata || null
    };
  }

  /**
   * Extract text from a PDF attachment by item ID
   */
  async extractTextFromAttachment(attachmentItemID: number): Promise<PDFContent | null> {
    const path = this.db.getAttachmentPath(attachmentItemID);
    
    if (!path) {
      return null;
    }

    return this.extractText(path);
  }

  /**
   * Extract text from all PDF attachments of a parent item
   */
  async extractTextFromItem(parentItemID: number): Promise<Map<number, PDFContent>> {
    const attachments = this.db.getPDFAttachments(parentItemID);
    const results = new Map<number, PDFContent>();

    for (const att of attachments) {
      const path = this.db.getAttachmentPath(att.itemID);
      if (path && existsSync(path)) {
        try {
          const content = await this.extractText(path);
          results.set(att.itemID, content);
        } catch (error) {
          console.error(`Failed to extract PDF ${att.itemID}: ${error}`);
        }
      }
    }

    return results;
  }

  /**
   * Get a summary of a PDF attachment
   */
  async getPDFSummary(attachmentItemID: number): Promise<PDFSummary | null> {
    const path = this.db.getAttachmentPath(attachmentItemID);
    
    if (!path || !existsSync(path)) {
      return null;
    }

    try {
      const content = await this.extractText(path);
      const title = content.info?.Title || path.split(/[/\\]/).pop() || 'Unknown';
      const wordCount = content.text.split(/\s+/).length;
      const preview = content.text.substring(0, 500).replace(/\s+/g, ' ').trim();

      return {
        itemID: attachmentItemID,
        title,
        numPages: content.numPages,
        wordCount,
        preview,
        path
      };
    } catch (error) {
      return null;
    }
  }

  /**
   * Generate an abstract/summary from PDF content
   * This is a simple extraction - for AI-generated summaries,
   * use the extracted text with an LLM
   */
  generateSimpleSummary(content: PDFContent, maxLength: number = 1000): string {
    const text = content.text;
    
    // Try to find abstract section
    const abstractMatch = text.match(/abstract[:\s]*\n?([\s\S]{100,2000}?)(?=\n\s*(?:introduction|keywords|1\.|background))/i);
    if (abstractMatch) {
      return abstractMatch[1].replace(/\s+/g, ' ').trim().substring(0, maxLength);
    }

    // Try to find introduction
    const introMatch = text.match(/introduction[:\s]*\n?([\s\S]{100,2000}?)(?=\n\s*(?:2\.|background|related|method))/i);
    if (introMatch) {
      return introMatch[1].replace(/\s+/g, ' ').trim().substring(0, maxLength);
    }

    // Fall back to first paragraph
    const paragraphs = text.split(/\n\s*\n/).filter(p => p.trim().length > 100);
    if (paragraphs.length > 0) {
      return paragraphs[0].replace(/\s+/g, ' ').trim().substring(0, maxLength);
    }

    return text.substring(0, maxLength).replace(/\s+/g, ' ').trim();
  }

  /**
   * Search for text within PDF content
   */
  searchInPDF(content: PDFContent, query: string, caseSensitive: boolean = false): string[] {
    const text = caseSensitive ? content.text : content.text.toLowerCase();
    const searchQuery = caseSensitive ? query : query.toLowerCase();
    
    const results: string[] = [];
    const lines = text.split('\n');
    
    for (let i = 0; i < lines.length; i++) {
      if (lines[i].includes(searchQuery)) {
        // Get context (previous and next lines)
        const start = Math.max(0, i - 1);
        const end = Math.min(lines.length - 1, i + 1);
        const context = lines.slice(start, end + 1).join(' ').replace(/\s+/g, ' ').trim();
        results.push(context);
      }
    }
    
    return results;
  }

  /**
   * Get PDF info/metadata
   */
  async getPDFInfo(pdfPath: string): Promise<Record<string, any>> {
    const content = await this.extractText(pdfPath);
    return {
      ...content.info,
      numPages: content.numPages,
      metadata: content.metadata
    };
  }
}
