'use client';

import StreamingAvatar, {
  AvatarQuality,
  StreamingEvents,
  TaskMode,
  TaskType,
  VoiceEmotion,
} from '@heygen/streaming-avatar';
import { Box } from '@mui/material';
import Image from 'next/image';
import { useEffect, useRef, useState } from 'react';
import 'react-toastify/dist/ReactToastify.css';
import AudioRecorder from './components/audio/transaction/audioRecorder';
import WebcamCapture from './components/webcam/webcamCapture';
import { EMBED_INTRO_STEPS, READY_STATE } from './lib/constants';
import { DifyFlows } from './lib/dify/difyClient';
import { extractTagContent } from './lib/utils/pureString';
import { showToast } from './lib/utils/pureToast';
import { fetchToken } from './service/heygenService';
import { createLog } from './service/meetingLogService';
import { fetchMeetingQuestionByMeetingInvintationId } from './service/meetingQuestionService';
import { createMeetingRecord } from './service/meetingRecordService';
import { fetchMeetingByMeetingInvintationId } from './service/meetingService';

const difyInstance = new DifyFlows('/api/dify/');

export default function Home() {
  const avatar = useRef(null);
  const micRef = useRef(null);
  const mediaStream = useRef(null);

  const [step, setStep] = useState(0);
  const [heygenToken, setHeygenToken] = useState(null);
  const [stream, setStream] = useState(null);
  const [meet, setMeet] = useState();
  const [question, setQuestion] = useState();
  const [startVideoRecord, setStartVideoRecord] = useState();
  const [stopVideoRecord, setStopVideoRecord] = useState();

  const [introStep, setIntroStep] = useState(EMBED_INTRO_STEPS.MEET);
  const [slideIndex, setSlideIndex] = useState(0);

  useEffect(() => {
    fetchToken()
      .then((token) => {
        if (token) {
          console.log('Token Received Success', token);
          setHeygenToken(token);
        }
      })
      .catch((err) => console.error('Token Received Error:', err));

    fetchMeetingByMeetingInvintationId().then((response) => {
      if (!response) {
        return;
      }
      setMeet(response);
    });
  }, []);

  useEffect(() => {
    if (heygenToken === null) return;
    //startSession();
  }, [heygenToken]);

  useEffect(() => {
    if (stream && mediaStream.current) {
      mediaStream.current.srcObject = stream;
      mediaStream.current.onloadedmetadata = () => {
        mediaStream.current.play();
      };
    }
  }, [mediaStream, stream]);

  const startSession = async () => {
    try {
      avatar.current = new StreamingAvatar({ token: heygenToken });

      avatar.current.on(StreamingEvents.STREAM_READY, (event) => {
        setStream(event.detail);
      });

      avatar.current.on(StreamingEvents.AVATAR_START_TALKING, (e) => {
        if (micRef) {
          const textSpan = micRef.current.querySelector('.btn-text');

          if (textSpan) {
            textSpan.textContent = 'Lütfen Bekleyiniz';
          }

          micRef.current.disabled = true;
          micRef.current.style.backgroundColor = 'gray';
          micRef.current.style.cursor = 'not-allowed';
        }
      });

      avatar.current.on(StreamingEvents.AVATAR_STOP_TALKING, (e) => {
        if (micRef) {
          const textSpan = micRef.current.querySelector('.btn-text');

          if (textSpan) {
            textSpan.textContent = 'Konuşmaya Başla';
          }

          micRef.current.disabled = false;
          micRef.current.style.backgroundColor = 'green';
          micRef.current.style.cursor = 'pointer';
        }
      });

      avatar.current.on(StreamingEvents.STREAM_DISCONNECTED, () => {
        endSession();
      });

      await avatar.current.createStartAvatar({
        quality: AvatarQuality.High,
        avatarName: 'June_HR_public',
        knowledgeId: '',
        voice: {
          rate: 0.9, // 0.5 ~ 1.5
          emotion: VoiceEmotion.EXCITED,
          speed: 0.6,
        },
        language: 'tr',
        disableIdleTimeout: true,
      });

      // Welcoming
      await avatar.current.speak({
        text: meet?.welcomingText,
        taskType: TaskType.REPEAT,
        taskMode: TaskMode.SYNC,
      });
    } catch (error) {
      console.error('Error starting avatar session:', error);
    }
  };

  const endSession = async () => {
    await avatar.current?.stopAvatar();
    setStream(undefined);
  };

  const onStart = () => {
    showToast('Ses Algılama Devrede');

    // Video Recorder Start.
    if (step !== 0) {
      setStartVideoRecord(true);
      setStopVideoRecord(false);
    }
  };

  const onStop = async (filteredData) => {
    showToast('Ses Algılama Devre Dışı');
    setStartVideoRecord(false);
    setStopVideoRecord(true);

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
        const speak = await avatar.current.speak({
          text: whenQuestion,
          taskType: TaskType.REPEAT,
          taskMode: TaskMode.SYNC,
        });

        setTimeout(() => {
          endSession();
        }, speak?.duration_ms);

        return;
      }

      //TODO : DIFY
      const readyCase = await avatar.current.speak({
        text: 'Harika ... O Halde mülakata başlıyoruz , sorularınızı güncelliyorum...',
        taskType: TaskType.REPEAT,
        taskMode: TaskMode.SYNC,
      });

      setTimeout(async () => {
        await handleNextQuestion();
      }, readyCase?.duration_ms + 2);

      return;
    }

    //CreateLog.
    await createLog({
      value: filteredData?.text,
      questionId: question?.id,
      isChatbot: false,
    });

    const summaryResponse = await difyInstance.answerSummary({
      answer: filteredData,
    });

    if (!summaryResponse) {
      return;
    }

    const summaryCase = extractTagContent(
      summaryResponse?.data?.outputs?.text,
      'summary'
    );

    const summarySpeak = await avatar.current.speak({
      text: summaryCase,
      taskType: TaskType.REPEAT,
      taskMode: TaskMode.SYNC,
    });

    //CreateLog.
    await createLog({
      value: summaryCase,
      questionId: question?.id,
      isChatbot: true,
    });

    setTimeout(async () => {
      const payload = {
        answer: filteredData?.text,
        questionId: question?.id,
        isQuestionPassed: false,
      };

      //Create Record.
      await createMeetingRecord(payload);

      const temp_answers = [
        'Soruya verdiğiniz Cevabınızı algıladım , teşekkürler , bir sonraki soruya geçiyorum',
        'Bu soruya verdiğiniz cevap için teşekkürler , bu vermiş olduğunuz cevabı kayıt ediyor ve bir sonraki soruya geçiyorum',
        '...Bu cevabı sevdim, teşekkürler , bir sonraki soruya geçiyorum',
      ];

      const randomIndex = Math.floor(Math.random() * temp_answers.length);

      const answerCase = await avatar.current.speak({
        text: temp_answers[randomIndex],
        taskType: TaskType.REPEAT,
        taskMode: TaskMode.SYNC,
      });

      setTimeout(() => {
        handleNextQuestion();
      }, answerCase.duration_ms + 3);
    }, summarySpeak?.duration_ms);
  };

  const handleNextQuestion = async () => {
    const response = await fetchMeetingQuestionByMeetingInvintationId();

    if (!response) {
      return;
    }

    if (!response?.status) {
      //CreateLog.
      await createLog({
        value: 'Görüşme Tamamlandı',
        questionId: response?.data?.id,
        isChatbot: true,
      });

      const lastQuestionCase = await avatar.current.speak({
        text: 'Cevaplarınızın tamamını kayıt ettim , mülakatınız tamamlandı , teşekkür ederiz , görüşme ekranını kapatıyorum.',
        taskType: TaskType.REPEAT,
        taskMode: TaskMode.SYNC,
      });

      setTimeout(() => {
        endSession();
      }, lastQuestionCase?.duration_ms);

      return;
    }

    setQuestion(response?.data);

    //CreateLog.
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

    setStep(step + 1);
  };

  return (
    <>
      {introStep === EMBED_INTRO_STEPS.INITIALIZE && (
        <div className="container">
          {/* <!-- SOL SÜTUN --> */}
          <div className="left-column">
            <Box
              sx={{
                display: 'flex',
                width: '100%',
                height: '100%',
                flexDirection: 'column',
                backgroundImage: `url(/images/avatars/swiper/swiper_background_${slideIndex}.jpg)`,
                backgroundSize: 'cover',
                backgroundRepeat: 'no-repeat',
                backgroundPosition: 'center center',
                borderBottomLeftRadius: 0,
                alignItems: 'flex-end',
                justifyContent: 'space-between',
              }}
            >
              <Box sx={{ display: 'flex', width: 72, height: 36 }}>
                <Image
                  src="/small/topRight.png"
                  width="36"
                  height="36"
                  alt=""
                />
                <Box
                  sx={{ width: 36, height: 36, backgroundColor: 'white' }}
                ></Box>
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
                  {/* <ChatbotSwiper
                    onSlideChange={(slideIndex) => setSlideIndex(slideIndex)}
                  /> */}
                </Box>
                <Box sx={{ width: 36, backgroundColor: 'white' }}></Box>
              </Box>
              <Box
                sx={{
                  display: 'flex',
                  width: 36,
                  height: 36,
                  backgroundImage: 'url(/small/rightBottom.png)',
                }}
              ></Box>
            </Box>
          </div>

          {/* <!-- SAĞ SÜTUN --> */}
          <div className="right-column">
            <h2>Yapay zeka asistanımız görüşme yapmak için sizi bekliyor!</h2>
            {/* <!-- Adım Başlıkları --> */}
            <div className="steps">
              <div className="step active">Görüntü & Ses</div>
              <div className="step">İzinler</div>
              <div className="step">İsim</div>
              <div className="step">Özet</div>
            </div>

            {/* <!-- Kamera & Mikrofon Testi --> */}
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

            {/* <!-- Onay Butonu --> */}
            <button className="confirm-button">
              Sesinizi ve görüntünüzü onayladı, devam edebilirsiniz
            </button>
          </div>
        </div>
      )}

      {introStep === EMBED_INTRO_STEPS.WEBCAM_AND_MIC && (
        <Box sx={{ position: 'relative', minHeight: '100%' }}>
          <Box
            sx={{
              minHeight: '100%',
              position: 'absolute',
              minWidth: '100%',
              paddingBottom: '86px',
              display: 'flex',
              justifyContent: 'center',
              flexDirection: 'row',
            }}
          >
            <Box sx={{ display: 'flex', justifyContent: 'center' }}>
              <WebcamCapture startRecording={startVideoRecord} />
            </Box>
          </Box>
        </Box>
      )}

      {introStep === EMBED_INTRO_STEPS.MEET && (
        <div>
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

          {stream && (
            <>
              <div
                style={{
                  display: 'flex',
                  overflow: 'hidden',
                  justifyContent: 'center',
                  alignItems: 'center',
                  borderRadius: '0.5rem',
                  width: '1120px',
                  border: '1px solid white',
                  margin: '0 auto',
                  marginTop: '30px',
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
                ></video>
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
                  onStart={() => onStart()}
                  onStop={(filteredData) => onStop(filteredData)}
                />
              </div>
            </>
          )}
        </div>
      )}
    </>
  );
}
