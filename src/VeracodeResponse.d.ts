export interface VeracodeApplicationData {
    guid: string,
    profile: {
        name: string
    }
}

export interface VeracodeSandboxData {
    application_guid: string,
    guid: string,
    id: number,
    name: string,
    organization_id: number,
    owner_username: string,
    modified: string
}

export interface VeracodeApplicationResponseData {
    _embedded: {
        applications?:Array<VeracodeApplicationData>
    };
}

export interface VeracodeSandboxesResponseData {
    _embedded: {
        sandboxes: Array<VeracodeSandboxData>
    }
}