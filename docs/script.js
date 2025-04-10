document.getElementById("uploadForm").addEventListener("submit", async function(e) {
  e.preventDefault();
  const fileInput = document.getElementById("fileInput");
  const status = document.getElementById("status");

  if (!fileInput.files.length) {
    status.innerText = "⚠️ Please select a file.";
    return;
  }

  const formData = new FormData();
  formData.append("file", fileInput.files[0]);

  status.innerText = "📤 Uploading...";

  try {
    const response = await fetch("https://your-backend-url/upload", {
      method: "POST",
      body: formData
    });

    const result = await response.text();
    status.innerText = result.includes("success") ? "✅ Upload & trigger success!" : "❌ Upload failed.";
  } catch (err) {
    console.error(err);
    status.innerText = "❌ Upload error.";
  }
});
