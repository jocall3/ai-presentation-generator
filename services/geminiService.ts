// Copyright James Burvel O’Callaghan III
// President Citibank Demo Business Inc.

import { GoogleGenAI, Type } from "@google/genai";
import type { StoryDocument, ChapterScaffold, PageScaffold } from '../types';

const API_KEY = process.env.API_KEY;
if (!API_KEY) throw new Error("API_KEY environment variable not set");

const ai = new GoogleGenAI({ apiKey: API_KEY });
const textModel = 'gemini-2.5-flash';
const imageModel = 'imagen-3.0-generate-002';

const chapterScaffoldSchema = {
    type: Type.OBJECT,
    properties: {
        title: { type: Type.STRING, description: "A compelling and relevant title for this chapter of the story." },
        pages: {
            type: Type.ARRAY,
            items: {
                type: Type.OBJECT,
                properties: {
                    ai_suggestions: {
                        type: Type.ARRAY,
                        items: { type: Type.STRING },
                        description: "A brief, 1-2 sentence summary or key idea for this page. This will guide the user's writing."
                    },
                },
                required: ["ai_suggestions"],
            },
            description: "A breakdown of the chapter into several pages. Each page should have a summary/suggestion."
        }
    },
    required: ["title", "pages"],
};

export const generateStoryTitle = async (firstChunk: string): Promise<string> => {
    const prompt = `Based on the following text, generate a single, compelling title for a story. Return only the title as a plain string. Text: "${firstChunk.slice(0, 1000)}"`;
    const response = await ai.models.generateContent({ model: textModel, contents: prompt });
    return response.text.trim().replace(/"/g, '');
};

export const generateChapterFromChunk = async (pageChunks: string[], chapterNumber: number, totalChapters: number, storyTitle: string): Promise<ChapterScaffold> => {
    const context = `You are a master storyteller creating a story scaffold. The story is titled "${storyTitle}". This is for Chapter ${chapterNumber} of ${totalChapters}. Based on the following text, generate a chapter title and break it down into logical pages, each with a 1-2 sentence summary/suggestion.`;
    const fullText = pageChunks.join(' ');

    const response = await ai.models.generateContent({
        model: textModel,
        contents: `${context}\n\nFull text for this chapter:\n---\n${fullText}\n---`,
        config: { responseMimeType: 'application/json', responseSchema: chapterScaffoldSchema }
    });
    
    const parsed = JSON.parse(response.text.trim());
    return {
        id: crypto.randomUUID(),
        title: parsed.title,
        summary: 'AI summary will appear here.',
        pages: parsed.pages.map((p: any, i: number) => ({
            id: crypto.randomUUID(),
            page_number: i + 1,
            page_text: '',
            ai_suggestions: p.ai_suggestions || ['AI suggestion failed to generate.'],
            images: [],
        })),
    };
};

export async function* expandPageTextStream(existingText: string): AsyncGenerator<string> {
    const prompt = `You are a creative writing assistant. Continue the following story text, adding another paragraph or two. Do not repeat the existing text. Existing text: "${existingText}"`;
    const response = await ai.models.generateContentStream({ model: textModel, contents: prompt });
    for await (const chunk of response) {
        yield chunk.text;
    }
}

export async function* autoWritePageStream(storyTitle: string, chapterTitle: string, pageSuggestion: string): AsyncGenerator<string> {
    const prompt = `You are a ghostwriter. The story is "${storyTitle}", chapter is "${chapterTitle}". Write a full, engaging page (3-4 paragraphs) based on this key idea: "${pageSuggestion}"`;
    const response = await ai.models.generateContentStream({ model: textModel, contents: prompt });
    for await (const chunk of response) {
        yield chunk.text;
    }
}

export const generatePageImage = async (pageText: string, mood: string): Promise<string> => {
    const prompt = `Generate a professional, Forbes-quality magazine illustration for a story.
Style: ${mood}.
The scene is described as: "${pageText.slice(0, 500)}".
Focus on cinematic lighting, high detail, and a clear focal point. This is a masterpiece illustration.
Negative prompt: ugly, blurry, deformed, watermark, text, signature, amateurish.`;
    try {
        const response = await ai.models.generateImages({
            model: imageModel,
            prompt: prompt,
            config: { numberOfImages: 1, outputMimeType: 'image/jpeg', aspectRatio: '16:9' },
        });
        return `data:image/jpeg;base64,${response.generatedImages[0].image.imageBytes}`;
    } catch (e) {
        console.error("Image generation failed", e);
        return ""; // Return empty string on failure
    }
};

export const suggestNewChapterTitles = async (doc: StoryDocument): Promise<string[]> => {
    const prompt = `You are a book editor. Given the following chapter contents, suggest a new, more compelling title for each chapter. Return a JSON array of strings.
    
    Story Title: ${doc.title}
    Chapters:
    ${doc.chapters.map((c, i) => `Chapter ${i+1} Content: ${c.pages.map(p => p.page_text || p.ai_suggestions[0]).join(' ').slice(0, 500)}...`).join('\n')}
    `;
    const response = await ai.models.generateContent({
        model: textModel,
        contents: prompt,
        config: {
            responseMimeType: 'application/json',
            responseSchema: { type: Type.ARRAY, items: { type: Type.STRING } }
        }
    });
    return JSON.parse(response.text.trim());
};

export const generateChapterSummaries = async (doc: StoryDocument): Promise<string[]> => {
     const prompt = `You are a book editor. For each chapter provided, write a concise 1-sentence summary. Return a JSON array of strings.
    
    Story Title: ${doc.title}
    Chapters:
    ${doc.chapters.map((c, i) => `Chapter ${i+1} Title: ${c.title}\nContent: ${c.pages.map(p => p.page_text || p.ai_suggestions[0]).join(' ').slice(0, 500)}...`).join('\n')}
    `;
     const response = await ai.models.generateContent({
        model: textModel,
        contents: prompt,
        config: {
            responseMimeType: 'application/json',
            responseSchema: { type: Type.ARRAY, items: { type: Type.STRING } }
        }
    });
    return JSON.parse(response.text.trim());
};