import ApiService from '../lib/http/AxiosHelper';

const api = new ApiService('Common');

export async function uploadVideo(request) {
  const meetingInvintationId = 'd6c15979-0ef3-43c4-966b-0eb114cbe356';

  console.log('Func in object', request);

  const payload = {
    meetingInvintationId,
    bytes: request.bytes,
    trackId: request?.trackId,
    fileExtension: request?.fileExtension,
    currentChunk: request.currentChunk,
    totalChunk: request.totalChunk,
    meetingQuestionId: request?.questionId,
  };

  try {
    await api.post(`File/UploadChunk`, {
      ...payload,
    });
  } catch (error) {}
}
