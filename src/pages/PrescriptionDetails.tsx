import { useEffect, useState } from "react";
import { useNavigate, useParams } from "react-router-dom";
import {
  ArrowLeft,
  Pill,
  Activity,
  FileText,
  Trash2,
  Calendar,
  LoaderCircle,
  ShieldAlert,
  BookOpen,
  ClipboardList,
  ImageIcon,
  Percent,
  Clock,
  Camera,
  AlertCircle,
} from "lucide-react";
import { supabase } from "../utils/supabase";
import { medications } from "../utils/medications";

type Prescription = {
  id: string;
  user_id: string;
  medication_name: string;
  image_url: string | null;
  confidence: number | null;
  created_at: string;
};

export default function PrescriptionDetails() {
  const { id } = useParams();
  const navigate = useNavigate();

  const [prescription, setPrescription] = useState<Prescription | null>(null);
  const [loading, setLoading] = useState(true);
  const [deleting, setDeleting] = useState(false);
  const [showDeleteModal, setShowDeleteModal] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  const medication = medications.find(
    (med) =>
      med.medication_name.toLowerCase() ===
      prescription?.medication_name.toLowerCase()
  );

  const formatDate = (dateString: string) =>
    new Date(dateString).toLocaleDateString("en-US", {
      weekday: "long",
      month: "long",
      day: "numeric",
      year: "numeric",
    });

  const formatTime = (dateString: string) =>
    new Date(dateString).toLocaleTimeString("en-US", {
      hour: "numeric",
      minute: "2-digit",
    });

  const loadPrescription = async () => {
    if (!id) return;

    try {
      setLoading(true);

      const {
        data: { user },
      } = await supabase.auth.getUser();

      if (!user) {
        navigate("/");
        return;
      }

      const { data, error } = await supabase
        .from("prescriptions")
        .select("id, user_id, medication_name, image_url, confidence, created_at")
        .eq("id", id)
        .eq("user_id", user.id)
        .single();

      if (error) throw error;

      setPrescription(data);
    } catch (err) {
      console.error(err);
      setErrorMessage("Failed to load prescription.");
    } finally {
      setLoading(false);
    }
  };

  const handleDelete = async () => {
    if (!prescription) return;

    try {
      setDeleting(true);

      const { error } = await supabase
        .from("prescriptions")
        .delete()
        .eq("id", prescription.id);

      if (error) throw error;

      navigate("/dashboard");
    } catch (err) {
      console.error(err);
      alert("Failed to delete prescription.");
    } finally {
      setDeleting(false);
      setShowDeleteModal(false);
    }
  };

  useEffect(() => {
    loadPrescription();
  }, [id]);

  if (loading) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-slate-50">
        <LoaderCircle className="h-10 w-10 animate-spin text-sky-600" />
      </div>
    );
  }

  if (!prescription || errorMessage) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-slate-50 text-center">
        <div className="rounded-3xl bg-white p-8 shadow-lg">
          <AlertCircle className="mx-auto mb-4 h-12 w-12 text-slate-300" />
          <p className="mb-6 text-slate-500">Prescription not found</p>
          <button
            onClick={() => navigate("/dashboard")}
            className="rounded-2xl bg-gradient-to-r from-sky-500 to-blue-600 px-6 py-3 font-bold text-white shadow-lg shadow-sky-500/30"
          >
            Go Back
          </button>
        </div>
      </div>
    );
  }

  if (!medication) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-slate-50">
        <div className="rounded-3xl bg-white p-8 text-center shadow-lg">
          <Pill className="mx-auto mb-4 h-12 w-12 text-slate-300" />
          <p className="text-slate-500">No medication data found</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-slate-50 pb-8">
      <div className="sticky top-0 z-50 flex items-center justify-between bg-white/80 p-4 shadow-sm backdrop-blur-xl">
        <button
          onClick={() => navigate(-1)}
          className="rounded-2xl p-2 transition-colors hover:bg-slate-100"
        >
          <ArrowLeft className="h-6 w-6 text-slate-700" />
        </button>

        <h2 className="text-lg font-bold text-slate-800">
          Prescription Details
        </h2>

        <button
          onClick={() => setShowDeleteModal(true)}
          disabled={deleting}
          className="rounded-2xl p-2 transition-colors hover:bg-red-50 disabled:opacity-50"
        >
          {deleting ? (
            <LoaderCircle className="h-6 w-6 animate-spin text-red-500" />
          ) : (
            <Trash2 className="h-6 w-6 text-red-500" />
          )}
        </button>
      </div>

      <div className="mx-auto max-w-md space-y-4 p-4">
        <div className="relative overflow-hidden rounded-[32px] bg-white shadow-lg">
          <div className="relative h-[240px]">
            {prescription.image_url ? (
              <img
                src={prescription.image_url}
                alt="Captured prescription"
                className="h-full w-full object-cover"
              />
            ) : (
              <div className="flex h-full flex-col items-center justify-center bg-gradient-to-br from-slate-100 to-slate-200">
                <ImageIcon className="h-16 w-16 text-slate-300" />
                <p className="mt-2 text-sm text-slate-400">
                  No image captured
                </p>
              </div>
            )}

            <div className="absolute inset-0 bg-gradient-to-t from-black/70 via-black/20 to-transparent" />

            <div className="absolute bottom-4 left-5 right-5">
              <div className="flex items-center gap-2 text-white/80">
                <Camera className="h-4 w-4" />
                <span className="text-xs font-medium uppercase tracking-wider">
                  Captured
                </span>
              </div>

              <h1 className="mt-1 text-2xl font-black leading-tight text-white">
                {prescription.medication_name}
              </h1>
            </div>
          </div>

          <div className="flex items-center justify-between px-5 py-4">
            <div className="flex items-center gap-3">
              <div className="rounded-xl bg-sky-50 p-2">
                <Percent className="h-4 w-4 text-sky-600" />
              </div>
              <div>
                <p className="text-xs text-slate-400">AI Confidence</p>
                <p className="text-sm font-bold text-slate-800">
                  {((prescription.confidence ?? 0) * 100).toFixed(1)}%
                </p>
              </div>
            </div>

            <div className="flex items-center gap-3">
              <div className="rounded-xl bg-green-50 p-2">
                <Clock className="h-4 w-4 text-green-600" />
              </div>
              <div className="text-right">
                <p className="text-xs text-slate-400">Scanned</p>
                <p className="text-sm font-bold text-slate-800">
                  {formatTime(prescription.created_at)}
                </p>
              </div>
            </div>
          </div>
        </div>

        <div className="rounded-[32px] bg-white p-5 shadow-lg">
          <div className="mb-4 flex items-center gap-3">
            <div className="rounded-xl bg-gradient-to-br from-sky-500 to-blue-600 p-2.5">
              <Pill className="h-5 w-5 text-white" />
            </div>
            <h3 className="font-bold text-slate-800">Medication Image</h3>
          </div>

          <div className="flex justify-center rounded-2xl bg-slate-50 p-6">
            <img
              src={medication.image_url}
              alt={medication.medication_name}
              className="max-h-[180px] object-contain drop-shadow-lg"
            />
          </div>
        </div>

        <div className="rounded-[32px] bg-white p-5 shadow-lg">
          <div className="flex items-center gap-3">
            <div className="rounded-xl bg-gradient-to-br from-violet-500 to-purple-600 p-2.5">
              <Calendar className="h-5 w-5 text-white" />
            </div>
            <div>
              <p className="text-xs text-slate-400">Date Captured</p>
              <p className="font-bold text-slate-800">
                {formatDate(prescription.created_at)}
              </p>
            </div>
          </div>
        </div>

        <DetailCard
          icon={<Activity className="h-5 w-5 text-white" />}
          iconBg="from-emerald-500 to-teal-600"
          label="Dosage"
          value={medication.dosage}
        />

        <DetailCard
          icon={<BookOpen className="h-5 w-5 text-white" />}
          iconBg="from-amber-500 to-orange-600"
          label="Description"
          value={medication.description}
        />

        <DetailCard
          icon={<ClipboardList className="h-5 w-5 text-white" />}
          iconBg="from-rose-500 to-pink-600"
          label="Instructions"
          value={medication.instructions}
        />

        <DetailCard
          icon={<FileText className="h-5 w-5 text-white" />}
          iconBg="from-indigo-500 to-blue-600"
          label="Guidelines"
          value={medication.guidelines}
        />

        <div className="rounded-[32px] border border-red-200 bg-red-50/80 p-5 backdrop-blur-sm">
          <div className="mb-3 flex items-center gap-3">
            <div className="rounded-xl bg-red-100 p-2.5">
              <ShieldAlert className="h-5 w-5 text-red-600" />
            </div>
            <h3 className="font-bold text-red-900">Medical Disclaimer</h3>
          </div>

          <p className="text-sm leading-relaxed text-red-700">
            {medication.medical_disclaimer}
          </p>
        </div>
      </div>

      {showDeleteModal && (
        <DeleteConfirmModal
          deleting={deleting}
          onCancel={() => setShowDeleteModal(false)}
          onConfirm={handleDelete}
        />
      )}
    </div>
  );
}

