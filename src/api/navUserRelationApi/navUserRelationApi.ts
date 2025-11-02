import api from "../axiosInstance";

export interface SideBarApi {
  id?: number;
  label: string;
  url: string;
  order: number;
  is_active: boolean;
  icon: string;
}
export interface navUserData {
  id?: number;
  userType: string;
  navigateId: SideBarApi;
  read: boolean;
  write: boolean;
  delete: boolean;
  put: boolean;
}
export interface navUserRelationCreateData {
  label: string;
}
export interface params {
  userType: string;
}

const token = localStorage.getItem("token");

export const getUserSideBarApi = async (): Promise<navUserData[]> => {
  const response = await api.get("/navUserRelation/", {
    headers: {
      Authorization: `Bearer ${token}`,
    },
  });
  return response.data;
};

export const createNavUserRelation = async (
  data: navUserRelationCreateData
): Promise<any> => {
  const response = await api.post("/navUserRelation/createLabel/", data, {
    headers: {
      Authorization: `Bearer ${token}`,
    },
  });
  return response.data;
};

export const getNavByUserType = async (data: params): Promise<navUserData[]> => {
  const response = await api.get(`/navUserRelation/getByUserType/${data.userType}`, {
    headers: {
      Authorization: `Bearer ${token}`,
    },
  });
  console.log("sfsdfsadfsdf", response.data);
  return response.data;
};
