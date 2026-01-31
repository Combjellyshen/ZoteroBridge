/**
 * ZoteroBridge MCP 服务器交互式测试
 * 
 * 模拟 MCP 客户端调用，测试完整功能
 * 使用: 
 *   设置环境变量后运行: ZOTERO_DB_PATH=/path/to/zotero.sqlite node test/mcp-test.mjs
 *   或直接运行使用默认路径: node test/mcp-test.mjs
 */

import { homedir } from 'os';
import { join } from 'path';

const ZOTERO_DB_PATH = process.env.ZOTERO_DB_PATH || join(homedir(), 'Zotero', 'zotero.sqlite');

console.log('='.repeat(70));
console.log('ZoteroBridge MCP 服务器功能测试');
console.log('='.repeat(70));

async function runMCPTests() {
  const { ZoteroDatabase } = await import('../dist/database.js');
  const { PDFProcessor } = await import('../dist/pdf.js');
  
  const db = new ZoteroDatabase(ZOTERO_DB_PATH, true);
  await db.connect();
  const pdf = new PDFProcessor(db);
  
  console.log('\n🔗 数据库已连接\n');
  
  const tests = [
    // 基础功能
    { name: '获取数据库信息', fn: () => ({
      path: db.getPath(),
      storagePath: db.getStoragePath(),
      collectionsCount: db.getCollections().length,
      tagsCount: db.getTags().length
    })},
    
    // 集合管理
    { name: '列出所有集合', fn: () => db.getCollections().slice(0, 5) },
    
    // 标签管理
    { name: '列出热门标签', fn: () => db.getTags().sort((a,b) => b.itemCount - a.itemCount).slice(0, 5) },
    
    // 搜索功能
    { name: '搜索 "printing" 相关文献', fn: () => db.searchItems('printing', 3) },
    { name: '搜索 "bioprinting" 相关文献', fn: () => db.searchItems('bioprinting', 3) },
    
    // 全文搜索
    { name: '全文搜索 "DLP"', fn: () => db.searchFulltext('DLP', 1).slice(0, 3) },
    
    // DOI 搜索
    { name: '按 DOI 查找文献', fn: () => {
      const doiItems = db.query(`
        SELECT iv.value as doi FROM itemData id
        JOIN itemDataValues iv ON id.valueID = iv.valueID
        JOIN fields f ON id.fieldID = f.fieldID
        WHERE f.fieldName = 'DOI' LIMIT 1
      `, []);
      if (doiItems.length > 0) {
        const found = db.findItemByDOI(doiItems[0].doi);
        return found ? { doi: doiItems[0].doi, title: found.title } : null;
      }
      return null;
    }},
    
    // 文献详情
    { name: '获取文献详情 (第一个非附件文献)', fn: () => {
      // 找一个真正的文献（非附件）
      const items = db.query(`
        SELECT i.itemID, iv.value as title
        FROM items i
        JOIN itemData id ON i.itemID = id.itemID
        JOIN itemDataValues iv ON id.valueID = iv.valueID
        JOIN fields f ON id.fieldID = f.fieldID
        JOIN itemTypes it ON i.itemTypeID = it.itemTypeID
        WHERE f.fieldName = 'title' 
          AND it.typeName NOT IN ('attachment', 'note')
        LIMIT 1
      `, []);
      if (items.length > 0) {
        return db.getItemDetails(items[0].itemID);
      }
      return null;
    }},
    
    // PDF 附件
    { name: '查找带 PDF 的文献', fn: () => {
      const itemsWithPDF = db.query(`
        SELECT DISTINCT i.itemID, iv.value as title
        FROM items i
        JOIN itemData id ON i.itemID = id.itemID
        JOIN itemDataValues iv ON id.valueID = iv.valueID
        JOIN fields f ON id.fieldID = f.fieldID
        JOIN itemAttachments att ON i.itemID = att.parentItemID
        WHERE f.fieldName = 'title'
          AND att.contentType = 'application/pdf'
        LIMIT 3
      `, []);
      return itemsWithPDF;
    }},
    
    // 注释功能
    { name: '查找带注释的文献', fn: () => {
      const annotatedItems = db.query(`
        SELECT DISTINCT parent.itemID, COUNT(ia.itemID) as annotationCount
        FROM itemAnnotations ia
        JOIN itemAttachments att ON ia.parentItemID = att.itemID
        JOIN items parent ON att.parentItemID = parent.itemID
        GROUP BY parent.itemID
        ORDER BY annotationCount DESC
        LIMIT 3
      `, []);
      return annotatedItems.map(item => ({
        ...item,
        details: db.getItemDetails(item.itemID)
      }));
    }},
    
    // 相似文献
    { name: '查找标签最多的文献及其相似文献', fn: () => {
      const itemWithMostTags = db.query(`
        SELECT it.itemID, COUNT(*) as tagCount
        FROM itemTags it
        GROUP BY it.itemID
        ORDER BY tagCount DESC
        LIMIT 1
      `, []);
      if (itemWithMostTags.length > 0) {
        const itemID = itemWithMostTags[0].itemID;
        const similar = db.findSimilarByTags(itemID, 1);
        return {
          sourceItem: db.getItemDetails(itemID),
          tagCount: itemWithMostTags[0].tagCount,
          similarItems: similar.slice(0, 3)
        };
      }
      return null;
    }}
  ];
  
  for (const test of tests) {
    console.log('-'.repeat(70));
    console.log(`📋 ${test.name}`);
    console.log('-'.repeat(70));
    
    try {
      const result = test.fn();
      console.log(JSON.stringify(result, null, 2));
    } catch (error) {
      console.log(`❌ 错误: ${error.message}`);
    }
    console.log('');
  }
  
  db.disconnect();
  console.log('='.repeat(70));
  console.log('✅ MCP 功能测试完成');
  console.log('='.repeat(70));
}

runMCPTests().catch(console.error);
