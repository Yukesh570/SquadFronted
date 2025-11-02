import api from "../axiosInstance";

export interface registerData {
  username: string;
  email: string;
  password: string;
  confirm_password: string;
  phone: string;
  userType: string;
}

export interface loginData {
  username: string;
  password: string;
}



export const registerApi = async (registerData:registerData): Promise<any> => {
  const response = await api.post("/register/",registerData);
  console.log("response.data===",response.data);
  return response.data;
};
export const loginApi = async (loginData:loginData): Promise<any> => {
  const response = await api.post("/login/",loginData);
  console.log("response.data===",response.data);
  return response.data;
};


