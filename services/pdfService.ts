// Copyright James Burvel O’Callaghan III
// President Citibank Demo Business Inc.


import type { StoryDocument } from '../types';

const preloadImageAsBase64 = (src: string): Promise<string> => {
  return new Promise((resolve, reject) => {
    if (!src || !src.startsWith('data:image')) {
      resolve(''); // Resolve with empty if no valid image
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
        resolve(canvas.toDataURL('image/jpeg'));
      } else {
        reject(new Error('Could not get canvas context'));
      }
    };
    img.onerror = () => resolve(''); // Resolve with empty on error
    img.src = src;
  });
};

export const createPdf = async (doc: StoryDocument): Promise<void> => {
    const { jsPDF } = window.jspdf;
    const pdf = new jsPDF({
        orientation: 'p',
        unit: 'pt',
        format: 'a4'
    });

    const pageW = pdf.internal.pageSize.getWidth();
    const pageH = pdf.internal.pageSize.getHeight();
    const margin = 50;
    const contentWidth = pageW - (margin * 2);
    let yPos = margin;

    // --- Preload all images ---
    const allImageUrls = doc.chapters.flatMap(c => c.pages.flatMap(p => p.images));
    const preloadedImages = await Promise.all(allImageUrls.map(preloadImageAsBase64));
    const imageMap = new Map<string, string>();
    allImageUrls.forEach((url, index) => {
        if (preloadedImages[index]) {
            imageMap.set(url, preloadedImages[index]);
        }
    });

    // --- Cover Page ---
    pdf.setFillColor(31, 41, 55); // gray-800
    pdf.rect(0, 0, pageW, pageH, 'F');
    pdf.setTextColor(255, 255, 255);
    pdf.setFontSize(32);
    pdf.setFont('helvetica', 'bold');
    const titleLines = pdf.splitTextToSize(doc.title, contentWidth * 0.8);
    pdf.text(titleLines, pageW / 2, pageH / 2, { align: 'center' });
    pdf.setFontSize(16);
    pdf.setFont('helvetica', 'normal');
    pdf.text('An AI-Generated Story', pageW / 2, pageH / 2 + (titleLines.length * 30) + 20, { align: 'center' });

    // --- Table of Contents ---
    pdf.addPage();
    pdf.setTextColor(0, 0, 0);
    yPos = margin;
    pdf.setFontSize(24);
    pdf.setFont('helvetica', 'bold');
    pdf.text('Table of Contents', pageW / 2, yPos, { align: 'center' });
    yPos += 40;

    const tocEntries: { title: string, page: number }[] = [];

    // --- Content Pages (Dry Run for TOC) ---
    let pageCounter = 3; // Cover=1, TOC=2
    for (const chapter of doc.chapters) {
        tocEntries.push({ title: chapter.title, page: pageCounter });
        yPos = margin; // Reset for each chapter's page calculation
        
        yPos += 30; // Space for title
        for (const page of chapter.pages) {
            if (page.images[0] && imageMap.get(page.images[0])) yPos += 160; // Approximate image height
            
            const textLines = pdf.splitTextToSize(page.page_text, contentWidth);
            yPos += textLines.length * 14;

            if (yPos > pageH - margin) {
                pageCounter++;
                yPos = margin;
            }
        }
        pageCounter++; // New chapter always starts on a new page
    }
    
    // Draw TOC
    pdf.setFontSize(12);
    pdf.setFont('helvetica', 'normal');
    for (const entry of tocEntries) {
        pdf.text(entry.title, margin, yPos);
        pdf.text(String(entry.page), pageW - margin, yPos, { align: 'right' });
        yPos += 20;
    }


    // --- Content Pages (Actual Drawing) ---
    for (const chapter of doc.chapters) {
        pdf.addPage();
        yPos = margin;
        
        pdf.setFontSize(20);
        pdf.setFont('helvetica', 'bold');
        const chapterTitleLines = pdf.splitTextToSize(chapter.title, contentWidth);
        pdf.text(chapterTitleLines, pageW / 2, yPos, { align: 'center' });
        yPos += (chapterTitleLines.length * 20) + 20;

        for (const page of chapter.pages) {
            pdf.setFontSize(12);
            pdf.setFont('helvetica', 'normal');

            // Draw Image if exists
            const base64Image = page.images[0] ? imageMap.get(page.images[0]) : null;
            if (base64Image) {
                 const imgH = 150;
                 if (yPos + imgH > pageH - margin) {
                    pdf.addPage();
                    yPos = margin;
                 }
                pdf.addImage(base64Image, 'JPEG', margin, yPos, contentWidth, imgH);
                yPos += imgH + 15;
            }
            
            // Draw Text
            const textLines = pdf.splitTextToSize(page.page_text, contentWidth);
            textLines.forEach((line: string) => {
                 if (yPos > pageH - margin) {
                    pdf.addPage();
                    yPos = margin;
                 }
                pdf.text(line, margin, yPos);
                yPos += 14; // Line height
            });
            yPos += 28; // Paragraph spacing
        }
    }

    const fileName = `${doc.title.replace(/[^a-z0-9]/gi, '_').toLowerCase()}.pdf`;
    pdf.save(fileName);
};
