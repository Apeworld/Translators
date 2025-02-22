import { useState, useEffect, useRef, useCallback } from "react";

export default function WhisperTranslator() {
  const [text, setText] = useState("");
  const [translatedText, setTranslatedText] = useState("");
  const [language, setLanguage] = useState("en");
  const [isListening, setIsListening] = useState(false);
  const recognition = useRef(null);

  // 마이크 권한 요청 함수
  const requestMicrophonePermission = async () => {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      stream.getTracks().forEach(track => track.stop()); // 마이크 중지
      console.log("Microphone permission granted");
    } catch (error) {
      console.error("Microphone permission denied", error);
      alert("마이크 권한이 거부되었습니다. 브라우저 설정에서 마이크 사용을 허용해주세요.");
    }
  };

  // 음성 인식 초기화
  const initializeRecognition = () => {
    if (!("webkitSpeechRecognition" in window)) {
      alert("Your browser does not support speech recognition.");
      return;
    }

    if (!recognition.current) {
      recognition.current = new webkitSpeechRecognition();
      recognition.current.continuous = true;
      recognition.current.interimResults = true;
      recognition.current.lang = "ko-KR";

      recognition.current.onstart = () => {
        console.log("Speech recognition started");
        setIsListening(true);
      };

      recognition.current.onerror = (event) => {
        console.error("Speech recognition error", event);
        const errorMessage = event?.error ?? event?.message ?? event?.type ?? "Unknown error";
        alert(`음성 인식 오류 발생: ${errorMessage}`);
        setIsListening(false);
      };

      recognition.current.onend = () => {
        console.log("Speech recognition ended");
        setIsListening(false);
        // 음성 인식 종료 후 자동 재시작 (필요한 경우)
        if (isListening) {
          recognition.current.start();
        }
      };

      recognition.current.onresult = (event) => {
        if (!event?.results || event.results.length === 0) return;

        const finalTranscript = Array.from(event.results)
          .filter((result) => result.isFinal)
          .map((result) => result[0]?.transcript || "")
          .join(" ");

        setText(finalTranscript.trim());
        translateText(finalTranscript.trim());
      };
    }
  };

  // 음성 인식 시작
  const startListening = useCallback(async () => {
    try {
      await navigator.mediaDevices.getUserMedia({ audio: true }); // 마이크 권한 요청
      if (!recognition.current) {
        initializeRecognition();
      }
      recognition.current.start();
      setIsListening(true);
    } catch (error) {
      console.error("Error starting speech recognition", error);
      alert("마이크 사용이 차단되었습니다. 브라우저 설정에서 마이크 권한을 확인하고 다시 시도하세요.");
    }
  }, []);

  // 음성 인식 중지
  const stopListening = useCallback(() => {
    if (recognition.current) {
      try {
        recognition.current.stop();
        setIsListening(false);
      } catch (error) {
        console.error("Error stopping speech recognition", error);
      }
    }
  }, []);

  // 번역 API 요청
  const translateText = async (text) => {
    if (!text) return;
    try {
      const response = await fetch(
        `https://api.mymemory.translated.net/get?q=${encodeURIComponent(text)}&langpair=ko|${language}`
      );
      const data = await response.json();
      setTranslatedText(data?.responseData?.translatedText || "Translation error");
    } catch (error) {
      console.error("Translation API error", error);
      setTranslatedText("Translation failed. Please try again.");
    }
  };

  return (
    <div className="p-5 text-center">
      <h1 className="text-2xl font-bold mb-4">Whisper Translator</h1>
      <button 
        onClick={requestMicrophonePermission} 
        className="bg-green-500 text-white p-2 rounded mb-4"
      >
        마이크 권한 요청
      </button>
      <select 
        value={language} 
        onChange={(e) => setLanguage(e.target.value)} 
        className="border p-2 mb-4"
      >
        <option value="en">English</option>
        <option value="es">Spanish</option>
        <option value="fr">French</option>
        <option value="ja">Japanese</option>
        <option value="zh-CN">Chinese</option>
        <option value="ko">Korean</option>
        <option value="vi">Vietnamese</option>
      </select>
      <div className="mb-4">
        <button 
          onClick={isListening ? stopListening : startListening} 
          className="bg-blue-500 text-white p-2 rounded"
        >
          {isListening ? "Stop Listening" : "Start Listening"}
        </button>
      </div>
      <div className="mt-4 p-3 border rounded">
        <h2 className="font-bold">Recognized Text:</h2>
        <p>{text}</p>
      </div>
      <div className="mt-4 p-3 border rounded bg-gray-100">
        <h2 className="font-bold">Translated Text:</h2>
        <p>{translatedText}</p>
      </div>
    </div>
  );
}
