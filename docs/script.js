const CLIENT_ID = "99397436308-j1g6c22j42jmoa0355gsieab7cmgubjt.apps.googleusercontent.com";
const FOLDER_ID = "1RgeXz5ubmZmI7ejjN5VJJv-Le7HnFy_y";
const SCOPES = "https://www.googleapis.com/auth/drive.file";

let tokenClient;
let accessToken;

function handleAuthClick() {
  google.accounts.oauth2.initTokenClient({
    client_id: CLIENT_ID,
    scope: SCOPES,
    callback: (tokenResponse) => {
      accessToken = tokenResponse.access_token;
      document.getElementById("status").innerText = "✅ Signed in. Ready to upload.";
    },
  }).requestAccessToken();
}

async function uploadFile() {
  const fileInput = document.getElementById("fileInput");
  const file = fileInput.files[0];
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
    mimeType: file.type
  };

  const form = new FormData();
  form.append('metadata', new Blob([JSON.stringify(metadata)], {type: 'application/json'}));
  form.append('file', file);

  status.innerText = "⏳ Uploading...";

  try {
    const res = await fetch('https://www.googleapis.com/upload/drive/v3/files?uploadType=multipart&fields=id', {
      method: 'POST',
      headers: new Headers({ 'Authorization': 'Bearer ' + accessToken }),
      body: form
    });

    const result = await res.json();
    if (res.ok) {
      status.innerText = "✅ Upload successful. File ID: " + result.id;
    } else {
      status.innerText = "❌ Upload failed: " + (result.error?.message || res.statusText);
    }
  } catch (err) {
    status.innerText = "❌ Upload error: " + err.message;
  }
}
