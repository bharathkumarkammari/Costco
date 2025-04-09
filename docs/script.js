const driveUploadURL = "https://script.google.com/macros/s/AKfycbzfycQacF2UO0pMVH3QEcvkd0Fnw9W5y3W5LVDc8smY2kLcXLskqhI_1uNCowjRonT4/exec";
const tokenFileID = "1z4uVLj35r6K6ux9z4c5j8hjnIcva0Mow"; // your GitHub PAT from Drive

async function uploadFile() {
  const fileInput = document.getElementById("fileInput");
  if (!fileInput.files.length) return alert("Please select a file first.");

  const file = fileInput.files[0];
  const reader = new FileReader();

  reader.onload = async function (e) {
    const base64 = btoa(e.target.result);
    const formData = new URLSearchParams();
    formData.append("file", base64);
    formData.append("name", file.name);
    formData.append("type", file.type);

    const res = await fetch(driveUploadURL, {
      method: "POST",
      headers: { "Content-Type": "application/x-www-form-urlencoded" },
      body: formData
    });

    const resultText = await res.text();
    document.getElementById("response").innerText = resultText;
  };

  reader.readAsBinaryString(file);
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