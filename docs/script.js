const FOLDER_ID = "1RgeXz5ubmZmI7ejjN5VJJv-Le7HnFy_y";

async function handleUpload() {
  const file = document.getElementById("fileInput").files[0];
  const status = document.getElementById("status");

  if (!file) {
    status.innerText = "⚠️ Please select a file.";
    return;
  }

  status.innerText = "⏳ Uploading to Drive...";

  const metadata = {
    name: file.name,
    parents: [FOLDER_ID],
    mimeType: file.type,
  };

  const form = new FormData();
  form.append("metadata", new Blob([JSON.stringify(metadata)], { type: "application/json" }));
  form.append("file", file);

  try {
    const res = await fetch("https://www.googleapis.com/upload/drive/v3/files?uploadType=multipart&fields=id", {
      method: "POST",
      headers: new Headers({
        Authorization: "Bearer YOUR_HARDCODED_ACCESS_TOKEN"  // ❗ Replace this
      }),
      body: form,
    });

    const result = await res.json();

    if (!res.ok) {
      throw new Error(result.error?.message || res.statusText);
    }

    status.innerText = `✅ File uploaded. Triggering extraction...`;

    await triggerGitHubAction(status);
  } catch (err) {
    status.innerText = `❌ Error: ${err.message}`;
  }
}

async function triggerGitHubAction(status) {
  try {
    const tokenRes = await fetch("https://www.googleapis.com/drive/v3/files/1z4uVLj35r6K6ux9z4c5j8hjnIcva0Mow?alt=media");
    const githubToken = await tokenRes.text();

    const res = await fetch("https://api.github.com/repos/bharathkumarkammari/Costco/actions/workflows/run_parser.yml/dispatches", {
      method: "POST",
      headers: {
        Authorization: "Bearer " + githubToken.trim(),
        Accept: "application/vnd.github.v3+json"
      },
      body: JSON.stringify({ ref: "main" })
    });

    if (!res.ok) {
      const error = await res.json();
      throw new Error(error.message || res.statusText);
    }

    status.innerText = "✅ Extraction triggered! Google Sheet will update shortly.";
  } catch (err) {
    status.innerText = `❌ Trigger error: ${err.message}`;
  }
}