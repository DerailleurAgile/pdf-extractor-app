import { FileText } from 'lucide-react';

export default function Header() {
  return (
    <>
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
    </>
  );
}