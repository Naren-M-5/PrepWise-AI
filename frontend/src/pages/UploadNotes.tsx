import { useState, useRef } from 'react';
import { apiService } from '../services/api';
import { storageService } from '../services/storage';
import type { StudySession } from '../types';
import { Upload, FileText, ArrowRight, Check, Loader2, AlertCircle, Eye, EyeOff } from 'lucide-react';

interface UploadNotesProps {
  setPage: (page: string) => void;
  setSelectedSessionId: (id: string | null) => void;
}

type StepStatus = 'pending' | 'running' | 'success' | 'failed';

export default function UploadNotes({ setPage, setSelectedSessionId }: UploadNotesProps) {
  const [file, setFile] = useState<File | null>(null);
  const [isDragActive, setIsDragActive] = useState(false);
  const [error, setError] = useState<string | null>(null);
  
  // Processing stages
  const [extractionStatus, setExtractionStatus] = useState<StepStatus>('pending');
  const [summaryStatus, setSummaryStatus] = useState<StepStatus>('pending');
  const [flashcardStatus, setFlashcardStatus] = useState<StepStatus>('pending');
  const [quizStatus, setQuizStatus] = useState<StepStatus>('pending');
  const [revisionStatus, setRevisionStatus] = useState<StepStatus>('pending');

  const [extractedText, setExtractedText] = useState<string>('');
  const [showPreview, setShowPreview] = useState(false);
  const [isProcessing, setIsProcessing] = useState(false);
  
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleDrag = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    if (e.type === "dragenter" || e.type === "dragover") {
      setIsDragActive(true);
    } else if (e.type === "dragleave") {
      setIsDragActive(false);
    }
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setIsDragActive(false);
    setError(null);

    if (e.dataTransfer.files && e.dataTransfer.files[0]) {
      const droppedFile = e.dataTransfer.files[0];
      if (droppedFile.type === "application/pdf") {
        setFile(droppedFile);
      } else {
        setError("Please upload a PDF file only.");
      }
    }
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setError(null);
    if (e.target.files && e.target.files[0]) {
      const selectedFile = e.target.files[0];
      if (selectedFile.type === "application/pdf") {
        setFile(selectedFile);
      } else {
        setError("Please select a PDF file.");
      }
    }
  };

  const handleTriggerUpload = () => {
    fileInputRef.current?.click();
  };

  const handleProcessNotes = async () => {
    if (!file) return;
    setIsProcessing(true);
    setError(null);

    // 1. Text Extraction
    setExtractionStatus('running');
    let text = '';
    try {
      const extractResult = await apiService.extractText(file);
      text = extractResult.extractedText;
      setExtractedText(text);
      setExtractionStatus('success');
    } catch (err: any) {
      console.error(err);
      setExtractionStatus('failed');
      setError(err.message || "Failed to extract text from PDF. Ensure the PDF contains readable text, not just scanned image layers.");
      setIsProcessing(false);
      return;
    }

    // Initialize parallel requests
    setSummaryStatus('running');
    setRevisionStatus('running');
    setFlashcardStatus('running');
    setQuizStatus('running');

    try {
      const [summaryRes, revisionRes, flashcardRes, quizRes] = await Promise.all([
        apiService.generateSummary(text).then(res => { setSummaryStatus('success'); return res; }).catch(e => { setSummaryStatus('failed'); throw e; }),
        apiService.generateRevision(text).then(res => { setRevisionStatus('success'); return res; }).catch(e => { setRevisionStatus('failed'); throw e; }),
        apiService.generateFlashcards(text).then(res => { setFlashcardStatus('success'); return res; }).catch(e => { setFlashcardStatus('failed'); throw e; }),
        apiService.generateQuiz(text).then(res => { setQuizStatus('success'); return res; }).catch(e => { setQuizStatus('failed'); throw e; })
      ]);

      // Create new study session object
      const newSession: StudySession = {
        id: Math.random().toString(36).substring(7),
        filename: file.name,
        uploadedAt: new Date().toISOString(),
        textLength: text.length,
        extractedText: text,
        summary: summaryRes,
        revision: revisionRes,
        flashcards: flashcardRes,
        quiz: quizRes
      };

      // Save to local storage
      storageService.saveSession(newSession);
      storageService.setActiveSessionId(newSession.id);
      setSelectedSessionId(newSession.id);
      
      // Dispatch success toast
      window.dispatchEvent(new CustomEvent('show-toast', { 
        detail: { message: 'Study Kit compiled successfully!', type: 'success' } 
      }));
      
      // Auto redirect to study kit
      setPage('study-kit');
    } catch (err: any) {
      console.error(err);
      const msg = err.message || "Unknown error";
      if (msg.includes("Failed to fetch") || msg.includes("NetworkError")) {
        setError("AI features require the Flask backend to be running locally. Please verify that the Flask server is running at http://localhost:5000.");
      } else {
        setError(`AI Processing failed: ${msg}. Please check the Flask server logs for details.`);
      }
      
      // Dispatch error toast
      window.dispatchEvent(new CustomEvent('show-toast', { 
        detail: { message: 'AI features require the Flask backend to be running locally.', type: 'error' } 
      }));
    }
  };

  const getStatusIcon = (status: StepStatus) => {
    switch (status) {
      case 'success':
        return <div className="h-6 w-6 rounded-full bg-emerald-500 text-white flex items-center justify-center"><Check className="h-4 w-4" /></div>;
      case 'running':
        return <Loader2 className="h-6 w-6 animate-spin text-brand-500" />;
      case 'failed':
        return <div className="h-6 w-6 rounded-full bg-red-500 text-white flex items-center justify-center font-bold text-xs">!</div>;
      default:
        return <div className="h-6 w-6 rounded-full border border-slate-350 dark:border-slate-800" />;
    }
  };

  return (
    <div className="max-w-3xl mx-auto px-4 py-8 space-y-8 animate-slide-up">
      <div>
        <h1 className="text-3xl font-extrabold tracking-tight text-slate-905 dark:text-white">
          Upload Lecture Notes
        </h1>
        <p className="text-sm text-slate-500 dark:text-slate-400 mt-1">
          Support PDF file formats. Max recommended size 15MB.
        </p>
      </div>

      {error && (
        <div className="p-4 bg-red-500/10 border border-red-500/20 text-red-600 dark:text-red-400 rounded-2xl flex items-start space-x-3 text-sm">
          <AlertCircle className="h-5 w-5 mt-0.5 flex-shrink-0" />
          <span>{error}</span>
        </div>
      )}

      {!isProcessing ? (
        <div className="space-y-6">
          {/* Drag and Drop Zone */}
          <div
            onDragEnter={handleDrag}
            onDragOver={handleDrag}
            onDragLeave={handleDrag}
            onDrop={handleDrop}
            onClick={handleTriggerUpload}
            className={`cursor-pointer border-2 border-dashed rounded-3xl p-12 text-center transition-all duration-200 relative ${
              isDragActive 
                ? 'border-brand-500 bg-brand-500/5' 
                : 'border-slate-200 dark:border-slate-800 bg-white/40 dark:bg-slate-900/10 hover:border-slate-400 dark:hover:border-slate-700'
            }`}
          >
            <input
              type="file"
              ref={fileInputRef}
              onChange={handleFileChange}
              accept=".pdf"
              className="hidden"
            />
            
            <div className="flex flex-col items-center space-y-4">
              <div className="h-16 w-16 rounded-3xl bg-brand-500/10 text-brand-500 flex items-center justify-center">
                <Upload className="h-8 w-8" />
              </div>
              
              <div>
                <p className="font-bold text-slate-850 dark:text-white text-[15px]">
                  Drag and drop your lecture PDF here
                </p>
                <p className="text-xs text-slate-400 mt-1">
                  or click to browse local files
                </p>
              </div>
            </div>
          </div>

          {/* Selected File Details */}
          {file && (
            <div className="glass rounded-3xl p-6 flex items-center justify-between shadow-sm animate-fade-in">
              <div className="flex items-center space-x-4">
                <div className="p-3 bg-slate-100 dark:bg-slate-900 rounded-2xl text-slate-500">
                  <FileText className="h-6 w-6" />
                </div>
                <div>
                  <h4 className="font-bold text-[14.5px] text-slate-900 dark:text-white truncate max-w-xs sm:max-w-md">{file.name}</h4>
                  <p className="text-xs text-slate-400 mt-0.5">{(file.size / (1024 * 1024)).toFixed(2)} MB</p>
                </div>
              </div>

              <button
                onClick={handleProcessNotes}
                className="flex items-center space-x-1.5 bg-brand-600 hover:bg-brand-500 text-white font-bold py-3 px-5 rounded-2xl text-sm transition-all duration-200 active:scale-95 focus:outline-none"
              >
                <span>Generate Study Kit</span>
                <ArrowRight className="h-4 w-4" />
              </button>
            </div>
          )}
        </div>
      ) : (
        /* Processing Status State */
        <div className="glass rounded-3xl p-6 md:p-8 shadow-sm space-y-8 animate-fade-in relative overflow-hidden glow-indigo">
          <div className="absolute top-0 right-0 left-0 h-1 bg-gradient-to-r from-brand-500 to-violet-500 animate-pulse" />
          
          <div className="flex items-center justify-between pb-4 border-b border-slate-100 dark:border-slate-850">
            <div className="flex items-center space-x-3">
              <Loader2 className="h-5 w-5 animate-spin text-brand-500" />
              <h3 className="font-bold text-slate-905 dark:text-white">Constructing your PrepWise Study Kit</h3>
            </div>
            <span className="text-xs text-slate-400 font-semibold uppercase tracking-wider">Please Wait</span>
          </div>

          <div className="space-y-5">
            {/* Step 1: Text Extract */}
            <div className="flex items-center justify-between p-2">
              <div className="flex items-center space-x-4">
                {getStatusIcon(extractionStatus)}
                <div>
                  <h4 className="font-bold text-sm text-slate-900 dark:text-white">Document Parsing</h4>
                  <p className="text-xs text-slate-450 dark:text-slate-500 mt-0.5">Extracting raw text characters from PDF pages</p>
                </div>
              </div>
              {extractionStatus === 'running' && <span className="text-xs font-semibold text-brand-500 animate-pulse">Running</span>}
            </div>

            {/* Step 2: Summary */}
            <div className="flex items-center justify-between p-2">
              <div className="flex items-center space-x-4">
                {getStatusIcon(summaryStatus)}
                <div>
                  <h4 className="font-bold text-sm text-slate-900 dark:text-white">AI Executive Summarizer</h4>
                  <p className="text-xs text-slate-450 dark:text-slate-500 mt-0.5">Generating concepts, core formulas and definitions</p>
                </div>
              </div>
              {summaryStatus === 'running' && <span className="text-xs font-semibold text-brand-500 animate-pulse">Running</span>}
            </div>

            {/* Step 3: Revision Modes */}
            <div className="flex items-center justify-between p-2">
              <div className="flex items-center space-x-4">
                {getStatusIcon(revisionStatus)}
                <div>
                  <h4 className="font-bold text-sm text-slate-900 dark:text-white">Revision Sheets Compiler</h4>
                  <p className="text-xs text-slate-450 dark:text-slate-500 mt-0.5">Structuring 2-minute, 10-minute, and cram study notes</p>
                </div>
              </div>
              {revisionStatus === 'running' && <span className="text-xs font-semibold text-brand-500 animate-pulse">Running</span>}
            </div>

            {/* Step 4: Flashcards */}
            <div className="flex items-center justify-between p-2">
              <div className="flex items-center space-x-4">
                {getStatusIcon(flashcardStatus)}
                <div>
                  <h4 className="font-bold text-sm text-slate-900 dark:text-white">Flashcard Automator</h4>
                  <p className="text-xs text-slate-450 dark:text-slate-500 mt-0.5">Drafting flip Q&A cards for active recall sessions</p>
                </div>
              </div>
              {flashcardStatus === 'running' && <span className="text-xs font-semibold text-brand-500 animate-pulse">Running</span>}
            </div>

            {/* Step 5: Quizzes */}
            <div className="flex items-center justify-between p-2">
              <div className="flex items-center space-x-4">
                {getStatusIcon(quizStatus)}
                <div>
                  <h4 className="font-bold text-sm text-slate-900 dark:text-white">Smart Exam Generator</h4>
                  <p className="text-xs text-slate-450 dark:text-slate-500 mt-0.5">Compiling MCQs, True/False, and short-answers</p>
                </div>
              </div>
              {quizStatus === 'running' && <span className="text-xs font-semibold text-brand-500 animate-pulse">Running</span>}
            </div>
          </div>

          {/* Text preview collapsible block (only shown once extracted) */}
          {extractedText && (
            <div className="border-t border-slate-100 dark:border-slate-850 pt-5">
              <button 
                onClick={() => setShowPreview(!showPreview)}
                className="flex items-center space-x-2 text-xs font-semibold text-slate-500 hover:text-slate-800 focus:outline-none transition-colors"
              >
                {showPreview ? (
                  <>
                    <EyeOff className="h-4 w-4" />
                    <span>Hide Extracted Text Preview</span>
                  </>
                ) : (
                  <>
                    <Eye className="h-4 w-4" />
                    <span>Show Extracted Text Preview ({extractedText.length} characters)</span>
                  </>
                )}
              </button>
              
              {showPreview && (
                <div className="mt-3 p-4 bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl text-[11px] leading-relaxed max-h-[150px] overflow-y-auto font-mono text-slate-600 dark:text-slate-400">
                  {extractedText}
                </div>
              )}
            </div>
          )}

          {/* Error boundary and retry actions */}
          {error && (
            <div className="border-t border-slate-100 dark:border-slate-850 pt-5 space-y-4">
              <div className="p-4 bg-red-500/10 border border-red-500/20 text-red-600 dark:text-red-400 rounded-2xl flex items-start space-x-3 text-xs">
                <AlertCircle className="h-5 w-5 mt-0.5 flex-shrink-0" />
                <span>{error}</span>
              </div>
              <div className="flex space-x-3">
                <button
                  onClick={handleProcessNotes}
                  className="bg-brand-600 hover:bg-brand-505 text-white font-bold py-2.5 px-5 rounded-2xl text-xs transition active:scale-95 cursor-pointer focus:outline-none"
                >
                  Retry Generation
                </button>
                <button
                  onClick={() => {
                    setIsProcessing(false);
                    setError(null);
                    setExtractionStatus('pending');
                    setSummaryStatus('pending');
                    setRevisionStatus('pending');
                    setFlashcardStatus('pending');
                    setQuizStatus('pending');
                    setExtractedText('');
                  }}
                  className="bg-slate-250 dark:bg-slate-800 text-slate-700 dark:text-slate-300 font-bold py-2.5 px-5 rounded-2xl text-xs transition active:scale-95 cursor-pointer focus:outline-none"
                >
                  Start Over
                </button>
              </div>
            </div>
          )}
        </div>
      )}
    </div>
  );
}
