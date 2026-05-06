// src/helper/dateFormatter.ts

export const formatDateTime = (dateString?: string | null) => {
  if (!dateString) return "-";

  // 1. Fetch the timezone from browser cache. 
  // If it doesn't exist yet, fallback to "UTC" (or your preferred default)
  const appTimezone = localStorage.getItem("app_timezone") || "UTC";

  try {
    const date = new Date(dateString);

    // 2. Use the built-in browser Intl API to force the date into the selected timezone
    return new Intl.DateTimeFormat("en-US", {
      timeZone: appTimezone,
      year: "numeric",
      month: "2-digit",
      day: "2-digit",
      hour: "2-digit",
      minute: "2-digit",
      second: "2-digit",
      hour12: true, // Set to false if you prefer 24-hour time
    }).format(date);

  } catch (error) {
    // Fallback just in case the timezone string is somehow invalid
    console.error("Timezone formatting error:", error);
    return new Date(dateString).toLocaleString();
  }
};