import { NextRequest, NextResponse } from 'next/server';

const INWORLD_TTS_API = 'https://api.inworld.ai/tts/v1';

export async function POST(request: NextRequest) {
  const apiKey = request.headers.get('x-api-key');
  const voiceName = request.headers.get('x-voice-name');
  const body = await request.json();

  if (!apiKey || !voiceName) {
    return NextResponse.json({ error: 'Missing API key or voice name' }, { status: 400 });
  }

  try {
    // Extract voice ID from the full resource name
    // Format: "workspaces/default-rkexmpzbw6j-o9u1c8ztdw/voices/james_ultra"
    // Need: "default-rkexmpzbw6j-o9u1c8ztdw__james_ultra"
    const parts = voiceName.split('/');
    const workspaceId = parts[1]; // "default-rkexmpzbw6j-o9u1c8ztdw"
    const voiceShortName = parts[3]; // "james_ultra"
    const voiceId = `${workspaceId}__${voiceShortName}`;
    
    const endpoint = `${INWORLD_TTS_API}/voice`;
    console.log('Synthesizing at:', endpoint);
    console.log('Voice ID:', voiceId);
    
    const requestBody = {
      text: body.text,
      voiceId: voiceId,
      modelId: body.modelId || "inworld-tts-1",
      timestampType: body.timestampType || "WORD"
    };
    
    console.log('Request body:', JSON.stringify(requestBody));
    
    const response = await fetch(endpoint, {
      method: 'POST',
      headers: {
        'Authorization': `Basic ${apiKey}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(requestBody),
    });

    const responseText = await response.text();
    console.log('Synthesis response:', response.status, responseText.substring(0, 200));

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
