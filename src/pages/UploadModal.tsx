import { useRef, useState, useEffect } from "react";
import {
  X,
  UploadCloud,
  Camera,
  ImageIcon,
  Check,
  LoaderCircle,
  Pill,
  BookOpen,
  ClipboardList,
  Activity,
  ShieldAlert,
  ScanLine,
  FileText,
  Sparkles,
  Eye,
  Type,
  Search,
  Crosshair,
  HelpCircle,
  ArrowRight,
} from "lucide-react";
import Cropper from "react-easy-crop";
import { medications } from "../utils/medications";
import { supabase } from "../utils/supabase";

type UploadModalProps = {
  onClose: () => void;
};

type CroppedAreaPixels = {
  x: number;
  y: number;
  width: number;
  height: number;
};

type PredictionResult = {
  label: string;
  confidence: number;
};

type StoredPrescription = {
  id: string;
  user_id: string | null;
  medication_name: string;
  image_url: string;
  confidence: number;
  created_at: string;
};

type DetectedRegion = {
  id: number;
  x: number;
  y: number;
  width: number;
  height: number;
  label: string;
  confidence: number;
  isMatched?: boolean;
  matchedMedication?: string;
  matchScore?: number;
};

type Suggestion = {
  className: string;
  score: number;
  matchedWord: string;
};

const CLASS_NAMES_URL = "/model/class_names.json";
const BUCKET_NAME = "medication_image";

