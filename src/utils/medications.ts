import AmoxicillinImg from "../assets/medications/amoxicillin.webp";
import AtorvastatinImg from "../assets/medications/atorvastatin.webp";
import AzithromycinImg from "../assets/medications/azithromycin.png";
import BuscopanImg from "../assets/medications/buscopan.webp";
import CefalexineImg from "../assets/medications/cefalexine.webp";
import CefiximeImg from "../assets/medications/cefixime.webp";
import ClindamycinImg from "../assets/medications/clindamycin.png";
import DicycloverineImg from "../assets/medications/dicycloverine.jpg";
import FeboxostatImg from "../assets/medications/febuxostat.jpg";
import KetoconazoleImg from "../assets/medications/ketoconazole.webp";
import LosartanImg from "../assets/medications/losartan.webp";
import MefenamicAcidImg from "../assets/medications/mefenamic acid.webp";
import MontelukastImg from "../assets/medications/montelukast.webp";
import OmeprazoleImg from "../assets/medications/omeprazole.webp";
import ParacetamolImg from "../assets/medications/paracetamol.png";
import PropylthiouracilImg from "../assets/medications/propylthiouracil.webp";
import RosuvastatinImg from "../assets/medications/rosuvastatin.webp";
import SitagliptinImg from "../assets/medications/staglipin.webp";
import StugeronImg from "../assets/medications/stugeron.jpg";
import TamsulosinImg from "../assets/medications/tamsulosin.jpg";




