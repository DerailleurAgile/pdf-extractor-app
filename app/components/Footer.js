export default function Footer({ version }) {
  const currentYear = new Date().getFullYear();
  
  return (
    <footer className="bg-gradient-to-br from-blue-50 to-indigo-100 py-3 mt-auto border-t border-indigo-200">
      <div className="max-w-2xl mx-auto px-8 text-center">
        <p className="text-xs text-gray-600">
          Created by <span className="font-semibold text-indigo-700">Chris!</span> © {currentYear} • v{version}
        </p>
      </div>
    </footer>
  );
}