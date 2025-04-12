const TOKEN_FILE_ID = "1z4uVLj35r6K6ux9z4c5j8hjnIcva0Mow"; // Your public Drive ID for token.txt
const GITHUB_REPO = "bharathkumarkammari/Costco";         // Your GitHub username/repo
const WORKFLOW_FILENAME = "run_parser.yml";                // Your GitHub Action workflow file

// === Upload PDF to Flask ===
async function uploadFile() {
  const file = document.getElementById("fileInput").files[0];
  const status = document.getElementById("status");

  if (!file) {
    status.innerText = "⚠️ Please select a file.";
    return;
  }

  const formData = new FormData();
  formData.append("file", file);
  status.innerText = "📤 Uploading...";

  try {
    const res = await fetch("/upload", {
      method: "POST",
      body: formData,
    });

    const result = await res.json();
    status.innerText = res.ok
      ? `✅ Uploaded to Drive: ${result.file_name}`
      : `❌ Error: ${result.error}`;
  } catch (err) {
    status.innerText = `❌ Upload failed: ${err.message}`;
  }
}

// === Trigger GitHub Action ===
async function triggerExtractor() {
  const status = document.getElementById("status");
  status.innerText = "⚙️ Triggering extraction...";

  try {
    // 1. Get GitHub token from token.txt in public Drive
    const tokenRes = await fetch(`https://corsproxy.io/?https://drive.google.com/uc?export=download&id=${TOKEN_FILE_ID}`);
    const githubToken = (await tokenRes.text()).trim();

    // 2. Trigger GitHub Action workflow_dispatch
    const res = await fetch(`https://api.github.com/repos/${GITHUB_REPO}/actions/workflows/${WORKFLOW_FILENAME}/dispatches`, {
      method: "POST",
      headers: {
        Authorization: `Bearer ${githubToken}`,
        Accept: "application/vnd.github.v3+json"
      },
      body: JSON.stringify({ ref: "main" })
    });

    if (res.ok) {
      status.innerText = "✅ Extractor triggered! Data will appear in Google Sheet.";
    } else {
      const result = await res.json();
      status.innerText = `❌ Trigger failed: ${result.message}`;
    }
  } catch (err) {
    status.innerHTML = `❌ <b>Error:</b> ${err.message}`;
  }
}