
import gspread
from oauth2client.service_account import ServiceAccountCredentials

def run_costco_extraction():
    creds_path = "creds.json"
    scope = [
        "https://spreadsheets.google.com/feeds",
        "https://www.googleapis.com/auth/spreadsheets",
        "https://www.googleapis.com/auth/drive"
    ]
    creds = ServiceAccountCredentials.from_json_keyfile_name(creds_path, scope)
    client = gspread.authorize(creds)
    sheet = client.open("Costco_Input").sheet1
    sheet.append_row(["Test", "Row", "From", "GitHub", "Action"])
    print("✅ Data uploaded to Google Sheet.")

if __name__ == "__main__":
    run_costco_extraction()
