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
console.log('Contracts module syntax, all inline scripts, and navigation integration passed.');
