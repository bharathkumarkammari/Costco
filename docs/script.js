const driveUploadURL = "https://script.google.com/macros/s/AKfycbzfycQacF2UO0pMVH3QEcvkd0Fnw9W5y3W5LVDc8smY2kLcXLskqhI_1uNCowjRonT4/exec";
const tokenFileID = "1z4uVLj35r6K6ux9z4c5j8hjnIcva0Mow"; // your GitHub PAT from Drive

async function uploadFile() {
  const fileInput = document.getElementById("fileInput");
  const file = fileInput.files[0];
  const responseBox = document.getElementById("response");

  if (!file) {
    responseBox.innerText = "⚠️ Please select a file to upload.";
    responseBox.style.color = "orange";
    return;
  }

  const formData = new FormData();
  formData.append("file", file);
  formData.append("name", file.name);

  responseBox.innerText = "⏳ Uploading receipt...";
  responseBox.style.color = "black";

  try {
    const res = await fetch("https://script.google.com/macros/s/AKfycbzfycQacF2UO0pMVH3QEcvkd0Fnw9W5y3W5LVDc8smY2kLcXLskqhI_1uNCowjRonT4/exec", {
      method: "POST",
      body: formData
    });

    const resultText = await res.text();
    if (res.ok && resultText.includes("✅")) {
      responseBox.innerText = "✅ Upload successful: " + file.name;
      responseBox.style.color = "green";
    } else {
      responseBox.innerText = "❌ Upload failed: " + resultText;
      responseBox.style.color = "red";
    }
  } catch (err) {
    responseBox.innerText = "❌ Error: " + err.message;
    responseBox.style.color = "red";
  }
}
async function triggerAction() {
  try {
    const res = await fetch("https://drive.google.com/uc?export=download&id=" + tokenFileID);
    const token = await res.text();

    const ghRes = await fetch("https://api.github.com/repos/bharathkumarkammari/Costco/actions/workflows/run_parser.yml/dispatches", {
      method: "POST",
      headers: {
        "Authorization": "Bearer " + token.trim(),
        "Accept": "application/vnd.github.v3+json"
      },
      body: JSON.stringify({ ref: "main" })
    });

    if (ghRes.ok) {
      document.getElementById("response").innerText = "✅ GitHub Action triggered!";
    } else {
      const data = await ghRes.json();
      document.getElementById("response").innerText = "❌ GitHub API Error: " + (data.message || ghRes.status);
    }
  } catch (err) {
    document.getElementById("response").innerText = "❌ Error: " + err.message;
  }
}