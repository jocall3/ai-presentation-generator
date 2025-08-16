
import React from 'react';
import type { StoryDocument } from '../types';

interface MagazinePreviewProps {
    doc: StoryDocument;
}

const MagazinePreview: React.FC<MagazinePreviewProps> = ({ doc }) => {
    
    // Function to interleave images with text paragraphs
    const renderPageContent = (text: string, images: string[]) => {
        const paragraphs = text.split('\n').filter(p => p.trim() !== '');
        const contentElements = [];
        
        for (let i = 0; i < paragraphs.length; i++) {
            // Add an image before every 2nd paragraph if available
            if (i > 0 && i % 2 === 0 && images.length > 0) {
                 const imgUrl = images.shift(); // take the next available image
                 if(imgUrl) {
                    contentElements.push(
                        <img key={`img-${i}`} src={imgUrl} alt="Story illustration" className={i % 4 === 0 ? 'img-left' : 'img-right'} />
                    );
                 }
            }
            contentElements.push(<p key={`p-${i}`}>{paragraphs[i]}</p>);
        }

        // Add any remaining images at the end
        images.forEach((imgUrl, i) => {
            contentElements.push(<img key={`img-rem-${i}`} src={imgUrl} alt="Story illustration" />);
        });
        
        return <div className="magazine-columns">{contentElements}</div>;
    };

    return (
        <div className="p-4 text-gray-300 magazine-preview">
            <h1>{doc.title}</h1>
            {doc.chapters.map(chapter => (
                <div key={chapter.id}>
                    <h2>{chapter.title}</h2>
                    {chapter.pages.map((page, index) => (
                         <div key={page.id} className="clearfix">
                           {renderPageContent(page.page_text, [...page.images])}
                        </div>
                    ))}
                </div>
            ))}
        </div>
    );
};

export default MagazinePreview;
