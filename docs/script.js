async function triggerAction() {
  try {
    // Step 1: Download token.txt from Google Drive
    const res = await fetch("https://drive.google.com/uc?export=download&id=1z4uVLj35r6K6ux9z4c5j8hjnIcva0Mow");
    const token = await res.text();

    // Step 2: Trigger GitHub Action
    const ghRes = await fetch("https://api.github.com/repos/bharathkumarkammari/Costco/actions/workflows/run_parser.yml/dispatches", {
      method: "POST",
      headers: {
        "Authorization": "Bearer " + token.trim(),
        "Accept": "application/vnd.github.v3+json"
      },
      body: JSON.stringify({ ref: "main" })
    });

    if (ghRes.ok) {
      document.getElementById("response").innerText = "✅ GitHub Action triggered successfully!";
    } else {
      const data = await ghRes.json();
      document.getElementById("response").innerText = "❌ GitHub API Error: " + (data.message || ghRes.status);
    }

  } catch (err) {
    document.getElementById("response").innerText = "❌ Script Error: " + err.message;
  }
}