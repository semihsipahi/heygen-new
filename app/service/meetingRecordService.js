import ApiService from '../lib/http/axiosHelper';

const api = new ApiService('Meet');

export async function createMeetingRecord(request) {
  const meetingInvintationId = 'd6c15979-0ef3-43c4-966b-0eb114cbe356';
  const payload = {
    meetingInvintationId,
    givenAnswer: request?.answer,
    meetingQuestionId: request?.questionId,
    isQuestionPassed: request?.isQuestionPassed,
  };
  try {
    await api.post(`MeetingRecord/createMeetingRecord`, {
      ...payload,
    });
  } catch (error) {}
}
