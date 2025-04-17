let viz; // Tableau Viz object
let isVizLoaded = false; // Track if viz is fully loaded

function initViz() {
  const containerDiv = document.getElementById("vizContainer");
  const url = "https://public.tableau.com/views/Costco_17441537491340/Dashboard1";

  const options = {
    hideTabs: true,
    hideToolbar: true,
    width: "100%",
    height: "800px",
    onFirstInteractive: () => {
      isVizLoaded = true;
      document.getElementById("status").innerText = "✅ Dashboard loaded.";
      document.getElementById("refreshButton").disabled = false;
    }
  };

  try {
    viz = new tableau.Viz(containerDiv, url, options);
  } catch (err) {
    document.getElementById("status").innerText = `❌ Failed to load dashboard: ${err.message}`;
  }
}

async function uploadFile() {
  const file = document.getElementById("fileInput").files[0];
  const status = document.getElementById("status");
  if (!file) {
    status.innerText = "⚠️ No file selected.";
    return;
  }

  status.innerText = "📤 Uploading...";

  const formData = new FormData();
  formData.append("file", file);

  try {
    const res = await fetch("/upload", {
      method: "POST",
      body: formData,
    });
    const msg = await res.text();
    status.innerText = msg;
  } catch (err) {
    status.innerText = `❌ Upload failed: ${err.message}`;
  }
}

async function runExtraction() {
  const status = document.getElementById("status");
  status.innerText = "⏳ Triggering extraction...";

  try {
    const res = await fetch("/run-extraction", { method: "POST" });
    const msg = await res.text();

    if (res.ok) {
      status.innerText = `✅ ${msg}`;
    } else {
      status.innerText = `❌ Error: ${msg}`;
    }
  } catch (err) {
    status.innerText = `❌ Error: ${err.message}`;
  }
}

async function refreshTableau() {
  const status = document.getElementById("status");
  const refreshButton = document.getElementById("refreshButton");

  if (!viz || !isVizLoaded) {
    status.innerText = "⚠️ Dashboard not yet loaded. Please wait.";
    return;
  }

  status.innerText = "🔄 Refreshing dashboard...";
  refreshButton.disabled = true;

  try {
    // Try refreshDataAsync first
    await viz.refreshDataAsync();
    
    // If data doesn't update, dispose and reload with cache-busting parameter
    viz.dispose();
    isVizLoaded = false;
    const containerDiv = document.getElementById("vizContainer");
    const baseUrl = "https://public.tableau.com/views/Costco_17441537491340/Dashboard1";
    const cacheBustUrl = `${baseUrl}?:refresh=true&cacheBust=${Date.now()}`;
    const options = {
      hideTabs: true,
      hideToolbar: true,
      width: "100%",
      height: "800px",
      onFirstInteractive: () => {
        isVizLoaded = true;
        status.innerText = "✅ Dashboard refreshed with latest data.";
        refreshButton.disabled = false;
      }
    };
    viz = new tableau.Viz(containerDiv, cacheBustUrl, options);
  } catch (err) {
    status.innerText = `❌ Failed to refresh dashboard: ${err.message}. Ensure the Google Sheet is accessible and try again.`;
    refreshButton.disabled = false;
  }
}

document.addEventListener("DOMContentLoaded", () => {
  document.getElementById("refreshButton").disabled = true; // Disable refresh until viz loads
  initViz();
});