export type AppState = 'INPUT' | 'EDITING';

export interface SlideScaffold {
  id: string;
  title: string;
  content: string[]; // Array of strings for bullet points
  imageUrl: string | null;
}

export interface PresentationDocument {
  id: string;
  title: string;
  slides: SlideScaffold[];
}

export interface SlideHandlers {
    onUpdateSlide: (slideId: string, updates: Partial<SlideScaffold>) => void;
    onRegenerateContent: (slideId: string) => Promise<void>;
    onRegenerateImage: (slideId: string) => Promise<void>;
}

export interface ChatMessage {
    role: 'user' | 'model';
    content: string;
}

// Add a declaration for the global libraries from the CDN
declare global {
    interface Window {
        pdfjsLib: any;
        PptxGenJS: any;
    }
}