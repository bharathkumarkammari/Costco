const GITHUB_REPO = "bharathkumarkammari/Costco";
const BRANCH = "main";

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
      const base64Content = reader.result.split(",")[1];

      const res = await fetch(`https://api.github.com/repos/${GITHUB_REPO}/contents/uploads/${encodeURIComponent(file.name)}`, {
        method: "PUT",
        headers: {
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

      status.innerText = "✅ File uploaded to GitHub! GitHub Action triggered.";
    };

    reader.readAsDataURL(file);
  } catch (err) {
    console.error(err);
    status.innerHTML = `❌ <b>Error:</b> ${err.message}`;
  }
}