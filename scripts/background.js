function updateContextMenu() {
	chrome.storage.sync.get(["tabs"], (result) => {
		const tabs = result.tabs || [];

		chrome.contextMenus.removeAll(() => {
			chrome.contextMenus.create({
				id: "copyToNotes",
				title: "Copy to Notes",
				contexts: ["selection"],
			});

			tabs.forEach((tab) => {
				chrome.contextMenus.create({
					id: `copyToTab-${tab.id}`,
					parentId: "copyToNotes",
					title: tab.name,
					contexts: ["selection"],
				});
			});
		});
	});
}

chrome.contextMenus.onClicked.addListener((info, tab) => {
	if (info.menuItemId.startsWith("copyToTab-")) {
		const tabId = info.menuItemId.replace("copyToTab-", "");
		const selectedText = info.selectionText;

		chrome.storage.sync.get(["tabs"], (result) => {
			const tabs = result.tabs || [];
			const targetTab = tabs.find((t) => t.id === tabId);
			if (targetTab) {
				targetTab.content += (targetTab.content ? "\n\n" : "") + selectedText;

				chrome.storage.sync.set({
					tabs: tabs,
					lastCopiedToTab: tabId,
				});
			}
		});
	}
});

chrome.storage.onChanged.addListener((changes, namespace) => {
	if (changes.tabs) {
		updateContextMenu();
	}
});

chrome.runtime.onInstalled.addListener(updateContextMenu);

chrome.action.onClicked.addListener(async (tab) => {
	try {
		await chrome.sidePanel.open({
			windowId: tab.windowId,
		});
	} catch (err) {
		console.error(err);
	}
});
