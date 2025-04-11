const GITHUB_REPO = "bharathkumarkammari/Costco";
const BRANCH = "main";
const TOKEN_FILE_ID = "1z4uVLj35r6K6ux9z4c5j8hjnIcva0Mow";

async function uploadToGitHub() {
  const fileInput = document.getElementById("fileInput");
  const status = document.getElementById("status");
  const file = fileInput.files[0];

  if (!file) {
    status.innerText = "⚠️ Please select a file.";
    return;
  }

  status.innerText = "📤 Uploading file to GitHub...";

  try {
    // ✅ Step 1: Get GitHub token from Google Drive (via CORS proxy)
    const raw = await fetch("https://raw.githubusercontent.com/bharathkumarkammari/Costco/main/docs/token.txt");
	const base64 = (await raw.text()).trim();
	const githubToken = atob(base64); // ⬅️ decode back

    // ✅ Step 2: Convert file to base64
    const content = await file.arrayBuffer();
    const base64Content = btoa(String.fromCharCode(...new Uint8Array(content)));

    // ✅ Step 3: Upload to GitHub
    const apiUrl = `https://api.github.com/repos/${GITHUB_REPO}/contents/uploads/${encodeURIComponent(file.name)}`;
    const res = await fetch(apiUrl, {
      method: "PUT",
      headers: {
        Authorization: `Bearer ${githubToken}`,
        Accept: "application/vnd.github.v3+json"
      },
      body: JSON.stringify({
        message: `📄 Upload receipt ${file.name}`,
        content: base64Content,
        branch: BRANCH
      })
    });

    const result = await res.json();
    if (!res.ok) {
      throw new Error(result.message || "Upload failed");
    }

    status.innerText = `✅ File uploaded to GitHub!\nSHA: ${result.content.sha}`;
  } catch (err) {
    console.error(err);
    status.innerHTML = `❌ <b>Error:</b> ${err.message}`;
  }
}