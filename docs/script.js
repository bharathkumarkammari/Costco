const APPS_SCRIPT_URL = "https://script.google.com/macros/s/AKfycbz9te29_-0yBXyynWkl7qSSTPLmUmv5uE8eJdL4C9t-z957WLmlcA_kudgq6xuDPNmq/exec"; // replace after deployment

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