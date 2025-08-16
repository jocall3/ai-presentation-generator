import React, { useState } from 'react';
import type { PresentationDocument, SlideScaffold, AppState, ChatMessage } from './types';
import { generatePresentationTitle, generateSlideFromChunk, answerQuestionAboutPresentation, regenerateSlideContent, generateImageForSlide } from './services/geminiService';
import { createPresentation } from './services/pptxService';
import { APP_TITLE } from './constants';
import { PresentationChartBarIcon, DownloadIcon, BackArrowIcon } from './components/Icons';
import Loader from './components/Loader';
import DataInput from './components/DataInput';
import PresentationEditor from './components/StoryViewer';

const CHUNK_SIZE = 3000; // characters per chunk/slide

const App: React.FC = () => {
    const [appState, setAppState] = useState<AppState>('INPUT');
    const [presentationDocument, setPresentationDocument] = useState<PresentationDocument | null>(null);
    const [isLoading, setIsLoading] = useState<boolean>(false);
    const [loadingMessage, setLoadingMessage] = useState<string>('');
    const [error, setError] = useState<string | null>(null);

    const [chatMessages, setChatMessages] = useState<ChatMessage[]>([]);
    const [isAiAnswering, setIsAiAnswering] = useState(false);
    
    // New state to track which specific button is loading
    const [actionInProgress, setActionInProgress] = useState<{ slideId: string; action: 'content' | 'image' } | null>(null);


    const handleReset = () => {
        setAppState('INPUT');
        setPresentationDocument(null);
        setError(null);
        setIsLoading(false);
        setChatMessages([]);
    };

    const handlePresentationGeneration = async (data: string) => {
        setIsLoading(true);
        setLoadingMessage('Preparing presentation...');
        setError(null);

        try {
            const chunks: string[] = [];
            for (let i = 0; i < data.length; i += CHUNK_SIZE) {
                chunks.push(data.substring(i, i + CHUNK_SIZE));
            }

            if (chunks.length === 0) throw new Error("No text data to process.");
            
            setLoadingMessage('Generating presentation title...');
            const title = await generatePresentationTitle(chunks[0]);

            const doc: PresentationDocument = { id: crypto.randomUUID(), title, slides: [] };
            
            const generatedSlides: SlideScaffold[] = [];
            for (const [index, chunk] of chunks.entries()) {
                setLoadingMessage(`Generating slide ${index + 1} of ${chunks.length}...`);
                const slide = await generateSlideFromChunk(chunk, index + 1, chunks.length, title);
                generatedSlides.push(slide);
            }
            doc.slides = generatedSlides;

            setPresentationDocument(doc);
            setAppState('EDITING');
        } catch (err) {
            console.error(err);
            setError('Failed to generate a presentation. Please check your file and try again.');
            setAppState('INPUT');
        } finally {
            setIsLoading(false);
            setLoadingMessage('');
        }
    };

    const handleAskQuestion = async (question: string) => {
        if (!presentationDocument || isAiAnswering) return;

        const newMessages: ChatMessage[] = [{ role: 'user', content: question }];
        setChatMessages(newMessages); // Reset chat for each slide context
        setIsAiAnswering(true);

        try {
            const answer = await answerQuestionAboutPresentation(presentationDocument, question);
            setChatMessages([...newMessages, { role: 'model', content: answer }]);
        } catch (err) {
            console.error(err);
            setChatMessages([...newMessages, { role: 'model', content: "Sorry, I encountered an error trying to answer that." }]);
        } finally {
            setIsAiAnswering(false);
        }
    };
    
    const handleRegenerateSlideContent = async (slideId: string) => {
        const slide = presentationDocument?.slides.find(s => s.id === slideId);
        if (!slide) return;

        setActionInProgress({ slideId, action: 'content' });
        try {
            const newContent = await regenerateSlideContent(slide.title);
            setPresentationDocument(doc => {
                if (!doc) return null;
                return {
                    ...doc,
                    slides: doc.slides.map(s => s.id === slideId ? { ...s, content: newContent } : s)
                };
            });
        } catch (err) {
            console.error("Failed to regenerate slide content", err);
            // Optionally set an error message
        } finally {
            setActionInProgress(null);
        }
    };
    
    const handleRegenerateSlideImage = async (slideId: string) => {
        const slide = presentationDocument?.slides.find(s => s.id === slideId);
        if (!slide) return;
    
        setActionInProgress({ slideId, action: 'image' });
        try {
            const newImageUrl = await generateImageForSlide(slide.title, slide.content);
            setPresentationDocument(doc => {
                if (!doc) return null;
                return {
                    ...doc,
                    slides: doc.slides.map(s => s.id === slideId ? { ...s, imageUrl: newImageUrl } : s)
                };
            });
        } catch (err) {
            console.error("Failed to regenerate slide image", err);
        } finally {
            setActionInProgress(null);
        }
    };

    const slideHandlers = {
        onUpdateSlide: (slideId: string, updates: Partial<SlideScaffold>) => {
            setPresentationDocument(doc => {
                if (!doc) return null;
                return {
                    ...doc,
                    slides: doc.slides.map(s => s.id === slideId ? { ...s, ...updates } : s)
                };
            });
        },
        onRegenerateContent: handleRegenerateSlideContent,
        onRegenerateImage: handleRegenerateSlideImage,
    };

    const handlePptxDownload = async () => {
        if (!presentationDocument) return;
        setIsLoading(true);
        setLoadingMessage('Generating your PowerPoint file...');
        setError(null);
        try {
            await createPresentation(presentationDocument);
        } catch (err)
 {
            console.error(err);
            setError('Failed to create the .pptx file.');
        } finally {
            setIsLoading(false);
        }
    };
    
    const renderContent = () => {
        if (isLoading) {
            return <Loader message={loadingMessage} />;
        }
        switch (appState) {
            case 'INPUT':
                return <DataInput onProcess={handlePresentationGeneration} />;
            case 'EDITING':
                return presentationDocument ? (
                     <PresentationEditor
                        doc={presentationDocument} 
                        setDoc={setPresentationDocument} 
                        slideHandlers={slideHandlers}
                        chatMessages={chatMessages}
                        isAiAnswering={isAiAnswering}
                        onAskQuestion={handleAskQuestion}
                        actionInProgress={actionInProgress}
                     />
                ) : <Loader message="Loading editor..." />;
            default:
                return <DataInput onProcess={handlePresentationGeneration} />;
        }
    };

    return (
        <div className="min-h-screen bg-gray-900 text-gray-100 font-sans p-4 sm:p-6 lg:p-8">
            <div className="max-w-[90rem] mx-auto">
                <header className="flex justify-between items-center mb-6">
                    <div className="flex items-center space-x-3">
                        <PresentationChartBarIcon className="w-8 h-8 text-indigo-400" />
                        <h1 className="text-2xl sm:text-3xl font-bold tracking-tight bg-gradient-to-r from-purple-400 to-indigo-300 bg-clip-text text-transparent">
                            {APP_TITLE}
                        </h1>
                    </div>
                     {appState !== 'INPUT' && (
                         <div className="flex items-center gap-4">
                            <button 
                                onClick={handlePptxDownload}
                                className="flex items-center space-x-2 px-4 py-2 bg-indigo-600 hover:bg-indigo-500 rounded-lg text-sm font-semibold transition-colors"
                             >
                                 <DownloadIcon className="w-4 h-4"/>
                                 <span>Export .pptx</span>
                             </button>
                             <button
                                onClick={handleReset}
                                className="flex items-center space-x-2 px-4 py-2 bg-gray-700 hover:bg-gray-600 rounded-lg text-sm font-medium transition-colors"
                             >
                                 <BackArrowIcon className="w-4 h-4"/>
                                 <span>Start Over</span>
                             </button>
                         </div>
                    )}
                </header>
                
                <main className="bg-gray-800/50 rounded-2xl shadow-2xl backdrop-blur-sm border border-gray-700/50 min-h-[70vh] overflow-hidden">
                    {error && (
                        <div className="bg-red-500/20 border border-red-500 text-red-300 px-4 py-3 rounded-lg m-6 relative" role="alert">
                            <strong className="font-bold">Error: </strong>
                            <span className="block sm:inline">{error}</span>
                            <button onClick={() => setError(null)} className="absolute top-0 bottom-0 right-0 px-4 py-3">&times;</button>
                        </div>
                    )}
                    {renderContent()}
                </main>
            </div>
        </div>
    );
};

export default App;