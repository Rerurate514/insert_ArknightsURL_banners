import { DEFAULT_SETTINGS, IAUBPluginSettings } from 'lib/settings/settings';
import { IAUBSettingTab } from 'lib/settings/settings-tab';
import { ImageSelectModal } from 'lib/ui/modal/image_select_modal';
import { MarkdownView, Plugin } from 'obsidian';

export default class IAUBPlugin extends Plugin {
	settings: IAUBPluginSettings;

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

		this.addSettingTab(new IAUBSettingTab(this.app, this));

		this.registerDomEvent(document, 'click', (evt: MouseEvent) => {
			console.log('click', evt);
		});
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
