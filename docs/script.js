async function handleExtraction() {
  const status = document.getElementById("status");
  const file = document.getElementById("fileInput").files[0];

  if (!file) {
    status.innerText = "⚠️ Please select a file.";
    return;
  }

  status.innerText = "📤 Uploading to GitHub...";
  
  try {
    const formData = new FormData();
    formData.append("file", file);

    // Upload to GitHub backend endpoint (must support CORS)
    const res = await fetch("https://your-backend-endpoint/upload", {
      method: "POST",
      body: formData
    });

    if (!res.ok) throw new Error("Upload failed");

    // Trigger GitHub Action
    await fetch("https://api.github.com/repos/bharathkumarkammari/Costco/actions/workflows/run_parser.yml/dispatches", {
      method: "POST",
      headers: {
        Authorization: "Bearer YOUR_GITHUB_PAT",
        Accept: "application/vnd.github.v3+json"
      },
      body: JSON.stringify({ ref: "main" })
    });

    status.innerText = "✅ Workflow triggered successfully!";
  } catch (err) {
    console.error("Upload error:", err);
    status.innerHTML = `❌ <b>Error:</b> ${err.message}`;
  }
}