import React from "react";

export default function Button({
  children,
  onClick,
  type = "button",
  variant = "primary",
  disabled = false,
  fullWidth = false,
}) {
  let baseClasses =
    "transition font-semibold rounded-xl shadow-md focus:outline-none focus:ring-2 focus:ring-offset-2 select-none";

  let variantClasses = "";

  switch (variant) {
    case "primary":
      variantClasses =
        "bg-indigo-500 hover:bg-indigo-600 text-white focus:ring-indigo-300";
      break;

    case "secondary":
      variantClasses =
        "bg-sky-500 hover:bg-sky-600 text-white focus:ring-sky-300";
      break;

    case "danger": // 🔴 Botões vermelhos (Excluir)
      variantClasses =
        "bg-red-500 hover:bg-red-600 text-white focus:ring-red-300";
      break;

    case "outline":
      variantClasses =
        "border border-indigo-400 text-indigo-500 hover:bg-indigo-50 focus:ring-indigo-200";
      break;

    default:
      variantClasses = "bg-gray-200 text-gray-700 hover:bg-gray-300";
  }

  let sizeClasses =
    "px-4 py-2 sm:px-5 sm:py-3 text-sm sm:text-base"; // 🔹 ajusta fonte e padding conforme tela

  if (fullWidth) sizeClasses += " w-full";

  return (
    <button
      type={type}
      onClick={onClick}
      disabled={disabled}
      className={`${baseClasses} ${variantClasses} ${sizeClasses} ${
        disabled ? "opacity-60 cursor-not-allowed" : ""
      }`}
    >
      {children}
    </button>
  );
}
