/**
 * ZoteroBridge - Zotero SQLite Database Connection Module
 * 
 * This module provides direct access to Zotero's SQLite database (zotero.sqlite)
 * for reading and writing reference data.
 * 
 * Uses sql.js for pure JavaScript SQLite support (no native compilation required)
 * 
 * @author Combjellyshen
 */

import initSqlJs, { Database as SqlJsDatabase } from 'sql.js';
import { existsSync, readFileSync, writeFileSync, copyFileSync, unlinkSync, statSync } from 'fs';
import { homedir } from 'os';
import { join, dirname } from 'path';
import { execSync } from 'child_process';

export interface ZoteroItem {
  itemID: number;
  key: string;
  itemTypeID: number;
  dateAdded: string;
  dateModified: string;
  libraryID: number;
}

export interface ZoteroCollection {
  collectionID: number;
  collectionName: string;
  parentCollectionID: number | null;
  key: string;
  libraryID: number;
}

export interface ZoteroTag {
  tagID: number;
  name: string;
  type: number;
}

export interface ZoteroAttachment {
  itemID: number;
  path: string | null;
  contentType: string | null;
}

export class ZoteroDatabase {
  private db: SqlJsDatabase | null = null;
  private dbPath: string;
  private readonly: boolean;
  private SQL: any = null;
  private backupPath: string | null = null;
  private hasUnsavedChanges: boolean = false;

  constructor(dbPath?: string, readonly: boolean = false) {
    this.dbPath = dbPath || this.findDefaultZoteroDB();
    this.readonly = readonly;
  }

  /**
   * Find the default Zotero database path based on OS
   */
  private findDefaultZoteroDB(): string {
    const home = homedir();
    const possiblePaths: string[] = [];

    // Windows paths
    if (process.platform === 'win32') {
      possiblePaths.push(
        join(home, 'Zotero', 'zotero.sqlite'),
        join(process.env.APPDATA || '', 'Zotero', 'Zotero', 'Profiles')
      );
    }
    // macOS paths
    else if (process.platform === 'darwin') {
      possiblePaths.push(
        join(home, 'Zotero', 'zotero.sqlite'),
        join(home, 'Library', 'Application Support', 'Zotero', 'Profiles')
      );
    }
    // Linux paths
    else {
      possiblePaths.push(
        join(home, 'Zotero', 'zotero.sqlite'),
        join(home, '.zotero', 'zotero')
      );
    }

    // Check each path
    for (const p of possiblePaths) {
      if (existsSync(p)) {
        return p;
      }
    }

    // Default fallback
    return join(home, 'Zotero', 'zotero.sqlite');
  }

  /**
   * Check if Zotero is currently running
   */
  private isZoteroRunning(): boolean {
    try {
      if (process.platform === 'win32') {
        const result = execSync('tasklist /FI "IMAGENAME eq zotero.exe" /NH', { encoding: 'utf8' });
        return result.toLowerCase().includes('zotero.exe');
      } else if (process.platform === 'darwin') {
        const result = execSync('pgrep -x Zotero', { encoding: 'utf8' });
        return result.trim().length > 0;
      } else {
        const result = execSync('pgrep -x zotero', { encoding: 'utf8' });
        return result.trim().length > 0;
      }
    } catch {
      return false;
    }
  }

  /**
   * Check if WAL files exist (indicates active Zotero session)
   */
  private hasWALFiles(): boolean {
    const walPath = this.dbPath + '-wal';
    const shmPath = this.dbPath + '-shm';
    return existsSync(walPath) || existsSync(shmPath);
  }

  /**
   * Create a backup of the database before modification
   */
  private createBackup(): string {
    const timestamp = new Date().toISOString().replace(/[:.]/g, '-');
    const backupPath = this.dbPath.replace('.sqlite', `.backup-${timestamp}.sqlite`);
    copyFileSync(this.dbPath, backupPath);
    return backupPath;
  }

  /**
   * Verify database integrity
   */
  private verifyIntegrity(): boolean {
    if (!this.db) return false;
    try {
      const result = this.queryOne('PRAGMA integrity_check');
      return result && result.integrity_check === 'ok';
    } catch {
      return false;
    }
  }

  /**
   * Connect to the Zotero database
   */
  async connect(): Promise<void> {
    if (this.db) {
      return;
    }

    if (!existsSync(this.dbPath)) {
      throw new Error(`Zotero database not found at: ${this.dbPath}`);
    }

    // WARNING: Check if Zotero is running (write operations are dangerous)
    if (!this.readonly && this.isZoteroRunning()) {
      console.warn('⚠️  WARNING: Zotero is currently running. Write operations may corrupt the database!');
      console.warn('   Please close Zotero before making changes, or use readonly mode.');
    }

    // WARNING: Check for WAL files
    if (!this.readonly && this.hasWALFiles()) {
      console.warn('⚠️  WARNING: WAL files detected. Zotero may be running or was not closed properly.');
      console.warn('   Writing to the database may cause corruption!');
    }

    // Initialize sql.js
    this.SQL = await initSqlJs();
    
    // Read the database file
    const buffer = readFileSync(this.dbPath);
    const db = new this.SQL.Database(buffer);
    this.db = db;

    // Enable foreign keys
    db.run('PRAGMA foreign_keys = ON');

    // Verify database integrity on connect
    if (!this.verifyIntegrity()) {
      console.error('❌ ERROR: Database integrity check failed! The database may already be corrupted.');
    }
  }

  /**
   * Save changes to the database file
   * WARNING: This can corrupt the database if Zotero is running!
   */
  save(): void {
    if (!this.db || this.readonly || !this.hasUnsavedChanges) {
      return;
    }

    // Safety check before save
    if (this.isZoteroRunning()) {
      throw new Error('Cannot save: Zotero is currently running. Please close Zotero first to avoid database corruption.');
    }

    if (this.hasWALFiles()) {
      throw new Error('Cannot save: WAL files detected. Please close Zotero and wait for WAL files to be cleaned up.');
    }

    // Create backup before saving
    if (!this.backupPath) {
      this.backupPath = this.createBackup();
      console.log(`📁 Backup created at: ${this.backupPath}`);
    }

    // Verify integrity before save (only check a few important tables to speed up)
    try {
      this.queryOne("SELECT 1 FROM items LIMIT 1");
      this.queryOne("SELECT 1 FROM itemData LIMIT 1");
    } catch (e) {
      throw new Error('Cannot save: Basic database check failed. Database may be corrupted.');
    }
    
    const data = this.db.export();
    const buffer = Buffer.from(data);
    writeFileSync(this.dbPath, buffer);
    this.hasUnsavedChanges = false;
    console.log('✅ Database saved successfully.');
  }

