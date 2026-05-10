import { useRef, useState, useEffect, useCallback } from "react";
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
} from "lucide-react";
import Cropper from "react-easy-crop";
import { createWorker, type Worker } from "tesseract.js";
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

// Bounding box for detected text regions from REAL OCR
type DetectedRegion = {
  id: number;
  x: number;      // percentage 0-100
  y: number;      // percentage 0-100
  width: number;  // percentage 0-100
  height: number; // percentage 0-100
  label: string;
  confidence: number;
  isMatched?: boolean;      // true if this word matches a medication
  matchedMedication?: string; // the medication name it matched to
  matchScore?: number;      // similarity score 0-1
};

const MODEL_URL = "/model/model.onnx";
const CLASS_NAMES_URL = "/model/class_names.json";
const BUCKET_NAME = "medication_image";

// Simple fuzzy string similarity (Levenshtein-based)
function getSimilarity(str1: string, str2: string): number {
  const s1 = str1.toLowerCase().trim();
  const s2 = str2.toLowerCase().trim();

  if (s1 === s2) return 1.0;

  // Check if one contains the other
  if (s1.includes(s2) || s2.includes(s1)) {
    const longer = Math.max(s1.length, s2.length);
    const shorter = Math.min(s1.length, s2.length);
    return shorter / longer;
  }

  // Word-level matching
  const words1 = s1.split(/\s+/);
  const words2 = s2.split(/\s+/);

  let matches = 0;
  for (const w1 of words1) {
    for (const w2 of words2) {
      if (w1 === w2 || (w1.length > 3 && w2.length > 3 && 
          (w1.includes(w2) || w2.includes(w1)))) {
        matches++;
        break;
      }
    }
  }

  return matches / Math.max(words1.length, words2.length);
}

// Find best matching medication from OCR text
function findBestMedicationMatch(ocrText: string): { medication: typeof medications[0] | null; score: number; matchedWords: string[] } {
  const ocrLower = ocrText.toLowerCase();
  const ocrWords = ocrLower.split(/[^a-z0-9]+/).filter(w => w.length > 2);

  let bestMatch = null;
  let bestScore = 0;
  let matchedWords: string[] = [];

  for (const med of medications) {
    const medName = med.medication_name.toLowerCase();
    const medWords = medName.split(/[^a-z0-9]+/).filter(w => w.length > 2);

    let score = 0;
    const currentMatched: string[] = [];

    for (const medWord of medWords) {
      for (const ocrWord of ocrWords) {
        const sim = getSimilarity(medWord, ocrWord);
        if (sim > 0.7) {
          score += sim;
          currentMatched.push(ocrWord);
        }
      }
    }

    // Normalize score
    score = score / Math.max(medWords.length, 1);

    if (score > bestScore) {
      bestScore = score;
      bestMatch = med;
      matchedWords = currentMatched;
    }
  }

  return { medication: bestMatch, score: bestScore, matchedWords };
}

