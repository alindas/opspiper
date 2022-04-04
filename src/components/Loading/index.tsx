import React from 'react';
import style from './index.less';

interface LoadingProps {
  type?: "line" | "circle" | 'orbit',
  layout?: "left" | "leftTop" | "top" | "rightTop" | "right" | "rightBottom" | "bottom" |
    "leftBottom" | "center",
  size?: "small" | "medium" | "large"
}

/**
 * @describe 系统自定义加载中组件
 * @param type
 * @param layout
 * @param size
 * @returns
 */

const Loading: React.FC<LoadingProps> = props => {
  const {
    type = 'line',
    layout = 'center',
    size = 'small'
  } = props;

  const layoutClasses = `${style.container} ${style[layout]}`;
  const lineClasses = `${style.line_dot} ${style[size]}`;
  const orbitClasses = `${style.orbitSpinner} ${style[`${size}_orbit`]}`;

  const switchRenderType = (type: LoadingProps['type']) => {
    switch(type) {
      case 'line': {
        return lineNode;
      }
      case 'circle': {
        return circleNode;
      }
      case 'orbit': {
        return orbitNode;
      }
      default: {
        return lineNode;
      }
    }
  }

  const lineNode = (
    <span className={style.lineSpinner}>
      <span className={`${lineClasses} ${style.line_dot1}`}></span>
      <span className={`${lineClasses} ${style.line_dot2}`}></span>
      <span className={`${lineClasses} ${style.line_dot3}`}></span>
    </span>
  )

  const circleNode = (
    <span className={style[size]}>
      <span className={style.circle}></span>
    </span>
  )

  const orbitNode = (
    <div className={orbitClasses}>
      <span className={style.orbit}></span>
      <span className={style.orbit}></span>
      <span className={style.orbit}></span>
    </div>
  )

  return (
    <div className={style.wrapper}>
      <div className={layoutClasses}>
        <div className={style.loading}>
          { switchRenderType(type) }
        </div>
      </div>
    </div>
  )
}

export default React.memo(Loading);
