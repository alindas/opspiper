/** Request 网络请求工具 更详细的 api 文档: https://github.com/umijs/umi-request */
import { extend } from 'umi-request';
import { notification } from 'antd';

const codeMessage = {
  200: '服务器成功返回请求的数据。',
  201: '新建或修改数据成功。',
  202: '一个请求已经进入后台排队（异步任务）。',
  204: '删除数据成功。',
  400: '发出的请求有错误，服务器没有进行新建或修改数据的操作。',
  401: '用户没有权限（令牌错误或失效）。',
  403: '用户得到授权，但是访问是被禁止的。',
  404: '发出的请求针对的是不存在的记录，服务器没有进行操作。',
  405: '请求方法不被允许',
  406: '请求的格式不可得。',
  410: '请求的资源被永久删除，且不会再得到的。',
  422: '当创建一个对象时，发生一个验证错误。',
  500: '服务器发生错误，请检查服务器。',
  502: '网关错误。',
  503: '服务不可用，服务器暂时过载或维护。',
  504: '网关超时。',
};

/** 异常处理程序 */
const errorHandler = (error) => {
  const { response } = error;
  if(response === null) {
    return Promise.reject('您的请求发生异常，无法连接服务器');
  }
  // 400 状态码用户自定义提醒
  const { status, statusText } = response;
  if (!response.ok && status !== 400) {
    const errorText = codeMessage[status] || statusText;
    notification.error({
      message: status,
      description: errorText,
    });
  }
  else if (!response) {
    notification.error({
      message: '请求异常',
      description: '您的请求发生异常，无法连接服务器',
    });
  }

  return response;
};

/** 配置request请求时的默认参数 */
// const controller = new AbortController(); // 创建一个控制器
// const { signal } = controller; // 返回一个 AbortSignal 对象实例，它可以用来 with/abort 一个 DOM 请求。
const request = extend({
  // 默认错误处理
  errorHandler,
  // 默认请求是否带上cookie, omit为永不携带，same-orign为同源携带，include为始终携带
  credentials: 'omit',
  headers: {
    Accept: 'application/json',
    'Content-Type': 'application/json; charset=utf-8',
  }
});

// request拦截器, 改变url 或 options.
request.interceptors.request.use((url, options) => {
  const { headers } = options;
  // 是否为上传请求
  if(!/6600/.test(url)) {
    headers['Authorization'] = '6eb899149f77f733a0cb3eda62300f64';
    return (
      {
        url,
        options: { ...options, headers }
      }
    );
  }
});

export default request;