  /**
   * Mark that changes have been made (for tracking unsaved changes)
   */
  private markDirty(): void {
    this.hasUnsavedChanges = true;
  }

  /**
   * Disconnect from the database
   */
  disconnect(): void {
    if (this.db) {
      if (!this.readonly && this.hasUnsavedChanges) {
        try {
          this.save();
        } catch (e) {
          console.error('Failed to save on disconnect:', e);
        }
      }
      this.db.close();
      this.db = null;
    }
  }

  /**
   * Get the database instance
   */
  async getDB(): Promise<SqlJsDatabase> {
    if (!this.db) {
      await this.connect();
    }
    return this.db!;
  }

  /**
   * Get database path
   */
  getPath(): string {
    return this.dbPath;
  }

  /**
   * Get current timestamp in Zotero SQL format
   */
  private getCurrentTimestamp(): string {
    return new Date().toISOString().replace('T', ' ').replace('Z', '').slice(0, -4);
  }

  /**
   * Update item metadata after modification (dateModified, version, synced)
   * This is CRITICAL for Zotero compatibility!
   * 
   * According to Zotero's official code:
   * - dateModified must be updated on every change
   * - version must be incremented
   * - synced must be set to 0 (false) to indicate local change
   */
  private updateItemMetadata(itemID: number): void {
    const timestamp = this.getCurrentTimestamp();
    this.db!.run(`
      UPDATE items 
      SET dateModified = ?, 
          clientDateModified = ?,
          version = version + 1,
          synced = 0
      WHERE itemID = ?
    `, [timestamp, timestamp, itemID]);
  }

  /**
   * Execute a query and return all results
   */
  private queryAll(sql: string, params: any[] = []): any[] {
    if (!this.db) {
      throw new Error('Database not connected');
    }
    
    const stmt = this.db.prepare(sql);
    stmt.bind(params);
    
    const results: any[] = [];
    while (stmt.step()) {
      const row = stmt.getAsObject();
      results.push(row);
    }
    stmt.free();
    
    return results;
  }

  /**
   * Execute a query and return the first result
   */
  private queryOne(sql: string, params: any[] = []): any | null {
    const results = this.queryAll(sql, params);
    return results.length > 0 ? results[0] : null;
  }

  /**
   * Execute a statement (INSERT, UPDATE, DELETE)
   */
  private execute(sql: string, params: any[] = []): { changes: number; lastInsertRowid: number } {
    if (!this.db) {
      throw new Error('Database not connected');
    }
    
    // Safety check before modifying database
    if (this.isZoteroRunning()) {
      throw new Error('Cannot modify database: Zotero is currently running. Please close Zotero first.');
    }
    
    this.db.run(sql, params);
    this.markDirty(); // Mark that we have unsaved changes
    
    const changes = this.db.getRowsModified();
    const lastId = this.queryOne('SELECT last_insert_rowid() as id');
    
    return {
      changes,
      lastInsertRowid: lastId?.id || 0
    };
  }

  // ============================================
  // Collection (Directory) Operations
  // ============================================

  /**
   * Get all collections
   */
  getCollections(libraryID: number = 1): ZoteroCollection[] {
    return this.queryAll(`
      SELECT collectionID, collectionName, parentCollectionID, key, libraryID
      FROM collections
      WHERE libraryID = ?
      ORDER BY collectionName
    `, [libraryID]);
  }

  /**
   * Get collection by ID
   */
  getCollectionById(collectionID: number): ZoteroCollection | null {
    return this.queryOne(`
      SELECT collectionID, collectionName, parentCollectionID, key, libraryID
      FROM collections
      WHERE collectionID = ?
    `, [collectionID]);
  }

  /**
   * Get collection by name
   */
  getCollectionByName(name: string, libraryID: number = 1): ZoteroCollection | null {
    return this.queryOne(`
      SELECT collectionID, collectionName, parentCollectionID, key, libraryID
      FROM collections
      WHERE collectionName = ? AND libraryID = ?
    `, [name, libraryID]);
  }

  /**
   * Get subcollections of a collection
   */
  getSubcollections(parentCollectionID: number): ZoteroCollection[] {
    return this.queryAll(`
      SELECT collectionID, collectionName, parentCollectionID, key, libraryID
      FROM collections
      WHERE parentCollectionID = ?
      ORDER BY collectionName
    `, [parentCollectionID]);
  }

  /**
   * Create a new collection
   */
  createCollection(name: string, parentCollectionID: number | null = null, libraryID: number = 1): number {
    const key = this.generateKey();
    
    const result = this.execute(`
      INSERT INTO collections (collectionName, parentCollectionID, libraryID, key, version)
      VALUES (?, ?, ?, ?, 0)
    `, [name, parentCollectionID, libraryID, key]);
    
    if (!this.readonly) {
      this.save();
    }
    
    return result.lastInsertRowid;
  }

  /**
   * Rename a collection
   */
  renameCollection(collectionID: number, newName: string): boolean {
    const result = this.execute(`
      UPDATE collections
      SET collectionName = ?, version = version + 1
      WHERE collectionID = ?
    `, [newName, collectionID]);
    
    if (!this.readonly && result.changes > 0) {
      this.save();
    }
    
    return result.changes > 0;
  }

  /**
   * Move a collection to a new parent
   */
  moveCollection(collectionID: number, newParentID: number | null): boolean {
    const result = this.execute(`
      UPDATE collections
      SET parentCollectionID = ?, version = version + 1
      WHERE collectionID = ?
    `, [newParentID, collectionID]);
    
    if (!this.readonly && result.changes > 0) {
      this.save();
    }
    
    return result.changes > 0;
  }

  /**
   * Delete a collection
   */
  deleteCollection(collectionID: number): boolean {
    // First, remove all items from collection
    this.execute('DELETE FROM collectionItems WHERE collectionID = ?', [collectionID]);
    
    // Then delete the collection
    const result = this.execute('DELETE FROM collections WHERE collectionID = ?', [collectionID]);
    
    if (!this.readonly && result.changes > 0) {
      this.save();
    }
    
    return result.changes > 0;
  }

