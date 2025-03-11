export async function POST(req) {
  const { user_input, user_information } = await req.json();

  const payload = {
    inputs: {
      user_input,
      user_information,
    },
    response_mode: 'blocking',
    user: 'abc-123',
  };

  const response = await fetch('http://localhost/v1/workflows/run', {
    method: 'POST',
    headers: {
      Authorization: 'Bearer app-AHQ5oGDSnErNbSTlWW2l84Os',
      'Content-Type': 'application/json',
    },
    body: JSON.stringify(payload),
  });

  const data = await response.json();
  return Response.json(data);
}
