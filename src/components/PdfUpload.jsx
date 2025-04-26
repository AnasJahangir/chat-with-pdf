import React from "react";

const PdfUpload = ({ onFileSelect }) => {
  return (
    <div className="mb-8 animate-fade-up">
      <input
        type="file"
        accept="application/pdf"
        onChange={(e) => onFileSelect(e.target.files[0])}
        className="block w-full text-sm text-gray-300
          file:mr-4 file:py-3 file:px-6
          file:rounded-2xl file:border-0
          file:text-sm file:font-semibold
          file:bg-gradient-to-r file:from-purple-600 file:to-pink-500 file:text-white
          hover:file:brightness-110
          transition-all duration-300 cursor-pointer"
      />
    </div>
  );
};

export default PdfUpload;
