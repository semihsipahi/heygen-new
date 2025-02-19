import { NextResponse } from 'next/server';

export async function POST(req) {
  try {
    const formData = await req.formData();
    const audioFile = formData.get('audio');

    if (!audioFile) {
      return NextResponse.json(
        { error: 'Ses dosyası bulunamadı.' },
        { status: 400 }
      );
    }

    const apiKey = process.env.OPENAI_API_KEY;
    const openaiUrl = 'https://api.openai.com/v1/audio/transcriptions';

    const openaiFormData = new FormData();

    openaiFormData.append('file', audioFile, 'audio.mp3');
    openaiFormData.append('model', 'whisper-1');

    const response = await fetch(openaiUrl, {
      method: 'POST',
      headers: {
        Authorization: `Bearer ${apiKey}`,
      },
      body: openaiFormData,
    });

    const result = await response.json();
    return NextResponse.json(result);
  } catch (error) {
    return NextResponse.json({ error: 'Bir hata oluştu.' }, { status: 500 });
  }
}
