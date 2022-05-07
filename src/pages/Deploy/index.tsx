
import { useEffect, useMemo, useState } from 'react';
import {
  AutoComplete,
  Button,
  Empty,
  Form,
  Input,
  message,
  notification,
  Popconfirm,
  Select,
  Space,
  Timeline,
  Upload
} from 'antd';
import { CheckCircleOutlined } from '@ant-design/icons';
import { Scrollbars } from 'react-custom-scrollbars-2';
import { Steps } from "intro.js-react";
import "intro.js/introjs.css";

import style from './index.less';
import { generalQuery, everQuery } from '@/services';
import FoldingBox from '@/components/folding-box';
import { getFormateDate, getParentNode } from '@/utils/common';
import Loading from '@/components/loading';
import SideDrawer from '@/components/side-drawer';
import emptyPic from '@/assets/empty.png';
import StarrySky from '@/components/starry-sky-pixi';

const { Option } = Select;

type TServer = {
  goarch: string,
  goos: string,
  host: string,
  no: string,
  note: string,
  port: number,
  status: string
}

type TProject = {
  no: string,
  proj_name: string,
  note: string,
  release_repo: string,
  release_version: string,
  testing_repo: string,
  testing_version: string
}

type TServerProject = {
  id: number,
  name: string,
  active: boolean,
  root: string,
  install: string,
  start: string,
  stop: string
}

type TButton = 'install' | 'uninstall' | 'upgrade' | 'restart' | 'stop' | ''

type TSoftware = 'local' | 'release' | 'testing' | ''

type TLog = {
  time: string,
  type: TButton,
  desc: string
}

type HandleType = {
  softwareType: TSoftware,
  buttonType: TButton,
  softwareName: string,
  isLoading: boolean
}

const InitialSERVER = {
  goarch: '',
  goos: '',
  host: '',
  no: '',
  note: '',
  port: 0,
  status: ''
}

const typeToColor = (type: TButton) => {
  switch (type) {
    case 'install': return 'blue';
    case 'uninstall': return 'red';
    case 'upgrade': return 'green';
    default: return 'grey';
  }
}

const guideSteps = [
  {
    element: '#intro-step1',
    intro: '这里是服务器列表。\n选择对应的服务器后才能继续后续的项目安装、更新等工作'
  },
  {
    element: '#intro-step2',
    intro: '这里是本地文件上传区域。\n 大多数的操作都在这里执行'
  },
  {
    element: '#intro-step2 .ant-space',
    intro: '安装和升级操作需要提供软件包，其他操作只需要提供正确的项目名称即可'
  },
  {
    element: '#intro-step3',
    intro: '这里展示的是储存到发布仓库区的项目，可直接拿来用'
  },
  {
    element: '#intro-step4',
    intro: '测试仓库和发布仓库只是仓库名称不同，功能性是一样的'
  },
  {
    element: '#intro-step5',
    intro: '所有的项目操作记录都会保存到本地，鼠标滑动到屏幕最右侧边可将其唤出。\n（考虑到实际应用，数据上限为 30 条）'
  },
]

