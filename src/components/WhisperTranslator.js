import { useState, useEffect, useRef, useCallback } from "react";

export default function MasonLiveTranslator() {
  const [text, setText] = useState("");
  const [translatedText, setTranslatedText] = useState("");
  const [language, setLanguage] = useState("en");
  const [isListening, setIsListening] = useState(false);
  const recognition = useRef(null);

  useEffect(() => {
    if (!("webkitSpeechRecognition" in window)) {
      alert("Your browser does not support speech recognition.");
      return;
    }
  }, []);

  const initializeRecognition = () => {
    if (recognition.current) return;

    try {
      recognition.current = new webkitSpeechRecognition();
      recognition.current.continuous = true;
      recognition.current.interimResults = true;
      recognition.current.lang = "auto"; // 자동 감지

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

        const detectedLang = await detectLanguage(finalTranscript.trim());
        console.log("Detected Language:", detectedLang);
        translateText(finalTranscript.trim(), detectedLang, language);
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
      recognition.current.start();
      setIsListening(true);
    } catch (error) {
      console.error("Error starting speech recognition", error);
      alert("음성 인식을 시작할 수 없습니다. 브라우저 설정을 확인하세요.");
    }
  }, []);

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

  const detectLanguage = async (text) => {
    try {
      const response = await fetch(
        `https://api.mymemory.translated.net/get?q=${encodeURIComponent(text)}&langpair=auto|en`
      );
      const data = await response.json();
      return data?.responseData?.match?.language || "en";
    } catch (error) {
      console.error("Language detection error", error);
      return "en";
    }
  };

  const translateText = async (text, sourceLang, targetLang) => {
    if (!text) return;
    try {
      const response = await fetch(
        `https://api.mymemory.translated.net/get?q=${encodeURIComponent(text)}&langpair=${sourceLang}|${targetLang}`
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
      <h1 className="text-2xl font-bold mb-4">Mason 실시간 번역기</h1>
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
