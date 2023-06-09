import { Drawer } from 'antd'
import { useState } from 'react';

import style from './index.less';

export default function SideDrawer(props: any) {
  const [ifShowDrawer, setIfShowDrawer] = useState(false);

  return (
    <div>
      <div
        id='intro-step5'
        className={style.placeholder}
        onMouseEnter={() => !ifShowDrawer && setIfShowDrawer(true)}
      />
      <Drawer
        placement="right"
        closable={false}
        onClose={() => setIfShowDrawer(false)}
        visible={ifShowDrawer}
      >
        <div className={style.container} onMouseLeave={() => setIfShowDrawer(false)}>
          { props.children }
        </div>
      </Drawer>
    </div>
  )
}
