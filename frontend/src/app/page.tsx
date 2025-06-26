"use client";
import { FormEvent, useState } from "react";
import { ChatInterface, Message } from "./components/ChatInterface";

export default function Home() {
  const [messages, setMessages] = useState<Message[]>([]);
  const [input, setInput] = useState("");
  const [chatHistory, setChatHistory] = useState<string[]>([]);
  const [showSupport, setShowSupport] = useState(false);
  const [hasShownSupport, setHasShownSupport] = useState(false);

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault();
    if (!input.trim()) return;

    if (messages.length >= 3 && !hasShownSupport) {
      setShowSupport(true);
      setHasShownSupport(true);
    }

    const userMessage: Message = { content: input, isBot: false };
    setMessages(prev => [...prev, userMessage, { content: "", isBot: true }]);
    const currentInput = input;
    setInput("");

    try {
      const apiUrl = new URL(process.env.NEXT_PUBLIC_API_URL!);
      apiUrl.searchParams.set('query', currentInput);
      apiUrl.searchParams.set('max_iterations', '10');
      
      const response = await fetch(apiUrl.toString(), {
        method: 'GET',
        headers: { 'Accept': 'text/plain' }
      });

      const reader = response.body?.getReader();
      const decoder = new TextDecoder();
      let fullContent = "";

      if (!reader) throw new Error("No reader available");

      while (true) {
        const { done, value } = await reader.read();
        if (done) break;

        const chunk = decoder.decode(value);
        const lines = chunk.split('\n');

        for (const line of lines) {
          if (!line.trim()) continue;  // Skip empty lines
          if (line.startsWith('data: ')) {
            const content = line.replace('data: ', '');
            try {
              const data = JSON.parse(content);
              
              if (data.status === 'error') {
                setMessages(prev => {
                  const newMessages = [...prev];
                  const lastMessage = newMessages[newMessages.length - 1];
                  lastMessage.content = `Error: ${data.message}`;
                  return newMessages;
                });
                continue;
              }

              if (data.status === 'processing') {
                setMessages(prev => {
                  const newMessages = [...prev];
                  const lastMessage = newMessages[newMessages.length - 1];
                  lastMessage.content = data.message;
                  return newMessages;
                });
                continue;
              }

              if (data.status === 'completed') {
                fullContent = data.result.final_response;
                setMessages(prev => {
                  const newMessages = [...prev];
                  const lastMessage = newMessages[newMessages.length - 1];
                  lastMessage.content = fullContent;
                  lastMessage.responseTime = `${data.result.iterations} iterations, ${data.result.total_tokens} tokens`;
                  return newMessages;
                });
                break;
              }

            } catch (e) {
              console.error('Failed to parse JSON:', e);
            }
          }
        }
      }

      const userHistoryMessage = `USER: ${currentInput}`;
      const botHistoryMessage = `ASSISTANT: ${fullContent}`;
      setChatHistory(prev => [...prev.slice(-4), userHistoryMessage, botHistoryMessage]);

    } catch (err: unknown) {
      console.error('Chat error:', err);
      setMessages(prev => {
        const newMessages = [...prev];
        const lastMessage = newMessages[newMessages.length - 1];
        lastMessage.content += "\n\nConnection Error: Message may be incomplete.";
        return newMessages;
      });
    }
  };

  return (
    <ChatInterface
      messages={messages}
      input={input}
      onInputChange={setInput}
      onSubmit={handleSubmit}
    />
  );
}