export default function UploadModal({ onClose }: UploadModalProps) {
  const cameraInputRef = useRef<HTMLInputElement | null>(null);
  const galleryInputRef = useRef<HTMLInputElement | null>(null);

  const sessionRef = useRef<any>(null);
  const ortRef = useRef<any>(null);
  const classNamesRef = useRef<string[]>([]);
  const tesseractWorkerRef = useRef<Worker | null>(null);

  const [imageSrc, setImageSrc] = useState<string | null>(null);
  const [crop, setCrop] = useState({ x: 0, y: 0 });
  const [zoom, setZoom] = useState(1);
  const [croppedAreaPixels, setCroppedAreaPixels] =
    useState<CroppedAreaPixels | null>(null);
  const [croppedImage, setCroppedImage] = useState<string | null>(null);

  const [loadingImage, setLoadingImage] = useState(false);
  const [loadingModel, setLoadingModel] = useState(false);
  const [predicting, setPredicting] = useState(false);
  const [storing, setStoring] = useState(false);

  const [prediction, setPrediction] = useState<PredictionResult | null>(null);
  const [storedPrescription, setStoredPrescription] =
    useState<StoredPrescription | null>(null);
  const [detailsPrescription, setDetailsPrescription] =
    useState<StoredPrescription | null>(null);

  const [showMedicationModal, setShowMedicationModal] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  // Detection animation states
  const [scanPhase, setScanPhase] = useState<"idle" | "scanning" | "reading" | "matching" | "detected">("idle");
  const [detectedRegions, setDetectedRegions] = useState<DetectedRegion[]>([]);
  const [scanLineY, setScanLineY] = useState(0);
  const [showCharacterHighlight, setShowCharacterHighlight] = useState(false);
  const [ocrText, setOcrText] = useState<string>("");
  const [matchInfo, setMatchInfo] = useState<{ score: number; method: string; ocrSimilarity?: number } | null>(null);

  // Initialize Tesseract worker lazily
  const getTesseractWorker = useCallback(async (): Promise<Worker> => {
    if (tesseractWorkerRef.current) return tesseractWorkerRef.current;

    const worker = await createWorker("eng");
    tesseractWorkerRef.current = worker;
    return worker;
  }, []);

  // Cleanup worker on unmount
  useEffect(() => {
    return () => {
      if (tesseractWorkerRef.current) {
        tesseractWorkerRef.current.terminate();
      }
    };
  }, []);

  const resetAll = () => {
    setImageSrc(null);
    setCroppedImage(null);
    setPrediction(null);
    setStoredPrescription(null);
    setDetailsPrescription(null);
    setErrorMessage(null);
    setShowMedicationModal(false);
    setCrop({ x: 0, y: 0 });
    setZoom(1);
    setScanPhase("idle");
    setDetectedRegions([]);
    setShowCharacterHighlight(false);
    setOcrText("");
    setMatchInfo(null);
  };

  const getCurrentUser = async () => {
    const {
      data: { user },
      error,
    } = await supabase.auth.getUser();

    if (error || !user) {
      throw new Error(
        "User is not authenticated. Please complete onboarding first."
      );
    }

    return user;
  };

  const resizeImageFile = async (file: File): Promise<string> => {
    return new Promise((resolve, reject) => {
      const reader = new FileReader();
      const img = new Image();

      reader.onload = () => {
        img.src = reader.result as string;
      };

      reader.onerror = () => {
        reject(new Error("Failed to read image file."));
      };

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

        if (!ctx) {
          reject(new Error("Canvas is not supported."));
          return;
        }

        ctx.drawImage(img, 0, 0, width, height);

        const resizedBase64 = canvas.toDataURL("image/jpeg", 0.85);
        resolve(resizedBase64);
      };

      img.onerror = () => {
        reject(new Error("Failed to load image."));
      };

      reader.readAsDataURL(file);
    });
  };

  const loadModel = async () => {
    if (sessionRef.current && classNamesRef.current.length > 0) return;

    setLoadingModel(true);

    try {
      const ort = await import("onnxruntime-web");

      ort.env.wasm.wasmPaths = "/ort/";
      ort.env.wasm.numThreads = 1;

      ortRef.current = ort;

      const session = await ort.InferenceSession.create(MODEL_URL, {
        executionProviders: ["wasm"],
      });

      sessionRef.current = session;

      const response = await fetch(CLASS_NAMES_URL);

      if (!response.ok) {
        throw new Error("class_names.json not found in public/model/");
      }

      const classes: string[] = await response.json();

      if (!Array.isArray(classes) || classes.length === 0) {
        throw new Error("class_names.json is empty or invalid.");
      }

      classNamesRef.current = classes;

      console.log("ONNX model loaded lazily.");
      console.log("Input names:", session.inputNames);
      console.log("Output names:", session.outputNames);
      console.log("Class names:", classes);
    } finally {
      setLoadingModel(false);
    }
  };

  // REAL OCR: Run Tesseract.js on the cropped image
  const runOCR = async (imageBase64: string): Promise<DetectedRegion[]> => {
    const worker = await getTesseractWorker();

    const img = new Image();
    img.src = imageBase64;
    await new Promise<void>((resolve, reject) => {
      img.onload = () => resolve();
      img.onerror = () => reject(new Error("Failed to load image for OCR"));
    });

    const imgWidth = img.width;
    const imgHeight = img.height;

    const result = await worker.recognize(imageBase64, {}, { blocks: true });

    console.log("Tesseract result keys:", Object.keys(result.data));

    const fullText = result.data.text;
    setOcrText(fullText);
    console.log("OCR Full Text:", fullText);

    const regions: DetectedRegion[] = [];

    // Extract words from nested blocks structure
    if (result.data.blocks) {
      result.data.blocks.forEach((block: any, blockIdx: number) => {
        if (block.paragraphs) {
          block.paragraphs.forEach((paragraph: any, paraIdx: number) => {
            if (paragraph.lines) {
              paragraph.lines.forEach((line: any, lineIdx: number) => {
                if (line.words) {
                  line.words.forEach((word: any, wordIdx: number) => {
                    let x0, y0, x1, y1;

                    if (word.bbox && typeof word.bbox === 'object') {
                      x0 = word.bbox.x0 ?? word.bbox.x ?? 0;
                      y0 = word.bbox.y0 ?? word.bbox.y ?? 0;
                      x1 = word.bbox.x1 ?? ((word.bbox.x !== undefined && word.bbox.width !== undefined) ? word.bbox.x + word.bbox.width : undefined) ?? 0;
                      y1 = word.bbox.y1 ?? ((word.bbox.y !== undefined && word.bbox.height !== undefined) ? word.bbox.y + word.bbox.height : undefined) ?? 0;
                    }

                    if (x0 !== undefined && x1 !== undefined && y0 !== undefined && y1 !== undefined) {
                      regions.push({
                        id: blockIdx * 10000 + paraIdx * 1000 + lineIdx * 100 + wordIdx,
                        x: (x0 / imgWidth) * 100,
                        y: (y0 / imgHeight) * 100,
                        width: ((x1 - x0) / imgWidth) * 100,
                        height: ((y1 - y0) / imgHeight) * 100,
                        label: word.text || "",
                        confidence: (word.confidence ?? 0) / 100,
                      });
                    }
                  });
                }
              });
            }
          });
        }
      });
    }

    // Fallback to direct words array
    const ocrData: any = result.data;
    if (regions.length === 0 && ocrData.words) {
      ocrData.words.forEach((word: any, idx: number) => {
        let x0, y0, x1, y1;

        if (word.bbox && typeof word.bbox === 'object') {
          x0 = word.bbox.x0 ?? 0;
          y0 = word.bbox.y0 ?? 0;
          x1 = word.bbox.x1 ?? 0;
          y1 = word.bbox.y1 ?? 0;
        }

        if (x0 !== undefined && x1 !== undefined) {
          regions.push({
            id: idx,
            x: (x0 / imgWidth) * 100,
            y: (y0 / imgHeight) * 100,
            width: ((x1 - x0) / imgWidth) * 100,
            height: ((y1 - y0) / imgHeight) * 100,
            label: word.text || "",
            confidence: (word.confidence ?? 0) / 100,
          });
        }
      });
    }

    console.log("OCR regions generated:", regions.length);
    return regions;
  };

  const predictImage = async (
    imageBase64: string
  ): Promise<PredictionResult> => {
    await loadModel();

    if (!sessionRef.current || !ortRef.current) {
      throw new Error("ONNX model is not loaded.");
    }

    if (classNamesRef.current.length === 0) {
      throw new Error("Class names are not loaded.");
    }

    const img = new Image();
    img.src = imageBase64;

    await new Promise<void>((resolve, reject) => {
      img.onload = () => resolve();
      img.onerror = () => reject(new Error("Failed to load image."));
    });

    const canvas = document.createElement("canvas");
    canvas.width = 224;
    canvas.height = 224;

    const ctx = canvas.getContext("2d");

    if (!ctx) {
      throw new Error("Canvas is not supported.");
    }

    ctx.drawImage(img, 0, 0, 224, 224);

    const imageData = ctx.getImageData(0, 0, 224, 224).data;
    const input = new Float32Array(224 * 224 * 3);

    for (let i = 0; i < 224 * 224; i++) {
      const r = imageData[i * 4];
      const g = imageData[i * 4 + 1];
      const b = imageData[i * 4 + 2];

      input[i * 3] = r;
      input[i * 3 + 1] = g;
      input[i * 3 + 2] = b;
    }

    const inputName = sessionRef.current.inputNames[0];
    const outputName = sessionRef.current.outputNames[0];

    const tensor = new ortRef.current.Tensor("float32", input, [
      1,
      224,
      224,
      3,
    ]);

    const results = await sessionRef.current.run({
      [inputName]: tensor,
    });

    const scores = Array.from(results[outputName].data as Float32Array);
    const maxScore = Math.max(...scores);
    const maxIndex = scores.indexOf(maxScore);

    return {
      label: classNamesRef.current[maxIndex] ?? "Unknown",
      confidence: maxScore,
    };
  };

  const dataURLtoBlob = (dataUrl: string) => {
    const arr = dataUrl.split(",");
    const mime = arr[0].match(/:(.*?);/)?.[1] || "image/jpeg";
    const bstr = atob(arr[1]);

    let n = bstr.length;
    const u8arr = new Uint8Array(n);

    while (n--) {
      u8arr[n] = bstr.charCodeAt(n);
    }

    return new Blob([u8arr], { type: mime });
  };

  const uploadPrescriptionCapture = async (imageBase64: string) => {
    const user = await getCurrentUser();

    const blob = dataURLtoBlob(imageBase64);
    const fileName = `${user.id}/${Date.now()}_prescription.jpg`;

    const { error } = await supabase.storage
      .from(BUCKET_NAME)
      .upload(fileName, blob, {
        contentType: "image/jpeg",
        upsert: false,
      });

    if (error) throw error;

    const { data } = supabase.storage.from(BUCKET_NAME).getPublicUrl(fileName);

    return {
      publicUrl: data.publicUrl,
      userId: user.id,
    };
  };

  const savePrescriptionToSupabase = async (
    medicationName: string,
    confidence: number,
    imageBase64: string
  ) => {
    setStoring(true);

    try {
      const { publicUrl, userId } = await uploadPrescriptionCapture(imageBase64);

      const { data, error } = await supabase
        .from("prescriptions")
        .insert({
          user_id: userId,
          medication_name: medicationName,
          image_url: publicUrl,
          confidence,
        })
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

  const handleFileChange = async (
    event: React.ChangeEvent<HTMLInputElement>
  ) => {
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

    if (!ctx) {
      alert("Canvas is not supported.");
      return;
    }

    canvas.width = croppedAreaPixels.width;
    canvas.height = croppedAreaPixels.height;

    ctx.drawImage(
      image,
      croppedAreaPixels.x,
      croppedAreaPixels.y,
      croppedAreaPixels.width,
      croppedAreaPixels.height,
      0,
      0,
      croppedAreaPixels.width,
      croppedAreaPixels.height
    );

    const croppedBase64 = canvas.toDataURL("image/jpeg", 0.9);

    setCroppedImage(croppedBase64);
    setPrediction(null);
    setStoredPrescription(null);
    setDetailsPrescription(null);
    setErrorMessage(null);
  };

  // UPDATED: OCR-first flow with medication matching
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
      setScanPhase("scanning");

      // Phase 1: Scanning animation
      await new Promise(resolve => setTimeout(resolve, 2000));
      setScanPhase("reading");

      // Phase 2: Run REAL OCR
      const ocrRegions = await runOCR(croppedImage);
      console.log("OCR detected regions:", ocrRegions);

      // Phase 3: Match OCR text against medications
      setScanPhase("matching");
      const { medication: matchedMed, score: matchScore, matchedWords } = findBestMedicationMatch(ocrText);

      console.log("OCR Match:", matchedMed?.medication_name, "Score:", matchScore);
      console.log("Matched words:", matchedWords);

      // Mark regions that matched medication words
      const enhancedRegions = ocrRegions.map(region => {
        const regionText = region.label.toLowerCase().trim();
        let bestWordScore = 0;
        let matchedMedName = "";

        if (matchedMed) {
          const medWords = matchedMed.medication_name.toLowerCase().split(/[^a-z0-9]+/).filter(w => w.length > 2);
          for (const medWord of medWords) {
            const sim = getSimilarity(regionText, medWord);
            if (sim > bestWordScore) {
              bestWordScore = sim;
              matchedMedName = matchedMed.medication_name;
            }
          }
        }

        return {
          ...region,
          isMatched: bestWordScore > 0.6,
          matchedMedication: bestWordScore > 0.6 ? matchedMedName : undefined,
          matchScore: bestWordScore,
        };
      });

      setDetectedRegions(enhancedRegions);

      // Phase 4: Also run ONNX model as backup/validation
      let finalResult: PredictionResult;
      let finalMedication = matchedMed ?? null;

      if (matchedMed && matchScore > 0.5) {
        // OCR found a good match - use it!
        finalResult = {
          label: matchedMed.medication_name,
          confidence: Math.min(matchScore * 1.2, 0.98), // Scale up but cap at 98%
        };
        setMatchInfo({ score: matchScore, method: "OCR Text Match" });
      } else {
        // OCR didn't find match well - fallback to ONNX model
        const onnxResult = await predictImage(croppedImage);

        if (onnxResult.confidence < 0.5) {
          setPrediction(null);
          setStoredPrescription(null);
          setScanPhase("idle");
          setErrorMessage(
            "Sorry, please make sure the medication is clear. The confidence is below 50%."
          );
          return;
        }

        finalResult = {
          label: onnxResult.label,
          confidence: onnxResult.confidence,
        };
        finalMedication = medications.find(
          (med) => med.medication_name.toLowerCase() === onnxResult.label.toLowerCase()
        ) ?? null;
        setMatchInfo({ score: onnxResult.confidence, method: "ONNX Model" });
      }

      if (!finalMedication) {
        setPrediction(null);
        setStoredPrescription(null);
        setScanPhase("idle");
        setErrorMessage(
          `Detected "${finalResult.label}", but no matching medication information was found in medications.ts.`
        );
        return;
      }

      setPrediction({
        label: finalMedication.medication_name,
        confidence: finalResult.confidence,
      });

      setScanPhase("detected");
      setShowCharacterHighlight(true);

      await savePrescriptionToSupabase(
        finalMedication.medication_name,
        finalResult.confidence,
        croppedImage
      );
    } catch (error) {
      console.error("Prediction error:", error);
      setScanPhase("idle");
      setErrorMessage(
        error instanceof Error
          ? error.message
          : "Prediction failed. Please try again."
      );
    } finally {
      setPredicting(false);
    }
  };

  // Animated scan line effect
  useEffect(() => {
    if (scanPhase !== "scanning") return;

    let animationId: number;
    let startTime = Date.now();

    const animate = () => {
      const elapsed = Date.now() - startTime;
      const progress = (elapsed % 2000) / 2000;
      setScanLineY(progress * 100);
      animationId = requestAnimationFrame(animate);
    };

    animationId = requestAnimationFrame(animate);
    return () => cancelAnimationFrame(animationId);
  }, [scanPhase]);

  const isBusy = predicting || loadingModel || storing || loadingImage;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center px-4">
      <div
        onClick={() => {
          if (!isBusy) onClose();
        }}
        className="absolute inset-0 bg-black/50 backdrop-blur-sm"
      />

      <div className="relative w-full max-w-md rounded-3xl bg-white p-5 shadow-2xl">
        <button
          onClick={onClose}
          disabled={isBusy}
          className="absolute right-4 top-4 rounded-xl p-2 hover:bg-slate-100 disabled:cursor-not-allowed disabled:opacity-50"
        >
          <X className="h-5 w-5 text-slate-600" />
        </button>

        {!imageSrc ? (
          <div className="flex flex-col items-center text-center">
            <div className="mb-4 flex h-16 w-16 items-center justify-center rounded-2xl bg-gradient-to-br from-sky-500 to-blue-600">
              <UploadCloud className="h-8 w-8 text-white" />
            </div>

            <h2 className="mb-2 text-lg font-bold text-slate-900">
              Upload Prescription
            </h2>

            <p className="mb-6 text-sm text-slate-500">
              Take a photo or upload a prescription image, then crop the
              prescription area.
            </p>

            {errorMessage && (
              <div className="mb-4 w-full rounded-2xl border border-red-200 bg-red-50 p-4">
                <p className="text-sm font-semibold text-red-900">
                  {errorMessage}
                </p>
              </div>
            )}

            <input
              ref={cameraInputRef}
              type="file"
              accept="image/jpeg,image/png,image/webp"
              capture="environment"
              className="hidden"
              onChange={handleFileChange}
            />

            <input
              ref={galleryInputRef}
              type="file"
              accept="image/jpeg,image/png,image/webp"
              className="hidden"
              onChange={handleFileChange}
            />

            <div className="w-full space-y-3">
              <button
                onClick={() => cameraInputRef.current?.click()}
                disabled={loadingImage}
                className="flex w-full items-center justify-center gap-2 rounded-xl bg-sky-500 py-3 font-semibold text-white disabled:opacity-60"
              >
                {loadingImage ? (
                  <>
                    <LoaderCircle className="h-5 w-5 animate-spin" />
                    Loading image...
                  </>
                ) : (
                  <>
                    <Camera className="h-5 w-5" />
                    Take Photo
                  </>
                )}
              </button>

              <button
                onClick={() => galleryInputRef.current?.click()}
                disabled={loadingImage}
                className="flex w-full items-center justify-center gap-2 rounded-xl bg-slate-100 py-3 font-semibold text-slate-700 disabled:opacity-60"
              >
                <ImageIcon className="h-5 w-5" />
                Upload from Gallery
              </button>
            </div>
          </div>
        ) : (
          <div>
            <h2 className="mb-2 text-center text-lg font-bold text-slate-900">
              Crop Prescription
            </h2>

            <p className="mb-4 text-center text-sm text-slate-500">
              Adjust the crop area to include only the prescription text.
            </p>

            {!croppedImage ? (
              <>
                <div className="relative h-[360px] w-full overflow-hidden rounded-2xl bg-slate-900">
                  <Cropper
                    image={imageSrc}
                    crop={crop}
                    zoom={zoom}
                    aspect={4 / 3}
                    onCropChange={setCrop}
                    onZoomChange={setZoom}
                    onCropComplete={(_, croppedPixels) =>
                      setCroppedAreaPixels(croppedPixels)
                    }
                  />
                </div>

                <div className="mt-4">
                  <label className="mb-2 block text-sm font-medium text-slate-700">
                    Zoom
                  </label>
                  <input
                    type="range"
                    min={1}
                    max={3}
                    step={0.1}
                    value={zoom}
                    onChange={(e) => setZoom(Number(e.target.value))}
                    className="w-full"
                  />
                </div>

                <div className="mt-5 flex gap-3">
                  <button
                    onClick={resetAll}
                    className="w-full rounded-xl bg-slate-100 py-3 font-semibold text-slate-700"
                  >
                    Back
                  </button>

                  <button
                    onClick={createCroppedImage}
                    className="w-full rounded-xl bg-sky-500 py-3 font-semibold text-white"
                  >
                    Crop
                  </button>
                </div>
              </>
            ) : (
              <>
                {/* Character result display - ABOVE the scan image */}
                {showCharacterHighlight && prediction && (
                  <div className="mb-2 rounded-lg bg-gradient-to-r from-cyan-900/40 to-blue-900/40 border border-cyan-500/50 px-3 py-2 text-center backdrop-blur-sm">
                    <div className="flex items-center justify-center gap-1.5 mb-0.5">
                      <Sparkles className="h-3 w-3 text-cyan-400 animate-pulse" />
                      <p className="text-[8px] font-bold uppercase tracking-[0.1em] text-cyan-300">
                        {matchInfo?.method === "OCR Text Match" ? "OCR Match" : "CHARACTER RECOGNITION"}
                      </p>
                      <Sparkles className="h-3 w-3 text-cyan-400 animate-pulse" />
                    </div>

                    <h3 className="text-lg font-black uppercase tracking-widest text-white drop-shadow-[0_0_10px_rgba(34,211,238,0.8)]">
                      {prediction.label}
                    </h3>

                    <div className="mt-1 flex flex-col items-center gap-0.5">
                      <div className="flex items-center gap-1.5">
                        <div className="h-1 w-16 overflow-hidden rounded-full bg-slate-700">
                          <div 
                            className="h-full rounded-full bg-gradient-to-r from-cyan-400 to-blue-500 transition-all duration-1000"
                            style={{ width: `${prediction.confidence * 100}%` }}
                          />
                        </div>
                        <p className="text-[9px] font-semibold text-cyan-200">
                          {(prediction.confidence * 100).toFixed(1)}%
                        </p>
                      </div>
                      {matchInfo && (
                        <div className="flex flex-col items-center gap-0.5">
                          <p className="text-[7px] text-cyan-400/80 font-mono">
                            {matchInfo.method}
                          </p>
                          {matchInfo.method === "ONNX + OCR Validation" && (
                            <p className="text-[7px] text-emerald-400/80 font-mono font-bold">
                              ✓ {(matchInfo.ocrSimilarity! * 100).toFixed(0)}% match
                            </p>
                          )}
                        </div>
                      )}
                    </div>
                  </div>
                )}

                {/* === ENHANCED SCAN DISPLAY WITH OCR + MEDICATION MATCHING === */}
                <div className="relative overflow-hidden rounded-2xl border-2 border-cyan-500/50 bg-black shadow-[0_0_30px_rgba(6,182,212,0.3)]">
                  {/* Base image with thermal/scan effect */}
                  <img
                    src={croppedImage}
                    alt="Thermal processed prescription scan"
                    className="max-h-[340px] w-full object-contain opacity-70 mix-blend-screen contrast-200 saturate-200 hue-rotate-180"
                  />

                  {/* Cyan overlay tint */}
                  <div className="absolute inset-0 bg-cyan-900/30 mix-blend-overlay" />

                  {/* Grid overlay */}
                  <div 
                    className="absolute inset-0 opacity-20"
                    style={{
                      backgroundImage: `
                        linear-gradient(rgba(6,182,212,0.3) 1px, transparent 1px),
                        linear-gradient(90deg, rgba(6,182,212,0.3) 1px, transparent 1px)
                      `,
                      backgroundSize: '20px 20px'
                    }}
                  />

                  {/* Animated scanning line */}
                  {scanPhase === "scanning" && (
                    <>
                      <div 
                        className="absolute left-0 right-0 h-[2px] bg-cyan-400 shadow-[0_0_15px_rgba(6,182,212,1),0_0_30px_rgba(6,182,212,0.5)]"
                        style={{ top: `${scanLineY}%` }}
                      />
                      <div 
                        className="absolute left-0 right-0 h-16 bg-gradient-to-b from-cyan-400/20 to-transparent"
                        style={{ top: `${scanLineY}%` }}
                      />
                    </>
                  )}

                  {/* REAL OCR Detected region bounding boxes */}
                  {scanPhase === "detected" && detectedRegions.map((region, idx) => (
                    <div
                      key={region.id}
                      className="absolute border-2 animate-pulse"
                      style={{
                        left: `${region.x}%`,
                        top: `${region.y}%`,
                        width: `${region.width}%`,
                        height: `${region.height}%`,
                        borderColor: region.isMatched ? '#22d3ee' : '#f59e0b',
                        boxShadow: region.isMatched 
                          ? '0 0 15px rgba(34,211,238,0.8), inset 0 0 15px rgba(34,211,238,0.3)'
                          : '0 0 8px rgba(245,158,11,0.4), inset 0 0 8px rgba(245,158,11,0.1)',
                        animationDelay: `${idx * 0.08}s`,
                        animationDuration: region.isMatched ? '1.5s' : '3s',
                      }}
                    >
                      {/* Corner markers */}
                      <div className="absolute -left-[2px] -top-[2px] h-2 w-2 border-l-2 border-t-2 border-cyan-400" />
                      <div className="absolute -right-[2px] -top-[2px] h-2 w-2 border-r-2 border-t-2 border-cyan-400" />
                      <div className="absolute -left-[2px] -bottom-[2px] h-2 w-2 border-l-2 border-b-2 border-cyan-400" />
                      <div className="absolute -right-[2px] -bottom-[2px] h-2 w-2 border-r-2 border-b-2 border-cyan-400" />

                      {/* Region label with match info */}
                      <div 
                        className="absolute -top-6 left-0 whitespace-nowrap rounded px-1.5 py-0.5 text-[10px] font-bold text-black flex items-center gap-1"
                        style={{
                          backgroundColor: region.isMatched ? '#22d3ee' : '#f59e0b',
                        }}
                      >
                        {region.isMatched && <Crosshair className="h-2.5 w-2.5" />}
                        {region.label} 
                        <span className="opacity-70">
                          {(region.confidence * 100).toFixed(0)}%
                          {region.isMatched && ` | ${(region.matchScore! * 100).toFixed(0)}% match`}
                        </span>
                      </div>
                    </div>
                  ))}

                  {/* Scanning status overlays */}
                  {scanPhase === "scanning" && (
                    <div className="absolute inset-0 flex flex-col items-center justify-center bg-black/40">
                      <ScanLine className="h-12 w-12 text-cyan-400 animate-bounce" />
                      <p className="mt-3 text-sm font-bold text-cyan-300 tracking-wider animate-pulse">
                        SCANNING DOCUMENT...
                      </p>
                    </div>
                  )}

                  {scanPhase === "reading" && (
                    <div className="absolute inset-0 flex flex-col items-center justify-center bg-black/40">
                      <div className="flex items-center gap-3">
                        <Eye className="h-8 w-8 text-cyan-400 animate-pulse" />
                        <Type className="h-8 w-8 text-cyan-400 animate-pulse" style={{ animationDelay: '0.2s' }} />
                      </div>
                      <p className="mt-3 text-sm font-bold text-cyan-300 tracking-wider animate-pulse">
                        READING CHARACTERS...
                      </p>
                      <p className="mt-1 text-xs text-cyan-500/70 font-mono">
                        Tesseract.js OCR Engine
                      </p>
                    </div>
                  )}

                  {scanPhase === "matching" && (
                    <div className="absolute inset-0 flex flex-col items-center justify-center bg-black/40">
                      <Search className="h-12 w-12 text-cyan-400 animate-spin" />
                      <p className="mt-3 text-sm font-bold text-cyan-300 tracking-wider animate-pulse">
                        MATCHING MEDICATIONS...
                      </p>
                      <p className="mt-1 text-xs text-cyan-500/70 font-mono">
                        Comparing against {medications.length} medications
                      </p>
                    </div>
                  )}

                  {/* Bottom tech decoration */}
                  <div className="absolute bottom-2 left-2 right-2 flex items-center justify-between text-[9px] text-cyan-500/60 font-mono">
                    <span>ENGINE: TESSERACT.JS v5</span>
                    <span className="animate-pulse">● LIVE</span>
                    <span>MODE: OCR_ACTIVE</span>
                  </div>
                </div>

                {errorMessage && (
                  <div className="mt-4 rounded-2xl border border-red-200 bg-red-50 p-4">
                    <p className="text-sm font-semibold text-red-900">
                      {errorMessage}
                    </p>
                  </div>
                )}

                {prediction && storedPrescription && (
                  <div className="mt-4 rounded-2xl border border-emerald-200 bg-emerald-50 p-4 text-center">
                    <div className="flex items-center justify-center gap-2">
                      <FileText className="h-5 w-5 text-emerald-600" />
                      <p className="text-sm font-semibold text-emerald-700">
                        Recognition result saved successfully.
                      </p>
                    </div>
                  </div>
                )}

                <div className="mt-5 flex gap-3">
                  <button
                    onClick={resetAll}
                    disabled={isBusy}
                    className="w-full rounded-xl bg-slate-100 py-3 font-semibold text-slate-700 disabled:cursor-not-allowed disabled:opacity-60"
                  >
                    {storedPrescription ? "Take Another Picture" : "Re-crop"}
                  </button>

                  <button
                    onClick={handleUseImage}
                    disabled={isBusy}
                    className="flex w-full items-center justify-center gap-2 rounded-xl bg-sky-500 py-3 font-semibold text-white disabled:cursor-not-allowed disabled:opacity-60"
                  >
                    {isBusy ? (
                      <>
                        <LoaderCircle className="h-5 w-5 animate-spin" />
                        {storing
                          ? "Saving..."
                          : loadingModel
                          ? "Loading model..."
                          : scanPhase === "scanning"
                          ? "Scanning..."
                          : scanPhase === "reading"
                          ? "Reading text..."
                          : scanPhase === "matching"
                          ? "Matching..."
                          : "Detecting..."}
                      </>
                    ) : storedPrescription ? (
                      "View Details"
                    ) : (
                      <>
                        <Check className="h-5 w-5" />
                        Detect
                      </>
                    )}
                  </button>
                </div>
              </>
            )}
          </div>
        )}
      </div>

      {showMedicationModal && detailsPrescription && (
        <MedicationDetailsModal
          prescription={detailsPrescription}
          onClose={() => setShowMedicationModal(false)}
        />
      )}
    </div>
  );
}

