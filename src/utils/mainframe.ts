import http = require('node:http');
import https = require('node:https');
import fs = require('node:fs');
import path = require('node:path');

import AdmZip = require('adm-zip');
import bytes = require('@/utils/bytes');
const {chalk} = require('@vue/cli-shared-utils');
const {skip, info} = require('@/utils/logger');
const {getFileSystemFileSize} = require('@/utils/fs');
const {fetchContentLength} = require('@/utils/http');

/**
 * Download the ZIP file into {@link destinationPath destination path}
 * @param zipURLOrPath ZIP file URL or full URL
 * @example
 * "https://p360.example.com/mainframe_xpublic.zip"
 * new URL("/mainframe_xpublic.zip", "https://p360.example.com")
 *
 * @param destinationPath Downloaded mainframe ZIP file destination path
 * @example`<projectRoot>/node_modules/.cache/sf/mainframe_xpublic.zip`
 */
function downloadMainframeZip(zipURLOrPath: URL | string, destinationPath: string): Promise<void> {
    return new Promise<void>((resolve, reject) => {
        const terminalWidth = process.stdout.columns || 80;
        const BASE_DOWNLOAD_MESSAGE = `${chalk.bgBlue.black(' INFO ')} ${chalk.yellow('[sf]')} Downloading MainFrame Xpublic Zip: 100.00% []`;
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
                fs.unlinkSync(destinationPath);

                return;
            }
        }

        // Check if partial file exists and get its size
        const startByte: number = getFileSystemFileSize(destinationPath);

        // Append if resuming, write if new
        const zipFSWriteStream = fs.createWriteStream(destinationPath, {
            flags: startByte > 0 ? 'a' : 'w',
        });
        let client: typeof http | typeof https;

        if (zipURL.protocol === 'http:') {
            client = http;
        } else if (zipURL.protocol === 'https:') {
            client = https;
        } else {
            reject(new Error(`Unsupported protocol: "${zipURL.protocol}"`));

            return;
        }

        function beginDownload(contentLength?: number | null) {
            // Skip download if cached file already matches remote size
            if (startByte > 0 && contentLength && startByte >= contentLength) {
                skip('Mainframe zip already downloaded, skipping download.');
                zipFSWriteStream.close();
                resolve();

                return;
            }

            // Prepare request options with `Range` header for resume
            const requestOptions = {
                headers: startByte > 0 ? {Range: `bytes=${startByte}-`} : {},
            };

            client.get(
                zipURL,
                requestOptions,
                (response) => {
                    const contentLengthHeader = response.headers['content-length'];
                    // Parse total file size from Content-Range header (e.g., "bytes 0-1023/1024")
                    const contentRangeHeader = response.headers['content-range'];

                    const rangeParts = contentRangeHeader?.split('/');
                    const totalFileSize = rangeParts?.[1] ? parseInt(rangeParts[1], 10) : NaN;

                    // Check if cached file is already complete
                    const isRangeNotSatisfiable = response.statusCode === 416;
                    const isCachedFileComplete = startByte > 0 && !isNaN(totalFileSize) && startByte >= totalFileSize;

                    if (isRangeNotSatisfiable || isCachedFileComplete) {
                        skip('Cached mainframe zip already complete, skipping download.');
                        zipFSWriteStream.close();
                        resolve();

                        return;
                    }

                    // Check if server supports partial content
                    if (startByte > 0 && response.statusCode !== 206) {
                        info('Mainframe server does not support resume. Starting download from beginning.');
                        zipFSWriteStream.close();
                        fs.unlinkSync(destinationPath);

                        // Retry without Range header (partial file preserved for next attempt)
                        return downloadMainframeZip(zipURLOrPath, destinationPath)
                            .then(resolve)
                            .catch(reject);
                    }

                    const totalBytes = Number.isFinite(contentLength)
                        ? contentLength as number
                        : contentLengthHeader
                            ? parseInt(contentLengthHeader, 10) + startByte
                            : NaN;
                    let downloadedBytes = startByte;

                    if (startByte > 0) {
                        info(`Resuming download MainFrame Xpublic Zip from offset ${bytes(startByte)}`);
                    }

                    if (isNaN(totalBytes)) {
                        skip('Missing or invalid "Content-Length" header. Progress bar will be skipped.');
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

                                process.stdout.write(`\r${chalk.bgBlue.black(' INFO ')} ${chalk.yellow('[sf]')} Downloading MainFrame Xpublic Zip: ${formattedDownloadPercentage} [${bar}]`);
                            } else {
                                info('MainFrame Xpublic Zip download completed.\n');
                            }
                        }
                    });

                    response.pipe(zipFSWriteStream);
                    response.on('error', (err) => {
                        zipFSWriteStream.close();
                        fs.unlinkSync(destinationPath);
                        reject(err);
                    });

                    zipFSWriteStream.on('error', (err) => {
                        zipFSWriteStream.close();
                        fs.unlinkSync(destinationPath);
                        reject(err);
                    });
                    zipFSWriteStream.on('finish', function() {
                        zipFSWriteStream.close(() => resolve());
                    });
                },
            ).on('error', (err) => {
                zipFSWriteStream.close();
                fs.unlinkSync(destinationPath);
                reject(err);
            });
        }

        fetchContentLength(zipURL, client)
            .then(beginDownload)
            .catch(() => beginDownload());
    });
}

/**
 * Extract Mainframe ZIP file into {@link destinationDir} directory
 * @param zipPath Downloaded Mainframe ZIP file path in file system
 * @example "<projectRoot>/node_modules/.cache/sf/mainframe_xpublic.zip"
 *
 * @param targetDir Target directory where the ZIP file will be extracted
 * @example "<projectRoot>/node_modules/.cache/sf/mainframe/"
 */
function extractMainframeZip(zipPath: string, targetDir: string): Promise<void> {
    return new Promise<void>((resolve, reject) => {
        const indexHtmlPath = path.join(targetDir, 'index.html');
        if (fs.existsSync(indexHtmlPath)) {
            skip('Mainframe zip already extracted, skipping extraction.');
            resolve();

            return;
        }

        try {
            const zip = new AdmZip(zipPath);
            zip.extractAllTo(targetDir, true);

            resolve();
        } catch (error) {
            reject(error);
        }
    });
}

module.exports.downloadMainframeZip = downloadMainframeZip;
module.exports.extractMainframeZip = extractMainframeZip;