  // ============================================
  // Tag Operations
  // ============================================

  /**
   * Get all tags with usage count
   */
  getTags(): any[] {
    return this.queryAll(`
      SELECT t.tagID, t.name, COUNT(it.itemID) as itemCount
      FROM tags t
      LEFT JOIN itemTags it ON t.tagID = it.tagID
      GROUP BY t.tagID, t.name
      ORDER BY t.name
    `);
  }

  /**
   * Get tag by name
   */
  getTagByName(name: string): any | null {
    return this.queryOne('SELECT tagID, name FROM tags WHERE name = ?', [name]);
  }

  /**
   * Create a new tag
   */
  createTag(name: string, _type: number = 0): number {
    // Check if tag exists
    const existing = this.getTagByName(name);
    if (existing) {
      return existing.tagID;
    }
    
    const result = this.execute('INSERT INTO tags (name) VALUES (?)', [name]);
    
    if (!this.readonly) {
      this.save();
    }
    
    return result.lastInsertRowid;
  }

  /**
   * Add tag to item
   * 
   * Following Zotero's pattern: modifying item tags should update item metadata
   */
  addTagToItem(itemID: number, tagName: string, type: number = 0): boolean {
    // Get or create tag
    const tagID = this.createTag(tagName, type);
    
    // Check if already tagged
    const existing = this.queryOne(`
      SELECT 1 FROM itemTags WHERE itemID = ? AND tagID = ?
    `, [itemID, tagID]);
    
    if (existing) {
      return false;
    }
    
    this.execute('INSERT INTO itemTags (itemID, tagID) VALUES (?, ?)', [itemID, tagID]);
    
    // CRITICAL: Update item metadata for Zotero compatibility
    this.updateItemMetadata(itemID);
    
    if (!this.readonly) {
      this.save();
    }
    
    return true;
  }

  /**
   * Remove tag from item
   */
  removeTagFromItem(itemID: number, tagName: string): boolean {
    const tag = this.getTagByName(tagName);
    if (!tag) {
      return false;
    }
    
    const result = this.execute('DELETE FROM itemTags WHERE itemID = ? AND tagID = ?', [itemID, tag.tagID]);
    
    if (result.changes > 0) {
      // CRITICAL: Update item metadata for Zotero compatibility
      this.updateItemMetadata(itemID);
    }
    
    if (!this.readonly && result.changes > 0) {
      this.save();
    }
    
    return result.changes > 0;
  }

  /**
   * Get all tags for an item
   * Note: type is in itemTags table, not tags table
   */
  getItemTags(itemID: number): any[] {
    return this.queryAll(`
      SELECT t.tagID, t.name, it.type
      FROM tags t
      JOIN itemTags it ON t.tagID = it.tagID
      WHERE it.itemID = ?
      ORDER BY t.name
    `, [itemID]);
  }

  // ============================================
  // Item Operations
  // ============================================

  /**
   * Get items in a collection
   */
  getCollectionItems(collectionID: number): ZoteroItem[] {
    return this.queryAll(`
      SELECT i.itemID, i.key, i.itemTypeID, i.dateAdded, i.dateModified, i.libraryID
      FROM items i
      JOIN collectionItems ci ON i.itemID = ci.itemID
      WHERE ci.collectionID = ?
    `, [collectionID]);
  }

  /**
   * Add item to collection
   * 
   * Following Zotero's pattern: collection membership changes update item metadata
   */
  addItemToCollection(itemID: number, collectionID: number): boolean {
    // Check if already in collection
    const existing = this.queryOne(`
      SELECT 1 FROM collectionItems WHERE itemID = ? AND collectionID = ?
    `, [itemID, collectionID]);
    
    if (existing) {
      return false;
    }
    
    this.execute('INSERT INTO collectionItems (itemID, collectionID) VALUES (?, ?)', [itemID, collectionID]);
    
    // CRITICAL: Update item metadata for Zotero compatibility
    this.updateItemMetadata(itemID);
    
    if (!this.readonly) {
      this.save();
    }
    
    return true;
  }

  /**
   * Remove item from collection
   * 
   * Following Zotero's pattern: collection membership changes update item metadata
   */
  removeItemFromCollection(itemID: number, collectionID: number): boolean {
    const result = this.execute('DELETE FROM collectionItems WHERE itemID = ? AND collectionID = ?', [itemID, collectionID]);
    
    if (result.changes > 0) {
      // CRITICAL: Update item metadata for Zotero compatibility
      this.updateItemMetadata(itemID);
    }
    
    if (!this.readonly && result.changes > 0) {
      this.save();
    }
    
    return result.changes > 0;
  }

  /**
   * Get item by key
   */
  getItemByKey(key: string): ZoteroItem | null {
    return this.queryOne(`
      SELECT itemID, key, itemTypeID, dateAdded, dateModified, libraryID
      FROM items
      WHERE key = ?
    `, [key]);
  }

  /**
   * Search items by title
   */
  searchItems(query: string, limit: number = 50, libraryID: number = 1): any[] {
    return this.queryAll(`
      SELECT DISTINCT i.itemID, i.key, i.itemTypeID, i.dateAdded, i.dateModified,
             iv.value as title
      FROM items i
      JOIN itemData id ON i.itemID = id.itemID
      JOIN itemDataValues iv ON id.valueID = iv.valueID
      JOIN fields f ON id.fieldID = f.fieldID
      WHERE f.fieldName = 'title' 
        AND iv.value LIKE ?
        AND i.libraryID = ?
      ORDER BY i.dateModified DESC
      LIMIT ?
    `, [`%${query}%`, libraryID, limit]);
  }

