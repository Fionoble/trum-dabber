const VALID_DENOMINATORS = [2, 4, 8, 16];
const SUBDIVISION = 8;

export function validateTabJson(parsed) {
  const errors = [];

  if (!parsed || typeof parsed !== 'object') {
    return { valid: false, errors: ['File is not a valid JSON object'] };
  }

  if (typeof parsed.name !== 'string' || !parsed.name.trim()) {
    errors.push('Missing or empty field: name');
  }

  const bpm = Number(parsed.bpm);
  if (!Number.isFinite(bpm) || bpm < 40 || bpm > 240) {
    errors.push('bpm must be a number between 40 and 240');
  }

  const tsNum = Number(parsed.tsNumerator);
  if (!Number.isInteger(tsNum) || tsNum < 1 || tsNum > 15) {
    errors.push('tsNumerator must be an integer between 1 and 15');
  }

  const tsDen = Number(parsed.tsDenominator);
  if (!VALID_DENOMINATORS.includes(tsDen)) {
    errors.push('tsDenominator must be one of: 2, 4, 8, 16');
  }

  const measures = Number(parsed.measures);
  if (!Number.isInteger(measures) || measures < 1 || measures > 25) {
    errors.push('measures must be an integer between 1 and 25');
  }

  if (!Array.isArray(parsed.tracks) || parsed.tracks.length === 0) {
    errors.push('tracks must be a non-empty array');
    return { valid: errors.length === 0, errors };
  }

  const expectedLength = tsNum * SUBDIVISION * measures;

  parsed.tracks.forEach((track, i) => {
    if (typeof track.sound !== 'string' || !track.sound.trim()) {
      errors.push(`tracks[${i}]: missing sound`);
    }
    if (!Array.isArray(track.pattern)) {
      errors.push(`tracks[${i}]: pattern must be an array`);
    } else if (
      Number.isInteger(tsNum) &&
      Number.isInteger(measures) &&
      track.pattern.length !== expectedLength
    ) {
      errors.push(
        `tracks[${i}] (${track.sound}): pattern length ${track.pattern.length} does not match expected ${expectedLength} (${tsNum} * ${SUBDIVISION} * ${measures})`
      );
    }
  });

  if (parsed.instrumentOrder !== undefined) {
    if (
      !Array.isArray(parsed.instrumentOrder) ||
      parsed.instrumentOrder.some((s) => typeof s !== 'string')
    ) {
      errors.push('instrumentOrder must be an array of strings');
    }
  }

  return { valid: errors.length === 0, errors };
}

export function importTabFromJson(jsonString) {
  let parsed;
  try {
    parsed = JSON.parse(jsonString);
  } catch (e) {
    return { tab: null, errors: ['Invalid JSON: ' + e.message] };
  }

  const { $schema, version, ...data } = parsed;

  const { valid, errors } = validateTabJson(data);
  if (!valid) {
    return { tab: null, errors };
  }

  const tab = {
    ...data,
    tracks: data.tracks.map((track) => ({
      id: `track-${track.sound}`,
      name: track.name || track.sound,
      ...track,
    })),
  };

  delete tab.id;
  delete tab.user_id;
  delete tab.created;
  delete tab.modified;

  return { tab, errors: [] };
}
