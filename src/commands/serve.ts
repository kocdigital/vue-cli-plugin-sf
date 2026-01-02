import fs = require('node:fs');
import path = require('node:path');

import type minimist = require('minimist');
import type vueCLIService = require('@vue/cli-service');
import type config = require('@/config');

const {resolveConfig} = require('@/config');
const {
    MAINFRAME_DIR,
    MAINFRAME_ZIP_FILENAME,
} = require('@/constants/mainframe');
const {
    downloadMainframeZip,
    extractMainframeZip,
} = require('@/utils/mainframe');
const {resolvePagesEntry} = require('./build/resolvePages');

module.exports = async (
    api: vueCLIService.PluginAPI,
    options: vueCLIService.ProjectOptions,
    args: minimist.ParsedArgs,
    rawArgv: Array<string>,
): Promise<void> => {
    const entry: string | undefined = args.entry || args._[0];
    const isAsync = /async/.test(args.target);

    const sfConfig: config.SFConfig = resolveConfig(api);

    const nodeModulesDir = api.resolve('node_modules');
    const nodeModulesCacheDir = path.join(nodeModulesDir, '.cache');

    if (!fs.existsSync(nodeModulesCacheDir)) {
        fs.mkdirSync(nodeModulesCacheDir, {recursive: true});
    }

    /**
     * @example
     * 'https://example.com/mainframe_xpublic.zip'
     * 'https://example.com/sub/path/mainframe_xpublic.zip'
     * 'http://example.local/mainframe_xpublic.zip'
     * 'http://example.local/sub/path/mainframe_xpublic.zip'
     */
    const mainframeURL = new URL(MAINFRAME_ZIP_FILENAME, sfConfig?.mainFrameUrl);
    /**
     * @example '<projectRoot>/node_modules/.cache/mainframe_xpublic.zip'
     */
    const mainframeZipPath = path.join(nodeModulesCacheDir, MAINFRAME_ZIP_FILENAME);
    /**
     * @example '<projectRoot>/node_modules/.cache/mainframe/'
     */
    const mainframeExtractDir = path.join(nodeModulesCacheDir, MAINFRAME_DIR);

    if (!fs.existsSync(mainframeExtractDir)) {
        fs.mkdirSync(mainframeExtractDir, {recursive: true});
    }

    await downloadMainframeZip(mainframeURL, mainframeZipPath);
    await extractMainframeZip(mainframeZipPath, mainframeExtractDir);

    api.chainWebpack((chainableConfig) => {
        if (entry) {
            chainableConfig.entry('app').clear().add(api.resolve(entry)).end();
        } else {
            const dynamicEntry = resolvePagesEntry(
                api,
                sfConfig,
                isAsync,
            );

            chainableConfig.entry('index').add(dynamicEntry).end();
        }

        chainableConfig
            .plugin('html')
            .tap((args) => {
                const options = args[0];

                options.template = `${mainframeExtractDir}/index.html`;

                return args;
            })
            .end();

        chainableConfig
            .plugin('copy')
            .tap((args) => {
                const patterns = args[0];

                if (patterns && patterns[0]) {
                    patterns[0].force = true;
                }

                patterns.push({
                    from: mainframeExtractDir,
                    to: api.resolve(options.outputDir || 'dist'),
                    toType: 'dir',
                });

                return args;
            })
            .end();
    });
};
