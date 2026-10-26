// Fixed UI text. Never generated at runtime.
// Caregiver screens (upload, check, errors) are English. The patient plan uses `plan` in Telugu and English.
// TELUGU REVIEW STATUS: draft, review pending (not reviewed). AI-drafted; the learner accepted rows 1–27 with no
// changes for now and will do the final review on the real screen before recording. Corrections are edits here.

export const en = {
  uploadTitle: "Make your mother's medicine plan",
  uploadSubtitle: "Take a photo of the printed discharge summary. You'll check every medicine against the paper before the plan is made.",
  takePhoto: "Take a photo",
  chooseGallery: "Choose from gallery",
  trySample: "Try a sample sheet",
  samplePickerTitle: "Fictional sample sheets",
  privacy: "Mandu Chit doesn't store your photo. This demo is for sample sheets only, please don't upload real patient papers.",
  readingSteps: ["Reading the sheet", "Finding medicines", "Getting the check screen ready"],
  preparingSteps: ["Checked with the paper", "Preparing the Telugu plan"],
  startOver: "Start over",
  tryAgain: "Try again",
  takeAnother: "Take another photo",
  backToCheck: "Back to checking",
};

export const SAMPLES = [
  { file: "/samples/sample1_clean.png", label: "Sample 1 · clean printout" },
  { file: "/samples/sample2_ambiguous.png", label: "Sample 2 · unclear timings" },
  { file: "/samples/sample3_photo_style.png", label: "Sample 3 · tilted photo" },
  { file: "/samples/sample4_coverage.png", label: "Sample 4 · many patterns" },
];

export type Lang = "te" | "en";
type Bilingual = Record<Lang, string>;

// Rows 1–27 of the learner's Telugu review table.
export const plan = {
  title: { te: "మీ మందుల ప్రణాళిక", en: "Your medicine plan" },
  morning: { te: "ఉదయం", en: "Morning" },
  afternoon: { te: "మధ్యాహ్నం", en: "Afternoon" },
  evening: { te: "సాయంత్రం", en: "Evening" },
  night: { te: "రాత్రి", en: "Night" },
  chipBefore: { te: "భోజనానికి ముందు", en: "Before food" },
  chipAfter: { te: "భోజనం తర్వాత", en: "After food" },
  chipWith: { te: "భోజనంతో పాటు", en: "With food" },
  onlyIfNeeded: { te: "అవసరమైతే మాత్రమే", en: "Only if needed" },
  askHeading: { te: "మీ డాక్టర్‌ను లేదా ఫార్మసిస్ట్‌ను అడగండి", en: "Ask your doctor or pharmacist" },
  askHint: { te: "వీటికి కాగితంలో స్పష్టమైన సమయం లేదు.", en: "The sheet doesn't give a clear time for these." },
  warningHeading: { te: "ఇలా ఉంటే వెంటనే ఆసుపత్రికి వెళ్ళండి", en: "Go to hospital immediately if" },
  noWarnings: {
    te: "ఈ కాగితంలో ప్రమాద లక్షణాలు ఏవీ రాయలేదు. ఏ లక్షణాలను గమనించాలో మీ డాక్టర్‌ను అడగండి.",
    en: "No warning signs were written on this sheet. Ask your doctor what to watch for.",
  },
  followUpHeading: { te: "తదుపరి చెకప్", en: "Follow-up" },
  noFollowUp: { te: "ఈ కాగితంలో తదుపరి చెకప్ గురించి ఏమీ రాయలేదు.", en: "No follow-up was written on this sheet." },
  missingDose: {
    te: "కాగితంలో రాయలేదు. మీ డాక్టర్‌ను లేదా ఫార్మసిస్ట్‌ను అడగండి.",
    en: "Not written on the sheet. Ask your doctor or pharmacist.",
  },
  changedByFamily: { te: "మీ కుటుంబం మార్చింది", en: "Changed by your family" },
  sheetSaid: { te: "కాగితంలో ఉన్నది:", en: "Sheet said:" },
  markerChosen: { te: "కుటుంబం ఎంచుకున్న సమయం", en: "Time chosen by your family" },
  markerMoved: { te: "కుటుంబం మార్చిన సమయం", en: "Time changed by your family" },
  legendChosen: {
    te: "సమయాన్ని మీ కుటుంబం ఎంచుకుంది. కాగితంలో రోజుకు ఎన్నిసార్లు అని మాత్రమే ఉంది.",
    en: "Time chosen by your family. The sheet only said how many times.",
  },
  legendMoved: { te: "కాగితంలోని సమయాన్ని మీ కుటుంబం మార్చింది.", en: "Time changed by your family from the sheet." },
  asWritten: { te: "రాసినట్లు:", en: "As written:" },
  timeOnSheet: { te: "కాగితంలో సమయం:", en: "Time on the sheet:" },
  footer: {
    te: "ఈ ప్రణాళిక మీ ఆసుపత్రి రాసినదాన్నే చెబుతుంది. మీ డాక్టర్‌తో లేదా ఫార్మసిస్ట్‌తో నిర్ధారించుకోండి.",
    en: "This plan only repeats what your hospital wrote. Confirm with your doctor or pharmacist.",
  },
  langTe: { te: "తెలుగు", en: "తెలుగు" },
  langEn: { te: "English", en: "English" },
  textSize: { te: "అక్షరాల పరిమాణం", en: "Text size" },
} satisfies Record<string, Bilingual>;

export type PlanKey = keyof typeof plan;
