async function triggerAction() {
  const res = await fetch("https://drive.google.com/uc?export=download&id=1z4uVLj35r6K6ux9z4c5j8hjnIcva0Mow");
  const token = await res.text();

  fetch("https://api.github.com/repos/bharathkumarkammari/Costco/actions/workflows/run_parser.yml/dispatches", {
    method: "POST",
    headers: {
      "Authorization": "Bearer " + token.trim(),
      "Accept": "application/vnd.github.v3+json"
    },
    body: JSON.stringify({ ref: "main" })
  })
  .then(res => {
    if (res.ok) {
      document.getElementById("response").innerText = "✅ GitHub Action triggered!";
    } else {
      res.json().then(data => {
        document.getElementById("response").innerText = "❌ Error: " + (data.message || res.status);
      });
    }
  })
  .catch(err => {
    document.getElementById("response").innerText = "❌ Error: " + err.message;
  });
}