// Generic words that appear on prescription forms but ARE NOT medications
const GENERIC_BLOCKLIST = new Set([
  "confidence", "date", "location", "page", "name", "address", "patient",
  "doctor", "dr", "prescription", "rx", "pharmacy", "hospital", "clinic",
  "signature", "stamp", "tel", "phone", "fax", "email", "id", "no", "number",
  "qty", "quantity", "refill", "refills", "directions", "instructions", "dosage",
  "take", "tablet", "tablets", "capsule", "capsules", "mg", "ml", "mcg", "g",
  "daily", "twice", "three", "times", "day", "week", "month", "as", "needed",
  "prn", "oral", "topical", "injection", "route", "form", "generic", "brand",
  "substitution", "allowed", "daw", "dispense", "label", "caution", "warning",
  "storage", "temp", "temperature", "room", "refrigerate", "shake", "well",
  "before", "using", "use", "discard", "after", "expiration", "exp", "lot",
  "mfg", "manufactured", "by", "for", "from", "to", "of", "the", "and", "or",
  "a", "an", "in", "on", "at", "with", "without", "per", "every", "hours",
  "hour", "min", "minutes", "sec", "am", "pm", "bid", "tid", "qid", "qd",
  "qhs", "q4h", "q6h", "q8h", "q12h", "ac", "pc", "hs", "prn", "stat",
  "continued", "cont", "sig", "disp", "qty", "mitte", "ft", "fiat",
  "licensed", "practitioner", "npi", "dea", "pin", "bin", "pcn", "grp",
  "group", "member", "policy", "claim", "insurance", "copay", "deductible",
  "total", "amount", "paid", "balance", "due", "cash", "check", "card",
  "visa", "mastercard", "discover", "amex", "payment", "method", "change",
  "thank", "you", "please", "call", "questions", "concerns", "side", "effects",
  "may", "include", "nausea", "dizziness", "drowsiness", "headache", "pain",
  "allergic", "reaction", "rash", "itching", "swelling", "trouble", "breathing",
  "keep", "out", "reach", "children", "pets", "poison", "control", "emergency",
  "overdose", "accidental", "ingestion", "contact", "immediately", "if",
  "pregnant", "nursing", "consult", "physician", "before", "taking",
  "alcohol", "while", "this", "medication", "may", "cause", "do", "not",
  "drive", "operate", "heavy", "machinery", "until", "know", "how", "affects",
  "complete", "full", "course", "even", "if", "feel", "better", "stop",
  "unless", "directed", "healthcare", "provider", "provider", "professional",
  "medical", "advice", "diagnosis", "treatment", "information", "educational",
  "purposes", "only", "not", "intended", "replace", "consultation",
  "registered", "trademark", "tm", "r", "copyright", "all", "rights",
  "reserved", "version", "print", "printed", "computer", "generated",
  "system", "software", "program", "user", "login", "password", "access",
  "restricted", "authorized", "personnel", "only", "confidential", "private",
  "protected", "hipaa", "compliant", "secure", "encrypted", "ssl", "https",
  "www", "com", "org", "net", "gov", "edu", "http", "url", "website",
  "online", "portal", "account", "profile", "settings", "preferences",
  "help", "support", "faq", "terms", "conditions", "privacy", "policy",
  "agreement", "consent", "release", "waiver", "liability", "disclaimer",
  "notice", "warning", "caution", "danger", "poison", "flammable", "corrosive",
  "biohazard", "radioactive", "infectious", "sterile", "clean", "aseptic",
  "technique", "universal", "precautions", "ppe", "gloves", "mask", "gown",
  "shield", "goggles", "wash", "hands", "sanitize", "disinfect", "sterilize",
  "autoclave", "incinerate", "dispose", "properly", "sharps", "container",
  "biohazard", "bag", "red", "bag", "waste", "recycle", "reusable",
  "single", "use", "only", "disposable", "latex", "free", "non", "sterile",
  "for", "external", "internal", "use", "only", "not", "for", "injection",
  "iv", "im", "subcut", "subcutaneous", "intravenous", "intramuscular",
  "intrathecal", "epidural", "inhalation", "nasal", "ophthalmic", "otic",
  "rectal", "vaginal", "transdermal", "patch", "cream", "ointment", "gel",
  "lotion", "solution", "suspension", "emulsion", "syrup", "elixir", "tincture",
  "extract", "suppository", "enema", "douche", "spray", "aerosol", "inhaler",
  "nebulizer", "mask", "tubing", "cannula", "catheter", "syringe", "needle",
  "gauge", "length", "ml", "cc", "unit", "units", "iu", "meq", "mmol",
  "mcg", "mg", "g", "kg", "lb", "lbs", "oz", "fl", "fluid", "dram", "minim",
  "drop", "drops", "gtt", "gtts", "tsp", "tbsp", "cup", "pt", "qt", "gal",
  "liter", "litre", "milliliter", "microliter", "nanogram", "picogram",
  "molar", "normal", "percent", "solution", "w", "v", "w/v", "v/v",
  "ratio", "part", "parts", "dilution", "concentrated", "stock", "working",
  "final", "volume", "mass", "weight", "molecular", "formula", "structure",
  "compound", "mixture", "element", "ion", "salt", "base", "acid", "alkaline",
  "ph", "buffer", "preservative", "antioxidant", "stabilizer", "excipient",
  "filler", "binder", "disintegrant", "lubricant", "coating", "color", "dye",
  "flavor", "sweetener", "sugar", "alcohol", "sorbitol", "mannitol", "glycol",
  "peg", "polysorbate", "tween", "benzyl", "alcohol", "paraben", "sulfite",
  "tartrazine", "fd", "c", "red", "blue", "yellow", "green", "lake",
  "gluten", "lactose", "soy", "peanut", "tree", "nut", "shellfish", "egg",
  "milk", "dairy", "wheat", "corn", "starch", "gelatin", "povidone",
  "crospovidone", "croscarmellose", "sodium", "starch", "glycolate",
  "magnesium", "stearate", "talc", "silica", "titanium", "dioxide",
  "iron", "oxide", "calcium", "phosphate", "tribasic", "dibasic",
  "monobasic", "anhydrous", "hydrous", "monohydrate", "dihydrate",
  "trihydrate", "pentahydrate", "decahydrate", "anhyd", "aq", "aqueous",
  "soln", "susp", "emul", "elix", "tinc", "ext", "supp", "inj", "tab",
  "cap", "dr", "ec", "sr", "xr", "cr", "la", "er", "ir", "sa", "td",
  "sl", "bucc", "odt", "eff", "chew", "disp", "sol", "odf", "film",
  "strip", "loz", "troche", "pastille", "gum", "implant", "pellet",
  "bead", "granule", "powder", "crystals", "flake", "chunk", "block",
  "cake", "tablet", "pill", "capsule", "caplet", "softgel", "gelcap",
  "minicap", "microcap", "nanocap", "span", "spanule", "duret", "durette",
  "repetab", "repeatab", "sequels", "contin", "continus", "retard",
  "slow", "release", "controlled", "delayed", "extended", "prolonged",
  "sustained", "timed", "repeat", "action", "dual", "triple", "layer",
  "core", "shell", "matrix", "reservoir", "osmotic", "pump", "ion",
  "exchange", "complex", "clathrate", "inclusion", "micelle", "liposome",
  "niosome", "ethosome", "transferosome", "phytosome", "cyclodextrin",
  "nanoparticle", "microparticle", "microsphere", "nanosphere",
  "microcapsule", "nanocapsule", "dendrimer", "fullerene", "carbon",
  "nanotube", "quantum", "dot", "lipid", "bilayer", "vesicle", "cell",
  "ghost", "erythrocyte", "leukocyte", "platelet", "stem", "progenitor",
  "fibroblast", "keratinocyte", "melanocyte", "hepatocyte", "cardiomyocyte",
  "neuron", "glial", "astrocyte", "oligodendrocyte", "microglia",
  "ependymal", "schwann", "satellite", "enteric", "goblet", "paneth",
  "chief", "parietal", "oxyntic", "enterochromaffin", "ec", "cell",
  "duodenal", "brush", "border", "mucosal", "submucosal", "muscularis",
  "serosal", "adventitial", "mesothelial", "endothelial", "epithelial",
  "squamous", "cuboidal", "columnar", "pseudostratified", "transitional",
  "simple", "stratified", "keratinized", "nonkeratinized", "glandular",
  "exocrine", "endocrine", "holocrine", "apocrine", "merocrine", "eccrine",
  "sebaceous", "sudoriferous", "ceruminous", "mammary", "lacrimal",
  "salivary", "parotid", "submandibular", "sublingual", "pancreatic",
  "hepatic", "biliary", "gallbladder", "cystic", "common", "bile", "duct",
  "ampulla", "vater", "sphincter", "oddi", "hepatopancreatic", "duodenal",
  "papilla", "minor", "major", "santorini", "ductus", "choledochus",
  "hepaticus", "communis", "dexter", "sinister", "lobus", "quadratus",
  "caudatus", "spigelii", "lobulus", "quadratus", "caudatus", "processus",
  "caudatus", "papillary", "process", "left", "right", "lateral", "medial",
  "superior", "inferior", "anterior", "posterior", "dorsal", "ventral",
  "proximal", "distal", "superficial", "deep", "external", "internal",
  "central", "peripheral", "ipsilateral", "contralateral", "bilateral",
  "unilateral", "midline", "paramedian", "parasagittal", "frontal",
  "coronal", "sagittal", "transverse", "horizontal", "oblique", "longitudinal",
  "axial", "radial", "ulnar", "tibial", "fibular", "femoral", "brachial",
  "antebrachial", "crural", "sural", "pedal", "plantar", "palmar", "dorsal",
  "digital", "phalangeal", "carpal", "tarsal", "metacarpal", "metatarsal",
  "costal", "vertebral", "spinal", "cranial", "cerebral", "cerebellar",
  "brainstem", "midbrain", "pons", "medulla", "oblongata", "diencephalon",
  "thalamus", "hypothalamus", "epithalamus", "subthalamus", "metathalamus",
  "pituitary", "pineal", "hypophysis", "adenohypophysis", "neurohypophysis",
  "pars", "distalis", "intermedia", "tuberalis", "nervosa", "infundibular",
  "stalk", "median", "eminence", "tuber", "cinereum", "mamillary",
  "bodies", "posterior", "lobe", "anterior", "lobe", "intermediate",
  "lobe", "neural", "lobe", "pars", "nervosa", "intermedia", "distalis",
]);