function MedicationDetailsModal({
  prescription,
  onClose,
}: {
  prescription: StoredPrescription;
  onClose: () => void;
}) {
  const medication = medications.find(
    (med) =>
      med.medication_name.toLowerCase() ===
      prescription.medication_name.toLowerCase()
  );

  if (!medication) return null;

  return (
    <div className="fixed inset-0 z-[60] flex items-center justify-center px-4">
      <div
        onClick={onClose}
        className="absolute inset-0 bg-black/60 backdrop-blur-sm"
      />

      <div className="relative max-h-[92vh] w-full max-w-md overflow-y-auto rounded-[32px] bg-white shadow-2xl">
        <div className="relative h-64 overflow-hidden rounded-t-[32px]">
          <img
            src={medication.image_url}
            alt={medication.medication_name}
            className="absolute inset-0 h-full w-full object-cover"
          />

          <div className="absolute inset-0 bg-black/45" />

          <button
            onClick={onClose}
            className="absolute right-4 top-4 z-10 rounded-2xl bg-white/20 p-2 backdrop-blur-md hover:bg-white/30"
          >
            <X className="h-5 w-5 text-white" />
          </button>
        </div>

        <div className="relative -mt-16 px-6 pb-2 text-center">
          <div className="relative z-10 rounded-3xl bg-gradient-to-r from-sky-500 to-blue-600 px-6 py-5 shadow-lg shadow-sky-500/20">
            <p className="text-sm font-medium text-white/80">
              Detected Medication
            </p>

            <h2 className="mt-1 text-2xl font-black leading-tight text-white">
              {medication.medication_name}
            </h2>

            <div className="mx-auto mt-3 w-fit rounded-full bg-white/20 px-4 py-1.5 text-sm uppercase font-bold text-white backdrop-blur-sm">
              Confidence: {(prescription.confidence * 100).toFixed(2)}%
            </div>
          </div>
        </div>

        <div className="space-y-4 p-5 pt-2">
          <DetailCard
            icon={<Pill className="h-5 w-5 text-sky-600" />}
            title="Dosage"
            content={medication.dosage}
          />

          <DetailCard
            icon={<BookOpen className="h-5 w-5 text-sky-600" />}
            title="Description"
            content={medication.description}
          />

          <DetailCard
            icon={<ClipboardList className="h-5 w-5 text-sky-600" />}
            title="Instructions"
            content={medication.instructions}
          />

          <DetailCard
            icon={<Activity className="h-5 w-5 text-sky-600" />}
            title="Guidelines"
            content={medication.guidelines}
          />

          <div className="rounded-3xl border border-red-200 bg-red-50 p-4">
            <div className="mb-2 flex items-center gap-2">
              <ShieldAlert className="h-5 w-5 text-red-600" />
              <h3 className="font-bold text-red-900">Medical Disclaimer</h3>
            </div>

            <p className="text-sm leading-6 text-red-700">
              {medication.medical_disclaimer}
            </p>
          </div>

          <button
            onClick={onClose}
            className="w-full rounded-2xl bg-gradient-to-r from-sky-500 to-blue-600 py-3 font-bold text-white shadow-lg shadow-sky-500/30 active:scale-95"
          >
            Close Details
          </button>
        </div>
      </div>
    </div>
  );
}

function DetailCard({
  icon,
  title,
  content,
}: {
  icon: React.ReactNode;
  title: string;
  content: string;
}) {
  return (
    <div className="rounded-3xl border border-slate-200 bg-white p-4 shadow-sm">
      <div className="mb-2 flex items-center gap-2">
        {icon}
        <h3 className="font-bold text-slate-900">{title}</h3>
      </div>

      <p className="text-sm leading-6 text-slate-600">{content}</p>
    </div>
  );
}