import { useMemo, useState } from "react";
import { useNavigate } from "react-router-dom";
import { ChevronRight, Pill, Users, Microscope } from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";
import landingBg from "../assets/landing_bg.webp";
import { medications } from "../utils/medications";
import { researchStudy } from "../utils/researchTeam";

type OnboardingProps = {
  onComplete?: () => void;
};

export default function Onboarding({ onComplete }: OnboardingProps) {
  const navigate = useNavigate();
  const [currentSlide, setCurrentSlide] = useState(0);
  const [direction, setDirection] = useState(0);

  const isLastSlide = currentSlide === 2;

  const slideVariants = useMemo(
    () => ({
      enter: (dir: number) => ({
        x: dir > 0 ? "100%" : "-100%",
        opacity: 0,
      }),
      center: {
        x: 0,
        opacity: 1,
      },
      exit: (dir: number) => ({
        x: dir > 0 ? "-100%" : "100%",
        opacity: 0,
      }),
    }),
    []
  );

  const handleNext = () => {
    if (!isLastSlide) {
      setDirection(1);
      setCurrentSlide((prev) => prev + 1);
      return;
    }

    localStorage.setItem("rxreader_onboarding_completed", "true");

    if (typeof onComplete === "function") {
      onComplete();
      return;
    }

    navigate("/dashboard", { replace: true });
  };

  return (
    <div
      className="relative min-h-[100dvh] overflow-hidden"
      style={{
        backgroundImage: `url(${landingBg})`,
        backgroundSize: "cover",
        backgroundPosition: "center",
        backgroundRepeat: "no-repeat",
      }}
    >
      <div className="absolute inset-0 bg-slate-950/45" />
      <div className="absolute inset-0 bg-gradient-to-br from-sky-950/30 via-slate-900/20 to-blue-950/40" />

      <div className="relative z-10 flex min-h-[100dvh] flex-col px-4 py-5">
        <div className="flex min-h-0 flex-1 items-center justify-center">
          <div className="flex min-h-0 w-full max-w-md flex-1 flex-col">
            <div className="relative h-[68dvh] min-h-[520px] max-h-[620px] overflow-hidden rounded-[28px] border border-white/20 bg-white/10 shadow-[0_8px_32px_rgba(0,0,0,0.28)] backdrop-blur-2xl">
              <div className="absolute inset-0 bg-white/[0.05]" />
              <div className="absolute inset-x-0 top-0 h-px bg-white/30" />

              <AnimatePresence initial={false} custom={direction} mode="wait">
                {currentSlide === 0 && (
                  <motion.div
                    key="slide-0"
                    custom={direction}
                    variants={slideVariants}
                    initial="enter"
                    animate="center"
                    exit="exit"
                    transition={{ duration: 0.35, ease: [0.4, 0, 0.2, 1] }}
                    className="absolute inset-0"
                  >
                    <div className="flex h-full flex-col items-center justify-center px-5 py-6 text-center">
                      <div className="mb-5 flex h-20 w-20 items-center justify-center rounded-[24px] border border-white/25 bg-gradient-to-br from-sky-400/90 to-blue-500/90 shadow-[0_10px_30px_rgba(14,165,233,0.35)]">
                        <Pill
                          className="h-10 w-10 text-white"
                          strokeWidth={2.5}
                        />
                      </div>

                      <h1 className="mb-3 text-4xl font-black text-white">
                        RxReader
                      </h1>

                      <p className="max-w-sm text-sm leading-7 text-white/85">
                        AI-powered prescription recognition for medical prescriptions
                      </p>

                      <div className="mt-6 w-full max-w-xs space-y-3 rounded-2xl border border-white/15 bg-white/10 p-4 text-left backdrop-blur-xl">
                        <div className="flex items-start gap-3">
                          <div className="mt-2 h-2 w-2 flex-shrink-0 rounded-full bg-sky-300" />
                          <p className="text-sm text-white/90">
                            Instant prescription digitization
                          </p>
                        </div>

                        <div className="flex items-start gap-3">
                          <div className="mt-2 h-2 w-2 flex-shrink-0 rounded-full bg-sky-300" />
                          <p className="text-sm text-white/90">
                            Accurate medication recognition
                          </p>
                        </div>

                        <div className="flex items-start gap-3">
                          <div className="mt-2 h-2 w-2 flex-shrink-0 rounded-full bg-sky-300" />
                          <p className="text-sm text-white/90">
                            Provide information of the medications
                          </p>
                        </div>
                      </div>
                    </div>
                  </motion.div>
                )}

                {currentSlide === 1 && (
                  <motion.div
                    key="slide-1"
                    custom={direction}
                    variants={slideVariants}
                    initial="enter"
                    animate="center"
                    exit="exit"
                    transition={{ duration: 0.35, ease: [0.4, 0, 0.2, 1] }}
                    className="absolute inset-0"
                  >
                    <div className="flex h-full flex-col px-4 py-5">
                      <div className="mb-3 flex flex-col items-center text-center">
                        <div className="mb-3 flex h-16 w-16 items-center justify-center rounded-[22px] border border-white/25 bg-gradient-to-br from-emerald-400/90 to-teal-500/90 shadow-[0_10px_30px_rgba(16,185,129,0.28)]">
                          <Microscope
                            className="h-8 w-8 text-white"
                            strokeWidth={2.5}
                          />
                        </div>

                        <h2 className="mb-2 text-[28px] font-black leading-none text-white">
                          Detectable Medications
                        </h2>

                        <p className="max-w-md text-sm leading-6 text-white/80">
                          Our AI model can recognize these medications from
                          handwritten prescriptions
                        </p>
                      </div>

                      <div className="flex-1 rounded-2xl border border-white/15 bg-white/10 p-3 backdrop-blur-xl">
                        <div className="grid h-full grid-cols-2 gap-2">
                          {medications.slice(0, 10).map((med, index) => {
                            const label =
                              typeof med === "string"
                                ? med
                                : med.name ||
                                  med.label ||
                                  med.medication_name ||
                                  "";

                            return (
                              <motion.div
                                key={label || index}
                                initial={{ opacity: 0, y: 10 }}
                                animate={{ opacity: 1, y: 0 }}
                                transition={{ delay: index * 0.02 }}
                                className="flex min-h-[42px] items-center gap-2 rounded-xl border border-white/12 bg-white/10 px-2.5 py-2 shadow-sm backdrop-blur-md"
                              >
                                <div className="h-1.5 w-1.5 flex-shrink-0 rounded-full bg-sky-300" />
                                <span className="text-[11px] leading-4 text-white/90 sm:text-xs">
                                  {label}
                                </span>
                              </motion.div>
                            );
                          })}
                        </div>
                      </div>
                    </div>
                  </motion.div>
                )}

                {currentSlide === 2 && (
                  <motion.div
                    key="slide-2"
                    custom={direction}
                    variants={slideVariants}
                    initial="enter"
                    animate="center"
                    exit="exit"
                    transition={{ duration: 0.35, ease: [0.4, 0, 0.2, 1] }}
                    className="absolute inset-0"
                  >
                    <div className="flex h-full flex-col px-4 py-5 text-center">
                      <div className="mb-3 flex flex-col items-center">
                        <div className="mb-3 flex h-16 w-16 items-center justify-center rounded-[22px] border border-white/25 bg-gradient-to-br from-violet-400/90 to-purple-500/90 shadow-[0_10px_30px_rgba(139,92,246,0.28)]">
                          <Users
                            className="h-8 w-8 text-white"
                            strokeWidth={2.5}
                          />
                        </div>

                        <h2 className="mb-2 text-[28px] font-black leading-none text-white">
                          Research Team
                        </h2>

                        <p className="mb-2 max-w-md text-base font-semibold leading-6 text-sky-200">
                          {researchStudy.title}
                        </p>

                        <p className="max-w-md text-sm leading-5 text-white/80">
                          {researchStudy.subtitle}
                        </p>
                      </div>

                      <div className="flex-1 rounded-2xl border border-white/15 bg-white/10 p-3 text-left backdrop-blur-xl">
                        <h3 className="mb-3 text-xs uppercase tracking-[0.2em] text-white/60">
                          Research Members
                        </h3>

                        <div className="space-y-2">
                          {researchStudy.members.slice(0, 5).map(
                            (member: string, index: number) => (
                              <motion.div
                                key={member}
                                initial={{ opacity: 0, x: -20 }}
                                animate={{ opacity: 1, x: 0 }}
                                transition={{ delay: index * 0.08 }}
                                className="flex items-center gap-3 rounded-xl border border-white/10 bg-white/10 px-3 py-2.5"
                              >
                                <div className="flex h-9 w-9 flex-shrink-0 items-center justify-center rounded-full bg-gradient-to-br from-violet-400 to-purple-500 text-[10px] font-semibold text-white shadow-md">
                                  {member
                                    .split(" ")
                                    .map((n) => n[0])
                                    .join("")}
                                </div>

                                <span className="text-sm text-white/90">
                                  {member}
                                </span>
                              </motion.div>
                            )
                          )}
                        </div>
                      </div>
                    </div>
                  </motion.div>
                )}
              </AnimatePresence>
            </div>

            <div className="shrink-0 px-1 pt-3">
              <div className="mb-3 flex justify-center gap-2">
                {[0, 1, 2].map((index) => (
                  <div
                    key={index}
                    className={`h-2 rounded-full transition-all duration-300 ${
                      currentSlide === index
                        ? "w-8 bg-gradient-to-r from-sky-400 to-blue-400"
                        : "w-2 bg-white/35"
                    }`}
                  />
                ))}
              </div>

              <button
                onClick={handleNext}
                className="mx-auto flex w-full items-center justify-center gap-2 rounded-2xl border border-white/20 bg-white/15 py-3.5 text-white shadow-[0_8px_24px_rgba(0,0,0,0.18)] backdrop-blur-xl transition-all duration-300 hover:bg-white/20 active:scale-[0.98]"
              >
                <span className="text-base font-semibold">
                  {isLastSlide ? "Start" : "Next"}
                </span>
                {!isLastSlide && <ChevronRight className="h-5 w-5" />}
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}