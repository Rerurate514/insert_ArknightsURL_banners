export interface IAUBPluginSettings {
    bannerProperty: string;
    imagesPerPage: number;
}

export const DEFAULT_SETTINGS: IAUBPluginSettings = {
    bannerProperty: 'banner',
    imagesPerPage: 12
}
