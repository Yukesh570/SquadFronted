import { useState, useEffect } from "react";
import { Search, Trash2, Home, Plus, ChevronLeft, ChevronRight, Edit, Trash } from "lucide-react";
import { NavLink } from "react-router-dom";
import { toast } from "react-toastify";
import { getSmtpServersApi, type SmtpServerData } from "../../api/smtpApi/smtpApi";
import { AddSmtpModal } from "../../components/modals/AddSmtpModal";
import Select from "../../components/ui/Select";
import Button from "../../components/ui/Button";
import Input from "../../components/ui/Input";

const rowsOptions = [
    { value: "10", label: "10" },
    { value: "25", label: "25" },
    { value: "50", label: "50" },
];

const SmtpServer = () => {
    const [servers, setServers] = useState<SmtpServerData[]>([]);
    const [isLoading, setIsLoading] = useState(true);
    const [isModalOpen, setIsModalOpen] = useState(false);

    const [serverName, setServerName] = useState("");
    const [email, setEmail] = useState("");
    const [rowsPerPage, setRowsPerPage] = useState("10");

    const fetchServers = async () => {
        setIsLoading(true);
        try {
            const data = await getSmtpServersApi();
            setServers(data);
        } catch (error) {
            toast.error("Failed to fetch SMTP servers.");
            console.error(error);
        } finally {
            setIsLoading(false);
        }
    };

    useEffect(() => {
        fetchServers();
    }, []);

    const handleClearFilters = () => {
        setServerName("");
        setEmail("");
    };

    const headers = ["Server Name", "Email", "SMTP Server", "Port", "User Name", "Actions"];

    return (
        <div className="container mx-auto">
            {/* ... (Breadcrumbs and Filter Card are unchanged) ... */}
            <div className="mb-8 flex items-center justify-between">
                <h1 className="text-2xl font-semibold text-text-primary dark:text-white">
                    SMTP Servers
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
                    <span className="text-text-primary dark:text-white">SMTP Servers</span>
                </div>
            </div>
            <div className="mb-6 rounded-xl bg-white p-5 shadow-card dark:bg-gray-800">
                <div className="grid grid-cols-1 gap-5 md:grid-cols-4 lg:grid-cols-6">
                    <Input
                        label="Search by Server Name"
                        type="text"
                        placeholder="Server Name"
                        value={serverName}
                        onChange={(e) => setServerName(e.target.value)}
                    />
                    <Input
                        label="Search by Email"
                        type="email"
                        placeholder="user@email.com"
                        value={email}
                        onChange={(e) => setEmail(e.target.value)}
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

            {/* --- DATA TABLE CARD --- */}
            <div className="rounded-xl bg-white shadow-card overflow-hidden dark:bg-gray-800">
                {/* ... (Pagination & "Add Server" Button are unchanged) ... */}
                <div className="flex items-center justify-between border-b border-gray-200 dark:border-gray-700 p-4">
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
                            1-10 of {servers.length}
                        </span>
                        <div className="flex items-center space-x-2">
                            <button className="rounded border border-transparent p-1 text-gray-400 hover:text-primary hover:bg-gray-100 disabled:text-gray-300" disabled>
                                <ChevronLeft size={20} />
                            </button>
                            <button className="rounded border border-transparent p-1 text-gray-400 hover:text-primary hover:bg-gray-100 disabled:text-gray-300" disabled>
                                <ChevronRight size={20} />
                            </button>
                        </div>
                    </div>

                    <Button
                        variant="primary"
                        leftIcon={<Plus size={16} />}
                        onClick={() => setIsModalOpen(true)}
                    >
                        Add Server
                    </Button>
                </div>

                {/* Table */}
                <div className="overflow-x-auto">
                    <table className="min-w-full divide-y divide-gray-200 dark:divide-gray-700">
                        <thead className="bg-gray-50 dark:bg-gray-700">
                            <tr>
                                {headers.map((header) => (
                                    <th
                                        key={header}
                                        className="px-4 py-3 text-left text-xs font-medium uppercase tracking-wider text-text-secondary dark:text-gray-300"
                                    >
                                        {header}
                                    </th>
                                ))}
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-gray-200 dark:divide-gray-700 bg-white dark:bg-gray-800">
                            {isLoading ? (
                                <tr>
                                    <td
                                        colSpan={headers.length}
                                        className="px-4 py-6 text-center text-text-secondary"
                                    >
                                        Loading...
                                    </td>
                                </tr>
                            ) : servers.length === 0 ? (
                                <tr>
                                    <td
                                        colSpan={headers.length}
                                        className="px-4 py-6 text-center text-text-secondary"
                                    >
                                        No servers found.
                                    </td>
                                </tr>
                            ) : (
                                servers.map((server) => (
                                    <tr key={server.id} className="hover:bg-gray-50 dark:hover:bg-gray-700">
                                        <td className="px-4 py-4 whitespace-nowrap text-sm text-text-primary dark:text-white">{server.server_name}</td>
                                        <td className="px-4 py-4 whitespace-nowrap text-sm text-text-primary dark:text-white">{server.email}</td>
                                        <td className="px-4 py-4 whitespace-nowrap text-sm text-text-primary dark:text-white">{server.smtp_server}</td>
                                        <td className="px-4 py-4 whitespace-nowrap text-sm text-text-primary dark:text-white">{server.server_port}</td>
                                        <td className="px-4 py-4 whitespace-nowrap text-sm text-text-primary dark:text-white">{server.user_name}</td>

                                        {/* --- THIS IS THE FIX --- */}
                                        <td className="px-4 py-4 whitespace-nowrap text-sm">
                                            <div className="flex items-center space-x-2">
                                                {/* 1. Use default size and text for a clearer button */}
                                                <Button variant="secondary" size="default" leftIcon={<Edit size={14} />}>
                                                    Edit
                                                </Button>
                                                <Button variant="danger" size="default" leftIcon={<Trash size={14} />}>
                                                    Delete
                                                </Button>
                                            </div>
                                        </td>
                                        {/* --- END OF FIX --- */}

                                    </tr>
                                ))
                            )}
                        </tbody>
                    </table>
                </div>
            </div>

            <AddSmtpModal
                isOpen={isModalOpen}
                onClose={() => setIsModalOpen(false)}
                onServerAdded={() => {
                    fetchServers();
                }}
            />
        </div>
    );
};

export default SmtpServer;