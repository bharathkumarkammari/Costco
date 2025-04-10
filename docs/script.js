const CLIENT_ID = "99397436308-j1g6c22j42jmoa0355gsieab7cmgubjt.apps.googleusercontent.com";
const API_KEY = "AIzaSyAsYIv9OQPDiwTVEYOY2PnFY6ldsaTjtD4";
const FOLDER_ID = "1RgeXz5ubmZmI7ejjN5VJJv-Le7HnFy_y";
const SCOPES = "https://www.googleapis.com/auth/drive.readonly";

let tokenClient;
let accessToken = null;
let gapiReady = false;
let gisReady = false;

function gapiLoaded() {
  gapi.load('client', async () => {
    await gapi.client.init({ apiKey: API_KEY });
    gapiReady = true;
    maybeEnableSignIn();
  });
}

function gisLoaded() {
  tokenClient = google.accounts.oauth2.initTokenClient({
    client_id: CLIENT_ID,
    scope: SCOPES,
    callback: (tokenResponse) => {
      accessToken = tokenResponse.access_token;
      document.getElementById("status").innerText = "✅ Signed in. Ready to upload.";
    },
  });
  gisReady = true;
  maybeEnableSignIn();
}

function maybeEnableSignIn() {
  if (gapiReady && gisReady) {
    document.getElementById("signin").disabled = false;
    document.getElementById("status").innerText = "🔓 Ready to sign in.";
  }
}

function authenticate() {
  if (!tokenClient) {
    document.getElementById("status").innerText = "⏳ Google not ready yet.";
    return;
  }
  tokenClient.requestAccessToken();
}

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
  status.innerText = "⚙️ Triggering GitHub Action...";

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
      status.innerText = "✅ GitHub Action triggered successfully!";
    } else {
      const result = await res.json();
      status.innerText = "❌ GitHub trigger failed: " + (result.message || res.statusText);
    }
  } catch (err) {
    status.innerText = "❌ Trigger error: " + err.message;
  }
}
