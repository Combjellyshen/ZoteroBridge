#!/usr/bin/env npx ts-node

/**
 * ZoteroBridge Database Test Script
 * 
 * 隔离环境测试脚本 - 直接测试数据库功能
 * 
 * 使用方法: 
 *   设置环境变量后运行: ZOTERO_DB_PATH=/path/to/zotero.sqlite npx ts-node test/test-database.ts
 *   或直接运行使用默认路径: npx ts-node test/test-database.ts
 */

import { ZoteroDatabase } from '../src/database.js';
import { PDFProcessor } from '../src/pdf.js';
import { homedir } from 'os';
import { join } from 'path';

// 配置 Zotero 数据库路径 - 优先使用环境变量，否则使用默认路径
const ZOTERO_DB_PATH = process.env.ZOTERO_DB_PATH || join(homedir(), 'Zotero', 'zotero.sqlite');

console.log('='.repeat(60));
console.log('ZoteroBridge 数据库测试');
console.log('='.repeat(60));
console.log(`数据库路径: ${ZOTERO_DB_PATH}`);
console.log('');

async function runTests() {
  let db: ZoteroDatabase | null = null;
  
  try {
    // 连接数据库（只读模式，安全测试）
    console.log('📂 正在连接数据库...');
    db = new ZoteroDatabase(ZOTERO_DB_PATH, true);
    console.log('✅ 数据库连接成功!\n');

    // 测试 1: 获取数据库信息
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
    collections.slice(0, 10).forEach((c: any, i: number) => {
      console.log(`  ${i + 1}. [ID:${c.collectionID}] ${c.collectionName}`);
    });
    console.log('');

    // 测试 3: 列出标签
    console.log('-'.repeat(40));
    console.log('测试 3: 列出标签 (前10个)');
    console.log('-'.repeat(40));
    const tags = db.getTags();
    console.log(`总标签数: ${tags.length}`);
    tags.slice(0, 10).forEach((t: any, i: number) => {
      console.log(`  ${i + 1}. [ID:${t.tagID}] ${t.name} (${t.itemCount} 篇文献)`);
    });
    console.log('');

    // 测试 4: 搜索文献
    console.log('-'.repeat(40));
    console.log('测试 4: 搜索文献');
    console.log('-'.repeat(40));
    const searchQuery = 'a'; // 通用搜索词
    const items = db.searchItems(searchQuery, 5);
    console.log(`搜索 "${searchQuery}" 找到 ${items.length} 条结果 (限制5条):`);
    items.forEach((item: any, i: number) => {
      console.log(`  ${i + 1}. [ID:${item.itemID}] ${item.title?.substring(0, 50) || '无标题'}...`);
    });
    console.log('');

    // 测试 5: 获取文献详情（如果有搜索结果）
    if (items.length > 0) {
      console.log('-'.repeat(40));
      console.log('测试 5: 获取文献详情');
      console.log('-'.repeat(40));
      const firstItem = items[0];
      const details = db.getItemDetails(firstItem.itemID);
      console.log(`文献 ID: ${details.itemID}`);
      console.log(`标题: ${details.title}`);
      console.log(`类型: ${details.itemType}`);
      console.log(`作者: ${details.creators?.map((c: any) => `${c.firstName || ''} ${c.lastName || ''}`).join(', ') || '无'}`);
      console.log(`摘要: ${details.abstract?.substring(0, 100) || '无'}...`);
      console.log(`标签: ${details.tags?.map((t: any) => t.name).join(', ') || '无'}`);
      console.log('');

      // 测试 6: 获取 PDF 附件
      console.log('-'.repeat(40));
      console.log('测试 6: 获取 PDF 附件');
      console.log('-'.repeat(40));
      const pdfs = db.getPDFAttachments(firstItem.itemID);
      console.log(`找到 ${pdfs.length} 个 PDF 附件:`);
      pdfs.forEach((pdf: any, i: number) => {
        const fullPath = db!.getAttachmentPath(pdf.itemID);
        console.log(`  ${i + 1}. [ID:${pdf.itemID}] ${pdf.title || '未命名'}`);
        console.log(`     路径: ${fullPath || '无法获取'}`);
      });
      console.log('');

      // 测试 7: 获取注释（Zotero 7 功能）
      console.log('-'.repeat(40));
      console.log('测试 7: 获取文献注释');
      console.log('-'.repeat(40));
      const annotations = db.getItemAnnotations(firstItem.itemID);
      console.log(`找到 ${annotations.length} 条注释:`);
      annotations.slice(0, 5).forEach((ann: any, i: number) => {
        console.log(`  ${i + 1}. [${ann.annotationType}] ${ann.annotationColor || '无颜色'}`);
        console.log(`     文本: ${ann.annotationText?.substring(0, 50) || '无'}...`);
        if (ann.annotationComment) {
          console.log(`     评论: ${ann.annotationComment.substring(0, 50)}...`);
        }
      });
      console.log('');

      // 测试 8: 查找相似文献
      console.log('-'.repeat(40));
      console.log('测试 8: 查找相似文献 (按标签)');
      console.log('-'.repeat(40));
      const similar = db.findSimilarByTags(firstItem.itemID, 1);
      console.log(`找到 ${similar.length} 篇相似文献:`);
      similar.slice(0, 5).forEach((s: any, i: number) => {
        console.log(`  ${i + 1}. [ID:${s.itemID}] 共同标签: ${s.commonTagCount}`);
        console.log(`     标题: ${s.title?.substring(0, 50) || '无'}...`);
      });
      console.log('');
    }

    // 测试 9: 全文搜索
    console.log('-'.repeat(40));
    console.log('测试 9: 全文索引搜索');
    console.log('-'.repeat(40));
    const fulltextResults = db.searchFulltext('the', 1);
    console.log(`全文搜索结果: ${fulltextResults.length} 条`);
    fulltextResults.slice(0, 3).forEach((r: any, i: number) => {
      console.log(`  ${i + 1}. [ID:${r.itemID}] 索引页数: ${r.indexedPages}/${r.totalPages}`);
    });
    console.log('');

    // 测试 10: DOI/ISBN 搜索
    console.log('-'.repeat(40));
    console.log('测试 10: 标识符搜索功能 (DOI/ISBN)');
    console.log('-'.repeat(40));
    // 尝试查找任意一个有 DOI 的文献
    const doiItem = db.query(`
      SELECT iv.value as doi
      FROM itemData id
      JOIN itemDataValues iv ON id.valueID = iv.valueID
      JOIN fields f ON id.fieldID = f.fieldID
      WHERE f.fieldName = 'DOI'
      LIMIT 1
    `, []);
    if (doiItem.length > 0) {
      const testDOI = (doiItem[0] as any).doi;
      console.log(`测试 DOI: ${testDOI}`);
      const foundByDOI = db.findItemByDOI(testDOI);
      console.log(`查找结果: ${foundByDOI ? '✅ 找到' : '❌ 未找到'}`);
      if (foundByDOI) {
        console.log(`  标题: ${foundByDOI.title?.substring(0, 50)}...`);
      }
    } else {
      console.log('数据库中没有带 DOI 的文献');
    }
    console.log('');

    // 测试完成
    console.log('='.repeat(60));
    console.log('✅ 所有测试完成!');
    console.log('='.repeat(60));

  } catch (error) {
    console.error('❌ 测试出错:', error);
  } finally {
    if (db) {
      db.disconnect();
      console.log('📂 数据库连接已关闭');
    }
  }
}

runTests();
