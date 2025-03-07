"use client";

import StreamingAvatar, {
  AvatarQuality,
  StreamingEvents,
  TaskMode,
  TaskType,
  VoiceEmotion,
} from "@heygen/streaming-avatar";
import {
  Box,
  Step,
  StepLabel,
  Stepper,
  Typography,
  Button,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
} from "@mui/material";
import dynamic from "next/dynamic";
import Image from "next/image";
import { useEffect, useRef, useState } from "react";
import "react-toastify/dist/ReactToastify.css";
// import { ToastContainer, toast } from "react-toastify"; // İsterseniz Toast ekleyebilirsiniz.

import { EMBED_INTRO_STEPS, READY_STATE } from "../../lib/Constants";
import { DifyFlows } from "../../lib/dify/DifyClient";
import { extractTagContent } from "../../lib/utils/PureString";
import { showToast } from "../../lib/utils/PureToast";
import { fetchToken } from "../../service/HeygenService";
import { createLog } from "../../service/MeetingLogService";
import { fetchMeetingQuestionByMeetingInvintationId } from "../../service/MeetingQuestionService";
import { createMeetingRecord } from "../../service/MeetingRecordService";
import { fetchMeetingByMeetingInvintationId } from "../../service/MeetingService";
import { grey } from "@mui/material/colors";

// 4 adım
const MUI_STEPS = [
  "Kamera & Mikrofon Testi",
  "Hız Testi",
  "Onay",
  "Hazırlık",
];

// Dinamik bileşenler
const WebcamCapture = dynamic(
  () => import("../../components/webcam/WebcamCapture"),
  { ssr: false }
);
const AudioRecorder = dynamic(
  () => import("../../components/audio/transaction/AudioRecorder"),
  { ssr: false }
);

// Dify
const difyInstance = new DifyFlows("/api/dify/");

// Sol taraf bileşeni
import LeftSide from "../intro/leftSide/leftSide";

/** Stepper Bileşeni */
function AIAssistantStepper({ activeStep, setActiveStep, steps }) {
  const handleStepClick = (index) => {
    setActiveStep(index);
  };

  return (
    <Box sx={{ width: "100%", textAlign: "center", mt: 4 }}>
      <Stepper activeStep={activeStep} alternativeLabel>
        {steps.map((label, index) => (
          <Step key={index} style={{ cursor: "pointer" }}>
            <StepLabel
              onClick={() => handleStepClick(index)}
              sx={{
                cursor: "pointer",
                "& .MuiStepLabel-label": { transition: "color 0.3s" },
                "& .MuiStepLabel-label.Mui-active": { color: "primary.main" },
              }}
            >
              {label}
            </StepLabel>
          </Step>
        ))}
      </Stepper>
    </Box>
  );
}

