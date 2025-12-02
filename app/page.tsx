'use client';

import React, { useState, useEffect } from 'react';
import { FileText, Download, AlertCircle } from 'lucide-react';
import { PDFDocument } from 'pdf-lib';

export default function PDFPageExtractor() {
  const [file, setFile] = useState(null);
  const [numPages, setNumPages] = useState(0);
  const [startPage, setStartPage] = useState<number | ''>('');
  const [endPage, setEndPage] = useState<number | ''>('');
  const [error, setError] = useState('');
  const [processing, setProcessing] = useState(false);
  const [pdfjsLib, setPdfjsLib] = useState(null);

  // Load PDF.js only on client side
  // useEffect(() => {
  //   import('pdfjs-dist').then((pdfjs) => {
  //     pdfjs.GlobalWorkerOptions.workerSrc = `//cdnjs.cloudflare.com/ajax/libs/pdf.js/3.11.174/pdf.worker.min.js`;
  //     setPdfjsLib(pdfjs);
  //   });
  // }, []);

  // Load PDF.js only on client side
  useEffect(() => {
    import('pdfjs-dist').then((pdfjs) => {
      // Use the worker from the installed npm package
      pdfjs.GlobalWorkerOptions.workerSrc = new URL(
        'pdfjs-dist/build/pdf.worker.min.mjs',
        import.meta.url
      ).toString();
      setPdfjsLib(pdfjs);
    });
  }, []);

  // Select a PDF file
  // Select a PDF file
  const handleFileChange = async (e) => {
    const selectedFile = e.target.files[0];
    
    // If no file selected (user cancelled), keep existing state
    if (!selectedFile) {
      // Reset the input so the same file can be selected again if needed
      e.target.value = '';
      return;
    }

    if (selectedFile.type !== 'application/pdf') {
      setError('Please select a valid PDF file');
      // Reset the input
      e.target.value = '';
      return;
    }

    setFile(selectedFile);
    setError('');

    if (!pdfjsLib) {
      setError('PDF library is still loading...');
      return;
    }

    // Read the PDF to get number of pages
    try {
      const arrayBuffer = await selectedFile.arrayBuffer();
      const pdf = await pdfjsLib.getDocument({ data: arrayBuffer }).promise;
      setNumPages(pdf.numPages);
      setStartPage(1);
      setEndPage(pdf.numPages);
    } catch (err) {
      setError('Error reading PDF file');
      console.error(err);
      // Reset file state on error
      setFile(null);
      setNumPages(0);
      e.target.value = '';
    }
  };

  // Extract selected pages and create new PDF
  const extractPages = async () => {
    const start = startPage === '' ? 1 : startPage;
    const end = endPage === '' ? numPages : endPage;
    
    if (!file || start < 1 || end > numPages || start > end) {
      setError('Invalid page range');
      return;
    }

    setProcessing(true);
    setError('');

    try {
      const arrayBuffer = await file.arrayBuffer();
      const pdfDoc = await PDFDocument.load(arrayBuffer);
      const newPdfDoc = await PDFDocument.create();

      // Copy selected pages -- ah, classic for .. let i = loops...
      for (let i = startPage - 1; i < endPage; i++) {
        const [copiedPage] = await newPdfDoc.copyPages(pdfDoc, [i]);
        newPdfDoc.addPage(copiedPage);
      }

      const pdfBytes = await newPdfDoc.save();
      const blob = new Blob([pdfBytes], { type: 'application/pdf' });
      const url = URL.createObjectURL(blob);
      
      const link = document.createElement('a');
      link.href = url;
      link.download = `${file.name.replace('.pdf', '')}_pages_${startPage}-${endPage}.pdf`;
      link.click();
      
      URL.revokeObjectURL(url);
    } catch (err) {
      setError('Error extracting pages');
      console.error(err);
    } finally {
      setProcessing(false);
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
                      setStartPage('');
                      setEndPage('');
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

            {/* Page Info and Range Selection */}
            {file && numPages > 0 && (
              <div className="bg-gray-50 rounded-lg p-4 space-y-4">
                <p className="text-sm text-gray-600">
                  Total pages: <span className="font-semibold text-gray-800">{numPages}</span>
                </p>

                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Start Page
                    </label>
                    <input
                      type="number"
                      min="1"
                      max={numPages}
                      value={startPage}
                      onChange={(e) => {
                        const val = e.target.value;
                        if (val === '') {
                          setStartPage('');
                        } else {
                          const num = parseInt(val);
                          if (!isNaN(num)) {
                            setStartPage(num);
                          }
                        }
                      }}
                      className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-indigo-500"
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      End Page
                    </label>
                    <input
                      type="number"
                      min="1"
                      max={numPages}
                      value={endPage}
                      onChange={(e) => {
                        const val = e.target.value;
                        if (val === '') {
                          setEndPage('');
                        } else {
                          const num = parseInt(val);
                          if (!isNaN(num)) {
                            setEndPage(num);
                          }
                        }
                      }}
                      className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-indigo-500"
                    />
                  </div>
                </div>

                <button
                  onClick={extractPages}
                  disabled={processing}
                  className="w-full bg-indigo-600 text-white py-3 rounded-md font-medium hover:bg-indigo-700 disabled:bg-gray-400 disabled:cursor-not-allowed flex items-center justify-center gap-2 transition-colors"
                >
                  {processing ? (
                    <>Processing...</>
                  ) : (
                    <>
                      <Download className="w-5 h-5" />
                      Extract Pages {startPage}-{endPage}
                    </>
                  )}
                </button>
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
                <li>Select the page range you want to extract</li>
                <li>Click "Extract Pages" to download the new PDF</li>
              </ol>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
