import fs = require('node:fs');

/**
 * Get the size of a file if it exists, otherwise return 0
 * @param filePath Path to the file
 * @returns File size in bytes, or 0 if file does not exist
 */
function getFileSystemFileSize(filePath: string): number {
    if (fs.existsSync(filePath)) {
        const stats = fs.statSync(filePath);

        return stats.size;
    }

    return 0;
}

module.exports = {
    getFileSystemFileSize,
};
