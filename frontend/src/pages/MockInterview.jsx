import React, { useEffect, useMemo, useRef, useState } from 'react';
import { Mic, MicOff, Play, Pause, Sparkles, Brain, Shield, Volume2 } from 'lucide-react';
import { useTheme } from '../contexts/ThemeContext';
import { MainLayout } from '../layouts/MainLayout';
import { CognitiveSensorsPanel } from '../components/CognitiveSensorsPanel';
import { interviewAPI } from '../services/api';

const mockTracks = [
  { key: 'hr', label: 'HR Interview', description: 'Practice HR questions, tell me about yourself, SWOT analysis, etc.' },
  { key: 'technical', label: 'Technical', description: 'Explain OOP pillars, C vs Java, DBMS normalization out loud.' },
  { key: 'behavioral', label: 'Behavioral', description: 'Work through teamwork, conflict resolution, and situational questions.' },
  { key: 'communication', label: 'Communication', description: 'Practice concise, structured speaking and clarity.' },
];
 
export default function MockInterviewPage({ onNavigate, onComplete }) {
  const { theme } = useTheme();
  const recognitionRef = useRef(null);
  const isMountedRef = useRef(true);
  const lastAskedQuestionRef = useRef('');

  const [selectedTrack, setSelectedTrack] = useState('hr');
  const [sessionId, setSessionId] = useState(null);
  const [currentQuestion, setCurrentQuestion] = useState('Choose a track to begin your live mock interview.');
  const [questionId, setQuestionId] = useState('');
  const [sessionState, setSessionState] = useState('setup');
  const [transcript, setTranscript] = useState('');
  const [liveCaption, setLiveCaption] = useState('');
  const [isListening, setIsListening] = useState(false);
  const [feedbackCards, setFeedbackCards] = useState([]);
  const [analysis, setAnalysis] = useState(null);
  const [error, setError] = useState(null);
  const [elapsedSeconds, setElapsedSeconds] = useState(0);

  const currentTrack = useMemo(() => mockTracks.find((track) => track.key === selectedTrack), [selectedTrack]);

  const speakQuestion = (text) => {
    if (!text || !('speechSynthesis' in window)) return;

    try {
      window.speechSynthesis.cancel();
      const utterance = new SpeechSynthesisUtterance(text);
      utterance.rate = 1;
      utterance.pitch = 1;
      window.speechSynthesis.speak(utterance);
    } catch {
      // Keep the visual question visible even if speech fails.
    }
  };

  const askQuestion = (questionText) => {
    if (!questionText || lastAskedQuestionRef.current === questionText) return;
    lastAskedQuestionRef.current = questionText;
    speakQuestion(questionText);
  };

  useEffect(() => {
    if (sessionState !== 'active') return;

    const timer = setInterval(() => {
      if (isMountedRef.current) {
        setElapsedSeconds((value) => value + 1);
      }
    }, 1000);

    return () => clearInterval(timer);
  }, [sessionState]);

  useEffect(() => {
    return () => {
      isMountedRef.current = false;
      if (recognitionRef.current) {
        recognitionRef.current.stop();
      }
    };
  }, []);

  const startSession = async () => {
    setError(null);
    setFeedbackCards([]);
    setAnalysis(null);
    setTranscript('');
    setLiveCaption('');
    setElapsedSeconds(0);

    try {
      const response = await interviewAPI.start({
        interview_type: `mock_${selectedTrack}`,
        position: `${currentTrack?.label || 'Mock'} Practice`,
        experience_level: 'mid',
        enable_proctoring: true,
      });

      setSessionId(response.data.session_id);
      if (!response.data.first_question_id) {
        setError('Server did not return a valid first question for this track. Please try a different track or check the backend.');
        return;
      }
      setQuestionId(response.data.first_question_id);
      setCurrentQuestion(response.data.first_question || 'Please introduce yourself and set the context for the conversation.');
      setSessionState('active');
      askQuestion(response.data.first_question || 'Please introduce yourself and set the context for the conversation.');
      startListening();
    } catch (err) {
      setError(err.response?.data?.detail || 'Unable to start the mock interview session.');
    }
  };

  const startListening = () => {
    const SpeechRecognition = window.SpeechRecognition || window.webkitSpeechRecognition;

    if (!SpeechRecognition) {
      setError('Speech recognition is not available in this browser. You can still type your answer manually.');
      return;
    }

    if (recognitionRef.current) {
      recognitionRef.current.stop();
    }

    const recognition = new SpeechRecognition();
    recognition.continuous = true;
    recognition.interimResults = true;
    recognition.lang = 'en-US';

    recognition.onresult = (event) => {
      let finalText = '';
      let interimText = '';

      for (let i = event.resultIndex; i < event.results.length; i += 1) {
        const text = event.results[i][0].transcript;
        if (event.results[i].isFinal) {
          finalText += `${text} `;
        } else {
          interimText += text;
        }
      }

      if (finalText.trim()) {
        setTranscript((previous) => `${previous} ${finalText}`.trim());
      }

      setLiveCaption(interimText || finalText.trim());
    };

    recognition.onerror = () => {
      setIsListening(false);
    };

    recognition.onend = () => {
      if (isMountedRef.current) {
        setIsListening(false);
      }
    };

    recognition.start();
    recognitionRef.current = recognition;
    setIsListening(true);
  };

  const stopListening = () => {
    if (recognitionRef.current) {
      recognitionRef.current.stop();
      recognitionRef.current = null;
    }

    setIsListening(false);
  };

  const stopSession = async () => {
    stopListening();
    window.speechSynthesis?.cancel?.();

    if (sessionId) {
      try {
        await interviewAPI.endInterview(sessionId);
      } catch {
        // Allow the user to exit even if the backend session close fails.
      }
    }

    setSessionState('setup');
    setSessionId(null);
    setQuestionId('');
    setCurrentQuestion('Choose a track to begin your live mock interview.');
    setTranscript('');
    setLiveCaption('');
    setFeedbackCards([]);
    setAnalysis(null);
    setElapsedSeconds(0);
    onNavigate?.('home');
  };

  const submitAnswer = async () => {
    if (!sessionId || !transcript.trim()) {
      setError('Speak or type an answer before submitting.');
      return;
    }

    setError(null);

    try {
      const response = await interviewAPI.submitAnswer({
        session_id: sessionId,
        question_id: questionId,
        answer_text: transcript.trim(),
        typing_metrics: {
          typingSpeed: transcript.trim().split(/\s+/).length,
          backspaces: 0,
          hesitationTime: liveCaption ? 1 : 0,
          totalTime: elapsedSeconds,
        },
      });

      const payload = response.data || {};
      setAnalysis(payload.analysis || null);
      setFeedbackCards((previous) => [
        ...previous,
        {
          title: 'AI evaluation',
          message: payload.analysis?.overall_impression || payload.analysis?.summary || 'The AI scored your response and adjusted the next question.',
        },
      ]);

      if (payload.follow_up_question) {
        setCurrentQuestion(payload.follow_up_question);
        askQuestion(payload.follow_up_question);
      } else {
        const nextQuestionResponse = await interviewAPI.getNextQuestion(sessionId);
        if (nextQuestionResponse.data?.should_continue) {
          setCurrentQuestion(nextQuestionResponse.data.question);
          setQuestionId(nextQuestionResponse.data.question_id || questionId);
          askQuestion(nextQuestionResponse.data.question);
        } else {
          await interviewAPI.endInterview(sessionId).catch(() => {});
          setSessionState('ended');
          onComplete?.(sessionId);
          onNavigate?.('results');
        }
      }

      setTranscript('');
      setLiveCaption('');
    } catch (err) {
      setError(err.response?.data?.detail || 'Unable to submit the spoken answer.');
    }
  };

  return (
    <MainLayout activeView="mock-interview" onNavigate={onNavigate}>
      <div
        style={{
          position: 'relative',
          minHeight: '100vh',
          overflow: 'hidden',
          backgroundColor: 'transparent',
        }}
      >
        <div style={{ position: 'relative', zIndex: 1, padding: '2rem', maxWidth: 1360, margin: '0 auto' }}>
          <section
            style={{
              display: 'grid',
              gridTemplateColumns: 'minmax(0, 1.2fr) minmax(300px, 0.8fr)',
              gap: '1.5rem',
              alignItems: 'start',
            }}
          >
            <div
              className="glass-panel"
              style={{
                padding: '2rem',
                borderRadius: '1.5rem',
              }}
            >
              <div style={{ display: 'inline-flex', alignItems: 'center', gap: '0.6rem', marginBottom: '1rem', padding: '0.45rem 0.8rem', borderRadius: '999px', background: `${theme.colors.primary}18`, color: theme.colors.primary, fontWeight: 700, fontSize: theme.fonts.size.sm }}>
                <Mic size={16} />
                Voice-first mock interview
              </div>

              <h1 style={{ margin: 0, fontSize: 'clamp(1.4rem, 3.2vw, 1.95rem)', fontWeight: 800, lineHeight: 1.08 }}>
                Speak your answer, get live transcription, and let the AI push back with follow-ups.
              </h1>

              <p style={{ marginTop: '1rem', color: theme.colors.textSecondary, lineHeight: 1.7, maxWidth: 860 }}>
                This room uses the same production interview engine, but wraps it in a voice-friendly practice flow with live sensor analytics and transcript capture.
              </p>

              <div style={{ display: 'flex', flexWrap: 'wrap', gap: '0.8rem', marginTop: '1.2rem' }}>
                {mockTracks.map((track) => (
                  <button
                    key={track.key}
                    type="button"
                    onClick={() => setSelectedTrack(track.key)}
                    style={{
                      padding: '0.75rem 1rem',
                      borderRadius: '999px',
                      border: `1px solid ${selectedTrack === track.key ? theme.colors.primary : theme.colors.borderLight}`,
                      background: selectedTrack === track.key ? `${theme.colors.primary}15` : theme.colors.surfacePrimary,
                      color: theme.colors.textPrimary,
                      cursor: 'pointer',
                      fontWeight: 700,
                    }}
                  >
                    {track.label}
                  </button>
                ))}
              </div>

              <div style={{ marginTop: '1.5rem', padding: '1rem', borderRadius: '1rem', background: `${theme.colors.bgTertiary}`, border: `1px solid ${theme.colors.borderLight}` }}>
                <div style={{ color: theme.colors.textTertiary, fontSize: theme.fonts.size.xs, textTransform: 'uppercase', letterSpacing: '0.12em' }}>Current prompt</div>
                <p style={{ margin: '0.5rem 0 0', lineHeight: 1.7, fontSize: theme.fonts.size.lg }}>{currentQuestion}</p>
              </div>

              <div style={{ marginTop: '1rem', display: 'grid', gap: '0.75rem' }}>
                <label style={{ display: 'flex', alignItems: 'center', gap: '0.75rem', color: theme.colors.textSecondary, fontWeight: 700 }}>
                  {isListening ? <MicOff size={18} /> : <Mic size={18} />}
                  {isListening ? 'Listening live' : 'Microphone idle'}
                </label>

                <textarea
                  value={transcript}
                  onChange={(event) => setTranscript(event.target.value)}
                  placeholder="Your spoken answer will appear here. You can edit it before submission."
                  style={{
                    width: '100%',
                    minHeight: 180,
                    resize: 'vertical',
                    borderRadius: '1rem',
                    padding: '1rem',
                    background: theme.colors.bgPrimary,
                    color: theme.colors.textPrimary,
                    border: `1px solid ${theme.colors.borderLight}`,
                  }}
                />

                {liveCaption && (
                  <div style={{ padding: '0.8rem 1rem', borderRadius: '0.9rem', background: `${theme.colors.primary}10`, border: `1px solid ${theme.colors.primary}30`, color: theme.colors.textSecondary }}>
                    <Volume2 size={16} style={{ display: 'inline', marginRight: 8 }} />
                    {liveCaption}
                  </div>
                )}

                <div style={{ display: 'flex', flexWrap: 'wrap', gap: '0.75rem' }}>
                  <button
                    type="button"
                    onClick={startSession}
                    disabled={sessionState === 'active'}
                    style={{
                      display: 'inline-flex',
                      alignItems: 'center',
                      gap: '0.6rem',
                      padding: '0.85rem 1.1rem',
                      borderRadius: '999px',
                      border: 'none',
                      background: `linear-gradient(135deg, ${theme.colors.primary}, ${theme.colors.info})`,
                      color: theme.colors.bgPrimary,
                      fontWeight: 800,
                      cursor: sessionState === 'active' ? 'not-allowed' : 'pointer',
                      opacity: sessionState === 'active' ? 0.7 : 1,
                    }}
                  >
                    <Play size={16} />
                    Start practice session
                  </button>

                  <button
                    type="button"
                    onClick={isListening ? stopListening : startListening}
                    disabled={sessionState !== 'active'}
                    style={{
                      display: 'inline-flex',
                      alignItems: 'center',
                      gap: '0.6rem',
                      padding: '0.85rem 1.1rem',
                      borderRadius: '999px',
                      border: `1px solid ${theme.colors.borderLight}`,
                      background: theme.colors.surfacePrimary,
                      color: theme.colors.textPrimary,
                      fontWeight: 800,
                      cursor: sessionState !== 'active' ? 'not-allowed' : 'pointer',
                    }}
                  >
                    {isListening ? <Pause size={16} /> : <Mic size={16} />}
                    {isListening ? 'Pause mic' : 'Start mic'}
                  </button>

                  <button
                    type="button"
                    onClick={stopSession}
                    disabled={sessionState !== 'active' && sessionState !== 'ended'}
                    style={{
                      display: 'inline-flex',
                      alignItems: 'center',
                      gap: '0.6rem',
                      padding: '0.85rem 1.1rem',
                      borderRadius: '999px',
                      border: `1px solid ${theme.colors.borderLight}`,
                      background: theme.colors.surfacePrimary,
                      color: theme.colors.textPrimary,
                      fontWeight: 800,
                      cursor: sessionState !== 'active' && sessionState !== 'ended' ? 'not-allowed' : 'pointer',
                    }}
                  >
                    Stop session
                  </button>

                  <button
                    type="button"
                    onClick={submitAnswer}
                    disabled={sessionState !== 'active' || !transcript.trim()}
                    style={{
                      display: 'inline-flex',
                      alignItems: 'center',
                      gap: '0.6rem',
                      padding: '0.85rem 1.1rem',
                      borderRadius: '999px',
                      border: `1px solid ${theme.colors.borderLight}`,
                      background: `${theme.colors.surfaceSecondary}`,
                      color: theme.colors.textPrimary,
                      fontWeight: 800,
                      cursor: sessionState !== 'active' || !transcript.trim() ? 'not-allowed' : 'pointer',
                    }}
                  >
                    <Sparkles size={16} />
                    Submit to AI
                  </button>
                </div>

                {error && <div style={{ marginTop: '0.5rem', color: theme.colors.danger }}>{error}</div>}
              </div>

              <div style={{ marginTop: '1.5rem', display: 'grid', gap: '0.8rem' }}>
                <div style={{ color: theme.colors.textTertiary, fontSize: theme.fonts.size.xs, textTransform: 'uppercase', letterSpacing: '0.12em' }}>AI memory log</div>
                {feedbackCards.length === 0 ? (
                  <p style={{ margin: 0, color: theme.colors.textSecondary }}>Submit an answer to see memory-aware feedback and the next adaptive question.</p>
                ) : (
                  feedbackCards.map((card, index) => (
                    <div key={`${card.title}-${index}`} style={{ padding: '0.95rem 1rem', borderRadius: '1rem', background: theme.colors.surfacePrimary, border: `1px solid ${theme.colors.borderLight}` }}>
                      <div style={{ fontWeight: 800, marginBottom: '0.25rem' }}>{card.title}</div>
                      <div style={{ color: theme.colors.textSecondary, lineHeight: 1.6 }}>{card.message}</div>
                    </div>
                  ))
                )}
              </div>

              {analysis && (
                <div style={{ marginTop: '1rem', padding: '1rem', borderRadius: '1rem', background: `${theme.colors.primary}10`, border: `1px solid ${theme.colors.primary}25` }}>
                  <div style={{ fontWeight: 800, marginBottom: '0.35rem' }}>Latest AI analysis</div>
                  <pre style={{ margin: 0, whiteSpace: 'pre-wrap', color: theme.colors.textSecondary }}>{JSON.stringify(analysis, null, 2)}</pre>
                </div>
              )}
            </div>

            <div style={{ display: 'grid', gap: '1rem' }}>
              <CognitiveSensorsPanel sessionId={sessionId} onMetricsUpdate={() => {}} />

              <div
                className="glass-panel"
                style={{
                  padding: '1.25rem',
                  borderRadius: '1.25rem',
                }}
              >
                <div style={{ display: 'flex', alignItems: 'center', gap: '0.6rem', color: theme.colors.primary, fontWeight: 800, marginBottom: '0.75rem' }}>
                  <Shield size={18} />
                  Session controls
                </div>
                <p style={{ margin: 0, color: theme.colors.textSecondary, lineHeight: 1.65 }}>
                  The mock room is connected to the production AI interview backend. It will ask a question, read it aloud when supported, and continue with adaptive follow-ups.
                </p>
                <button
                  type="button"
                  onClick={() => onNavigate?.('analysis-dashboard')}
                  style={{
                    marginTop: '1rem',
                    width: '100%',
                    padding: '0.9rem 1rem',
                    borderRadius: '0.9rem',
                    border: `1px solid ${theme.colors.borderLight}`,
                    background: theme.colors.surfacePrimary,
                    color: theme.colors.textPrimary,
                    fontWeight: 700,
                    cursor: 'pointer',
                  }}
                >
                  Open analysis dashboard
                </button>
              </div>
            </div>
          </section>
        </div>
      </div>
    </MainLayout>
  );
}