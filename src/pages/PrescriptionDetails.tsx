import { useNavigate, useParams } from "react-router-dom";
import { ArrowLeft, Pill, Activity, FileText, Trash2, Calendar } from "lucide-react";

const dummyPrescriptions = [
  {
    id: "1",
    drugName: "Amoxicillin",
    dosage: "500mg capsule",
    instructions: "Take 1 capsule 3 times a day after meals.",
    date: "2026-04-24",
    imageUrl: "",
  },
  {
    id: "2",
    drugName: "Paracetamol",
    dosage: "500mg tablet",
    instructions: "Take 1 tablet every 6 hours if needed for fever or pain.",
    date: "2026-04-23",
    imageUrl: "",
  },
  {
    id: "3",
    drugName: "Losartan",
    dosage: "50mg tablet",
    instructions: "Take 1 tablet once daily or as prescribed.",
    date: "2026-04-21",
    imageUrl: "",
  },
  {
    id: "4",
    drugName: "Omeprazole",
    dosage: "20mg capsule",
    instructions: "Take 1 capsule before breakfast.",
    date: "2026-04-20",
    imageUrl: "",
  },
];

export default function PrescriptionDetails() {
  const { id } = useParams();
  const navigate = useNavigate();

  const prescription = dummyPrescriptions.find((item) => item.id === id);

  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    return date.toLocaleDateString("en-US", {
      weekday: "long",
      month: "long",
      day: "numeric",
      year: "numeric",
    });
  };

  if (!prescription) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-slate-50 px-6">
        <div className="text-center">
          <h1 className="mb-2 text-xl font-bold text-slate-900">
            Prescription not found
          </h1>
          <button
            onClick={() => navigate("/dashboard")}
            className="rounded-xl bg-sky-500 px-5 py-3 font-semibold text-white"
          >
            Back to Dashboard
          </button>
        </div>
      </div>
    );
  }

  const handleDelete = () => {
    alert("Delete clicked. Dummy only.");
    navigate("/dashboard");
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 to-sky-50/30">
      <div className="sticky top-0 z-10 flex items-center justify-between border-b border-slate-200/60 bg-white/80 px-4 py-4 backdrop-blur-md">
        <div className="flex items-center">
          <button
            onClick={() => navigate(-1)}
            className="-ml-2 rounded-xl p-2 transition-colors hover:bg-slate-100 active:bg-slate-200"
          >
            <ArrowLeft className="h-6 w-6 text-slate-700" />
          </button>

          <h2 className="ml-3 font-bold text-slate-900">
            Prescription Details
          </h2>
        </div>

        <button
          onClick={handleDelete}
          className="-mr-2 rounded-xl p-2 transition-colors hover:bg-red-50 active:bg-red-100"
        >
          <Trash2 className="h-5 w-5 text-red-600" />
        </button>
      </div>

      <div className="space-y-5 px-6 pb-6 pt-6">
        <div className="rounded-3xl border border-slate-200/60 bg-white p-5 shadow-sm">
          <div className="flex items-center text-slate-600">
            <div className="mr-3 flex h-10 w-10 items-center justify-center rounded-2xl bg-gradient-to-br from-sky-100 to-blue-100">
              <Calendar className="h-5 w-5 text-sky-600" />
            </div>

            <div>
              <p className="mb-0.5 text-sm text-slate-500">Scanned on</p>
              <p className="font-semibold text-slate-900">
                {formatDate(prescription.date)}
              </p>
            </div>
          </div>
        </div>

        {prescription.imageUrl && (
          <div className="overflow-hidden rounded-3xl border border-slate-200/60 bg-white shadow-sm">
            <img
              src={prescription.imageUrl}
              alt="Prescription scan"
              className="h-auto w-full"
            />
          </div>
        )}

        <div className="pb-2 pt-3">
          <h3 className="text-lg font-bold text-slate-900">
            Extracted Information
          </h3>
          <p className="mt-1 text-sm text-slate-600">
            AI-powered prescription analysis
          </p>
        </div>

        <div className="rounded-3xl border border-slate-200/60 bg-white p-6 shadow-sm">
          <div className="flex items-start">
            <div className="mr-4 flex h-12 w-12 flex-shrink-0 items-center justify-center rounded-2xl bg-gradient-to-br from-sky-100 to-blue-100">
              <Pill className="h-6 w-6 text-sky-600" />
            </div>

            <div className="flex-1">
              <p className="mb-2 text-sm text-slate-500">Drug Name</p>
              <p className="text-lg font-bold text-slate-900">
                {prescription.drugName}
              </p>
            </div>
          </div>
        </div>

        <div className="rounded-3xl border border-slate-200/60 bg-white p-6 shadow-sm">
          <div className="flex items-start">
            <div className="mr-4 flex h-12 w-12 flex-shrink-0 items-center justify-center rounded-2xl bg-gradient-to-br from-emerald-100 to-green-100">
              <Activity className="h-6 w-6 text-emerald-600" />
            </div>

            <div className="flex-1">
              <p className="mb-2 text-sm text-slate-500">Dosage</p>
              <p className="font-semibold text-slate-900">
                {prescription.dosage}
              </p>
            </div>
          </div>
        </div>

        <div className="rounded-3xl border border-slate-200/60 bg-white p-6 shadow-sm">
          <div className="flex items-start">
            <div className="mr-4 flex h-12 w-12 flex-shrink-0 items-center justify-center rounded-2xl bg-gradient-to-br from-purple-100 to-violet-100">
              <FileText className="h-6 w-6 text-purple-600" />
            </div>

            <div className="flex-1">
              <p className="mb-2 text-sm text-slate-500">Instructions</p>
              <p className="leading-relaxed text-slate-900">
                {prescription.instructions}
              </p>
            </div>
          </div>
        </div>

        <div className="mt-6 rounded-3xl border border-amber-200/60 bg-gradient-to-br from-amber-50 to-orange-50 p-5">
          <div className="flex items-start space-x-3">
            <div className="flex h-10 w-10 flex-shrink-0 items-center justify-center rounded-xl bg-amber-500">
              <span className="text-lg text-white">⚠️</span>
            </div>

            <div>
              <h4 className="mb-1 font-bold text-amber-900">
                Medical Disclaimer
              </h4>
              <p className="text-sm leading-relaxed text-amber-800">
                This information is extracted from a scanned prescription and is
                for reference purposes only. Always consult your healthcare
                provider for medical advice.
              </p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}