"use client";

import { Mic, MicOff } from "lucide-react";
import { useEffect, useRef, useState } from "react";
import { Button } from "@/components/ui/button";
import { toast } from "@/hooks/use-toast";

type SpeechRecognitionResultRow = { isFinal: boolean; 0: { transcript: string } };
type SpeechRecognitionResultList = {
  length: number;
  [i: number]: SpeechRecognitionResultRow;
};
type SpeechRecognitionResultEvent = {
  resultIndex: number;
  results: SpeechRecognitionResultList;
};

type WebSpeechRecognition = {
  continuous: boolean;
  interimResults: boolean;
  lang: string;
  start(): void;
  stop(): void;
  onresult: ((ev: SpeechRecognitionResultEvent) => void) | null;
  onerror: (() => void) | null;
  onend: (() => void) | null;
};

function getSpeechRecognitionCtor(): (new () => WebSpeechRecognition) | null {
  if (typeof window === "undefined") return null;
  const w = window as unknown as {
    SpeechRecognition?: new () => WebSpeechRecognition;
    webkitSpeechRecognition?: new () => WebSpeechRecognition;
  };
  return w.SpeechRecognition ?? w.webkitSpeechRecognition ?? null;
}

type Props = {
  disabled?: boolean;
  onTranscript: (text: string) => void;
};

export function SpeechInputButton({ disabled, onTranscript }: Props) {
  const [recording, setRecording] = useState(false);
  const [speechOk, setSpeechOk] = useState(false);
  const recognitionRef = useRef<WebSpeechRecognition | null>(null);

  useEffect(() => {
    setSpeechOk(!!getSpeechRecognitionCtor());
  }, []);

  useEffect(() => {
    return () => {
      try {
        recognitionRef.current?.stop();
      } catch {
        /* ignore */
      }
    };
  }, []);

  if (!speechOk) return null;

  function startVoice() {
    const Ctor = getSpeechRecognitionCtor();
    if (!Ctor || disabled) return;

    if (recording) {
      try {
        recognitionRef.current?.stop();
      } catch {
        /* ignore */
      }
      setRecording(false);
      return;
    }

    const recognition = new Ctor();
    recognitionRef.current = recognition;
    recognition.continuous = false;
    recognition.interimResults = false;
    recognition.lang = "nl-NL";

    recognition.onresult = (event: SpeechRecognitionResultEvent) => {
      let transcript = "";
      for (let i = event.resultIndex; i < event.results.length; i++) {
        const row = event.results[i];
        if (row?.isFinal) {
          transcript += row[0]?.transcript ?? "";
        }
      }
      transcript = transcript.trim();
      if (transcript) onTranscript(transcript);
    };

    recognition.onerror = () => {
      setRecording(false);
      toast({
        description: "Spraakinvoer mislukt — typ je tekst handmatig",
        variant: "destructive",
      });
    };

    recognition.onend = () => {
      setRecording(false);
      recognitionRef.current = null;
    };

    try {
      recognition.start();
      setRecording(true);
    } catch {
      setRecording(false);
      toast({
        description: "Spraakinvoer mislukt — typ je tekst handmatig",
        variant: "destructive",
      });
    }
  }

  return (
    <Button
      type="button"
      variant="outline"
      size="sm"
      disabled={disabled}
      className={`h-11 min-h-[44px] w-11 min-w-[44px] shrink-0 rounded-full p-0 ${
        recording
          ? "animate-pulse border-red-500 text-red-600 hover:border-red-500 hover:text-red-600"
          : ""
      }`}
      onClick={() => startVoice()}
      aria-label={recording ? "Stop spraakinvoer" : "Spreek in"}
    >
      {recording ? <MicOff className="h-4 w-4" /> : <Mic className="h-4 w-4" />}
    </Button>
  );
}
