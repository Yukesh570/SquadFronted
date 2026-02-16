import api from "../axiosInstance";
import {
  createUserActionApi,
  type UserActionData,
} from "../userActionApi/LogApi";
import {
  createNotificationApi,
  type NotificationData,
} from "../userActionApi/notificationApi";

export interface SideBarApi {
  id?: number;
  label: string;
  parent?: number;
  url: string;
  order: number;
  is_active: boolean;
  icon: string;
  module: string;
}

export interface PaginatedResponse<T> {
  count: number;
  next: string | null;
  previous: string | null;
  results: T[];
}

export const getSideBarApi = async (
  module?: string,
  page?: number,
  pageSize?: number,
  searchParams?: Record<string, any>,
): Promise<PaginatedResponse<SideBarApi>> => {
  const params: any = {
    page: page,
    page_size: pageSize,
    ...searchParams,
  };

  // if (page !== undefined) params.page = page;
  // if (pageSize !== undefined) params.page_size = pageSize;
  const response = await api.get(`/navItem/${module}/`, { params });
  return response.data;
};

export const createSideBarApi = async (
  data: SideBarApi,
  module: string,
): Promise<SideBarApi> => {
  if (data.parent === 0) {
    const { parent, ...rest } = data;
    const response = await api.post(`/navItem/${module}/`, rest);
    actionHelper(
      "Module",
      "Module created successfully!,",
      "Module",
      "Module created successfully!",
    );

    return response.data;
  } else {
    const response = await api.post(`/navItem/${module}/`, data);
    actionHelper(
      "Module",
      "Module created successfully!,",
      "Module",
      "Module created successfully!",
    );
    return response.data;
  }
};

export const updateSideBarApi = async (
  id: number,
  data: SideBarApi,
  module: string,
): Promise<SideBarApi> => {
  const response = await api.patch(`/navItem/${module}/${id}/`, data);
  actionHelper(
    "Module",
    "Module updated successfully!,",
    "Module",
    "Module updated successfully!",
  );

  return response.data;
};

export const deleteSideBarApi = async (
  id: number,
  module: string,
): Promise<void> => {
  await api.delete(`/navItem/${module}/${id}/`);
  actionHelper("Module", "Module Deleted!,", "Module", "Module Deleted!");
};

export const actionHelper = async (
  title: string,
  description: string,
  title2: string,
  action: string,
) => {
  const notidata: NotificationData = {
    title: title,
    description: description,
  };
  const userActionData: UserActionData = {
    title: title2,
    action: action,
  };
  await createNotificationApi(notidata);
  await createUserActionApi(userActionData);
};
