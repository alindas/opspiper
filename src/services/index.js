import request from '@/utils/request';

const generalUrl = process.env.NODE_ENV === 'development'
  ? 'http://192.168.200.201:6600/api/v1/opspiper'
  : `${location.href}api/v1/opspiper`;

// 通用请求, 任意 url
const everQuery = ({ serverUrl, headers = {}, config = {} }) => request(serverUrl, { headers: { ...headers }, ...config });

// 通用请求, 6600 端口
const generalQuery = (params, headers = {}) => request.post(generalUrl, { headers: { ...headers }, data: params });

export {
  everQuery,
  generalQuery,
}
