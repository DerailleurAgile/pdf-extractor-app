export default function Footer() {
  const currentYear = new Date().getFullYear();
  
  return (
    <footer className="bg-gradient-to-br from-blue-50 to-indigo-100 py-2">
        <div className="max-w-2xl mx-auto text-center">
            <p className="text-xs text-gray-500">
            Created by <span className="text-indigo-600">Chris</span> © 2025
            </p>
        </div>
    </footer>
  );
}