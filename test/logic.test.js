'use strict';
const assert = require('assert');
const fs = require('fs');
const vm = require('vm');
const src = fs.readFileSync(require('path').join(__dirname, '..', 'siire-order-memo.js'), 'utf8');
const window = {};
vm.runInNewContext(src, { window, document: {}, localStorage: {}, console });
const api = window.SiireOrderMemo._internal;
const headers = [{textContent:'仕入対象アイテム', getAttribute:n=>n==='colspan'?'2':null},{textContent:'A',getAttribute:()=>null},{textContent:'B',getAttribute:()=>null},{textContent:'計',getAttribute:()=>null},{textContent:'備考',getAttribute:()=>null}];
assert.strictEqual(api.findTotalColumn({querySelectorAll:()=>headers}), 4, '見出し列を colspan 込みで解決');
const cells = values => values.map(textContent => ({textContent, getAttribute:()=>null}));
const firstRow = {children:cells(['名前','最低','1','2','7','備考'])};
const laterRow = {children:cells(['中','1','2','8'])};
assert.strictEqual(api.readRowTotal(firstRow, 4, true), 7, '1行目は計列 idx を読む');
assert.strictEqual(api.readRowTotal(laterRow, 4, false), 8, '2〜4行目は計列 idx-1 を読む');
const item = { name:'合成品', totals:{'最低':0,'中':3,'最高':5}, quantity:9 };
assert.strictEqual(api.selectQuantity(item, '最低'), 0);
assert.strictEqual(api.selectQuantity(item, '中'), 3);
assert.strictEqual(api.selectQuantity(item, '最高'), 5);
assert.strictEqual(api.selectQuantity(item, '直接'), 9);
const suppliers = [{id:'a',name:'筑前',greeting:'おはよう',closing:'お願いします'},{id:'b',name:'丸邦',greeting:'こんにちは',closing:'どうぞ'}];
const grouped = api.groupItems([
  {name:'ゼロ品',quantity:0,checked:true,supplierId:'a'},
  {name:'除外品',quantity:2,checked:false,supplierId:'a'},
  {name:'根菜A',quantity:3,checked:true,supplierId:'a'},
  {name:'根菜B',quantity:4,checked:true,supplierId:'b'}
], suppliers);
assert.strictEqual(grouped.length, 2);
assert.strictEqual(grouped[0].message, 'おはよう\n\n根菜A 3\n\nお願いします');
assert.strictEqual(grouped[1].message, 'こんにちは\n\n根菜B 4\n\nどうぞ');
assert(!grouped[0].message.includes('ゼロ品'), '数量0は出力しない');
console.log('logic tests passed');
