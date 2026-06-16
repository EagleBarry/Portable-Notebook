document.addEventListener("DOMContentLoaded", () => {
	loadTabs();

	document.getElementById("addTab").addEventListener("click", addTab);

	document
		.getElementById("noteContent")
		.addEventListener("input", saveCurrentTabContent);

	document.getElementById("transferModal").addEventListener("click", (e) => {
		if (e.target.id === "transferModal") {
			document.getElementById("transferModal").style.display = "none";
		}
	});
});
