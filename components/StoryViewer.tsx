import React, { useState } from 'react';
import type { PresentationDocument, SlideScaffold, SlideHandlers, ChatMessage } from '../types';
import SlideComponent from './PlanDisplay';
import { PlusIcon } from './Icons';

interface PresentationEditorProps {
    doc: PresentationDocument;
    setDoc: React.Dispatch<React.SetStateAction<PresentationDocument | null>>;
    slideHandlers: SlideHandlers;
    chatMessages: ChatMessage[];
    isAiAnswering: boolean;
    onAskQuestion: (question: string) => void;
    actionInProgress: { slideId: string; action: 'content' | 'image' } | null;
}

const PresentationEditor: React.FC<PresentationEditorProps> = ({ doc, setDoc, slideHandlers, chatMessages, isAiAnswering, onAskQuestion, actionInProgress }) => {
    const [activeSlideId, setActiveSlideId] = useState<string>(doc.slides[0]?.id || '');

    const handleUpdateDoc = (updater: (doc: PresentationDocument) => PresentationDocument) => {
        setDoc(prevDoc => prevDoc ? updater(prevDoc) : null);
    };

    const handleAddSlide = () => {
        const newSlide: SlideScaffold = {
            id: crypto.randomUUID(),
            title: `New Slide ${doc.slides.length + 1}`,
            content: ['- Add your content here.'],
            imageUrl: null,
        };
        handleUpdateDoc(d => ({ ...d, slides: [...d.slides, newSlide] }));
        setActiveSlideId(newSlide.id);
    };

    const handleDeleteSlide = (slideId: string) => {
        const slideIndex = doc.slides.findIndex(s => s.id === slideId);
        handleUpdateDoc(d => ({ ...d, slides: d.slides.filter(s => s.id !== slideId) }));

        if (activeSlideId === slideId) {
            if (doc.slides.length > 1) {
                const newActiveIndex = Math.max(0, slideIndex - 1);
                setActiveSlideId(doc.slides[newActiveIndex].id);
            } else {
                setActiveSlideId('');
            }
        }
    };
    
    const activeSlide = doc.slides.find(s => s.id === activeSlideId);

    return (
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 h-[85vh] p-4">
            {/* Left Panel: Slide Navigator */}
            <aside className="lg:col-span-3 bg-gray-900/60 p-4 rounded-lg border border-gray-700 flex flex-col">
                <h3 className="font-bold mb-3 text-indigo-300">Slides</h3>
                <div className="flex-grow overflow-y-auto space-y-2 pr-2 -mr-2">
                    {doc.slides.map((slide, index) => (
                        <button
                            key={slide.id}
                            onClick={() => setActiveSlideId(slide.id)}
                            className={`w-full text-left p-2 rounded-md transition-colors text-sm ${activeSlideId === slide.id ? 'bg-indigo-500/30 text-white' : 'hover:bg-gray-700/50 text-gray-300'}`}
                        >
                            <span className="font-semibold text-gray-500 mr-2">{index + 1}.</span>
                            <span>{slide.title}</span>
                        </button>
                    ))}
                </div>
                <button
                    onClick={handleAddSlide}
                    className="w-full mt-4 flex items-center justify-center space-x-2 px-3 py-2 bg-indigo-600/50 hover:bg-indigo-600/80 rounded-lg text-sm font-medium transition-colors"
                >
                    <PlusIcon className="w-4 h-4" />
                    <span>Add Slide</span>
                </button>
            </aside>

            {/* Main Panel: Slide Editor */}
            <div className="lg:col-span-9 overflow-y-auto pr-2 -mr-2">
                {activeSlide ? (
                    <SlideComponent
                        slide={activeSlide}
                        isActive={true}
                        handlers={slideHandlers}
                        onDelete={() => handleDeleteSlide(activeSlide.id)}
                        chatMessages={chatMessages}
                        isAiAnswering={isAiAnswering}
                        onAskQuestion={onAskQuestion}
                        actionInProgress={actionInProgress}
                    />
                ) : (
                    <div className="flex items-center justify-center h-full text-gray-500">
                        <p>Select a slide to edit or add a new one.</p>
                    </div>
                )}
            </div>
        </div>
    );
};

export default PresentationEditor;