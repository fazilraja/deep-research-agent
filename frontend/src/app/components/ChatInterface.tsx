import React, { FormEvent, useEffect, useRef, useState } from "react";
import { DocumentViewer, Document } from "./DocumentViewer";

export type Message = {
    content: string;
    isBot: boolean;
    responseTime?: string;
    documents?: Document[];
};

type ChatInterfaceProps = {
    messages: Message[];
    input: string;
    onInputChange: (value: string) => void;
    onSubmit: (e: FormEvent) => void;
};

// Helper function to parse and format the message content
const formatMessageContent = (content: string): React.ReactElement => {
    // Using more subdued colors with reduced opacity
    const formattedContent = content
        .replace(/\*\*(.*?)\*\*/g, '<span class="font-bold text-green-400/80">$1</span>')
        .replace(/\*(.*?)\*/g, '<span class="italic text-amber-400/80">$1</span>')
        .replace(/\(e\.g\.,\s(.*?)\)/g, '(e.g., <span class="text-blue-300/80">$1</span>)')
        .replace(/\(see document path:\s(.*?)\)/g, '(see document path: <span class="text-blue-400/80 underline">$1</span>)');

    return <div dangerouslySetInnerHTML={{ __html: formattedContent }} />;
};

export function ChatInterface({
    messages,
    input,
    onInputChange,
    onSubmit
}: ChatInterfaceProps) {
    const messagesEndRef = useRef<HTMLDivElement>(null);
    const [documentViewerVisible, setDocumentViewerVisible] = useState(false);
    const [currentDocuments, setCurrentDocuments] = useState<Document[]>([]);
    const [isTransitioning, setIsTransitioning] = useState(false);

    useEffect(() => {
        messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
    }, [messages]);

    // Function to handle opening documents from a specific message
    const handleOpenDocuments = (docs: Document[] | undefined) => {
        if (docs && docs.length > 0) {
            setCurrentDocuments(docs);
            setDocumentViewerVisible(true);
        }
    };

    // Enhanced submitQuestion with transition handling
    const submitQuestion = (question: string) => {
        // Start transition if this is the first message
        if (messages.length === 0) {
            setIsTransitioning(true);
        }

        // Update input
        onInputChange(question);

        // Submit with delay
        setTimeout(() => {
            const submitButton = document.querySelector('button[type="submit"]');
            if (submitButton) {
                (submitButton as HTMLButtonElement).click();
            }

            // End transition after the form is submitted
            setTimeout(() => {
                setIsTransitioning(false);
            }, 300); // Short delay after submission
        }, 50);
    };

    // Handle custom form submission to apply transition effect
    const handleSubmit = (e: FormEvent) => {
        if (messages.length === 0) {
            setIsTransitioning(true);
            onSubmit(e);
            setTimeout(() => setIsTransitioning(false), 300);
        } else {
            onSubmit(e);
        }
    };

    return (
        <div className="flex flex-col min-h-screen h-screen">
            <div className="fixed inset-0 pointer-events-none noise-overlay opacity-[0.15] -z-10" />

            <main className="flex-1 flex w-full relative">
                {/* Document Viewer Component */}
                <DocumentViewer
                    documents={currentDocuments}
                    isVisible={documentViewerVisible}
                    onClose={() => setDocumentViewerVisible(false)}
                />

                {/* Main Chat Area - responsive margin based on screen size */}
                <div className={`flex-1 flex flex-col min-h-screen transition-all duration-300 ${documentViewerVisible
                    ? 'ml-[90vw] sm:ml-[80vw] md:ml-[70vw] lg:ml-[60vw] xl:ml-1/2'
                    : 'ml-0'
                    } ${isTransitioning ? 'opacity-40' : 'opacity-100'}`}>
                    <div className="sticky top-0 z-10 backdrop-blur-sm mb-6 -mx-2 sm:-mx-6 px-2 sm:px-6 py-2 flex items-center justify-center">
                        <div className="flex items-center justify-center max-w-4xl mx-auto w-full">
                            <div className="flex items-center gap-2 sm:gap-4">
                                <h1 className="text-lg sm:text-xl font-mono text-gray-400 truncate px-2 sm:px-4 py-2">
                                    Deep Research <span className="text-green-500/50">●</span>
                                </h1>
                            </div>
                        </div>
                    </div>

                    {messages.length > 0 ? (
                        <>
                            <div className="flex-1 overflow-y-auto mb-2 pr-2 sm:pr-4 scrollbar-thin scrollbar-thumb-gray-800/40 hover:scrollbar-thumb-gray-700/40 scrollbar-track-transparent min-h-0">
                                <div className="flex flex-col space-y-6 max-w-4xl mx-auto w-full p-2 sm:p-6">
                                    {messages.map((message, index) => (
                                        <div key={index} className={`group flex flex-col space-y-2 animate-fade-in ${message.isBot ? "" : "items-end"}`}>
                                            <div className={`flex items-center space-x-2 text-xs font-mono ${message.isBot ? "text-gray-500" : "text-gray-500 flex-row-reverse space-x-reverse"}`}>
                                                <span>{message.isBot ? "AI" : "You"}</span>
                                            </div>
                                            <div className="inline-block max-w-[85%]">
                                                <div className={`inline-block p-3 font-mono text-sm backdrop-blur-sm rounded-lg ${message.isBot
                                                    ? "bg-gray-900/20 border border-gray-800/50 shadow-sm shadow-green-900/10"
                                                    : "bg-gray-700/20 border border-gray-800/50 hover:border-gray-700/50"
                                                    }`}>
                                                    {message.isBot && !message.content ? (
                                                        <div className="flex items-center space-x-2">
                                                            <div className="w-2 h-2 bg-gray-400 rounded-full animate-pulse" />
                                                            <div className="w-2 h-2 bg-gray-400 rounded-full animate-pulse [animation-delay:200ms]" />
                                                            <div className="w-2 h-2 bg-gray-400 rounded-full animate-pulse [animation-delay:400ms]" />
                                                        </div>
                                                    ) : (
                                                        <div className="whitespace-pre-wrap text-gray-200">
                                                            {formatMessageContent(message.content)}
                                                        </div>
                                                    )}

                                                    {/* Document inspection button with updated styling */}
                                                    {message.isBot && message.documents && message.documents.length > 0 && (
                                                        <div className="mt-3 pt-3 border-t border-gray-800 flex items-center space-x-3">
                                                            <button
                                                                onClick={() => handleOpenDocuments(message.documents)}
                                                                className="text-xs py-1.5 px-3 bg-gray-900 border border-gray-800/50 text-gray-300 hover:text-gray-200 hover:bg-gray-800/60 transition-all rounded-lg flex items-center space-x-1.5"
                                                            >
                                                                <svg xmlns="http://www.w3.org/2000/svg" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                                                                    <path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z"></path>
                                                                    <circle cx="12" cy="12" r="3"></circle>
                                                                </svg>
                                                                <span>Inspect Documents ({message.documents.length})</span>
                                                            </button>
                                                        </div>
                                                    )}
                                                </div>
                                            </div>
                                        </div>
                                    ))}
                                    <div ref={messagesEndRef} />
                                </div>
                            </div>

                            <div className="w-full max-w-4xl mx-auto sticky bottom-4 px-4">
                                <form
                                    onSubmit={handleSubmit}
                                    className="flex gap-2 items-center bg-gray-900/20 border border-gray-800/30 rounded-lg backdrop-blur-md relative shadow-lg shadow-green-900/10"
                                >
                                    <input
                                        type="text"
                                        value={input}
                                        onChange={(e) => onInputChange(e.target.value)}
                                        placeholder="Type your message..."
                                        className="flex-1 p-3 bg-transparent font-mono text-base focus:outline-none text-gray-100 placeholder-gray-600 min-w-0"
                                    />
                                    <button
                                        type="submit"
                                        className="h-full px-4 py-3 text-gray-400 hover:text-green-400 transition-colors"
                                    >
                                        →
                                    </button>
                                </form>
                            </div>
                        </>
                    ) : (
                        <div className={`flex-1 flex flex-col items-center justify-center px-4 transition-opacity duration-300 ${isTransitioning ? 'opacity-0' : 'opacity-100'}`}>
                            <div className="w-full max-w-2xl mx-auto bg-gray-900/30 rounded-md border border-gray-800/40 p-5 shadow-md animate-fade-in">
                                <div className="flex flex-col items-center mb-5">
                                    <h2 className="text-3xl font-mono font-bold mb-3 text-green-400">
                                        Deep Research
                                    </h2>
                                </div>

                                <form
                                    onSubmit={handleSubmit}
                                    className="relative mb-3"
                                >
                                    <div className="relative flex items-center bg-gray-900/70 border border-gray-700/60 rounded-md overflow-hidden">
                                        <input
                                            type="text"
                                            value={input}
                                            onChange={(e) => onInputChange(e.target.value)}
                                            placeholder="Ask a question..."
                                            className="flex-1 p-3 bg-transparent font-mono text-base focus:outline-none text-white placeholder-gray-500 min-w-0"
                                            autoFocus
                                        />
                                        <button
                                            type="submit"
                                            className="h-full px-4 text-white"
                                            aria-label="Send message"
                                        >
                                            →
                                        </button>
                                    </div>
                                </form>

                                <div className="grid grid-cols-1 gap-2 mt-3 sm:grid-cols-3">
                                    <button
                                        onClick={() => submitQuestion("What are the latest research findings?")}
                                        className="p-2 rounded-md bg-gray-900/70 border border-gray-700/50 hover:border-white text-white text-sm font-mono text-left transition-all"
                                    >
                                        Latest Findings
                                    </button>
                                    <button
                                        onClick={() => submitQuestion("Analyze recent research trends")}
                                        className="p-2 rounded-md bg-gray-900/70 border border-gray-700/50 hover:border-white text-white text-sm font-mono text-left transition-all"
                                    >
                                        Research Trends
                                    </button>
                                    <button
                                        onClick={() => submitQuestion("Find patterns in the data")}
                                        className="p-2 rounded-md bg-gray-900/70 border border-gray-700/50 hover:border-white text-white text-sm font-mono text-left transition-all"
                                    >
                                        Data Patterns
                                    </button>
                                </div>
                            </div>
                        </div>
                    )}
                </div>
            </main>
        </div>
    );
} 