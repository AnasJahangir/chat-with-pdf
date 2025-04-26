import { useEffect, useRef, useState } from "react";
import PdfUpload from "./components/PdfUpload";
import ChatBox from "./components/ChatBox";
import { getDocument, GlobalWorkerOptions } from "pdfjs-dist";
import pdfWorker from "pdfjs-dist/build/pdf.worker?url";

GlobalWorkerOptions.workerSrc = pdfWorker;
const LoadingSpinner = () => (
  <div className="flex justify-center items-center mt-4">
    <div className="w-6 h-6 border-4 border-t-4 border-gray-400 border-t-transparent rounded-full animate-spin"></div>
  </div>
);
function App() {
  const [pdfText, setPdfText] = useState("");
  const [chatLog, setChatLog] = useState([]);

  const handleFileSelect = async (file) => {
    if (file) {
      const fileReader = new FileReader();
      fileReader.onload = async function () {
        const typedarray = new Uint8Array(this.result);
        const pdf = await getDocument({ data: typedarray }).promise;
        let textContent = "";

        for (let i = 1; i <= pdf.numPages; i++) {
          const page = await pdf.getPage(i);
          const text = await page.getTextContent();
          const pageText = text.items.map((item) => item.str).join(" ");
          textContent += pageText + "\n";
        }

        setPdfText(textContent);
      };
      fileReader.readAsArrayBuffer(file);
    }
  };
  const getTimestamp = () => {
    const now = new Date();
    return `${now.getHours()}:${
      now.getMinutes() < 10 ? "0" : ""
    }${now.getMinutes()}`;
  };

  const handleSendMessage = async (userMessage) => {
    setChatLog((prev) => [...prev, { type: "user", message: userMessage }]);

    const assistantReply = await getAssistantReply(userMessage, pdfText);

    setChatLog((prev) => [
      ...prev,
      { type: "assistant", message: assistantReply },
    ]);
  };
  const getRelevantText = (userQuestion, contextText) => {
    // Split the user question into individual words
    const queryWords = userQuestion.toLowerCase().split(" ");

    // Split the contextText into lines or paragraphs
    const relevantText = contextText
      .split("\n")
      .filter((line) => {
        // Check if at least one word in the query exists in the current line
        return queryWords.some((word) => line.toLowerCase().includes(word));
      })
      .join("\n");

    return relevantText;
  };
  const chunkText = (text, maxWords) => {
    const words = text.split(" "); // Split text into words
    const chunks = []; // Array to store chunks

    // Create chunks of maxWords size
    while (words.length > 0) {
      chunks.push(words.splice(0, maxWords).join(" ")); // Add a chunk
    }

    return chunks; // Return all chunks
  };
  const getAssistantReply = async (userQuestion, contextText) => {
    try {
      const relevantText = getRelevantText(userQuestion, contextText);

      if (!relevantText)
        return "No relevant information found in the document.";

      const MAX_WORDS = 300; // Max words allowed in a single chunk
      const words = relevantText.split(" ");

      let finalContext = "";

      if (words.length > MAX_WORDS) {
        // If relevant text is too large, create chunks
        const chunks = chunkText(relevantText, MAX_WORDS);

        // You can either:
        // 1. Pick top few chunks
        // 2. Merge first few chunks
        // Here, merging first 2 chunks as example:
        finalContext = chunks.slice(0, 2).join(" ");
      } else {
        // If relevant text is small, use as it is
        finalContext = relevantText;
      }

      const response = await fetch(
        "https://openrouter.ai/api/v1/chat/completions",
        {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${import.meta.env.VITE_OPENROUTER_API_KEY}`,
          },
          body: JSON.stringify({
            model: "openai/gpt-3.5-turbo",
            messages: [
              {
                role: "system",
                content: `Only answer based on this context:\n\n${finalContext}`,
              },
              { role: "user", content: userQuestion },
            ],
            temperature: 0.2,
          }),
        }
      );

      const data = await response.json();
      return data.choices[0].message.content.trim();
    } catch (error) {
      console.error(error);
      return "Something went wrong.";
    }
  };
  const chatContainerRef = useRef(null);

  useEffect(() => {
    if (chatContainerRef.current) {
      chatContainerRef.current.scrollTop =
        chatContainerRef.current.scrollHeight;
    }
  }, [chatLog]);
  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-900 to-black flex flex-col items-center p-4">
      <h1 className="text-4xl md:text-5xl font-extrabold text-transparent bg-clip-text bg-gradient-to-r from-purple-400 to-pink-600 animate-fade-down mb-8">
        Chat with PDF
      </h1>

      <div className="w-full max-w-2xl flex flex-col gap-6">
        <div className="bg-gray-800 p-6 rounded-2xl shadow-lg animate-fade-up">
          <PdfUpload onFileSelect={handleFileSelect} />
        </div>

        {pdfText && (
          <>
            <div className="bg-gray-800 p-6 rounded-2xl shadow-lg animate-fade-up">
              <ChatBox onSend={handleSendMessage} />
            </div>
            <div
              ref={chatContainerRef}
              className="bg-gray-800 mt-6 rounded-2xl shadow-2xl p-6 flex flex-col gap-4 overflow-y-auto max-h-[60vh] overflow-x-hidden animate-fade-up custom-scrollbar"
            >
              {chatLog.map((chat, index) => (
                <div
                  key={index}
                  className={`p-4 rounded-2xl transition-all duration-700 ease-in-out transform hover:scale-105 hover:shadow-lg ${
                    chat.type === "user"
                      ? "bg-gradient-to-br from-purple-600 via-pink-500 to-red-500 text-white self-end animate-bounce-in-right"
                      : "bg-gray-700 text-gray-200 self-start animate-bounce-in-left"
                  }`}
                >
                  <div>{chat.message}</div>
                  <div className={`${ chat.type === "user"?"text-gray-100":"text-gray-500"} text-xs mt-1`}>
                    {getTimestamp()}
                  </div>
                </div>
              ))}
            </div>
          </>
        )}
      </div>
    </div>
  );
}

export default App;
