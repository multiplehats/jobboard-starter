import { compile } from '@inlang/paraglide-js';

await compile({
	project: './project.inlang',
	outdir: './src/lib/paraglide',
	outputStructure: 'locale-modules'
});

console.log('✅ Paraglide compiled successfully with locale-modules structure');
