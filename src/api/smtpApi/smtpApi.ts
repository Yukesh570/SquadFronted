import api from "../axiosInstance";

export interface SmtpServerData {
    id?: number;
    server_name: string;
    email: string;
    smtp_server: string;
    security: 'SSL' | 'TLS' | 'None';
    server_port: number;
    user_name: string;
    password?: string; // Password is send-only, not usually fetched
}

// API to GET all existing SMTP servers
export const getSmtpServersApi = async (): Promise<SmtpServerData[]> => {
    // We'll assume this is the backend endpoint.
    // Your senior may provide the exact URL.
    const response = await api.get("/smtp-servers/");
    return response.data;
};

// API to CREATE a new SMTP server
export const createSmtpServerApi = async (
    data: SmtpServerData
): Promise<SmtpServerData> => {
    const response = await api.post("/smtp-servers/", data);
    return response.data;
};