  /**
   * Get item details with all fields
   */
  getItemDetails(itemID: number): Record<string, any> {
    // Get item basic info
    const item = this.queryOne(`
      SELECT itemID, key, itemTypeID, dateAdded, dateModified, libraryID
      FROM items WHERE itemID = ?
    `, [itemID]);
    
    if (!item) {
      return {};
    }
    
    // Get all item data fields
    const fields = this.queryAll(`
      SELECT f.fieldName, iv.value
      FROM itemData id
      JOIN fields f ON id.fieldID = f.fieldID
      JOIN itemDataValues iv ON id.valueID = iv.valueID
      WHERE id.itemID = ?
    `, [itemID]);
    
    // Get creators
    const creators = this.queryAll(`
      SELECT c.firstName, c.lastName, ct.creatorType, ic.orderIndex
      FROM itemCreators ic
      JOIN creators c ON ic.creatorID = c.creatorID
      JOIN creatorTypes ct ON ic.creatorTypeID = ct.creatorTypeID
      WHERE ic.itemID = ?
      ORDER BY ic.orderIndex
    `, [itemID]);
    
    // Get tags
    const tags = this.getItemTags(itemID);
    
    // Get attachments
    const attachments = this.queryAll(`
      SELECT ia.itemID, ia.path, ia.contentType
      FROM itemAttachments ia
      WHERE ia.parentItemID = ?
    `, [itemID]);
    
    const result: Record<string, any> = {
      ...item,
      creators,
      tags,
      attachments
    };
    
    // Add field values
    for (const field of fields) {
      result[field.fieldName] = field.value;
    }
    
    return result;
  }

  // ============================================
  // Item Abstract/Note Operations
  // ============================================

  /**
   * Get item abstract
   */
  getItemAbstract(itemID: number): string | null {
    const result = this.queryOne(`
      SELECT iv.value
      FROM itemData id
      JOIN fields f ON id.fieldID = f.fieldID
      JOIN itemDataValues iv ON id.valueID = iv.valueID
      WHERE id.itemID = ? AND f.fieldName = 'abstractNote'
    `, [itemID]);
    return result?.value || null;
  }

  /**
   * Set item abstract
   * 
   * Following Zotero's official pattern for modifying item data:
   * 1. Get or create value in itemDataValues
   * 2. Insert or update itemData
   * 3. Update item metadata (dateModified, version, synced)
   */
  setItemAbstract(itemID: number, abstract: string): boolean {
    // Get abstractNote field ID
    const field = this.queryOne("SELECT fieldID FROM fields WHERE fieldName = 'abstractNote'");
    if (!field) {
      return false;
    }
    
    // Get or create value (Zotero stores unique values in itemDataValues)
    let valueRow = this.queryOne('SELECT valueID FROM itemDataValues WHERE value = ?', [abstract]);
    
    if (!valueRow) {
      const result = this.execute('INSERT INTO itemDataValues (value) VALUES (?)', [abstract]);
      valueRow = { valueID: result.lastInsertRowid };
    }
    
    // Check if item already has abstract
    const existing = this.queryOne(`
      SELECT 1 FROM itemData WHERE itemID = ? AND fieldID = ?
    `, [itemID, field.fieldID]);
    
    if (existing) {
      // Update
      this.execute('UPDATE itemData SET valueID = ? WHERE itemID = ? AND fieldID = ?', 
        [valueRow.valueID, itemID, field.fieldID]);
    } else {
      // Insert
      this.execute('INSERT INTO itemData (itemID, fieldID, valueID) VALUES (?, ?, ?)', 
        [itemID, field.fieldID, valueRow.valueID]);
    }
    
    // CRITICAL: Update item metadata for Zotero compatibility
    this.updateItemMetadata(itemID);
    
    if (!this.readonly) {
      this.save();
    }
    
    return true;
  }
  /**
   * Get item notes
   */
  getItemNotes(itemID: number): any[] {
    return this.queryAll(`
      SELECT in2.itemID, in2.note, in2.title
      FROM itemNotes in2
      WHERE in2.parentItemID = ?
    `, [itemID]);
  }

  /**
   * Add note to item
   * 
   * Following Zotero's official pattern for creating notes:
   * 1. Create item with note type
   * 2. Create itemNotes entry
   * 3. Update parent item's metadata (as adding a child note is a modification)
   */
  addItemNote(parentItemID: number, noteContent: string, title: string = ''): number {
    // Get parent item's library ID
    const parent = this.queryOne('SELECT libraryID FROM items WHERE itemID = ?', [parentItemID]);
    if (!parent) {
      throw new Error('Parent item not found');
    }
    
    // Get note item type ID
    const noteType = this.queryOne("SELECT itemTypeID FROM itemTypes WHERE typeName = 'note'");
    
    // Create item entry with proper timestamp format
    const key = this.generateKey();
    const now = this.getCurrentTimestamp();
    
    // Note: synced=0 for new local items, clientDateModified is also set
    const itemResult = this.execute(`
      INSERT INTO items (itemTypeID, dateAdded, dateModified, clientDateModified, key, libraryID, version, synced)
      VALUES (?, ?, ?, ?, ?, ?, 0, 0)
    `, [noteType.itemTypeID, now, now, now, key, parent.libraryID]);
    
    const itemID = itemResult.lastInsertRowid;
    
    // Wrap note content in Zotero's expected format if not already
    let formattedNote = noteContent;
    if (!noteContent.startsWith('<div class="zotero-note')) {
      formattedNote = `<div class="zotero-note znv1">${noteContent}</div>`;
    }
    
    // Create note entry
    this.execute(`
      INSERT INTO itemNotes (itemID, parentItemID, note, title)
      VALUES (?, ?, ?, ?)
    `, [itemID, parentItemID, formattedNote, title]);
    
    // CRITICAL: Update parent item metadata (adding a note is considered a modification)
    this.updateItemMetadata(parentItemID);
    
    if (!this.readonly) {
      this.save();
    }
    
    return itemID;
  }

  // ============================================
  // Attachment Operations
  // ============================================

  /**
   * Get attachment path
   */
  getAttachmentPath(itemID: number): string | null {
    const result = this.queryOne(`
      SELECT path FROM itemAttachments WHERE itemID = ?
    `, [itemID]);
    
    if (!result?.path) {
      return null;
    }
    
    // Handle different path formats
    let path = result.path;
    
    // Storage path format
    if (path.startsWith('storage:')) {
      const storagePath = this.getStoragePath();
      const keyResult = this.queryOne('SELECT key FROM items WHERE itemID = ?', [itemID]);
      path = join(storagePath, keyResult.key, path.replace('storage:', ''));
    }
    
    return path;
  }

  /**
   * Get PDF attachments for an item
   */
  getPDFAttachments(parentItemID: number): ZoteroAttachment[] {
    return this.queryAll(`
      SELECT ia.itemID, ia.path, ia.contentType
      FROM itemAttachments ia
      WHERE ia.parentItemID = ? AND ia.contentType = 'application/pdf'
    `, [parentItemID]);
  }

