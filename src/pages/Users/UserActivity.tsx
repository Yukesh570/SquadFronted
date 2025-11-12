import { useState } from "react";
import { Search, Trash2, Home, ChevronLeft, ChevronRight, CirclePlus } from "lucide-react";
import { NavLink } from "react-router-dom";
import Select from "../../components/ui/Select";
import Button from "../../components/ui/Button";
import Input from "../../components/ui/Input";
import CustomDatePicker from "../../components/ui/DatePicker";

const rowsOptions = [
  { value: "10", label: "10" },
  { value: "25", label: "25" },
  { value: "50", label: "50" },
];

const UserActivity = () => {
  const activities = [];
  const headers = ["User Id", "Email", "Phone Number", "Created At", "First Name", "Last Name"];
  const [id, setId] = useState("");
  const [email, setEmail] = useState("");
  const [createdAt, setCreatedAt] = useState<Date | null>(null);
  const [firstName, setFirstName] = useState("");
  const [lastName, setLastName] = useState("");
  const [phoneNumber, setPhoneNumber] = useState("");
  const [rowsPerPage, setRowsPerPage] = useState("10");

  const handleClearFilters = () => {
    setId("");
    setEmail("");
    setCreatedAt(null);
    setFirstName("");
    setLastName("");
    setPhoneNumber("");
  };

  return (
    <div className="container mx-auto">
      {/* 1. BREADCRUMBS AND TITLE */}
      <div className="mb-8 flex items-center justify-between">
        <h1 className="text-2xl font-semibold text-text-primary">
          SMTP Server
        </h1>
        <div className="flex items-center space-x-2 text-sm text-text-secondary">
          <Home size={16} className="text-gray-400" />
          <NavLink
            to="/dashboard"
            className="text-gray-400 hover:text-primary"
          >
            Home
          </NavLink>
          <span>/</span>
          <span className="text-text-primary">SMTP Server</span>
        </div>
      </div>
      <div className="mb-4 flex justify-end">
        <Button variant="primary" leftIcon={<CirclePlus size={16} />}>
          Add Server
        </Button>
      </div>

      {/* 2. FILTER CARD */}
      <div className="mb-6 rounded-xl bg-white p-5 shadow-card">
        <div className="grid grid-cols-1 gap-5 md:grid-cols-4 lg:grid-cols-6">


          <Input
            label="Search by ID"
            type="text"
            placeholder="User ID"
            value={id}
            onChange={(e) => setId(e.target.value)}
          />
          <Input
            label="Search by Email"
            type="email"
            placeholder="user@email.com"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
          />

          <Input
            label="Search by Phone Number"
            type="text"
            placeholder="e.g. 123-456-7890"
            value={phoneNumber}
            onChange={(e) => setPhoneNumber(e.target.value)}
          />

          <CustomDatePicker
            label="Created At"
            selected={createdAt}
            onChange={(date) => setCreatedAt(date)}
          />

          <Input
            label="Search by First Name"
            type="text"
            placeholder="e.g. Ujjwal"
            value={firstName}
            onChange={(e) => setFirstName(e.target.value)}
          />

          <Input
            label="Search by Last Name"
            type="text"
            placeholder="e.g. Maharjan"
            value={lastName}
            onChange={(e) => setLastName(e.target.value)}
          />

        </div>

        <div className="mt-5 flex space-x-3">
          <Button variant="primary" leftIcon={<Search size={16} />}>
            Search
          </Button>
          <Button
            variant="secondary"
            leftIcon={<Trash2 size={16} />}
            onClick={handleClearFilters}
          >
            Clear
          </Button>
        </div>
      </div>

      {/* 3. DATA TABLE CARD */}
      <div className="rounded-xl bg-white shadow-card overflow-hidden">

        {/* --- PAGINATION & CSV BUTTON --- */}
        <div className="flex items-center justify-between border-b border-gray-200 p-4">
          <div className="flex items-center space-x-4">
            <div className="flex items-center space-x-2">
              <span className="text-sm text-text-secondary">Rows per page:</span>
              <div className="w-20">
                <Select
                  value={rowsPerPage}
                  onChange={setRowsPerPage}
                  options={rowsOptions}
                />
              </div>
            </div>

            <span className="text-sm text-text-secondary">
              0-0 of 0
            </span>
            <div className="flex items-center space-x-2">
              <button className="rounded border border-transparent p-1 text-gray-400 hover:text-primary hover:bg-gray-100 disabled:text-black-200" disabled>
                <ChevronLeft size={20} />
              </button>
              <button className="rounded border border-transparent p-1 text-gray-400 hover:text-primary hover:bg-gray-100 disabled:text-black-200" disabled>
                <ChevronRight size={20} />
              </button>
            </div>
          </div>

          {/* <Button variant="primary" leftIcon={<Download size={16} />}>
            Download CSV
          </Button> */}
        </div>

        {/* Table (with horizontal scroll) */}
        <div className="overflow-x-auto">
          <table className="min-w-full divide-y divide-gray-200">
            <thead className="bg-gray-50">
              <tr>
                {headers.map((header) => (
                  <th
                    key={header}
                    className="px-4 py-3 text-left text-xs font-medium uppercase tracking-wider text-text-secondary"
                  >
                    {header}
                  </th>
                ))}
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-200 bg-white">
              {activities.length === 0 ? (
                <tr>
                  <td
                    colSpan={headers.length}
                    className="px-4 py-6 text-center text-text-secondary"
                  >
                    No activity found.
                  </td>
                </tr>
              ) : (
                <></>
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
};

export default UserActivity;