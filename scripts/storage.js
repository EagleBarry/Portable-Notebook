function saveTabs(tabs) {
	if (!Array.isArray(tabs)) tabs = [];
	chrome.storage.sync.set({ tabs }, () => {
		console.log("Tabs saved");
	});
}
