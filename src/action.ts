#!/usr/bin/env node

import * as core from '@actions/core'
import {run} from "./index";
import { Options } from './Options';

try {
    let o:Options = {
        activity: core.getInput('activity', {required: true}) as Options['activity'],
        appName: core.getInput('app-name', {required: true}),
        sandboxName: core.getInput('sandbox-name',{trimWhitespace:true}),
        cleanAmount: Number.parseInt(core.getInput('clean-amount')),
        deleteOnPromote: core.getBooleanInput('delete-on-promote') || false,
        cleanModifiedBefore: parseInt(core.getInput('clean-modified-before',{trimWhitespace:true}) || '0')
    };

    if (o.activity !== 'clean' && o.sandboxName.length===0) {
        let message = `Need Sandbox name to execute action: ${o.activity}`;
        core.error(message);
        throw new Error(message);
    }

    run(o, (msg:string) => core.info(msg));
} catch (error:any) {
    core.setFailed(error.message);
}