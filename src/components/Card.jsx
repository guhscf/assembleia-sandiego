import React from "react";

export default function Card({ title, children, className = "" }) {
  return (
    <div
      className={`
        bg-white/40 backdrop-blur-md rounded-2xl shadow-lg border border-white/30
        p-5 sm:p-6 lg:p-8
        transition-all duration-300
        hover:shadow-xl
        ${className}
      `}
    >
      {title && (
        <h2 className="text-xl sm:text-2xl font-bold text-gray-800 mb-4 text-center sm:text-left">
          {title}
        </h2>
      )}
      <div className="text-gray-700 text-sm sm:text-base">{children}</div>
    </div>
  );
}
