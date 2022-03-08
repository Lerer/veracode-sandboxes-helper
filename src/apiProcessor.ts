import axios , {AxiosResponse} from "axios";
import { generateHeader, getHost } from "./auth";
import { VeracodeApplicationResponseData, VeracodeSandboxData, VeracodeSandboxesResponseData } from "./VeracodeResponse";
import * as core from '@actions/core'

export class SandboxAPIProcessor {

    private appGUID: string | 0 = 0;

    constructor(private apiKey: string |undefined   = process.env.VERACODE_API_ID,
                private apiSecret: string | undefined = process.env.VERACODE_API_SECRET) {
        if (!apiKey || !apiSecret) {
            throw new Error('Make sure VERACODE_API_ID and VERACODE_API_SECRET are pass as environment variables');
        }
    }

    private async getAppGUIDbyNameAPI(appName: string) {

        const encodedAppname = encodeURIComponent(appName);
        let path = "/appsec/v1/applications?size=100&page=0&name="+encodedAppname;
        
        //send request
        try {
            const applicationsListResponse: AxiosResponse = await axios.get(`https://${getHost()}${path}`,{
                headers:{
                    'Authorization': generateHeader(path, 'GET',this.apiKey!,this.apiSecret!),
                },
            });

            let apps: VeracodeApplicationResponseData=applicationsListResponse.data;
            if (apps._embedded && apps._embedded.applications){
                console.log(`${apps._embedded.applications.length} apps found matching the name`);
                let selectedApps = apps._embedded.applications.filter((appObj) => {
                    return appObj.profile.name === appName;
                });
                if (selectedApps.length>0) {
                    this.appGUID = selectedApps[0].guid;
                }
            }
        }
        catch (e) {
            console.log(e);
            core.setFailed(e as Error);
        }
    }

    private async getApplicationSandboxesAPI() {

        let path= `/appsec/v1/applications/${this.appGUID}/sandboxes`;
        
        //send request
        try {
            const sandboxesResponse: AxiosResponse = await axios.get(`https://${getHost()}${path}`,{
                headers:{
                    'Authorization': generateHeader(path, 'GET',this.apiKey!,this.apiSecret!),
                },
            });

            let sandboxes: VeracodeSandboxesResponseData=sandboxesResponse.data;
            if (sandboxes._embedded.sandboxes){
                console.log(`https://${getHost()}${path}`);
                console.log(sandboxes._embedded.sandboxes);
                return sandboxes._embedded.sandboxes;
            }
        }
        catch (e) {
            console.log(e);
            core.setFailed(e as Error);
        }
        return [];
    }

    private async deleteApplicationSandboxesAPI(sandboxGUID:string) {

        let path= `/appsec/v1/applications/${this.appGUID}/sandboxes/${sandboxGUID}`;
        
        //send request
        try {
            const sandboxesResponse: AxiosResponse = await axios.delete(`https://${getHost()}${path}`,{
                headers:{
                    'Authorization': generateHeader(path, 'DELETE',this.apiKey!,this.apiSecret!),
                },
            });

            let sandbox: VeracodeSandboxData=sandboxesResponse.data;
            if (sandbox.id){
                return sandbox;
            }
        }
        catch (e) {
            console.log(e);
            core.setFailed(e as Error);
        }
    }

    private async promoteApplicationSandboxesAPI(sandboxGUID:string, deleteOnPromote:boolean) {
        let path= `/appsec/v1/applications/${this.appGUID}/sandboxes/${sandboxGUID}/promote`;
        
        if (deleteOnPromote) {
            path += `?delete_on_promote=${deleteOnPromote}`;
        }
        
        try {
            const sandboxesResponse: AxiosResponse = await axios.post(`https://${getHost()}${path}`,
            {}, // Body
            { // config
                headers:{
                    'Authorization': generateHeader(path, 'POST',this.apiKey!,this.apiSecret!),
                },
            });

            let sandbox: VeracodeSandboxData=sandboxesResponse.data;
            if (sandbox.id){
                return sandbox;
            }
        }
        catch (e) {
            console.log(e);
            core.setFailed(e as Error);
        }
    }

    private async getApplicationSandboxes(appName:string) {
        await this.getAppGUIDbyNameAPI(appName);
        if (this.appGUID===0) {
            throw new Error(`Cannot find application with name ${appName}`); 
        }
        return this.getApplicationSandboxesAPI();
    }

    private async findSpecificSandbox(appName: string,sandboxName: string) {
        const sandboxes =  await this.getApplicationSandboxes(appName);

        const neededSandbox = sandboxes.filter((sandbox) => {
            return sandbox.name===sandboxName;
        });

        if (neededSandbox.length>0) {
            return neededSandbox[0];
        }
    }


    public async getApplicationSandboxCount(appName: string) {
        
        const sandboxes = await this.getApplicationSandboxes(appName);

        return sandboxes.length;
    }

    public async deleteApplicationSandbox(appName: string,sandboxName:string) {

        const neededSandbox = await this.findSpecificSandbox(appName,sandboxName);

        if (neededSandbox) {
            return this.deleteApplicationSandboxesAPI(neededSandbox.guid);
        }
    }

    public async promoteApplicationSandbox(appName: string,sandboxName:string,deleteOnPromote:boolean) {
        const sandbox = await this.findSpecificSandbox(appName,sandboxName);

        if (sandbox) {
            return this.promoteApplicationSandboxesAPI(sandbox.guid,deleteOnPromote);
        }
    }

    public async cleanSandboxes(appName:string, sandboxesAmount:number,modifiedBefore: Date) {
        const sandboxes = await this.getApplicationSandboxes(appName);

        let filteredSandboxes = sandboxes.filter((sandbox) => {
            return (sandbox.modified<modifiedBefore.toISOString());
        }).sort((sandboxA,sandboxB) => {
            let retVal = sandboxA.modified > sandboxB.modified ;
            return (retVal ? 1 : -1);
        });

        core.info('Date match Sandboxes from oldest to newest:');
        core.info('===========================================');
        filteredSandboxes.forEach((sandbox,i) => {
            core.info(`[${i}] - ${sandbox.name} => ${sandbox.modified}`);
        });
        core.info('-------------------------------------------');
        if (sandboxesAmount<1) {
            sandboxesAmount = 1;
        }

        filteredSandboxes = filteredSandboxes.slice(0,sandboxesAmount);
        core.info('Deleting the following sandboxes:');
        core.info('=================================');

        const deletedGUIDs: string[] = [];
        await Promise.all(filteredSandboxes.map(async (sandbox,i) => {
            core.info(`[${i}] - ${sandbox.name} => ${sandbox.modified}, ${sandbox.guid}`);
            const deleted = await this.deleteApplicationSandboxesAPI(sandbox.guid);
            console.log(deleted);
            core.info(`Sandbox '${deleted?.name ? deleted?.name : 'N/A'}' with GUID [${sandbox.guid}] deleted`);
            core.info(deleted?.name ? deleted?.name : 'N/A');
            deletedGUIDs.push(`'${sandbox.name}' (GUID:${sandbox.guid})`);
        }));
        core.info('---------------------------------');

        return deletedGUIDs;
    }
}