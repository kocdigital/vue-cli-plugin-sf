import fs = require('node:fs');
import path = require('node:path');

import type vueCLIService = require('@vue/cli-service');
const {warn, error} = require('@vue/cli-shared-utils');

const validator = require('@/utils/validator');
const {SF_CONFIG_FILENAME, DEFAULT_SF_CONFIG} = require('@/constants/sf');

export interface SFConfig {
    /**
     * Pages folder name relative to `<projectRoot>/src` directory
     *
     * Full path: `<projectRoot>/src/${pagesFolder}`
     *
     * @example "views"
     */
    pagesFolder: string;
    /**
     * Mainframe zip file base URL
     *
     * Full mainframe zip URL: `${mainFrameUrl}/mainframe_xpublic.zip`
     *
     * @example "https://p360test.kocdigital.com"
     */
    mainFrameUrl: string | URL;
}

export function validateConfig(config: SFConfig): boolean {
    let isValid = true;

    if (!config.pagesFolder || typeof config.pagesFolder !== 'string') {
        error('[sf] invalid "pagesFolder" config, must be a non-empty string.');
        isValid = false;
    } else if (!fs.existsSync(path.resolve(`src/${config.pagesFolder}`))) {
        warn(`[sf] "pagesFolder" directory not found: "src/${config.pagesFolder}"`);
        isValid = false;
    }

    if (!config.mainFrameUrl || !validator.isURL(config.mainFrameUrl)) {
        error('[sf] invalid "mainFrameUrl" config, must be a valid URL.');
        isValid = false;
    }

    return isValid;
}

export function defineConfig(config: SFConfig) {
    return config;
}

export function mergeConfig(...configs: Array<Partial<SFConfig>>): SFConfig {
    const mergedConfig: SFConfig = Object.assign({}, ...configs);

    return mergedConfig;
}

export function resolveConfig(api: vueCLIService.PluginAPI): SFConfig {
    const sfConfigPath = api.resolve(SF_CONFIG_FILENAME);

    if (!fs.existsSync(sfConfigPath)) {
        error(`[sf] config file not found in: "${sfConfigPath}"`);

        return DEFAULT_SF_CONFIG;
    }

    const sfConfig: SFConfig = require(sfConfigPath);

    const isValid = validateConfig(sfConfig);

    if (!isValid) {
        error(`[sf] invalid config in: "${sfConfigPath}"`);
    }

    return sfConfig;
}