export const medications = [
  {
    medication_name: "Amoxicillin",
    dosage: "250mg, 500mg capsules or suspension",
    description:
      "Amoxicillin is a broad-spectrum penicillin-type antibiotic used to treat a wide variety of bacterial infections including respiratory tract infections, urinary tract infections, skin infections, and ear infections.",
    instructions:
      "Take exactly as prescribed by your doctor, usually every 8 hours. It can be taken with or without food, but taking it with food may reduce stomach upset.",
    guidelines:
      "Complete the full course of treatment even if symptoms improve early. Do not skip doses. Avoid self-medication and misuse to prevent antibiotic resistance.",
    medical_disclaimer:
      "This medication should only be used under medical supervision. Misuse can lead to antibiotic resistance or allergic reactions.",
    image_url: AmoxicillinImg,
  },

  {
    medication_name: "Atorvastatin",
    dosage: "10mg, 20mg, 40mg, 80mg tablets",
    description:
      "Atorvastatin is used to lower cholesterol levels and reduce the risk of heart disease, stroke, and heart attack by inhibiting cholesterol production in the liver.",
    instructions:
      "Take once daily at the same time each day, with or without food. Follow your doctor's dosage instructions carefully.",
    guidelines:
      "Maintain a healthy diet and lifestyle while taking this medication. Avoid excessive alcohol consumption.",
    medical_disclaimer:
      "Regular monitoring of liver function and cholesterol levels is required. Consult your doctor before stopping.",
    image_url: AtorvastatinImg,
  },

  {
    medication_name: "Azithromycin",
    dosage: "250mg, 500mg tablets",
    description:
      "Azithromycin is a macrolide antibiotic used to treat infections such as pneumonia, bronchitis, and sexually transmitted infections.",
    instructions:
      "Take once daily, usually for 3–5 days. Follow the exact schedule prescribed.",
    guidelines:
      "Take on an empty stomach if possible. Do not skip doses.",
    medical_disclaimer:
      "Improper use may lead to resistance or incomplete treatment.",
    image_url: AzithromycinImg,
  },

  {
    medication_name: "Buscopan",
    dosage: "10mg tablets",
    description:
      "Buscopan (Hyoscine Butylbromide) is used to relieve stomach cramps, abdominal pain, and spasms in the digestive system.",
    instructions:
      "Take as needed for pain, usually up to 3–4 times daily.",
    guidelines:
      "Avoid exceeding recommended dosage. Not recommended for long-term use.",
    medical_disclaimer:
      "Consult your doctor if pain persists or worsens.",
    image_url: BuscopanImg,
  },

  {
    medication_name: "Cefalexine Syrup",
    dosage: "125mg/5ml, 250mg/5ml",
    description:
      "Cefalexine is a cephalosporin antibiotic used to treat bacterial infections such as throat infections, skin infections, and urinary tract infections.",
    instructions:
      "Shake well before use. Take as prescribed, usually every 6–12 hours.",
    guidelines:
      "Complete the full course of treatment.",
    medical_disclaimer:
      "Use only under medical supervision.",
    image_url: CefalexineImg,
  },

  {
    medication_name: "Cefixime",
    dosage: "200mg, 400mg tablets",
    description:
      "Cefixime is used to treat bacterial infections such as bronchitis, gonorrhea, and ear infections.",
    instructions:
      "Take once or twice daily as prescribed.",
    guidelines:
      "Take at the same time each day for best results.",
    medical_disclaimer:
      "Consult a doctor before use.",
    image_url: CefiximeImg,
  },

  {
    medication_name: "Clindamycin",
    dosage: "150mg, 300mg capsules",
    description:
      "Clindamycin is used to treat serious bacterial infections including infections of the lungs, skin, and blood.",
    instructions:
      "Take with a full glass of water to avoid throat irritation.",
    guidelines:
      "Follow the prescribed schedule strictly.",
    medical_disclaimer:
      "May cause severe diarrhea; consult doctor if symptoms occur.",
    image_url: ClindamycinImg,
  },

  {
    medication_name: "Dicycloverine",
    dosage: "10mg, 20mg tablets",
    description:
      "Used to treat irritable bowel syndrome by reducing muscle spasms in the digestive tract.",
    instructions:
      "Take before meals as prescribed.",
    guidelines:
      "Avoid driving if drowsiness occurs.",
    medical_disclaimer:
      "Consult doctor before prolonged use.",
    image_url: DicycloverineImg,
  },

  {
    medication_name: "Febuxostat",
    dosage: "40mg, 80mg tablets",
    description:
      "Used to treat gout by reducing uric acid levels in the body.",
    instructions:
      "Take once daily.",
    guidelines:
      "Regular blood tests may be required.",
    medical_disclaimer:
      "Not recommended for patients with heart disease without supervision.",
    image_url: FeboxostatImg,
  },

  {
    medication_name: "Ketoconazole",
    dosage: "200mg tablets",
    description:
      "Antifungal medication used to treat fungal infections of the skin and scalp.",
    instructions:
      "Take with food to improve absorption.",
    guidelines:
      "Avoid alcohol while taking this medication.",
    medical_disclaimer:
      "May affect liver function; consult doctor.",
    image_url: KetoconazoleImg,
  },

  {
    medication_name: "Losartan",
    dosage: "50mg, 100mg tablets",
    description:
      "Used to treat high blood pressure and protect the kidneys from damage due to diabetes.",
    instructions:
      "Take once daily.",
    guidelines:
      "Monitor blood pressure regularly.",
    medical_disclaimer:
      "Consult doctor before stopping.",
    image_url: LosartanImg,
  },

  {
    medication_name: "Mefenamic Acid",
    dosage: "500mg capsules",
    description:
      "Non-steroidal anti-inflammatory drug used to relieve mild to moderate pain.",
    instructions:
      "Take after meals.",
    guidelines:
      "Do not exceed recommended dose.",
    medical_disclaimer:
      "May cause stomach irritation.",
    image_url: MefenamicAcidImg,
  },

  {
    medication_name: "Montelukast + Levocetirizine",
    dosage: "10mg/5mg tablets",
    description:
      "Combination used to treat allergies and asthma symptoms.",
    instructions:
      "Take once daily at night.",
    guidelines:
      "Avoid alcohol.",
    medical_disclaimer:
      "Consult doctor for long-term use.",
    image_url: MontelukastImg,
  },

  {
    medication_name: "Omeprazole",
    dosage: "20mg, 40mg capsules",
    description:
      "Used to treat acid reflux, GERD, and stomach ulcers.",
    instructions:
      "Take before meals.",
    guidelines:
      "Do not crush capsules.",
    medical_disclaimer:
      "Long-term use requires supervision.",
    image_url: OmeprazoleImg,
  },

  {
    medication_name: "Paracetamol",
    dosage: "500mg tablets",
    description:
      "Used for fever and mild pain relief.",
    instructions:
      "Take every 4–6 hours as needed.",
    guidelines:
      "Do not exceed 4g per day.",
    medical_disclaimer:
      "Overdose can cause liver damage.",
    image_url: ParacetamolImg,
  },

  {
    medication_name: "Propylthiouracil",
    dosage: "50mg tablets",
    description:
      "Used to treat hyperthyroidism.",
    instructions:
      "Take multiple times daily as prescribed.",
    guidelines:
      "Regular thyroid monitoring required.",
    medical_disclaimer:
      "Use only under strict medical supervision.",
    image_url: PropylthiouracilImg,
  },

  {
    medication_name: "Rosuvastatin + Ezetimibe",
    dosage: "10mg/10mg tablets",
    description:
      "Combination drug used to lower cholesterol levels.",
    instructions:
      "Take once daily.",
    guidelines:
      "Maintain diet control.",
    medical_disclaimer:
      "Consult doctor regularly.",
    image_url: RosuvastatinImg,
  },

  {
    medication_name: "Sitagliptin",
    dosage: "50mg, 100mg tablets",
    description:
      "Used to control blood sugar in type 2 diabetes.",
    instructions:
      "Take once daily.",
    guidelines:
      "Monitor blood sugar regularly.",
    medical_disclaimer:
      "Consult doctor before use.",
    image_url: SitagliptinImg,
  },

  {
    medication_name: "Stugeron",
    dosage: "25mg, 50mg tablets",
    description:
      "Used for vertigo and motion sickness.",
    instructions:
      "Take before travel.",
    guidelines:
      "May cause drowsiness.",
    medical_disclaimer:
      "Avoid driving after taking.",
    image_url: StugeronImg,
  },

  {
    medication_name: "Tamsulosin",
    dosage: "0.4mg capsules or 400mcg capsules",
    description:
      "Used to treat symptoms of enlarged prostate (BPH).",
    instructions:
      "Take once daily after the same meal.",
    guidelines:
      "Do not crush capsules.",
    medical_disclaimer:
      "May cause dizziness or fainting.",
    image_url: TamsulosinImg,
  },
];