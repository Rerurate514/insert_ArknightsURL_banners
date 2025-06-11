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
	}
}
