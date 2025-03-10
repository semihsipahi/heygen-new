'use client';

import { extractTagContent } from '@/app/lib/utils/PureString';
import { showToast } from '@/app/lib/utils/PureToast';
import { fetchToken } from '@/app/service/HeygenService';
import { completeMeetingInvintation } from '@/app/service/MeetingInvintationService';
import { createLog } from '@/app/service/MeetingLogService';
import { fetchMeetingQuestionByMeetingInvintationId } from '@/app/service/MeetingQuestionService';
import { createMeetingRecord } from '@/app/service/MeetingRecordService';
import { fetchMeetingByMeetingInvintationId } from '@/app/service/MeetingService';
import StreamingAvatar, {
  AvatarQuality,
  StreamingEvents,
  TaskMode,
  TaskType,
  VoiceEmotion,
} from '@heygen/streaming-avatar';
import {
  Button,
  Dialog,
  DialogActions,
  DialogContent,
  DialogTitle,
} from '@mui/material';
import dynamic from 'next/dynamic';
import { useEffect, useRef, useState } from 'react';
import 'react-toastify/dist/ReactToastify.css';
import { EMBED_INTRO_STEPS, READY_STATE } from '../../lib/Constants';
import { DifyFlows } from '../../lib/dify/DifyClient';
import LeftSide from '../intro/leftSide/leftSide';
import AIAssistantStepper from '../intro/stepper/AIAssistantStepper';

const MUI_STEPS = ['Kamera & Mikrofon Testi', 'Hız Testi', 'Onay', 'Hazırlık'];

const WebcamCapture = dynamic(
  () => import('../../components/webcam/WebcamCapture'),
  { ssr: false }
);

const AudioRecorder = dynamic(
  () => import('../../components/audio/transaction/AudioRecorder'),
  { ssr: false }
);