function DetailCard({
  icon,
  iconBg,
  label,
  value,
}: {
  icon: React.ReactNode;
  iconBg: string;
  label: string;
  value: string;
}) {
  return (
    <div className="rounded-[32px] bg-white p-5 shadow-lg transition-shadow hover:shadow-xl">
      <div className="flex items-start gap-4">
        <div
          className={`shrink-0 rounded-xl bg-gradient-to-br ${iconBg} p-2.5 shadow-lg`}
        >
          {icon}
        </div>

        <div className="min-w-0 flex-1">
          <p className="mb-1 text-xs font-medium uppercase tracking-wider text-slate-400">
            {label}
          </p>
          <p className="text-[15px] font-semibold leading-relaxed text-slate-800">
            {value}
          </p>
        </div>
      </div>
    </div>
  );
}

function DeleteConfirmModal({
  deleting,
  onCancel,
  onConfirm,
}: {
  deleting: boolean;
  onCancel: () => void;
  onConfirm: () => void;
}) {
  return (
    <div className="fixed inset-0 z-[100] flex items-center justify-center px-5">
      <div
        onClick={!deleting ? onCancel : undefined}
        className="absolute inset-0 bg-black/60 backdrop-blur-sm"
      />

      <div className="relative w-full max-w-sm rounded-[32px] bg-white p-6 text-center shadow-2xl">
        <div className="mx-auto mb-4 flex h-16 w-16 items-center justify-center rounded-3xl bg-red-100">
          <Trash2 className="h-8 w-8 text-red-600" />
        </div>

        <h2 className="text-xl font-black text-slate-900">
          Delete Prescription?
        </h2>

        <p className="mt-2 text-sm leading-6 text-slate-500">
          This record will be removed from your prescription history. This action
          cannot be undone.
        </p>

        <div className="mt-6 grid grid-cols-2 gap-3">
          <button
            onClick={onCancel}
            disabled={deleting}
            className="rounded-2xl bg-slate-100 py-3 font-bold text-slate-700 disabled:opacity-50"
          >
            Cancel
          </button>

          <button
            onClick={onConfirm}
            disabled={deleting}
            className="flex items-center justify-center gap-2 rounded-2xl bg-red-600 py-3 font-bold text-white shadow-lg shadow-red-500/25 disabled:opacity-50"
          >
            {deleting ? (
              <>
                <LoaderCircle className="h-5 w-5 animate-spin" />
                Deleting
              </>
            ) : (
              "Delete"
            )}
          </button>
        </div>
      </div>
    </div>
  );
}