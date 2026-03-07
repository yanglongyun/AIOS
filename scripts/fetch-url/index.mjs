#!/usr/bin/env node

import { JSDOM } from 'jsdom';

const args = process.argv.slice(2);

if (args.length === 0) {
  console.error('用法: node index.mjs <url>');
  process.exit(1);
}

const url = args[0];

console.log(`正在获取: ${url}`);

try {
  const response = await fetch(url, {
    headers: {
      'User-Agent': 'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36',
    }
  });
  
  const html = await response.text();
  
  // 解析 HTML 获取文本内容
  const dom = new JSDOM(html);
  const document = dom.window.document;
  
  // 移除 script、style、noscript、iframe 等标签
  const removeTags = ['script', 'style', 'noscript', 'iframe', 'nav', 'header', 'footer'];
  removeTags.forEach(tag => {
    document.querySelectorAll(tag).forEach(el => el.remove());
  });
  
  // 获取 body 或 main 内容
  const body = document.querySelector('body');
  let text = body ? body.textContent : '';
  
  // 清理多余空白
  text = text.replace(/\s+/g, ' ').trim();
  
  // 限制长度
  const maxLen = 8000;
  if (text.length > maxLen) {
    text = text.substring(0, maxLen) + '... [截断]';
  }
  
  console.log('\n========== 网页内容 ==========\n');
  console.log(text);
  console.log('\n================================\n');
  
} catch (error) {
  console.error('获取失败:', error.message);
  process.exit(1);
}
