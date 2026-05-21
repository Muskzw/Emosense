import { useState, useEffect, useRef } from 'react';

export function useSpeech(isConnected, enabled = false) {
  const [transcript, setTranscript] = useState('');
  const [finalTranscripts, setFinalTranscripts] = useState([]);
  const recognitionRef = useRef(null);

  useEffect(() => {
    if (!isConnected || !enabled) {
      if (recognitionRef.current) {
        console.log('[useSpeech] Disabling Speech Recognition and releasing mic');
        try { recognitionRef.current.stop(); } catch(e) {}
        recognitionRef.current = null;
      }
      return;
    }
    
    const SpeechRecognition = window.SpeechRecognition || window.webkitSpeechRecognition;
    if (!SpeechRecognition) {
      console.warn('Speech Recognition API not supported in this browser.');
      return;
    }

    console.log('[useSpeech] Starting Speech Recognition (acquiring mic)');
    const recognition = new SpeechRecognition();
    recognition.continuous = true;
    recognition.interimResults = true;
    recognition.lang = 'en-US';

    recognition.onresult = (event) => {
      let interimTranscript = '';
      for (let i = event.resultIndex; i < event.results.length; ++i) {
        if (event.results[i].isFinal) {
          const text = event.results[i][0].transcript.trim();
          if (text) {
             setFinalTranscripts(prev => [...prev, { text, timestamp: Date.now() }]);
          }
        } else {
          interimTranscript += event.results[i][0].transcript;
        }
      }
      setTranscript(interimTranscript);
    };

    recognition.onerror = (event) => {
      console.error('Speech recognition error', event.error);
    };
    
    recognition.onend = () => {
      // Auto-restart if still connected and enabled
      if (isConnected && enabled && recognitionRef.current) {
        try { recognition.start(); } catch(e) {}
      }
    };

    try {
      recognition.start();
      recognitionRef.current = recognition;
    } catch (e) {
      console.error('Failed to start speech recognition', e);
    }

    return () => {
      if (recognitionRef.current) {
        console.log('[useSpeech] Cleaning up Speech Recognition');
        try { recognitionRef.current.stop(); } catch(e) {}
        recognitionRef.current = null;
      }
    };
  }, [isConnected, enabled]);

  return { transcript, finalTranscripts };
}

