// This Source Code Form is subject to the terms of the Mozilla Public
// License, v. 2.0. If a copy of the MPL was not distributed with this
// file, You can obtain one at http://mozilla.org/MPL/2.0/.
//
// Copyright (c) 2011-2020 ETH Zurich.

// import ajvModule from 'ajv';
import {Config} from './config.js';
import json5 from 'json5';
// see https://github.com/ajv-validator/ajv/issues/2132#issuecomment-1290409907
// const Ajv = ajvModule as unknown as typeof ajvModule.default;
import {Ajv} from 'ajv';

export function parseConfig(text: string): Promise<Config> {
    const ajv = new Ajv();
    const validate = ajv.compile({
        type: 'array',
        items: {
            type: 'object',
            required: ['include'],
            properties: {
                include: {
                    type: 'array',
                    items: {
                        type: 'string'
                    }
                },
                exclude: {
                    type: 'array',
                    items: {
                        type: 'string'
                    }
                },
                license: {
                    type: 'string'
                }
            }
        }
    });

    let data: Config;
    try {
        data = json5.parse(text);
    } catch {
        return Promise.reject(new Error(`Parsing configuration has failed`));
    }

    if (!validate(data)) {
        return Promise.reject(
            new Error(
                `Configuration validation has failed: '${ajv.errorsText(
                    validate.errors
                )}'`
            )
        );
    }
    return Promise.resolve(data);
}
