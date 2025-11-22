import React from "react";

interface PrimaryButtonProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  label: string;
  icon?: React.ReactNode;
}

export const PrimaryButton: React.FC<PrimaryButtonProps> = ({ label, icon, ...props }) => {
  return (
    <button
      {...props}
      className={`flex items-center justify-center gap-2 px-6 py-3
        bg-orange-500 hover:bg-orange-600
        text-white font-semibold rounded-xl shadow-md
        transition-all duration-200 disabled:opacity-50 disabled:cursor-not-allowed
        ${props.className || ""}`}
    >
      {icon && <span className="text-lg">{icon}</span>}
      {label}
    </button>
  );
};
