const GITHUB_TOKEN_FILE_ID = "1z4uVLj35r6K6ux9z4c5j8hjnIcva0Mow";
const REPO = "bharathkumarkammari/Costco";
const BRANCH = "main";
const UPLOAD_FOLDER = "uploads";

async function handleExtraction() {
  const file = document.getElementById("fileInput").files[0];
  const status = document.getElementById("status");
  if (!file) {
    status.innerText = "⚠️ Please select a file.";
    return;
  }

  status.innerText = "⏳ Getting GitHub token...";
  const tokenRes = await fetch(`https://www.googleapis.com/drive/v3/files/${GITHUB_TOKEN_FILE_ID}?alt=media`);
  const token = (await tokenRes.text()).trim();

  const reader = new FileReader();
  reader.onload = async () => {
    const content = btoa(reader.result);
    const filename = file.name.replace(/\s+/g, "_");
    const path = `${UPLOAD_FOLDER}/${Date.now()}_${filename}`;

    status.innerText = "📤 Uploading to GitHub...";
    const uploadRes = await fetch(`https://api.github.com/repos/${REPO}/contents/${path}`, {
      method: "PUT",
      headers: {
        Authorization: `Bearer ${token}`,
        Accept: "application/vnd.github.v3+json"
      },
      body: JSON.stringify({
        message: `Upload Costco receipt ${file.name}`,
        content,
        branch: BRANCH
      })
    });

    if (!uploadRes.ok) {
      const err = await uploadRes.json();
      return status.innerText = `❌ Upload failed: ${err.message}`;
    }

    status.innerText = "⚙️ Triggering GitHub Action...";
    const trigger = await fetch(`https://api.github.com/repos/${REPO}/actions/workflows/run_parser.yml/dispatches`, {
      method: "POST",
      headers: {
        Authorization: `Bearer ${token}`,
        Accept: "application/vnd.github.v3+json"
      },
      body: JSON.stringify({ ref: BRANCH })
    });

    if (!trigger.ok) {
      const err = await trigger.json();
      return status.innerText = `❌ Trigger failed: ${err.message}`;
    }

    status.innerText = "✅ Extraction started! Google Sheet will update shortly.";
  };

  reader.readAsBinaryString(file);
}