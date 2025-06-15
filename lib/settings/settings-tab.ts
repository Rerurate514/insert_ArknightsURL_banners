import { IMAGE_TOTAL } from "lib/const/max_images_cnt";
import IAUBPlugin from "main";
import { App, PluginSettingTab, Setting } from "obsidian";

export class IAUBSettingTab extends PluginSettingTab {
	plugin: IAUBPlugin;

	constructor(app: App, plugin: IAUBPlugin) {
		super(app, plugin);
		this.plugin = plugin;
	}

	display(): void {
		const {containerEl} = this;

		containerEl.empty();

		new Setting(containerEl)
			.setName('insert arknights url property')
			.setDesc('default is "banner"')
			.addText(text => text
				.setPlaceholder('default is "banner"')
				.setValue(this.plugin.settings.bannerProperty)
				.onChange(async (value) => {
					this.plugin.settings.bannerProperty = value;
					await this.plugin.saveSettings();
				}));

		new Setting(containerEl)
			.setName('Number of images to display')
			.setDesc('Changes the number of images displayed on the modal. However, if there are too many, loading will take a long time.')
            .addText(text => {
                text.inputEl.type = 'number';
                text.inputEl.min = '1';
                text.inputEl.max = IMAGE_TOTAL.toString();
                text.inputEl.step = '1';
                
                text
                    .setPlaceholder('1-' + IMAGE_TOTAL.toString())
                    .setValue(this.plugin.settings.imagesPerPage.toString())
                    .onChange(async (value) => {
                        const num = parseInt(value);
                        if (!isNaN(num) && num >= 1 && num <= IMAGE_TOTAL) {
                            this.plugin.settings.imagesPerPage = num;
                            await this.plugin.saveSettings();
                        }
                    });
                
                text.inputEl.addEventListener('invalid', () => {
                    text.inputEl.classList.add("textField-warn")
                });
                
                text.inputEl.addEventListener('input', () => {
                    if (text.inputEl.validity.valid) {
                        text.inputEl.classList.remove("textField-success")
                        text.inputEl.classList.add("textField-success")
                    } else {
                        text.inputEl.classList.remove("textField-success")
                        text.inputEl.classList.add("textField-success")
                    }
                });
            });
	}
}
