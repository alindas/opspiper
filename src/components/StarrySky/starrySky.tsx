import React, { useEffect, useLayoutEffect } from 'react';

import './starrySky.css';
import star from './star.png';

type TStar = {
  z: number,
  x: number,
  y: number,
  degX: number,
  degY: number,
  speed: number
}

export default function starrySky() {
  useLayoutEffect(() => {
    const canvas = document.getElementById('sky') as HTMLCanvasElement;
    const width = window.innerWidth;
    const height = window.innerHeight;
    const half_width = Math.floor(width / 2);
    const half_height = Math.floor(height / 2);
    canvas.width = width;
    canvas.height = height;
    const ctx = canvas.getContext('2d') as CanvasRenderingContext2D;

    const star_Count = 233;
    const stars: TStar[] = [];
    const MAX_SIZE = 5;
    const starTexture = new Image();
    starTexture.src = star;

    // 创建星星
    function createStar(type = 'initial') {
      const deg = Math.random() * Math.PI * 2;
      const star = {
        z: Math.random() + 0.3, // 缩放级别
        x: 0,
        y: 0,
        degX: Math.cos(deg),
        degY: Math.sin(deg),
        speed: Math.random() * 0.25
      };
      const distance = type === 'initial' ?
        Math.sqrt((Math.random() * half_width + 150) ** 2 + (Math.random() * half_height + 100) ** 2)
        : Math.sqrt((Math.random() * 350) ** 2 + (Math.random() * 100) ** 2);
      star.x = star.degX * distance + half_width;
      star.y = star.degY * distance + half_height;
      return star;
    }
    for (let i = 0; i < star_Count; i++) {
      stars.push(createStar('initial'));
    }

    // 渲染星空
    function render() {
      ctx.clearRect(0, 0, width, height);
      for (let i = 0; i < star_Count; i++) {
        if (stars[i].x < 0 || stars[i].y < 0 || stars[i].x > width || stars[i].y > height) {
          stars.splice(i, 1, createStar('reborn'));
        }
        else {
          ctx.drawImage(starTexture, stars[i].x, stars[i].y, stars[i].z * MAX_SIZE, stars[i].z * MAX_SIZE);
          stars[i].x += stars[i].speed * stars[i].degX;
          stars[i].y += stars[i].speed * stars[i].degY;
        }
      }
      window.requestAnimationFrame(render);
    }

    render();
  }, [])

  return (
    <canvas id='sky'></canvas>
  )
}
