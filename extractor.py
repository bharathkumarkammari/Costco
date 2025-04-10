import pdfplumber
import pandas as pd
import re
from datetime import datetime
import gspread
from oauth2client.service_account import ServiceAccountCredentials
from googleapiclient.discovery import build
from googleapiclient.http import MediaIoBaseDownload
import requests
import io
import os

# === CONFIGURATION ===
google_sheet_name = "Costco_Input"
folder_id = "1RgeXz5ubmZmI7ejjN5VJJv-Le7HnFy_y"
creds_file_id = "1wp4xE4pzkjEGmYJpTxy3W39SetNyE9fo"
creds_path = "creds.json"

# === DOWNLOAD CREDS FROM GOOGLE DRIVE ===
def download_creds(token):
    print("📥 Downloading creds.json from Google Drive...")
    headers = {"Authorization": f"Bearer {token}"}
    url = f"https://www.googleapis.com/drive/v3/files/{creds_file_id}?alt=media"
    r = requests.get(url, headers=headers)
    if r.status_code != 200:
        raise Exception(f"❌ Failed to download creds.json: {r.text}")
    with open(creds_path, "wb") as f:
        f.write(r.content)
    print("✅ creds.json downloaded.")

# === CATEGORY MAPPING ===
category_keywords = {
    'Produce': ['SPINACH', 'GRAPES', 'MANDARINS', 'CARROT', 'ONION', 'MUSHROOMS', 'CELERY', 'CUKES', 'ROMAINE', 'POTATOES', 'HONYCRSP'],
    'Dairy': ['EGGS', 'BUTTER', 'A2', 'YOGURT', 'CHEESE'],
    'Bakery': ['BREAD', 'BRIOCHE'],
    'Pantry': ['CROUTONS', 'OATS', 'CEREAL', 'PANEER', 'RICE', 'PASTA', 'SPRING MIX', 'PALMOLIVE', 'FINISH', 'ENVY', 'TOPPER', 'SALAD'],
    'Meat': ['CHICKEN', 'BREAST', 'MEAT', 'TURKEY'],
    'Wellness': ['POM JUICE', 'VITAMIN', 'APPLE CIDER', 'GHEE', 'APL CDR VNGR'],
    'Condiments': ['SALT', 'PEPPER', 'OIL', 'VINEGAR'],
}

def categorize_item(name):
    name_upper = name.upper()
    for category, keywords in category_keywords.items():
        if any(keyword in name_upper for keyword in keywords):
            return category
    return 'Other'

def export_to_google_sheet(df, sheet_name, creds_path):
    scope = [
        "https://spreadsheets.google.com/feeds",
        "https://www.googleapis.com/auth/spreadsheets",
        "https://www.googleapis.com/auth/drive"
    ]
    creds = ServiceAccountCredentials.from_json_keyfile_name(creds_path, scope)
    client = gspread.authorize(creds)
    sheet = client.open(sheet_name).sheet1

    df['unique_key'] = df['Date'] + '_' + df['Item ID'].astype(str)

    existing_records = sheet.get_all_values()
    if existing_records and len(existing_records) > 1:
        existing_df = pd.DataFrame(existing_records[1:], columns=existing_records[0])
        existing_df['unique_key'] = existing_df['Date'] + '_' + existing_df['Item ID']
    else:
        existing_df = pd.DataFrame(columns=df.columns.tolist() + ['unique_key'])

    df = df[~df['unique_key'].isin(existing_df['unique_key'])]
    combined_df = pd.concat([existing_df.drop(columns='unique_key'), df.drop(columns='unique_key')], ignore_index=True)

    sheet.clear()
    sheet.update([combined_df.columns.tolist()] + combined_df.values.tolist())
    print(f"✅ Appended {len(df)} new rows. Total rows in sheet: {len(combined_df)}")

