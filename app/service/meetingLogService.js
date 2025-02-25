import ApiService from '../lib/http/axiosHelper';

const api = new ApiService('Meet');

export async function createLog(request) {
  const meetingInvintationId = 'd6c15979-0ef3-43c4-966b-0eb114cbe356';

  const payload = {
    meetingInvintationId,
    value: request?.value,
    meetingQuestionId: request?.questionId,
    isChatbot: request.isChatbot,
  };

  try {
    await api.post(`MeetingLog/CreateMeetingLog`, {
      ...payload,
    });
  } catch (error) {}
}
