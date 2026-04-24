import { useEffect, useState } from "react";
import UploadModal from "./UploadModal";
import { useNavigate } from "react-router-dom";
import {
  Calendar,
  Clock,
  FileText,
  Plus,
  Info,
  LoaderCircle,
} from "lucide-react";
import { supabase } from "../utils/supabase";

type Profile = {
  full_name: string;
};

type Prescription = {
  id: string;
  user_id: string;
  medication_name: string;
  dosage: string | null;
  image_url: string | null;
  created_at: string;
};

export default function Dashboard() {
  const navigate = useNavigate();

  const [openModal, setOpenModal] = useState(false);
  const [profile, setProfile] = useState<Profile | null>(null);
  const [prescriptions, setPrescriptions] = useState<Prescription[]>([]);
  const [loading, setLoading] = useState(true);

  const totalScans = prescriptions.length;
  const latestScan = prescriptions[0]?.created_at;

  const getInitials = (name: string) =>
    name
      .split(" ")
      .map((n) => n[0])
      .join("")
      .toUpperCase()
      .slice(0, 2);

  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    const now = new Date();

    const diffTime = Math.abs(now.getTime() - date.getTime());
    const diffDays = Math.floor(diffTime / (1000 * 60 * 60 * 24));

    if (diffDays === 0) return "Today";
    if (diffDays === 1) return "Yesterday";
    if (diffDays < 7) return `${diffDays} days ago`;

    return date.toLocaleDateString("en-US", {
      month: "short",
      day: "numeric",
      year: "numeric",
    });
  };

  const loadDashboardData = async () => {
    try {
      setLoading(true);

      const {
        data: { user },
        error: userError,
      } = await supabase.auth.getUser();

      if (userError) throw userError;

      if (!user) {
        navigate("/", { replace: true });
        return;
      }

      const { data: profileData, error: profileError } = await supabase
        .from("profiles")
        .select("full_name")
        .eq("id", user.id)
        .single();

      if (profileError) throw profileError;

      setProfile(profileData);

      const { data: prescriptionData, error: prescriptionError } =
        await supabase
          .from("prescriptions")
          .select("id, user_id, medication_name, dosage, image_url, created_at")
          .eq("user_id", user.id)
          .order("created_at", { ascending: false });

      if (prescriptionError) throw prescriptionError;

      setPrescriptions(prescriptionData || []);
    } catch (error) {
      console.error("Dashboard fetch error:", error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadDashboardData();
  }, []);

  const displayName = profile?.full_name || "User";

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 via-sky-50 to-blue-50 pb-28">
      <header className="sticky top-0 z-20 border-b border-white/60 bg-white/70 px-5 py-5 backdrop-blur-xl">
        <div className="mx-auto flex max-w-md items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-gradient-to-br from-sky-500 to-blue-600 shadow-lg shadow-sky-500/25">
              <span className="font-bold text-white">
                {getInitials(displayName)}
              </span>
            </div>

            <div>
              <p className="text-sm text-slate-500">Welcome back,</p>
              <h1 className="text-lg font-bold text-slate-900">
                {displayName}
              </h1>
            </div>
          </div>

          <button
            onClick={() => navigate("/about")}
            className="rounded-2xl bg-white p-3 shadow-sm active:scale-95"
          >
            <Info className="h-5 w-5 text-slate-700" />
          </button>
        </div>
      </header>

      <main className="mx-auto max-w-md px-5 pt-5">
        {loading ? (
          <div className="flex min-h-[60vh] flex-col items-center justify-center">
            <LoaderCircle className="mb-3 h-9 w-9 animate-spin text-sky-600" />
            <p className="font-semibold text-slate-600">
              Loading dashboard...
            </p>
          </div>
        ) : (
          <>
            <section className="mb-5 rounded-[28px] bg-gradient-to-br from-sky-500 to-blue-600 p-6 shadow-xl shadow-sky-500/25">
              <div className="flex items-center justify-between text-white">
                <div>
                  <p className="mb-1 text-sm text-sky-100">
                    Total Prescriptions
                  </p>
                  <h2 className="text-4xl font-black">{totalScans}</h2>
                </div>

                <div className="flex h-16 w-16 items-center justify-center rounded-2xl bg-white/20 backdrop-blur-md">
                  <FileText className="h-8 w-8 text-white" />
                </div>
              </div>
            </section>

            <section className="mb-7 grid grid-cols-2 gap-3">
              <div className="rounded-3xl border border-slate-200 bg-white p-4 shadow-sm">
                <div className="mb-3 flex h-10 w-10 items-center justify-center rounded-2xl bg-sky-100">
                  <FileText className="h-5 w-5 text-sky-600" />
                </div>
                <p className="text-sm text-slate-500">Records</p>
                <h3 className="text-2xl font-black text-slate-900">
                  {totalScans}
                </h3>
              </div>

              <div className="rounded-3xl border border-slate-200 bg-white p-4 shadow-sm">
                <div className="mb-3 flex h-10 w-10 items-center justify-center rounded-2xl bg-sky-100">
                  <Clock className="h-5 w-5 text-sky-600" />
                </div>
                <p className="text-sm text-slate-500">Latest Scan</p>
                <h3 className="text-xl font-black text-slate-900">
                  {latestScan ? formatDate(latestScan) : "None"}
                </h3>
              </div>
            </section>

            <section>
              <div className="mb-4 flex items-center justify-between">
                <h2 className="text-xl font-black text-slate-900">
                  Recent Scans
                </h2>
                <div className="flex items-center gap-1 text-sm text-slate-500">
                  <Clock className="h-4 w-4" />
                  Latest first
                </div>
              </div>

              {prescriptions.length === 0 ? (
                <div className="rounded-3xl border border-slate-200 bg-white p-8 text-center shadow-sm">
                  <div className="mx-auto mb-5 flex h-20 w-20 items-center justify-center rounded-3xl bg-gradient-to-br from-slate-100 to-slate-200">
                    <FileText className="h-10 w-10 text-slate-400" />
                  </div>

                  <h3 className="mb-2 text-lg font-bold text-slate-900">
                    No prescriptions yet
                  </h3>

                  <p className="mb-6 text-sm leading-6 text-slate-500">
                    You have no scanned prescriptions. Tap the plus button to
                    scan or upload your first prescription.
                  </p>

                  <button
                    onClick={() => setOpenModal(true)}
                    className="inline-flex items-center gap-2 rounded-2xl bg-gradient-to-r from-sky-500 to-blue-600 px-5 py-3 font-semibold text-white shadow-lg shadow-sky-500/30"
                  >
                    <Plus className="h-5 w-5" />
                    Add Prescription
                  </button>
                </div>
              ) : (
                <div className="space-y-4">
                  {prescriptions.map((item) => (
                    <button
                      onClick={() => navigate(`/prescription/${item.id}`)}
                      key={item.id}
                      className="w-full rounded-3xl border border-slate-200 bg-white p-4 text-left shadow-sm transition active:scale-[0.98]"
                    >
                      <div className="flex items-start gap-4">
                        <div className="flex h-12 w-12 shrink-0 items-center justify-center overflow-hidden rounded-2xl bg-gradient-to-br from-sky-100 to-blue-100">
                          {item.image_url ? (
                            <img
                              src={item.image_url}
                              alt={item.medication_name}
                              className="h-full w-full object-cover"
                            />
                          ) : (
                            <FileText className="h-6 w-6 text-sky-600" />
                          )}
                        </div>

                        <div className="min-w-0 flex-1">
                          <h3 className="mb-1 truncate font-bold text-slate-900">
                            {item.medication_name}
                          </h3>

                          <p className="mb-3 text-sm text-slate-500">
                            {item.dosage || "No dosage provided"}
                          </p>

                          <div className="flex items-center gap-1.5 text-sm text-slate-400">
                            <Calendar className="h-4 w-4" />
                            {formatDate(item.created_at)}
                          </div>
                        </div>
                      </div>
                    </button>
                  ))}
                </div>
              )}
            </section>
          </>
        )}
      </main>

      <button
        onClick={() => setOpenModal(true)}
        className="fixed bottom-7 right-6 z-30 flex h-16 w-16 items-center justify-center rounded-2xl bg-gradient-to-br from-sky-500 to-blue-600 text-white shadow-xl shadow-sky-500/40 active:scale-95"
      >
        <Plus className="h-8 w-8" />
      </button>

      {openModal && (
        <UploadModal
          onClose={() => {
            setOpenModal(false);
            loadDashboardData();
          }}
        />
      )}
    </div>
  );
}