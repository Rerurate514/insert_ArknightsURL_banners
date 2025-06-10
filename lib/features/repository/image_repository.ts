export class ImageRepository {
    baseUrl = "https://raw.githubusercontent.com/Rerurate514/img_dwnldr_wikigg_ak_kt/refs/heads/master/img/";

    public getImagesURL(startIndex = 1, page = 50) : string[]{
        const urls : string[] = [];

        for (let i = startIndex; i < (startIndex + page); i++) {
            urls.push(this.baseUrl + this.zeropad(i) + ".png");
        }

        return urls;
    }

    private zeropad(num: number): string {
        return num.toString().padStart(3, '0');
    }
} 
