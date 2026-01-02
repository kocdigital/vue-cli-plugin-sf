import path = require('node:path');
import fs = require('node:fs');

import type vueCLIService = require('@vue/cli-service');
import type config = require('@/config');

const {SF_PAGES_ENTRY_FILENAME} = require('@/constants/sf');

/**
 * Generate the import statements script content
 * @param files The files to import
 * @param isAsync Whether to import component async or not
 * @returns The import statements content
 */
function genImports(files: Array<string>, isAsync: boolean): string {
    if (isAsync) {
        return '';
    }

    let content = '';

    files.forEach((file) => {
        const basename = path.basename(file).replace(/\.(jsx?|vue)$/, '');

        content += `import ${basename} from '~root/${file}?shadow';\n`;
        // content += `import ${basename} from '@/${file}?shadow';\n`;
    });

    return content;
}

/**
 * Generate the defineComponent script content
 * @param files The files for defining components
 * @param isAsync Whether to load component async or not
 * @returns The defineComponent script content
 */
function genElements(files: Array<string>, isAsync: boolean): string {
    let content = '';

    files.forEach((file) => {
        const basename = path.basename(file).replace(/\.(jsx?|vue)$/, '');

        if (isAsync) {
            content += `defineComponent(Vue, () => import('~root/${file}?shadow'));\n`;
            // content += `defineComponent(Vue, () => import('@/${file}?shadow'));\n`;
        } else {
            content += `defineComponent(Vue, ${basename});\n`;
        }
    });

    return content;
}

module.exports.resolvePagesEntry = (
    api: vueCLIService.PluginAPI,
    sfConfig: config.SFConfig,
    isAsync = false,
): string => {
    const filePath = path.join(__dirname, SF_PAGES_ENTRY_FILENAME);

    function getDirectories(): Array<string> {
        return fs.readdirSync(api.resolve(`./src/${sfConfig.pagesFolder}`), {withFileTypes: true})
            .filter((dirent) => dirent.isDirectory())
            .map((dirent) => dirent.name);
    }

    const files = getDirectories().map((folder) => `src/${sfConfig.pagesFolder}/${folder}/${folder}.vue`);

    const content = `import '@vue/cli-service/lib/commands/build/setPublicPath';
import defineComponent from '@sf/web-component-wrapper';
import Vue from 'vue';

// runtime shared by every component chunk
import 'css-loader/dist/runtime/api.js';
import 'vue-style-loader/lib/addStylesShadow';
import 'vue-loader/lib/runtime/componentNormalizer';

${genImports(files, isAsync)}
${genElements(files, isAsync)}`.trim();

    fs.writeFileSync(
        filePath,
        content,
        {flag: 'w+'},
    );

    return filePath;
};
