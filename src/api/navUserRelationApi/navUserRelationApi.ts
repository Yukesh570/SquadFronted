import api from "../axiosInstance";
import { type PaginatedResponse, type SideBarApi } from "../sidebarApi/sideBarApi";

// export interface navUserData {
//   id?: number;
//   userType: string;
//   navigateId: SideBarApi;
//   read: boolean;
//   write: boolean;
//   delete: boolean;
//   put: boolean;
// }
export interface navUserData extends SideBarApi {
  userType: string;
  children?: navUserData[];
  permission?: {
    NavRelationid: number;
    read: boolean;
    write: boolean;
    delete: boolean;
    put: boolean;
  };
}
export interface navUserRelationCreateData {
  label: string;
}
export interface params {
  userType: string;
}

export const getUserSideBarApi = async (): Promise<PaginatedResponse<navUserData>> => {
  const response = await api.get("/navUserRelationGet/");
  return response.data;
};

export const createNavUserRelation = async (
  data: navUserRelationCreateData
): Promise<any> => {
  const response = await api.post("/navUserRelation/createLabel/", data);
  return response.data;
};

export const getNavByUserType = async (data: params): Promise<navUserData[]> => {
  const response = await api.get(`/navUserRelationGet/getByUserType/${data.userType}`);
  return response.data;
};

interface BulkUpdatePayloadItem {
  id: number;
  read: boolean;
  write: boolean;
  delete: boolean;
  put: boolean;
}

export const updateNavUserRelationBulk = async (
  data: BulkUpdatePayloadItem[]
) => {
  const response = await api.patch("/navUserRelation/bulk-update/", data);
  return response.data;
};