import { ImageRepository } from "lib/repository/image_repository";
import MyPlugin from "main";
import { App, Modal } from "obsidian";

export class ImageSelectModal extends Modal {
    readonly IMAGE_TOTAL = 1865;
    private imgRepo: ImageRepository;
    private currentPage = 1;
    private pageSize = 12;
    private totalPages;
    private gridContainer: HTMLElement | null = null;
    private controlsContainer: HTMLElement | null = null;
    private loadingElement: HTMLElement | null = null;
    private isLoading = false;

    private plugin: MyPlugin;

    constructor(app: App, plugin: MyPlugin) {
        super(app);
        this.plugin = plugin;
        this.imgRepo = new ImageRepository();

        this.totalPages = Math.ceil(this.IMAGE_TOTAL / this.pageSize);
    }

    async onOpen() {
        const { contentEl } = this;
        
        this.modalEl.classList.add('image-select-modal');
        
        contentEl.appendChild(this.createHeader());
        
        this.controlsContainer = this.createControls();
        contentEl.appendChild(this.controlsContainer);
        
        this.gridContainer = this.createGridContainer();
        contentEl.appendChild(this.gridContainer);
        
        await this.loadPage(1);
        
        this.preloadNextPage();
    }

    onClose() {
        const { contentEl } = this;
        contentEl.empty();
        this.gridContainer = null;
        this.controlsContainer = null;
    }

    private createHeader(): HTMLElement {
        const header = document.createElement('div');
        header.classList.add('image-select-header');
        const title = document.createElement('h2');
        title.textContent = 'Select an Image';

        header.appendChild(title);

        return header;;
    }

    private createControls(): HTMLElement {
        const controlsDiv = document.createElement('div');
        controlsDiv.classList.add('image-select-controls');

        const prevBtn = this.createButton('← Previous', () => this.goToPreviousPage());
        prevBtn.id = 'prev-btn';
        
        const pageInfo = document.createElement('span');
        pageInfo.id = 'page-info';
        pageInfo.classList.add('image-select-page-info');
        
        const nextBtn = this.createButton('Next →', () => this.goToNextPage());
        nextBtn.id = 'next-btn';
        
        const jumpInput = document.createElement('input');
        jumpInput.type = 'number';
        jumpInput.min = '1';
        jumpInput.max = this.totalPages.toString();
        jumpInput.classList.add('image-select-jump-input');
        
        const jumpBtn = this.createButton('Go', () => {
            const page = parseInt(jumpInput.value);
            if (page >= 1 && page <= this.totalPages) {
                this.loadPage(page);
            }
        });

        controlsDiv.appendChild(prevBtn);
        controlsDiv.appendChild(pageInfo);
        controlsDiv.appendChild(nextBtn);
        controlsDiv.appendChild(document.createTextNode('Jump to: '));
        controlsDiv.appendChild(jumpInput);
        controlsDiv.appendChild(jumpBtn);

        return controlsDiv;
    }

    private createButton(text: string, onClick: () => void): HTMLButtonElement {
        const btn = document.createElement('button');
        btn.textContent = text;
        btn.classList.add('image-select-btn');
        
        btn.addEventListener('click', onClick);
        
        return btn;
    }

    private updateControls(): void {
        if (!this.controlsContainer) return;

        const pageInfo = this.controlsContainer.querySelector('#page-info') as HTMLSpanElement;

        if (pageInfo) pageInfo.textContent = `Page ${this.currentPage} of ${this.totalPages}`;
    }

    private async goToPreviousPage(): Promise<void> {
        if (this.currentPage > 1 && !this.isLoading) {
            await this.loadPage(this.currentPage - 1);
        }
    }

    private async goToNextPage(): Promise<void> {
        if (this.currentPage < this.totalPages && !this.isLoading) {
            await this.loadPage(this.currentPage + 1);
        }
    }

