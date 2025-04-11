const APPS_SCRIPT_URL = "https://script.google.com/macros/s/AKfycbzQopKf3tPaks8rNVnxOgI6PICa5ELb8gRfRJjki6C5Pqe2YpOhPbK0tBd1cEoW7kBC/exec"; // replace after deployment

async function uploadToGoogleAppsScript() {
  const fileInput = document.getElementById("fileInput");
  const status = document.getElementById("status");
  const file = fileInput.files[0];

  if (!file) {
    status.innerText = "⚠️ Please select a file.";
    return;
  }

  status.innerText = "📤 Uploading to Google Drive...";

  const form = new FormData();
  form.append("file", file, file.name);

  try {
    const res = await fetch(APPS_SCRIPT_URL, {
      method: "POST",
      body: form,
    });

    const text = await res.text();
    status.innerText = text.includes("✅") ? text : "❌ Upload failed.";
  } catch (err) {
    status.innerHTML = `❌ <b>Error:</b> ${err.message}`;
  }
}