// Dify
const difyInstance = new DifyFlows('/api/dify/');

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
  const [slideIndex, setSlideIndex] = useState(0);
  const [introStep, setIntroStep] = useState(EMBED_INTRO_STEPS.INITIALIZE);
  const [activeStep, setActiveStep] = useState(0);
  const [openAydinlatma, setOpenAydinlatma] = useState(false);
  const [openRiza, setOpenRiza] = useState(false);
  const [checkedAydinlatma, setCheckedAydinlatma] = useState(false);
  const [checkedRiza, setCheckedRiza] = useState(false);

  useEffect(() => {
    const initializeData = async () => {
      try {
        const token = await fetchToken();
        if (token) {
          console.log('Token Received Success', token);
          setHeygenToken(token);
        }
      } catch (err) {
        console.error('Token Received Error:', err);
      }

      try {
        const meetingResponse = await fetchMeetingByMeetingInvintationId();
        if (meetingResponse) {
          setMeeting(meetingResponse);
        }
      } catch (err) {
        console.error('Meeting fetch error:', err);
      }
    };

    (async () => {
      await initializeData();
    })();
  }, []);

  useEffect(() => {
    if (stream && mediaStream.current) {
      mediaStream.current.srcObject = stream;
      mediaStream.current.onloadedmetadata = () => {
        mediaStream.current.play();
      };
    }
  }, [stream]);

  useEffect(() => {
    if (meeting === null) return;
    if (introStep === EMBED_INTRO_STEPS.TOAST_SCREEN) {
      startSession();
    }
  }, [introStep]);

  const updateMicButton = (text, disabled, bgColor, cursor) => {
    const btn = micRef.current;
    if (btn) {
      const textSpan = btn.querySelector('.btn-text');
      if (textSpan) {
        textSpan.textContent = text;
      }
      btn.disabled = disabled;
      btn.style.backgroundColor = bgColor;
      btn.style.cursor = cursor;
    }
  };

  const startSession = async () => {
    try {
      avatar.current = new StreamingAvatar({ token: heygenToken });

      avatar.current.on(StreamingEvents.STREAM_READY, (event) => {
        setStream(event.detail);
      });

      avatar.current.on(StreamingEvents.AVATAR_START_TALKING, () => {
        updateMicButton('Lütfen Bekleyiniz', true, 'gray', 'not-allowed');
      });

      avatar.current.on(StreamingEvents.AVATAR_STOP_TALKING, () => {
        updateMicButton('Konuşmaya Başla', false, 'green', 'pointer');
      });

      avatar.current.on(StreamingEvents.STREAM_DISCONNECTED, () => {
        endSession();
      });

      await avatar.current.createStartAvatar({
        quality: AvatarQuality.High,
        avatarName: 'June_HR_public',
        knowledgeId: '',
        voice: {
          rate: 0.9, // 0.5 ~ 1.5 arası değer
          emotion: VoiceEmotion.SERIOUS,
          speed: 0.1,
        },
        language: 'tr',
        disableIdleTimeout: true,
      });

      // Görüşmeye özel karşılama mesajı
      if (meeting?.welcomingText) {
        await avatar.current.speak({
          text: meeting.welcomingText,
          taskType: TaskType.REPEAT,
          taskMode: TaskMode.SYNC,
        });
      }
    } catch (error) {
      console.error('Error starting avatar session:', error);
    }
  };

  const endSession = async () => {
    await avatar.current?.stopAvatar();
    setStream(null);
  };

  const handleStartRecording = () => {
    showToast('Ses Algılama Devrede');
    if (step !== 0) {
      setStartVideoRecord(true);
      setStopVideoRecord(false);
    }
  };

  const handleStopRecording = async (filteredData) => {
    showToast('Ses Algılama Devre Dışı');
    setStartVideoRecord(false);
    setStopVideoRecord(true);

    // Candidate Preparation Case.
    if (step === 0) {
      const response = await difyInstance.candidatePreparation({
        user_input: filteredData.text,
        user_information: 'Meetgate Test Kullanıcısı',
      });

      const readyState = extractTagContent(
        response?.data?.outputs?.output,
        'ready_state'
      );
      const whenQuestion = extractTagContent(
        response?.data?.outputs?.output,
        'when_question'
      );

      if (readyState === READY_STATE.NOT) {
        const speakInfo = await avatar.current.speak({
          text: whenQuestion,
          taskType: TaskType.REPEAT,
          taskMode: TaskMode.SYNC,
        });
        setTimeout(() => {
          endSession();
        }, speakInfo?.duration_ms);
        return;
      }

      const readyCase = await avatar.current.speak({
        text: 'Harika ... O Halde mülakata başlıyoruz, sorularınızı güncelliyorum...',
        taskType: TaskType.REPEAT,
        taskMode: TaskMode.SYNC,
      });

      setTimeout(async () => {
        await handleNextQuestion();
      }, readyCase?.duration_ms + 2);
      return;
    }

    await createLog({
      value: filteredData?.text,
      questionId: question?.id,
      isChatbot: false,
    });

    const summaryResponse = await difyInstance.answerSummary({
      answer: filteredData?.text,
    });

    if (!summaryResponse) return;

    const summaryText = summaryResponse?.data?.outputs?.text;

    const summarySpeak = await avatar.current.speak({
      text: summaryText,
      taskType: TaskType.REPEAT,
      taskMode: TaskMode.SYNC,
    });

    await createLog({
      value: summaryText,
      questionId: question?.id,
      isChatbot: true,
    });

    setTimeout(async () => {
      const payload = {
        answer: filteredData?.text,
        questionId: question?.id,
        isQuestionPassed: false,
      };

      await createMeetingRecord(payload);

      const tempAnswers = [
        'Soruya verdiğiniz cevabı algıladım, teşekkürler, sorularınızı güncelliyorum.',
        'Bu soruya verdiğiniz cevap için teşekkürler, bu cevabı kayıt ediyor ve sorularınızı güncelliyorum.',
        'Cevabınızı kayıt ettim, teşekkürler, sorularınızı güncelliyorum.',
      ];

      const randomAnswer =
        tempAnswers[Math.floor(Math.random() * tempAnswers.length)];

      const answerSpeak = await avatar.current.speak({
        text: randomAnswer,
        taskType: TaskType.REPEAT,
        taskMode: TaskMode.SYNC,
      });

      setTimeout(() => {
        handleNextQuestion();
      }, answerSpeak.duration_ms + 3);
    }, summarySpeak?.duration_ms);
  };

  const handleNextQuestion = async () => {
    const response = await fetchMeetingQuestionByMeetingInvintationId();
    if (!response) return;

    if (!response?.status) {
      await createLog({
        value: 'Görüşme Tamamlandı',
        questionId: response?.data?.id,
        isChatbot: true,
      });

      const lastSpeak = await avatar.current.speak({
        text: 'Cevaplarınızın tamamını kayıt ettim, mülakatınız tamamlandı, teşekkür ederiz, görüşme ekranını kapatıyorum.',
        taskType: TaskType.REPEAT,
        taskMode: TaskMode.SYNC,
      });

      await completeMeetingInvintation();

      setTimeout(() => {
        endSession();
      }, lastSpeak?.duration_ms);
      return;
    }

    setQuestion(response?.data);

    await createLog({
      value: response?.data?.title,
      questionId: response?.data?.id,
      isChatbot: true,
    });

    await avatar.current.speak({
      text: response?.data?.title,
      taskType: TaskType.REPEAT,
      taskMode: TaskMode.SYNC,
    });

    setStep((prevStep) => prevStep + 1);
  };

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

  const handleMUIStepNext = () => {
    if (activeStep < MUI_STEPS.length - 1) {
      setActiveStep((prev) => prev + 1);
    }
  };

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
    }, 4000);
  };

  return (
    <>
      {/* ADIMLAR */}
      {introStep === EMBED_INTRO_STEPS.INITIALIZE && (
        <div className="container">
          <LeftSide slideIndex={slideIndex} setSlideIndex={setSlideIndex} />
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
                display: 'block',
                justifyContent: 'center',
                marginTop: 10,
                marginBottom: 20,
                backgroundColor: '#f0f0f0',
                width: '100%',
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
              <button
                className="confirm-button"
                onClick={handleCameraMicrophoneConfirm}
              >
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
            <AIAssistantStepper
              activeStep={activeStep}
              setActiveStep={setActiveStep}
              steps={MUI_STEPS}
            />
            <div className="test-section-title">Hız Testi</div>
            <div
              style={{
                display: 'block',
                justifyContent: 'center',
                marginTop: 10,
                marginBottom: 20,
                width: '100%',
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
              <button
                className="confirm-button"
                onClick={handleSpeedTestConfirm}
              >
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
            <AIAssistantStepper
              activeStep={activeStep}
              setActiveStep={setActiveStep}
              steps={MUI_STEPS}
            />
            <div
              style={{
                display: 'block',
                justifyContent: 'center',
                marginTop: 10,
                marginBottom: 20,
                width: '100%',
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
                    <a
                      href="#"
                      onClick={handleOpenAydinlatma}
                      className="blue-text"
                    >
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
                    ? 'grey'
                    : '#1976d2',
                  color: 'white',
                  cursor: !(checkedAydinlatma && checkedRiza)
                    ? 'not-allowed'
                    : 'pointer',
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
            <AIAssistantStepper
              activeStep={activeStep}
              setActiveStep={setActiveStep}
              steps={MUI_STEPS}
            />
            <div
              style={{
                display: 'block',
                justifyContent: 'center',
                marginTop: 10,
                marginBottom: 20,
                width: '100%',
              }}
            >
              <div
                style={{
                  display: 'flex',
                  flexDirection: 'column',
                  alignItems: 'start',
                  gap: '1rem',
                }}
              >
                <div className="mic-text">
                  Görüşmede Mikrofon Kullanımı Hakkında Bilgilendirme
                </div>
                <img
                  src="/images/how-to-use/video.png"
                  alt="video link"
                  className="mic-image"
                />
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
            <AIAssistantStepper
              activeStep={MUI_STEPS.length}
              setActiveStep={setActiveStep}
              steps={MUI_STEPS}
            />
            <div style={{ marginTop: '1rem' }}>
              <p>Görüşme başlamak üzere, lütfen bekleyiniz...</p>
            </div>
          </div>
        </div>
      )}

      {introStep === EMBED_INTRO_STEPS.MEET && (
        <div>
          <div
            style={{ display: 'flex', justifyContent: 'center', marginTop: 10 }}
          >
            <WebcamCapture
              question={question}
              stopRecording={stopVideoRecord}
              startRecording={startVideoRecord}
            />
          </div>

          {stream && (
            <>
              <div
                style={{
                  display: 'flex',
                  justifyContent: 'center',
                  alignItems: 'center',
                  overflow: 'hidden',
                  border: '1px solid white',
                  borderRadius: '0.5rem',
                  width: '1120px',
                  margin: '30px auto 0',
                }}
              >
                <video
                  ref={mediaStream}
                  autoPlay
                  playsInline
                  style={{
                    width: '100%',
                    height: '100%',
                    objectFit: 'contain',
                  }}
                />
              </div>
              <div
                style={{
                  display: 'flex',
                  justifyContent: 'center',
                  marginTop: 20,
                }}
              >
                <AudioRecorder
                  ref={micRef}
                  onStart={handleStartRecording}
                  onStop={handleStopRecording}
                />
              </div>
            </>
          )}
        </div>
      )}

      <Dialog
        open={openAydinlatma}
        onClose={handleCloseAydinlatma}
        fullWidth
        maxWidth="sm"
      >
        <DialogTitle>Aydınlatma Metni</DialogTitle>
        <DialogContent dividers>
          <p>
            Burada Aydınlatma Metni içeriği yer alır. İstediğiniz metni
            ekleyebilirsiniz.
          </p>
        </DialogContent>
        <DialogActions>
          <Button onClick={handleCloseAydinlatma}>Kapat</Button>
        </DialogActions>
      </Dialog>

      <Dialog open={openRiza} onClose={handleCloseRiza} fullWidth maxWidth="sm">
        <DialogTitle>Açık Rıza Metni</DialogTitle>
        <DialogContent dividers>
          <p>
            Burada Açık Rıza Metni içeriği yer alır. İstediğiniz içeriği
            ekleyebilirsiniz.
          </p>
        </DialogContent>
        <DialogActions>
          <Button onClick={handleCloseRiza}>Kapat</Button>
        </DialogActions>
      </Dialog>
    </>
  );
}
