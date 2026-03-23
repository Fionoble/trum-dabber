const VALID_SOUNDS = [
  'kick', 'snare', 'hihat', 'hihatOpen', 'tom', 'hiTom',
  'floorTom', 'crash', 'cowbell',
];

function buildSystemPrompt() {
  return `You are a drum tab transcription assistant. You convert images of drum notation or drum tabs into a specific JSON format. Always respond with ONLY valid JSON, no explanation text, no markdown code blocks.`;
}

function buildUserPrompt() {
  return `Analyze this drum tab or drum notation image and convert it to the following JSON format exactly:

{
  "$schema": "trum-dabber-tab",
  "version": 1,
  "name": "<song name if visible, otherwise 'Transcribed Tab'>",
  "bpm": <number between 40-240, use 120 if not specified>,
  "tsNumerator": <time signature numerator, 1-15, typically 4>,
  "tsDenominator": <time signature denominator: 2, 4, 8, or 16, typically 4>,
  "measures": <number of measures/bars in the tab, 1-25>,
  "volume": 0.7,
  "instrumentOrder": [<list of sound names in same order as tracks>],
  "tracks": [
    {
      "name": "<sound name>",
      "sound": "<sound name>",
      "pattern": [<array of booleans or strings>]
    }
  ]
}

Rules:
- Each pattern array must have exactly (tsNumerator * 8 * measures) elements
- Each element is either false (not hit) or true (hit)
- For the hihat track ONLY, elements can be false, "hihat" (closed hit), or "hihatOpen" (open hit)
- Available sound values: ${VALID_SOUNDS.join(', ')}
- Do NOT include hihatOpen as a separate track. Use the "hihat" track with "hihat" or "hihatOpen" string values in the pattern
- Use 8 subdivisions per beat (16th note resolution)
- instrumentOrder must list sounds in the same order as the tracks array
- Only include instruments that appear in the tab image
- Respond with ONLY the JSON object`;
}

function extractJson(text) {
  // Try to strip markdown code fences
  const fenceMatch = text.match(/```(?:json)?\s*([\s\S]*?)```/);
  if (fenceMatch) {
    try {
      return JSON.parse(fenceMatch[1].trim());
    } catch (_) { /* fall through */ }
  }

  // Try direct parse
  try {
    return JSON.parse(text.trim());
  } catch (_) { /* fall through */ }

  // Try to find JSON object in the text
  const firstBrace = text.indexOf('{');
  const lastBrace = text.lastIndexOf('}');
  if (firstBrace !== -1 && lastBrace > firstBrace) {
    try {
      return JSON.parse(text.substring(firstBrace, lastBrace + 1));
    } catch (_) { /* fall through */ }
  }

  throw new Error('Could not parse AI response as JSON. Try a clearer image.');
}

async function callOpenAI(base64Image, mimeType, apiKey) {
  const dataUrl = `data:${mimeType};base64,${base64Image}`;

  const response = await fetch('https://api.openai.com/v1/chat/completions', {
    method: 'POST',
    headers: {
      'Authorization': `Bearer ${apiKey}`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
      model: 'gpt-4o',
      max_tokens: 4096,
      messages: [
        { role: 'system', content: buildSystemPrompt() },
        {
          role: 'user',
          content: [
            { type: 'text', text: buildUserPrompt() },
            { type: 'image_url', image_url: { url: dataUrl } },
          ],
        },
      ],
    }),
  });

  if (!response.ok) {
    const status = response.status;
    if (status === 401) {
      throw new Error('Invalid OpenAI API key. Please check your key in Settings.');
    }
    if (status === 429) {
      throw new Error('OpenAI rate limit reached. Please try again in a moment.');
    }
    throw new Error(`OpenAI API error (status ${status}). Please try again.`);
  }

  const data = await response.json();
  const content = data.choices?.[0]?.message?.content;

  if (!content) {
    throw new Error('Empty response from OpenAI. Please try again.');
  }

  return extractJson(content);
}

export async function transcribeTabFromImage(base64Image, mimeType, apiKeys) {
  const { openaiKey, anthropicKey } = apiKeys;

  if (openaiKey) {
    return callOpenAI(base64Image, mimeType, openaiKey);
  }

  if (anthropicKey) {
    throw new Error(
      'Anthropic API cannot be called directly from the browser due to CORS restrictions. Please configure an OpenAI API key in Settings.'
    );
  }

  throw new Error('No API key configured. Add an OpenAI API key in Settings.');
}
