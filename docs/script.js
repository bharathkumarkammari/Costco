const GITHUB_REPO = "bharathkumarkammari/Costco";
const BRANCH = "main";
const TOKEN_FILE_ID = "1z4uVLj35r6K6ux9z4c5j8hjnIcva0Mow"; // base64 token.txt

async function uploadToGitHub() {
  const fileInput = document.getElementById("fileInput");
  const status = document.getElementById("status");
  const file = fileInput.files[0];

  if (!file) {
    status.innerText = "⚠️ Please select a file.";
    return;
  }

  status.innerText = "📥 Fetching token...";

  try {
    // Step 1: Get Base64-encoded token from Drive
    const tokenRes = await fetch(`https://corsproxy.io/?https://drive.google.com/uc?export=download&id=${TOKEN_FILE_ID}`);
    if (!tokenRes.ok) throw new Error("❌ Failed to fetch token from Drive");
    const base64Token = (await tokenRes.text()).trim();

    // Step 2: Decode token
    const decodedToken = atob(base64Token);

    // Step 3: Convert file to base64
    const arrayBuffer = await file.arrayBuffer();
    const base64Content = btoa(String.fromCharCode(...new Uint8Array(arrayBuffer)));

    // Step 4: Upload to GitHub
    status.innerText = "📤 Uploading to GitHub...";
    const apiUrl = `https://api.github.com/repos/${GITHUB_REPO}/contents/uploads/${encodeURIComponent(file.name)}`;
    const uploadRes = await fetch(apiUrl, {
      method: "PUT",
      headers: {
        Authorization: `Bearer ${decodedToken}`,
        Accept: "application/vnd.github.v3+json"
      },
      body: JSON.stringify({
        message: `📄 Upload receipt ${file.name}`,
        content: base64Content,
        branch: BRANCH
      })
    });

    const result = await uploadRes.json();
    if (!uploadRes.ok) throw new Error(result.message || "Upload failed");

    status.innerText = `✅ File uploaded to GitHub! File ID: ${result.content.sha}`;
  } catch (err) {
    console.error(err);
    status.innerHTML = `❌ <b>Error:</b> ${err.message}`;
  }
}