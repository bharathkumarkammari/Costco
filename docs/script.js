const TOKEN_FILE_ID = "1z4uVLj35r6K6ux9z4c5j8hjnIcva0Mow"; // 🔐 Public GitHub token file on Google Drive
const REPO = "bharathkumarkammari/Costco";                // ✅ Your repo
const BRANCH = "main";                                     // 🛠️ Branch to push to

async function handleExtraction() {
  const fileInput = document.getElementById("fileInput");
  const file = fileInput.files[0];
  const status = document.getElementById("status");

  if (!file) {
    status.innerText = "⚠️ Please select a file.";
    return;
  }

  status.innerText = "📤 Uploading to GitHub...";

  try {
    // Step 1: Get GitHub Token from Google Drive
    const tokenRes = await fetch("https://drive.google.com/uc?export=download&id=1z4uVLj35r6K6ux9z4c5j8hjnIcva0Mow");
    const githubToken = (await tokenRes.text()).trim();

    // Step 2: Read file content as base64
    const reader = new FileReader();
    reader.onload = async function () {
      const content = reader.result.split(",")[1]; // remove base64 prefix

      const fileName = file.name.replace(/\s+/g, "_"); // e.g., Costco_Receipt_01-13-2025.pdf
      const filePath = `uploads/${fileName}`;

      // Step 3: Commit the file to GitHub
      const commitRes = await fetch(`https://api.github.com/repos/${REPO}/contents/${filePath}`, {
        method: "PUT",
        headers: {
          Authorization: `Bearer ${githubToken}`,
          Accept: "application/vnd.github.v3+json"
        },
        body: JSON.stringify({
          message: `📥 Upload ${fileName}`,
          content: content,
          branch: BRANCH
        })
      });

      const result = await commitRes.json();

      if (!commitRes.ok) {
        throw new Error(result.message || "GitHub upload failed");
      }

      console.log("✅ File committed to GitHub:", result.content.path);
      status.innerText = "✅ Uploaded & triggered extractor!";
    };

    reader.readAsDataURL(file); // triggers reader.onload
  } catch (err) {
    console.error("❌ Upload error:", err);
    status.innerHTML = `❌ <b>Error:</b> ${err.message}`;
  }
}