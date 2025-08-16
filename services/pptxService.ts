import type { PresentationDocument } from '../types';

const preloadImageAsBase64 = (src: string): Promise<string> => {
  return new Promise((resolve, reject) => {
    if (!src) {
      reject(new Error('Image source is null or empty.'));
      return;
    }
    const img = new Image();
    img.crossOrigin = 'anonymous';
    img.onload = () => {
      const canvas = document.createElement('canvas');
      canvas.width = img.width;
      canvas.height = img.height;
      const ctx = canvas.getContext('2d');
      if (ctx) {
        ctx.drawImage(img, 0, 0);
        // Return with mime type for pptxgenjs
        resolve(canvas.toDataURL('image/jpeg'));
      } else {
        reject(new Error('Could not get canvas context'));
      }
    };
    img.onerror = (e) => reject(e);
    img.src = src;
  });
};


export const createPresentation = async (doc: PresentationDocument): Promise<void> => {
    const pptx = new window.PptxGenJS();

    pptx.layout = 'LAYOUT_16x9';
    
    // --- Master Slide Layouts ---
    pptx.defineLayout({
        name: 'TITLE_SLIDE',
        width: 10,
        height: 5.625,
        objects: [
            { text: { text: '(title)', options: { placeholder: 'title', align: 'center', y: 2.0, w: '90%', x: '5%', fontSize: 32, bold: true, color: '363636' } } },
        ],
    });

    pptx.defineLayout({
        name: 'CONTENT_SLIDE',
        width: 10,
        height: 5.625,
        objects: [
            { text: { text: '(title)', options: { placeholder: 'title', y: 0.2, w: '90%', x: '5%', fontSize: 24, bold: true, color: '363636' } } },
            { image: { placeholder: 'image', x: 0.5, y: 1.0, w: 4.0, h: 4.0 } },
            { text: { text: '(body)', options: { placeholder: 'body', x: 5.0, y: 1.0, w: 4.5, h: 4.0, fontSize: 14, color: '494949', bullet: true } } },
        ],
    });


    // --- Title Slide ---
    const titleSlide = pptx.addSlide({ layout: 'TITLE_SLIDE' });
    titleSlide.addText(doc.title, { placeholder: 'title' });


    // --- Preload all images ---
    const imageUrls = doc.slides.map(slide => slide.imageUrl).filter(url => url) as string[];
    const preloadedImages = await Promise.all(
        imageUrls.map(url => preloadImageAsBase64(url).catch(() => null))
    );
    const imageMap = new Map<string, string>();
    imageUrls.forEach((url, index) => {
        if (preloadedImages[index]) {
            imageMap.set(url, preloadedImages[index] as string);
        }
    });

    // --- Content Slides ---
    for (const slideData of doc.slides) {
        const slide = pptx.addSlide({ layout: 'CONTENT_SLIDE' });
        slide.addText(slideData.title, { placeholder: 'title' });
        
        slide.addText(slideData.content, {
            placeholder: 'body',
            // In case content is just a single string
            bullet: Array.isArray(slideData.content)
        });

        const base64Image = slideData.imageUrl ? imageMap.get(slideData.imageUrl) : null;
        if (base64Image) {
            slide.addImage({
                data: base64Image,
                placeholder: 'image',
            });
        }
    }
    
    const fileName = `${doc.title.replace(/[^a-z0-9]/gi, '_').toLowerCase()}.pptx`;
    pptx.writeFile({ fileName });
};