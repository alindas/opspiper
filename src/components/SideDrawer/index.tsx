import { Drawer } from 'antd'
import { useState } from 'react';

import style from './index.less';

export default function SideDrawer(props: any) {
  const [ifShowDrawer, setIfShowDrawer] = useState(false);

  return (
    <div>
      <div className={style.placeholderOutside}
        onMouseEnter={() => !ifShowDrawer && setIfShowDrawer(true)}
      />
      <Drawer
        placement="right"
        closable={false}
        onClose={() => setIfShowDrawer(false)}
        visible={ifShowDrawer}
      >
        <div className={style.container}>
          <div className={style.placeholderInside} onMouseLeave={() => setIfShowDrawer(false)}/>
          { props.children }
        </div>
      </Drawer>
    </div>
  )
}