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
    // Step 1: Fetch GitHub token from public Google Drive
    const tokenRes = await fetch(`https://drive.google.com/uc?export=download&id=${TOKEN_FILE_ID}`);
    if (!tokenRes.ok) throw new Error("❌ Failed to fetch GitHub token from Drive");

    let githubToken = await tokenRes.text();
    githubToken = githubToken.trim().replace(/^"|"$/g, ''); // remove accidental quotes

    if (!githubToken.startsWith("ghp_") && !githubToken.startsWith("github_pat_")) {
      throw new Error("❌ Invalid GitHub token format.");
    }

    // Step 2: Convert file to base64
    const arrayBuffer = await file.arrayBuffer();
    const base64Content = btoa(String.fromCharCode(...new Uint8Array(arrayBuffer)));

    // Step 3: Upload to GitHub
    const apiUrl = `https://api.github.com/repos/${GITHUB_REPO}/contents/uploads/${encodeURIComponent(file.name)}`;
    const uploadRes = await fetch(apiUrl, {
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

    const result = await uploadRes.json();
    if (!uploadRes.ok) {
      throw new Error(result.message || "Upload failed");
    }

    status.innerText = `✅ File uploaded to GitHub! SHA: ${result.content.sha}`;
  } catch (err) {
    console.error(err);
    status.innerHTML = `❌ <b>Error:</b> ${err.message}`;
  }
}