def get_all_costco_receipts(creds_path, folder_id):
    creds = ServiceAccountCredentials.from_json_keyfile_name(creds_path, ["https://www.googleapis.com/auth/drive"])
    service = build('drive', 'v3', credentials=creds)
    results = service.files().list(
        q=f"'{folder_id}' in parents and mimeType='application/pdf'",
        orderBy="modifiedTime desc",
        pageSize=50,
        fields="files(id, name)"
    ).execute()
    items = results.get('files', [])
    if not items:
        raise FileNotFoundError("❌ No PDF files found in the specified Google Drive folder.")
    paths = []
    for item in items:
        file_id = item['id']
        file_name = item['name']
        request = service.files().get_media(fileId=file_id)
        fh = io.BytesIO()
        downloader = MediaIoBaseDownload(fh, request)
        done = False
        while not done:
            status, done = downloader.next_chunk()
        local_pdf_path = f"/tmp/{file_name}"
        with open(local_pdf_path, 'wb') as f:
            f.write(fh.getbuffer())
        paths.append((file_name, local_pdf_path))
    return paths

if __name__ == "__main__":
    token = os.getenv("GDRIVE_TOKEN")
    download_creds(token)

    all_pdf_files = get_all_costco_receipts(creds_path, folder_id)
    all_final_items = []

    for file_name, pdf_path in all_pdf_files:
        print(f"📄 Processing file: {file_name}")
        with pdfplumber.open(pdf_path) as pdf:
            all_lines = []
            for page in pdf.pages:
                all_lines.extend(page.extract_text().split('\n'))
        cleaned_lines = [line.strip().replace('\xa0', ' ').replace('  ', ' ') for line in all_lines if line.strip()]
        receipt_date = None
        final_items = []
        last_item = None

        for line in cleaned_lines:
            date_match = re.search(r'(\d{{2}}/\d{{2}}/\d{{4}})\s+\d{{2}}:\d{{2}}', line)
            if date_match:
                receipt_date = datetime.strptime(date_match.group(1), '%m/%d/%Y').strftime('%Y-%m-%d')
                break

        i = 0
        while i < len(cleaned_lines):
            current_line = cleaned_lines[i]
            next_line = cleaned_lines[i + 1] if i + 1 < len(cleaned_lines) else ""

            if re.match(r'^[A-Z ]{{3,}}$', current_line) and re.match(r'^(\d{{5,}})\s+([A-Z0-9]+)\s+(\d+\.\d{{2}})[NY]?', next_line):
                match = re.match(r'^(\d{{5,}})\s+([A-Z0-9]+)\s+(\d+\.\d{{2}})', next_line)
                item_id, name2, price = match.groups()
                item_name = f"{{current_line}} {{name2}}"
                cat = categorize_item(item_name)
                final_items.append([receipt_date, item_id, item_name, cat, 1, float(price), float(price)])
                last_item = {{"id": item_id, "name": item_name}}
                i += 2
                continue

            match = re.match(r'^[EF]?\s*(\d{{5,}})\s+([A-Z0-9 /&-]+)\s+(\d+\.\d{{2}})\s*[NY]?$', current_line)
            if match:
                item_id, item_name, price = match.groups()
                cat = categorize_item(item_name)
                final_items.append([receipt_date, item_id, item_name, cat, 1, float(price), float(price)])
                last_item = {{"id": item_id, "name": item_name}}
                i += 1
                continue

            discount_match = re.search(r'(\d+\.\d{{2}})-$', current_line)
            if discount_match and last_item:
                discount_amount = float(discount_match.group(1))
                final_items.append([
                    receipt_date,
                    last_item['id'],
                    last_item['name'],
                    "Discount",
                    1,
                    -discount_amount,
                    -discount_amount
                ])
                i += 1
                continue

            i += 1

        for line in cleaned_lines:
            tax_match = re.match(r'^TAX\s+(\d+\.\d{{2}})$', line)
            if tax_match:
                tax_amount = float(tax_match.group(1))
                final_items.append([receipt_date, "TAX", "Sales Tax", "Tax", 1, tax_amount, tax_amount])
                break

        print(f"✅ Parsed {{len(final_items)}} rows from {{file_name}}")
        all_final_items.extend(final_items)

    df = pd.DataFrame(all_final_items, columns=[
        "Date", "Item ID", "Item Name", "Category", "Quantity", "Unit Price", "Total Price"
    ])

    export_to_google_sheet(df, google_sheet_name, creds_path)
    print(f"✅ Extracted {{len(df)}} rows from all receipts. Exported to Google Sheets.")
