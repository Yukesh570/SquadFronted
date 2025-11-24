import api from "../axiosInstance";



export const companyCsv = async (
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

export const countryCsv = async (
  module: string,
  page: number = 1,
  pageSize: number = 10,
  nameFilter?:string,
  codeFilter?:string,
  mccFilter?:string
): Promise<any> => {
  const res=await api.get(`country/downloadCsv/${module}/`,{
    params: {
      page: page,
      page_size: pageSize,
      name: nameFilter,
      countryCode: codeFilter,
      MCC: mccFilter
    }
  });
  return res.data;
};


export const downloadStatus = async (
  module: string,
  taskId: string
): Promise<any>=> {
  const res =await api.get(`csv-status/${module}/?task_id=${taskId}`);
  return res.data;
};

