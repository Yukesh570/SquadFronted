import React from "react";
import { Link } from "react-router-dom";

const NotFound = () => {
  return (
    <div className="flex flex-col items-center justify-center min-h-screen bg-gray-50 dark:bg-gray-900 text-gray-800 px-6 -mt-20">
      {/* Illustration */}
      <svg
        xmlns="http://www.w3.org/2000/svg"
        className="w-64 h-64 mb-8"
        viewBox="0 0 1024 1024"
        fill="none"
      >
        <path
          d="M256 512a256 256 0 11512 0 256 256 0 01-512 0z"
          fill="#e0e7ff"
        />
        <path
          d="M341 512h60v-90h60v90h60v60h-60v90h-60v-90h-60v-60zM603 512h60v-90h60v90h60v60h-60v90h-60v-90h-60v-60z"
          fill="#4f46e5"
        />
        <circle cx="512" cy="512" r="380" stroke="#c7d2fe" strokeWidth="16" />
      </svg>

      {/* Title */}
      <h1 className="text-5xl font-bold text-indigo-600 mb-4">404</h1>
      <p className="text-lg text-gray-900 dark:text-white mb-6 text-center max-w-md">
        Oops! The page you’re looking for doesn’t exist or has been moved.
      </p>

      {/* Button */}
      <Link
        to="/"
        className="bg-indigo-600 text-white px-6 py-3 rounded-lg shadow hover:bg-indigo-700 transition"
      >
        Go Back Home
      </Link>
    </div>
  );
};

export default NotFound;
