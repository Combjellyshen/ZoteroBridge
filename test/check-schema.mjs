/**
 * 检查 Zotero 数据库表结构
 * 
 * 使用: ZOTERO_DB_PATH=/path/to/zotero.sqlite node test/check-schema.mjs
 */

import { homedir } from 'os';
import { join } from 'path';

const ZOTERO_DB_PATH = process.env.ZOTERO_DB_PATH || join(homedir(), 'Zotero', 'zotero.sqlite');

async function checkSchema() {
  const { ZoteroDatabase } = await import('../dist/database.js');
  
  const db = new ZoteroDatabase(ZOTERO_DB_PATH, true);
  await db.connect();
  
  console.log('检查 fulltextItemWords 表结构:');
  try {
    const schema = db.query("PRAGMA table_info(fulltextItemWords)", []);
    console.log(schema);
  } catch (e) {
    console.log('表不存在');
  }
  
  console.log('\n所有表列表:');
  const tables = db.query("SELECT name FROM sqlite_master WHERE type='table' ORDER BY name", []);
  tables.forEach(t => console.log('  ' + t.name));
  
  console.log('\n检查 itemDataValues 和 fields 表:');
  console.log('itemDataValues:');
  const idv = db.query("PRAGMA table_info(itemDataValues)", []);
  console.log(idv);
  
  console.log('\nitems 表:');
  const items = db.query("PRAGMA table_info(items)", []);
  console.log(items);
  
  db.disconnect();
}

checkSchema().catch(console.error);
