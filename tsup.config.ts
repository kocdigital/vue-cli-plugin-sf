import {defineConfig} from 'tsup';

export default defineConfig({
    entry: {
        index: 'src/index.ts',
        config: 'src/config.ts',
        'sf-pages-entry': 'src/sf-pages-entry.ts',
    },
    clean: true,
    format: ['cjs'],
    dts: true,
    splitting: false,
});
