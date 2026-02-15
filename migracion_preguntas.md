# Migration Guide: Moving Questions to Google Sheets

The web application now fetches questions directly from your Google Sheet for better security and easier updates.

## Step 1: Update Google Apps Script
1. Open your Google Script project.
2. Replace the content of your existing script with the updated content of `script_google_apps_v4.txt` found in your project root.
3. Save and **Deploy** as a Web App (Select "New Version").
4. Ensure "Who has access" is set to "Anyone".

## Step 2: Create "Preguntas" Sheet
1. Open your "Puntuaciones" Google Spreadsheet.
2. Create a new sheet named **Preguntas** (case-sensitive).
3. Add the following headers in Row 1:
   - A1: ID
   - B1: Pregunta
   - C1: OpcionA
   - D1: OpcionB
   - E1: OpcionC
   - F1: OpcionD
   - G1: RespuestaCorrecta

## Step 3: Import Questions
The file `trivial.txt` contains your questions in a raw format. You need to copy them into the sheet.
The format in `trivial.txt` appears to be semi-structured. You might need to clean it up before pasting.

Example row content:
- **ID**: 1
- **Pregunta**: ¿En qué año nació Mary Ward?
- **OpcionA**: 1585
- **OpcionB**: 1645
- **OpcionC**: 1609
- **OpcionD**: 1500
- **RespuestaCorrecta**: a letrita (a, b, c, o d)

**Important**: The application expects the Correct Answer column to contain 'a', 'b', 'c', or 'd'.

## Step 4: Verify
1. Open the Web App (index.html).
2. Start a game.
3. Ensure questions are loading correctly.
