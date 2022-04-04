import { ReactNode, useState } from 'react';
import classNames from 'classnames';

import style from './index.less';

type TProps = {
  title: ReactNode | string,
  content: ReactNode | string,
  openClassName?: string,
  defaultStatus?: boolean
}

const FoldingBox = (props: TProps) => {
  const { title, content, openClassName = '', defaultStatus = false } = props;
  const [ifShowContent, setIfShowContent] = useState(defaultStatus);

  const handleTitleClick = () => {
    setIfShowContent(!ifShowContent);
  }

  return (
    <div className={style.wrapper}>
      <div className={style.title}>
        <div className={classNames(style.btn, { [style.open]: ifShowContent })} onClick={handleTitleClick} />
        <div className={ifShowContent ? openClassName : ''}>{ title }</div>
      </div>
      <div
        className={style.contentContainer}
        style={ifShowContent ? { minHeight: 0, marginBottom: '6px' } : { height: 0 }}
      >
        <div>{ content }</div>
      </div>
    </div>
  )
}

export default FoldingBox;
