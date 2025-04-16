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
    status.innerText = "❌ Upload failed.";
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

function refreshTableau() {
  const status = document.getElementById("status");
  const frame = document.getElementById("tableauFrame");
  frame.src = frame.src;  // Reload the iframe
  status.innerText = "🔄 Dashboard refreshed with latest data.";
}