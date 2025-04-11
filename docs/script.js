const GITHUB_REPO = "bharathkumarkammari/Costco";
const BRANCH = "main";
const FILE_UPLOAD_PATH = "uploads";

// Optional: for local dev testing only (you can inject this in browser console)
const TEST_GITHUB_TOKEN = ""; // e.g., "ghp_abc123..." (do NOT hardcode in production)

async function uploadToGitHub() {
  const fileInput = document.getElementById("fileInput");
  const status = document.getElementById("status");
  const file = fileInput.files[0];

  if (!file) {
    status.innerText = "⚠️ Please select a file.";
    return;
  }

  status.innerText = "📤 Uploading to GitHub...";

  try {
    const reader = new FileReader();
    reader.onload = async () => {
      const content = reader.result.split(',')[1]; // Extract base64

      const res = await fetch(`https://api.github.com/repos/${GITHUB_REPO}/contents/${FILE_UPLOAD_PATH}/${encodeURIComponent(file.name)}`, {
        method: "PUT",
        headers: {
          Authorization: `Bearer ${TEST_GITHUB_TOKEN}`,
          Accept: "application/vnd.github.v3+json"
        },
        body: JSON.stringify({
          message: `📄 Upload receipt ${file.name}`,
          content: content,
          branch: BRANCH
        })
      });

      const result = await res.json();
      if (!res.ok) throw new Error(result.message || "Upload failed");

      status.innerText = "✅ File uploaded to GitHub! Triggered GitHub Action.";
    };

    reader.onerror = () => {
      status.innerText = "❌ Failed to read file.";
    };

    reader.readAsDataURL(file);
  } catch (err) {
    console.error(err);
    status.innerHTML = `❌ <b>Error:</b> ${err.message}`;
  }
}