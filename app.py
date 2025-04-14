from flask import Flask, request, render_template
import os
import base64
from github import Github
import requests

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
        
@app.route("/run-extraction", methods=["POST"])
def run_extraction():
    try:
        github_token = os.environ["GITHUB_TOKEN"]
        repo = "bharathkumarkammari/Costco"
        workflow_file = "run_parser.yml"

        response = requests.post(
            f"https://api.github.com/repos/{repo}/actions/workflows/{workflow_file}/dispatches",
            headers={
                "Authorization": f"Bearer {github_token}",
                "Accept": "application/vnd.github+json"
            },
            json={"ref": "main"}
        )

        if response.status_code == 204:
            return "✅ GitHub Action triggered!"
        else:
            return f"❌ Failed to trigger: {response.status_code} - {response.text}", 400
    except Exception as e:
        return f"❌ Error: {str(e)}", 500

if __name__ == "__main__":
    port = int(os.environ.get("PORT", 5000))  # Railway sets this
    app.run(host="0.0.0.0", port=port, debug=False)
    
