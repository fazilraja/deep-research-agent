import { Sparkles } from "lucide-react";
import React, { useState } from "react";

export type Document = {
    path: string;
    text: string;
};

type DocumentViewerProps = {
    documents: Document[];
    isVisible: boolean;
    onClose: () => void;
};

// Utility functions for document parsing
const extractDocumentId = (path: string): string => {
    // Extract filename without extension
    const match = path.match(/([^\/]+)(?=\.\w+$|$)/);
    return match ? match[0] : path;
};

const extractClassification = (doc: { path: string; text: string }): string | null => {
    // Look for classification markers in the text
    const classificationMatch = doc.text.match(/(CONFIDENTIAL|SECRET|TOP SECRET|UNCLASSIFIED)/i);
    return classificationMatch ? classificationMatch[0].toUpperCase() : null;
};

const extractDate = (doc: { path: string; text: string }): string | null => {
    // Look for dates in format MM/DD/YYYY or similar
    const dateMatch = doc.text.match(/\b(0?[1-9]|1[0-2])[\/\-](0?[1-9]|[12]\d|3[01])[\/\-](19\d{2}|20\d{2})\b/);
    return dateMatch ? dateMatch[0] : null;
};

const formatDocumentText = (text: string): React.ReactElement => {
    // Enhance formatting by highlighting dates, names, locations, etc.
    const highlightedText = text
        .replace(/\b\d{1,2}\/\d{1,2}\/\d{2,4}\b/g, match => `<span class="text-amber-400">${match}</span>`)
        .replace(/\b(CONFIDENTIAL|SECRET|TOP SECRET|UNCLASSIFIED)\b/gi, match =>
            `<span class="bg-red-900/30 text-red-400 px-1">${match}</span>`);

    return <div dangerouslySetInnerHTML={{ __html: highlightedText }} />;
};

// Add this helper function to parse and format the message content
const formatMessageContent = (content: string): React.ReactElement => {
    // Using more subdued colors with reduced opacity
    const formattedContent = content
        .replace(/\*\*(.*?)\*\*/g, '<span class="font-bold text-green-400/80">$1</span>')
        .replace(/\*(.*?)\*/g, '<span class="italic text-amber-400/80">$1</span>')
        .replace(/\(e\.g\.,\s(.*?)\)/g, '(e.g., <span class="text-blue-300/80">$1</span>)')
        .replace(/\(see document path:\s(.*?)\)/g, '(see document path: <span class="text-blue-400/80 underline">$1</span>)');

    return <div dangerouslySetInnerHTML={{ __html: formattedContent }} />;
};

