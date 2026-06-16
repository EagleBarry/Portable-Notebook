let tabToName = null;
let tabToDelete = null;
const customArea = document.getElementById("my-custom-area");

customArea.addEventListener("contextmenu", (e) => {
	e.preventDefault();
	const oldMenu = document.getElementById("customContextMenu");
	if (!!oldMenu) oldMenu.remove();

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
	});

	const clearActiveTab = document.createElement("div");
	clearActiveTab.textContent = "Clear Active tab";
	clearActiveTab.style.padding = "8px 12px";
	clearActiveTab.style.cursor = "pointer";
	clearActiveTab.addEventListener("click", () => {
		chrome.storage.sync.get(["tabs", "lastActiveTab"], (result) => {
			const allTabs = Array.isArray(result.tabs) ? result.tabs : [];
			const lastActiveTab = result.lastActiveTab;
			const targetTab = allTabs.find((t) => t.id === lastActiveTab);
			if (targetTab) {
				targetTab.content = "";
				document.getElementById("noteContent").value = "";
			}
			chrome.storage.sync.set({
				tabs: allTabs,
			});
		});
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

function loadTabs() {
	chrome.storage.sync.get(
		["tabs", "lastCopiedToTab", "lastActiveTab"],
		(result) => {
			const tabs = Array.isArray(result.tabs) ? result.tabs : [];
			const lastCopiedToTab = result.lastCopiedToTab;
			const lastActiveTab = result.lastActiveTab;

			if (tabs.length === 0) {
				const defaultTab = {
					id: Date.now().toString(),
					name: "Note 1",
					content: "",
				};
				tabs.push(defaultTab);
				saveTabs(tabs);
			}

			renderTabs(tabs);

			if (lastCopiedToTab) {
				switchTab(lastCopiedToTab);
				chrome.storage.sync.remove(["lastCopiedToTab"]);
			} else if (lastActiveTab) {
				switchTab(lastActiveTab);
			}
		},
	);
}

function saveTabs(tabs) {
	chrome.storage.sync.set({ tabs }, () => {
		console.log("Tabs saved");
	});
}

function renderTabs(tabs) {
	if (!Array.isArray(tabs)) tabs = [];

	if (tabs.length === 0) return;

	const tabsContainer = document.getElementById("tabs");
	tabsContainer.innerHTML = "";

	tabs.forEach((tab, index) => {
		const tabElement = document.createElement("div");
		tabElement.className = "tab";
		if (index === 0) tabElement.classList.add("active");

		const tabName = document.createElement("span");
		tabName.className = "tab-name";
		tabName.textContent = tab.name;
		tabName.addEventListener("dblclick", (e) => {
			e.stopPropagation();
			showNameModal(tab.id);
		});

		const closeButton = document.createElement("span");
		closeButton.className = "tab-close";
		closeButton.textContent = "X";
		closeButton.addEventListener("click", (e) => {
			e.stopPropagation();
			showDeleteModal(tab.id, tab.name);
		});

		tabElement.appendChild(tabName);
		tabElement.appendChild(closeButton);
		tabElement.addEventListener("click", () => {
			switchTab(tab.id);
		});

		tabsContainer.appendChild(tabElement);
	});

	if (tabs.length > 0) {
		document.getElementById("noteContent").value = tabs[0].content;
	}
}

function switchTab(tabId) {
	chrome.storage.sync.get(["tabs"], (result) => {
		const tabs = Array.isArray(result.tabs) ? result.tabs : [];
		const tabIndex = tabs.findIndex((tab) => tab.id === tabId);
		if (tabIndex === -1) return;

		const tabElements = document.querySelectorAll(".tab");
		tabElements.forEach((tab, index) => {
			tab.classList.toggle("active", index === tabIndex);
		});

		document.getElementById("noteContent").value = tabs[tabIndex].content;
		chrome.storage.sync.set({ lastActiveTab: tabId });
	});
}

function saveCurrentTabContent() {
	chrome.storage.sync.get(["tabs"], (result) => {
		const tabs = Array.isArray(result.tabs) ? result.tabs : [];
		const activeTabElement = document.querySelector(".tab.active");
		if (!activeTabElement) return;

		const activeTabIndex = Array.from(
			document.querySelectorAll(".tab"),
		).indexOf(activeTabElement);
		if (activeTabIndex === -1 || !tabs[activeTabIndex]) return;

		tabs[activeTabIndex].content = document.getElementById("noteContent").value;
		saveTabs(tabs);
	});
}

function showNameModal(tabId) {
	tabToName = tabId;
	const modal = document.getElementById("NameModal");
	const input = document.getElementById("newTabName");

	if (tabId) {
		chrome.storage.sync.get(["tabs"], (result) => {
			const tabs = Array.isArray(result.tabs) ? result.tabs : [];
			const tab = tabs.find((tab) => tab.id === tabId);
			if (tab) input.value = tab.name;
		});
	} else {
		input.value = "";
	}

	modal.style.display = "flex";
	input.focus();
}

function hideNameModal() {
	document.getElementById("NameModal").style.display = "none";
}

function showDeleteModal(tabId, tabName) {
	tabToDelete = tabId;
	const modal = document.getElementById("deleteModal");
	const message = document.getElementById("deleteModalMessage");
	message.textContent = `Are you sure you want to delete "${tabName}"?`;
	modal.style.display = "flex";
}

function hideDeleteModal() {
	document.getElementById("deleteModal").style.display = "none";
	tabToDelete = null;
}

function addTab() {
	showNameModal(null);
}

function confirmNameAction() {
	const newName = document.getElementById("newTabName").value.trim();
	if (newName === "") return;

	if (tabToName === null) {
		chrome.storage.sync.get(["tabs"], (result) => {
			const tabs = Array.isArray(result.tabs) ? result.tabs : [];
			const newTab = {
				id: Date.now().toString(),
				name: newName,
				content: "",
			};
			tabs.push(newTab);
			saveTabs(tabs);
			renderTabs(tabs);
			switchTab(newTab.id);
		});
	} else {
		chrome.storage.sync.get(["tabs"], (result) => {
			const tabs = Array.isArray(result.tabs) ? result.tabs : [];
			const tabIndex = tabs.findIndex((tab) => tab.id === tabToName);
			if (tabIndex !== -1) {
				tabs[tabIndex].name = newName;
				saveTabs(tabs);
				renderTabs(tabs);
			}
		});
	}

	hideNameModal();
}

function deleteTab(tabId) {
	chrome.storage.sync.get(["tabs", "lastActiveTab"], (result) => {
		let tabs = Array.isArray(result.tabs) ? result.tabs : [];
		const lastActiveTab = result.lastActiveTab;

		tabs = tabs.filter((tab) => tab.id !== tabId);
		saveTabs(tabs);
		renderTabs(tabs);

		if (lastActiveTab === tabId) {
			chrome.storage.sync.remove(["lastActiveTab"]);
		}

		if (tabs.length > 0) {
			document.getElementById("noteContent").value = tabs[0].content;
			chrome.storage.sync.set({ lastActiveTab: tabs[0].id });
		} else {
			document.getElementById("noteContent").value = "";
			chrome.storage.sync.remove(["lastActiveTab"]);
		}
	});
}

document.getElementById("cancelTransfer").addEventListener("click", () => {
	document.getElementById("transferModal").style.display = "none";
});

document.getElementById("confirmTransfer").addEventListener("click", () => {
	const checkboxes = document.querySelectorAll(
		"#transferTabList input[type='checkbox']:checked",
	);
	const selectedTabIds = Array.from(checkboxes).map(
		(checkbox) => checkbox.value,
	);

	if (selectedTabIds.length === 0) {
		return;
	}

	chrome.storage.sync.get(["lastActiveTab", "tabs"], (result) => {
		const currentTabId = result.lastActiveTab;
		const allTabs = result.tabs || [];
		const currentTab = allTabs.find((tab) => tab.id === currentTabId);

		if (!currentTab) {
			return;
		}

		selectedTabIds.forEach((tabId) => {
			const targetTab = allTabs.find((tab) => tab.id === tabId);
			if (targetTab) {
				targetTab.content += "\n\n" + currentTab.content;
			}
		});

		chrome.storage.sync.set({ tabs: allTabs }, () => {
			document.getElementById("transferModal").style.display = "none";
		});
	});
});

document.addEventListener("DOMContentLoaded", () => {
	loadTabs();

	document.getElementById("addTab").addEventListener("click", addTab);

	document.getElementById("transferModal").addEventListener("click", (e) => {
		if (e.target.id === "transferModal") {
			document.getElementById("transferModal").style.display = "none";
		}
	});

	document
		.getElementById("confirmName")
		.addEventListener("click", confirmNameAction);
	document
		.getElementById("cancelName")
		.addEventListener("click", hideNameModal);
	document.getElementById("NameModal").addEventListener("click", (e) => {
		if (e.target.id === "NameModal") hideNameModal();
	});

	document.getElementById("confirmDelete").addEventListener("click", () => {
		if (tabToDelete) {
			deleteTab(tabToDelete);
			hideDeleteModal();
		}
	});
	document
		.getElementById("cancelDelete")
		.addEventListener("click", hideDeleteModal);
	document.getElementById("deleteModal").addEventListener("click", (e) => {
		if (e.target.id === "deleteModal") hideDeleteModal();
	});

	document
		.getElementById("noteContent")
		.addEventListener("input", saveCurrentTabContent);
});
