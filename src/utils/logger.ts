/* eslint-disable no-console */
const {chalk} = require('@vue/cli-shared-utils');

const sfTag = chalk.yellow('[sf]');

function log(type: 'info' | 'skip' | 'warn' | 'error', ...messages: any[]): void {
    const message = messages.map((m) => String(m)).join(' ');

    switch (type) {
    case 'info':
        console.info(
            chalk.bgBlue.black(' INFO '),
            sfTag,
            ...messages,
        );
        break;

    case 'skip':
        console.info(
            chalk.bgGray.black(' SKIP '),
            sfTag,
            ...messages,
        );
        break;

    case 'warn':
        console.warn(
            chalk.bgYellow.black(' WARN '),
            sfTag,
            chalk.yellow(message),
        );
        break;

    case 'error':
        console.error(
            chalk.bgRed.black(' ERROR '),
            sfTag,
            chalk.red(message),
        );
        break;

    default:
        console.log(sfTag, ...messages);
        break;
    }
}

function info(...messages: any[]): void {
    log('info', ...messages);
}

function skip(...messages: any[]): void {
    log('skip', ...messages);
}

function warn(...messages: any[]): void {
    log('warn', ...messages);
}

function error(...messages: any[]): void {
    log('error', ...messages);
}

module.exports = {
    log,
    info,
    skip,
    warn,
    error,
};
