import React from "react";

export const LoadingScreen = () => (
  <div className="flex flex-col items-center justify-center h-screen bg-gray-900 text-white">
    <div className="animate-spin h-16 w-16 border-t-4 border-orange-500 rounded-full mb-4"></div>
    <p className="text-xl font-semibold">Carregando Partiu085...</p>
  </div>
);
