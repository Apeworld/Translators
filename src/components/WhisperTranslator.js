import { useState, useEffect, useRef, useCallback } from "react";

export default function MasonLiveTranslator() {
  const [text, setText] = useState("");
  const [translatedText, setTranslatedText] = useState("");
  const [inputLanguage, setInputLanguage] = useState("auto"); // 입력 언어 선택
  const [outputLanguage, setOutputLanguage] = useState("en"); // 번역 언어 선택
  const [isListening, setIsListening] = useState(false);
  const recognition = useRef(null);

  useEffect(() => {
    if (!window.SpeechRecognition && !window.webkitSpeechRecognition) {
      alert("Your browser does not support speech recognition.");
      return;
    }
  }, []);

  const requestMicrophonePermission = async () => {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      stream.getTracks().forEach(track => track.stop());
      console.log("Microphone permission granted");
    } catch (error) {
      console.error("Microphone permission denied", error);
      alert("마이크 권한이 필요합니다. 설정에서 브라우저의 마이크 사용을 허용해주세요.");
    }
  };

  const initializeRecognition = () => {
    if (recognition.current) return;

    try {
      const SpeechRecognition = window.SpeechRecognition || window.webkitSpeechRecognition;
      recognition.current = new SpeechRecognition();
      recognition.current.continuous = true;
      recognition.current.interimResults = true;
      recognition.current.lang = inputLanguage;

      recognition.current.onstart = () => {
        console.log("Speech recognition started");
        setIsListening(true);
      };

      recognition.current.onerror = (event) => {
        console.error("Speech recognition error", event);
        alert(`음성 인식 오류 발생: ${event.error || "Unknown error"}`);
        setIsListening(false);
      };

      recognition.current.onend = () => {
        console.log("Speech recognition ended");
        setIsListening(false);
      };

      recognition.current.onresult = async (event) => {
        if (!event.results || event.results.length === 0) return;

        const finalTranscript = Array.from(event.results)
          .filter((result) => result.isFinal)
          .map((result) => result[0]?.transcript || "")
          .join(" ");

        setText(finalTranscript.trim());
        translateText(finalTranscript.trim(), inputLanguage, outputLanguage);
      };
    } catch (error) {
      console.error("Error initializing speech recognition", error);
      alert("음성 인식을 초기화하는 동안 오류가 발생했습니다. 다시 시도하세요.");
    }
  };

  const startListening = useCallback(() => {
    if (!recognition.current) {
      console.log("Reinitializing speech recognition...");
      initializeRecognition();
    }
    try {
      recognition.current.lang = inputLanguage;
      recognition.current.start();
      setIsListening(true);
    } catch (error) {
      console.error("Error starting speech recognition", error);
      alert("음성 인식을 시작할 수 없습니다. 브라우저 설정을 확인하세요.");
    }
  }, [inputLanguage]);

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

  const translateText = async (text, sourceLang, targetLang) => {
    if (!text) return;
    try {
      const response = await fetch(
        `https://api.mymemory.translated.net/get?q=${encodeURIComponent(text)}&langpair=${sourceLang === "auto" ? "" : sourceLang}|${targetLang}`
      );
      const data = await response.json();
      setTranslatedText(data?.responseData?.translatedText || "Translation error");
    } catch (error) {
      console.error("Translation API error", error);
      setTranslatedText("Translation failed. Please try again.");
    }
  };

  return (
    <div className="p-8 max-w-lg mx-auto bg-white shadow-xl rounded-lg text-center">
      <h1 className="text-3xl font-bold mb-6 text-blue-600">Mason 실시간 번역기</h1>
      <button onClick={requestMicrophonePermission} className="bg-green-500 text-white py-2 px-4 rounded mb-4 shadow-md">
        마이크 권한 요청
      </button>
      <div className="flex gap-4 justify-center mb-4">
        <select value={inputLanguage} onChange={(e) => setInputLanguage(e.target.value)} className="border p-2 rounded">
          <option value="auto">Auto Detect</option>
          <option value="en">English</option>
          <option value="es">Spanish</option>
          <option value="fr">French</option>
          <option value="ja">Japanese</option>
          <option value="zh-CN">Chinese</option>
          <option value="ko">Korean</option>
          <option value="vi">Vietnamese</option>
        </select>
        <select value={outputLanguage} onChange={(e) => setOutputLanguage(e.target.value)} className="border p-2 rounded">
          <option value="en">English</option>
          <option value="es">Spanish</option>
          <option value="fr">French</option>
          <option value="ja">Japanese</option>
          <option value="zh-CN">Chinese</option>
          <option value="ko">Korean</option>
          <option value="vi">Vietnamese</option>
        </select>
      </div>
      <button onClick={isListening ? stopListening : startListening} className="bg-blue-500 text-white py-2 px-4 rounded shadow-md">
        {isListening ? "Stop Listening" : "Start Listening"}
      </button>
      <div className="mt-6 p-4 border rounded bg-gray-100 shadow-sm">
        <h2 className="font-semibold text-gray-700">Recognized Text:</h2>
        <p className="text-lg text-gray-900">{text}</p>
      </div>
      <div className="mt-4 p-4 border rounded bg-yellow-100 shadow-sm">
        <h2 className="font-semibold text-gray-700">Translated Text:</h2>
        <p className="text-lg text-gray-900">{translatedText}</p>
      </div>
    </div>
  );
}
