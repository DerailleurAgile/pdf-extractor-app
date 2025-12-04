'use client';

import React, { useState, useEffect } from 'react';
import { FileText, Download, AlertCircle, Type } from 'lucide-react';
import { PDFDocument } from 'pdf-lib';
import Footer from './components/Footer';
import packageJson from '../package.json';

export default function PDFPageExtractor() {
  const [file, setFile] = useState(null);
  const [numPages, setNumPages] = useState(0);
  const [pageRange, setPageRange] = useState('');
  const [error, setError] = useState('');
  const [processing, setProcessing] = useState(false);
  const [extractingText, setExtractingText] = useState(false);
  const [pdfjsLib, setPdfjsLib] = useState(null);

  // Load PDF.js only on client side
  useEffect(() => {
    import('pdfjs-dist').then((pdfjs) => {
      pdfjs.GlobalWorkerOptions.workerSrc = new URL(
        'pdfjs-dist/build/pdf.worker.min.mjs',
        import.meta.url
      ).toString();
      setPdfjsLib(pdfjs);
    });
  }, []);

  // Parse page range string into array of page numbers
  const parsePageRange = (rangeStr: string, maxPages: number): number[] => {
    const pages = new Set<number>();
    const parts = rangeStr.split(',').map(s => s.trim());

    for (const part of parts) {
      if (part.includes('-')) {
        // Handle range like "8-15"
        const [start, end] = part.split('-').map(s => parseInt(s.trim()));
        if (isNaN(start) || isNaN(end)) continue;
        for (let i = start; i <= end; i++) {
          if (i >= 1 && i <= maxPages) {
            pages.add(i);
          }
        }
      } else {
        // Handle single page like "5"
        const page = parseInt(part);
        if (!isNaN(page) && page >= 1 && page <= maxPages) {
          pages.add(page);
        }
      }
    }

    return Array.from(pages).sort((a, b) => a - b);
  };

  // Select a PDF file
  const handleFileChange = async (e) => {
    const selectedFile = e.target.files[0];
    
    if (!selectedFile) {
      e.target.value = '';
      return;
    }

    if (selectedFile.type !== 'application/pdf') {
      setError('Please select a valid PDF file');
      e.target.value = '';
      return;
    }

    setFile(selectedFile);
    setError('');

    if (!pdfjsLib) {
      setError('PDF library is still loading...');
      return;
    }

    try {
      const arrayBuffer = await selectedFile.arrayBuffer();
      const pdf = await pdfjsLib.getDocument({ data: arrayBuffer }).promise;
      setNumPages(pdf.numPages);
      setPageRange(`1-${pdf.numPages}`);
    } catch (err) {
      setError('Error reading PDF file');
      console.error(err);
      setFile(null);
      setNumPages(0);
      e.target.value = '';
    }
  };

  // Extract selected pages and create new PDF
  const extractPages = async () => {
    if (!file) {
      setError('Please select a PDF file');
      return;
    }

    const pages = parsePageRange(pageRange, numPages);
    
    if (pages.length === 0) {
      setError('Invalid page range. Use format like: 1, 3, 5-10, 15');
      return;
    }

    setProcessing(true);
    setError('');

    try {
      const arrayBuffer = await file.arrayBuffer();
      const pdfDoc = await PDFDocument.load(arrayBuffer);
      const newPdfDoc = await PDFDocument.create();

      // Copy selected pages (convert to 0-indexed)
      for (const pageNum of pages) {
        const [copiedPage] = await newPdfDoc.copyPages(pdfDoc, [pageNum - 1]);
        newPdfDoc.addPage(copiedPage);
      }

      const pdfBytes = await newPdfDoc.save();
      const blob = new Blob([pdfBytes], { type: 'application/pdf' });
      const url = URL.createObjectURL(blob);
      
      const link = document.createElement('a');
      link.href = url;
      const rangeDesc = pages.length === numPages ? 'all' : pages.join('-');
      link.download = `${file.name.replace('.pdf', '')}_pages_${rangeDesc}.pdf`;
      link.click();
      
      URL.revokeObjectURL(url);
    } catch (err) {
      setError('Error extracting pages');
      console.error(err);
    } finally {
      setProcessing(false);
    }
  };

  // Extract text from selected pages
  const extractText = async () => {
    if (!file) {
      setError('Please select a PDF file');
      return;
    }

    const pages = parsePageRange(pageRange, numPages);
    
    if (pages.length === 0) {
      setError('Invalid page range. Use format like: 1, 3, 5-10, 15');
      return;
    }

    if (!pdfjsLib) {
      setError('PDF library is not loaded');
      return;
    }

    setExtractingText(true);
    setError('');

    try {
      const arrayBuffer = await file.arrayBuffer();
      const pdf = await pdfjsLib.getDocument({ data: arrayBuffer }).promise;
      
      let allText = '';

      // Extract text from each page
      for (const pageNum of pages) {
        const page = await pdf.getPage(pageNum);
        const textContent = await page.getTextContent();
        const pageText = textContent.items.map(item => item.str).join(' ');
        
        allText += `--- Page ${pageNum} ---\n\n${pageText}\n\n`;
      }

      // Create and download text file
      const blob = new Blob([allText], { type: 'text/plain' });
      const url = URL.createObjectURL(blob);
      
      const link = document.createElement('a');
      link.href = url;
      const rangeDesc = pages.length === numPages ? 'all' : pages.join('-');
      link.download = `${file.name.replace('.pdf', '')}_pages_${rangeDesc}_text.txt`;
      link.click();
      
      URL.revokeObjectURL(url);
    } catch (err) {
      setError('Error extracting text');
      console.error(err);
    } finally {
      setExtractingText(false);
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100 p-8">
      <div className="max-w-2xl mx-auto">
        <div className="bg-white rounded-lg shadow-lg p-8">
          <div className="flex items-center gap-3 mb-6">
            <FileText className="w-8 h-8 text-indigo-600" />
            <h1 className="text-3xl font-bold text-gray-800">PDF Page Extractor</h1>
          </div>

          {/* Privacy Notice */}
          <div className="bg-green-50 border border-green-200 rounded-lg p-3 mb-6">
            <div className="flex gap-2 text-sm text-green-800">
              <span className="flex-shrink-0">🔒</span>
              <p>
                <span className="font-semibold">Your privacy matters:</span> All processing happens in your browser. Your files never leave your computer or touch our servers.
              </p>
            </div>
          </div>

          <div className="space-y-6">
            {/* File Upload */}
            <div>
              <label className="block text-sm font-bold text-gray-700 mb-2" style={{ fontWeight: 700 }}>
                Select PDF File
              </label>
              
              {file ? (
                <div className="flex items-center gap-3">
                  <div className="flex-1 px-3 py-2 bg-gray-50 border border-gray-300 rounded-md text-sm text-gray-700">
                    {file.name}
                  </div>
                  <button
                    onClick={() => {
                      setFile(null);
                      setNumPages(0);
                      setPageRange('');
                      setError('');
                    }}
                    className="px-4 py-2 text-sm font-medium text-indigo-600 hover:text-indigo-800"
                  >
                    Change File
                  </button>
                </div>
              ) : (
                <input
                  type="file"
                  accept="application/pdf"
                  onChange={handleFileChange}
                  className="block w-full text-sm text-gray-500 file:mr-4 file:py-2 file:px-4 file:rounded-md file:border-0 file:text-sm file:font-semibold file:bg-indigo-50 file:text-indigo-700 hover:file:bg-indigo-100 cursor-pointer"
                />
              )}
            </div>

            {/* Page Range Selection */}
            {file && numPages > 0 && (
              <div className="bg-gray-50 rounded-lg p-4 space-y-4">
                <p className="text-sm text-gray-600">
                  Total pages: <span className="font-semibold text-gray-800">{numPages}</span>
                </p>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Page Range
                  </label>
                  <input
                    type="text"
                    value={pageRange}
                    onChange={(e) => setPageRange(e.target.value)}
                    placeholder="e.g., 1, 3, 5-10, 15"
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-indigo-500"
                  />
                  <p className="text-xs text-gray-500 mt-1">
                    Enter single pages (5) or ranges (8-15), separated by commas
                  </p>
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <button
                    onClick={extractPages}
                    disabled={processing}
                    className="bg-indigo-600 text-white py-3 rounded-md font-medium hover:bg-indigo-700 disabled:bg-gray-400 disabled:cursor-not-allowed flex items-center justify-center gap-2 transition-colors"
                  >
                    {processing ? (
                      <>Processing...</>
                    ) : (
                      <>
                        <Download className="w-5 h-5" />
                        Extract PDF
                      </>
                    )}
                  </button>

                  <button
                    onClick={extractText}
                    disabled={extractingText}
                    className="bg-emerald-600 text-white py-3 rounded-md font-medium hover:bg-emerald-700 disabled:bg-gray-400 disabled:cursor-not-allowed flex items-center justify-center gap-2 transition-colors"
                  >
                    {extractingText ? (
                      <>Extracting...</>
                    ) : (
                      <>
                        <Type className="w-5 h-5" />
                        Extract Text
                      </>
                    )}
                  </button>
                </div>
              </div>
            )}

            {/* Error Message */}
            {error && (
              <div className="bg-red-50 border border-red-200 rounded-lg p-4 flex items-start gap-3">
                <AlertCircle className="w-5 h-5 text-red-600 flex-shrink-0 mt-0.5" />
                <p className="text-sm text-red-800">{error}</p>
              </div>
            )}

            {/* Instructions */}
            <div className="bg-blue-50 rounded-lg p-4 border border-blue-200">
              <h3 className="font-medium text-blue-900 mb-2">How to use:</h3>
              <ol className="text-sm text-blue-800 space-y-1 list-decimal list-inside">
                <li>Upload a PDF file</li>
                <li>Enter pages to extract (e.g., "5, 8-15" for page 5 and pages 8-15)</li>
                <li>Click "Extract PDF" to download pages as a new PDF</li>
                <li>Click "Extract Text" to download text content as a .txt file</li>
              </ol>
            </div>
          </div>
        </div>
        <Footer version={packageJson.version} />
      </div>
    </div>
  );
}