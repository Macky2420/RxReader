import { useRef, useState } from "react";
import {
  Button,
  Card,
  Carousel,
  Col,
  Row,
  Space,
  Typography,
} from "antd";
import type { CarouselRef } from "antd/es/carousel";
import {
  ArrowRightOutlined,
  MedicineBoxOutlined,
  ExperimentOutlined,
  TeamOutlined,
} from "@ant-design/icons";
import { useNavigate } from "react-router-dom";

const { Title, Paragraph, Text } = Typography;

const medications: string[] = [
  "Amoxicillin",
  "Atorvastatin",
  "Azithromycin",
  "Buscopan",
  "Cefalexine Syrup",
  "Cefixime",
  "Clindamycin",
  "Dicycloverine",
  "Feboxostat",
  "Ketoconazole",
  "Losartan",
  "Mefenamic Acid",
  "Montelukast + Levocetirizine",
  "Omeprazole",
  "Paracetamol",
  "Propylthiouracil",
  "Rosuvastatin + Ezetimibe",
  "Sitagliptin",
  "Stugeron",
  "Tamsulosin",
];

const researchStudy = {
  title: "RxReader: AI-Powered Prescription Recognition",
  subtitle:
    "Digital Recognition of Handwritten Prescriptions for Medical Research and Documentation",
  members: [
    "Member One",
    "Member Two",
    "Member Three",
    "Member Four",
  ],
};

