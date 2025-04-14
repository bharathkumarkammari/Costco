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
def upload():
    uploaded_file = request.files["file"]
    if not uploaded_file:
        return "❌ No file received", 400

    # Step 1: Download creds.json dynamically from public Google Drive
    creds_url = "https://drive.google.com/uc?export=download&id=1z4uVLj35r6K6ux9z4c5j8hjnIcva0Mow"
    with open("creds.json", "wb") as f:
        f.write(requests.get(creds_url).content)

    # Step 2: Upload the PDF directly to Drive
    try:
        from google.oauth2 import service_account
        from googleapiclient.discovery import build
        from googleapiclient.http import MediaIoBaseUpload
        import io

        creds = service_account.Credentials.from_service_account_file("creds.json", scopes=["https://www.googleapis.com/auth/drive"])
        drive_service = build("drive", "v3", credentials=creds)

        file_metadata = {"name": uploaded_file.filename, "parents": ["1RgeXz5ubmZmI7ejjN5VJJv-Le7HnFy_y"]}
        media = MediaIoBaseUpload(uploaded_file.stream, mimetype="application/pdf", resumable=True)
        drive_service.files().create(body=file_metadata, media_body=media, fields="id").execute()
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