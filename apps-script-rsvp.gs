/*
  Deploy this as a Google Apps Script Web App to back the RSVP form + Wishes
  Wall with a shared Google Sheet (so every guest can see everyone's wishes,
  not just their own device's localStorage).

  SETUP:
  1. Buat Google Sheet baru (kosong boleh).
  2. Di sheet itu: Extensions > Apps Script.
  3. Hapus semua kode default, paste seluruh isi file ini.
  4. Klik Deploy > New deployment.
     - Select type: Web app
     - Execute as: Me
     - Who has access: Anyone
  5. Klik Deploy, authorize izinnya (klik Advanced > Go to [project] (unsafe)
     kalau muncul warning — ini normal untuk script buatan sendiri).
  6. Copy URL "Web app" yang muncul (bentuknya seperti
     https://script.google.com/macros/s/XXXXXXXX/exec).
  7. Kirim URL itu ke saya, atau paste sendiri ke script.js menggantikan
     nilai RSVP_SHEET_URL ('PASTE_YOUR_APPS_SCRIPT_WEB_APP_URL_HERE').

  Setiap kali form di-submit, satu baris baru otomatis ditambahkan ke sheet
  ini (dengan header dibuat otomatis di baris pertama kalau sheet kosong).
  Slide "Words From You" di web akan fetch data yang sama untuk ditampilkan
  ke semua tamu.
*/

function doPost(e) {
  var sheet = SpreadsheetApp.getActiveSpreadsheet().getActiveSheet();
  ensureHeader(sheet);

  var data = JSON.parse(e.postData.contents);
  sheet.appendRow([
    new Date(),
    data.nama || '',
    data.konfirmasi || '',
    data.ukuran || '',
    data.hijab || '',
    data.catatan || '',
    data.ucapan || ''
  ]);

  return ContentService
    .createTextOutput(JSON.stringify({ status: 'ok' }))
    .setMimeType(ContentService.MimeType.JSON);
}

function doGet(e) {
  var sheet = SpreadsheetApp.getActiveSpreadsheet().getActiveSheet();
  var rows = sheet.getDataRange().getValues();
  var result = [];

  for (var i = 1; i < rows.length; i++) { // skip header row
    if (!rows[i][1]) continue; // skip blank rows
    result.push({
      waktu: rows[i][0],
      nama: rows[i][1],
      konfirmasi: rows[i][2],
      ukuran: rows[i][3],
      hijab: rows[i][4],
      catatan: rows[i][5],
      ucapan: rows[i][6]
    });
  }

  return ContentService
    .createTextOutput(JSON.stringify(result))
    .setMimeType(ContentService.MimeType.JSON);
}

function ensureHeader(sheet) {
  if (sheet.getLastRow() > 0) return;
  sheet.appendRow(['Waktu', 'Nama', 'Konfirmasi', 'Ukuran', 'Hijab', 'Catatan', 'Ucapan']);
}