export default function EmbedMeet() {
  const avatar = useRef(null);
  const micRef = useRef(null);
  const mediaStream = useRef(null);

  // State
  const [meeting, setMeeting] = useState(null);
  const [step, setStep] = useState(0);
  const [stream, setStream] = useState(null);
  const [question, setQuestion] = useState(null);
  const [heygenToken, setHeygenToken] = useState(null);
  const [startVideoRecord, setStartVideoRecord] = useState(false);
  const [stopVideoRecord, setStopVideoRecord] = useState(false);

  // Sol taraf slider index
  const [slideIndex, setSlideIndex] = useState(0);

  // Intro step
  const [introStep, setIntroStep] = useState(EMBED_INTRO_STEPS.INITIALIZE);
  // MUI Stepper
  const [activeStep, setActiveStep] = useState(0);

  // Modal
  const [openAydinlatma, setOpenAydinlatma] = useState(false);
  const [openRiza, setOpenRiza] = useState(false);

  // Checkboxes
  const [checkedAydinlatma, setCheckedAydinlatma] = useState(false);
  const [checkedRiza, setCheckedRiza] = useState(false);

  // Modal aç/kapa
  const handleOpenAydinlatma = (event) => {
    event.preventDefault();
    setOpenAydinlatma(true);
  };
  const handleCloseAydinlatma = () => {
    setOpenAydinlatma(false);
  };

  const handleOpenRiza = (event) => {
    event.preventDefault();
    setOpenRiza(true);
  };
  const handleCloseRiza = () => {
    setOpenRiza(false);
  };

  // Step ilerletme
  const handleMUIStepNext = () => {
    if (activeStep < MUI_STEPS.length - 1) {
      setActiveStep((prev) => prev + 1);
    }
  };

  // Adım fonksiyonları
  const handleCameraMicrophoneConfirm = () => {
    handleMUIStepNext();
    setIntroStep(EMBED_INTRO_STEPS.NETWORKSPEED);
  };
  const handleSpeedTestConfirm = () => {
    handleMUIStepNext();
    setIntroStep(EMBED_INTRO_STEPS.AGREEMENT);
  };
  const handleAgreementConfirm = () => {
    handleMUIStepNext();
    setIntroStep(EMBED_INTRO_STEPS.WEBCAM_AND_MIC);
  };
  const handleGoLastStep = () => {
    handleMUIStepNext();
    setIntroStep(EMBED_INTRO_STEPS.TOAST_SCREEN);
    setTimeout(() => {
      setIntroStep(EMBED_INTRO_STEPS.MEET);
    }, 5000);
  };

  return (
    <>
      {/* ADIMLAR */}
      {introStep === EMBED_INTRO_STEPS.INITIALIZE && (
        <div className="container">
          {/* SOL TARAF */}
          <LeftSide slideIndex={slideIndex} setSlideIndex={setSlideIndex} />

          {/* SAĞ TARAF */}
          <div className="right-column">
            <h3>Yapay zeka asistanımız görüşme yapmak için sizi bekliyor!</h3>
            <AIAssistantStepper
              activeStep={activeStep}
              setActiveStep={setActiveStep}
              steps={MUI_STEPS}
            />
            <div className="test-section-title">Kamera & Mikrofon Testi</div>
            <div
              style={{
                display: "block",
                justifyContent: "center",
                marginTop: 10,
                marginBottom: 20,
                backgroundColor: "#f0f0f0",
                width: "100%",
              }}
            >
              <WebcamCapture
                question={question}
                stopRecording={stopVideoRecord}
                startRecording={startVideoRecord}
              />
            </div>
            <div className="form-container">
              <div className="form-group">
                <label htmlFor="micSelect">Ses Kayıt Cihazı</label>
                <select id="micSelect">
                  <option>Default - Mikrofon (Realtek(R))</option>
                  <option>Mikrofon 1</option>
                  <option>Mikrofon 2</option>
                </select>
              </div>
              <div className="form-group">
                <label htmlFor="camSelect">Görüntü Kayıt Cihazı</label>
                <select id="camSelect">
                  <option>USB webcam (0408:2094)</option>
                  <option>Kamera 1</option>
                  <option>Kamera 2</option>
                </select>
              </div>
              <button className="confirm-button" onClick={handleCameraMicrophoneConfirm}>
                Sesiniz ve görüntünüz algılandı, devam edebilirsiniz
              </button>
            </div>
          </div>
        </div>
      )}

      {introStep === EMBED_INTRO_STEPS.NETWORKSPEED && (
        <div className="container">
          <LeftSide slideIndex={slideIndex} setSlideIndex={setSlideIndex} />
          <div className="right-column">
            <AIAssistantStepper activeStep={activeStep} setActiveStep={setActiveStep} steps={MUI_STEPS} />
            <div className="test-section-title">Hız Testi</div>
            <div
              style={{
                display: "block",
                justifyContent: "center",
                marginTop: 10,
                marginBottom: 20,
                width: "100%",
              }}
            >
              <div className="speed-container">
                <div className="speed-group">
                  <p className="speed-label">Download</p>
                  <p className="speed-value">-- Mbps</p>
                </div>
                <div className="speed-group">
                  <p className="speed-label">Upload</p>
                  <p className="speed-value">-- Mbps</p>
                </div>
              </div>
              <button className="confirm-button" onClick={handleSpeedTestConfirm}>
                Hız testini başlat
              </button>
            </div>
          </div>
        </div>
      )}

      {introStep === EMBED_INTRO_STEPS.AGREEMENT && (
        <div className="container">
          <LeftSide slideIndex={slideIndex} setSlideIndex={setSlideIndex} />
          <div className="right-column">
            <h3>Yapay zeka asistanımız görüşme yapmak için sizi bekliyor!</h3>
            <AIAssistantStepper activeStep={activeStep} setActiveStep={setActiveStep} steps={MUI_STEPS} />
            <div
              style={{
                display: "block",
                justifyContent: "center",
                marginTop: 10,
                marginBottom: 20,
                width: "100%",
              }}
            >
              <div className="checkbox-container">
                <label className="checkbox-label">
                  <input
                    type="checkbox"
                    checked={checkedAydinlatma}
                    onChange={(e) => setCheckedAydinlatma(e.target.checked)}
                  />
                  <span>
                    <a href="#" onClick={handleOpenAydinlatma} className="blue-text">
                      Aydınlatma Metni
                    </a>
                    'ni okudum, kabul ediyorum.
                  </span>
                </label>
                <label className="checkbox-label">
                  <input
                    type="checkbox"
                    checked={checkedRiza}
                    onChange={(e) => setCheckedRiza(e.target.checked)}
                  />
                  <span>
                    <a href="#" onClick={handleOpenRiza} className="blue-text">
                      Açık Rıza Metni
                    </a>
                    'ni okudum, kabul ediyorum.
                  </span>
                </label>
              </div>
              <button
                className="confirm-button"
                onClick={handleAgreementConfirm}
                disabled={!(checkedAydinlatma && checkedRiza)}
                style={{
                  backgroundColor: !(checkedAydinlatma && checkedRiza)
                    ? "grey"
                    : "#1976d2",
                  color: "white",
                  cursor: !(checkedAydinlatma && checkedRiza)
                    ? "not-allowed"
                    : "pointer",
                }}
              >
                KVKK ve Gizlilik onaylarınız kontrol ediliyor.
              </button>
            </div>
          </div>
        </div>
      )}

      {introStep === EMBED_INTRO_STEPS.WEBCAM_AND_MIC && (
        <div className="container">
          <LeftSide slideIndex={slideIndex} setSlideIndex={setSlideIndex} />
          <div className="right-column">
            <h3>Yapay zeka asistanımız görüşme yapmak için sizi bekliyor!</h3>
            <AIAssistantStepper activeStep={activeStep} setActiveStep={setActiveStep} steps={MUI_STEPS} />
            <div
              style={{
                display: "block",
                justifyContent: "center",
                marginTop: 10,
                marginBottom: 20,
                width: "100%",
              }}
            >
              <div style={{ display: "flex", flexDirection: "column", alignItems: "start", gap: "1rem" }}>
                <div className="mic-text">Görüşmede Mikrofon Kullanımı Hakkında Bilgilendirme</div>
                <img src="/images/how-to-use/video.png" alt="video link" className="mic-image" />
              </div>
              <button className="confirm-button" onClick={handleGoLastStep}>
                Devam
              </button>
            </div>
          </div>
        </div>
      )}

      {introStep === EMBED_INTRO_STEPS.TOAST_SCREEN && (
        <div className="container">
          <LeftSide slideIndex={slideIndex} setSlideIndex={setSlideIndex} />
          <div className="right-column">
            <h3>Yapay zeka asistanımız görüşme yapmak için sizi bekliyor!</h3>
            <AIAssistantStepper activeStep={MUI_STEPS.length} setActiveStep={setActiveStep} steps={MUI_STEPS} />
            <div style={{ marginTop: "1rem" }}>
              <p>Görüşme başlamak üzere, lütfen bekleyiniz...</p>
            </div>
          </div>
        </div>
      )}

      {/* MEET => Boş sayfa, sol taraf dahil hiçbir şey yok */}
      {introStep === EMBED_INTRO_STEPS.MEET && (
        <div
          style={{
            width: "100%",
            height: "100%",
          }}
        >
          {/* Hiçbir şey yok => tamamen boş ekran */}
        </div>
      )}

      {/* Stream (ses/video) */}
      {stream && (
        <div>
          <div
            style={{
              display: "flex",
              justifyContent: "center",
              alignItems: "center",
              overflow: "hidden",
              border: "1px solid white",
              borderRadius: "0.5rem",
              width: "1120px",
              margin: "30px auto 0",
            }}
          >
            <video
              ref={mediaStream}
              autoPlay
              playsInline
              style={{ width: "100%", height: "100%", objectFit: "contain" }}
            />
          </div>
          <div style={{ display: "flex", justifyContent: "center", marginTop: 20 }}>
            <AudioRecorder ref={micRef} onStart={() => {}} onStop={() => {}} />
          </div>
        </div>
      )}

      {/* Aydınlatma Metni Modal */}
      <Dialog
        open={openAydinlatma}
        onClose={handleCloseAydinlatma}
        fullWidth
        maxWidth="sm"
      >
        <DialogTitle>Aydınlatma Metni</DialogTitle>
        <DialogContent dividers>
          <p>Burada Aydınlatma Metni içeriği yer alır. İstediğiniz metni ekleyebilirsiniz.</p>
        </DialogContent>
        <DialogActions>
          <Button onClick={handleCloseAydinlatma}>Kapat</Button>
        </DialogActions>
      </Dialog>

      {/* Açık Rıza Metni Modal */}
      <Dialog
        open={openRiza}
        onClose={handleCloseRiza}
        fullWidth
        maxWidth="sm"
      >
        <DialogTitle>Açık Rıza Metni</DialogTitle>
        <DialogContent dividers>
          <p>Burada Açık Rıza Metni içeriği yer alır. İstediğiniz içeriği ekleyebilirsiniz.</p>
        </DialogContent>
        <DialogActions>
          <Button onClick={handleCloseRiza}>Kapat</Button>
        </DialogActions>
      </Dialog>
    </>
  );
}
