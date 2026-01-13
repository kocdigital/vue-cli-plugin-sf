/**
 * The MIT License (MIT)
 * Copyright (c) 2022 Vercel, Inc.
 *
 * Permission is hereby granted, free of charge, to any person obtaining a copy of this software and associated documentation files (the "Software"), to deal in the Software without restriction, including without limitation the rights to use, copy, modify, merge, publish, distribute, sublicense, and/or sell copies of the Software, and to permit persons to whom the Software is furnished to do so, subject to the following conditions:
 * The above copyright notice and this permission notice shall be included in all copies or substantial portions of the Software.
 * THE SOFTWARE IS PROVIDED "AS IS", WITHOUT WARRANTY OF ANY KIND, EXPRESS OR IMPLIED, INCLUDING BUT NOT LIMITED TO THE WARRANTIES OF MERCHANTABILITY, FITNESS FOR A PARTICULAR PURPOSE AND NONINFRINGEMENT. IN NO EVENT SHALL THE AUTHORS OR COPYRIGHT HOLDERS BE LIABLE FOR ANY CLAIM, DAMAGES OR OTHER LIABILITY, WHETHER IN AN ACTION OF CONTRACT, TORT OR OTHERWISE, ARISING FROM, OUT OF OR IN CONNECTION WITH THE SOFTWARE OR THE USE OR OTHER DEALINGS IN THE SOFTWARE.
 */

/**
 * Based on {@link https://github.com/vercel/ms ms} millisecond utility library
 * Adopted to use `bytes` byte unit utility function
 */

// Helpers.
const kb = 1024;
const mb = kb * 1024;
const gb = mb * 1024;
const tb = gb * 1024;
const pb = tb * 1024;

type Unit =
    | 'Petabytes'
    | 'Petabyte'
    | 'Pbytes'
    | 'Pbyte'
    | 'PBS'
    | 'PB'
    | 'Terabytes'
    | 'Terabyte'
    | 'Tbytes'
    | 'Tbyte'
    | 'TBS'
    | 'TB'
    | 'Gigabytes'
    | 'Gigabyte'
    | 'Gbytes'
    | 'Gbyte'
    | 'GBS'
    | 'GB'
    | 'Megabytes'
    | 'Megabyte'
    | 'Mbytes'
    | 'Mbyte'
    | 'MBS'
    | 'MB'
    | 'Kilobytes'
    | 'Kilobyte'
    | 'Kbytes'
    | 'Kbyte'
    | 'KBS'
    | 'KB'
    | 'Bytes'
    | 'Byte'
    | 'B';

type UnitAnyCase = Unit | Uppercase<Unit> | Lowercase<Unit>;

type StringValueType =
    | `${number}`
    | `${number}${UnitAnyCase}`
    | `${number} ${UnitAnyCase}`;

interface OptionsType {
    /**
     * Set to `true` to use verbose formatting. Defaults to `false`.
     */
    long?: boolean;
}

/**
 * Parse the given string and return milliseconds.
 *
 * @param str - A string to parse to milliseconds
 * @returns The parsed value in milliseconds, or `NaN` if the string can't be
 * parsed
 */
function parse(str: string): number {
    if (str.length > 100) {
        throw new Error('Value exceeds the maximum length of 100 characters.');
    }
    const match =
        /^(-?(?:\d+)?\.?\d+) *(bytes?|b|kilobytes?|kbytes?|secs?|kbs?|megabytes?|mbytes?|mbs?|gigabytes?|gbytes?|gbs?|terabytes?|tbytes?|tbs?|petabytes?|pbytes?|pbs?)?$/i.exec(str);
    if (!match) {
        return NaN;
    }
    const n = parseFloat(match[1]);
    const type = (match[2] || 'b').toLowerCase() as Lowercase<Unit>;
    switch (type) {
    case 'petabytes':
    case 'petabyte':
    case 'pbytes':
    case 'pbyte':
    case 'pbs':
    case 'pb':
        return n * pb;
    case 'terabytes':
    case 'terabyte':
    case 'tbytes':
    case 'tbyte':
    case 'tbs':
    case 'tb':
        return n * tb;
    case 'gigabytes':
    case 'gigabyte':
    case 'gbytes':
    case 'gbyte':
    case 'gbs':
    case 'gb':
        return n * gb;
    case 'megabytes':
    case 'megabyte':
    case 'mbytes':
    case 'mbyte':
    case 'mbs':
    case 'mb':
        return n * mb;
    case 'kilobytes':
    case 'kilobyte':
    case 'kbytes':
    case 'kbyte':
    case 'kbs':
    case 'kb':
        return n * kb;
    case 'bytes':
    case 'byte':
    case 'b':
        return n;
    default:
        // This should never occur.
        throw new Error(`The unit ${
            type as string
        } was matched, but no matching case exists.`);
    }
}