function normalizeText(text: string): string {
  return text
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .replace(/[^\x00-\x7F]/g, " ")
    .replace(/[^a-zA-Z0-9\s]/g, " ")
    .replace(/\s+/g, " ")
    .trim()
    .toLowerCase();
}

function levenshteinDistance(str1: string, str2: string): number {
  const m = str1.length;
  const n = str2.length;
  const dp: number[][] = Array.from({ length: m + 1 }, () => Array(n + 1).fill(0));

  for (let i = 0; i <= m; i++) dp[i][0] = i;
  for (let j = 0; j <= n; j++) dp[0][j] = j;

  for (let i = 1; i <= m; i++) {
    for (let j = 1; j <= n; j++) {
      if (str1[i - 1] === str2[j - 1]) {
        dp[i][j] = dp[i - 1][j - 1];
      } else {
        dp[i][j] = Math.min(
          dp[i - 1][j] + 1,
          dp[i][j - 1] + 1,
          dp[i - 1][j - 1] + 1
        );
      }
    }
  }
  return dp[m][n];
}

function wordMatchScore(ocrWord: string, classWord: string): number {
  const o = normalizeText(ocrWord);
  const c = normalizeText(classWord);

  if (o === c) return 1.0;

  // Reject if OCR word is generic blocklisted
  if (GENERIC_BLOCKLIST.has(o)) return 0;

  if (o.length >= 3 && c.length >= 3) {
    let prefixMatch = 0;
    for (let i = 0; i < Math.min(o.length, c.length); i++) {
      if (o[i] === c[i]) prefixMatch++;
      else break;
    }
    const prefixScore = prefixMatch / Math.max(o.length, c.length);

    const maxLen = Math.max(o.length, c.length);
    const distance = levenshteinDistance(o, c);
    const levScore = 1 - distance / maxLen;

    return Math.max(levScore, prefixScore * 0.9);
  }

  const maxLen = Math.max(o.length, c.length);
  if (maxLen === 0) return 0;
  return 1 - levenshteinDistance(o, c) / maxLen;
}

function findBestClassNameMatch(ocrText: string, classNames: string[]): { className: string | null; score: number; matchedWord: string } {
  const normalizedOCR = normalizeText(ocrText);
  const ocrWords = normalizedOCR.split(/\s+/).filter(w => w.length >= 3 && !GENERIC_BLOCKLIST.has(w));

  // If no valid medication-like words found, fail immediately
  if (ocrWords.length === 0) {
    return { className: null, score: 0, matchedWord: "" };
  }

  let bestClass: string | null = null;
  let bestScore = 0;
  let bestMatchedWord = "";

  for (const className of classNames) {
    const normalizedClass = normalizeText(className);
    const classWords = normalizedClass.split(/\s+/).filter(w => w.length >= 3);

    for (const ocrWord of ocrWords) {
      for (const classWord of classWords) {
        const score = wordMatchScore(ocrWord, classWord);
        const lengthBoost = classWord.length <= 6 ? 0.05 : 0;
        const adjustedScore = Math.min(1, score + lengthBoost);

        if (adjustedScore > bestScore) {
          bestScore = adjustedScore;
          bestClass = className;
          bestMatchedWord = ocrWord;
        }
      }
    }
  }

  return { className: bestClass, score: bestScore, matchedWord: bestMatchedWord };
}

// Get top N suggestions — but ONLY for non-generic OCR words
function getSuggestions(ocrText: string, classNames: string[], topN: number = 3): Suggestion[] {
  const normalizedOCR = normalizeText(ocrText);
  const ocrWords = normalizedOCR.split(/\s+/).filter(w => w.length >= 2 && !GENERIC_BLOCKLIST.has(w));

  // If ALL words are generic, return empty — no suggestions
  if (ocrWords.length === 0) return [];

  const scored: Suggestion[] = [];

  for (const className of classNames) {
    const normalizedClass = normalizeText(className);
    const classWords = normalizedClass.split(/\s+/).filter(w => w.length >= 2);

    let bestScore = 0;
    let bestWord = "";

    for (const ocrWord of ocrWords) {
      for (const classWord of classWords) {
        const score = wordMatchScore(ocrWord, classWord);
        if (score > bestScore) {
          bestScore = score;
          bestWord = ocrWord;
        }
      }
    }

    const fullScore = wordMatchScore(normalizedOCR, normalizedClass);
    const finalScore = Math.max(bestScore, fullScore * 0.8);

    if (finalScore > 0.20) {
      scored.push({ className, score: finalScore, matchedWord: bestWord });
    }
  }

  return scored
    .sort((a, b) => b.score - a.score)
    .slice(0, topN);
}

