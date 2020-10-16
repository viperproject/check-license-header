// This Source Code Form is subject to the terms of the Mozilla Public
// License, v. 2.0. If a copy of the MPL was not distributed with this
// file, You can obtain one at http://mozilla.org/MPL/2.0/.
//
// Copyright (c) 2011-2020 ETH Zurich.

import * as core from '@actions/core';
import {checkLicenses, filterFailures, getUncoveredFiles} from './check';

async function run(): Promise<void> {
    try {
        const path: string = core.getInput('path');
        const configPath: string = core.getInput('config');
        const strictMode: boolean =
            core.getInput('strict', {required: false}) === 'true';
        const results = await checkLicenses(path, configPath);
        const errors = filterFailures(results);
        const missedFiles = await getUncoveredFiles(path, configPath);

        // emit a warning for all missed files:
        for (const missedFile of missedFiles) {
            core.warning(`Config does not cover the file '${missedFile}'`);
        }

        // emit an error for all erroneous files:
        for (const error of errors) {
            core.error(error.message);
        }

        if (strictMode) {
            core.setFailed(
                `${errors.length} error(s) and ${missedFiles.length} warning(s) found. Warnings are treated as errors.`
            );
        } else if (errors.length !== 0) {
            core.setFailed(`${errors.length} error(s) found`);
        } else {
            core.info(
                `${errors.length} error(s) and ${missedFiles.length} warning(s) found.`
            );
        }
    } catch (error) {
        core.setFailed(error.message);
    }
}

run();
