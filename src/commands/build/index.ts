import globby = require('globby');
import type minimist = require('minimist');
import type vueCLIService = require('@vue/cli-service');
import type config = require('@/config');

const {log, warn, error} = require('@vue/cli-shared-utils');
const {fileToComponentName} = require('@vue/cli-service/lib/commands/build/resolveWcEntry');
const {resolveConfig} = require('@/config');
const {resolvePagesEntry} = require('./resolvePages');
function abort(msg: string) {
    log();
    error(msg);
    process.exit(1);
}

module.exports = async (
    api: vueCLIService.PluginAPI,
    options: vueCLIService.ProjectOptions,
    args: minimist.ParsedArgs,
    rawArgv: Array<string>,
): Promise<void> => {
    if (
        args.target !== 'wc' &&
        args.target !== 'wc-async'
    ) {
        warn('[sf] only supports "wc" or "wc-async" build targets, skipping...');

        return;
    }

    const sfConfig: config.SFConfig = resolveConfig(api);

    const entry: string = args.entry || args._[0] || 'src/App.vue';
    const name: string = args.name;
    const isAsync = /async/.test(args.target);
    const cwd = api.resolve('.');

    // generate dynamic entry based on glob files
    const entryFiles = globby.sync(entry.split(','), {cwd});

    if (!entryFiles.length) {
        abort(`entry pattern "${entry}" did not match any files.`);
    }

    let libName: string;
    if (entryFiles.length === 1) {
        // in single mode, determine the lib name from filename
        libName = name || fileToComponentName('', entryFiles[0]).kebabName;
        if (libName.indexOf('-') < 0) {
            abort('--name must contain a hyphen when building a single web component.');
        }
    } else {
        // multi mode
        libName = (name || api.service.pkg.name);
        if (!libName) {
            abort('--name is required when building multiple web components.');
        }
    }

    const dynamicEntry = resolvePagesEntry(
        api,
        sfConfig,
        isAsync,
    );

    const entryName = `${libName}.min`;

    api.chainWebpack((chainableConfig) => {
        chainableConfig.entry(entryName).add(dynamicEntry).end();
    });
};
