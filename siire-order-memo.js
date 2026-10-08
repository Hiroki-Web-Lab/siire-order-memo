(function () {
  'use strict';
  var ROOT_ID = 'siire-order-memo-panel';
  var PREFIX = 'siireOrderMemo.';
  var DEFAULTS = [
    { id: 'chikuzen', name: '筑前', greeting: 'おはよう', closing: 'お願いします' },
    { id: 'marukuni', name: '丸邦', greeting: 'おはよう', closing: 'お願いします' },
    { id: 'agri', name: 'アグリ', greeting: 'おはよう', closing: 'お願いします' },
    { id: 'daido', name: '大同青果', greeting: 'おはよう', closing: 'お願いします' }
  ];
  var LEVELS = ['最低', '中', '最高'];
  function selectQuantity(item, level) { return level === '直接' ? Number(item.quantity) || 0 : Number(item.totals[level]) || 0; }
  function buildMessage(supplier, items) {
    return (supplier.greeting || '') + '\n\n' + items.map(function (item) { return item.name + ' ' + item.quantity; }).join('\n') + '\n\n' + (supplier.closing || '');
  }
  function groupItems(items, suppliers) {
    var groups = {};
    items.forEach(function (item) {
      var quantity = Number(item.quantity) || 0;
      if (!item.checked || quantity <= 0 || !item.supplierId) return;
      (groups[item.supplierId] || (groups[item.supplierId] = [])).push({ name: item.name, quantity: quantity });
    });
    return suppliers.filter(function (s) { return groups[s.id] && groups[s.id].length; }).map(function (supplier) {
      return { supplier: supplier, items: groups[supplier.id], message: buildMessage(supplier, groups[supplier.id]) };
    });
  }
  function safeRead(key, fallback) {
    try { var value = localStorage.getItem(PREFIX + key); return value ? JSON.parse(value) : fallback; } catch (e) { return fallback; }
  }
  function safeWrite(key, value) { try { localStorage.setItem(PREFIX + key, JSON.stringify(value)); } catch (e) {} }
  function cellText(cell) { return cell ? cell.textContent.trim() : ''; }
  function numberValue(value) { var n = Number(String(value || '').replace(/[,\s]/g, '')); return isFinite(n) ? n : 0; }
  function findTotalColumn(table) {
    var heads = table.querySelectorAll('thead tr th');
    var position = 0, total = -1;
    Array.prototype.forEach.call(heads, function (th) {
      var span = Number(th.getAttribute('colspan')) || 1;
      if (cellText(th) === '計') total = position;
      position += span;
    });
    return total;
  }
  function readRowTotal(row, totalColumn, firstRow) {
    var idx = totalColumn - (firstRow ? 0 : 1);
    return numberValue(cellText(row.children[idx]));
  }
  function parseTable(table) {
    var totalColumn = findTotalColumn(table), out = [];
    if (totalColumn < 0) return out;
    var rows = table.querySelectorAll('tbody tr');
    for (var i = 0; i + 3 < rows.length; i += 4) {
      var trs = [rows[i], rows[i + 1], rows[i + 2], rows[i + 3]], first = trs[0].children;
      var nameCell = null, noteCell = null;
      Array.prototype.forEach.call(first, function (td) {
        if (td.getAttribute('rowspan') === '4' && !nameCell) nameCell = td;
        else if (td.getAttribute('rowspan') === '4') noteCell = td;
      });
      if (!nameCell) continue;
      out.push({ name: cellText(nameCell), note: cellText(noteCell), totals: { '最低': readRowTotal(trs[0], totalColumn, true), '中': readRowTotal(trs[1], totalColumn, false), '最高': readRowTotal(trs[2], totalColumn, false) } });
    }
    return out;
  }
  function readItems() {
    var active = false, found = false, items = [];
    Array.prototype.forEach.call(document.querySelectorAll('p, table'), function (el) {
      if (el.tagName === 'P') {
        var text = el.textContent || '';
        if (/仕入担当者名/.test(text)) {
          var bold = el.querySelector('b');
          if (active) active = false;
          if (bold && bold.textContent.trim() === '土物') { active = true; found = true; }
        }
      } else if (active && el.matches('table.table.table-bordered-print-mini')) {
        items = items.concat(parseTable(el));
      }
    });
    return { found: found, items: items };
  }
  function esc(value) { return String(value == null ? '' : value).replace(/[&<>"']/g, function (c) { return ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' })[c]; }); }
  function start() {
    var previous = document.getElementById(ROOT_ID);
    if (previous) previous.remove();
    var suppliers = safeRead('suppliers', null);
    if (!Array.isArray(suppliers)) suppliers = DEFAULTS.map(function (s) { return Object.assign({}, s); });
    var lastSupplier = safeRead('lastSupplierByItem', {});
    var supplierIds = suppliers.map(function (s) { return s.id; });
    var parsed = readItems();
    var items = parsed.items.map(function (it) { var level = '中'; var previous = lastSupplier[it.name] || ''; return Object.assign(it, { level: level, quantity: selectQuantity({ totals: it.totals }, level), checked: selectQuantity({ totals: it.totals }, level) > 0, supplierId: supplierIds.indexOf(previous) >= 0 ? previous : '' }); });
    var panel = document.createElement('section'); panel.id = ROOT_ID;
    panel.innerHTML = '<style>' +
      '#'+ROOT_ID+'{all:initial;position:fixed;z-index:2147483647;inset:0;background:rgba(0,0,0,.42);font:14px/1.4 Arial,sans-serif;color:#222;display:flex;align-items:center;justify-content:center;box-sizing:border-box}'+
      '#'+ROOT_ID+' *,#'+ROOT_ID+' *:before,#'+ROOT_ID+' *:after{box-sizing:border-box}#'+ROOT_ID+' .som-box{all:initial;display:block;background:#fff;color:#222;font:14px/1.4 Arial,sans-serif;width:min(980px,96vw);max-height:94vh;overflow:auto;padding:16px;border-radius:8px;box-shadow:0 4px 24px #333}'+
      '#'+ROOT_ID+' h2{font-size:20px;margin:0 0 12px}#'+ROOT_ID+' button,#'+ROOT_ID+' input,#'+ROOT_ID+' select,#'+ROOT_ID+' textarea{font:inherit;color:#222}#'+ROOT_ID+' button{padding:7px 10px;margin:2px;border:1px solid #888;background:#f5f5f5;border-radius:4px;cursor:pointer}#'+ROOT_ID+' input,#'+ROOT_ID+' select,#'+ROOT_ID+' textarea{padding:6px;border:1px solid #aaa;border-radius:3px;max-width:100%}.som-top{display:flex;gap:4px;flex-wrap:wrap;align-items:center;margin-bottom:10px}.som-item{display:grid;grid-template-columns:24px minmax(130px,1fr) 155px 72px 90px 130px;gap:6px;align-items:center;padding:6px 2px;border-bottom:1px solid #ddd}.som-item small{color:#555}.som-item input[type=number]{width:100%}.som-note{font-size:11px;color:#666}.som-close{float:right}.som-output{border:1px solid #ddd;padding:10px;margin:8px 0}.som-output textarea{display:block;width:100%;min-height:100px;margin:5px 0}.som-settings-row{display:grid;grid-template-columns:1fr 1fr 1fr auto;gap:5px;margin:6px 0}.som-warn{color:#a30}'+
      '@media(max-width:600px){#'+ROOT_ID+' .som-box{width:96vw;padding:10px;overflow-x:hidden}.som-item{grid-template-columns:20px 56px minmax(0,1fr) auto;gap:4px}.som-item>input[type=checkbox]{grid-column:1;grid-row:1}.som-item>span{grid-column:2/4;grid-row:1;min-width:0;overflow-wrap:anywhere}.som-item .som-totals{grid-column:4;grid-row:1;font-size:11px;white-space:nowrap}.som-item .som-level{grid-column:1/3;grid-row:2;min-width:0;width:100%}.som-item .som-qty{grid-column:3;grid-row:2;min-width:0}.som-item .som-supplier{grid-column:4;grid-row:2;min-width:0;width:100%}.som-settings-row{grid-template-columns:1fr 1fr}.som-settings-row button{grid-column:1/3}}' +
      '</style><div class="som-box"><button type="button" class="som-close">閉じる</button><h2>仕入発注メモ</h2><main class="som-main"></main></div>';
    document.body.appendChild(panel);
    var main = panel.querySelector('.som-main');
    panel.querySelector('.som-close').addEventListener('click', function () { panel.remove(); });
    function renderList() {
      main.innerHTML = '<div class="som-top"><span>全品目の段階:</span>'+LEVELS.map(function (l) { return '<button type="button" data-bulk="'+l+'">'+l+'</button>'; }).join('')+'<button type="button" data-settings>仕入先設定</button><button type="button" data-output>出力</button></div>' + (parsed.found ? '' : '<p>「仕入担当者名：土物」ブロックが見つかりません。</p>') + items.map(function (it, i) { return '<div class="som-item"><input type="checkbox" data-check="'+i+'" '+(it.checked?'checked':'')+'><span>'+esc(it.name)+(it.note?'<span class="som-note"> '+esc(it.note)+'</span>':'')+'</span><small class="som-totals">最低 '+it.totals['最低']+' / 中 '+it.totals['中']+' / 最高 '+it.totals['最高']+'</small><select class="som-level" data-level="'+i+'">'+LEVELS.concat(['直接']).map(function(l){return '<option '+(it.level===l?'selected':'')+'>'+l+'</option>';}).join('')+'</select><input class="som-qty" type="number" min="0" step="any" data-qty="'+i+'" value="'+it.quantity+'"><select class="som-supplier" data-supplier="'+i+'"><option value="">仕入先</option>'+suppliers.map(function(s){return '<option value="'+esc(s.id)+'" '+(it.supplierId===s.id?'selected':'')+'>'+esc(s.name)+'</option>';}).join('')+'</select></div>'; }).join('');
      main.querySelectorAll('[data-bulk]').forEach(function(b){b.addEventListener('click',function(){items.forEach(function(it){it.level=b.dataset.bulk;it.quantity=selectQuantity(it,it.level);it.checked=it.quantity>0;});renderList();});});
      main.querySelectorAll('[data-level]').forEach(function(e){e.addEventListener('change',function(){var it=items[+e.dataset.level];it.level=e.value;it.quantity=selectQuantity(it,it.level);it.checked=it.quantity>0;renderList();});});
      main.querySelectorAll('[data-qty]').forEach(function(e){e.addEventListener('input',function(){var it=items[+e.dataset.qty];it.quantity=Number(e.value)||0;it.checked=it.quantity>0;it.level='直接';var sel=main.querySelector('[data-level="'+e.dataset.qty+'"]');if(sel)sel.value='直接';var check=main.querySelector('[data-check="'+e.dataset.qty+'"]');if(check)check.checked=it.checked;});});
      main.querySelectorAll('[data-check]').forEach(function(e){e.addEventListener('change',function(){items[+e.dataset.check].checked=e.checked;});});
      main.querySelectorAll('[data-supplier]').forEach(function(e){e.addEventListener('change',function(){items[+e.dataset.supplier].supplierId=e.value;});});
      main.querySelector('[data-settings]').addEventListener('click', renderSettings);
      main.querySelector('[data-output]').addEventListener('click', renderOutput);
    }
    function renderSettings() {
      main.innerHTML='<h2>仕入先設定</h2>'+suppliers.map(function(s,i){return '<div class="som-settings-row"><input data-sname="'+i+'" aria-label="名前" value="'+esc(s.name)+'"><input data-greet="'+i+'" aria-label="挨拶" value="'+esc(s.greeting)+'"><input data-close="'+i+'" aria-label="締め" value="'+esc(s.closing)+'"><button type="button" data-delete="'+i+'">削除</button></div>';}).join('')+'<button type="button" data-add>追加</button><button type="button" data-save>保存</button><button type="button" data-back>戻る</button>';
      main.querySelectorAll('[data-delete]').forEach(function(b){b.addEventListener('click',function(){suppliers.splice(+b.dataset.delete,1);renderSettings();});});
      main.querySelector('[data-add]').addEventListener('click',function(){suppliers.push({id:'supplier-'+Date.now(),name:'新しい仕入先',greeting:'おはよう',closing:'お願いします'});renderSettings();});
      main.querySelector('[data-save]').addEventListener('click',function(){main.querySelectorAll('[data-sname]').forEach(function(e){var i=+e.dataset.sname;suppliers[i].name=e.value;suppliers[i].greeting=main.querySelector('[data-greet="'+i+'"]').value;suppliers[i].closing=main.querySelector('[data-close="'+i+'"]').value;});safeWrite('suppliers',suppliers);renderList();});
      main.querySelector('[data-back]').addEventListener('click',renderList);
    }
    function renderOutput() {
      var missing=items.filter(function(it){return it.checked&&it.quantity>0&&!suppliers.some(function(s){return s.id===it.supplierId;});}).length;
      items.forEach(function(it){if(it.checked&&it.quantity>0&&it.supplierId)lastSupplier[it.name]=it.supplierId;}); safeWrite('lastSupplierByItem',lastSupplier);
      var groups=groupItems(items,suppliers);
      main.innerHTML='<h2>仕入先別の発注文</h2>'+(missing?'<p class="som-warn">仕入先未選択: '+missing+' 品目</p>':'')+(groups.length?groups.map(function(g,i){return '<section class="som-output"><strong>'+esc(g.supplier.name)+'</strong><textarea data-message="'+i+'">'+esc(g.message)+'</textarea><button type="button" data-copy="'+i+'">コピー</button></section>';}).join(''):'<p>出力対象の品目はありません。</p>')+'<button type="button" data-back>全体表示に戻る</button>';
      main.querySelectorAll('[data-copy]').forEach(function(b){b.addEventListener('click',function(){var ta=main.querySelector('[data-message="'+b.dataset.copy+'"]');if(navigator.clipboard&&navigator.clipboard.writeText){navigator.clipboard.writeText(ta.value).catch(function(){ta.select();document.execCommand('copy');});}else{ta.select();document.execCommand('copy');}});});
      main.querySelector('[data-back]').addEventListener('click',renderList);
    }
    renderList();
  }
  window.SiireOrderMemo = { start: start, _internal: { findTotalColumn: findTotalColumn, readRowTotal: readRowTotal, selectQuantity: selectQuantity, buildMessage: buildMessage, groupItems: groupItems } };
  if (typeof document !== 'undefined' && document.body) start();
}());
