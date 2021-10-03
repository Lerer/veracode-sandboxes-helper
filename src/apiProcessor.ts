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
            if (apps._embedded.applications){
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
            path = path + '?delete_on_promote=true';
        }
        
        try {
            const sandboxesResponse: AxiosResponse = await axios.post(`https://${getHost()}${path}`,{
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
}