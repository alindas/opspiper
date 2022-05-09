/**
 * @name 获取格式化的系统时间
 * @param fmt Y+年份 M+月份 d+日 h+小时 m+分 s+秒 q+季度 S+毫秒
 * @returns 经过格式化的系统时间
 */
const getFormateDate = function (fmt: string): string {
  let date = new Date();
  let o: {
    [index: string]: number
  } = {
    "Y+": date.getFullYear(),
    "M+": date.getMonth() + 1,
    "d+": date.getDate(),
    "h+": date.getHours(),
    "m+": date.getMinutes(),
    "s+": date.getSeconds(),
    "q+": Math.floor((date.getMonth() + 3) / 3),
    "S": date.getMilliseconds()
  };
  if (/(y+)/.test(fmt)) {
    fmt = fmt.replace(RegExp.$1, (date.getFullYear() + "").substr(4 - RegExp.$1.length));
  }
  for (let k in o) {
    if (new RegExp("(" + k + ")").test(fmt)) {
      fmt = fmt.replace(RegExp.$1, (RegExp.$1.length === 1) ? String(o[k]) : (("00" + o[k]).substr(("" + o[k]).length)));
    }
  }
  return fmt;
}

/**
 * @name 递归获取子元素的父元素
 * @param ele 目标元素
 * @param nodeName 父元素名称
 * @returns 对应的父元素
 */
const getParentNode = (ele: HTMLElement, nodeName: string): HTMLElement => {
  let parentNode = ele.parentNode as HTMLElement | null;
  if (parentNode === null) {
    return document.body;
  }
  else if (nodeName.toLocaleUpperCase() === parentNode.nodeName) {
    return parentNode;
  }
  else return getParentNode(parentNode, nodeName);
}

/**
 * @name 基于 XMLHttpRequest 实现带有上传进度的请求
 */
const uploadRequestWithProcess = ({
  url,
  header,
  data,
  onProgress,
  onSuccess,
  onFail
}: {
  url: string,
  data: any,
  onProgress: (evt: ProgressEvent<EventTarget>, xhr: XMLHttpRequest) => void,
  onSuccess: (xhr: XMLHttpRequest) => void,
  onFail?: (status: number, message: string) => void,
  header?: { [propsName: string]: string },
}) => {
  const xhr = new XMLHttpRequest();
  xhr.open('post', url, true);
  for (let item in header??{}) {
    xhr.setRequestHeader(item, header[item]);
  }
  xhr.onload = () => {
    if (xhr.status != 200) {
      onFail && onFail(xhr.status, xhr.responseText || xhr.statusText);
    } else {
      onSuccess(xhr);
    }
  }
  xhr.onerror = () => onFail && onFail(xhr.status, xhr.responseText || xhr.statusText);
  xhr.upload.onprogress = (evt) => onProgress(evt, xhr);
  xhr.send(data);
}

export {
  getFormateDate,
  getParentNode,
  uploadRequestWithProcess
}
