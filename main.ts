import { ImageSelectModal } from 'lib/ui/modal/image_select_modal';
import { App, MarkdownView, Plugin, PluginSettingTab, Setting } from 'obsidian';

interface MyPluginSettings {
	bannerProperty: string;
}

const DEFAULT_SETTINGS: MyPluginSettings = {
	bannerProperty: 'banner'
}

export default class MyPlugin extends Plugin {
	settings: MyPluginSettings;

	async onload() {
		await this.loadSettings();

		this.addCommand({
			id: 'select insertURL to banners',
			name: 'select-insertURL-to-banners',
			checkCallback: (checking: boolean) => {
				const markdownView = this.app.workspace.getActiveViewOfType(MarkdownView);
				if (markdownView) {
					if (!checking) {
						new ImageSelectModal(this.app, this).open();
					}

					return true;
				}
			}
		});

		this.addSettingTab(new SampleSettingTab(this.app, this));

		this.registerDomEvent(document, 'click', (evt: MouseEvent) => {
			console.log('click', evt);
		});

		this.registerInterval(window.setInterval(() => console.log('setInterval'), 5 * 60 * 1000));
	}

	onunload() {

	}

	async loadSettings() {
		this.settings = Object.assign({}, DEFAULT_SETTINGS, await this.loadData());
	}

	async saveSettings() {
		await this.saveData(this.settings);
	}
}

class SampleSettingTab extends PluginSettingTab {
	plugin: MyPlugin;

	constructor(app: App, plugin: MyPlugin) {
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
	}
}
