import request from '@/utils/request';

const generalUrl = 'http://172.22.19.146:6600/api/v1/opspiper';

// 通用请求, 任意 url
const everQuery = ({ serverUrl, headers = {}, config = {} }) => request(serverUrl, { headers: { ...headers }, ...config });

// 通用请求, 6600 端口
const generalQuery = (params, headers = {}) => request.post(generalUrl, { headers: { ...headers }, data: params });

export {
  everQuery,
  generalQuery,
}