export default function UploadModal({ onClose }: UploadModalProps) {
  const cameraInputRef = useRef<HTMLInputElement | null>(null);
  const galleryInputRef = useRef<HTMLInputElement | null>(null);
  const classNamesRef = useRef<string[]>([]);

  const [imageSrc, setImageSrc] = useState<string | null>(null);
  const [crop, setCrop] = useState({ x: 0, y: 0 });
  const [zoom, setZoom] = useState(1);
  const [croppedAreaPixels, setCroppedAreaPixels] = useState<CroppedAreaPixels | null>(null);
  const [croppedImage, setCroppedImage] = useState<string | null>(null);
  const [loadingImage, setLoadingImage] = useState(false);
  const [predicting, setPredicting] = useState(false);
  const [storing, setStoring] = useState(false);
  const [prediction, setPrediction] = useState<PredictionResult | null>(null);
  const [storedPrescription, setStoredPrescription] = useState<StoredPrescription | null>(null);
  const [detailsPrescription, setDetailsPrescription] = useState<StoredPrescription | null>(null);
  const [showMedicationModal, setShowMedicationModal] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [scanPhase, setScanPhase] = useState<"idle" | "scanning" | "reading" | "matching" | "detected">("idle");
  const [detectedRegions, setDetectedRegions] = useState<DetectedRegion[]>([]);
  const [scanLineY, setScanLineY] = useState(0);
  const [showCharacterHighlight, setShowCharacterHighlight] = useState(false);
  const [, setOcrText] = useState<string>("");
  const [matchInfo, setMatchInfo] = useState<{ score: number; method: string } | null>(null);

  const [showSuggestions, setShowSuggestions] = useState(false);
  const [suggestions, setSuggestions] = useState<Suggestion[]>([]);
  const [pendingOCRText, setPendingOCRText] = useState("");

  const resetAll = () => {
    setImageSrc(null);
    setCroppedImage(null);
    setPrediction(null);
    setStoredPrescription(null);
    setDetailsPrescription(null);
    setErrorMessage(null);
    setShowMedicationModal(false);
    setShowSuggestions(false);
    setSuggestions([]);
    setPendingOCRText("");
    setCrop({ x: 0, y: 0 });
    setZoom(1);
    setScanPhase("idle");
    setDetectedRegions([]);
    setShowCharacterHighlight(false);
    setOcrText("");
    setMatchInfo(null);
  };

  const getCurrentUser = async () => {
    const { data: { user }, error } = await supabase.auth.getUser();
    if (error || !user) {
      throw new Error("User is not authenticated. Please complete onboarding first.");
    }
    return user;
  };

  const resizeImageFile = async (file: File): Promise<string> => {
    return new Promise((resolve, reject) => {
      const reader = new FileReader();
      const img = new Image();
      reader.onload = () => { img.src = reader.result as string; };
      reader.onerror = () => reject(new Error("Failed to read image file."));
      img.onload = () => {
        const maxSize = 1280;
        let width = img.width;
        let height = img.height;
        if (width > height && width > maxSize) {
          height = Math.round((height * maxSize) / width);
          width = maxSize;
        } else if (height >= width && height > maxSize) {
          width = Math.round((width * maxSize) / height);
          height = maxSize;
        }
        const canvas = document.createElement("canvas");
        canvas.width = width;
        canvas.height = height;
        const ctx = canvas.getContext("2d");
        if (!ctx) { reject(new Error("Canvas is not supported.")); return; }
        ctx.drawImage(img, 0, 0, width, height);
        resolve(canvas.toDataURL("image/jpeg", 0.85));
      };
      img.onerror = () => reject(new Error("Failed to load image."));
      reader.readAsDataURL(file);
    });
  };

  const loadClassNames = async () => {
    if (classNamesRef.current.length > 0) return;
    const response = await fetch(CLASS_NAMES_URL);
    if (!response.ok) throw new Error("class_names.json not found in public/model/");
    const classes: string[] = await response.json();
    if (!Array.isArray(classes) || classes.length === 0) throw new Error("class_names.json is empty or invalid.");
    classNamesRef.current = classes;
    console.log("Class names loaded:", classes);
  };

  const runGoogleOCR = async (imageBase64: string): Promise<{ regions: DetectedRegion[]; fullText: string }> => {
    const { data, error } = await supabase.functions.invoke("ocr", {
      body: { imageBase64 },
    });

    if (error) {
      throw new Error(`OCR function error: ${error.message}`);
    }

    if (data?.error) {
      throw new Error(data.error);
    }

    const fullText = data.fullText || "";
    setOcrText(fullText);
    console.log("Google OCR Full Text:", fullText);
    console.log("Google OCR regions:", data.regions?.length);

    const regions = (data.regions || []).map((r: any, idx: number) => ({
      id: r.id ?? idx,
      x: r.x ?? 0,
      y: r.y ?? 0,
      width: r.width ?? 0,
      height: r.height ?? 0,
      label: r.label ?? "",
      confidence: r.confidence ?? 0.95,
    }));

    return { regions, fullText };
  };

  const dataURLtoBlob = (dataUrl: string) => {
    const arr = dataUrl.split(",");
    const mime = arr[0].match(/:(.*?);/)?.[1] || "image/jpeg";
    const bstr = atob(arr[1]);
    let n = bstr.length;
    const u8arr = new Uint8Array(n);
    while (n--) u8arr[n] = bstr.charCodeAt(n);
    return new Blob([u8arr], { type: mime });
  };

  const uploadPrescriptionCapture = async (imageBase64: string) => {
    const user = await getCurrentUser();
    const blob = dataURLtoBlob(imageBase64);
    const fileName = `${user.id}/${Date.now()}_prescription.jpg`;
    const { error } = await supabase.storage.from(BUCKET_NAME).upload(fileName, blob, {
      contentType: "image/jpeg",
      upsert: false,
    });
    if (error) throw error;
    const { data } = supabase.storage.from(BUCKET_NAME).getPublicUrl(fileName);
    return { publicUrl: data.publicUrl, userId: user.id };
  };

  const savePrescriptionToSupabase = async (medicationName: string, confidence: number, imageBase64: string) => {
    setStoring(true);
    try {
      const { publicUrl, userId } = await uploadPrescriptionCapture(imageBase64);
      const { data, error } = await supabase
        .from("prescriptions")
        .insert({ user_id: userId, medication_name: medicationName, image_url: publicUrl, confidence })
        .select("id, user_id, medication_name, image_url, confidence, created_at")
        .single();
      if (error) throw error;
      setStoredPrescription(data);
      return data as StoredPrescription;
    } finally {
      setStoring(false);
    }
  };

  const fetchPrescriptionDetails = async (prescriptionId: string) => {
    const { data, error } = await supabase
      .from("prescriptions")
      .select("id, user_id, medication_name, image_url, confidence, created_at")
      .eq("id", prescriptionId)
      .single();
    if (error) throw error;
    setDetailsPrescription(data);
    setShowMedicationModal(true);
  };

  const handleFileChange = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    event.target.value = "";
    if (!file) return;
    if (!file.type.startsWith("image/")) {
      setErrorMessage("Please upload an image file only.");
      return;
    }
    if (file.size > 15 * 1024 * 1024) {
      setErrorMessage("Image is too large. Please retake the photo.");
      return;
    }
    try {
      setLoadingImage(true);
      setErrorMessage(null);
      const resizedBase64 = await resizeImageFile(file);
      setImageSrc(resizedBase64);
      setCroppedImage(null);
      setPrediction(null);
      setStoredPrescription(null);
      setDetailsPrescription(null);
      setErrorMessage(null);
      setShowSuggestions(false);
      setCrop({ x: 0, y: 0 });
      setZoom(1);
    } catch (error) {
      console.error("Camera/Gallery image error:", error);
      setErrorMessage("Failed to load image. Please try again.");
    } finally {
      setLoadingImage(false);
    }
  };

  const createCroppedImage = async () => {
    if (!imageSrc || !croppedAreaPixels) {
      alert("Please crop the prescription first.");
      return;
    }
    const image = new Image();
    image.src = imageSrc;
    await new Promise<void>((resolve, reject) => {
      image.onload = () => resolve();
      image.onerror = () => reject(new Error("Failed to load image."));
    });
    const canvas = document.createElement("canvas");
    const ctx = canvas.getContext("2d");
    if (!ctx) { alert("Canvas is not supported."); return; }
    canvas.width = croppedAreaPixels.width;
    canvas.height = croppedAreaPixels.height;
    ctx.drawImage(
      image,
      croppedAreaPixels.x,
      croppedAreaPixels.y,
      croppedAreaPixels.width,
      croppedAreaPixels.height,
      0, 0,
      croppedAreaPixels.width,
      croppedAreaPixels.height
    );
    const croppedBase64 = canvas.toDataURL("image/jpeg", 0.9);
    setCroppedImage(croppedBase64);
    setPrediction(null);
    setStoredPrescription(null);
    setDetailsPrescription(null);
    setErrorMessage(null);
    setShowSuggestions(false);
  };

  const handleSuggestionSelect = async (suggestion: Suggestion) => {
    setShowSuggestions(false);
    setScanPhase("matching");

    const className = suggestion.className;
    const boostedConfidence = Math.max(0.75, suggestion.score);

    const matchedMedication = medications.find(
      (med) => med.medication_name.toLowerCase() === className.toLowerCase()
    );

    if (!matchedMedication) {
      setPrediction(null);
      setStoredPrescription(null);
      setScanPhase("idle");
      setErrorMessage(`Detected "${className}", but no matching medication information was found.`);
      return;
    }

    setPrediction({
      label: className,
      confidence: boostedConfidence,
    });

    setMatchInfo({ score: boostedConfidence, method: "OCR Suggestion Match" });

    setScanPhase("detected");
    setShowCharacterHighlight(true);

    await savePrescriptionToSupabase(className, boostedConfidence, croppedImage!);
  };

  const handleNoSuggestion = () => {
    setShowSuggestions(false);
    setPrediction(null);
    setStoredPrescription(null);
    setScanPhase("idle");
    setErrorMessage("Sorry, it's below 50% confidence.");
  };

  const handleUseImage = async () => {
    if (!croppedImage) {
      alert("Please crop the prescription first.");
      return;
    }
    if (storedPrescription) {
      try {
        await fetchPrescriptionDetails(storedPrescription.id);
      } catch (error) {
        console.error("Fetch details error:", error);
        alert("Failed to fetch prescription details.");
      }
      return;
    }

    try {
      setPredicting(true);
      setErrorMessage(null);
      setShowSuggestions(false);
      setScanPhase("scanning");

      await new Promise(resolve => setTimeout(resolve, 2000));
      setScanPhase("reading");

      await loadClassNames();

      const { regions: ocrRegions, fullText: ocrFullText } = await runGoogleOCR(croppedImage);
      console.log("Google OCR detected regions:", ocrRegions);
      console.log("OCR text for matching:", ocrFullText);

      setScanPhase("matching");

      const { className: matchedClass, score: matchScore, matchedWord } = findBestClassNameMatch(ocrFullText, classNamesRef.current);
      console.log("Matched class:", matchedClass, "Score:", matchScore, "Word:", matchedWord);

      const enhancedRegions = ocrRegions.map(region => {
        const regionText = normalizeText(region.label);
        const classLower = matchedClass ? normalizeText(matchedClass) : "";
        const sim = matchedClass ? wordMatchScore(regionText, classLower) : 0;
        return {
          ...region,
          isMatched: sim > 0.5,
          matchedMedication: sim > 0.5 ? matchedClass ?? undefined : undefined,
          matchScore: sim,
        };
      });
      setDetectedRegions(enhancedRegions);

      // HIGH CONFIDENCE: Auto-approve
      if (matchedClass && matchScore > 0.5) {
        const matchedMedication = medications.find(
          (med) => med.medication_name.toLowerCase() === matchedClass.toLowerCase()
        );

        if (!matchedMedication) {
          setPrediction(null);
          setStoredPrescription(null);
          setScanPhase("idle");
          setErrorMessage(`Detected "${matchedClass}", but no matching medication information was found.`);
          return;
        }

        setPrediction({
          label: matchedClass,
          confidence: matchScore,
        });

        setMatchInfo({ score: matchScore, method: "OCR Text Match" });

        setScanPhase("detected");
        setShowCharacterHighlight(true);

        await savePrescriptionToSupabase(matchedClass, matchScore, croppedImage);
        return;
      }

      // MEDIUM CONFIDENCE: Show "Did you mean?" suggestions
      // But only if there are valid non-generic words in OCR
      if (matchScore > 0.25) {
        const suggs = getSuggestions(ocrFullText, classNamesRef.current, 3);
        console.log("Suggestions:", suggs);

        // Only show suggestions if at least one has decent score
        if (suggs.length > 0 && suggs[0].score > 0.30) {
          setSuggestions(suggs);
          setPendingOCRText(ocrFullText);
          setShowSuggestions(true);
          setScanPhase("idle");
          return;
        }
      }

      // LOW CONFIDENCE or ALL GENERIC WORDS: Fail
      setPrediction(null);
      setStoredPrescription(null);
      setScanPhase("idle");
      setErrorMessage("Sorry, it's below 50% confidence.");

    } catch (error) {
      console.error("Prediction error:", error);
      setScanPhase("idle");
      setErrorMessage(error instanceof Error ? error.message : "Prediction failed. Please try again.");
    } finally {
      setPredicting(false);
    }
  };

  useEffect(() => {
    if (scanPhase !== "scanning") return;
    let animationId: number;
    const startTime = Date.now();
    const animate = () => {
      const elapsed = Date.now() - startTime;
      const progress = (elapsed % 2000) / 2000;
      setScanLineY(progress * 100);
      animationId = requestAnimationFrame(animate);
    };
    animationId = requestAnimationFrame(animate);
    return () => cancelAnimationFrame(animationId);
  }, [scanPhase]);

  const isBusy = predicting || storing || loadingImage;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center px-4">
      <div onClick={() => { if (!isBusy && !showSuggestions) onClose(); }} className="absolute inset-0 bg-black/50 backdrop-blur-sm" />
      <div className="relative w-full max-w-md rounded-3xl bg-white p-5 shadow-2xl">
        <button onClick={onClose} disabled={isBusy || showSuggestions} className="absolute right-4 top-4 rounded-xl p-2 hover:bg-slate-100 disabled:cursor-not-allowed disabled:opacity-50">
          <X className="h-5 w-5 text-slate-600" />
        </button>

        {/* DID YOU MEAN? SUGGESTIONS MODAL */}
        {showSuggestions && (
          <div className="mb-4 rounded-2xl border border-amber-200 bg-amber-50 p-4">
            <div className="flex items-center gap-2 mb-3">
              <HelpCircle className="h-5 w-5 text-amber-600" />
              <h3 className="font-bold text-amber-900">Did you mean?</h3>
            </div>
            <p className="text-sm text-amber-700 mb-3">
              We detected: <span className="font-mono font-bold">"{pendingOCRText}"</span>
            </p>
            <div className="space-y-2">
              {suggestions.map((sugg, idx) => (
                <button
                  key={idx}
                  onClick={() => handleSuggestionSelect(sugg)}
                  disabled={isBusy}
                  className="w-full flex items-center justify-between rounded-xl bg-white border border-amber-200 px-4 py-3 hover:bg-amber-100 transition-colors disabled:opacity-50"
                >
                  <div className="flex items-center gap-2">
                    <span className="text-lg font-bold text-amber-900">{sugg.className}</span>
                    <span className="text-xs text-amber-600">(matched: "{sugg.matchedWord}")</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <div className="h-2 w-16 overflow-hidden rounded-full bg-amber-200">
                      <div className="h-full rounded-full bg-amber-500" style={{ width: `${sugg.score * 100}%` }} />
                    </div>
                    <span className="text-xs font-bold text-amber-700">{(sugg.score * 100).toFixed(0)}%</span>
                    <ArrowRight className="h-4 w-4 text-amber-600" />
                  </div>
                </button>
              ))}
            </div>
            <button
              onClick={handleNoSuggestion}
              disabled={isBusy}
              className="mt-3 w-full rounded-xl bg-slate-100 py-2 text-sm font-semibold text-slate-600 hover:bg-slate-200 disabled:opacity-50"
            >
              None of these — it's not in the list
            </button>
          </div>
        )}

        {!imageSrc ? (
          <div className="flex flex-col items-center text-center">
            <div className="mb-4 flex h-16 w-16 items-center justify-center rounded-2xl bg-gradient-to-br from-sky-500 to-blue-600">
              <UploadCloud className="h-8 w-8 text-white" />
            </div>
            <h2 className="mb-2 text-lg font-bold text-slate-900">Upload Prescription</h2>
            <p className="mb-6 text-sm text-slate-500">Take a photo or upload a prescription image, then crop the prescription area.</p>
            {errorMessage && (
              <div className="mb-4 w-full rounded-2xl border border-red-200 bg-red-50 p-4">
                <p className="text-sm font-semibold text-red-900">{errorMessage}</p>
              </div>
            )}
            <input ref={cameraInputRef} type="file" accept="image/jpeg,image/png,image/webp" capture="environment" className="hidden" onChange={handleFileChange} />
            <input ref={galleryInputRef} type="file" accept="image/jpeg,image/png,image/webp" className="hidden" onChange={handleFileChange} />
            <div className="w-full space-y-3">
              <button onClick={() => cameraInputRef.current?.click()} disabled={loadingImage} className="flex w-full items-center justify-center gap-2 rounded-xl bg-sky-500 py-3 font-semibold text-white disabled:opacity-60">
                {loadingImage ? <><LoaderCircle className="h-5 w-5 animate-spin" />Loading image...</> : <><Camera className="h-5 w-5" />Take Photo</>}
              </button>
              <button onClick={() => galleryInputRef.current?.click()} disabled={loadingImage} className="flex w-full items-center justify-center gap-2 rounded-xl bg-slate-100 py-3 font-semibold text-slate-700 disabled:opacity-60">
                <ImageIcon className="h-5 w-5" />Upload from Gallery
              </button>
            </div>
          </div>
        ) : (
          <div>
            <h2 className="mb-2 text-center text-lg font-bold text-slate-900">Crop Prescription</h2>
            <p className="mb-4 text-center text-sm text-slate-500">Adjust the crop area to include only the prescription text.</p>
            {!croppedImage ? (
              <>
                <div className="relative h-[360px] w-full overflow-hidden rounded-2xl bg-slate-900">
                  <Cropper image={imageSrc} crop={crop} zoom={zoom} aspect={4 / 3} onCropChange={setCrop} onZoomChange={setZoom} onCropComplete={(_, croppedPixels) => setCroppedAreaPixels(croppedPixels)} />
                </div>
                <div className="mt-4">
                  <label className="mb-2 block text-sm font-medium text-slate-700">Zoom</label>
                  <input type="range" min={1} max={3} step={0.1} value={zoom} onChange={(e) => setZoom(Number(e.target.value))} className="w-full" />
                </div>
                <div className="mt-5 flex gap-3">
                  <button onClick={resetAll} className="w-full rounded-xl bg-slate-100 py-3 font-semibold text-slate-700">Back</button>
                  <button onClick={createCroppedImage} className="w-full rounded-xl bg-sky-500 py-3 font-semibold text-white">Crop</button>
                </div>
              </>
            ) : (
              <>
                {showCharacterHighlight && prediction && (
                  <div className="mb-2 rounded-lg bg-gradient-to-r from-cyan-900/40 to-blue-900/40 border border-cyan-500/50 px-3 py-2 text-center backdrop-blur-sm">
                    <div className="flex items-center justify-center gap-1.5 mb-0.5">
                      <Sparkles className="h-3 w-3 text-cyan-400 animate-pulse" />
                      <p className="text-[8px] font-bold uppercase tracking-[0.1em] text-cyan-300">
                        {matchInfo?.method === "OCR Suggestion Match" ? "SUGGESTION MATCH" : "CHARACTER MATCH"}
                      </p>
                      <Sparkles className="h-3 w-3 text-cyan-400 animate-pulse" />
                    </div>
                    <h3 className="text-lg font-black uppercase tracking-widest text-white drop-shadow-[0_0_10px_rgba(34,211,238,0.8)]">{prediction.label}</h3>
                    <div className="mt-1 flex flex-col items-center gap-0.5">
                      <div className="flex items-center gap-1.5">
                        <div className="h-1 w-16 overflow-hidden rounded-full bg-slate-700">
                          <div className="h-full rounded-full bg-gradient-to-r from-cyan-400 to-blue-500 transition-all duration-1000" style={{ width: `${prediction.confidence * 100}%` }} />
                        </div>
                        <p className="text-[9px] font-semibold text-cyan-200">{(prediction.confidence * 100).toFixed(1)}%</p>
                      </div>
                      {matchInfo && (
                        <p className="text-[7px] text-cyan-400/80 font-mono">{matchInfo.method}</p>
                      )}
                    </div>
                  </div>
                )}

                <div className="relative overflow-hidden rounded-2xl border-2 border-cyan-500/50 bg-black shadow-[0_0_30px_rgba(6,182,212,0.3)]">
                  <img src={croppedImage} alt="Thermal processed prescription scan" className="max-h-[340px] w-full object-contain opacity-70 mix-blend-screen contrast-200 saturate-200 hue-rotate-180" />
                  <div className="absolute inset-0 bg-cyan-900/30 mix-blend-overlay" />
                  <div className="absolute inset-0 opacity-20" style={{
                    backgroundImage: `linear-gradient(rgba(6,182,212,0.3) 1px, transparent 1px), linear-gradient(90deg, rgba(6,182,212,0.3) 1px, transparent 1px)`,
                    backgroundSize: '20px 20px'
                  }} />
                  {scanPhase === "scanning" && (
                    <>
                      <div className="absolute left-0 right-0 h-[2px] bg-cyan-400 shadow-[0_0_15px_rgba(6,182,212,1),0_0_30px_rgba(6,182,212,0.5)]" style={{ top: `${scanLineY}%` }} />
                      <div className="absolute left-0 right-0 h-16 bg-gradient-to-b from-cyan-400/20 to-transparent" style={{ top: `${scanLineY}%` }} />
                    </>
                  )}
                  {scanPhase === "detected" && detectedRegions.map((region, idx) => (
                    <div key={region.id} className="absolute border-2 animate-pulse" style={{
                      left: `${region.x}%`, top: `${region.y}%`, width: `${region.width}%`, height: `${region.height}%`,
                      borderColor: region.isMatched ? '#22d3ee' : '#f59e0b',
                      boxShadow: region.isMatched ? '0 0 15px rgba(34,211,238,0.8), inset 0 0 15px rgba(34,211,238,0.3)' : '0 0 8px rgba(245,158,11,0.4), inset 0 0 8px rgba(245,158,11,0.1)',
                      animationDelay: `${idx * 0.08}s`,
                      animationDuration: region.isMatched ? '1.5s' : '3s',
                    }}>
                      <div className="absolute -left-[2px] -top-[2px] h-2 w-2 border-l-2 border-t-2 border-cyan-400" />
                      <div className="absolute -right-[2px] -top-[2px] h-2 w-2 border-r-2 border-t-2 border-cyan-400" />
                      <div className="absolute -left-[2px] -bottom-[2px] h-2 w-2 border-l-2 border-b-2 border-cyan-400" />
                      <div className="absolute -right-[2px] -bottom-[2px] h-2 w-2 border-r-2 border-b-2 border-cyan-400" />
                      <div className="absolute -top-6 left-0 whitespace-nowrap rounded px-1.5 py-0.5 text-[10px] font-bold text-black flex items-center gap-1" style={{ backgroundColor: region.isMatched ? '#22d3ee' : '#f59e0b' }}>
                        {region.isMatched && <Crosshair className="h-2.5 w-2.5" />}
                        {region.label}
                        <span className="opacity-70">{(region.confidence * 100).toFixed(0)}%{region.isMatched && ` | ${(region.matchScore! * 100).toFixed(0)}% match`}</span>
                      </div>
                    </div>
                  ))}

                  {scanPhase === "scanning" && (
                    <div className="absolute inset-0 flex flex-col items-center justify-center bg-black/40">
                      <ScanLine className="h-12 w-12 text-cyan-400 animate-bounce" />
                      <p className="mt-3 text-sm font-bold text-cyan-300 tracking-wider animate-pulse">SCANNING DOCUMENT...</p>
                    </div>
                  )}
                  {scanPhase === "reading" && (
                    <div className="absolute inset-0 flex flex-col items-center justify-center bg-black/40">
                      <div className="flex items-center gap-3">
                        <Eye className="h-8 w-8 text-cyan-400 animate-pulse" />
                        <Type className="h-8 w-8 text-cyan-400 animate-pulse" style={{ animationDelay: '0.2s' }} />
                      </div>
                      <p className="mt-3 text-sm font-bold text-cyan-300 tracking-wider animate-pulse">READING CHARACTERS...</p>
                      <p className="mt-1 text-xs text-cyan-500/70 font-mono">Model Detecting</p>
                    </div>
                  )}
                  {scanPhase === "matching" && (
                    <div className="absolute inset-0 flex flex-col items-center justify-center bg-black/40">
                      <Search className="h-12 w-12 text-cyan-400 animate-spin" />
                      <p className="mt-3 text-sm font-bold text-cyan-300 tracking-wider animate-pulse">MATCHING MEDICATIONS...</p>
                      <p className="mt-1 text-xs text-cyan-500/70 font-mono">Comparing against {classNamesRef.current.length} class names</p>
                    </div>
                  )}

                  <div className="absolute bottom-2 left-2 right-2 flex items-center justify-between text-[9px] text-cyan-500/60 font-mono">
                    <span>ENGINE: GOOGLE CLOUD VISION</span>
                    <span className="animate-pulse">● LIVE</span>
                    <span>MODE: OCR_ACTIVE</span>
                  </div>
                </div>

                {errorMessage && (
                  <div className="mt-4 rounded-2xl border border-red-200 bg-red-50 p-4">
                    <p className="text-sm font-semibold text-red-900">{errorMessage}</p>
                  </div>
                )}
                {prediction && storedPrescription && (
                  <div className="mt-4 rounded-2xl border border-emerald-200 bg-emerald-50 p-4 text-center">
                    <div className="flex items-center justify-center gap-2">
                      <FileText className="h-5 w-5 text-emerald-600" />
                      <p className="text-sm font-semibold text-emerald-700">Recognition result saved successfully.</p>
                    </div>
                  </div>
                )}

                <div className="mt-5 flex gap-3">
                  <button onClick={resetAll} disabled={isBusy} className="w-full rounded-xl bg-slate-100 py-3 font-semibold text-slate-700 disabled:cursor-not-allowed disabled:opacity-60">
                    {storedPrescription ? "Take Another Picture" : "Back"}
                  </button>
                  <button onClick={handleUseImage} disabled={isBusy || showSuggestions} className="flex w-full items-center justify-center gap-2 rounded-xl bg-sky-500 py-3 font-semibold text-white disabled:cursor-not-allowed disabled:opacity-60">
                    {isBusy ? (
                      <>
                        <LoaderCircle className="h-5 w-5 animate-spin" />
                        {storing ? "Saving..." : scanPhase === "scanning" ? "Scanning..." : scanPhase === "reading" ? "Reading text..." : scanPhase === "matching" ? "Matching..." : "Detecting..."}
                      </>
                    ) : storedPrescription ? "View Details" : <><Check className="h-5 w-5" />Detect</>}
                  </button>
                </div>
              </>
            )}
          </div>
        )}
      </div>

      {showMedicationModal && detailsPrescription && (
        <MedicationDetailsModal prescription={detailsPrescription} onClose={() => setShowMedicationModal(false)} />
      )}
    </div>
  );
}

