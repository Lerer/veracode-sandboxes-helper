import { SandboxAPIProcessor } from "./apiProcessor";
import { Options } from "./Options";
import core from '@actions/core';
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
            promoteScan(appName,sandboxName,true,msgFunc);
            break;
        case 'remove-sandbox':
            removeSandbox(appName,sandboxName,msgFunc);
            break;
        case 'promote-latest-scan':
            promoteScan(appName,sandboxName,false,msgFunc);
            break;
    }
}

const promoteScan = async (appName: string,sandboxName: string,deleteOnPromote:boolean, msgFunc: (msg: string) => void)  => {
    msgFunc(`got Promote of sandbox ${sandboxName} call`);
    try {
        const apiWrapper = new SandboxAPIProcessor();
        if (apiWrapper) {
            const sandbox = await apiWrapper.promoteApplicationSandbox(appName,sandboxName,deleteOnPromote);
            msgFunc(`Sandbox promoted`);
            msgFunc(`${sandbox}`);
        }
    } catch (error) {
        console.log(error);
        core.setFailed(error as Error);
    }
    msgFunc('Finish call');
}

const removeSandbox = async (appName: string,sandboxName: string, msgFunc: (msg: string) => void) => {
    msgFunc(`got remove sandbox call for ${sandboxName}`);
    try {
        const apiWrapper = new SandboxAPIProcessor();
        if (apiWrapper) {
            const sandbox = await apiWrapper.deleteApplicationSandbox(appName,sandboxName);
            msgFunc(`Sandbox removed`);
            msgFunc(`${sandbox}`);
        }
    } catch (error) {
        console.log(error);
        core.setFailed(error as Error);
    }
    msgFunc('Finish call');
}

const cleanSandboxes = (appName: string,sandboxesAmount:number,msgFunc: (msg: string) => void) => {
    msgFunc(`Got clean activity of ${sandboxesAmount} sandboxes`);
}