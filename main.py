import os
from flask import Flask, request
from github import Github
import base64

app = Flask(__name__)

GITHUB_TOKEN = os.environ.get("GITHUB_PAT")
REPO_NAME = "bharathkumarkammari/Costco"

@app.route("/upload", methods=["POST"])
def upload():
    file = request.files.get("file")
    if not file:
        return "❌ No file uploaded.", 400

    github = Github(GITHUB_TOKEN)
    repo = github.get_repo(REPO_NAME)

    content = base64.b64encode(file.read()).decode("utf-8")
    path = f"uploads/{file.filename}"

    repo.create_file(path, f"📄 Upload {file.filename}", content, branch="main")
    return "✅ Upload and GitHub trigger success!"
