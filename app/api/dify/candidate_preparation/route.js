export async function POST(req) {
  const { user_input, user_information } = await req.json();

  console.log('Incoming User Input', user_input);
  console.log('Incoming User Information', user_information);

  const response = await fetch(
    'http://localhost:5678/webhook/nextjs-dify-webhook',
    {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        user_input,
        user_information,
      }),
    }
  );

  const data = await response.json();
  return Response.json(data);
}
