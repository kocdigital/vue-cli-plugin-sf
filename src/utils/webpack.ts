import fs = require('node:fs');

import type vueCLIService = require('@vue/cli-service');

module.exports.clearMissingAppEntry = function(api: vueCLIService.PluginAPI) {
    api.chainWebpack((chainableConfig) => {
        const appEntry = chainableConfig.entry('app');

        const appEntryPaths = appEntry.values().map((appEntryValue) => api.resolve(appEntryValue));
        const anyAppEntryExists = appEntryPaths.some((appEntryPath) => fs.existsSync(appEntryPath));

        if (!anyAppEntryExists) {
            appEntry.clear();
        }
    });
};

module.exports.addRootAlias = function(api: vueCLIService.PluginAPI) {
    // add `~root` alias for `<projectRoot>`
    api.chainWebpack((chainableConfig) => {
        chainableConfig.resolve.alias
            .set('~root', api.resolve('.'))
            .end();
    });
};
