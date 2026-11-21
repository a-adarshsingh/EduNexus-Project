export const LANGS: Record<string, string> = { en: 'English', hi: 'हिन्दी', hinglish: 'Hinglish', bn: 'বাংলা', ta: 'தமிழ்', te: 'తెలుగు', mr: 'मराठी', gu: 'ગુજરાતી', pa: 'ਪੰਜਾਬੀ', ur: 'اردو', es: 'Español', fr: 'Français' }
const KEYS = ['dashboard','library','assistant','voice','summarizer','tools','writing','planner','analytics','settings','logout','welcome','openAssistant','exploreLibrary','open','upload','feedback']
// One pipe-separated line per language, same order as KEYS. Add a language = add a line (missing -> English).
const RAW: Record<string, string> = {
 en:'Dashboard|My Library|Learning Assistant|Voice Assistant|Document Summarizer|Study Tools|Writing Studio|Study Planner|Progress & Analytics|Settings|Logout|Welcome back|Open Learning Assistant|Explore My Library|Open|Upload|Feedback',
 hi:'डैशबोर्ड|मेरी लाइब्रेरी|लर्निंग असिस्टेंट|वॉइस असिस्टेंट|डॉक्यूमेंट सारांशक|स्टडी टूल्स|राइटिंग स्टूडियो|स्टडी प्लानर|प्रगति और विश्लेषण|सेटिंग्स|लॉग आउट|वापसी पर स्वागत है|लर्निंग असिस्टेंट खोलें|मेरी लाइब्रेरी देखें|खोलें|अपलोड|फीडबैक',
 hinglish:'Dashboard|Meri Library|Learning Assistant|Voice Assistant|Document Summarizer|Study Tools|Writing Studio|Study Planner|Progress & Analytics|Settings|Logout|Wapas swagat hai|Learning Assistant kholo|Meri Library dekho|Kholo|Upload|Feedback',
 bn:'ড্যাশবোর্ড|আমার লাইব্রেরি|লার্নিং অ্যাসিস্ট্যান্ট|ভয়েস অ্যাসিস্ট্যান্ট|ডকুমেন্ট সারসংক্ষেপক|স্টাডি টুলস|রাইটিং স্টুডিও|স্টাডি প্ল্যানার|অগ্রগতি ও বিশ্লেষণ|সেটিংস|লগ আউট|আবার স্বাগতম|লার্নিং অ্যাসিস্ট্যান্ট খুলুন|আমার লাইব্রেরি দেখুন|খুলুন|আপলোড|মতামত',
 ta:'டாஷ்போர்டு|என் நூலகம்|கற்றல் உதவியாளர்|குரல் உதவியாளர்|ஆவண சுருக்கி|படிப்பு கருவிகள்|எழுத்து ஸ்டூடியோ|படிப்பு திட்டமிடல்|முன்னேற்றம் & பகுப்பாய்வு|அமைப்புகள்|வெளியேறு|மீண்டும் வரவேற்கிறோம்|கற்றல் உதவியாளரைத் திற|என் நூலகத்தைப் பார்|திற|பதிவேற்று|கருத்து',
 te:'డాష్‌బోర్డ్|నా లైబ్రరీ|లెర్నింగ్ అసిస్టెంట్|వాయిస్ అసిస్టెంట్|డాక్యుమెంట్ సారాంశం|స్టడీ టూల్స్|రైటింగ్ స్టూడియో|స్టడీ ప్లానర్|పురోగతి & విశ్లేషణ|సెట్టింగ్‌లు|లాగ్ అవుట్|తిరిగి స్వాగతం|లెర్నింగ్ అసిస్టెంట్ తెరువు|నా లైబ్రరీ చూడండి|తెరువు|అప్‌లోడ్|అభిప్రాయం',
 mr:'डॅशबोर्ड|माझी लायब्ररी|लर्निंग असिस्टंट|व्हॉइस असिस्टंट|डॉक्युमेंट सारांश|स्टडी टूल्स|रायटिंग स्टुडिओ|स्टडी प्लॅनर|प्रगती आणि विश्लेषण|सेटिंग्ज|लॉग आउट|पुन्हा स्वागत आहे|लर्निंग असिस्टंट उघडा|माझी लायब्ररी पहा|उघडा|अपलोड|अभिप्राय',
 gu:'ડેશબોર્ડ|મારી લાઇબ્રેરી|લર્નિંગ આસિસ્ટન્ટ|વૉઇસ આસિસ્ટન્ટ|ડૉક્યુમેન્ટ સારાંશ|સ્ટડી ટૂલ્સ|રાઇટિંગ સ્ટુડિયો|સ્ટડી પ્લાનર|પ્રગતિ અને વિશ્લેષણ|સેટિંગ્સ|લૉગ આઉટ|ફરી સ્વાગત છે|લર્નિંગ આસિસ્ટન્ટ ખોલો|મારી લાઇબ્રેરી જુઓ|ખોલો|અપલોડ|પ્રતિભાવ',
 pa:'ਡੈਸ਼ਬੋਰਡ|ਮੇਰੀ ਲਾਇਬ੍ਰੇਰੀ|ਲਰਨਿੰਗ ਅਸਿਸਟੈਂਟ|ਵੌਇਸ ਅਸਿਸਟੈਂਟ|ਦਸਤਾਵੇਜ਼ ਸਾਰ|ਸਟੱਡੀ ਟੂਲਜ਼|ਰਾਈਟਿੰਗ ਸਟੂਡੀਓ|ਸਟੱਡੀ ਪਲਾਨਰ|ਤਰੱਕੀ ਅਤੇ ਵਿਸ਼ਲੇਸ਼ਣ|ਸੈਟਿੰਗਾਂ|ਲੌਗ ਆਉਟ|ਵਾਪਸੀ ਤੇ ਸੁਆਗਤ ਹੈ|ਲਰਨਿੰਗ ਅਸਿਸਟੈਂਟ ਖੋਲ੍ਹੋ|ਮੇਰੀ ਲਾਇਬ੍ਰੇਰੀ ਵੇਖੋ|ਖੋਲ੍ਹੋ|ਅੱਪਲੋਡ|ਫੀਡਬੈਕ',
 ur:'ڈیش بورڈ|میری لائبریری|لرننگ اسسٹنٹ|وائس اسسٹنٹ|دستاویز خلاصہ|اسٹڈی ٹولز|رائٹنگ اسٹوڈیو|اسٹڈی پلانر|پیش رفت اور تجزیہ|سیٹنگز|لاگ آؤٹ|دوبارہ خوش آمدید|لرننگ اسسٹنٹ کھولیں|میری لائبریری دیکھیں|کھولیں|اپ لوڈ|رائے',
 es:'Panel|Mi biblioteca|Asistente de aprendizaje|Asistente de voz|Resumidor de documentos|Herramientas de estudio|Estudio de escritura|Planificador de estudio|Progreso y análisis|Ajustes|Cerrar sesión|Bienvenido de nuevo|Abrir asistente|Explorar mi biblioteca|Abrir|Subir|Comentarios',
 fr:'Tableau de bord|Ma bibliothèque|Assistant d’apprentissage|Assistant vocal|Résumeur de documents|Outils d’étude|Studio d’écriture|Planificateur d’étude|Progrès et analyses|Paramètres|Déconnexion|Bon retour|Ouvrir l’assistant|Explorer ma bibliothèque|Ouvrir|Téléverser|Avis' }
export function tr(lang: string, key: string) {
  const i = KEYS.indexOf(key)
  return (RAW[lang]?.split('|')[i]) || RAW.en.split('|')[i] || key
}
