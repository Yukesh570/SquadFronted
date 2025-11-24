import api from "../axiosInstance";



export const download = async (
  module: string,
  page: number = 1,
  pageSize: number = 10,
  nameFilter?:string
): Promise<any> => {
  const res=await api.get(`company/downloadCsv/${module}/`,{
    params: {
      page: page,
      page_size: pageSize,
      name: nameFilter
    }
  });
  return res.data;
};



export const downloadStatus = async (
  module: string,
  taskId: string
): Promise<any>=> {
  const res =await api.get(`company/csv-status/${module}/?task_id=${taskId}`);
  return res.data;
};

