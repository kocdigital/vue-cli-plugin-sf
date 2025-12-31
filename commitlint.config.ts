import type {UserConfig} from '@commitlint/types';
import {RuleConfigSeverity} from '@commitlint/types';
const config: UserConfig = {
    extends: ['@commitlint/config-conventional'],
    rules: {
        'subject-min-length': [RuleConfigSeverity.Error, 'always', 5],
    },
};
export default config;
