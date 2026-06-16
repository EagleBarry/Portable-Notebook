const customArea = document.getElementById("my-custom-area");

customArea.addEventListener("contextmenu", (e) => {
	e.preventDefault();
	const oldMenu = document.getElementById("customContextMenu");
	if (oldMenu) oldMenu.remove();

	const menu = document.createElement("div");
	menu.id = "customContextMenu";
	menu.style.position = "absolute";
	menu.style.backgroundColor = "white";
	menu.style.border = "1px solid #ccc";
	menu.style.boxShadow = "2px 2px 5px rgba(0,0,0,0.2)";
	menu.style.zIndex = "1000";
	menu.style.left = `${e.clientX}px`;
	menu.style.top = `${e.clientY}px`;

	const transferData = document.createElement("div");
	transferData.textContent = "Send tab data to different tab";
	transferData.style.padding = "8px 12px";
	transferData.style.cursor = "pointer";
	transferData.addEventListener("click", () => {
		menu.remove();
		showTransferModal();
	});

	const clearActiveTab = document.createElement("div");
	clearActiveTab.textContent = "Clear Active tab";
	clearActiveTab.style.padding = "8px 12px";
	clearActiveTab.style.cursor = "pointer";
	clearActiveTab.addEventListener("click", () => {
		clearActiveTabContent();
		menu.remove();
	});

	const closeActiveTabOption = document.createElement("div");
	closeActiveTabOption.textContent = "Close Active tab";
	closeActiveTabOption.style.padding = "8px 12px";
	closeActiveTabOption.style.cursor = "pointer";
	closeActiveTabOption.addEventListener("click", () => {
		chrome.storage.sync.get(["lastActiveTab"], (result) => {
			const lastActiveTab = result.lastActiveTab;
			deleteTab(lastActiveTab);
		});
		menu.remove();
	});

	menu.appendChild(transferData);
	menu.appendChild(clearActiveTab);
	menu.appendChild(closeActiveTabOption);
	document.body.appendChild(menu);

	document.addEventListener(
		"click",
		() => {
			menu.remove();
		},
		{ once: true },
	);
});

function showTransferModal() {
	chrome.storage.sync.get(["lastActiveTab", "tabs"], (result) => {
		const currentTabId = result.lastActiveTab;
		const allTabs = result.tabs || [];
		const otherTabs = allTabs.filter((tab) => tab.id !== currentTabId);

		const modal = document.getElementById("transferModal");
		const tabList = document.getElementById("transferTabList");
		tabList.innerHTML = "";

		otherTabs.forEach((tab) => {
			const label = document.createElement("label");
			label.style.display = "block";
			label.style.margin = "5px 0";

			const checkbox = document.createElement("input");
			checkbox.type = "checkbox";
			checkbox.value = tab.id;
			checkbox.style.marginRight = "8px";

			const tabName = document.createElement("span");
			tabName.textContent = tab.name;

			label.appendChild(checkbox);
			label.appendChild(tabName);
			tabList.appendChild(label);
		});

		modal.style.display = "flex";
	});
}
