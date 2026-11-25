import React from "react";

export const Footer: React.FC = () => (
  <footer className="bg-white border-t border-slate-200 text-slate-500 py-8 mt-auto">
    <div className="max-w-7xl mx-auto px-4 flex flex-col sm:flex-row justify-between items-center text-sm">
      <p className="font-medium text-slate-700">© {new Date().getFullYear()} IntelliCampus AI Systems. All rights reserved.</p>
      <p className="mt-2 sm:mt-0">Built with React, TypeScript, Express, MongoDB & Google Gemini AI</p>
    </div>
  </footer>
);
