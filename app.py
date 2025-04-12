# app.py
from flask import Flask, request, render_template, jsonify
from google.oauth2 import service_account
from googleapiclient.discovery import build
from googleapiclient.http import MediaIoBaseUpload
import requests
import io
import os

app = Flask(__name__)

# === CONFIG ===
CREDS_FILE_ID = "1wp4xE4pzkjEGmYJpTxy3W39SetNyE9fo"  # Replace with your Drive file ID
CREDS_PATH = "creds.json"
FOLDER_ID = "1RgeXz5ubmZmI7ejjN5VJJv-Le7HnFy_y"
SCOPES = ["https://www.googleapis.com/auth/drive.file"]

def download_creds():
    if os.path.exists(CREDS_PATH):
        return
    url = f"https://drive.google.com/uc?export=download&id={CREDS_FILE_ID}"
    res = requests.get(url)
    if res.status_code != 200:
        raise Exception("❌ Failed to download creds.json")
    with open(CREDS_PATH, "wb") as f:
        f.write(res.content)

def init_drive():
    download_creds()
    creds = service_account.Credentials.from_service_account_file(CREDS_PATH, scopes=SCOPES)
    return build("drive", "v3", credentials=creds)

drive_service = init_drive()

@app.route("/")
def home():
    return render_template("index.html")

@app.route("/upload", methods=["POST"])
def upload_to_drive():
    file = request.files.get("file")
    if not file:
        return jsonify({"error": "No file uploaded"}), 400

    media = MediaIoBaseUpload(io.BytesIO(file.read()), mimetype=file.mimetype)
    file_metadata = {
        "name": file.filename,
        "parents": [FOLDER_ID]
    }

    uploaded = drive_service.files().create(
        body=file_metadata,
        media_body=media,
        fields="id, name"
    ).execute()

    return jsonify({
        "status": "✅ Uploaded",
        "file_name": uploaded["name"],
        "file_id": uploaded["id"]
    })

if __name__ == "__main__":
    app.run(debug=True)