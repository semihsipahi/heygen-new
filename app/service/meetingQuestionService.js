import ApiService from '../lib/http/axiosHelper';

const api = new ApiService('Meet');

export async function fetchMeetingQuestionByMeetingInvintationId() {
  const meetinginvintationid = 'd6c15979-0ef3-43c4-966b-0eb114cbe356';

  try {
    const response = await api.get(
      `MeetingQuestion/GetMeetingQuestionByMeetingInvintationId`,
      {
        meetinginvintationid,
      }
    );
    return response;
  } catch (error) {
    console.error('Error fetching data:', error);
  }
}
