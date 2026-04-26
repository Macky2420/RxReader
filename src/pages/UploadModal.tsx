import { useRef, useState } from "react";
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

const MODEL_URL = "/model/model.onnx";
const CLASS_NAMES_URL = "/model/class_names.json";
const BUCKET_NAME = "medication_image";

export default function UploadModal({ onClose }: UploadModalProps) {
  const cameraInputRef = useRef<HTMLInputElement | null>(null);
  const galleryInputRef = useRef<HTMLInputElement | null>(null);

  // Lazy-loaded ONNX session
  const sessionRef = useRef<any>(null);
  const ortRef = useRef<any>(null);
  const classNamesRef = useRef<string[]>([]);

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

      const result = await predictImage(croppedImage);

      console.log("Prediction result:", result);

      if (result.confidence < 0.5) {
        setPrediction(null);
        setStoredPrescription(null);
        setErrorMessage(
          "Sorry, please make sure the medication is clear. The confidence is below 50%."
        );
        return;
      }

      const foundMedication = medications.find(
        (med) =>
          med.medication_name.toLowerCase() === result.label.toLowerCase()
      );

      if (!foundMedication) {
        setPrediction(null);
        setStoredPrescription(null);
        setErrorMessage(
          `Detected "${result.label}", but no matching medication information was found in medications.ts.`
        );
        return;
      }

      setPrediction({
        label: foundMedication.medication_name,
        confidence: result.confidence,
      });

      await savePrescriptionToSupabase(
        foundMedication.medication_name,
        result.confidence,
        croppedImage
      );
    } catch (error) {
      console.error("Prediction error:", error);
      setErrorMessage(
        error instanceof Error
          ? error.message
          : "Prediction failed. Please try again."
      );
    } finally {
      setPredicting(false);
    }
  };

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
                <div className="overflow-hidden rounded-2xl border border-slate-200 bg-slate-100">
                  <img
                    src={croppedImage}
                    alt="Cropped prescription"
                    className="max-h-[320px] w-full object-contain"
                  />
                </div>

                {errorMessage && (
                  <div className="mt-4 rounded-2xl border border-red-200 bg-red-50 p-4">
                    <p className="text-sm font-semibold text-red-900">
                      {errorMessage}
                    </p>
                  </div>
                )}

                {prediction && storedPrescription && (
                  <div className="mt-4 rounded-2xl border border-emerald-200 bg-emerald-50 p-4">
                    <p className="text-sm text-emerald-700">
                      Detected and saved
                    </p>
                    <h3 className="text-lg font-bold text-emerald-900">
                      {prediction.label}
                    </h3>
                    <p className="text-sm text-emerald-700">
                      Confidence: {(prediction.confidence * 100).toFixed(2)}%
                    </p>
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

            <div className="mx-auto mt-3 w-fit rounded-full bg-white/20 px-4 py-1.5 text-sm font-bold text-white backdrop-blur-sm">
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