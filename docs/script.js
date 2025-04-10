const FOLDER_ID = "1wp4xE4pzkjEGmYJpTxy3W39SetNyE9fo"; // ✅ Replace with your actual folder ID
const TOKEN_FILE_ID = "1z4uVLj35r6K6ux9z4c5j8hjnIcva0Mow"; // ✅ Replace with your actual public token file ID

async function handleUpload() {
  const file = document.getElementById("fileInput").files[0];
  const status = document.getElementById("status");

  if (!file) {
    status.innerText = "⚠️ Please select a file.";
    return;
  }

  status.innerText = "📤 Uploading file to Drive...";

  try {
    // 👉 STEP 1: Get GitHub token from public Google Drive file
    const tokenRes = await fetch(`https://www.googleapis.com/drive/v3/files/${TOKEN_FILE_ID}?alt=media`);
    const githubToken = (await tokenRes.text()).trim();

    // 👉 STEP 2: Upload the file using direct file upload endpoint (no Auth headers for public API)
    const metadata = {
      name: file.name,
      parents: [FOLDER_ID],
      mimeType: file.type
    };

    const form = new FormData();
    form.append("metadata", new Blob([JSON.stringify(metadata)], { type: "application/json" }));
    form.append("file", file);

    const uploadRes = await fetch("https://www.googleapis.com/upload/drive/v3/files?uploadType=multipart&fields=id", {
      method: "POST",
      headers: {
        Authorization: `Bearer ${githubToken}`
      },
      body: form
    });

    const uploadResult = await uploadRes.json();

    if (!uploadRes.ok) {
      throw new Error(uploadResult.error?.message || "Upload failed");
    }

    console.log("✅ File uploaded:", uploadResult.id);
    status.innerText = "⚙️ Upload successful. Triggering GitHub workflow...";

    // 👉 STEP 3: Trigger GitHub workflow
    const ghRes = await fetch("https://api.github.com/repos/bharathkumarkammari/Costco/actions/workflows/run_parser.yml/dispatches", {
      method: "POST",
      headers: {
        Authorization: `Bearer ${githubToken}`,
        Accept: "application/vnd.github.v3+json"
      },
      body: JSON.stringify({ ref: "main" })
    });

    if (!ghRes.ok) {
      const ghError = await ghRes.json();
      throw new Error(ghError.message || "GitHub workflow failed");
    }

    status.innerText = "✅ Workflow triggered! Data will appear shortly.";
  } catch (err) {
    console.error("❌ Error:", err);
    document.getElementById("status").innerHTML = `❌ <b>Error:</b> ${err.message}`;
  }
}