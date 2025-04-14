# upload_to_drive.py

import os
import glob
from google.oauth2 import service_account
from googleapiclient.discovery import build
from googleapiclient.http import MediaFileUpload

# === CONFIGURATION ===
folder_id = "1RgeXz5ubmZmI7ejjN5VJJv-Le7HnFy_y"  # ✅ Your Google Drive folder
creds_path = "creds.json"  # downloaded from Drive by extractor.py

def upload_file_to_drive(file_path, drive_service):
    file_metadata = {
        "name": os.path.basename(file_path),
        "parents": [folder_id]
    }
    media = MediaFileUpload(file_path, mimetype="application/pdf")

    uploaded = drive_service.files().create(
        body=file_metadata,
        media_body=media,
        fields="id"
    ).execute()

    print(f"✅ Uploaded {file_path} to Google Drive (ID: {uploaded['id']})")
    return uploaded['id']

if __name__ == "__main__":
    print("📤 Uploading files to Google Drive...")

    creds = service_account.Credentials.from_service_account_file(
        creds_path,
        scopes=["https://www.googleapis.com/auth/drive"]
    )
    drive_service = build("drive", "v3", credentials=creds)

    pdf_files = glob.glob("uploads/*.pdf")
    if not pdf_files:
        print("⚠️ No PDF files found in uploads/")
        exit(0)

    for pdf in pdf_files:
        upload_file_to_drive(pdf, drive_service)
        os.remove(pdf)
        print(f"🗑️ Deleted local file: {pdf}")

    print("✅ All files uploaded and cleaned up.")