async function handleExtraction() {
  const file = document.getElementById("fileInput").files[0];
  const status = document.getElementById("status");
  if (!file) {
    status.innerText = "⚠️ Please select a file.";
    return;
  }

  status.innerText = "📤 Uploading to GitHub...";

  try {
    const formData = new FormData();
    formData.append("file", file);

    const res = await fetch("https://api.github.com/repos/bharathkumarkammari/Costco/contents/uploads/" + file.name, {
      method: "PUT",
      headers: {
        "Authorization": "Bearer GITHUB_TOKEN_REPLACED",
        "Content-Type": "application/json"
      },
      body: JSON.stringify({
        message: "📄 Upload receipt " + file.name,
        content: await toBase64(file),
        branch: "main"
      })
    });

    if (!res.ok) throw new Error("Upload failed");

    status.innerText = "⚙️ Upload successful. Triggering GitHub workflow...";
    const triggerRes = await fetch("https://api.github.com/repos/bharathkumarkammari/Costco/actions/workflows/run_parser.yml/dispatches", {
      method: "POST",
      headers: {
        "Authorization": "Bearer GITHUB_TOKEN_REPLACED",
        "Accept": "application/vnd.github.v3+json"
      },
      body: JSON.stringify({ ref: "main" })
    });

    if (!triggerRes.ok) throw new Error("Workflow trigger failed");

    status.innerText = "✅ Workflow triggered!";
  } catch (err) {
    console.error(err);
    status.innerHTML = "❌ <b>Error:</b> " + err.message;
  }
}

function toBase64(file) {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.readAsDataURL(file);
    reader.onload = () => resolve(reader.result.split(",")[1]);
    reader.onerror = reject;
  });
}
//we1