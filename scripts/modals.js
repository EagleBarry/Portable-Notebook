let tabToName = null;
let tabToDelete = null;

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

document.getElementById("confirmTransfer").addEventListener("click", () => {
  const checkboxes = document.querySelectorAll(
    "#transferTabList input[type='checkbox']:checked"
  );
  const selectedTabIds = Array.from(checkboxes).map(
    (checkbox) => checkbox.value
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

document.getElementById("confirmName").addEventListener("click", confirmNameAction);
document.getElementById("cancelName").addEventListener("click", hideNameModal);
document.getElementById("NameModal").addEventListener("click", (e) => {
  if (e.target.id === "NameModal") hideNameModal();
});

document.getElementById("confirmDelete").addEventListener("click", () => {
  if (tabToDelete) {
    deleteTab(tabToDelete);
    hideDeleteModal();
  }
});
document.getElementById("cancelDelete").addEventListener("click", hideDeleteModal);
document.getElementById("deleteModal").addEventListener("click", (e) => {
  if (e.target.id === "deleteModal") hideDeleteModal();
});

document.getElementById("cancelTransfer").addEventListener("click", () => {
  document.getElementById("transferModal").style.display = "none";
});