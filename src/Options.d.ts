export interface Options {
    activity: 'clean'| 'promote-latest-scan' | 'remove-sandbox',
    appName: string,
    sandboxName: string,
    cleanAmount: number,
    deleteOnPromote: boolean,
    cleanModifiedBefore: number
}