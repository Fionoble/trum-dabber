import { useState } from 'preact/hooks';
import { useLocation } from 'preact-iso';
import { isAuthenticated } from '../../services/auth';
import { tabStorage } from '../../services/storage';
import { transcribeTabFromImage } from '../../services/aiTranscription';
import { importTabFromJson } from '../../utils/tabIO';
import SpinnerIcon from '../../assets/icons/Spinner.svg.jsx';
import CloseIcon from '../../assets/icons/Close.svg.jsx';

function fileToBase64(file) {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => {
      const dataUrl = reader.result;
      const base64 = dataUrl.split(',')[1];
      const mimeType = dataUrl.split(':')[1].split(';')[0];
      resolve({ base64, mimeType });
    };
    reader.onerror = reject;
    reader.readAsDataURL(file);
  });
}

export default function AiImportModal({ onClose }) {
  const [file, setFile] = useState(null);
  const [isTranscribing, setIsTranscribing] = useState(false);
  const [error, setError] = useState(null);
  const [statusMessage, setStatusMessage] = useState('');
  const { route } = useLocation();

  const handleFileChange = (e) => {
    const selected = e.target.files[0];
    if (selected) {
      setFile(selected);
      setError(null);
    }
  };

  const handleTranscribe = async () => {
    if (!file) return;

    if (!isAuthenticated.value) {
      setError('You must be logged in to transcribe tabs.');
      return;
    }

    setIsTranscribing(true);
    setError(null);

    try {
      setStatusMessage('Reading file...');
      const { base64, mimeType } = await fileToBase64(file);

      if (file.size > 10_000_000) {
        throw new Error('File is too large. Please use an image under 10MB.');
      }

      setStatusMessage('Loading API keys...');
      const apiKeys = await tabStorage.getSetting('apiKeys', {
        openaiKey: '',
        anthropicKey: '',
      });

      setStatusMessage('Sending to AI for transcription...');
      const rawJson = await transcribeTabFromImage(base64, mimeType, apiKeys);

      setStatusMessage('Validating transcription...');
      const { tab, errors } = importTabFromJson(JSON.stringify(rawJson));

      if (errors.length > 0) {
        throw new Error(
          'The AI transcription was invalid: ' + errors[0] +
          '. Try a clearer image or different tab.'
        );
      }

      setStatusMessage('Saving beat...');
      const savedId = await tabStorage.saveTab(tab);

      if (savedId) {
        route(`/editor/${savedId}`);
      } else {
        throw new Error('Failed to save the transcribed tab. Are you logged in?');
      }
    } catch (err) {
      console.error('Transcription error:', err);
      setError(err.message || 'An unexpected error occurred.');
    } finally {
      setIsTranscribing(false);
      setStatusMessage('');
    }
  };

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
      <div className="bg-white rounded-lg max-w-md w-full p-6 shadow-xl">
        <div className="flex justify-between items-center mb-4">
          <h3 className="text-xl font-bold">Transcribe Drum Tab</h3>
          <button
            onClick={onClose}
            disabled={isTranscribing}
            className="p-1 rounded-md hover:bg-gray-100 disabled:opacity-50"
          >
            <CloseIcon />
          </button>
        </div>

        <p className="text-sm text-gray-600 mb-4">
          Upload an image of a drum tab and AI will transcribe it into an
          editable beat. Supports PNG, JPG, and WebP images.
        </p>

        <div className="mb-4">
          <input
            type="file"
            accept="image/png,image/jpeg,image/webp"
            onChange={handleFileChange}
            disabled={isTranscribing}
            className="block w-full text-sm text-gray-500
              file:mr-4 file:py-2 file:px-4
              file:rounded-md file:border-0
              file:text-sm file:font-medium
              file:bg-indigo-50 file:text-indigo-700
              hover:file:bg-indigo-100
              disabled:opacity-50"
          />
          {file && (
            <p className="mt-2 text-sm text-gray-600">
              Selected: {file.name} ({(file.size / 1024).toFixed(0)} KB)
            </p>
          )}
        </div>

        {error && (
          <div className="bg-red-100 text-red-800 p-3 rounded-md mb-4 text-sm">
            {error}
          </div>
        )}

        {isTranscribing && statusMessage && (
          <div className="bg-indigo-50 text-indigo-700 p-3 rounded-md mb-4 text-sm flex items-center gap-2">
            <SpinnerIcon />
            {statusMessage}
          </div>
        )}

        <p className="text-xs text-gray-500 mb-4">
          Requires an API key configured in Settings (Anthropic or OpenAI).
          The image is sent directly to the provider's API for processing.
        </p>

        <div className="flex justify-end gap-3">
          <button
            onClick={onClose}
            disabled={isTranscribing}
            className="px-4 py-2 bg-gray-100 text-gray-700 rounded-md hover:bg-gray-200 transition-colors disabled:opacity-50"
          >
            Cancel
          </button>
          <button
            onClick={handleTranscribe}
            disabled={!file || isTranscribing}
            className="px-4 py-2 bg-purple-600 text-white rounded-md hover:bg-purple-700 transition-colors flex items-center gap-2 disabled:opacity-50"
          >
            {isTranscribing ? (
              <>
                <SpinnerIcon />
                Transcribing...
              </>
            ) : (
              'Transcribe'
            )}
          </button>
        </div>
      </div>
    </div>
  );
}
