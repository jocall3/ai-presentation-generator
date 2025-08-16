import React, { useState, useRef, useEffect } from 'react';
import type { ChatMessage } from '../types';
import { SparklesIcon, ChatBubbleLeftRightIcon } from './Icons';

interface ChatPanelProps {
    messages: ChatMessage[];
    isAnswering: boolean;
    onAsk: (question: string) => void;
    isContained?: boolean;
}

const ChatPanel: React.FC<ChatPanelProps> = ({ messages, isAnswering, onAsk, isContained = false }) => {
    const [input, setInput] = useState('');
    const messagesEndRef = useRef<HTMLDivElement>(null);

    const scrollToBottom = () => {
        messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
    }

    useEffect(() => {
        scrollToBottom();
    }, [messages, isAnswering]);

    const handleSubmit = (e: React.FormEvent) => {
        e.preventDefault();
        if (input.trim() && !isAnswering) {
            onAsk(input);
            setInput('');
        }
    };

    return (
        <div className="h-full flex flex-col p-4">
            <h3 className="font-bold mb-3 text-indigo-300 flex items-center">
                <ChatBubbleLeftRightIcon className="w-5 h-5 mr-2" />
                {isContained ? 'Ask AI About This Slide' : 'Ask AI About Your Presentation'}
            </h3>
            <div className="flex-grow bg-gray-800/70 rounded-lg p-2 overflow-y-auto">
                <div className="space-y-4">
                    {messages.map((msg, index) => (
                        <div key={index} className={`flex ${msg.role === 'user' ? 'justify-end' : 'justify-start'}`}>
                            <div className={`max-w-xs lg:max-w-sm px-3 py-2 rounded-lg ${msg.role === 'user' ? 'bg-indigo-600 text-white' : 'bg-gray-700 text-gray-200'}`}>
                                <p className="text-sm whitespace-pre-wrap">{msg.content}</p>
                            </div>
                        </div>
                    ))}
                     {isAnswering && (
                        <div className="flex justify-start">
                             <div className="max-w-xs lg:max-w-sm px-3 py-2 rounded-lg bg-gray-700 text-gray-200">
                                <div className="flex items-center space-x-2">
                                    <SparklesIcon className="w-4 h-4 animate-pulse" />
                                    <span className="text-sm text-gray-400">AI is thinking...</span>
                                </div>
                            </div>
                        </div>
                    )}
                    <div ref={messagesEndRef} />
                </div>
                 {messages.length === 0 && !isAnswering && (
                    <div className="h-full flex items-center justify-center">
                        <p className="text-center text-sm text-gray-500">{isContained ? 'Ask a question about this slide.' : 'Ask a question to get started, e.g., "Summarize slide 3" or "What is the main takeaway?"'}</p>
                    </div>
                )}
            </div>
            <form onSubmit={handleSubmit} className="mt-4">
                <div className="flex items-center bg-gray-700 rounded-lg p-1">
                    <input
                        type="text"
                        value={input}
                        onChange={(e) => setInput(e.target.value)}
                        placeholder="Ask a question..."
                        className="w-full bg-transparent px-3 py-2 text-sm focus:outline-none"
                        disabled={isAnswering}
                    />
                    <button type="submit" disabled={isAnswering || !input.trim()} className="bg-indigo-600 hover:bg-indigo-500 text-white font-semibold px-4 py-1.5 rounded-md text-sm disabled:opacity-50 disabled:cursor-not-allowed">
                        Send
                    </button>
                </div>
            </form>
        </div>
    );
};

export default ChatPanel;