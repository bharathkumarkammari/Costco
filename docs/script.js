const GITHUB_REPO = "bharathkumarkammari/Costco";
const BRANCH = "main";
const TOKEN_URL = "https://raw.githubusercontent.com/bharathkumarkammari/Costco/main/docs/token.txt";

async function uploadToGitHub() {
  const fileInput = document.getElementById("fileInput");
  const status = document.getElementById("status");
  const file = fileInput.files[0];

  if (!file) {
    status.innerText = "⚠️ Please select a file.";
    return;
  }

  status.innerText = "📥 Fetching token...";

  try {
    // Step 1: Fetch and decode token (only once)
    const tokenRes = await fetch(TOKEN_URL);
    if (!tokenRes.ok) throw new Error("Failed to fetch GitHub token.");
    const githubToken = atob((await tokenRes.text()).trim());

    // Step 2: Convert file to base64
    const arrayBuffer = await file.arrayBuffer();
    const base64Content = btoa(String.fromCharCode(...new Uint8Array(arrayBuffer)));

    // Step 3: Upload to GitHub
    const apiUrl = `https://api.github.com/repos/${GITHUB_REPO}/contents/uploads/${encodeURIComponent(file.name)}`;
    status.innerText = "📤 Uploading to GitHub...";

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
    if (!res.ok) throw new Error(result.message || "Upload failed");

    status.innerText = `✅ File uploaded to GitHub!\nSHA: ${result.content.sha}`;
  } catch (err) {
    console.error(err);
    status.innerHTML = `❌ <b>Error:</b> ${err.message}`;
  }
}