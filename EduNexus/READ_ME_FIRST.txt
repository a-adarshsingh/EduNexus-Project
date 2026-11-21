EDUNEXUS - kaise chalayein

A) Windows par (apne PC par)
 1. ZIP ko poora Extract karein (right click -> Extract All).
 2. START_EDUNEXUS.bat par DOUBLE-CLICK karein. Pehli baar Python 3.12 aur packages apne aap install honge.
 3. Browser khud khulega: http://localhost:8000
 4. Behtareen AI jawab ke liye: .env file Notepad mein kholein aur GEMINI_API_KEY= ke aage FREE key paste karein
    (key yahan milti hai: https://aistudio.google.com/apikey - 2 minute, card nahi chahiye).

B) Render par deploy (README.md mein step-by-step hai)
 - Start command:  python app.py
 - Environment mein daalein: SECRET_KEY, GEMINI_API_KEY, DATABASE_URL (free Postgres).
 - DATABASE_URL zaroori hai, warna Render free par account/password har restart par gayab ho jate hain.

Voice ke liye Chrome ya Edge use karein.
