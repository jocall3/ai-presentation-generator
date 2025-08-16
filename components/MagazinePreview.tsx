import React from 'react';
import type { StoryDocument } from '../types';

interface MagazinePreviewProps {
    doc: StoryDocument;
}

const MagazinePreview: React.FC<MagazinePreviewProps> = ({ doc }) => {
    
    // Function to interleave images with text paragraphs
    const renderPageContent = (text: string, images: string[], isFirstPage: boolean) => {
        const paragraphs = text.split('\n').filter(p => p.trim() !== '');
        const contentElements = [];
        const mutableImages = [...images];

        // If it's the first page of a chapter, use the first image as a hero image.
        if (isFirstPage && mutableImages.length > 0) {
            const heroImage = mutableImages.shift();
            contentElements.push(
                <img key="hero-img" src={heroImage} alt="Chapter opening illustration" className="magazine-hero-image" />
            );
        }
        
        const textBlock = [];
        for (let i = 0; i < paragraphs.length; i++) {
            // Add an inline image before every 2nd paragraph if available
            if (i > 0 && i % 2 === 0 && mutableImages.length > 0) {
                 const imgUrl = mutableImages.shift();
                 if(imgUrl) {
                    textBlock.push(
                        <img key={`img-${i}`} src={imgUrl} alt="Story illustration" className={i % 4 === 0 ? 'img-left' : 'img-right'} />
                    );
                 }
            }
            textBlock.push(<p key={`p-${i}`}>{paragraphs[i]}</p>);
        }
        contentElements.push(<div key="text-content" className="magazine-columns">{textBlock}</div>);

        // Add any remaining images at the end
        if (mutableImages.length > 0) {
            contentElements.push(
                <div key="remaining-images" className="mt-4">
                    {mutableImages.map((imgUrl, i) => (
                        <img key={`img-rem-${i}`} src={imgUrl} alt="Story illustration" className="w-full h-auto rounded-lg mb-4" />
                    ))}
                </div>
            );
        }
        
        return contentElements;
    };

    return (
        <div className="p-4 magazine-preview">
            <h1>{doc.title}</h1>
            {doc.chapters.map(chapter => (
                <div key={chapter.id}>
                    <h2>{chapter.title}</h2>
                    {chapter.pages.map((page, index) => (
                         <div key={page.id} className="clearfix">
                           {renderPageContent(page.page_text, page.images, index === 0)}
                        </div>
                    ))}
                </div>
            ))}
        </div>
    );
};

export default MagazinePreview;