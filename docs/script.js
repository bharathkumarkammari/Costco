const CLIENT_ID = "99397436308-j1g6c22j42jmoa0355gsieab7cmgubjt.apps.googleusercontent.com";
const FOLDER_ID = "1RgeXz5ubmZmI7ejjN5VJJv-Le7HnFy_y";
const SCOPES = "https://www.googleapis.com/auth/drive.readonly";

let accessToken = null;

function authenticate() {
  const authUrl = `https://accounts.google.com/o/oauth2/v2/auth?` +
    `client_id=${CLIENT_ID}` +
    `&redirect_uri=${window.location.origin}${window.location.pathname}` +
    `&response_type=token` +
    `&scope=${encodeURIComponent(SCOPES)}` +
    `&prompt=consent`;

  window.location.href = authUrl;
}

// Parse token from redirect URI
window.addEventListener("load", () => {
  const hash = window.location.hash;
  if (hash.includes("access_token")) {
    const params = new URLSearchParams(hash.substring(1));
    accessToken = params.get("access_token");
    document.getElementById("status").innerText = "✅ Signed in. Ready to upload.";
    window.history.replaceState({}, document.title, window.location.pathname); // Clean up URL
  } else {
    document.getElementById("status").innerText = "🔓 Please sign in.";
  }
});

async function uploadFile() {
  const file = document.getElementById("fileInput").files[0];
  const status = document.getElementById("status");

  if (!file) {
    status.innerText = "⚠️ Please select a file.";
    return;
  }
  if (!accessToken) {
    status.innerText = "❌ Please sign in first.";
    return;
  }

  const metadata = {
    name: file.name,
    parents: [FOLDER_ID],
    mimeType: file.type,
  };

  const form = new FormData();
  form.append("metadata", new Blob([JSON.stringify(metadata)], { type: "application/json" }));
  form.append("file", file);

  status.innerText = "⏳ Uploading...";

  try {
    const res = await fetch("https://www.googleapis.com/upload/drive/v3/files?uploadType=multipart&fields=id", {
      method: "POST",
      headers: new Headers({ Authorization: "Bearer " + accessToken }),
      body: form,
    });
    const result = await res.json();
    if (res.ok) {
      status.innerText = "✅ Upload successful! File ID: " + result.id;
    } else {
      status.innerText = "❌ Upload failed: " + (result.error?.message || res.statusText);
    }
  } catch (err) {
    status.innerText = "❌ Upload error: " + err.message;
  }
}

async function triggerGitHubAction() {
  const status = document.getElementById("status");
  status.innerText = "⚙️ Extracting data...";

  try {
    const tokenRes = await fetch("https://www.googleapis.com/drive/v3/files/1z4uVLj35r6K6ux9z4c5j8hjnIcva0Mow?alt=media", {
      headers: { Authorization: "Bearer " + accessToken }
    });
    const githubToken = await tokenRes.text();

    const res = await fetch("https://api.github.com/repos/bharathkumarkammari/Costco/actions/workflows/run_parser.yml/dispatches", {
      method: "POST",
      headers: {
        Authorization: "Bearer " + githubToken.trim(),
        Accept: "application/vnd.github.v3+json"
      },
      body: JSON.stringify({ ref: "main" })
    });

    if (res.ok) {
      status.innerText = "⚙️ Extracting data...";
      setTimeout(() => {
        status.innerText = "✅ Data loaded into Google Sheets!";
      }, 30000);
    } else {
      const result = await res.json();
      status.innerText = "❌ GitHub trigger failed: " + (result.message || res.statusText);
    }
  } catch (err) {
    status.innerText = "❌ Trigger error: " + err.message;
  }
}