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

		tabElements.forEach((tabEl) => tabEl.classList.remove("active"));
		if (tabElements[tabIndex]) {
			tabElements[tabIndex].classList.add("active");
		}

		document.getElementById("noteContent").value = tabs[tabIndex].content;

		chrome.storage.sync.set({
			lastActiveTab: tabId,
			activeTabId: tabId,
		});
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

function addTab() {
	showNameModal(null);
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

function clearActiveTabContent() {
	chrome.storage.sync.get(["tabs", "lastActiveTab"], (result) => {
		const allTabs = Array.isArray(result.tabs) ? result.tabs : [];
		const lastActiveTab = result.lastActiveTab;
		const targetTab = allTabs.find((t) => t.id === lastActiveTab);
		if (targetTab) {
			targetTab.content = "";
			document.getElementById("noteContent").value = "";
			saveTabs(allTabs);
		}
	});
}

const textarea = document.getElementById("noteContent");

chrome.storage.onChanged.addListener((changes, areaName) => {
	if (areaName !== "sync") return;

	if (changes.tabs) {
		chrome.storage.sync.get(["tabs", "activeTabId"], (result) => {
			const tabs = result.tabs || [];
			const activeTabId = result.activeTabId;

			const activeTab = tabs.find((t) => t.id === activeTabId);

			if (activeTab) {
				textarea.value = activeTab.content || "";
			}
		});
	}
});
