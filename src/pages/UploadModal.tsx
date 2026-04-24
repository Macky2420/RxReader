import { useRef, useState } from "react";
import {
  X,
  UploadCloud,
  Camera,
  ImageIcon,
  Check,
  LoaderCircle,
} from "lucide-react";
import Cropper from "react-easy-crop";
import * as tf from "@tensorflow/tfjs";

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

const MODEL_URL = "/model/model.json";
const CLASS_NAMES_URL = "/model/class_names.json";

export default function UploadModal({ onClose }: UploadModalProps) {
  const cameraInputRef = useRef<HTMLInputElement | null>(null);
  const galleryInputRef = useRef<HTMLInputElement | null>(null);
  const modelRef = useRef<tf.LayersModel | null>(null);
  const classNamesRef = useRef<string[]>([]);

  const [imageSrc, setImageSrc] = useState<string | null>(null);
  const [crop, setCrop] = useState({ x: 0, y: 0 });
  const [zoom, setZoom] = useState(1);
  const [croppedAreaPixels, setCroppedAreaPixels] =
    useState<CroppedAreaPixels | null>(null);
  const [croppedImage, setCroppedImage] = useState<string | null>(null);
  const [loadingModel, setLoadingModel] = useState(false);
  const [predicting, setPredicting] = useState(false);
  const [prediction, setPrediction] = useState<PredictionResult | null>(null);

  const loadModel = async () => {
    if (modelRef.current && classNamesRef.current.length > 0) return;

    setLoadingModel(true);

    try {
      await tf.ready();

      console.log("Loading model from:", MODEL_URL);

      const modelResponse = await fetch(MODEL_URL);
      if (!modelResponse.ok) {
        throw new Error(`model.json not found. Status: ${modelResponse.status}`);
      }

      const classResponse = await fetch(CLASS_NAMES_URL);
      if (!classResponse.ok) {
        throw new Error(
          `class_names.json not found. Status: ${classResponse.status}`
        );
      }

      const loadedModel = await tf.loadLayersModel(MODEL_URL);
      const classes: string[] = await classResponse.json();

      if (!Array.isArray(classes) || classes.length === 0) {
        throw new Error("class_names.json is empty or invalid.");
      }

      modelRef.current = loadedModel;
      classNamesRef.current = classes;

      console.log("Model loaded successfully.");
      console.log("Input shape:", loadedModel.inputs[0].shape);
      console.log("Output shape:", loadedModel.outputs[0].shape);
      console.log("Classes:", classes);
    } catch (error) {
      console.error("Model loading error:", error);
      alert("Failed to load model. Check console.");
    } finally {
      setLoadingModel(false);
    }
  };

  const predictImage = async (imageBase64: string) => {
    await loadModel();

    if (!modelRef.current) {
      throw new Error("Model is not loaded.");
    }

    const classes = classNamesRef.current;

    if (classes.length === 0) {
      throw new Error("Class names are not loaded.");
    }

    const img = new Image();
    img.src = imageBase64;

    await new Promise<void>((resolve, reject) => {
      img.onload = () => resolve();
      img.onerror = () => reject(new Error("Failed to load image."));
    });

    const inputTensor = tf.tidy(() =>
      tf.browser
        .fromPixels(img)
        .resizeBilinear([224, 224])
        .toFloat()
        .div(tf.scalar(127.5))
        .sub(tf.scalar(1))
        .expandDims(0)
    );

    const outputTensor = modelRef.current.predict(inputTensor) as tf.Tensor;
    const scores = Array.from(await outputTensor.data());

    inputTensor.dispose();
    outputTensor.dispose();

    const maxScore = Math.max(...scores);
    const maxIndex = scores.indexOf(maxScore);

    return {
      label: classes[maxIndex] ?? "Unknown",
      confidence: maxScore,
    };
  };

  const handleFileChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;

    const reader = new FileReader();

    reader.onload = () => {
      setImageSrc(reader.result as string);
      setCroppedImage(null);
      setPrediction(null);
    };

    reader.readAsDataURL(file);
    event.target.value = "";
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

    setCroppedImage(canvas.toDataURL("image/jpeg", 0.95));
    setPrediction(null);
  };

  const handleUseImage = async () => {
    if (!croppedImage) {
      alert("Please crop the prescription first.");
      return;
    }

    try {
      setPredicting(true);
      const result = await predictImage(croppedImage);
      setPrediction(result);

      console.log("Prediction:", result);
    } catch (error) {
      console.error("Prediction error:", error);
      alert("Prediction failed. Check console.");
    } finally {
      setPredicting(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center px-4">
      <div
        onClick={() => {
          if (!predicting && !loadingModel) onClose();
        }}
        className="absolute inset-0 bg-black/50 backdrop-blur-sm"
      />

      <div className="relative w-full max-w-md rounded-3xl bg-white p-5 shadow-2xl">
        <button
          onClick={onClose}
          disabled={predicting || loadingModel}
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

            <input
              ref={cameraInputRef}
              type="file"
              accept="image/*"
              capture="environment"
              className="hidden"
              onChange={handleFileChange}
            />

            <input
              ref={galleryInputRef}
              type="file"
              accept="image/*"
              className="hidden"
              onChange={handleFileChange}
            />

            <div className="w-full space-y-3">
              <button
                onClick={() => cameraInputRef.current?.click()}
                className="flex w-full items-center justify-center gap-2 rounded-xl bg-sky-500 py-3 font-semibold text-white"
              >
                <Camera className="h-5 w-5" />
                Take Photo
              </button>

              <button
                onClick={() => galleryInputRef.current?.click()}
                className="flex w-full items-center justify-center gap-2 rounded-xl bg-slate-100 py-3 font-semibold text-slate-700"
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
                    onClick={() => {
                      setImageSrc(null);
                      setCroppedImage(null);
                      setPrediction(null);
                    }}
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

                {prediction && (
                  <div className="mt-4 rounded-2xl border border-emerald-200 bg-emerald-50 p-4">
                    <p className="text-sm text-emerald-700">Detected</p>
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
                    onClick={() => {
                      setCroppedImage(null);
                      setPrediction(null);
                    }}
                    disabled={predicting || loadingModel}
                    className="w-full rounded-xl bg-slate-100 py-3 font-semibold text-slate-700 disabled:cursor-not-allowed disabled:opacity-60"
                  >
                    Re-crop
                  </button>

                  <button
                    onClick={handleUseImage}
                    disabled={predicting || loadingModel}
                    className="flex w-full items-center justify-center gap-2 rounded-xl bg-sky-500 py-3 font-semibold text-white disabled:cursor-not-allowed disabled:opacity-60"
                  >
                    {predicting || loadingModel ? (
                      <>
                        <LoaderCircle className="h-5 w-5 animate-spin" />
                        Detecting...
                      </>
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
    </div>
  );
}