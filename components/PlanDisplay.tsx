// Copyright James Burvel O’Callaghan III
// President Citibank Demo Business Inc.

import React, { useState } from 'react';
import type { ChapterScaffold, PageScaffold, PageHandlers } from '../types';
import { SparklesIcon, ImagePlusIcon, FileTextIcon, WandIcon, ChevronDownIcon } from './Icons';

// Reusable Page Component
interface PageComponentProps {
    page: PageScaffold;
    chapterId: string;
    handlers: PageHandlers;
    isActionLoading: boolean;
}

const PageComponent: React.FC<PageComponentProps> = ({ page, chapterId, handlers, isActionLoading }) => {
    const [mainImage, setMainImage] = useState(page.images[0] || null);

    React.useEffect(() => {
        // Update main image if the array changes and there's no current main image
        if (!mainImage && page.images.length > 0) {
            setMainImage(page.images[0]);
        } else if (page.images.length > 0 && !page.images.includes(mainImage!)) {
            // If main image was deleted, set to first in list
            setMainImage(page.images[0]);
        } else if (page.images.length === 0) {
            setMainImage(null);
        }
    }, [page.images, mainImage]);

    return (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 p-4 bg-gray-800/50 rounded-lg border border-gray-700">
            {/* Left side: Text Editor & Actions */}
            <div className="flex flex-col">
                <h4 className="font-bold text-violet-300 mb-2">Page {page.page_number}</h4>
                <textarea
                    value={page.page_text}
                    onChange={(e) => handlers.onUpdatePage(chapterId, page.id, { page_text: e.target.value })}
                    className="w-full flex-grow bg-gray-900/50 border border-gray-600 rounded-md p-2 text-gray-300 focus:outline-none focus:ring-2 focus:ring-violet-500 resize-none min-h-[200px]"
                    placeholder="Start writing or use an AI action..."
                />
                <div className="flex flex-wrap gap-2 mt-2">
                     <button 
                        onClick={() => handlers.onAutoWritePageStream(chapterId, page.id)}
                        disabled={isActionLoading}
                        className="flex-1 flex items-center justify-center gap-2 px-3 py-2 bg-violet-600 hover:bg-violet-500 rounded-lg text-xs font-medium transition-colors disabled:opacity-50"
                     >
                        <WandIcon className="w-4 h-4" /> AI Write Page
                    </button>
                     <button 
                        onClick={() => handlers.onExpandTextStream(chapterId, page.id)}
                        disabled={isActionLoading || !page.page_text}
                        className="flex-1 flex items-center justify-center gap-2 px-3 py-2 bg-gray-600 hover:bg-gray-500 rounded-lg text-xs font-medium transition-colors disabled:opacity-50"
                     >
                       <FileTextIcon className="w-4 h-4" /> Expand Text
                    </button>
                </div>
            </div>
             {/* Right side: Image Gallery */}
            <div className="flex flex-col">
                <div className="aspect-video bg-gray-700 rounded-lg border border-gray-600 flex items-center justify-center overflow-hidden flex-grow">
                     {mainImage ? (
                        <img src={mainImage} alt={`Illustration for page ${page.page_number}`} className="w-full h-full object-cover"/>
                    ) : (
                        <p className="text-gray-500 text-sm">No Image</p>
                    )}
                </div>
                {/* Thumbnails */}
                {page.images.length > 1 && (
                    <div className="flex gap-2 mt-2">
                        {page.images.map((img, idx) => (
                             <button key={idx} onClick={() => setMainImage(img)} className={`w-16 h-10 rounded-md overflow-hidden border-2 ${mainImage === img ? 'border-violet-400' : 'border-transparent'}`}>
                                <img src={img} alt={`Thumbnail ${idx+1}`} className="w-full h-full object-cover" />
                             </button>
                        ))}
                    </div>
                )}
                 <button 
                    onClick={() => handlers.onGenerateImage(chapterId, page.id)}
                    disabled={isActionLoading} 
                    className="w-full mt-2 flex items-center justify-center space-x-2 px-3 py-2 bg-purple-600 hover:bg-purple-500 rounded-lg text-sm font-medium transition-colors disabled:opacity-50"
                 >
                    <ImagePlusIcon className="w-5 h-5"/>
                    <span>{page.images.length > 0 ? 'Add Another Image' : 'Generate Image'}</span>
                </button>
            </div>
        </div>
    );
};


// Main Chapter Component
interface ChapterComponentProps {
    chapter: ChapterScaffold;
    pageHandlers: PageHandlers;
    isActionLoading: boolean;
}

const ChapterComponent: React.FC<ChapterComponentProps> = ({ chapter, pageHandlers, isActionLoading }) => {
    const [isExpanded, setIsExpanded] = useState(true);

    return (
        <div className="mb-4 bg-gray-800/30 rounded-lg border border-gray-700 overflow-hidden">
            <button 
                onClick={() => setIsExpanded(!isExpanded)}
                className="w-full flex justify-between items-center p-4 bg-gray-700/50 hover:bg-gray-700/80 transition-colors"
            >
                <div>
                    <h3 className="text-xl font-bold text-left">{chapter.title}</h3>
                    <p className="text-sm text-gray-400 text-left">{chapter.summary}</p>
                </div>
                <ChevronDownIcon className={`w-6 h-6 transform transition-transform duration-300 ${isExpanded ? 'rotate-180' : ''}`} />
            </button>
            {isExpanded && (
                <div className="p-4 space-y-4">
                    {chapter.pages.length > 0 ? (
                        chapter.pages.map(page => (
                            <PageComponent 
                                key={page.id} 
                                page={page} 
                                chapterId={chapter.id} 
                                handlers={pageHandlers} 
                                isActionLoading={isActionLoading}
                            />
                        ))
                    ) : (
                        <div className="text-center py-8 text-gray-500">
                           <p>This chapter is being generated or has no pages yet.</p>
                        </div>
                    )}
                </div>
            )}
        </div>
    );
};

export default ChapterComponent;