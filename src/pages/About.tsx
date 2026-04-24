import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import {
  ArrowLeft,
  Users,
  HelpCircle,
  AlertTriangle,
  Microscope,
} from "lucide-react";
import { supabase } from "../utils/supabase";
import { researchStudy } from "../utils/researchTeam";

export default function About() {
  const navigate = useNavigate();
  const [showHelp, setShowHelp] = useState(false);
  const [showDisclaimer, setShowDisclaimer] = useState(false);

  useEffect(() => {
    const loadProfile = async () => {
      const {
        data: { user },
      } = await supabase.auth.getUser();

      if (!user) return;

    };

    loadProfile();
  }, []);

  const getInitials = (name: string) => {
    return name
      .split(" ")
      .map((n) => n[0])
      .join("")
      .toUpperCase()
      .slice(0, 2);
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 via-sky-50 to-blue-50">
      {/* Header */}
      <div className="sticky top-0 z-10 flex items-center border-b border-slate-200/60 bg-white/80 px-4 py-4 backdrop-blur-md">
        <button
          onClick={() => navigate(-1)}
          className="-ml-2 rounded-xl p-2 transition-colors hover:bg-slate-100 active:bg-slate-200"
        >
          <ArrowLeft className="h-6 w-6 text-slate-700" />
        </button>

        <h2 className="ml-3 text-lg font-bold text-slate-900">About</h2>
      </div>

      <div className="mx-auto max-w-md space-y-6 px-6 pb-10 pt-6">
        {/* App Info */}
        <div className="rounded-3xl bg-gradient-to-br from-sky-500 to-blue-600 p-6 shadow-xl shadow-sky-500/20">
          <div className="mb-4 flex items-center">
            <div className="mr-4 flex h-14 w-14 items-center justify-center rounded-2xl bg-white/20 backdrop-blur-sm">
              <Microscope className="h-7 w-7 text-white" />
            </div>

            <div>
              <h3 className="text-xl font-black text-white">RxReader</h3>
              <p className="text-sm text-sky-100">Version 1.0.0</p>
            </div>
          </div>

          <p className="leading-relaxed text-white/90">
            AI-powered handwritten prescription recognition system that converts
            medical prescriptions into digital, structured data for research,
            tracking, and documentation.
          </p>
        </div>

        {/* Research Study */}
        <div>
          <h3 className="mb-4 px-1 text-sm uppercase tracking-wide text-slate-500">
            Research Study
          </h3>

          <div className="rounded-3xl border border-slate-200/60 bg-white p-6 shadow-sm">
            <h4 className="mb-2 text-lg font-bold text-slate-900">
              {researchStudy.title}
            </h4>

            <p className="mb-6 leading-relaxed text-slate-600">
              {researchStudy.subtitle}
            </p>

            <div className="border-t border-slate-100 pt-4">
              <div className="mb-3 flex items-center">
                <Users className="mr-2 h-5 w-5 text-sky-600" />
                <h5 className="font-bold text-slate-700">Research Team</h5>
              </div>

              <div className="space-y-2">
                {researchStudy.members.map((member: string) => (
                  <div key={member} className="flex items-center gap-3 p-2">
                    <div className="flex h-9 w-9 flex-shrink-0 items-center justify-center rounded-full bg-gradient-to-br from-sky-400 to-blue-500 text-xs font-bold text-white shadow-md">
                      {getInitials(member)}
                    </div>

                    <span className="text-slate-700">{member}</span>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>

        {/* Information */}
        <div>
          <h3 className="mb-4 px-1 text-sm uppercase tracking-wide text-slate-500">
            Information
          </h3>

          <div className="overflow-hidden rounded-3xl border border-slate-200/60 bg-white shadow-sm divide-y divide-slate-100">
            <button
              onClick={() => setShowHelp(true)}
              className="flex w-full items-center px-6 py-5 transition-colors hover:bg-slate-50 active:bg-slate-100"
            >
              <div className="mr-4 flex h-12 w-12 items-center justify-center rounded-2xl bg-gradient-to-br from-emerald-100 to-teal-100">
                <HelpCircle className="h-6 w-6 text-emerald-600" />
              </div>

              <div className="flex-1 text-left">
                <p className="font-semibold text-slate-900">How to Use</p>
                <p className="text-sm text-slate-500">
                  App instructions and guide
                </p>
              </div>
            </button>

            <button
              onClick={() => setShowDisclaimer(true)}
              className="flex w-full items-center px-6 py-5 transition-colors hover:bg-slate-50 active:bg-slate-100"
            >
              <div className="mr-4 flex h-12 w-12 items-center justify-center rounded-2xl bg-gradient-to-br from-amber-100 to-orange-100">
                <AlertTriangle className="h-6 w-6 text-amber-600" />
              </div>

              <div className="flex-1 text-left">
                <p className="font-semibold text-slate-900">
                  Medical Disclaimer
                </p>
                <p className="text-sm text-slate-500">
                  Important safety information
                </p>
              </div>
            </button>
          </div>
        </div>
      </div>

      {/* Help Modal */}
      {showHelp && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 px-6 backdrop-blur-sm">
          <div className="max-h-[80vh] w-full max-w-sm overflow-y-auto rounded-3xl bg-white p-6 shadow-2xl">
            <div className="mx-auto mb-5 flex h-16 w-16 items-center justify-center rounded-2xl bg-gradient-to-br from-emerald-500 to-teal-500 shadow-lg">
              <HelpCircle className="h-8 w-8 text-white" />
            </div>

            <h3 className="mb-4 text-center text-lg font-bold text-slate-900">
              How to Use RxReader
            </h3>

            <div className="mb-6 space-y-5">
              {[
                {
                  title: "Scan Prescription",
                  desc: "Tap the plus (+) button to scan or upload a prescription image.",
                },
                {
                  title: "Crop Image",
                  desc: "Crop the image to include only the prescription area for better recognition.",
                },
                {
                  title: "AI Processing",
                  desc: "The AI processes the cropped image and extracts medication details.",
                },
                {
                  title: "View Records",
                  desc: "Access scanned prescriptions from the dashboard and open each record for details.",
                },
              ].map((item, index) => (
                <div key={item.title}>
                  <h4 className="mb-2 flex items-center font-bold text-slate-900">
                    <span className="mr-2 flex h-6 w-6 flex-shrink-0 items-center justify-center rounded-full bg-sky-500 text-sm text-white">
                      {index + 1}
                    </span>
                    {item.title}
                  </h4>
                  <p className="ml-8 text-sm leading-relaxed text-slate-600">
                    {item.desc}
                  </p>
                </div>
              ))}
            </div>

            <div className="mb-6 rounded-2xl border border-sky-100 bg-sky-50 p-4">
              <p className="text-sm text-sky-900">
                <strong>Tip:</strong> Use good lighting and make sure the
                prescription is clear before scanning.
              </p>
            </div>

            <button
              onClick={() => setShowHelp(false)}
              className="w-full rounded-2xl bg-gradient-to-r from-emerald-500 to-teal-500 px-6 py-3.5 text-white shadow-lg shadow-emerald-500/30"
            >
              Got it
            </button>
          </div>
        </div>
      )}

      {/* Disclaimer Modal */}
      {showDisclaimer && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 px-6 backdrop-blur-sm">
          <div className="max-h-[80vh] w-full max-w-sm overflow-y-auto rounded-3xl bg-white p-6 shadow-2xl">
            <div className="mx-auto mb-5 flex h-16 w-16 items-center justify-center rounded-2xl bg-gradient-to-br from-amber-500 to-orange-500 shadow-lg">
              <AlertTriangle className="h-8 w-8 text-white" />
            </div>

            <h3 className="mb-4 text-center text-lg font-bold text-slate-900">
              Medical Disclaimer
            </h3>

            <div className="mb-6 space-y-4 leading-relaxed text-slate-600">
              <p>
                RxReader is developed for{" "}
                <strong>academic and research purposes only</strong>. It is not
                intended to replace professional medical advice, diagnosis, or
                treatment.
              </p>

              <p>
                Extracted information may contain inaccuracies due to handwriting
                variations, image quality, or model limitations.
              </p>

              <p>
                Always verify prescription details with a licensed healthcare
                professional before taking any medication.
              </p>

              <div className="mt-5 rounded-2xl border border-red-100 bg-red-50 p-4">
                <p className="text-sm text-red-900">
                  <strong>Warning:</strong> Incorrect interpretation of
                  prescriptions may lead to serious health risks.
                </p>
              </div>
            </div>
          </div>
        </div>
      )}

  
    </div>
  );
}