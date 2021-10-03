import axios , {AxiosResponse} from "axios";
import { generateHeader, getHost } from "./auth";
import { VeracodeApplicationResponseData, VeracodeSandboxesResponseData } from "./VeracodeResponse";

export class SandboxAPIProcessor {

    private appGUID: string | 0 = 0;

    constructor(private apiKey: string |undefined   = process.env.VERACODE_API_ID,
                private apiSecret: string | undefined = process.env.VERACODE_API_SECRET) {
        if (!apiKey || !apiSecret) {
            throw new Error('Make sure VERACODE_API_ID and VERACODE_API_SECRET are pass as environment variables');
        }
    }

    private async getAppGUIDbyName(appName: string) {

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
            console.log(e)
        }
    }

    private async getApplicationSandboxes() {

        let path= `/appsec/v2/applications/${this.appGUID}/sandboxes`;
        
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
            console.log(e)
        }
        return [];
    }

    public async getApplicationSandboxCount(appName: string) {
        await this.getAppGUIDbyName(appName);
        if (this.appGUID===0) {
            throw new Error(`Cannot find application with name ${appName}`); 
        }
        const sandboxes = await this.getApplicationSandboxes();

        return sandboxes.length;
    }
}