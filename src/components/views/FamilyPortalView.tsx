import React, { useState, useRef, useEffect, useCallback } from 'react';
import {
  Mic, MicOff, Volume2, VolumeX, Globe, Send, ShieldCheck, PhoneCall,
  Sparkles, Loader2, Radio, AlertTriangle, Bot, User as UserIcon,
  Stethoscope, Zap,
} from 'lucide-react';
import { api } from '../../services/api';
import { Patient } from '../../types';

interface FamilyPortalViewProps {
  patients?: Patient[];
  selectedPatientId?: string;
  onSelectPatient?: (id: string) => void;
}

type Sender = 'family' | 'assistant';

interface ChatMessage {
  id: string;
  sender: Sender;
  text: string;
  time: string;
  source?: 'ai' | 'fallback';
  escalated?: boolean;
}

// Maps the UI's short language codes to the full names the backend AI prompt
// (and the browser's SpeechRecognition/SpeechSynthesis locale) expects.
const LANGUAGE_NAMES: Record<string, string> = {
  en: 'English',
  te: 'Telugu',
  hi: 'Hindi',
  ja: 'Japanese',
  ta: 'Tamil',
};

const LANGUAGE_LOCALES: Record<string, string> = {
  en: 'en-US',
  te: 'te-IN',
  hi: 'hi-IN',
  ja: 'ja-JP',
  ta: 'ta-IN',
};

const QUICK_QUESTIONS: Record<string, string[]> = {
  en: ['How is he doing today?', 'When can we visit?', 'Does he need anything from home?'],
  hi: ['आज उनकी हालत कैसी है?', 'हम कब मिलने आ सकते हैं?', 'क्या उन्हें घर से कुछ चाहिए?'],
  te: ['ఈ రోజు ఆయన ఎలా ఉన్నారు?', 'మేము ఎప్పుడు రావచ్చు?', 'ఇంటి నుండి ఏమైనా కావాలా?'],
  ja: ['今日の様子はどうですか？', 'いつ面会できますか？', '自宅から何か必要ですか？'],
  ta: ['இன்று அவர் எப்படி இருக்கிறார்?', 'நாங்கள் எப்போது வரலாம்?', 'வீட்டிலிருந்து ஏதாவது தேவையா?'],
};

const ESCALATION_PATTERN = /speak directly with the attending|attending nurse or doctor|contact.*(nurse|doctor)/i;

const uid = () => Math.random().toString(36).slice(2, 10);
const nowTime = () => new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });

