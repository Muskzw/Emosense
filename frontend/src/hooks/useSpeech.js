import { useState, useEffect, useRef } from 'react';

export function useSpeech(isConnected) {
  const [transcript, setTranscript] = useState('');
  const [finalTranscripts, setFinalTranscripts] = useState([]);
  const recognitionRef = useRef(null);

  useEffect(() => {
    if (!isConnected) return;
    
    const SpeechRecognition = window.SpeechRecognition || window.webkitSpeechRecognition;
    if (!SpeechRecognition) {
      console.warn('Speech Recognition API not supported in this browser.');
      return;
    }

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
      // Auto-restart if still connected
      if (isConnected && recognitionRef.current) {
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
        try { recognitionRef.current.stop(); } catch(e) {}
        recognitionRef.current = null;
      }
    };
  }, [isConnected]);

  return { transcript, finalTranscripts };
}
