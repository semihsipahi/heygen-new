export async function POST(req) {
  const { conversation_history, answer } = await req.json();

  const response = await fetch(
    'http://localhost:5678/webhook/nextjs-dify-webhook-summary',
    {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        conversation_history,
        answer,
      }),
    }
  );

  const data = await response.json();
  return Response.json(data);
}
