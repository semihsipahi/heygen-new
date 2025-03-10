import ApiService from '../lib/http/AxiosHelper';

const api = new ApiService('MeetingInvintation');

export async function completeMeetingInvintation() {
  const meetinginvintationid = 'd6c15979-0ef3-43c4-966b-0eb114cbe356';

  try {
    const response = await api.post(
      `MeetingInvintation/CompleteMeetingInvintation?meetingInvintationId=${meetinginvintationid}`
    );
    return response;
  } catch (error) {
    console.error('Error fetching data:', error);
  }
}
