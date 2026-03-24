const VALID_SOUNDS = [
  'kick', 'snare', 'hihat', 'hihatOpen', 'tom', 'hiTom',
  'floorTom', 'crash', 'cowbell',
];

function buildSystemPrompt() {
  return `You are an expert drum transcription assistant. You accurately read drum sheet music and drum tabs from images and convert them into a specific JSON format.

You understand standard drum notation:
- Bass drum (kick): bottom space of the staff, regular noteheads
- Snare drum: third space from bottom, regular noteheads
- Hi-hat (closed): top of staff or above, x-shaped noteheads
- Hi-hat (open): x-shaped notehead with "o" above it
- Crash cymbal: x-shaped notehead above the staff, often at the start of sections
- Ride cymbal: x-shaped notehead on top line of staff
- High tom: first space below top line, regular noteheads
- Mid tom: third line from top, regular noteheads
- Floor tom: second space from bottom, regular noteheads

You also understand text-based drum tabs where instruments are labeled on the left (HH, SD, BD, etc.) with x, X, o, O marks on a grid.

Always respond with ONLY valid JSON, no explanation text, no markdown code blocks.`;
}

function buildUserPrompt() {
  return `Carefully analyze this drum notation image. Read each measure left to right, top to bottom across all lines/systems. Pay close attention to:
- The exact rhythmic placement of each hit (which subdivision it falls on)
- The difference between x-noteheads (cymbals) and regular noteheads (drums)
- Open hi-hat marks (o above the note) vs closed hi-hat
- Ghost notes (parenthesized or smaller noteheads, usually on snare)
- Accents (> above notes)
- Rests and empty subdivisions

Convert to this JSON format exactly:

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
- Count the measures carefully by looking at barlines in the image
- Each pattern array must have exactly (tsNumerator * 8 * measures) elements
- There are 8 subdivisions per beat (32nd note resolution within each beat)
- Each element is either false (not hit) or true (hit)
- For the hihat track ONLY, elements can be false, "hihat" (closed hit), or "hihatOpen" (open hit)
- Available sound values: ${VALID_SOUNDS.join(', ')}
- Do NOT include hihatOpen as a separate track. Use the "hihat" track with "hihat" or "hihatOpen" string values
- instrumentOrder must list sounds in the same order as the tracks array
- Only include instruments that actually appear in the notation
- A quarter note hit occupies subdivision 0 of that beat. An eighth note on the "and" is subdivision 4. 16th notes fall on 0, 2, 4, 6.
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
      model: 'gpt-5.4-mini',
      max_completion_tokens: 16384,
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

async function callAnthropic(base64Image, mimeType, apiKey) {
  const response = await fetch('https://api.anthropic.com/v1/messages', {
    method: 'POST',
    headers: {
      'x-api-key': apiKey,
      'content-type': 'application/json',
      'anthropic-version': '2023-06-01',
      'anthropic-dangerous-direct-browser-access': 'true',
    },
    body: JSON.stringify({
      model: 'claude-opus-4-6',
      max_tokens: 16384,
      system: buildSystemPrompt(),
      messages: [
        {
          role: 'user',
          content: [
            {
              type: 'image',
              source: {
                type: 'base64',
                media_type: mimeType,
                data: base64Image,
              },
            },
            { type: 'text', text: buildUserPrompt() },
          ],
        },
      ],
    }),
  });

  if (!response.ok) {
    const status = response.status;
    if (status === 401) {
      throw new Error('Invalid Anthropic API key. Please check your key in Settings.');
    }
    if (status === 429) {
      throw new Error('Anthropic rate limit reached. Please try again in a moment.');
    }
    throw new Error(`Anthropic API error (status ${status}). Please try again.`);
  }

  const data = await response.json();
  const content = data.content?.[0]?.text;

  if (!content) {
    throw new Error('Empty response from Anthropic. Please try again.');
  }

  return extractJson(content);
}

const SUBDIVISION = 8;

function reconcilePatterns(parsed) {
  if (!parsed || !Array.isArray(parsed.tracks) || parsed.tracks.length === 0) {
    return parsed;
  }

  const tsNum = Number(parsed.tsNumerator) || 4;
  const beatsPerMeasure = tsNum * SUBDIVISION;
  const declaredLength = beatsPerMeasure * (Number(parsed.measures) || 1);

  // Find the most common pattern length across tracks
  const lengths = parsed.tracks.map((t) => t.pattern?.length || 0);
  const maxLength = Math.max(...lengths);

  // If patterns already match the declared length, nothing to do
  if (maxLength === declaredLength) return parsed;

  // Try to infer the correct measure count from the longest pattern
  const inferredMeasures = Math.ceil(maxLength / beatsPerMeasure);
  const targetLength = inferredMeasures * beatsPerMeasure;

  parsed.measures = inferredMeasures;

  // Pad or truncate each track's pattern to match
  for (const track of parsed.tracks) {
    if (!Array.isArray(track.pattern)) continue;
    if (track.pattern.length < targetLength) {
      track.pattern = track.pattern.concat(
        new Array(targetLength - track.pattern.length).fill(false)
      );
    } else if (track.pattern.length > targetLength) {
      track.pattern = track.pattern.slice(0, targetLength);
    }
  }

  return parsed;
}

export async function transcribeTabFromImage(base64Image, mimeType, apiKeys) {
  const { openaiKey, anthropicKey } = apiKeys;

  let rawJson;

  if (anthropicKey) {
    rawJson = await callAnthropic(base64Image, mimeType, anthropicKey);
  } else if (openaiKey) {
    rawJson = await callOpenAI(base64Image, mimeType, openaiKey);
  } else {
    throw new Error('No API key configured. Add an API key in Settings.');
  }

  return reconcilePatterns(rawJson);
}
