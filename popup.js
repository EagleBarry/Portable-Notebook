let tabToName = null;
let tabToDelete = null;

function showNameModal(tabId) {
	tabToName = tabId;
	const modal = document.getElementById("NameModal");
	const input = document.getElementById("newTabName");
	input.value = "";
	chrome.storage.sync.get(["tabs"], (result) => {
		const tabs = result.tabs || [];
		const tab = tabs.find((tab) => tab.id === tabId);
		if (tab) input.value = tab.name;
	});

	modal.style.display = "flex";
	input.focus();
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
	if (e.target.id === "deleteModal") {
		hideDeleteModal();
	}
});

function hideNameModal() {
	document.getElementById("NameModal").style.display = "none";
	tabToName = null;
}

function NameTab(tabId) {
	showNameModal(tabId);
}

document.getElementById("confirmName").addEventListener("click", () => {
	if (!tabToName) return;

	const newName = document.getElementById("newTabName").value.trim();
	if (newName === "") return;

	chrome.storage.sync.get(["tabs"], (result) => {
		const tabs = result.tabs || [];
		const tab = tabs.find((tab) => tab.id === tabToName);
		if (tab) {
			tab.name = newName;
			saveTabs(tabs);
			renderTabs(tabs);
		}
	});

	hideNameModal();
});

document.getElementById("cancelName").addEventListener("click", hideNameModal);

document.getElementById("NameModal").addEventListener("click", (e) => {
	if (e.target.id === "NameModal") {
		hideNameModal();
	}
});

function addTab() {
	showNameModal(null);
}

function confirmAddTab() {
	const newName = document.getElementById("newTabName").value.trim();
	if (newName === "") return;

	chrome.storage.sync.get(["tabs"], (result) => {
		const tabs = result.tabs || [];
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

	hideNameModal();
}

document.getElementById("confirmName").addEventListener("click", () => {
	if (tabToName === null) {
		confirmAddTab();
	} else {
		const newName = document.getElementById("newTabName").value.trim();
		if (newName === "") return;

		chrome.storage.sync.get(["tabs"], (result) => {
			const tabs = result.tabs || [];
			const tab = tabs.find((tab) => tab.id === tabToName);
			if (tab) {
				tab.name = newName;
				saveTabs(tabs);
				renderTabs(tabs);
			}
		});

		hideNameModal();
	}
});

document.addEventListener("DOMContentLoaded", () => {
	loadTabs();

	document.getElementById("addTab").addEventListener("click", () => {
		tabToName = null;
		showNameModal(null);
	});

	document
		.getElementById("noteContent")
		.addEventListener("input", saveCurrentTabContent);
});

function loadTabs() {
	chrome.storage.sync.get(
		["tabs", "lastCopiedToTab", "lastActiveTab"],
		(result) => {
			const tabs = result.tabs || [];
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
	const tabsContainer = document.getElementById("tabs");
	tabsContainer.innerHTML = "";

	tabs.forEach((tab, index) => {
		const tabElement = document.createElement("div");
		tabElement.className = "tab";
		if (index === 0) tabElement.classList.add("active");

		const tabName = document.createElement("span");
		tabName.textContent = tab.name;
		tabName.addEventListener("dblclick", () => {
			NameTab(tab.id);
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
		const tabs = result.tabs || [];
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

function addTab() {
	const tabName = prompt("Enter a name for the new tab:");
	if (tabName === null) return;

	chrome.storage.sync.get(["tabs"], (result) => {
		const tabs = result.tabs || [];
		const newTab = {
			id: Date.now().toString(),
			name: tabName.trim() || `Untitled Note ${tabs.length + 1}`,
			content: "",
		};
		tabs.push(newTab);
		saveTabs(tabs);
		renderTabs(tabs);
		switchTab(newTab.id);
	});
}

function NameTab(tabId) {
	chrome.storage.sync.get(["tabs"], (result) => {
		const tabs = result.tabs || [];
		const tab = tabs.find((tab) => tab.id === tabId);
		if (!tab) return;

		const newName = prompt("Name for tab:", tab.name);
		if (newName !== null) {
			tab.name = newName.trim() || tab.name;
			saveTabs(tabs);
			renderTabs(tabs);
		}
	});
}

function deleteTab(tabId) {
	chrome.storage.sync.get(["tabs", "lastActiveTab"], (result) => {
		let tabs = result.tabs || [];
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

function saveCurrentTabContent() {
	chrome.storage.sync.get(["tabs"], (result) => {
		const tabs = result.tabs || [];
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