/**
 * Short format for `bytes`.
 */
function fmtShort(bytes: number): StringValueType {
    const byteAbs = Math.abs(bytes);
    if (byteAbs >= pb) {
        return `${Math.round(bytes / gb)}pb`;
    }
    if (byteAbs >= tb) {
        return `${Math.round(bytes / gb)}tb`;
    }
    if (byteAbs >= gb) {
        return `${Math.round(bytes / gb)}gb`;
    }
    if (byteAbs >= mb) {
        return `${Math.round(bytes / mb)}mb`;
    }
    if (byteAbs >= kb) {
        return `${Math.round(bytes / kb)}kb`;
    }

    return `${bytes}b`;
}

/**
 * Pluralization helper.
 */
function plural(
    bytes: number,
    bytesAbs: number,
    n: number,
    name: string,
): StringValueType {
    // TODO: handle this for `bytes`
    const isPlural = bytesAbs >= n * 1.5;

    return `${Math.round(bytes / n)} ${name}${isPlural ? 's' : ''}` as StringValueType;
}

/**
 * Long format for `bytes`.
 */
function fmtLong(bytes: number): StringValueType {
    const bytesAbs = Math.abs(bytes);
    if (bytesAbs >= pb) {
        return plural(
            bytes, bytesAbs, gb, 'petabyte',
        );
    }
    if (bytesAbs >= tb) {
        return plural(
            bytes, bytesAbs, gb, 'terabyte',
        );
    }
    if (bytesAbs >= gb) {
        return plural(
            bytes, bytesAbs, gb, 'gigabyte',
        );
    }
    if (bytesAbs >= mb) {
        return plural(
            bytes, bytesAbs, mb, 'megabyte',
        );
    }
    if (bytesAbs >= kb) {
        return plural(
            bytes, bytesAbs, kb, 'kilobyte',
        );
    }

    return `${bytes} byte`;
}

/**
 * A type guard for errors.
 *
 * @param value - The value to test
 * @returns A boolean `true` if the provided value is an Error-like object
 */
function isError(value: unknown): value is Error {
    return typeof value === 'object' && value !== null && 'message' in value;
}

/**
 * Parse or format the given value.
 *
 * @param value - The string or number to convert
 * @param options - Options for the conversion
 * @throws Error if `value` is not a non-empty string or a number
 */
function bytesFn(value: StringValueType, options?: OptionsType): number;
function bytesFn(value: number, options?: OptionsType): string;
function bytesFn(value: StringValueType | number,
    options?: OptionsType): number | string {
    try {
        if (typeof value === 'string' && value.length > 0) {
            return parse(value);
        } else if (typeof value === 'number' && isFinite(value)) {
            return options?.long ? fmtLong(value) : fmtShort(value);
        }
        throw new Error('Value is not a string or number.');
    } catch (error) {
        const message = isError(error)
            ? `${error.message}. value=${JSON.stringify(value)}`
            : 'An unknown error has occurred.';
        throw new Error(message);
    }
}

// eslint-disable-next-line @typescript-eslint/no-namespace
namespace bytesFn {
    export type StringValue = StringValueType;
    export type Options = OptionsType;
}

export = bytesFn;
