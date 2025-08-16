import React, { useState } from 'react';
import type { SlideScaffold, SlideHandlers, ChatMessage } from '../types';
import { SparklesIcon, ImagePlusIcon, TrashIcon, ChatBubbleLeftRightIcon } from './Icons';
import ChatPanel from './ChatPanel';

interface SlideComponentProps {
    slide: SlideScaffold;
    isActive: boolean;
    handlers: SlideHandlers;
    onDelete: () => void;
    chatMessages: ChatMessage[];
    isAiAnswering: boolean;
    onAskQuestion: (question: string) => void;
    actionInProgress: { slideId: string; action: 'content' | 'image' } | null;
}

const SlideComponent: React.FC<SlideComponentProps> = ({ slide, isActive, handlers, onDelete, chatMessages, isAiAnswering, onAskQuestion, actionInProgress }) => {
    const [isChatOpen, setIsChatOpen] = useState(false);

    const handleContentChange = (e: React.ChangeEvent<HTMLTextAreaElement>) => {
        handlers.onUpdateSlide(slide.id, { content: e.target.value.split('\n') });
    };

    const isContentLoading = actionInProgress?.slideId === slide.id && actionInProgress?.action === 'content';
    const isImageLoading = actionInProgress?.slideId === slide.id && actionInProgress?.action === 'image';

    return (
        <div className={`p-6 bg-gray-800/50 rounded-xl border-2 transition-colors duration-300 ${isActive ? 'border-indigo-500' : 'border-gray-700'}`}>
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                
                {/* Left side: Image */}
                <div className="space-y-3">
                    <div className="aspect-video bg-gray-700 rounded-lg border border-gray-600 flex items-center justify-center overflow-hidden">
                        {isImageLoading ? (
                             <div className="flex flex-col items-center justify-center">
                                <SparklesIcon className="w-10 h-10 text-indigo-400 animate-pulse" />
                                <p className="text-sm text-gray-400 mt-2">Generating Image...</p>
                            </div>
                        ) : slide.imageUrl ? (
                            <img src={slide.imageUrl} alt={`Illustration for slide: ${slide.title}`} className="w-full h-full object-cover"/>
                        ) : (
                            <p className="text-gray-500 text-sm">No Image Generated</p>
                        )}
                    </div>
                     <button 
                        onClick={() => handlers.onRegenerateImage(slide.id)}
                        disabled={isImageLoading || isContentLoading} 
                        className="w-full mt-2 flex items-center justify-center space-x-2 px-3 py-2 bg-purple-600 hover:bg-purple-500 rounded-lg text-sm font-medium transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                     >
                        {isImageLoading ? <><div className="w-5 h-5 border-2 border-dashed rounded-full animate-spin border-white"></div><span>Generating...</span></>
                        : <><ImagePlusIcon className="w-5 h-5"/><span>Generate New Image</span></>}
                    </button>
                </div>

                {/* Right side: Text Editor & Actions */}
                <div>
                     <input
                        type="text"
                        value={slide.title}
                        onChange={(e) => handlers.onUpdateSlide(slide.id, { title: e.target.value })}
                        className="w-full bg-gray-700/80 border border-gray-600 rounded-md p-2 text-xl font-bold text-white focus:outline-none focus:ring-2 focus:ring-indigo-500"
                        placeholder="Slide Title"
                    />

                    <textarea
                        value={slide.content.join('\n')}
                        onChange={handleContentChange}
                        className="w-full h-48 mt-3 bg-gray-700/80 border border-gray-600 rounded-md p-2 text-gray-300 focus:outline-none focus:ring-2 focus:ring-indigo-500 resize-none"
                        placeholder="- Bullet point 1&#10;- Bullet point 2"
                    />
                    <div className="flex items-center justify-between mt-2 space-x-2">
                        <button 
                            onClick={() => handlers.onRegenerateContent(slide.id)}
                            disabled={isContentLoading || isImageLoading} 
                            className="flex items-center justify-center space-x-2 px-3 py-2 bg-purple-600 hover:bg-purple-500 rounded-lg text-sm font-medium transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                        >
                            {isContentLoading ? <><div className="w-5 h-5 border-2 border-dashed rounded-full animate-spin border-white"></div><span>Generating...</span></>
                            : <><SparklesIcon className="w-5 h-5"/><span>Regenerate Content</span></>}
                        </button>
                        <div className="flex items-center space-x-2">
                           <button onClick={() => setIsChatOpen(!isChatOpen)} className={`p-2 rounded-lg transition-colors ${isChatOpen ? 'bg-indigo-600 text-white' : 'text-gray-400 hover:bg-gray-700 hover:text-white'}`} title="Ask AI about this slide">
                                <ChatBubbleLeftRightIcon className="w-5 h-5"/>
                            </button>
                             <button onClick={onDelete} className="p-2 text-gray-400 hover:text-red-500" title="Delete Slide">
                                <TrashIcon className="w-5 h-5"/>
                            </button>
                        </div>
                    </div>
                </div>
            </div>

            {isChatOpen && (
                <div className="mt-4 border-t border-gray-700 pt-4">
                     <div className="h-[40vh] bg-gray-900/60 rounded-lg border border-gray-700 flex flex-col">
                        <ChatPanel 
                            messages={chatMessages}
                            isAnswering={isAiAnswering}
                            onAsk={onAskQuestion}
                            isContained={true}
                        />
                    </div>
                </div>
            )}
        </div>
    );
};

export default SlideComponent;