export function DocumentViewer({ documents, isVisible, onClose }: DocumentViewerProps) {
    const [currentDocument, setCurrentDocument] = useState<Document | null>(
        documents.length > 0 ? documents[0] : null
    );
    const [summaryLoading, setSummaryLoading] = useState(false);
    const [summary, setSummary] = useState('');
    const [showSummary, setShowSummary] = useState(false);

    if (!currentDocument || documents.length === 0) {
        return null;
    }

    return (
        <div className={`fixed inset-y-0 left-0 w-[90vw] sm:w-[80vw] md:w-[70vw] lg:w-[60vw] xl:w-1/2 bg-gray-900/95 border-r border-green-900/30 transform transition-transform duration-300 z-20 flex flex-col ${isVisible ? 'translate-x-0' : '-translate-x-full'}`}>
            {/* Header */}
            <div className="flex items-center justify-between p-4 border-b border-green-900/30 bg-black/40">
                <div className="text-green-500/70 truncate text-sm font-mono">
                    {currentDocument.path}
                </div>
                <button
                    onClick={onClose}
                    className="text-gray-500 hover:text-green-400 transition-colors text-sm font-mono"
                >
                    [close]
                </button>
            </div>

            {/* Document metadata */}
            <div className="bg-black/30 p-3 border-b border-green-900/30">
                <div className="grid grid-cols-2 gap-2 text-xs font-mono">
                    <div className="text-gray-400">Document ID:</div>
                    <div className="text-green-400 truncate">{extractDocumentId(currentDocument.path)}</div>
                    <div className="text-gray-400">Classification:</div>
                    <div className="text-amber-400">{extractClassification(currentDocument) || "Unclassified"}</div>
                    <div className="text-gray-400">Date:</div>
                    <div className="text-green-400">{extractDate(currentDocument) || "Unknown"}</div>
                </div>
            </div>

            {/* Document selector tabs */}
            {documents.length > 0 && (
                <div className="border-b border-green-900/30 bg-black/20 overflow-x-auto">
                    <div className="flex py-1 justify-between items-center pr-2">
                        <div className="flex">
                            {documents.map((doc, idx) => (
                                <button
                                    key={idx}
                                    onClick={() => {
                                        setCurrentDocument(doc);
                                        setShowSummary(false); // Reset summary when changing doc
                                    }}
                                    className={`px-3 py-2 text-xs whitespace-nowrap ${documents.indexOf(currentDocument) === idx
                                        ? "border-b-2 border-green-400 text-green-400"
                                        : "text-green-400/50 hover:text-green-400 hover:bg-black/30"
                                        } transition-colors`}
                                >
                                    Doc {idx + 1}
                                </button>
                            ))}
                        </div>
                        <button
                            onClick={async () => {
                                try {
                                    if (showSummary) {
                                        setShowSummary(false);
                                        return;
                                    }

                                    setSummaryLoading(true);
                                    setSummary('');
                                    setShowSummary(true); // Show summary view immediately with loading state

                                    const response = await fetch(`${process.env.NEXT_PUBLIC_API_URL_SUMMARY!}?text=${encodeURIComponent(currentDocument!.text)}`, {
                                        method: 'POST',
                                        headers: { 'Content-Type': 'application/json' }
                                    });

                                    if (!response.ok) throw new Error('Failed to summarize');

                                    const reader = response.body?.getReader();
                                    if (!reader) throw new Error('No reader available');

                                    const decoder = new TextDecoder();

                                    while (true) {
                                        const { done, value } = await reader.read();
                                        if (done) break;

                                        const chunk = decoder.decode(value);
                                        const lines = chunk.split('\n\n');

                                        for (const line of lines) {
                                            if (line.startsWith('data: ')) {
                                                const content = line.substring(6);
                                                if (content.startsWith('[ERROR]')) {
                                                    throw new Error(content.substring(8));
                                                }
                                                setSummary(prev => prev + content);
                                            }
                                        }
                                    }
                                } catch (error) {
                                    console.error('Summarization error:', error);
                                    setSummary('Error generating summary. Please try again.');
                                } finally {
                                    setSummaryLoading(false);
                                }
                            }}
                            className={`flex items-center justify-center px-2 py-1 text-xs rounded-md transition-colors ${showSummary ? 'bg-amber-400/20 text-amber-400' : 'text-amber-400/70 hover:text-amber-400 hover:bg-gray-800/30'}`}
                            disabled={summaryLoading}
                            title="Summarize document"
                        >
                            {summaryLoading ? (
                                <svg className="animate-spin h-4 w-4" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                                    <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                                    <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                                </svg>
                            ) : (
                                <Sparkles size={16} />
                            )}
                        </button>
                    </div>
                </div>
            )}

            {/* Content with enhanced formatting */}
            <div className="flex-1 overflow-y-auto p-4 font-mono text-gray-300 text-sm leading-relaxed scrollbar-thin scrollbar-thumb-gray-800/40 hover:scrollbar-thumb-gray-700/40 scrollbar-track-transparent">
                <div className="prose prose-invert max-w-none prose-pre:bg-black/30 prose-pre:border prose-pre:border-green-900/30">
                    {showSummary ? (
                        <div className="bg-green-900/10 border border-green-900/30 p-3 rounded-md">
                            <div className="flex items-center justify-between mb-2">
                                <h3 className="text-green-400 text-sm font-semibold">Document Summary</h3>
                            </div>
                            <div className="text-gray-300">
                                {formatMessageContent(summary || "Generating summary...")}
                            </div>
                        </div>
                    ) : (
                        formatDocumentText(currentDocument.text)
                    )}
                </div>
            </div>
        </div>
    );
}