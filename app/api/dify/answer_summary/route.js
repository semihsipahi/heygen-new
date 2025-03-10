export async function POST(req) {
  const { answer } = await req.json();

  const payload = {
    inputs: {
      answer: answer,
    },
    response_mode: 'blocking',
    user: 'abc-123',
  };

  const response = await fetch('http://localhost/v1/workflows/run', {
    method: 'POST',
    headers: {
      Authorization: 'Bearer app-UiN96wlifdRHCRq4daGZ5dEj',
      'Content-Type': 'application/json',
    },
    body: JSON.stringify(payload),
  });

  const data = await response.json();
  return Response.json(data);
}
