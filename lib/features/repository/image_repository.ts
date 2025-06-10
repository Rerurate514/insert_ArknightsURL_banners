export class ImageRepository {
    baseUrl = "https://raw.githubusercontent.com/Rerurate514/img_dwnldr_wikigg_ak_kt/refs/heads/master/img/";
    
    private imageCache = new Map<string, HTMLImageElement>();
    private preloadPromises = new Map<string, Promise<HTMLImageElement>>();

    public getImagesURL(startIndex = 1, page = 50): string[] {
        const urls: string[] = [];

        for (let i = startIndex; i < (startIndex + page); i++) {
            urls.push(this.baseUrl + this.zeropad(i) + ".png");
        }

        return urls;
    }

    public async preloadImages(urls: string[], concurrency = 6): Promise<void> {
        const chunks = this.chunkArray(urls, concurrency);
        
        for (const chunk of chunks) {
            await Promise.all(chunk.map(url => this.preloadSingleImage(url)));
        }
    }

    
    private preloadSingleImage(url: string): Promise<HTMLImageElement> {
        if (this.preloadPromises.has(url)) {
            // eslint-disable-next-line @typescript-eslint/no-non-null-assertion
            return this.preloadPromises.get(url)!;
        }

        const promise = new Promise<HTMLImageElement>((resolve, reject) => {
            if (this.imageCache.has(url)) {
                // eslint-disable-next-line @typescript-eslint/no-non-null-assertion
                resolve(this.imageCache.get(url)!);
                return;
            }

            const img = new Image();
            
            img.loading = 'eager';
            img.decoding = 'async';
            
            img.onload = () => {
                this.imageCache.set(url, img);
                resolve(img);
            };
            
            img.onerror = () => {
                console.warn(`Failed to load image: ${url}`);
                reject(new Error(`Failed to load image: ${url}`));
            };
            
            img.src = url;
        });

        this.preloadPromises.set(url, promise);
        return promise;
    }

    public getCachedImage(url: string): HTMLImageElement | null {
        return this.imageCache.get(url) || null;
    }

    private chunkArray<T>(array: T[], size: number): T[][] {
        const chunks: T[][] = [];
        for (let i = 0; i < array.length; i += size) {
            chunks.push(array.slice(i, i + size));
        }
        return chunks;
    }

    public preloadNextPage(currentStartIndex: number, page = 50): void {
        const nextPageUrls = this.getImagesURL(currentStartIndex + page, page);
        this.preloadImages(nextPageUrls, 3).catch(err => 
            console.warn('Next page preload failed:', err)
        );
    }

    private zeropad(num: number): string {
        return num.toString().padStart(3, '0');
    }

    public clearCache(): void {
        this.imageCache.clear();
        this.preloadPromises.clear();
    }

    public getCacheSize(): number {
        return this.imageCache.size;
    }
}
