from flask import Flask, request, render_template
import os
import base64
import requests
from google.oauth2 import service_account
from googleapiclient.discovery import build
from werkzeug.utils import secure_filename

app = Flask(__name__)

# Load credentials once
SERVICE_ACCOUNT_FILE = 'creds.json'  # must be available in the project root
SCOPES = ['https://www.googleapis.com/auth/drive']
FOLDER_ID = '1RgeXz5ubmZmI7ejjN5VJJv-Le7HnFy_y'

@app.route("/")
def home():
    return render_template("index.html")

@app.route("/upload", methods=["POST"])
def upload_to_drive():
    file = request.files['file']
    if not file:
        return "❌ No file received", 400

    try:
        creds = service_account.Credentials.from_service_account_file(
            SERVICE_ACCOUNT_FILE, scopes=SCOPES
        )
        drive_service = build("drive", "v3", credentials=creds)

        filename = secure_filename(file.filename)
        metadata = {
            "name": filename,
            "parents": [FOLDER_ID]
        }

        media = {
            "name": filename,
            "mimeType": "application/pdf",
            "body": file.stream
        }

        drive_service.files().create(body=metadata, media_body=file.stream, fields="id").execute()
        return "✅ File uploaded to Google Drive!"
    except Exception as e:
        return f"❌ Error uploading to Drive: {e}", 500

@app.route("/run-extraction", methods=["POST"])
def run_extraction():
    import requests
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
    port = int(os.environ.get("PORT", 5000))
    app.run(host="0.0.0.0", port=port)