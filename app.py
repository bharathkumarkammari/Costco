from flask import Flask, request, render_template
import os
import base64
from github import Github

app = Flask(__name__)

@app.route("/")
def home():
    return render_template("index.html")

@app.route("/upload", methods=["POST"])
def upload():
    uploaded_file = request.files["file"]
    if not uploaded_file:
        return "❌ No file received", 400

    # GitHub token from Railway environment variable
    github_token = os.getenv("GITHUB_TOKEN")
    if not github_token:
        return "❌ Missing GitHub token", 500

    g = Github(github_token)
    repo = g.get_user().get_repo("Costco")
    path = f"uploads/{uploaded_file.filename}"
    content = uploaded_file.read()
    encoded_content = base64.b64encode(content).decode("utf-8")

    try:
        repo.create_file(path=path, message="📄 Upload receipt", content=encoded_content, branch="main")
        return "✅ File uploaded to GitHub!"
    except Exception as e:
        return f"❌ Upload failed: {e}", 500

if __name__ == "__main__":
    port = int(os.environ.get("PORT", 5000))  # Railway sets this
    app.run(host="0.0.0.0", port=port, debug=False)