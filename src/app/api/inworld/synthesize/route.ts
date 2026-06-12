import { NextRequest, NextResponse } from 'next/server';

const INWORLD_TTS_API = 'https://api.inworld.ai/tts/v1';

export async function POST(request: NextRequest) {
  const apiKey = request.headers.get('x-api-key');
  const voiceIdHeader = request.headers.get('x-voice-id');
  const voiceName = request.headers.get('x-voice-name');
  const body = await request.json();

  if (!apiKey || (!voiceIdHeader && !voiceName)) {
    return NextResponse.json({ error: 'Missing API key or voice' }, { status: 400 });
  }

  try {
    // Prefer the explicit voiceId from the voices API (system voices like "Aanya"
    // expose it directly). Fall back to deriving it from a full resource name
    // ("workspaces/{ws}/voices/{short}" -> "{ws}__{short}").
    let voiceId = voiceIdHeader || '';
    if (!voiceId && voiceName) {
      const parts = voiceName.split('/');
      voiceId = parts.length >= 4 ? `${parts[1]}__${parts[3]}` : voiceName;
    }

    const endpoint = `${INWORLD_TTS_API}/voice`;
    console.log('Synthesizing at:', endpoint);
    console.log('Voice ID:', voiceId);
    
    const requestBody: Record<string, unknown> = {
      text: body.text,
      voiceId: voiceId,
      modelId: body.modelId || "inworld-tts-1",
      audioConfig: body.audioConfig || {
        audioEncoding: "LINEAR16",
        sampleRateHertz: 22050,
      },
      applyTextNormalization: body.applyTextNormalization || "ON",
      timestampType: body.timestampType || "WORD",
    };

    // deliveryMode is only supported by inworld-tts-2 (replaces temperature)
    if (body.deliveryMode) {
      requestBody.deliveryMode = body.deliveryMode;
    }
    
    console.log('=== SYNTHESIS REQUEST ===');
    console.log('Endpoint:', endpoint);
    console.log('Voice ID:', voiceId);
    console.log('Text length:', body.text.length);
    console.log('Text preview:', body.text.substring(0, 100));
    console.log('Full request body:', JSON.stringify(requestBody, null, 2));
    
    const response = await fetch(endpoint, {
      method: 'POST',
      headers: {
        'Authorization': `Basic ${apiKey}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(requestBody),
    });

    const responseText = await response.text();
    console.log('=== SYNTHESIS RESPONSE ===');
    console.log('Status:', response.status);
    console.log('Response preview:', responseText.substring(0, 300));

    if (!response.ok) {
      return NextResponse.json({ 
        error: `Failed to synthesize: ${response.status}`, 
        details: responseText 
      }, { status: response.status });
    }

    const data = JSON.parse(responseText);
    return NextResponse.json(data);
  } catch (e) {
    const errorMsg = e instanceof Error ? e.message : String(e);
    console.error('Synthesis error:', errorMsg);
    return NextResponse.json({ error: errorMsg }, { status: 500 });
  }
}
