'use strict';
const fs = require('node:fs');
const vm = require('node:vm');
const html = fs.readFileSync('public/index.html','utf8');
const moduleSource = fs.readFileSync('public/icv-contracts.js','utf8');
new vm.Script(moduleSource,{filename:'public/icv-contracts.js'});
const inline = [...html.matchAll(/<script\b(?![^>]*\bsrc=)[^>]*>([\s\S]*?)<\/script>/gi)];
inline.forEach((m,i) => new vm.Script(m[1].replace(/^\s*<!--.*?-->\s*$/gm,''),{filename:'index-inline-'+i+'.js'}));
for (const token of ['data-page="contracts"','id="page-contracts"','src="icv-contracts.js?v=20261022-02"','contracts: "العقود والمؤشرات"','src="icv-i18n.js?v=20261022-01"']) {
 if (!html.includes(token)) throw new Error('Missing integration token in index.html: '+token);
}

function assert(condition, message) {
 if (!condition) throw new Error('Contract import assertion failed: ' + message);
}
const hook = `
  globalThis.__icvContractsTest = {
    state,
    importBuildCandidates,
    importWideSupplierIndices,
    importNormalize,
    IMPORT_RULES
  };
})();`;
const testSource = moduleSource.slice(0, moduleSource.lastIndexOf('})();')) + hook;
const sandbox = {
  window: {icvPages:{}},
  localStorage: {getItem:()=> 'ar'},
  console,
  Date,
};
vm.runInNewContext(testSource, sandbox, {filename:'contracts-import-test-harness.js'});
const harness=sandbox.__icvContractsTest;
const state=harness.state;
function runImport(sheetName, rows, entities, companies) {
 state.entities=entities; state.companies=companies; state.records=[];
 state.importSheets=[{actualName:sheetName,rule:harness.IMPORT_RULES.find(x=>harness.importNormalize(x.sheet)===harness.importNormalize(sheetName)),rows}];
 state.importSelectedSheets=[sheetName];
 harness.importBuildCandidates();
 return {candidates:state.importCandidates,stats:state.importStats,warnings:state.importWarnings};
}

// Vehicle framework columns begin after four fixed columns, not at the first non-date field.
// A positive supplier amount must map to the named supplier and not interpret entity/title values as vendors.
const vehicle=runImport('العقد الإطاري للمركبات',[
 ['م','الجهة','اسم العقد','رقم المناقصة','الحشار للسيارات','الشركة العامة للسيارات','شركة عمان للخدمات والتسويق ش م م','إجمالي تكلفة صنع في عمان','المحتوى المحلي *0.7','إجمالي تكلفة المورد المحلي','المحتوى المحلي*0.18','اجمالي الطلب في العقد للجهة','اجمالي المحتوى المحلي في العقد','نسبة المحتوى المحلي في العقد','الملاحظات'],
 [1,'المجلس الأعلى للقضاء','العقد الإطاري للمركبات','102/2023',604857,0,0,604857,423399.9,0,0,604857,423399.9,0.7,null]
], [{id:'entity-1',name:'المجلس الأعلى للقضاء'}], [{id:'company-1',name:'الحشار للسيارات'}]);
assert(vehicle.stats.newRecords===1,'vehicle framework should create one master agreement');
assert(vehicle.stats.participations===1,'vehicle framework should create one supplier participation');
assert(vehicle.candidates[0].participations[0].company_id==='company-1','vehicle supplier column must resolve to its named company');
assert(vehicle.candidates[0].participations[0].spend_amount===604857,'vehicle supplier amount should be preserved');
assert(vehicle.candidates[0].contract.current_spend===604857,'vehicle participation total must not double-count framework order totals');

// IT framework supplier columns start at I because five additional metadata columns exist.
const it=runImport('العقد الإطاري لتقنية المعلومات',[
 ['م','الجهة','اسم العقد','رقم المناقصة','المجال','حالة العقد','تاريخ البدء','تاريخ الانتهاء','بهوان للمشروعات والاتصالات','أعالي البحار للأعمال الآلية','أفق المسار العالمية للتجارة','إجمالي تكلفة صنع في عمان','المحتوى المحلي *0.7','إجمالي تكلفة المورد المحلي','المحتوى المحلي*0.18','اجمالي الطلب في العقد','اجمالي المحتوى المحلي في العقد','نسبة المحتوى المحلي في العقد','الملاحظات'],
 [1,'المجلس الأعلى للقضاء','العقد الإطاري لتوريد أجهزة الحاسب الآلي','12/2024/GSTB','تقنية المعلومات','قيد التنفيذ','2024-10-24','2026-10-24',315327.6,0,0,315327.6,0,0,0,315327.6,0,0,null]
], [{id:'entity-1',name:'المجلس الأعلى للقضاء'}], [{id:'company-2',name:'بهوان للمشروعات والاتصالات'}]);
assert(it.stats.newRecords===1,'IT framework should create one master agreement');
assert(it.stats.participations===1,'IT framework should create one supplier participation');
assert(it.candidates[0].participations[0].company_id==='company-2','IT supplier column must begin at I');
assert(it.candidates[0].participations[0].spend_amount===315327.6,'IT supplier amount should be preserved');

// The supplies tab has no contract title column: the importer should form a useful title from its available fields.
const supplies=runImport('التوريدات',[
 ['م','الجهة','الشركة المنفذة','نوع الشركة','رقم المناقصة','نوع المناقصة','قيمة العقد','إجمالي تكلفة صنع في عمان','المحتوى المحلي *0.7','إجمالي تكلفة المورد المحلي','المحتوى المحلي*0.18','إجمالي تكلفة الإستيراد المباشر','المحتوى المحلي*0.06','إجمالي تكلفة المزود في العقد','المحتوى المحلي للمزود*0.7','إجمالي التكلفة في العقد','إجمالي المحتوى المحلي في العقد','نسبة المحتوى المحلي','الملاحظات'],
 [1,'وزارة التربية والتعليم','شركة اختبار التوريد','SME','67/2023','توريد كتب',1000,500,350,200,36,100,6,200,140,1000,532,0.532,null]
], [{id:'entity-2',name:'وزارة التربية والتعليم'}], [{id:'company-3',name:'شركة اختبار التوريد'}]);
assert(supplies.stats.newRecords===1,'supplies sheet should be supported without a name column');
assert(supplies.candidates[0].contract.title.includes('شركة اختبار التوريد'),'supplies title should use source fields');
assert(supplies.candidates[0].contract.contract_value===1000,'supplies contract value should be read');

console.log('Contract UI/router checks and representative Excel sheet-mapping tests passed.');