    private async loadPage(page: number): Promise<void> {
        if (this.isLoading) return;
        
        this.isLoading = true;
        this.currentPage = page;
        this.updateControls();
        
        if (this.gridContainer) {
            this.gridContainer.innerHTML = '';
        }
        
        this.showLoading();
        
        try {
            const startIndex = (page - 1) * this.pageSize + 1;
            const urls = this.imgRepo.getImagesURL(startIndex, this.pageSize);
            
            await this.imgRepo.preloadImages(urls, 8);

            this.hideLoading();
            
            if (this.gridContainer) {
                this.appendImages(urls);
            }
            
            this.preloadNextPage();
            
        } catch (error) {
            this.hideLoading();
            console.error('Failed to load images:', error);
            
            const startIndex = (page - 1) * this.pageSize + 1;
            const urls = this.imgRepo.getImagesURL(startIndex, this.pageSize);
            if (this.gridContainer) {
                this.appendImagesWithLazyLoad(urls);
            }
        } finally {
            this.isLoading = false;
            this.updateControls();
        }
    }

    private preloadNextPage(): void {
        if (this.currentPage < this.totalPages) {
            const nextStartIndex = this.currentPage * this.pageSize + 1;
            this.imgRepo.preloadNextPage(nextStartIndex - this.pageSize, this.pageSize);
        }
    }

    private showLoading(): void {
        if (!this.gridContainer) return;
        
        this.loadingElement = document.createElement('div');
        this.loadingElement.classList.add('image-select-loading');
        
        const spinner = document.createElement('div');
        spinner.classList.add('image-select-spinner');
        
        this.loadingElement.appendChild(spinner);
        this.loadingElement.appendChild(document.createTextNode(`Loading page ${this.currentPage}...`));
        
        this.gridContainer.appendChild(this.loadingElement);
    }

    private hideLoading(): void {
        if (this.loadingElement) {
            this.loadingElement.remove();
            this.loadingElement = null;
        }
    }

    private appendImages(urls: string[]): void {
        if (!this.gridContainer) return;

        for (let i = 0; i < urls.length; i++) {
            const imgWrapper = this.createImageWrapper();
            const cachedImg = this.imgRepo.getCachedImage(urls[i]);
            
            if (cachedImg) {
                const img = cachedImg.cloneNode(true) as HTMLImageElement;
                this.styleImage(img);
                imgWrapper.appendChild(img);
            } else {
                const img = this.createLazyImage(urls[i]);
                imgWrapper.appendChild(img);
            }

            this.gridContainer.appendChild(imgWrapper);
        }
    }

    private appendImagesWithLazyLoad(urls: string[]): void {
        if (!this.gridContainer) return;

        for (let i = 0; i < urls.length; i++) {
            const imgWrapper = this.createImageWrapper();
            const img = this.createLazyImage(urls[i]);
            
            imgWrapper.appendChild(img);
            this.gridContainer.appendChild(imgWrapper);
        }
    }

    private createLazyImage(url: string): HTMLImageElement {
        const img = document.createElement('img');
        
        const observer = new IntersectionObserver((entries) => {
            entries.forEach(entry => {
                if (entry.isIntersecting) {
                    const target = entry.target as HTMLImageElement;
                    target.src = url;
                    observer.unobserve(target);
                }
            });
        });
        
        observer.observe(img);
        this.styleImage(img);
        
        return img;
    }

    private styleImage(img: HTMLImageElement): void {
        img.classList.add('image-select-img');

        img.addEventListener('click', () => {
            const targetPropertyKey = this.plugin.settings.bannerProperty;
            const file = this.app.workspace.getActiveFile();
            
            if(file == null) return;

            this.app.fileManager.processFrontMatter(
                file,
                (frontmatter) => {
                    frontmatter[targetPropertyKey] = img.src;
                }
            );

            this.close();
        });
    }

    private createImageWrapper(): HTMLElement {
        const wrapper = document.createElement("div");
        wrapper.classList.add('image-select-wrapper');
        
        return wrapper;
    }

    private createGridContainer(): HTMLElement {
        const container = document.createElement("div");
        container.classList.add('image-select-grid');
        
        return container;
    }
}