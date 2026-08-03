import fs = require('node:fs');

import type vueCLIService = require('@vue/cli-service');

module.exports.clearMissingAppEntry = function(api: vueCLIService.PluginAPI) {
    api.chainWebpack((chainableConfig) => {
        try {
            const appEntry = chainableConfig.entry('app');

            const appEntryValues = appEntry?.values?.() ?? [];

            if (appEntryValues.length === 0) {
                return;
            }

            const appEntryPaths = appEntryValues.map((appEntryValue) => api.resolve(appEntryValue));
            const anyAppEntryExists = appEntryPaths.some((appEntryPath) => fs.existsSync(appEntryPath));

            if (!anyAppEntryExists) {
                appEntry.clear().end();
            }
        } catch {
            // Silently handle errors - if entry clearing fails, let webpack handle it
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
