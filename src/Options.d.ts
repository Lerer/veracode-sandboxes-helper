export interface Options {
    activity: 'clean'| 'promote-latest-scan' | 'promote-and-remove' | 'remove-sandbox',
    appName: string,
    sandboxName: string,
    cleanAmount: number,
}