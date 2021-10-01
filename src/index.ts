
/*
env:
          VERACODE_API_ID: '${{ secrets.VERACODE_API_ID }}'
          VERACODE_API_SECRET: '${{ secrets.VERACODE_API_KEY }}'
*/

import { Options } from "./Options";

export function run(opt: Options, msgFunc: (msg: string) => void) {
    const action = opt.activity;
    const appName = opt.appName;
    const sandboxName = opt.sandboxName;
    const amount = opt.cleanAmount;

    switch (action) {
        case 'clean':
            cleanSandboxes(appName,amount,msgFunc);
            break;
        case 'promote-and-remove':
            promoteScan(appName,sandboxName,msgFunc);
            removeSandbox(appName,sandboxName,msgFunc);
            break;
        case 'remove-sandbox':
            removeSandbox(appName,sandboxName,msgFunc);
            break;
        case 'promote-latest-scan':
            promoteScan(appName,sandboxName,msgFunc);
            break;
    }
    
    msgFunc('file created: ' + 'outputFilename');
}

const promoteScan = (appName: string,sandboxName: string, msgFunc: (msg: string) => void)  => {
    msgFunc(`got Promote of sandbox ${sandboxName} call`);
}

const removeSandbox = (appName: string,sandboxName: string, msgFunc: (msg: string) => void) => {
    msgFunc(`got remove sandbox call for ${sandboxName}`);
}

const cleanSandboxes = (appName: string,sandboxesAmount:number,msgFunc: (msg: string) => void) => {
    msgFunc(`Got clean activity of ${sandboxesAmount} sandboxes`);
}