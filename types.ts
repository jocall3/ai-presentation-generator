
export type AppState = 'INPUT' | 'EDITING';

export type RobotState = 'idle' | 'thinking' | 'writing';

export interface PageScaffold {
  id: string;
  page_number: number;
  page_text: string;
  ai_suggestions: string[];
  images: string[]; // URLs or base64 strings
}

export interface ChapterScaffold {
  id: string;
  title: string;
  summary: string;
  pages: PageScaffold[];
}

export interface StoryDocument {
  id: string;
  title: string;
  chapters: ChapterScaffold[];
}

export interface PageHandlers {
    onUpdatePage: (chapterId: string, pageId: string, updates: Partial<PageScaffold>) => void;
    onExpandTextStream: (chapterId: string, pageId: string) => Promise<void>;
    onGenerateImage: (chapterId: string, pageId: string) => Promise<void>;
    onAutoWritePageStream: (chapterId: string, pageId: string) => Promise<void>;
}

export interface EditorActions {
    onAutoDraftAll: () => Promise<void>;
    onSuggestTitles: () => Promise<void>;
    onSummarizeChapters: () => Promise<void>;
}


// Add a declaration for the global libraries from the CDN
declare global {
    interface Window {
        pdfjsLib: any;
        jspdf: any;
    }
}
