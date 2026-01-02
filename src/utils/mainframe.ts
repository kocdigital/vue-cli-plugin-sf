import http = require('node:http');
import https = require('node:https');
import fs = require('node:fs');

import AdmZip = require('adm-zip');
const {warn} = require('@vue/cli-shared-utils');

/**
 * Download the ZIP file into {@link destinationPath destination path}
 * @param zipURLOrPath ZIP file URL or full URL
 * @example
 * "https://example.com/myzip.zip"
 * new URL("/mainframe_xpublic.zip", "https://example.com")
 *
 * @param destinationPath Downloaded mainframe ZIP file destination path
 * @example`<projectRoot>/node_modules/.cache/mainframe_xpublic.zip`
 */
module.exports.downloadMainframeZip = function(zipURLOrPath: URL | string, destinationPath: string): Promise<void> {
    return new Promise<void>((resolve, reject) => {
        const terminalWidth = process.stdout.columns || 80;
        const BASE_DOWNLOAD_MESSAGE = 'Downloading MainFrame Xpublic Zip: 100.00% []';
        const MIN_BAR_LENGTH = 10;
        const percentFormatter = new Intl.NumberFormat('en-US', {
            style: 'percent',
            minimumFractionDigits: 2,
            maximumFractionDigits: 2,
        });

        let zipURL: URL;
        if (zipURLOrPath instanceof URL) {
            zipURL = zipURLOrPath;
        } else {
            try {
                zipURL = new URL(zipURLOrPath);
            } catch (error) {
                reject(error);

                return;
            }
        }

        const zipFSWriteStream = fs.createWriteStream(destinationPath, {flags: 'w'});
        let client: typeof http | typeof https;

        if (zipURL.protocol === 'http:') {
            client = http;
        } else if (zipURL.protocol === 'https:') {
            client = https;
        } else {
            reject(new Error(`Unsupported protocol: "${zipURL.protocol}"`));

            return;
        }

        client.get(zipURL, (response) => {
            const contentLength = response.headers['content-length'];
            const totalBytes = contentLength ? parseInt(contentLength, 10) : NaN;
            let downloadedBytes = 0;

            if (isNaN(totalBytes)) {
                warn('Missing or invalid "Content-Length" header. Progress bar will be skipped.');
            }

            response.on('data', (chunk) => {
                downloadedBytes += chunk.length;

                if (!isNaN(totalBytes)) {
                    if (downloadedBytes < totalBytes) {
                        const downloadedPercentage = downloadedBytes / totalBytes;
                        const formattedDownloadPercentage = percentFormatter.format(downloadedPercentage);
                        const barLength = Math.max(MIN_BAR_LENGTH, terminalWidth - BASE_DOWNLOAD_MESSAGE.length);
                        const filledLength = Math.round(barLength * downloadedPercentage);
                        const bar = '█'.repeat(filledLength) + '-'.repeat(barLength - filledLength);

                        process.stdout.write(`\rDownloading MainFrame Xpublic Zip: ${formattedDownloadPercentage} [${bar}]`);
                    } else {
                        process.stdout.write('\n');
                    }
                }
            });

            response.pipe(zipFSWriteStream);
            response.on('error', (err) => {
                fs.unlink(destinationPath, () => reject(err));
            });

            zipFSWriteStream.on('error', (err) => {
                fs.unlink(destinationPath, () => reject(err));
            });
            zipFSWriteStream.on('finish', function() {
                zipFSWriteStream.close(() => resolve());
            });
        })
            .on('error', (err) => {
                fs.unlink(destinationPath, () => reject(err));
                reject(err);
            });
    });
};

/**
 * Extract Mainframe ZIP file into {@link destinationDir} directory
 * @param zipPath Downloaded Mainframe ZIP file path in file system
 * @example "<projectRoot>/node_modules/.cache/mainframe_xpublic.zip"
 *
 * @param targetDir Target directory where the ZIP file will be extracted
 * @example "<projectRoot>/node_modules/.cache/sf/"
 */
module.exports.extractMainframeZip = function(zipPath: string, targetDir: string): Promise<void> {
    return new Promise<void>((resolve, reject) => {
        try {
            const zip = new AdmZip(zipPath);
            zip.extractAllTo(targetDir, true);

            resolve();
        } catch (error) {
            reject(error);
        }
    });
};
