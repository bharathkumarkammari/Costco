
const FOLDER_ID = "1RgeXz5ubmZmI7ejjN5VJJv-Le7HnFy_y";
const SERVICE_TOKEN_FILE_ID = "1z4uVLj35r6K6ux9z4c5j8hjnIcva0Mow";

async function uploadAndRun() {
  const file = document.getElementById("fileInput").files[0];
  const status = document.getElementById("status");

  if (!file) {
    status.innerText = "⚠️ Please select a file.";
    return;
  }

  status.innerText = "⏳ Uploading...";

  try {
    const metadata = {
      name: file.name,
      parents: [FOLDER_ID],
      mimeType: file.type
    };

    const form = new FormData();
    form.append("metadata", new Blob([JSON.stringify(metadata)], { type: "application/json" }));
    form.append("file", file);

    const tokenRes = await fetch("https://www.googleapis.com/drive/v3/files/" + SERVICE_TOKEN_FILE_ID + "?alt=media");
    const githubToken = await tokenRes.text();

    const uploadRes = await fetch("https://www.googleapis.com/upload/drive/v3/files?uploadType=multipart&fields=id", {
      method: "POST",
      headers: { Authorization: "Bearer " + githubToken.trim() },
      body: form
    });

    const result = await uploadRes.json();
    if (!uploadRes.ok) throw new Error(result.error?.message || uploadRes.statusText);

    status.innerText = "✅ Uploaded. Triggering extraction...";

    const triggerRes = await fetch("https://api.github.com/repos/bharathkumarkammari/Costco/actions/workflows/run_parser.yml/dispatches", {
      method: "POST",
      headers: {
        Authorization: "Bearer " + githubToken.trim(),
        Accept: "application/vnd.github.v3+json"
      },
      body: JSON.stringify({ ref: "main" })
    });

    if (!triggerRes.ok) throw new Error("GitHub Action failed");

    setTimeout(() => {
      status.innerText = "✅ Done! Data loaded into Google Sheets.";
    }, 25000);
  } catch (err) {
    status.innerText = "❌ Error: " + err.message;
  }
}
