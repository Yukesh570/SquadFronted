import React from "react";
import { TrendingUp, TrendingDown, Minus } from "lucide-react";

interface StatCardProps {
  title: string;
  value: string | number;
  icon: React.ReactNode;
  trend?: number;
  trendText?: string;
}

const StatCard: React.FC<StatCardProps> = ({ title, value, icon, trend, trendText }) => {
  const isPositive = trend !== undefined && trend > 0;
  const isNegative = trend !== undefined && trend < 0;

  return (
    <div className="bg-white dark:bg-gray-800 rounded-xl border border-gray-100 dark:border-gray-700 p-6 shadow-sm flex flex-col transition-shadow hover:shadow-md">
      <div className="flex justify-between items-start mb-4">
        <div className="p-3 bg-primary/10 dark:bg-primary/20 rounded-lg text-primary">
          {icon}
        </div>
        {trend !== undefined && (
          <div
            className={`flex items-center space-x-1 text-sm font-medium px-2.5 py-1 rounded-full ${
              isPositive
                ? "text-green-700 bg-green-50 dark:bg-green-900/30 dark:text-green-400"
                : isNegative
                ? "text-red-700 bg-red-50 dark:bg-red-900/30 dark:text-red-400"
                : "text-gray-600 bg-gray-50 dark:bg-gray-700 dark:text-gray-400"
            }`}
          >
            {isPositive ? (
              <TrendingUp size={14} />
            ) : isNegative ? (
              <TrendingDown size={14} />
            ) : (
              <Minus size={14} />
            )}
            <span>{Math.abs(trend)}%</span>
          </div>
        )}
      </div>
      <div>
        <h3 className="text-text-secondary dark:text-gray-400 text-sm font-medium mb-1">
          {title}
        </h3>
        <h2 className="text-2xl font-bold text-text-primary dark:text-white">
          {value}
        </h2>
        {trendText && (
          <p className="text-xs text-text-secondary dark:text-gray-500 mt-2">
            {trendText}
          </p>
        )}
      </div>
    </div>
  );
};

export default StatCard;