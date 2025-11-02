const Dashboard = () => {
  return (
    <div className="container mx-auto">
      <h1 className="text-3xl font-semibold text-gray-900 dark:text-white">Dashboard</h1>
      <p className="mt-2 text-gray-900 dark:text-white">
        Welcome to the Park Alarm admin panel.
      </p>

      {/* Placeholder for stats cards */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mt-6">
        <div className="p-6 bg-white  dark:bg-gray-800 rounded-lg shadow-md">
          <h3 className="text-lg font-mediumtext-gray-900 dark:text-white">Total Users</h3>
          <p className="mt-2 text-3xl font-semibold text-gray-900 dark:text-white">1,234</p>
        </div>
        <div className="p-6 bg-white dark:bg-gray-800 rounded-lg shadow-md">
          <h3 className="text-lg font-medium text-gray-900 dark:text-white">Active Alarms</h3>
          <p className="mt-2 text-3xl font-semibold text-red-600">56</p>
        </div>
        <div className="p-6 bg-white  dark:bg-gray-800 rounded-lg shadow-md">
          <h3 className="text-lg font-medium text-gray-900 dark:text-white">Parks Monitored</h3>
          <p className="mt-2 text-3xl font-semibold text-gray-900 dark:text-white">12</p>
        </div>
      </div>
    </div>
  );
};

export default Dashboard;