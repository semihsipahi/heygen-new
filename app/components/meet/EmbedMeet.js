'use client';

import StreamingAvatar, {
  AvatarQuality,
  StreamingEvents,
  TaskMode,
  TaskType,
  VoiceEmotion,
} from '@heygen/streaming-avatar';
import { Box } from '@mui/material';
import dynamic from 'next/dynamic';
import Image from 'next/image';
import { useEffect, useRef, useState } from 'react';
import 'react-toastify/dist/ReactToastify.css';
import ChatbotSwiper from '../../components/intro/swiper/ChatBotSwiper';
import { EMBED_INTRO_STEPS, READY_STATE } from '../../lib/Constants';
import { DifyFlows } from '../../lib/dify/DifyClient';
import { extractTagContent } from '../../lib/utils/PureString';
import { showToast } from '../../lib/utils/PureToast';
import { fetchToken } from '../../service/HeygenService';
import { createLog } from '../../service/MeetingLogService';
import { fetchMeetingQuestionByMeetingInvintationId } from '../../service/MeetingQuestionService';
import { createMeetingRecord } from '../../service/MeetingRecordService';
import { fetchMeetingByMeetingInvintationId } from '../../service/MeetingService';

const WebcamCapture = dynamic(
  () => import('../../components/webcam/WebcamCapture'),
  { ssr: false }
);

const AudioRecorder = dynamic(
  () => import('../../components/audio/transaction/AudioRecorder'),
  { ssr: false }
);

const difyInstance = new DifyFlows('/api/dify/');

export default function EmbedMeet() {
  const avatar = useRef(null);
  const micRef = useRef(null);
  const mediaStream = useRef(null);

  const [meeting, setMeeting] = useState(null);
  const [step, setStep] = useState(0);
  const [stream, setStream] = useState(null);
  const [question, setQuestion] = useState(null);
  const [heygenToken, setHeygenToken] = useState(null);
  const [startVideoRecord, setStartVideoRecord] = useState(false);
  const [stopVideoRecord, setStopVideoRecord] = useState(false);
  const [slideIndex, setSlideIndex] = useState(0);
  const [introStep, setIntroStep] = useState(EMBED_INTRO_STEPS.INITIALIZE);

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
    // startSession();
  }, [meeting]);

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
          emotion: VoiceEmotion.EXCITED,
          speed: 0.3,
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
        user_input: filteredData,
        user_information: 'Semih Sipahi',
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
      answer: filteredData,
    });

    if (!summaryResponse) return;

    const summaryText = extractTagContent(
      summaryResponse?.data?.outputs?.text,
      'summary'
    );

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
        'Bu cevabı sevdim, teşekkürler, sorularınızı güncelliyorum.',
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

  return (
    <>
      {introStep === EMBED_INTRO_STEPS.INITIALIZE && (
        <div className="container">
          {/* LEFT SIDE */}
          <div className="left-column">
            <Box
              sx={{
                display: 'flex',
                flexDirection: 'column',
                width: '100%',
                height: '100%',
                backgroundImage: `url(/images/avatars/swiper/swiper_background_${slideIndex}.jpg)`,
                backgroundSize: 'cover',
                backgroundRepeat: 'no-repeat',
                backgroundPosition: 'center',
                alignItems: 'flex-end',
                justifyContent: 'space-between',
              }}
            >
              <Box sx={{ display: 'flex', width: 72, height: 36 }}>
                <Image
                  src="/small/topRight.png"
                  width={36}
                  height={36}
                  alt=""
                />
                <Box sx={{ width: 36, height: 36, backgroundColor: 'white' }} />
              </Box>
              <Box
                sx={{
                  display: 'flex',
                  flex: 1,
                  flexDirection: 'row',
                  width: '100%',
                  position: 'relative',
                }}
              >
                <Box
                  sx={{
                    flex: 1,
                    overflow: 'hidden',
                    position: 'relative',
                    display: 'flex',
                    alignItems: 'center',
                  }}
                >
                  <ChatbotSwiper onSlideChange={setSlideIndex} />
                </Box>
                <Box sx={{ width: 36, backgroundColor: 'white' }} />
              </Box>
              <Box
                sx={{
                  display: 'flex',
                  width: 36,
                  height: 36,
                  backgroundImage: 'url(/small/rightBottom.png)',
                }}
              />
            </Box>
          </div>

          {/* RIGHT SIDE */}
          <div className="right-column">
            <h2>Yapay zeka asistanımız görüşme yapmak için sizi bekliyor!</h2>
            <div className="steps">
              <div className="step active">Görüntü & Ses</div>
              <div className="step">İzinler</div>
              <div className="step">İsim</div>
              <div className="step">Özet</div>
            </div>

            <div className="test-section-title">Kamera & Mikrofon Testi</div>

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

            <div
              style={{
                display: 'flex',
                justifyContent: 'center',
                marginTop: 10,
              }}
            >
              <WebcamCapture
                question={question}
                stopRecording={stopVideoRecord}
                startRecording={startVideoRecord}
              />
            </div>

            <button className="confirm-button">
              Sesinizi ve görüntünüzü onayladı, devam edebilirsiniz
            </button>
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
    </>
  );
}
