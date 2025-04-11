const APPS_SCRIPT_URL = "https://script.google.com/macros/s/AKfycbz9te29_-0yBXyynWkl7qSSTPLmUmv5uE8eJdL4C9t-z957WLmlcA_kudgq6xuDPNmq/exec";

async function uploadToGoogleAppsScript() {
  const file = document.getElementById("fileInput").files[0];
  const status = document.getElementById("status");

  if (!file) {
    status.innerText = "⚠️ Please select a file.";
    return;
  }

  status.innerText = "📤 Uploading to Google Drive...";

  const reader = new FileReader();
  reader.onload = async () => {
    const base64 = reader.result.split(',')[1];

    const params = new URLSearchParams();
    params.append("content", base64);
    params.append("mimeType", file.type);
    params.append("name", file.name);

    try {
      const res = await fetch(APPS_SCRIPT_URL, {
        method: "POST",
        body: params
      });
      const text = await res.text();
      status.innerText = text;
    } catch (err) {
      status.innerHTML = `❌ <b>Error:</b> ${err.message}`;
    }
  };

  reader.readAsDataURL(file);
}