export const FamilyPortalView: React.FC<FamilyPortalViewProps> = ({
  patients = [],
  selectedPatientId,
}) => {
  const activePatient = patients.find(p => p.id === selectedPatientId) || patients[0];

  const [messages, setMessages] = useState<ChatMessage[]>([
    {
      id: uid(),
      sender: 'assistant',
      text: activePatient
        ? `Hello! I'm the Family Voice assistant. ${activePatient.name} is currently listed as "${activePatient.statusTag}" in room ${activePatient.roomNumber}. Ask me anything — you can type or just tap the mic and speak.`
        : `Hello! I'm the Family Voice assistant. Ask me anything about your loved one's stay — you can type or tap the mic and speak.`,
      time: nowTime(),
      source: 'ai',
    },
  ]);

  const [inputMessage, setInputMessage] = useState('');
  const [passcode, setPasscode] = useState('');
  const [passcodeSuccess, setPasscodeSuccess] = useState<string | null>(null);
  const [selectedLanguage, setSelectedLanguage] = useState('en');
  const [isListening, setIsListening] = useState(false);
  const [interimTranscript, setInterimTranscript] = useState('');
  const [isThinking, setIsThinking] = useState(false);
  const [isSpeaking, setIsSpeaking] = useState(false);
  const [continuousMode, setContinuousMode] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [micLevels, setMicLevels] = useState<number[]>(new Array(24).fill(4));
  const [speakingWordRange, setSpeakingWordRange] = useState<{ msgId: string; start: number; end: number } | null>(null);
  const [voicesReady, setVoicesReady] = useState(false);

  const recognitionRef = useRef<any>(null);
  const audioCtxRef = useRef<AudioContext | null>(null);
  const analyserRef = useRef<AnalyserNode | null>(null);
  const micStreamRef = useRef<MediaStream | null>(null);
  const rafRef = useRef<number | null>(null);
  const messagesEndRef = useRef<HTMLDivElement | null>(null);
  const isVoiceInputRef = useRef(false);
  const continuousModeRef = useRef(false);
  const utteranceRef = useRef<SpeechSynthesisUtterance | null>(null);

  const t = {
    placeholder: selectedLanguage === 'en'
      ? 'Type an update or ask a question…'
      : 'टाइप करें या माइक दबाएँ…',
    welcome: 'Family Voice & Text Support Hub',
  };

  useEffect(() => { continuousModeRef.current = continuousMode; }, [continuousMode]);

  // Load system voices (populated async in most browsers).
  useEffect(() => {
    if (!('speechSynthesis' in window)) return;
    const load = () => setVoicesReady(window.speechSynthesis.getVoices().length > 0);
    load();
    window.speechSynthesis.onvoiceschanged = load;
  }, []);

  // Auto-scroll to the newest message.
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages, interimTranscript, isThinking]);

  // Clean up mic/audio/recognition on unmount.
  useEffect(() => {
    return () => {
      stopWaveform();
      recognitionRef.current?.stop?.();
      window.speechSynthesis?.cancel();
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // ── Mic amplitude visualizer (real audio, via Web Audio API) ───────────────
  const startWaveform = async () => {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      micStreamRef.current = stream;
      const AudioCtx = (window as any).AudioContext || (window as any).webkitAudioContext;
      const ctx: AudioContext = new AudioCtx();
      const source = ctx.createMediaStreamSource(stream);
      const analyser = ctx.createAnalyser();
      analyser.fftSize = 64;
      source.connect(analyser);
      audioCtxRef.current = ctx;
      analyserRef.current = analyser;

      const data = new Uint8Array(analyser.frequencyBinCount);
      const tick = () => {
        analyser.getByteFrequencyData(data);
        const bars = Array.from({ length: 24 }, (_, i) => {
          const v = data[i % data.length] || 0;
          return Math.max(4, Math.round((v / 255) * 40));
        });
        setMicLevels(bars);
        rafRef.current = requestAnimationFrame(tick);
      };
      tick();
    } catch {
      // Mic-level visuals are cosmetic only — recognition still works without them.
    }
  };

  const stopWaveform = () => {
    if (rafRef.current) cancelAnimationFrame(rafRef.current);
    rafRef.current = null;
    micStreamRef.current?.getTracks().forEach(tr => tr.stop());
    micStreamRef.current = null;
    audioCtxRef.current?.close().catch(() => {});
    audioCtxRef.current = null;
    analyserRef.current = null;
    setMicLevels(new Array(24).fill(4));
  };

  // ── Speech-to-Text ───────────────────────────────────────────────────────
  const startListening = useCallback(() => {
    const SpeechRecognition = (window as any).SpeechRecognition || (window as any).webkitSpeechRecognition;
    if (!SpeechRecognition) {
      setError('Voice input needs a browser with Speech Recognition support (Chrome or Edge).');
      return;
    }
    setError(null);
    const recognition = new SpeechRecognition();
    recognition.lang = LANGUAGE_LOCALES[selectedLanguage] || 'en-US';
    recognition.interimResults = true;
    recognition.continuous = false;

    recognition.onstart = () => {
      setIsListening(true);
      startWaveform();
    };
    recognition.onresult = (event: any) => {
      let interim = '';
      let final = '';
      for (let i = event.resultIndex; i < event.results.length; i++) {
        const transcript = event.results[i][0].transcript;
        if (event.results[i].isFinal) final += transcript;
        else interim += transcript;
      }
      setInterimTranscript(interim);
      if (final.trim()) {
        setInterimTranscript('');
        isVoiceInputRef.current = true;
        handleSendMessage(final.trim(), true);
      }
    };
    recognition.onerror = (event: any) => {
      if (event.error === 'not-allowed' || event.error === 'permission-denied') {
        setError('Microphone access was blocked. Allow it in your browser settings to use voice.');
      } else if (event.error !== 'no-speech' && event.error !== 'aborted') {
        setError('Voice recognition hit a snag — please try again or type instead.');
      }
      setIsListening(false);
      setInterimTranscript('');
      stopWaveform();
    };
    recognition.onend = () => {
      setIsListening(false);
      setInterimTranscript('');
      stopWaveform();
    };

    recognitionRef.current = recognition;
    recognition.start();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [selectedLanguage]);

  const stopListening = () => {
    recognitionRef.current?.stop?.();
  };

  const toggleSpeechRecognition = () => {
    if (isListening) stopListening();
    else startListening();
  };

  // ── Text-to-Speech, with live word-highlighting ─────────────────────────
  const pickVoice = (): SpeechSynthesisVoice | undefined => {
    const locale = LANGUAGE_LOCALES[selectedLanguage] || 'en-US';
    const voices = window.speechSynthesis.getVoices();
    return (
      voices.find(v => v.lang === locale) ||
      voices.find(v => v.lang.startsWith(locale.split('-')[0])) ||
      undefined
    );
  };

  const speak = (msgId: string, text: string) => {
    if (!('speechSynthesis' in window)) {
      setError('Text-to-speech is not supported in this browser.');
      return;
    }
    window.speechSynthesis.cancel();

    const utterance = new SpeechSynthesisUtterance(text);
    utterance.lang = LANGUAGE_LOCALES[selectedLanguage] || 'en-US';
    const voice = pickVoice();
    if (voice) utterance.voice = voice;
    utterance.rate = 1;

    utterance.onstart = () => setIsSpeaking(true);
    utterance.onboundary = (e: any) => {
      if (e.name !== 'word' && e.name !== undefined) return;
      const start = e.charIndex ?? 0;
      const rest = text.slice(start);
      const wordEnd = rest.search(/\s/);
      const end = start + (wordEnd === -1 ? rest.length : wordEnd);
      setSpeakingWordRange({ msgId, start, end });
    };
    utterance.onend = () => {
      setIsSpeaking(false);
      setSpeakingWordRange(null);
      utteranceRef.current = null;
      // Hands-free mode: re-open the mic automatically once the reply finishes.
      if (continuousModeRef.current) {
        setTimeout(() => startListening(), 400);
      }
    };
    utterance.onerror = () => {
      setIsSpeaking(false);
      setSpeakingWordRange(null);
    };

    utteranceRef.current = utterance;
    window.speechSynthesis.speak(utterance);
  };

  const stopSpeaking = () => {
    window.speechSynthesis.cancel();
    setIsSpeaking(false);
    setSpeakingWordRange(null);
  };

  // ── Send message → backend Gemini AI → optional spoken reply ───────────────
  const handleSendMessage = async (messageOverride?: string, fromVoice = false) => {
    const text = (messageOverride ?? inputMessage).trim();
    if (!text) return;

    const spokenReply = fromVoice || isVoiceInputRef.current || continuousModeRef.current;
    isVoiceInputRef.current = false;

    const userMsg: ChatMessage = { id: uid(), sender: 'family', text, time: nowTime() };
    setMessages(prev => [...prev, userMsg]);
    setInputMessage('');
    setIsThinking(true);
    setError(null);

    try {
      const { reply, source } = await api.familyVoice({
        userPatientId: activePatient?.id,
        patientName: activePatient?.name,
        roomNumber: activePatient?.roomNumber,
        statusTag: activePatient?.statusTag,
        query: text,
        language: LANGUAGE_NAMES[selectedLanguage] || 'English',
      });

      const replyId = uid();
      const escalated = ESCALATION_PATTERN.test(reply);
      setMessages(prev => [...prev, { id: replyId, sender: 'assistant', text: reply, time: nowTime(), source, escalated }]);

      if (spokenReply) speak(replyId, reply);
    } catch (err: any) {
      const replyId = uid();
      const errorText = 'Sorry, the Family Voice assistant is temporarily unavailable. Please try again in a moment.';
      setMessages(prev => [...prev, { id: replyId, sender: 'assistant', text: errorText, time: nowTime(), source: 'fallback' }]);
      if (spokenReply) speak(replyId, errorText);
    } finally {
      setIsThinking(false);
    }
  };

  const handleQuickQuestion = (q: string) => {
    handleSendMessage(q, false);
  };

  const toggleContinuousMode = () => {
    setContinuousMode(prev => {
      const next = !prev;
      if (!next) {
        stopListening();
        stopSpeaking();
      }
      return next;
    });
  };

  const quickQuestions = QUICK_QUESTIONS[selectedLanguage] || QUICK_QUESTIONS.en;

  // Renders a bubble's text with the currently-spoken word highlighted.
  const renderBubbleText = (msg: ChatMessage) => {
    if (!speakingWordRange || speakingWordRange.msgId !== msg.id) return msg.text;
    const { start, end } = speakingWordRange;
    return (
      <>
        {msg.text.slice(0, start)}
        <span className="bg-teal-400/40 rounded px-0.5">{msg.text.slice(start, end)}</span>
        {msg.text.slice(end)}
      </>
    );
  };

  return (
    <div className="space-y-6 pb-12 animate-in fade-in">

      {/* Top Banner */}
      <div className="bg-gradient-to-r from-[#002826] via-[#023b38] to-[#044c48] rounded-2xl p-6 text-white shadow-md relative overflow-hidden border border-teal-800/60 flex flex-col md:flex-row items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2 text-teal-300 text-xs font-semibold uppercase tracking-wider mb-1">
            <Sparkles className="w-4 h-4 text-teal-300" />
            AI Multilingual Voice Agent · Gemini-powered
          </div>
          <h1 className="text-xl font-bold tracking-tight text-white">{t.welcome}</h1>
          <p className="text-slate-200 text-xs mt-1">
            Speak or chat securely in English, Telugu, Hindi, Japanese, or Tamil.
          </p>
        </div>

        <div className="flex items-center gap-3">
          {/* Hands-free conversation toggle */}
          <button
            onClick={toggleContinuousMode}
            className={`flex items-center gap-2 px-3.5 py-2.5 rounded-xl border text-xs font-semibold transition-all ${
              continuousMode
                ? 'bg-rose-500/90 border-rose-400 text-white shadow-lg'
                : 'bg-[#01201e] border-teal-600/40 text-slate-200 hover:bg-[#023834]'
            }`}
            title="Hands-free: the assistant automatically listens again after each reply"
          >
            <Radio className={`w-3.5 h-3.5 ${continuousMode ? 'animate-pulse' : ''}`} />
            {continuousMode ? 'End Voice Session' : 'Start Hands-Free Session'}
          </button>

          <div className="flex items-center gap-3 bg-[#01201e] px-4 py-2.5 rounded-xl border border-teal-600/40 shadow-inner">
            <Globe className="w-4 h-4 text-teal-400" />
            <select
              value={selectedLanguage}
              onChange={(e) => setSelectedLanguage(e.target.value)}
              className="bg-[#003835] text-white text-xs font-semibold rounded-lg px-2.5 py-1.5 outline-none border border-teal-500/40 cursor-pointer"
            >
              <option value="en">English</option>
              <option value="te">తెలుగు (Telugu)</option>
              <option value="hi">हिन्दी (Hindi)</option>
              <option value="ja">日本語 (Japanese)</option>
              <option value="ta">தமிழ் (Tamil)</option>
            </select>
          </div>
        </div>
      </div>

      {/* Family Access Passcode Verification Bar */}
      <div className="bg-white rounded-2xl p-4 border border-slate-200 shadow-xs flex flex-col md:flex-row items-center justify-between gap-4">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-teal-50 border border-teal-200 text-teal-800 flex items-center justify-center font-bold">
            🔑
          </div>
          <div>
            <h3 className="font-bold text-slate-900 text-xs">Family Member Passcode Verification</h3>
            <p className="text-[11px] text-slate-500">Enter the access passcode provided by the receptionist upon intake to view your relative's room status.</p>
          </div>
        </div>
        <form onSubmit={(e) => {
          e.preventDefault();
          const code = passcode.trim().toUpperCase();
          if (!code) return;
          const found = patients.find(p => 
            p.familyPasscode?.toUpperCase() === code || 
            p.mrn?.toUpperCase() === code ||
            p.id.toUpperCase() === code
          );
          if (found) {
            setPasscodeSuccess(`✓ Access Verified for Patient ${found.name} (Room ${found.roomNumber})!`);
            setError(null);
          } else {
            setError(`Passcode "${code}" not found. Please verify the code given by the receptionist upon patient intake.`);
            setPasscodeSuccess(null);
          }
        }} className="flex items-center gap-2 w-full md:w-auto">
          <input
            type="text"
            placeholder="e.g. FAM-8821 or MRN"
            value={passcode}
            onChange={(e) => setPasscode(e.target.value)}
            className="px-3.5 py-2 rounded-xl bg-slate-50 border border-slate-300 text-xs font-mono uppercase font-bold focus:bg-white focus:border-teal-500 focus:outline-none w-full md:w-48"
          />
          <button
            type="submit"
            className="px-4 py-2 bg-teal-800 hover:bg-teal-900 text-white font-bold rounded-xl text-xs whitespace-nowrap transition-colors shadow-xs"
          >
            Verify Passcode
          </button>
        </form>
      </div>

      {passcodeSuccess && (
        <div className="bg-emerald-50 border border-emerald-200 text-emerald-800 rounded-xl px-4 py-2.5 text-xs font-bold flex items-center gap-2 animate-in fade-in">
          <ShieldCheck className="w-4 h-4 text-emerald-600 shrink-0" />
          {passcodeSuccess}
        </div>
      )}

      {/* Patient safe-context strip — real ServiceNow-backed patient, not hardcoded */}
      {activePatient && (
        <div className="bg-white rounded-xl border border-slate-200 px-4 py-3 flex items-center gap-4 text-xs shadow-xs">
          <div className="w-9 h-9 rounded-full bg-teal-50 border border-teal-200 flex items-center justify-center text-teal-800 font-bold text-[11px] shrink-0">
            {activePatient.initials}
          </div>
          <div className="flex-1 min-w-0">
            <span className="font-bold text-slate-800">{activePatient.name}</span>
            <span className="text-slate-400 mx-1.5">·</span>
            <span className="text-slate-500">Room {activePatient.roomNumber}</span>
            <span className="text-slate-400 mx-1.5">·</span>
            <span className="text-teal-700 font-medium">{activePatient.statusTag}</span>
          </div>
          <span className="text-[10px] text-slate-400 shrink-0">Only status-level info is shared with families</span>
        </div>
      )}

      {/* Error banner */}
      {error && (
        <div className="bg-rose-50 border border-rose-200 text-rose-800 rounded-xl px-4 py-2.5 text-xs flex items-center gap-2">
          <AlertTriangle className="w-4 h-4 shrink-0" />
          {error}
        </div>
      )}

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">

        {/* Chat / Voice Window */}
        <div className="lg:col-span-2 bg-white rounded-2xl border border-slate-200 p-5 shadow-xs flex flex-col h-[560px]">

          <div className="flex items-center justify-between pb-3 border-b border-slate-100 mb-4">
            <div className="flex items-center gap-2">
              <span className={`w-2.5 h-2.5 rounded-full ${continuousMode ? 'bg-rose-500 animate-pulse' : 'bg-emerald-500 animate-pulse'}`} />
              <h3 className="font-bold text-slate-900 text-sm">Bedside Nurse & Family Chat</h3>
            </div>
            <div className="flex items-center gap-2">
              {isSpeaking && (
                <button
                  onClick={stopSpeaking}
                  className="text-[11px] font-medium text-rose-700 bg-rose-50 px-2.5 py-1 rounded-full border border-rose-200 flex items-center gap-1 hover:bg-rose-100"
                >
                  <VolumeX className="w-3 h-3" /> Stop speaking
                </button>
              )}
              <span className="text-[11px] font-medium text-teal-700 bg-teal-50 px-2.5 py-1 rounded-full border border-teal-200 flex items-center gap-1">
                <Zap className="w-3 h-3" /> Voice Agent Active
              </span>
            </div>
          </div>

          {/* Live mic waveform */}
          {isListening && (
            <div className="bg-teal-50 border border-teal-300 text-teal-900 px-4 py-3 rounded-xl text-xs mb-3">
              <div className="flex items-center gap-2 mb-2">
                <Mic className="w-4 h-4 text-teal-600 animate-pulse" />
                <span className="font-semibold">Listening…</span>
              </div>
              <div className="flex items-end gap-[3px] h-10">
                {micLevels.map((h, i) => (
                  <span
                    key={i}
                    className="w-1.5 rounded-full bg-teal-500 transition-all duration-75"
                    style={{ height: `${h}px` }}
                  />
                ))}
              </div>
              {interimTranscript && (
                <p className="mt-2 italic text-teal-800">"{interimTranscript}"</p>
              )}
            </div>
          )}

          {/* AI thinking indicator */}
          {isThinking && (
            <div className="bg-slate-50 border border-slate-200 text-slate-600 px-4 py-2 rounded-xl text-xs flex items-center gap-2 mb-3">
              <Loader2 className="w-3.5 h-3.5 animate-spin" />
              <span className="font-medium">Family Voice assistant is thinking…</span>
            </div>
          )}

          {/* Messages Feed */}
          <div className="flex-1 overflow-y-auto space-y-4 pr-2">
            {messages.map((msg) => (
              <div key={msg.id} className={`flex flex-col ${msg.sender === 'family' ? 'items-end' : 'items-start'}`}>
                <div className="flex items-end gap-2 max-w-[90%]">
                  {msg.sender === 'assistant' && (
                    <div className="w-6 h-6 rounded-full bg-teal-100 border border-teal-200 flex items-center justify-center shrink-0 mb-1">
                      <Bot className="w-3.5 h-3.5 text-teal-700" />
                    </div>
                  )}
                  <div className={`p-4 rounded-2xl text-xs leading-relaxed shadow-xs relative group ${
                    msg.sender === 'family'
                      ? 'bg-[#002826] text-white rounded-br-xs'
                      : 'bg-slate-100 text-slate-800 rounded-bl-xs border border-slate-200'
                  }`}>
                    <p>{renderBubbleText(msg)}</p>

                    <button
                      onClick={() => speak(msg.id, msg.text)}
                      title="Listen via Voice Agent"
                      className="absolute -right-8 top-2 p-1.5 rounded-full bg-white border border-slate-200 text-teal-700 hover:bg-teal-50 shadow-sm opacity-0 group-hover:opacity-100 transition-opacity"
                    >
                      <Volume2 className="w-3.5 h-3.5" />
                    </button>
                  </div>
                  {msg.sender === 'family' && (
                    <div className="w-6 h-6 rounded-full bg-slate-200 flex items-center justify-center shrink-0 mb-1">
                      <UserIcon className="w-3.5 h-3.5 text-slate-600" />
                    </div>
                  )}
                </div>

                <div className="flex items-center gap-2 mt-1 px-1">
                  <span className="text-[10px] text-slate-400">{msg.time}</span>
                  {msg.sender === 'assistant' && msg.source && (
                    <span className={`text-[9px] font-semibold px-1.5 py-0.5 rounded-full border ${
                      msg.source === 'ai'
                        ? 'bg-teal-50 text-teal-700 border-teal-200'
                        : 'bg-amber-50 text-amber-700 border-amber-200'
                    }`}>
                      {msg.source === 'ai' ? 'Gemini AI' : 'Offline Assistant'}
                    </span>
                  )}
                  {msg.escalated && (
                    <span className="text-[9px] font-semibold px-1.5 py-0.5 rounded-full bg-rose-50 text-rose-700 border border-rose-200 flex items-center gap-1">
                      <Stethoscope className="w-2.5 h-2.5" /> Escalated to care team
                    </span>
                  )}
                </div>
              </div>
            ))}
            <div ref={messagesEndRef} />
          </div>

          {/* Quick question chips */}
          <div className="flex flex-wrap gap-2 pt-3">
            {quickQuestions.map((q) => (
              <button
                key={q}
                onClick={() => handleQuickQuestion(q)}
                disabled={isThinking}
                className="text-[11px] px-3 py-1.5 rounded-full border border-teal-200 bg-teal-50/60 text-teal-800 hover:bg-teal-100 transition-colors disabled:opacity-50"
              >
                {q}
              </button>
            ))}
          </div>

          {/* Input Box */}
          <div className="mt-3 pt-3 border-t border-slate-100 flex items-center gap-2">
            <button
              type="button"
              onClick={toggleSpeechRecognition}
              title="Click to speak your message"
              disabled={isThinking}
              className={`p-3 rounded-xl transition-all border shrink-0 ${
                isListening
                  ? 'bg-rose-500 text-white border-rose-600 animate-pulse shadow-lg'
                  : 'bg-teal-50 hover:bg-teal-100 text-teal-800 border-teal-200'
              } disabled:opacity-50`}
            >
              {isListening ? <MicOff className="w-4 h-4" /> : <Mic className="w-4 h-4" />}
            </button>

            <input
              type="text"
              value={inputMessage}
              onChange={(e) => {
                isVoiceInputRef.current = false;
                setInputMessage(e.target.value);
              }}
              onKeyDown={(e) => e.key === 'Enter' && handleSendMessage()}
              placeholder={t.placeholder}
              disabled={isThinking}
              className="flex-1 px-4 py-2.5 rounded-xl border border-slate-200 text-xs text-slate-800 focus:outline-none focus:border-teal-500 bg-slate-50 disabled:opacity-60"
            />

            <button
              onClick={() => handleSendMessage()}
              disabled={isThinking || !inputMessage.trim()}
              className="px-4 py-2.5 bg-teal-600 hover:bg-teal-500 text-white font-semibold rounded-xl text-xs transition-all flex items-center gap-1.5 shadow-sm disabled:opacity-60 disabled:cursor-not-allowed shrink-0"
            >
              <Send className="w-4 h-4" />
              Send
            </button>
          </div>
        </div>

        {/* Right Info Sidebar */}
        <div className="space-y-4">
          <div className="bg-white rounded-2xl border border-slate-200 p-5 shadow-xs">
            <div className="flex items-center justify-between mb-3">
              <h4 className="font-bold text-slate-900 text-xs flex items-center gap-1.5">
                <ShieldCheck className="w-4 h-4 text-teal-600" />
                HIPAA Authorized Contacts
              </h4>
              <span className="text-[10px] bg-teal-50 text-teal-800 font-bold px-2 py-0.5 rounded border border-teal-200">
                Passcode: 4892
              </span>
            </div>
            <div className="space-y-2 text-xs text-slate-600">
              <div className="p-2.5 bg-slate-50 rounded-xl border border-slate-100 flex items-center justify-between">
                <div>
                  <p className="font-bold text-slate-800">Eleanor Reynolds</p>
                  <p className="text-[10px] text-slate-500">Spouse • Primary Healthcare Proxy</p>
                </div>
                <PhoneCall className="w-3.5 h-3.5 text-teal-600 cursor-pointer" />
              </div>
            </div>
          </div>

          {activePatient && (activePatient.primaryNurse || activePatient.attendingPhysician) && (
            <div className="bg-white rounded-2xl border border-slate-200 p-5 shadow-xs">
              <h4 className="font-bold text-slate-900 text-xs mb-2 flex items-center gap-1.5">
                <Stethoscope className="w-4 h-4 text-teal-600" />
                Care Team
              </h4>
              <div className="text-[11px] text-slate-600 space-y-1.5">
                {activePatient.primaryNurse && <p><span className="text-slate-400">Nurse:</span> {activePatient.primaryNurse}</p>}
                {activePatient.attendingPhysician && <p><span className="text-slate-400">Physician:</span> {activePatient.attendingPhysician}</p>}
              </div>
            </div>
          )}

          <div className="bg-white rounded-2xl border border-slate-200 p-5 shadow-xs">
            <h4 className="font-bold text-slate-900 text-xs mb-2">Voice Agent Feature Highlights</h4>
            <ul className="text-[11px] text-slate-500 space-y-1.5 list-disc pl-4">
              <li>Real-time speech-to-text with live waveform + interim transcript.</li>
              <li>Hands-free conversation mode — the mic reopens automatically after each reply.</li>
              <li>Gemini-powered answers, restricted to safe status fields only.</li>
              <li>Spoken replies highlight each word as it's read aloud.</li>
              <li>Automatic escalation flag when a question needs a clinician.</li>
            </ul>
            {!voicesReady && (
              <p className="text-[10px] text-amber-600 mt-2">Loading system voices for speech playback…</p>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};