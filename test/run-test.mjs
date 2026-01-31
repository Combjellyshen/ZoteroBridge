/**
 * ZoteroBridge 测试脚本 - 直接运行版本
 * 
 * 使用: 
 *   设置环境变量后运行: ZOTERO_DB_PATH=/path/to/zotero.sqlite node test/run-test.mjs
 *   或直接运行使用默认路径: node test/run-test.mjs
 */

import { fileURLToPath } from 'url';
import { dirname, join } from 'path';
import { homedir } from 'os';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

// 配置 Zotero 数据库路径 - 优先使用环境变量，否则使用默认路径
const ZOTERO_DB_PATH = process.env.ZOTERO_DB_PATH || join(homedir(), 'Zotero', 'zotero.sqlite');

console.log('='.repeat(60));
console.log('ZoteroBridge 数据库功能测试');
console.log('='.repeat(60));
console.log(`数据库路径: ${ZOTERO_DB_PATH}`);
console.log('');

async function runTests() {
  let db = null;
  
  try {
    // 动态导入编译后的模块
    const { ZoteroDatabase } = await import('../dist/database.js');
    
    // 连接数据库（只读模式）
    console.log('📂 正在连接数据库...');
    db = new ZoteroDatabase(ZOTERO_DB_PATH, true);
    await db.connect();  // 重要：必须调用 connect() 方法
    console.log('✅ 数据库连接成功!\n');

    // 测试 1: 数据库基本信息
    console.log('-'.repeat(40));
    console.log('测试 1: 数据库基本信息');
    console.log('-'.repeat(40));
    console.log(`数据库路径: ${db.getPath()}`);
    console.log(`存储路径: ${db.getStoragePath()}`);
    console.log('');

    // 测试 2: 列出集合
    console.log('-'.repeat(40));
    console.log('测试 2: 列出集合 (前10个)');
    console.log('-'.repeat(40));
    const collections = db.getCollections();
    console.log(`总集合数: ${collections.length}`);
    collections.slice(0, 10).forEach((c, i) => {
      console.log(`  ${i + 1}. [ID:${c.collectionID}] ${c.collectionName}`);
    });
    console.log('');

    // 测试 3: 列出标签
    console.log('-'.repeat(40));
    console.log('测试 3: 列出标签 (前10个)');
    console.log('-'.repeat(40));
    const tags = db.getTags();
    console.log(`总标签数: ${tags.length}`);
    tags.slice(0, 10).forEach((t, i) => {
      console.log(`  ${i + 1}. [ID:${t.tagID}] ${t.name} (${t.itemCount} 篇文献)`);
    });
    console.log('');

    // 测试 4: 搜索文献
    console.log('-'.repeat(40));
    console.log('测试 4: 搜索文献 (通用搜索)');
    console.log('-'.repeat(40));
    const items = db.searchItems('a', 5);
    console.log(`搜索找到 ${items.length} 条结果:`);
    items.forEach((item, i) => {
      const title = item.title || '无标题';
      console.log(`  ${i + 1}. [ID:${item.itemID}] ${title.substring(0, 60)}${title.length > 60 ? '...' : ''}`);
    });
    console.log('');

    // 测试 5: 文献详情
    if (items.length > 0) {
      console.log('-'.repeat(40));
      console.log('测试 5: 获取文献详情');
      console.log('-'.repeat(40));
      const details = db.getItemDetails(items[0].itemID);
      console.log(`文献 ID: ${details.itemID}`);
      console.log(`标题: ${details.title}`);
      console.log(`类型: ${details.itemType}`);
      const creators = details.creators?.map(c => `${c.firstName || ''} ${c.lastName || ''}`).join(', ');
      console.log(`作者: ${creators || '无'}`);
      const abstract = details.abstract || '无';
      console.log(`摘要: ${abstract.substring(0, 100)}${abstract.length > 100 ? '...' : ''}`);
      const tagNames = details.tags?.map(t => t.name).join(', ');
      console.log(`标签: ${tagNames || '无'}`);
      console.log('');

      // 测试 6: PDF 附件
      console.log('-'.repeat(40));
      console.log('测试 6: 获取 PDF 附件');
      console.log('-'.repeat(40));
      const pdfs = db.getPDFAttachments(items[0].itemID);
      console.log(`找到 ${pdfs.length} 个 PDF 附件:`);
      pdfs.forEach((pdf, i) => {
        const fullPath = db.getAttachmentPath(pdf.itemID);
        console.log(`  ${i + 1}. [ID:${pdf.itemID}] ${pdf.title || '未命名'}`);
        console.log(`     路径: ${fullPath || '无法获取'}`);
      });
      console.log('');

      // 测试 7: 注释
      console.log('-'.repeat(40));
      console.log('测试 7: 获取文献注释 (Zotero 7+)');
      console.log('-'.repeat(40));
      const annotations = db.getItemAnnotations(items[0].itemID);
      console.log(`找到 ${annotations.length} 条注释:`);
      annotations.slice(0, 5).forEach((ann, i) => {
        console.log(`  ${i + 1}. [${ann.annotationType}] 颜色: ${ann.annotationColor || '无'}`);
        const text = ann.annotationText || '无文本';
        console.log(`     内容: ${text.substring(0, 50)}${text.length > 50 ? '...' : ''}`);
      });
      console.log('');

      // 测试 8: 相似文献
      console.log('-'.repeat(40));
      console.log('测试 8: 查找相似文献 (按标签)');
      console.log('-'.repeat(40));
      const similar = db.findSimilarByTags(items[0].itemID, 1);
      console.log(`找到 ${similar.length} 篇相似文献 (前5篇):`);
      similar.slice(0, 5).forEach((s, i) => {
        const title = s.title || '无标题';
        console.log(`  ${i + 1}. [共${s.commonTagCount}标签] ${title.substring(0, 50)}${title.length > 50 ? '...' : ''}`);
      });
      console.log('');
    }

    // 测试 9: 全文搜索
    console.log('-'.repeat(40));
    console.log('测试 9: 全文索引搜索');
    console.log('-'.repeat(40));
    const fulltextResults = db.searchFulltext('the', 1);
    console.log(`全文搜索结果: ${fulltextResults.length} 条 (前3条):`);
    fulltextResults.slice(0, 3).forEach((r, i) => {
      console.log(`  ${i + 1}. [ID:${r.itemID}] 索引: ${r.indexedPages || 0}/${r.totalPages || 0} 页`);
    });
    console.log('');

    // 测试 10: DOI 搜索
    console.log('-'.repeat(40));
    console.log('测试 10: DOI 搜索功能');
    console.log('-'.repeat(40));
    const doiItems = db.query(`
      SELECT iv.value as doi
      FROM itemData id
      JOIN itemDataValues iv ON id.valueID = iv.valueID
      JOIN fields f ON id.fieldID = f.fieldID
      WHERE f.fieldName = 'DOI'
      LIMIT 1
    `, []);
    
    if (doiItems.length > 0) {
      const testDOI = doiItems[0].doi;
      console.log(`测试 DOI: ${testDOI}`);
      const foundByDOI = db.findItemByDOI(testDOI);
      console.log(`查找结果: ${foundByDOI ? '✅ 找到' : '❌ 未找到'}`);
      if (foundByDOI) {
        console.log(`  标题: ${foundByDOI.title?.substring(0, 60) || '无'}...`);
      }
    } else {
      console.log('数据库中没有带 DOI 的文献');
    }
    console.log('');

    // 完成
    console.log('='.repeat(60));
    console.log('✅ 所有测试完成!');
    console.log('='.repeat(60));

  } catch (error) {
    console.error('❌ 测试出错:', error);
    console.error(error.stack);
  } finally {
    if (db) {
      db.disconnect();
      console.log('\n📂 数据库连接已关闭');
    }
  }
}

runTests();
