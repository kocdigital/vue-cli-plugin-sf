import type minimist = require('minimist');
import type vueCLIService = require('@vue/cli-service');

const serveCommandFn = require('@/commands/serve');
const buildCommandFn = require('@/commands/build');

const {clearMissingAppEntry, addRootAlias} = require('@/utils/webpack');

module.exports = (api: vueCLIService.PluginAPI, options: vueCLIService.ProjectOptions): void => {
    clearMissingAppEntry(api);
    addRootAlias(api);

    const {serve, build} = api.service.commands;

    const originalServeFn = serve.fn;
    const originalBuildFn = build.fn;

    serve.fn = async (args: minimist.ParsedArgs, rawArgv: Array<string>): Promise<void> => {
        await serveCommandFn(
            api,
            options,
            args,
            rawArgv,
        );

        return originalServeFn(args, rawArgv);
    };

    build.fn = async (args: minimist.ParsedArgs, rawArgv: Array<string>): Promise<void> => {
        await buildCommandFn(
            api,
            options,
            args,
            rawArgv,
        );

        return originalBuildFn(args, rawArgv);
    };
};
