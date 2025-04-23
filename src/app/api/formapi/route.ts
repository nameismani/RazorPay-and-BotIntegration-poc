import { NextRequest, NextResponse } from "next/server";
import { google } from "googleapis";

export interface sheetForm {
  name: string;
  email: string;
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { name, email, phone, message } = body;

    const auth = new google.auth.GoogleAuth({
      credentials: {
        client_email: process.env.GOOGLE_CLIENT_EMAIL,
        private_key: process.env.GOOGLE_PRIVATE_KEY?.replace(/\\n/g, "\n"),
      },
      scopes: [
        "https://www.googleapis.com/auth/drive",
        "https://www.googleapis.com/auth/drive.file",
        "https://www.googleapis.com/auth/spreadsheets",
      ],
    });

    const sheets = google.sheets({
      auth,
      version: "v4",
    });

    const response = await sheets.spreadsheets.values.append({
      spreadsheetId: process.env.GOOGLE_SHEET_ID,
      range: "A1:B1",
      valueInputOption: "USER_ENTERED",
      requestBody: {
        values: [[name, email]],
      },
    });

    return NextResponse.json(
      {
        data: response.data,
      },
      { status: 200 }
    );
  } catch (err) {
    console.error("Error submitting form to Google Sheets:", err);
    return NextResponse.json(
      {
        error: "Failed to submit form data",
      },
      { status: 500 }
    );
  }
}
