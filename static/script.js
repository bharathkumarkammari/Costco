async function uploadFile() {
  const file = document.getElementById("fileInput").files[0];
  const status = document.getElementById("status");
  if (!file) {
    status.innerText = "⚠️ No file selected.";
    return;
  }
  status.innerText = "📤 Uploading...";

  const formData = new FormData();
  formData.append("file", file);

  try {
    const res = await fetch("/upload", {
      method: "POST",
      body: formData,
    });
    const msg = await res.text();
    status.innerText = msg;
  } catch (err) {
    status.innerText = "❌ Upload failed.";
  }
}
