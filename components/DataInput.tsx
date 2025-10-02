// Copyright James Burvel O’Callaghan III
// President Citibank Demo Business Inc.

import React, { useState } from 'react';
import { UploadIcon, SparklesIcon } from './Icons';

interface DataInputProps {
    onProcess: (data: string, mood: string) => void;
}

const MAX_FILE_SIZE = 100 * 1024 * 1024; // 100 MB

const DataInput: React.FC<DataInputProps> = ({ onProcess }) => {
    const [file, setFile] = useState<File | null>(null);
    const [mood, setMood] = useState<string>('');
    const [isParsing, setIsParsing] = useState(false);
    const [dragActive, setDragActive] = useState(false);
    const [error, setError] = useState<string | null>(null);

    const extractTextFromPdf = async (pdfFile: File): Promise<string> => {
        window.pdfjsLib.GlobalWorkerOptions.workerSrc = `https://cdnjs.cloudflare.com/ajax/libs/pdf.js/2.6.347/pdf.worker.min.js`;

        const loadingTask = window.pdfjsLib.getDocument(URL.createObjectURL(pdfFile));
        const pdf = await loadingTask.promise;
        let fullText = '';

        for (let i = 1; i <= pdf.numPages; i++) {
            const page = await pdf.getPage(i);
            const textContent = await page.getTextContent();
            const pageText = textContent.items.map((item: any) => item.str).join(' ');
            fullText += pageText + '\n\n';
        }
        return fullText;
    };

    const extractTextFromTxt = (txtFile: File): Promise<string> => {
        return new Promise((resolve, reject) => {
            const reader = new FileReader();
            reader.onload = (event) => {
                resolve(event.target?.result as string);
            };
            reader.onerror = (error) => {
                reject(error);
            };
            reader.readAsText(txtFile);
        });
    };

    const handleFile = (selectedFile: File | null) => {
        if (selectedFile) {
             if (selectedFile.size > MAX_FILE_SIZE) {
                setError(`File is too large. Maximum size is 100MB.`);
                setFile(null);
                return;
            }
            if (selectedFile.type === 'application/pdf' || selectedFile.type === 'text/plain') {
                setFile(selectedFile);
                setError(null);
            } else {
                setFile(null);
                setError('Please upload a valid PDF or TXT file.');
            }
        }
    };

    const handleDrag = (e: React.DragEvent) => {
        e.preventDefault();
        e.stopPropagation();
        if (e.type === "dragenter" || e.type === "dragover") {
            setDragActive(true);
        } else if (e.type === "dragleave") {
            setDragActive(false);
        }
    };

    const handleDrop = (e: React.DragEvent) => {
        e.preventDefault();
        e.stopPropagation();
        setDragActive(false);
        if (e.dataTransfer.files && e.dataTransfer.files[0]) {
            handleFile(e.dataTransfer.files[0]);
        }
    };

    const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        e.preventDefault();
        if (e.target.files && e.target.files[0]) {
            handleFile(e.target.files[0]);
        }
    };

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!file) return;

        setIsParsing(true);
        setError(null);
        try {
            let text = '';
            if (file.type === 'application/pdf') {
                text = await extractTextFromPdf(file);
            } else {
                text = await extractTextFromTxt(file);
            }

            if (!text.trim()) {
                 setError('Could not extract any text from the file. It might be empty or an image-only PDF.');
                 setIsParsing(false);
                 return;
            }
            onProcess(text, mood || 'cinematic, detailed illustration');
        } catch (err) {
            console.error("Failed to parse file", err);
            setError("Could not read the file. It might be corrupted or protected.");
            setIsParsing(false);
        }
    };

    const dropzoneClasses = dragActive 
        ? "border-violet-400 bg-violet-900/30" 
        : "border-gray-600 hover:border-gray-500";

    return (
        <div className="flex flex-col items-center justify-center h-full text-center p-4">
            <div className="w-full max-w-2xl">
                <UploadIcon className="mx-auto h-16 w-16 text-violet-400 mb-4" />
                <h2 className="text-2xl font-bold text-white mb-2">Upload Your Document</h2>
                <p className="text-gray-400 mb-6">
                    Provide a PDF or TXT document and an art style. The AI will read it and generate a complete story scaffold for you.
                </p>
                
                <form onSubmit={handleSubmit} className="w-full space-y-4">
                    <label 
                        htmlFor="file-upload"
                        className={`relative flex flex-col items-center justify-center w-full h-40 p-4 border-2 border-dashed rounded-lg cursor-pointer transition-colors ${dropzoneClasses}`}
                        onDragEnter={handleDrag} onDragLeave={handleDrag} onDragOver={handleDrag} onDrop={handleDrop}
                    >
                        <div className="text-center">
                            <p className="text-gray-400 mb-2">
                                { file ? file.name : 'Drag & drop a PDF or TXT file here, or click to select' }
                            </p>
                            <p className="text-xs text-gray-500">PDF or TXT, up to 100MB</p>
                        </div>
                        <input id="file-upload" type="file" className="hidden" onChange={handleChange} accept="application/pdf,text/plain" />
                    </label>

                    <div>
                         <label htmlFor="mood-input" className="sr-only">Art Style / Mood</label>
                         <input
                            id="mood-input"
                            type="text"
                            value={mood}
                            onChange={(e) => setMood(e.target.value)}
                            className="w-full bg-gray-900/50 border border-gray-600 rounded-lg p-3 text-gray-300 focus:outline-none focus:ring-2 focus:ring-violet-500 placeholder:text-gray-500"
                            placeholder="Optional: Describe the art style (e.g., dark fantasy, watercolor)"
                         />
                    </div>


                    {error && <p className="mt-2 text-sm text-red-400">{error}</p>}

                    <button
                        type="submit"
                        disabled={!file || isParsing}
                        className="mt-4 group relative inline-flex items-center justify-center px-8 py-3 text-lg font-bold text-white transition-all duration-200 bg-gray-900 rounded-xl focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-gray-900 disabled:opacity-50 disabled:cursor-not-allowed"
                    >
                         <span className="absolute -inset-2 rounded-xl bg-gradient-to-r from-purple-600 to-violet-600 opacity-75 blur transition-all duration-1000 group-hover:opacity-100 group-hover:-inset-1 disabled:opacity-0"></span>
                         <SparklesIcon className="w-6 h-6 mr-3"/>
                         {isParsing ? 'Reading file...' : 'Generate Story Scaffold'}
                    </button>
                </form>
            </div>
        </div>
    );
};

export default DataInput;