  /**
   * Get storage directory path
   */
  getStoragePath(): string {
    // Storage is usually in the same directory as the database
    return join(this.dbPath.replace('zotero.sqlite', ''), 'storage');
  }

  // ============================================
  // Identifier Operations (DOI/ISBN)
  // ============================================

  /**
   * Find item by DOI
   */
  findItemByDOI(doi: string): any | null {
    // Normalize DOI (remove common prefixes)
    const normalizedDOI = doi.replace(/^https?:\/\/doi\.org\//i, '').replace(/^doi:/i, '').trim();
    
    const result = this.queryOne(`
      SELECT DISTINCT i.itemID, i.key, i.itemTypeID, i.dateAdded, i.dateModified,
             iv.value as doi
      FROM items i
      JOIN itemData id ON i.itemID = id.itemID
      JOIN itemDataValues iv ON id.valueID = iv.valueID
      JOIN fields f ON id.fieldID = f.fieldID
      WHERE f.fieldName = 'DOI' AND LOWER(iv.value) = LOWER(?)
    `, [normalizedDOI]);
    
    if (result) {
      return this.getItemDetails(result.itemID);
    }
    return null;
  }

  /**
   * Find item by ISBN
   */
  findItemByISBN(isbn: string): any | null {
    // Normalize ISBN (remove hyphens and spaces)
    const normalizedISBN = isbn.replace(/[-\s]/g, '').trim();
    
    const result = this.queryOne(`
      SELECT DISTINCT i.itemID, i.key, i.itemTypeID, i.dateAdded, i.dateModified,
             iv.value as isbn
      FROM items i
      JOIN itemData id ON i.itemID = id.itemID
      JOIN itemDataValues iv ON id.valueID = iv.valueID
      JOIN fields f ON id.fieldID = f.fieldID
      WHERE f.fieldName = 'ISBN' AND REPLACE(REPLACE(iv.value, '-', ''), ' ', '') = ?
    `, [normalizedISBN]);
    
    if (result) {
      return this.getItemDetails(result.itemID);
    }
    return null;
  }

  /**
   * Find item by any identifier (DOI, ISBN, PMID, arXiv, etc.)
   */
  findItemByIdentifier(identifier: string, type?: string): any | null {
    const fieldMap: Record<string, string> = {
      'doi': 'DOI',
      'isbn': 'ISBN',
      'pmid': 'extra', // PMID is usually stored in extra field
      'arxiv': 'extra',
      'url': 'url'
    };
    
    if (type && fieldMap[type.toLowerCase()]) {
      const fieldName = fieldMap[type.toLowerCase()];
      
      if (type.toLowerCase() === 'doi') {
        return this.findItemByDOI(identifier);
      } else if (type.toLowerCase() === 'isbn') {
        return this.findItemByISBN(identifier);
      }
      
      const result = this.queryOne(`
        SELECT DISTINCT i.itemID, i.key
        FROM items i
        JOIN itemData id ON i.itemID = id.itemID
        JOIN itemDataValues iv ON id.valueID = iv.valueID
        JOIN fields f ON id.fieldID = f.fieldID
        WHERE f.fieldName = ? AND iv.value LIKE ?
      `, [fieldName, `%${identifier}%`]);
      
      if (result) {
        return this.getItemDetails(result.itemID);
      }
    }
    
    // Try all identifier types
    const doi = this.findItemByDOI(identifier);
    if (doi) return doi;
    
    const isbn = this.findItemByISBN(identifier);
    if (isbn) return isbn;
    
    return null;
  }

  // ============================================
  // Annotation Operations
  // ============================================

  /**
   * Get all annotations for an item's attachments
   */
  getItemAnnotations(parentItemID: number): any[] {
    return this.queryAll(`
      SELECT 
        ia.itemID as annotationID,
        ia.parentItemID as attachmentID,
        ia.type as annotationType,
        ia.text as annotationText,
        ia.comment as annotationComment,
        ia.color as annotationColor,
        ia.pageLabel,
        ia.sortIndex,
        ia.position,
        i.dateAdded,
        i.dateModified,
        i.key
      FROM itemAnnotations ia
      JOIN items i ON ia.itemID = i.itemID
      JOIN itemAttachments att ON ia.parentItemID = att.itemID
      WHERE att.parentItemID = ?
      ORDER BY ia.sortIndex
    `, [parentItemID]);
  }

  /**
   * Get annotations from a specific attachment
   */
  getAttachmentAnnotations(attachmentID: number): any[] {
    return this.queryAll(`
      SELECT 
        ia.itemID as annotationID,
        ia.parentItemID as attachmentID,
        ia.type as annotationType,
        ia.text as annotationText,
        ia.comment as annotationComment,
        ia.color as annotationColor,
        ia.pageLabel,
        ia.sortIndex,
        ia.position,
        i.dateAdded,
        i.dateModified,
        i.key
      FROM itemAnnotations ia
      JOIN items i ON ia.itemID = i.itemID
      WHERE ia.parentItemID = ?
      ORDER BY ia.sortIndex
    `, [attachmentID]);
  }

  /**
   * Get annotations filtered by type
   */
  getAnnotationsByType(parentItemID: number, types: string[]): any[] {
    const placeholders = types.map(() => '?').join(',');
    return this.queryAll(`
      SELECT 
        ia.itemID as annotationID,
        ia.parentItemID as attachmentID,
        ia.type as annotationType,
        ia.text as annotationText,
        ia.comment as annotationComment,
        ia.color as annotationColor,
        ia.pageLabel,
        ia.sortIndex,
        ia.position,
        i.dateAdded,
        i.dateModified
      FROM itemAnnotations ia
      JOIN items i ON ia.itemID = i.itemID
      JOIN itemAttachments att ON ia.parentItemID = att.itemID
      WHERE att.parentItemID = ? AND ia.type IN (${placeholders})
      ORDER BY ia.sortIndex
    `, [parentItemID, ...types]);
  }

  /**
   * Get annotations filtered by color
   */
  getAnnotationsByColor(parentItemID: number, colors: string[]): any[] {
    const placeholders = colors.map(() => '?').join(',');
    return this.queryAll(`
      SELECT 
        ia.itemID as annotationID,
        ia.parentItemID as attachmentID,
        ia.type as annotationType,
        ia.text as annotationText,
        ia.comment as annotationComment,
        ia.color as annotationColor,
        ia.pageLabel,
        ia.sortIndex,
        ia.position,
        i.dateAdded,
        i.dateModified
      FROM itemAnnotations ia
      JOIN items i ON ia.itemID = i.itemID
      JOIN itemAttachments att ON ia.parentItemID = att.itemID
      WHERE att.parentItemID = ? AND ia.color IN (${placeholders})
      ORDER BY ia.sortIndex
    `, [parentItemID, ...colors]);
  }

  /**
   * Search annotations by text content
   */
  searchAnnotations(query: string, parentItemID?: number): any[] {
    const baseQuery = `
      SELECT 
        ia.itemID as annotationID,
        ia.parentItemID as attachmentID,
        ia.type as annotationType,
        ia.text as annotationText,
        ia.comment as annotationComment,
        ia.color as annotationColor,
        ia.pageLabel,
        att.parentItemID as itemID,
        i.dateAdded,
        i.dateModified
      FROM itemAnnotations ia
      JOIN items i ON ia.itemID = i.itemID
      JOIN itemAttachments att ON ia.parentItemID = att.itemID
      WHERE (ia.text LIKE ? OR ia.comment LIKE ?)
    `;
    
    if (parentItemID) {
      return this.queryAll(baseQuery + ' AND att.parentItemID = ? ORDER BY ia.sortIndex', 
        [`%${query}%`, `%${query}%`, parentItemID]);
    }
    
    return this.queryAll(baseQuery + ' ORDER BY i.dateModified DESC', 
      [`%${query}%`, `%${query}%`]);
  }

  // ============================================
  // Fulltext Search Operations
  // ============================================

  /**
   * Search in Zotero's fulltext index
   * fulltextWords: wordID, word
   * fulltextItemWords: wordID, itemID
   */
  searchFulltext(query: string, libraryID: number = 1): any[] {
    // Zotero stores fulltext words in fulltextWords table
    // and word-item associations in fulltextItemWords
    return this.queryAll(`
      SELECT DISTINCT 
        i.itemID,
        i.key,
        att.parentItemID,
        fi.indexedChars,
        fi.totalChars,
        fi.indexedPages,
        fi.totalPages
      FROM fulltextItems fi
      JOIN itemAttachments att ON fi.itemID = att.itemID
      JOIN items i ON att.itemID = i.itemID
      JOIN items parent ON att.parentItemID = parent.itemID
      WHERE parent.libraryID = ?
        AND fi.itemID IN (
          SELECT fiw.itemID 
          FROM fulltextItemWords fiw
          JOIN fulltextWords fw ON fiw.wordID = fw.wordID
          WHERE fw.word LIKE ?
        )
      ORDER BY parent.dateModified DESC
    `, [libraryID, `%${query.toLowerCase()}%`]);
  }

  /**
   * Get fulltext content for an attachment
   * Note: fulltextContent table may not exist in all Zotero versions
   */
  getFulltextContent(attachmentID: number): string | null {
    // Try fulltextContent table first (Zotero 7+)
    try {
      const content = this.queryOne(`
        SELECT content FROM fulltextContent WHERE itemID = ?
      `, [attachmentID]);
      
      if (content?.content) {
        return content.content;
      }
    } catch {
      // Table doesn't exist, continue to fallback
    }
    
    // Fallback: try to reconstruct from fulltextWords and fulltextItemWords
    try {
      const words = this.queryAll(`
        SELECT fw.word 
        FROM fulltextItemWords fiw
        JOIN fulltextWords fw ON fiw.wordID = fw.wordID
        WHERE fiw.itemID = ?
        ORDER BY fw.word
      `, [attachmentID]);
      
      if (words.length > 0) {
        return words.map(w => w.word).join(' ');
      }
    } catch {
      // Tables don't exist or query failed
    }
    
    return null;
  }

  /**
   * Get fulltext index status for an item
   */
  getFulltextStatus(attachmentID: number): any {
    return this.queryOne(`
      SELECT 
        itemID,
        indexedChars,
        totalChars,
        indexedPages,
        totalPages,
        synced
      FROM fulltextItems
      WHERE itemID = ?
    `, [attachmentID]);
  }

  /**
   * Advanced fulltext search with context
   */
  searchFulltextWithContext(query: string, contextLength: number = 100, libraryID: number = 1): any[] {
    const results = this.searchFulltext(query, libraryID);
    
    return results.map(result => {
      const content = this.getFulltextContent(result.itemID);
      let context = '';
      
      if (content) {
        const lowerContent = content.toLowerCase();
        const lowerQuery = query.toLowerCase();
        const index = lowerContent.indexOf(lowerQuery);
        
        if (index !== -1) {
          const start = Math.max(0, index - contextLength);
          const end = Math.min(content.length, index + query.length + contextLength);
          context = (start > 0 ? '...' : '') + 
                   content.substring(start, end) + 
                   (end < content.length ? '...' : '');
        }
      }
      
      // Get parent item details
      const parentDetails = result.parentItemID ? this.getItemDetails(result.parentItemID) : null;
      
      return {
        ...result,
        context,
        parentItem: parentDetails ? {
          itemID: parentDetails.itemID,
          key: parentDetails.key,
          title: parentDetails.title,
          creators: parentDetails.creators
        } : null
      };
    });
  }

  // ============================================
  // Related Items / Similar Items
  // ============================================

  /**
   * Get related items (manually linked)
   */
  getRelatedItems(itemID: number): any[] {
    // Zotero stores relations in itemRelations table
    const relations = this.queryAll(`
      SELECT 
        ir.predicateID,
        ir.object as relatedURI
      FROM itemRelations ir
      WHERE ir.itemID = ?
    `, [itemID]);
    
    // Extract item keys from URIs and get their details
    const relatedItems: any[] = [];
    
    for (const rel of relations) {
      // URI format: http://zotero.org/users/xxx/items/ITEMKEY
      const match = rel.relatedURI.match(/\/items\/([A-Z0-9]+)$/);
      if (match) {
        const relatedItem = this.getItemByKey(match[1]);
        if (relatedItem) {
          relatedItems.push(this.getItemDetails(relatedItem.itemID));
        }
      }
    }
    
    return relatedItems;
  }

  /**
   * Find similar items by shared tags
   */
  findSimilarByTags(itemID: number, minSharedTags: number = 2): any[] {
    return this.queryAll(`
      SELECT 
        i.itemID,
        i.key,
        COUNT(it2.tagID) as sharedTagCount,
        GROUP_CONCAT(t.name, ', ') as sharedTags
      FROM items i
      JOIN itemTags it2 ON i.itemID = it2.itemID
      JOIN tags t ON it2.tagID = t.tagID
      WHERE it2.tagID IN (
        SELECT tagID FROM itemTags WHERE itemID = ?
      )
      AND i.itemID != ?
      GROUP BY i.itemID
      HAVING COUNT(it2.tagID) >= ?
      ORDER BY sharedTagCount DESC
      LIMIT 20
    `, [itemID, itemID, minSharedTags]);
  }

  /**
   * Find similar items by shared creators
   */
  findSimilarByCreators(itemID: number): any[] {
    return this.queryAll(`
      SELECT DISTINCT
        i.itemID,
        i.key,
        COUNT(ic2.creatorID) as sharedCreatorCount
      FROM items i
      JOIN itemCreators ic2 ON i.itemID = ic2.itemID
      WHERE ic2.creatorID IN (
        SELECT creatorID FROM itemCreators WHERE itemID = ?
      )
      AND i.itemID != ?
      GROUP BY i.itemID
      ORDER BY sharedCreatorCount DESC
      LIMIT 20
    `, [itemID, itemID]);
  }

  /**
   * Find similar items by shared collection
   */
  findSimilarByCollection(itemID: number): any[] {
    return this.queryAll(`
      SELECT DISTINCT
        i.itemID,
        i.key,
        c.collectionName
      FROM items i
      JOIN collectionItems ci2 ON i.itemID = ci2.itemID
      JOIN collections c ON ci2.collectionID = c.collectionID
      WHERE ci2.collectionID IN (
        SELECT collectionID FROM collectionItems WHERE itemID = ?
      )
      AND i.itemID != ?
      LIMIT 50
    `, [itemID, itemID]);
  }

  // ============================================
  // Utility Methods
  // ============================================

  /**
   * Generate a unique Zotero key
   * 
   * Zotero uses a specific character set that excludes ambiguous characters:
   * - No '0' (zero) - confused with 'O'
   * - No '1' (one) - confused with 'I' or 'L'  
   * - No 'I' - confused with '1' or 'L'
   * - No 'L' - confused with '1' or 'I'
   * - No 'O' - confused with '0'
   * 
   * Valid characters: 23456789ABCDEFGHJKMNPQRSTUVWXYZ
   */
  private generateKey(): string {
    const chars = '23456789ABCDEFGHJKMNPQRSTUVWXYZ';
    let key = '';
    for (let i = 0; i < 8; i++) {
      key += chars.charAt(Math.floor(Math.random() * chars.length));
    }
    return key;
  }

  /**
   * Execute a raw SQL query
   */
  query(sql: string, params: any[] = []): any[] {
    return this.queryAll(sql, params);
  }

  /**
   * Execute a raw SQL statement
   */
  run(sql: string, params: any[] = []): { changes: number; lastInsertRowid: number } {
    return this.execute(sql, params);
  }

  // ============================================
  // Duplicate Detection & Attachment Validation
  // ============================================

  /**
   * Find duplicate items based on title, DOI, or ISBN
   */
  findDuplicates(field: 'title' | 'doi' | 'isbn' = 'title', libraryID: number = 1): any[] {
    if (field === 'title') {
      // Find items with the same title
      return this.queryAll(`
        SELECT 
          iv.value as title,
          GROUP_CONCAT(i.itemID) as itemIDs,
          COUNT(*) as count
        FROM items i
        JOIN itemData id ON i.itemID = id.itemID
        JOIN itemDataValues iv ON id.valueID = iv.valueID
        JOIN fields f ON id.fieldID = f.fieldID
        WHERE f.fieldName = 'title'
          AND i.libraryID = ?
          AND i.itemTypeID NOT IN (1, 14)  -- Exclude notes and attachments
        GROUP BY iv.value
        HAVING COUNT(*) > 1
        ORDER BY count DESC
      `, [libraryID]);
    } else if (field === 'doi') {
      return this.queryAll(`
        SELECT 
          iv.value as doi,
          GROUP_CONCAT(i.itemID) as itemIDs,
          COUNT(*) as count
        FROM items i
        JOIN itemData id ON i.itemID = id.itemID
        JOIN itemDataValues iv ON id.valueID = iv.valueID
        JOIN fields f ON id.fieldID = f.fieldID
        WHERE f.fieldName = 'DOI'
          AND i.libraryID = ?
          AND iv.value != ''
        GROUP BY LOWER(iv.value)
        HAVING COUNT(*) > 1
        ORDER BY count DESC
      `, [libraryID]);
    } else {
      return this.queryAll(`
        SELECT 
          iv.value as isbn,
          GROUP_CONCAT(i.itemID) as itemIDs,
          COUNT(*) as count
        FROM items i
        JOIN itemData id ON i.itemID = id.itemID
        JOIN itemDataValues iv ON id.valueID = iv.valueID
        JOIN fields f ON id.fieldID = f.fieldID
        WHERE f.fieldName = 'ISBN'
          AND i.libraryID = ?
          AND iv.value != ''
        GROUP BY REPLACE(REPLACE(iv.value, '-', ''), ' ', '')
        HAVING COUNT(*) > 1
        ORDER BY count DESC
      `, [libraryID]);
    }
  }

  /**
   * Validate attachment files exist on disk
   */
  validateAttachments(itemID?: number, checkAll: boolean = false): {
    valid: any[];
    missing: any[];
    total: number;
  } {
    let attachments: any[];
    
    if (itemID) {
      attachments = this.queryAll(`
        SELECT ia.itemID, ia.parentItemID, ia.path, ia.contentType, i.key
        FROM itemAttachments ia
        JOIN items i ON ia.itemID = i.itemID
        WHERE ia.parentItemID = ? AND ia.path IS NOT NULL
      `, [itemID]);
    } else if (checkAll) {
      attachments = this.queryAll(`
        SELECT ia.itemID, ia.parentItemID, ia.path, ia.contentType, i.key
        FROM itemAttachments ia
        JOIN items i ON ia.itemID = i.itemID
        WHERE ia.path IS NOT NULL
        LIMIT 1000
      `);
    } else {
      return { valid: [], missing: [], total: 0 };
    }

    const valid: any[] = [];
    const missing: any[] = [];

    for (const att of attachments) {
      const fullPath = this.getAttachmentPath(att.itemID);
      if (fullPath && existsSync(fullPath)) {
        valid.push({
          ...att,
          fullPath,
          exists: true
        });
      } else {
        missing.push({
          ...att,
          fullPath,
          exists: false
        });
      }
    }

    return {
      valid,
      missing,
      total: attachments.length
    };
  }

  /**
   * Get a valid (existing) attachment for an item
   * Useful when multiple attachment records exist but only one file is present
   */
  getValidAttachment(parentItemID: number, contentType: string = 'application/pdf'): any | null {
    const attachments = this.queryAll(`
      SELECT ia.itemID, ia.path, ia.contentType, i.key
      FROM itemAttachments ia
      JOIN items i ON ia.itemID = i.itemID
      WHERE ia.parentItemID = ? 
        AND ia.contentType = ?
        AND ia.path IS NOT NULL
    `, [parentItemID, contentType]);

    // Return the first attachment that actually exists
    for (const att of attachments) {
      const fullPath = this.getAttachmentPath(att.itemID);
      if (fullPath && existsSync(fullPath)) {
        return {
          ...att,
          fullPath,
          exists: true
        };
      }
    }

    return null;
  }

  /**
   * Find items with valid (existing) PDF files
   */
  findItemsWithValidPDF(options: {
    title?: string;
    doi?: string;
    requireValidPDF?: boolean;
  }): any[] {
    let items: any[];
    
    if (options.doi) {
      // Search by DOI
      const normalizedDOI = options.doi.replace(/^https?:\/\/doi\.org\//i, '').replace(/^doi:/i, '').trim();
      items = this.queryAll(`
        SELECT DISTINCT i.itemID, i.key, i.dateAdded, iv.value as doi
        FROM items i
        JOIN itemData id ON i.itemID = id.itemID
        JOIN itemDataValues iv ON id.valueID = iv.valueID
        JOIN fields f ON id.fieldID = f.fieldID
        WHERE f.fieldName = 'DOI' AND LOWER(iv.value) = LOWER(?)
      `, [normalizedDOI]);
    } else if (options.title) {
      // Search by title
      items = this.queryAll(`
        SELECT DISTINCT i.itemID, i.key, i.dateAdded, iv.value as title
        FROM items i
        JOIN itemData id ON i.itemID = id.itemID
        JOIN itemDataValues iv ON id.valueID = iv.valueID
        JOIN fields f ON id.fieldID = f.fieldID
        WHERE f.fieldName = 'title' AND iv.value LIKE ?
        LIMIT 50
      `, [`%${options.title}%`]);
    } else {
      return [];
    }

    if (!options.requireValidPDF) {
      return items.map(item => ({
        ...this.getItemDetails(item.itemID),
        hasValidPDF: this.getValidAttachment(item.itemID) !== null
      }));
    }

    // Filter to only items with valid PDF
    const results: any[] = [];
    for (const item of items) {
      const validAttachment = this.getValidAttachment(item.itemID);
      if (validAttachment) {
        results.push({
          ...this.getItemDetails(item.itemID),
          validAttachment
        });
      }
    }
    return results;
  }

  /**
   * Find orphan attachments (records without files)
   */
  findOrphanAttachments(limit: number = 100): any[] {
    const attachments = this.queryAll(`
      SELECT ia.itemID, ia.parentItemID, ia.path, ia.contentType, i.key,
             parent.itemID as parentExists
      FROM itemAttachments ia
      JOIN items i ON ia.itemID = i.itemID
      LEFT JOIN items parent ON ia.parentItemID = parent.itemID
      WHERE ia.path LIKE 'storage:%'
      LIMIT ?
    `, [limit]);

    const orphans: any[] = [];

    for (const att of attachments) {
      const fullPath = this.getAttachmentPath(att.itemID);
      if (!fullPath || !existsSync(fullPath)) {
        orphans.push({
          itemID: att.itemID,
          parentItemID: att.parentItemID,
          key: att.key,
          path: att.path,
          expectedPath: fullPath,
          reason: !fullPath ? 'invalid_path' : 'file_not_found'
        });
      }
    }

    return orphans;
  }

  /**
   * Delete orphan attachment records (use with caution!)
   */
  deleteOrphanAttachments(dryRun: boolean = true): {
    orphans: any[];
    deleted: number;
    dryRun: boolean;
  } {
    const orphans = this.findOrphanAttachments(500);

    if (dryRun || this.readonly) {
      return {
        orphans,
        deleted: 0,
        dryRun: true
      };
    }

    let deleted = 0;
    for (const orphan of orphans) {
      try {
        this.execute('DELETE FROM itemAttachments WHERE itemID = ?', [orphan.itemID]);
        this.execute('DELETE FROM items WHERE itemID = ?', [orphan.itemID]);
        deleted++;
      } catch (error) {
        console.error(`Failed to delete orphan ${orphan.itemID}:`, error);
      }
    }

    return {
      orphans,
      deleted,
      dryRun: false
    };
  }

  /**
   * Merge items by transferring notes and tags from source items to target
   */
  mergeItems(targetItemID: number, sourceItemIDs: number[]): {
    success: boolean;
    transferred: {
      notes: number;
      tags: number;
    };
    errors: string[];
  } {
    const errors: string[] = [];
    let notesTransferred = 0;
    let tagsTransferred = 0;

    // Verify target exists
    const target = this.getItemDetails(targetItemID);
    if (!target) {
      return {
        success: false,
        transferred: { notes: 0, tags: 0 },
        errors: ['Target item not found']
      };
    }

    for (const sourceID of sourceItemIDs) {
      if (sourceID === targetItemID) continue;

      // Transfer notes
      try {
        const notes = this.getItemNotes(sourceID);
        for (const note of notes) {
          this.addItemNote(targetItemID, note.note, `[Merged] ${note.title || ''}`);
          notesTransferred++;
        }
      } catch (error) {
        errors.push(`Failed to transfer notes from ${sourceID}: ${error}`);
      }

      // Transfer tags
      try {
        const tags = this.getItemTags(sourceID);
        for (const tag of tags) {
          this.addTagToItem(targetItemID, tag.name, tag.type);
          tagsTransferred++;
        }
      } catch (error) {
        errors.push(`Failed to transfer tags from ${sourceID}: ${error}`);
      }
    }

    return {
      success: errors.length === 0,
      transferred: {
        notes: notesTransferred,
        tags: tagsTransferred
      },
      errors
    };
  }
}
