import nodePath = require('node:path');

module.exports = {
    isPath(path: string): boolean {
        try {
            nodePath.parse(path);

            return true;
        } catch (error) {
            return false;
        }
    },
    isURL(url: string | URL, base?: string | URL): boolean {
        try {
            // eslint-disable-next-line no-new
            new URL(url, base);

            return true;
        } catch (e) {
            return false;
        }
    },
};
