import { ImageRepository } from "lib/features/repository/image_repository";
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
        
        this.modalEl.style.width = '70vw';
        this.modalEl.style.height = '65vh';
        this.modalEl.style.maxWidth = '1000px';
        this.modalEl.style.maxHeight = '570px';
        
        if (window.innerWidth < 768) {
            this.modalEl.style.width = '95vw';
            this.modalEl.style.height = '90vh';
        }
        
        contentEl.setText('Select Image!');
        
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

    private createControls(): HTMLElement {
        const controlsDiv = document.createElement('div');
        controlsDiv.style.display = 'flex';
        controlsDiv.style.justifyContent = 'center';
        controlsDiv.style.alignItems = 'center';
        controlsDiv.style.gap = '10px';
        controlsDiv.style.padding = '10px 20px';
        controlsDiv.style.borderBottom = '1px solid #333';
        controlsDiv.style.marginBottom = '10px';

        const prevBtn = this.createButton('← Previous', () => this.goToPreviousPage());
        prevBtn.id = 'prev-btn';
        
        const pageInfo = document.createElement('span');
        pageInfo.id = 'page-info';
        pageInfo.style.margin = '0 20px';
        pageInfo.style.fontSize = '14px';
        pageInfo.style.color = '#666';
        
        const nextBtn = this.createButton('Next →', () => this.goToNextPage());
        nextBtn.id = 'next-btn';
        
        const jumpInput = document.createElement('input');
        jumpInput.type = 'number';
        jumpInput.min = '1';
        jumpInput.max = this.totalPages.toString();
        jumpInput.style.width = '60px';
        jumpInput.style.padding = '4px 8px';
        jumpInput.style.margin = '0 10px';
        jumpInput.style.borderRadius = '4px';
        jumpInput.style.border = '1px solid #555';
        jumpInput.style.backgroundColor = '#2a2a2a';
        jumpInput.style.color = '#fff';
        
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
        btn.style.padding = '6px 12px';
        btn.style.backgroundColor = '#4a4a4a';
        btn.style.color = '#fff';
        btn.style.border = '1px solid #666';
        btn.style.borderRadius = '4px';
        btn.style.cursor = 'pointer';
        btn.style.fontSize = '12px';
        
        btn.addEventListener('click', onClick);
        
        btn.addEventListener('mouseenter', () => {
            btn.style.backgroundColor = '#5a5a5a';
        });
        
        btn.addEventListener('mouseleave', () => {
            btn.style.backgroundColor = '#4a4a4a';
        });
        
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
            
            //this.preloadNextPage();
            
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
        this.loadingElement.style.display = 'flex';
        this.loadingElement.style.justifyContent = 'center';
        this.loadingElement.style.alignItems = 'center';
        this.loadingElement.style.height = '200px';
        this.loadingElement.style.fontSize = '16px';
        this.loadingElement.style.color = '#666';
        
        const spinner = document.createElement('div');
        spinner.style.width = '20px';
        spinner.style.height = '20px';
        spinner.style.border = '2px solid #333';
        spinner.style.borderTop = '2px solid #666';
        spinner.style.borderRadius = '50%';
        spinner.style.animation = 'spin 1s linear infinite';
        spinner.style.marginRight = '10px';
        
        const style = document.createElement('style');
        style.textContent = `
            @keyframes spin {
                0% { transform: rotate(0deg); }
                100% { transform: rotate(360deg); }
            }
        `;
        document.head.appendChild(style);
        
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
        img.style.width = "100%";
        img.style.height = "100%";
        img.style.objectFit = "cover";
        img.style.objectPosition = "center";
        img.style.display = "block";
        img.style.borderRadius = "8px";
        img.style.cursor = "pointer";
        
        img.addEventListener('mouseenter', () => {
            img.style.transform = "scale(1.02)";
            img.style.transition = "transform 0.2s ease";
        });
        
        img.addEventListener('mouseleave', () => {
            img.style.transform = "scale(1)";
        });

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

        wrapper.style.width = "100%";
        wrapper.style.aspectRatio = "16/9";
        wrapper.style.overflow = "hidden";
        wrapper.style.borderRadius = "8px";
        wrapper.style.boxShadow = "0 2px 8px rgba(0, 0, 0, 0.1)";
        wrapper.style.position = "relative";
        
        return wrapper;
    }

    private createGridContainer(): HTMLElement {
        const container = document.createElement("div");

        container.style.display = "grid";
        container.style.gridTemplateColumns = "repeat(auto-fit, minmax(200px, 1fr))";
        container.style.gap = "15px";
        container.style.padding = "20px";
        container.style.maxHeight = "calc(70vh - 60px)";
        container.style.overflowY = "auto";
        container.style.scrollbarWidth = "thin";
        
        return container;
    }
}
