'use client';

import StreamingAvatar, {
  AvatarQuality,
  StreamingEvents,
  TaskMode,
  TaskType,
  VoiceEmotion,
} from '@heygen/streaming-avatar';
import { useEffect, useRef, useState } from 'react';
import 'react-toastify/dist/ReactToastify.css';
import AudioRecorder from './components/audio/transaction/audioRecorder';
import WebcamCapture from './components/webcam/webcamCapture';
import { READY_STATE } from './lib/constants';
import ApiService from './lib/http/axiosHelper';
import { extractTagContent } from './lib/utils/pureString';
import { showToast } from './lib/utils/pureToast';

const api = new ApiService('Meet');

export default function Home() {
  const avatar = useRef(null);
  const mediaStream = useRef(null);

  const [step, setStep] = useState(0);
  const [answers, setAnswer] = useState();
  const [heygenToken, setHeygenToken] = useState(null);
  const [stream, setStream] = useState(null);
  const [meet, setMeet] = useState();

  useEffect(() => {
    fetchToken()
      .then((token) => {
        if (token) {
          console.log('Token Received Success', token);
          setHeygenToken(token);
        }
      })
      .catch((err) => console.error('Token Received Error:', err));
    fetchMeetingByMeetingInvintationId();
  }, []);

  useEffect(() => {
    if (heygenToken === null) return;

    (async () => {
      //await startSession();
    })();
  }, [heygenToken]);

  useEffect(() => {
    if (stream && mediaStream.current) {
      mediaStream.current.srcObject = stream;
      mediaStream.current.onloadedmetadata = () => {
        mediaStream.current.play();
      };
    }
  }, [mediaStream, stream]);

  const fetchToken = async () => {
    const response = await fetch('/api/get-access-token', {
      method: 'POST',
    });
    return await response.text();
  };

  const startSession = async () => {
    try {
      avatar.current = new StreamingAvatar({ token: heygenToken });

      avatar.current.on(StreamingEvents.AVATAR_START_TALKING, (e) => {
        // console.log('Avatar started talking', e);
      });

      avatar.current.on(StreamingEvents.AVATAR_STOP_TALKING, (e) => {
        // console.log('Avatar stopped talking', e);
      });

      avatar.current.on(StreamingEvents.STREAM_DISCONNECTED, () => {
        // console.log('Stream disconnected');
        endSession();
      });

      avatar.current.on(StreamingEvents.STREAM_READY, (event) => {
        // console.log('>>>>> Stream ready:', event.detail);
        setStream(event.detail);
      });

      await avatar.current.createStartAvatar({
        quality: AvatarQuality.High,
        avatarName: 'June_HR_public',
        knowledgeId: '',
        voice: {
          rate: 0.5, // 0.5 ~ 1.5
          emotion: VoiceEmotion.EXCITED,
        },
        language: 'tr',
        disableIdleTimeout: false,
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
  };

  const onStop = async (filteredData) => {
    showToast('Ses Algılama Devre Dışı');

    console.log('Filtered Speech To Text Data :', filteredData);
    setAnswer(filteredData);

    const response = await candidatePreparation(filteredData);

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
        //Kapatma yerine başka birşey dusun.
      }, speak?.duration_ms);
      return;
    }

    const readyCase = await avatar.current.speak({
      text: whenQuestion,
      taskType: TaskType.REPEAT,
      taskMode: TaskMode.SYNC,
    });

    setTimeout(async () => {
      await handleNextQuestion();
    }, readyCase?.duration_ms);
  };

  const handleNextQuestion = async () => {
    setStep(step + 1);
  };

  const candidatePreparation = async (userMessage) => {
    const response = await fetch('/api/dify/candidate_preparation', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        user_input: userMessage,
        user_information: 'Hakan',
      }),
    });
    return await response.json();
  };

  async function fetchMeetingByMeetingInvintationId() {
    const meetinginvintationid = 'd6c15979-0ef3-43c4-966b-0eb114cbe356';
    try {
      const response = await api.get(
        `http://localhost:5081/api/Meeting/GetMeetingByMeetingInvintationId`,
        {
          meetinginvintationid,
        }
      );
      setMeet(response?.data);
    } catch (error) {
      console.error('Error fetching data:', error);
    }
  }

  async function fetchMeetingQuestionByMeetingInvintationId() {
    const meetinginvintationid = 'd6c15979-0ef3-43c4-966b-0eb114cbe356';
    try {
      const data = await api.get(
        `http://localhost:5081/api/MeetingQuestion/GetMeetingQuestionByMeetingInvintationId`,
        {
          meetinginvintationid,
        }
      );
    } catch (error) {
      console.error('Error fetching data:', error);
    }
  }

  return (
    <div>
      <div
        style={{
          display: 'flex',
          justifyContent: 'center',
          marginTop: 10,
        }}
      >
        <WebcamCapture />
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
              height: '500px',
              width: '900px',
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
            style={{ display: 'flex', justifyContent: 'center', marginTop: 20 }}
          >
            <AudioRecorder
              onStart={() => onStart()}
              onStop={(filteredData) => onStop(filteredData)}
            />
          </div>
        </>
      )}
    </div>
  );
}
