/*
  EXCEL UPLOAD PANEL — bulk import students from a spreadsheet.

  Step 1: "הורד תבנית" button
    → downloads a blank .xlsx with the correct column headers

  Step 2: File drop zone
    → user drags-and-drops or picks an .xlsx / .xls file
    → the file is parsed client-side using a library (e.g. xlsx / sheetjs)

  Step 3: Validation (row by row)
    Each row is checked:
    - Name: letters only, within max length
    - Gender: זכר / נקבה / M / F (normalized to "M" or "F")
    - Date of birth: accepts DD/MM/YY, DD/MM/YYYY, YYYY-MM-DD, Excel serial numbers
    - Israeli ID: exactly 9 digits, not already in Firestore
    - Phone: 10 digits, starts with 05

  Step 4: Results panel
    - Green: count of valid rows ready to import
    - Red: list of rows with errors (row number + what's wrong)
    - "ייבא שורות תקינות" button → writes only valid rows to Firestore
*/
