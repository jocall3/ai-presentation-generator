import { GoogleGenAI, Type } from "@google/genai";
import type { PresentationDocument, SlideScaffold } from '../types';

const API_KEY = process.env.API_KEY;
if (!API_KEY) {
    throw new Error("API_KEY environment variable not set");
}

const ai = new GoogleGenAI({ apiKey: API_KEY });

const slideScaffoldSchema = {
    type: Type.OBJECT,
    properties: {
        title: { type: Type.STRING, description: "A concise, engaging title for this presentation slide." },
        content: {
            type: Type.ARRAY,
            items: { type: Type.STRING },
            description: "3-5 key bullet points summarizing the main information. Each bullet should be a string."
        },
        image_prompt: {
            type: Type.STRING,
            description: "A descriptive prompt for a visually appealing, professional image relevant to the slide's content. E.g., 'A minimalist graphic of a rising stock chart with a blue background'."
        }
    },
    required: ["title", "content", "image_prompt"],
};

export const generatePresentationTitle = async (firstChunk: string): Promise<string> => {
    const prompt = `Based on the following text, generate a single, professional, and fitting title for a presentation. Return only the title as a plain string.

    Text excerpt:
    ---
    ${firstChunk.slice(0, 2000)} 
    ---
    
    Presentation Title:`;

    const response = await ai.models.generateContent({
        model: 'gemini-2.5-flash',
        contents: prompt,
    });
    
    return response.text.trim().replace(/"/g, ''); // Clean up potential quotes
};

export const generateSlideImage = async (prompt: string): Promise<string> => {
    try {
        const response = await ai.models.generateImages({
            model: 'imagen-3.0-generate-002',
            prompt: prompt,
            config: {
                numberOfImages: 1,
                outputMimeType: 'image/jpeg',
                aspectRatio: '16:9',
            },
        });
        const base64ImageBytes: string = response.generatedImages[0].image.imageBytes;
        return `data:image/jpeg;base64,${base64ImageBytes}`;
    } catch (e) {
        console.error("Image generation failed, returning null", e);
        return ""; // Return empty string on failure
    }
};


export const generateSlideFromChunk = async (chunk: string, slideNumber: number, totalSlides: number, presentationTitle: string): Promise<SlideScaffold> => {
    const prompt = `You are an AI presentation assistant. The overall presentation is titled "${presentationTitle}".
    This is for Slide ${slideNumber} of ${totalSlides}.

    Based on the following data chunk, create the content for a single presentation slide. The content must include a concise slide title, 3-5 key bullet points, and a descriptive prompt for a relevant, professional image.

    Data chunk for this slide:
    ---
    ${chunk}
    ---
    
    Generate the slide content.`;

    const response = await ai.models.generateContent({
        model: 'gemini-2.5-flash',
        contents: prompt,
        config: {
            responseMimeType: 'application/json',
            responseSchema: slideScaffoldSchema,
        }
    });

    const jsonText = response.text.trim();
    const parsed = JSON.parse(jsonText);

    // Generate image in parallel
    const imageUrl = await generateSlideImage(parsed.image_prompt);

    const slideScaffold: SlideScaffold = {
        id: crypto.randomUUID(),
        title: parsed.title,
        content: parsed.content || [],
        imageUrl: imageUrl || null,
    };
    
    return slideScaffold;
};

export const regenerateSlideContent = async (slideTitle: string): Promise<string[]> => {
    const prompt = `You are an AI presentation assistant. For a slide titled "${slideTitle}", generate 3-5 key bullet points. The tone should be professional and concise.`;
    
    const response = await ai.models.generateContent({
        model: 'gemini-2.5-flash',
        contents: prompt,
        config: {
            responseMimeType: 'application/json',
            responseSchema: {
                type: Type.OBJECT,
                properties: {
                    content: {
                        type: Type.ARRAY,
                        items: { type: Type.STRING },
                    }
                },
                required: ['content']
            }
        }
    });
    
    const parsed = JSON.parse(response.text.trim());
    return parsed.content || [];
};

const generateImagePromptForSlide = async (title: string, content: string[]): Promise<string> => {
    const prompt = `Generate a descriptive prompt for a visually appealing, professional image relevant to the following presentation slide content. The prompt should be suitable for an AI image generator.

    Slide Title: "${title}"
    Slide Content: ${content.join(', ')}

    Image Prompt:`;
    
    const response = await ai.models.generateContent({
        model: 'gemini-2.5-flash',
        contents: prompt
    });
    
    return response.text.trim().replace(/"/g, '');
};

export const generateImageForSlide = async (title: string, content: string[]): Promise<string> => {
    const imagePrompt = await generateImagePromptForSlide(title, content);
    return await generateSlideImage(imagePrompt);
};


export const answerQuestionAboutPresentation = async (presentation: PresentationDocument, question: string): Promise<string> => {
    const presentationContext = `
        Presentation Title: ${presentation.title}
        Slides:
        ---
        ${presentation.slides.map((slide, index) => 
            `Slide ${index + 1}: ${slide.title}\n${slide.content.map(c => `- ${c}`).join('\n')}`
        ).join('\n\n')}
        ---
    `;

    const prompt = `You are an AI assistant with expertise in the content of the following presentation. Based ONLY on the provided text, answer the user's question concisely. If the answer is not in the text, say "I cannot find that information in the presentation."
    
    ${presentationContext}

    User Question: "${question}"

    Answer:
    `;
    
    const response = await ai.models.generateContent({
        model: 'gemini-2.5-flash',
        contents: prompt
    });

    return response.text.trim();
};