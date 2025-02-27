import ApiService from '../lib/http/AxiosHelper';

const api = new ApiService('Meet');

export async function fetchMeetingByMeetingInvintationId() {
  const meetinginvintationid = 'd6c15979-0ef3-43c4-966b-0eb114cbe356';
  try {
    const response = await api.get(`Meeting/GetMeetingByMeetingInvintationId`, {
      meetinginvintationid,
    });
    return response?.data;
  } catch (error) {
    console.error('Error fetching data:', error);
  }
}