function MedicationDetailsModal({ prescription, onClose }: { prescription: StoredPrescription; onClose: () => void }) {
  const medication = medications.find((med) => med.medication_name.toLowerCase() === prescription.medication_name.toLowerCase());
  if (!medication) return null;

  return (
    <div className="fixed inset-0 z-[60] flex items-center justify-center px-4">
      <div onClick={onClose} className="absolute inset-0 bg-black/60 backdrop-blur-sm" />
      <div className="relative max-h-[92vh] w-full max-w-md overflow-y-auto rounded-[32px] bg-white shadow-2xl">
        <div className="relative h-64 overflow-hidden rounded-t-[32px]">
          <img src={medication.image_url} alt={medication.medication_name} className="absolute inset-0 h-full w-full object-cover" />
          <div className="absolute inset-0 bg-black/45" />
          <button onClick={onClose} className="absolute right-4 top-4 z-10 rounded-2xl bg-white/20 p-2 backdrop-blur-md hover:bg-white/30">
            <X className="h-5 w-5 text-white" />
          </button>
        </div>
        <div className="relative -mt-16 px-6 pb-2 text-center">
          <div className="relative z-10 rounded-3xl bg-gradient-to-r from-sky-500 to-blue-600 px-6 py-5 shadow-lg shadow-sky-500/20">
            <p className="text-sm font-medium text-white/80">Detected Medication</p>
            <h2 className="mt-1 text-2xl font-black leading-tight text-white">{medication.medication_name}</h2>
            <div className="mx-auto mt-3 w-fit rounded-full bg-white/20 px-4 py-1.5 text-sm uppercase font-bold text-white backdrop-blur-sm">
              Confidence: {(prescription.confidence * 100).toFixed(2)}%
            </div>
          </div>
        </div>
        <div className="space-y-4 p-5 pt-2">
          <DetailCard icon={<Pill className="h-5 w-5 text-sky-600" />} title="Dosage" content={medication.dosage} />
          <DetailCard icon={<BookOpen className="h-5 w-5 text-sky-600" />} title="Description" content={medication.description} />
          <DetailCard icon={<ClipboardList className="h-5 w-5 text-sky-600" />} title="Instructions" content={medication.instructions} />
          <DetailCard icon={<Activity className="h-5 w-5 text-sky-600" />} title="Guidelines" content={medication.guidelines} />
          <div className="rounded-3xl border border-red-200 bg-red-50 p-4">
            <div className="mb-2 flex items-center gap-2">
              <ShieldAlert className="h-5 w-5 text-red-600" />
              <h3 className="font-bold text-red-900">Medical Disclaimer</h3>
            </div>
            <p className="text-sm leading-6 text-red-700">{medication.medical_disclaimer}</p>
          </div>
          <button onClick={onClose} className="w-full rounded-2xl bg-gradient-to-r from-sky-500 to-blue-600 py-3 font-bold text-white shadow-lg shadow-sky-500/30 active:scale-95">Close Details</button>
        </div>
      </div>
    </div>
  );
}

function DetailCard({ icon, title, content }: { icon: React.ReactNode; title: string; content: string }) {
  return (
    <div className="rounded-3xl border border-slate-200 bg-white p-4 shadow-sm">
      <div className="mb-2 flex items-center gap-2">{icon}<h3 className="font-bold text-slate-900">{title}</h3></div>
      <p className="text-sm leading-6 text-slate-600">{content}</p>
    </div>
  );
}