export default function Onboarding() {
  const navigate = useNavigate();
  const carouselRef = useRef<CarouselRef | null>(null);
  const [currentSlide, setCurrentSlide] = useState<number>(0);

  const isLastSlide = currentSlide === 2;

  const handleNext = () => {
    if (!isLastSlide) {
      carouselRef.current?.next();
      return;
    }

    localStorage.setItem("rxreader_onboarding_completed", "true");
    navigate("/dashboard", { replace: true });
  };

  return (
    <div
      style={{
        minHeight: "100vh",
        display: "flex",
        flexDirection: "column",
        justifyContent: "center",
        padding: 24,
        background:
          "linear-gradient(135deg, #ffffff 0%, #f0f9ff 50%, #e0f2fe 100%)",
      }}
    >
      <div
        style={{
          width: "100%",
          maxWidth: 520,
          margin: "0 auto",
        }}
      >
        <Carousel
          ref={carouselRef}
          dots={false}
          afterChange={(index: number) => setCurrentSlide(index)}
        >
          {/* Slide 1 */}
          <div>
            <Card
              bordered={false}
              style={{
                borderRadius: 24,
                minHeight: 560,
                background: "rgba(255,255,255,0.82)",
                backdropFilter: "blur(10px)",
                boxShadow: "0 12px 30px rgba(0,0,0,0.08)",
              }}
              bodyStyle={{
                padding: 32,
                display: "flex",
                flexDirection: "column",
                justifyContent: "center",
                minHeight: 560,
                textAlign: "center",
              }}
            >
              <Space direction="vertical" size="large">
                <div
                  style={{
                    width: 96,
                    height: 96,
                    margin: "0 auto",
                    borderRadius: 24,
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "center",
                    background:
                      "linear-gradient(135deg, #38bdf8 0%, #2563eb 100%)",
                    boxShadow: "0 12px 24px rgba(37, 99, 235, 0.30)",
                  }}
                >
                  <MedicineBoxOutlined
                    style={{ fontSize: 46, color: "#fff" }}
                  />
                </div>

                <div>
                  <Title
                    level={1}
                    style={{
                      marginBottom: 8,
                      color: "#1677ff",
                    }}
                  >
                    RxReader
                  </Title>

                  <Paragraph
                    style={{
                      fontSize: 17,
                      color: "#475569",
                      maxWidth: 380,
                      margin: "0 auto",
                      lineHeight: 1.7,
                    }}
                  >
                    AI-powered prescription recognition for medical
                    professionals and researchers
                  </Paragraph>
                </div>

                <Card
                  bordered={false}
                  style={{
                    borderRadius: 18,
                    background: "#f8fbff",
                    textAlign: "left",
                  }}
                >
                  <Space direction="vertical" size="middle">
                    <Text style={{ fontSize: 15 }}>
                      ✔ Scan handwritten prescriptions
                    </Text>
                    <Text style={{ fontSize: 15 }}>
                      ✔ Extract recognizable medication names
                    </Text>
                    <Text style={{ fontSize: 15 }}>
                      ✔ Store and review prescription records
                    </Text>
                  </Space>
                </Card>
              </Space>
            </Card>
          </div>

          {/* Slide 2 */}
          <div>
            <Card
              bordered={false}
              style={{
                borderRadius: 24,
                minHeight: 560,
                background: "rgba(255,255,255,0.82)",
                backdropFilter: "blur(10px)",
                boxShadow: "0 12px 30px rgba(0,0,0,0.08)",
              }}
              bodyStyle={{
                padding: 28,
                minHeight: 560,
              }}
            >
              <Space
                direction="vertical"
                size="large"
                style={{ width: "100%", textAlign: "center" }}
              >
                <div
                  style={{
                    width: 88,
                    height: 88,
                    margin: "0 auto",
                    borderRadius: 24,
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "center",
                    background:
                      "linear-gradient(135deg, #34d399 0%, #14b8a6 100%)",
                    boxShadow: "0 12px 24px rgba(20, 184, 166, 0.28)",
                  }}
                >
                  <ExperimentOutlined
                    style={{ fontSize: 42, color: "#fff" }}
                  />
                </div>

                <div>
                  <Title level={2} style={{ marginBottom: 8 }}>
                    Detectable Medications
                  </Title>
                  <Paragraph
                    style={{
                      fontSize: 15,
                      color: "#475569",
                      maxWidth: 420,
                      margin: "0 auto",
                    }}
                  >
                    These are the sample medications currently supported by the
                    model.
                  </Paragraph>
                </div>

                <div
                  style={{
                    maxHeight: 320,
                    overflowY: "auto",
                    paddingRight: 4,
                  }}
                >
                  <Row gutter={[12, 12]}>
                    {medications.map((medication) => (
                      <Col xs={24} sm={12} key={medication}>
                        <Card
                          size="small"
                          bordered={false}
                          style={{
                            borderRadius: 14,
                            background: "#f8fbff",
                            textAlign: "center",
                          }}
                        >
                          <Text style={{ color: "#1677ff", fontWeight: 500 }}>
                            {medication}
                          </Text>
                        </Card>
                      </Col>
                    ))}
                  </Row>
                </div>
              </Space>
            </Card>
          </div>

          {/* Slide 3 */}
          <div>
            <Card
              bordered={false}
              style={{
                borderRadius: 24,
                minHeight: 560,
                background: "rgba(255,255,255,0.82)",
                backdropFilter: "blur(10px)",
                boxShadow: "0 12px 30px rgba(0,0,0,0.08)",
              }}
              bodyStyle={{
                padding: 28,
                minHeight: 560,
              }}
            >
              <Space
                direction="vertical"
                size="large"
                style={{ width: "100%", textAlign: "center" }}
              >
                <div
                  style={{
                    width: 88,
                    height: 88,
                    margin: "0 auto",
                    borderRadius: 24,
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "center",
                    background:
                      "linear-gradient(135deg, #a78bfa 0%, #8b5cf6 100%)",
                    boxShadow: "0 12px 24px rgba(139, 92, 246, 0.28)",
                  }}
                >
                  <TeamOutlined style={{ fontSize: 42, color: "#fff" }} />
                </div>

                <div>
                  <Title level={2} style={{ marginBottom: 8 }}>
                    Research Information
                  </Title>
                  <Paragraph
                    style={{
                      color: "#1677ff",
                      fontSize: 17,
                      fontWeight: 600,
                      marginBottom: 8,
                    }}
                  >
                    {researchStudy.title}
                  </Paragraph>
                  <Paragraph
                    style={{
                      color: "#475569",
                      fontSize: 15,
                      lineHeight: 1.7,
                      maxWidth: 420,
                      margin: "0 auto",
                    }}
                  >
                    {researchStudy.subtitle}
                  </Paragraph>
                </div>

                <Card
                  bordered={false}
                  style={{
                    borderRadius: 18,
                    background: "#faf5ff",
                    textAlign: "left",
                  }}
                >
                  <Space
                    direction="vertical"
                    size="middle"
                    style={{ width: "100%" }}
                  >
                    <Text
                      style={{
                        textTransform: "uppercase",
                        letterSpacing: 1,
                        color: "#6b7280",
                        fontSize: 12,
                      }}
                    >
                      Research Members
                    </Text>

                    {researchStudy.members.map((member) => (
                      <Card
                        key={member}
                        size="small"
                        bordered={false}
                        style={{
                          borderRadius: 14,
                          background: "#ffffff",
                        }}
                      >
                        <Text style={{ fontSize: 15 }}>{member}</Text>
                      </Card>
                    ))}
                  </Space>
                </Card>
              </Space>
            </Card>
          </div>
        </Carousel>

        {/* Dots */}
        <div
          style={{
            display: "flex",
            justifyContent: "center",
            gap: 8,
            marginTop: 18,
            marginBottom: 18,
          }}
        >
          {[0, 1, 2].map((index) => (
            <div
              key={index}
              style={{
                width: currentSlide === index ? 26 : 8,
                height: 8,
                borderRadius: 999,
                background: currentSlide === index ? "#1677ff" : "#d1d5db",
                transition: "all 0.3s ease",
              }}
            />
          ))}
        </div>

        {/* Button */}
        <Button
          type="primary"
          block
          size="large"
          onClick={handleNext}
          icon={!isLastSlide ? <ArrowRightOutlined /> : undefined}
          iconPosition="end"
          style={{
            height: 52,
            borderRadius: 14,
            fontSize: 16,
            fontWeight: 600,
          }}
        >
          {isLastSlide ? "Start" : "Next"}
        </Button>
      </div>
    </div>
  );
}