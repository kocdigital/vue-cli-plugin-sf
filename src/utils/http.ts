import http = require('node:http');
import https = require('node:https');

const {error} = require('@/utils/logger');

/**
 * Convert a string or path to a URL object
 * @param urlOrPath URL or path string
 * @returns URL object
 * @throws Error if the input is not a valid URL
 */
function toURL(urlOrPath: URL | string): URL | null {
    if (urlOrPath instanceof URL) {
        return urlOrPath;
    } else {
        try {
            return new URL(urlOrPath);
        } catch {
            error(`Invalid URL: "${urlOrPath}"`);

            return null;
        }
    }
}

/**
 * Fetch the Content-Length header of a URL resource via HEAD request
 * @param urlOrPath URL of the resource
 * @param client {@link http} or {@link https} client
 * @returns Content length in bytes, or `null` if not available
 */
function fetchContentLength(urlOrPath: URL | string): Promise<number> {
    return new Promise((resolve, reject) => {
        let client: typeof http | typeof https;

        const url = toURL(urlOrPath);

        if (!url) {
            resolve(0);

            return;
        }

        if (url.protocol === 'http:') {
            client = http;
        } else if (url.protocol === 'https:') {
            client = https;
        } else {
            reject(new Error(`Unsupported protocol: "${url.protocol}"`));

            return;
        }

        const request = client.request(
            urlOrPath,
            {method: 'HEAD'},
            (response) => {
                const contentLengthHeader = response.headers['content-length'];
                response.resume();
                const contentLength = contentLengthHeader ? parseInt(contentLengthHeader, 10) : 0;

                resolve(contentLength);
            },
        );

        request.on('error', reject);
        request.end();
    });
}

module.exports = {
    toURL,
    fetchContentLength,
};