export default function Deploy() {
  const [serverList, setServerList] = useState<TServer[]>([]);
  const [Server, setServer] = useState<TServer>(InitialSERVER);
  const [projectList, setProjectList] = useState<TProject[]>([]);
  // projectList 加载状态
  const [loading, setLoading] = useState(true);
  /** 软件包类型，按钮类型，软件名称，是否加载中 */
  const [handleType, setHandleType] = useState<HandleType>({ softwareType: '', buttonType: '', softwareName: '', isLoading: false });
  const [serverProject, setServerProject] = useState<TServerProject[]>([]);
  const [logCount, setLogCount] = useState(-1);
  // 用户功能向导是否可见
  const [stepsEnabled, setStepsEnabled] = useState(false);

  const [localForm] = Form.useForm();

  // 加载服务器列表
  useEffect(() => {
    generalQuery({
      "curd": "query",
      "table": "server",
      "func": "find",
      "asc": "no"
    })
      .then((res: Response | TServer[]) => {
        if (Array.isArray(res)) {
          setTimeout(() => {
            setServerList(res);
            // 用户向导
            const isBaby = localStorage.getItem('ISB');
            if (isBaby === null) {
              setStepsEnabled(true);
            }
          }, 300);
        }
      })
      .catch(err => console.warn(err))
  }, []);

  // 加载软件仓库中的所有项目信息
  useEffect(() => {
    generalQuery({
      "curd": "query",
      "table": "project",
      "func": "find",
      "asc": "no"
    })
      .then((res: Response | TProject[]) => {
        if (Array.isArray(res)) {
          setProjectList(res);
          setTimeout(() => setLoading(false), 300);
        }
      })
      .catch(err => console.warn(err))
  }, []);

  // antd form 表单设置文件上传控件时处理 onChange 的响应
  const normFile = (e: any) => {
    if (Array.isArray(e)) {
      return e;
    }
    return e && e.fileList;
  };

  const checkUploadFile = (file: File) => {
    if (!/\.tar$/.test(file.name)) {
      return Upload.LIST_IGNORE
    }
    return false;
  }

  const checkUploadPath = () => ({
    validator(_: any, value: string) {
      if (!value || /^[a-zA-z]:\\([^\\/:*?"<>|]+\\?)+$/.test(value) || /^\/([^\\/:*?"<>|]+\/?)+$/.test(value)) {
        return Promise.resolve();
      }
      return Promise.reject(new Error('安装路径不合法'));
    },
  })

  // 处理安装，更新请求
  const handleInstallAndUpgrade = (form: any, comment: string) => {
    const { softWareName: name, installationPackage, installationPath: root } = form;
    const headerConfig = {
      "Content-Type": "application/octet-stream;charset=UTF-8",
      "Options": handleType.buttonType === 'install' ? JSON.stringify({
        name: encodeURIComponent(name),
        root: encodeURIComponent(root),
      }) : ''
    }
    const file = Array.isArray(installationPackage) ? new Blob([installationPackage[0].originFileObj]) : installationPackage;
    everQuery({
      serverUrl: `http://${Server.host}:${Server.port}/api/${handleType.buttonType}`,
      headers: headerConfig,
      config: {
        method: 'POST',
        data: file,
        params: handleType.buttonType === 'upgrade' ? { name } : {}
      }
    })
      .then((res: Response | String) => {
        // 返回的是字符串，表示操作成功
        if (typeof res == 'string') {
          notification.success({
            message: `${comment}成功`,
            description: <span>软件：<strong>{name}</strong> 在 <strong>{Server.note}</strong> 成功{comment}</span>,
            duration: 1.5
          });
          queryServerProject(Server);
          recordLog(handleType.buttonType, `在${Server.note}上${comment}了软件${name}`);
        }
        else {
          notification.error({
            message: `${comment}失败`,
            description: <span>服务器：<strong>{Server.note}</strong> 处理失败 </span>,
            duration: 1.5
          });
        }
        setTimeout(() => setHandleType({ ...handleType, isLoading: false }), 500);
      })
      .catch(error => {
        notification.error({
          message: '请求失败',
          description: error,
          duration: 1.5
        });
        setHandleType({ ...handleType, isLoading: false });
      })
  }

  // 处理除安装，更新外的请求
  const handleWithoutSoftware = (form: any, comment: string) => {
    const { softWareName: name } = form;
    everQuery({ serverUrl: `http://${Server.host}:${Server.port}/api/${handleType.buttonType}`, config: { method: 'POST', params: { name } } })
      .then((res: Response | String) => {
        // 返回的是字符串，表示成功操作
        if (typeof res == 'string') {
          notification.success({
            message: `${comment}成功`,
            description: <span>软件：<strong>{name}</strong> 在 <strong>{Server.note}</strong> 已{comment}</span>,
            duration: 1.5
          });
          queryServerProject(Server);
          recordLog(handleType.buttonType, `在${Server.note}上${comment}了软件${name}`);
        }
        else {
          notification.error({
            message: `${comment}失败`,
            description: <span>服务器：<strong>{Server.note}</strong> 上不存在软件 <strong>{name}</strong></span>,
            duration: 1.5
          });
        }
        setTimeout(() => setHandleType({ ...handleType, isLoading: false }), 500);
      })
      .catch(error => {
        notification.error({
          message: '请求失败',
          description: error,
          duration: 1.5
        });
        setHandleType({ ...handleType, isLoading: false });
      })
  }

  // 对于服务器仓库上项目的安装，更新
  const handleInstallAndUpgradeOnline = (form: any, comment: string) => {
    const { version, no, proj_name, installationPath, release_repo, testing_repo } = form;
    generalQuery({
      "curd": "insert",
      "table": "deploy_req",
      "data": [
        {
          "dev_no": "gskserver000006",
          "proj_no": no,
          "proj_version": version,
          "ee_id": "0000",
          "cmd": handleType.buttonType
        }
      ]
    })
      .then(async () => {
        const softwareLink = `${handleType.softwareType === 'release' ? release_repo : testing_repo}/${proj_name}/${version}.tar`;
        const response = await fetch(softwareLink);
        if (!response.ok) {
          notification.error({
            message: '请求失败',
            description: '目标软件包资源丢失',
            duration: 1.5
          });
          setHandleType({ ...handleType, isLoading: false });
          return;
        }
        const installationPackage = await response.blob();
        handleInstallAndUpgrade({ softWareName: proj_name, installationPackage, installationPath }, comment);
      })
  }

  // 对于服务器仓库上项目除安装，更新之外的功能
  const handleWithoutSoftwareOnline = (form: any, comment: string) => {
    const { version, no, proj_name } = form;
    generalQuery({
      "curd": "insert",
      "table": "deploy_req",
      "data": [
        {
          "dev_no": "gskserver000006",
          "proj_no": no,
          "proj_version": version,
          "ee_id": "0000",
          "cmd": handleType.buttonType
        }
      ]
    })
      .then(() => {
        handleWithoutSoftware({ softWareName: proj_name }, comment);
      })
  }

  const changeWarehouseLink = (link: string, ele: string) => {
    const targetNode = document.querySelector(`input[name=${ele}]`)!;
    targetNode.setAttribute('placeholder', link);
  }

  const handleSubmitSuccess = (form: any) => {
    if (!Server.no) {
      message.warn('请选择对应的服务主机');
      return;
    }
    if (!checkCurrentUpload()) {
      message.warning('尚有任务未结束');
      return;
    }
    setHandleType({ ...handleType, isLoading: true });
    switch (handleType.buttonType) {
      case 'install': handleType.softwareType === 'local' ? handleInstallAndUpgrade(form, '安装') : handleInstallAndUpgradeOnline(form, '安装'); break;
      case 'upgrade': handleType.softwareType === 'local' ? handleInstallAndUpgrade(form, '更新') : handleInstallAndUpgradeOnline(form, '更新'); break;
      case 'uninstall': handleType.softwareType === 'local' ? handleWithoutSoftware(form, '删除') : handleWithoutSoftwareOnline(form, '删除'); break;
      case 'restart': handleType.softwareType === 'local' ? handleWithoutSoftware(form, '重启') : handleWithoutSoftwareOnline(form, '重启'); break;
      case 'stop': handleType.softwareType === 'local' ? handleWithoutSoftware(form, '停止') : handleWithoutSoftwareOnline(form, '停止'); break;
      default: break;
    }
  }

  const handleSubmitFail = (value: any) => {
    console.log('Fail', value);
  }

  const queryServerProject = (server: TServer) => {
    const { host, port } = server;
    everQuery({
      serverUrl: `http://${host}:${port}/api/list`
    })
      .then(res => {
        if (Array.isArray(res)) {
          setServerProject(res);
        }
      })
      .catch(() => null)
  }

  const selectServer = (server: TServer) => {
    const { no } = server;
    setServerProject([]); // 切换不同服务器时直接清空下拉项目列表，避免因网络延迟导致的假数据问题
    if (Server.no === no) {
      setServer(InitialSERVER);
    }
    else {
      setServer(server);
      queryServerProject(server);
      localForm.resetFields();
    }
  }

  const filterProjectNameInput = (inputValue: string, option: any) => {
    return option!.value.toUpperCase().indexOf(inputValue.toUpperCase()) !== -1;
  }

  const setLocalPacketPath = (name: string) => {
    const path = serverProject.find(project => project.name === name)!.root;
    localForm.setFieldsValue({ 'installationPath': path });
  }

  const recordLog = (type: TButton, desc: string) => {
    const prefixLog = JSON.parse(localStorage.getItem('log')) as TLog[];
    if (prefixLog !== null && !Array.isArray(prefixLog)) {
      console.error('读取本地日志文件错误');
      localStorage.removeItem('log');
      return;
    }
    let temp = prefixLog ?? [];
    temp.unshift({
      time: getFormateDate('yyyy-MM-dd hh:mm:ss'),
      type,
      desc
    });
    temp.length > 30 && temp.pop();
    localStorage.setItem('log', JSON.stringify(temp))
    setLogCount(logCount + 1);
  }

  // 检查当前是否有进行中的任务
  const checkCurrentUpload = () => {
    if (handleType.isLoading) {
      return false;
    } else {
      return true;
    }
  }

  const renderActionBox = (type: TSoftware, software = '') => ([
    {
      value: 'install',
      comment: '安装'
    },
    {
      value: 'uninstall',
      comment: '卸载'
    },
    {
      value: 'upgrade',
      comment: '升级'
    },
    {
      value: 'restart',
      comment: '启动'
    },
    {
      value: 'stop',
      comment: '停止'
    }
  ] as { value: TButton, comment: string }[]).map(btn => btn.value === 'uninstall' ? (
    <Popconfirm key={btn.value}
      title='此操作不可逆，是否继续？'
      onConfirm={() => true}
      onCancel={() => false}
      okText='是'
      cancelText='否'
      okButtonProps={{ htmlType: 'submit' }}
      getPopupContainer={(node) => getParentNode(node, 'form')}
    >
      <Button
        type="primary"
        size="small"
        onClick={() => {
          if (checkCurrentUpload()) setHandleType({ softwareType: type, buttonType: btn.value, softwareName: software, isLoading: false })
        }}
        loading={handleType.softwareType === type && handleType.buttonType === btn.value && handleType.softwareName === software && handleType.isLoading}
        danger
      >
        {btn.comment}
      </Button>
    </Popconfirm>
  ) :
    <Button key={btn.value}
      type={btn.value === 'install' ? 'primary' : 'default'}
      size="small"
      htmlType="submit"
      onClick={() => {
        if (checkCurrentUpload()) setHandleType({ softwareType: type, buttonType: btn.value, softwareName: software, isLoading: false })
      }}
      loading={handleType.softwareType === type && handleType.buttonType === btn.value && handleType.softwareName === software && handleType.isLoading}
    >
      {btn.comment}
    </Button>)

  const renderServerList = serverList.map((server, index) => {
    const { goarch, goos, host, port, no, note } = server;
    const titleNode = (
      <h3
        style={Server.no === no ? { color: '#0080ff' } : {}}
        onClick={() => selectServer(server)}
      >
        {index + 1}. {note}
        <span className={style.ipTip}>{host + ':' + port}</span>
        <CheckCircleOutlined
          className={style.selectIcon}
          style={Server.no === no ? { color: '#008000', opacity: 1 } : { color: '#aaa', opacity: 0 }}
        />
      </h3>
    );
    const contentNode = (
      <ul className={style.listBox}>
        <li>
          <span>编号：</span>
          <span>{no}</span>
        </li>
        <li>
          <span>地址：</span>
          <span>{host + ':' + port}</span>
        </li>
        <li>
          <span>类型：</span>
          <span>服务器</span>
        </li>
        <li>
          <span>操作系统：</span>
          <span>{goos}</span>
        </li>
        <li>
          <span>CPU架构：</span>
          <span>{goarch}</span>
        </li>
      </ul>
    );
    return <li key={no}><FoldingBox title={titleNode} content={contentNode} openClassName={style.openClass} /></li>
  });

  const localSoftWareContentNode = (
    <div className={style.form}>
      <Form
        form={localForm}
        labelCol={{ span: 3 }}
        wrapperCol={{ span: 16 }}
        initialValues={{ remember: true }}
        autoComplete="off"
        labelAlign="left"
        onFinish={handleSubmitSuccess}
        onFinishFailed={handleSubmitFail}
      >
        <Form.Item
          label="名称"
          name="softWareName"
          rules={[{ required: true, message: '请输入软件包名称' }]}
        >
          <AutoComplete
            size="small"
            allowClear
            filterOption={filterProjectNameInput}
            onSelect={(name: string) => setLocalPacketPath(name)}
          >
            {
              serverProject.map(pro => (
                <Option key={pro.id} value={pro.name}>
                  {pro.name}<span className={style.analysed} style={pro.active ? {} : { opacity: 0 }}>已启动</span>
                </Option>
              ))}
          </AutoComplete>
        </Form.Item>
        <Form.Item
          label="安装包"
          name="installationPackage"
          rules={[{ required: handleType.softwareType === 'local' && (handleType.buttonType === 'install' || handleType.buttonType === 'upgrade'), message: '请上传软件安装包' }]}
          valuePropName="fileList"
          getValueFromEvent={normFile}
        >
          <Upload.Dragger maxCount={1} beforeUpload={checkUploadFile} accept="application/x-tar">
            <p className="ant-upload-text">拖拽 tar 文件到此处</p>
            <Button type="primary" size="small" className={style.uploadFileBtn}>
              浏览
            </Button>
          </Upload.Dragger>
        </Form.Item>
        <Form.Item
          label="安装路径"
          name="installationPath"
          rules={[{ required: handleType.softwareType === 'local' && handleType.buttonType === 'install', message: '请输入准确的软件安装路径' }, checkUploadPath]}
        >
          <Input size="small" />
        </Form.Item>
        <Form.Item>
          <Space>{renderActionBox('local')}</Space>
        </Form.Item>
      </Form>
    </div>
  )

  const renderLocalSoftWare = (
    <li id='intro-step2'>
      <FoldingBox
        title={<h3>1. 本地软件包</h3>}
        content={localSoftWareContentNode}
        openClassName={style.openClass}
        defaultStatus={true}
      />
    </li>
  )

  const renderProjectList = (type: 'release' | 'testing') => projectList.map((project, index) => {
    const {
      no,
      proj_name,
      note,
      release_repo,
      testing_repo,
    } = project;

    const version = (type === 'release' ? project.release_version : project.testing_version).split('|');

    const titleNode = (
      <h3
        style={Server.no === no ? { color: '#0080ff' } : {}}
      >
        {index + 1}) {proj_name}
      </h3>
    );
    const contentNode = (
      <div className={style.form}>
        <Form
          labelCol={{ span: 3 }}
          wrapperCol={{ span: 16 }}
          initialValues={{ remember: true }}
          autoComplete="off"
          labelAlign="left"
          onFinish={handleSubmitSuccess}
          onFinishFailed={handleSubmitFail}
        >
          <Form.Item
            label="说明"
            name="note"
            initialValue={note}
          >
            <Input size="small" disabled />
          </Form.Item>
          <Form.Item
            label="版本"
            name="version"
            initialValue={version[0]}
          >
            <Select size="small" onChange={val => changeWarehouseLink(`${type === 'release' ? release_repo : testing_repo}/${proj_name}/${val}.tar`, `${type}-${proj_name}`)}>
              {
                version.map(version => (
                  <Option value={version} key={version}>{version}</Option>
                ))
              }
            </Select>
          </Form.Item>
          <Form.Item
            label="安装包"
          >
            <div>
              <Input name={`${type}-${proj_name}`} size="small" disabled placeholder={`${type === 'release' ? release_repo : testing_repo}/${proj_name}/${version[0]}.tar`} />
            </div>
          </Form.Item>
          <Form.Item
            label="安装路径"
            name="installationPath"
            rules={[{ required: handleType.softwareType === type && handleType.buttonType === 'install' && handleType.softwareName === proj_name, message: '请输入准确的软件安装路径' }, checkUploadPath]}
          >
            <Input size="small" allowClear />
          </Form.Item>
          <Form.Item name="no" initialValue={no} hidden>
            <Input size="small" />
          </Form.Item>
          <Form.Item name="proj_name" initialValue={proj_name} hidden>
            <Input size="small" />
          </Form.Item>
          <Form.Item name="release_repo" initialValue={release_repo} hidden>
            <Input size="small" />
          </Form.Item>
          <Form.Item name="testing_repo" initialValue={testing_repo} hidden>
            <Input size="small" />
          </Form.Item>
          <Form.Item>
            <Space>{renderActionBox(type, proj_name)}</Space>
          </Form.Item>
        </Form>
      </div>
    );
    return <li key={no}><FoldingBox title={titleNode} content={contentNode} openClassName={style.openClass} /></li>
  });

  const renderReleaseRepositories = (
    <li id='intro-step3'>
      <FoldingBox
        title={<h3>2. 发布仓库</h3>}
        content={
          <ul>
            {loading ? <div className={style.loading}><Loading type="circle" layout="left" /></div>
              : renderProjectList('release')}
          </ul>
        }
        openClassName={style.openClass}
        defaultStatus={true}
      />
    </li>
  )

  const renderTestRepositories = (
    <li id='intro-step4'>
      <FoldingBox
        title={<h3>3. 测试仓库</h3>}
        content={
          <ul>
            {loading ? <div className={style.loading}><Loading type="circle" layout="left" /></div>
              : renderProjectList('testing')}
          </ul>
        }
        openClassName={style.openClass}
        defaultStatus={true}
      />
    </li>
  )

  // 增加本地日志记录
  const renderOperationHistory = useMemo(() => {
    const logData = JSON.parse(localStorage.getItem('log')) as TLog[];
    if (!Array.isArray(logData)) {
      console.error('读取本地日志文件错误');
      return <Empty image={emptyPic} description='暂无日志记录' />;
    };
    return logData.length == 0 ? <Empty image={emptyPic} description='暂无日志记录' />
      : <Timeline>
        {
          logData.map((log, index) =>
            <Timeline.Item color={typeToColor(log.type)} key={index}>
              <p className={style.logLabel}><small>{log.time}</small></p>
              <p className={style.logBody}>{log.desc}</p>
            </Timeline.Item>
          )
        }
      </Timeline>
  }, [logCount])

  return (
    <div className={style.wrapper}>
      {/* <StarrySky /> */}
      <section className={style.container}>
        <div className={style.server}>
          <div className={style.title}>
            <h1>选择服务器：{Server.note}</h1>
          </div>
          <div className={style.mainBox}>
            <Scrollbars>
              {
                renderServerList.length == 0 ?
                  <Loading type="orbit" layout="top" /> :
                  <ul id='intro-step1'>{renderServerList}</ul>
              }
            </Scrollbars>
          </div>
        </div>
        <div className={style.hedge} />
        <div className={style.softWare}>
          <div className={style.title}>
            <h1>选择软件包：</h1>
          </div>
          <div className={style.mainBox}>
            <Scrollbars>
              <ul>
                {renderLocalSoftWare}
                {renderReleaseRepositories}
                {renderTestRepositories}
              </ul>
            </Scrollbars>
          </div>
        </div>
        <SideDrawer>
          <div style={{ padding: '10px' }}>
            {renderOperationHistory}
          </div>
        </SideDrawer>
        <Steps
          enabled={stepsEnabled}
          steps={guideSteps}
          initialStep={0}
          onExit={() => setStepsEnabled(false)}
          onComplete={() => localStorage.setItem('ISB', 'false')}
          options={{
            nextLabel: '下一个',
            prevLabel: '上一个',
            skipLabel: '跳过',
            doneLabel: '了解了',
            hidePrev: true,
            exitOnEsc: false,
            exitOnOverlayClick: false,
            disableInteraction: true,
            showBullets: false
          }}
        />
      </section>
      <footer className={style.footer}>opspiper © 2022 GSK</footer>
    </div>
  )
}
