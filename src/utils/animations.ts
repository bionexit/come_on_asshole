import gsap from 'gsap';

// 创建拟声词效果
export function createSoundEffect(element: HTMLElement, text: string) {
  const rect = element.getBoundingClientRect();
  const sound = document.createElement('div');
  sound.className = 'sound-effect pop';
  sound.textContent = text;
  sound.style.left = `${rect.left + rect.width / 2}px`;
  sound.style.top = `${rect.top}px`;
  sound.style.transform = `translate(-50%, -50%) rotate(${Math.random() * 30 - 15}deg)`;
  sound.style.position = 'fixed';
  sound.style.fontSize = 'clamp(2rem, 8vw, 3rem)';
  sound.style.fontWeight = '900';
  sound.style.color = '#ff0000';
  sound.style.textShadow = '3px 3px 0 #000, -1px -1px 0 #fff';
  sound.style.pointerEvents = 'none';
  sound.style.zIndex = '9999';
  sound.style.whiteSpace = 'nowrap';
  document.body.appendChild(sound);

  // 动画
  gsap.fromTo(sound,
    { opacity: 0, scale: 0, rotation: -180 },
    { 
      opacity: 1, 
      scale: 1.5, 
      rotation: 10, 
      duration: 0.4, 
      ease: 'back.out(1.7)',
      onComplete: () => {
        gsap.to(sound, {
          opacity: 0,
          scale: 2,
          rotation: 20,
          y: -50,
          duration: 0.4,
          onComplete: () => sound.remove()
        });
      }
    }
  );
}

// 爆炸效果
export function createExplosion(event: React.MouseEvent | { clientX: number; clientY: number }) {
  const x = 'clientX' in event ? event.clientX : 0;
  const y = 'clientY' in event ? event.clientY : 0;
  
  const explosion = document.createElement('div');
  explosion.style.cssText = `
    position: fixed;
    left: ${x}px;
    top: ${y}px;
    width: 100px;
    height: 100px;
    pointer-events: none;
    z-index: 9999;
    transform: translate(-50%, -50%);
  `;

  const colors = ['#ff0000', '#ffff00', '#000000', '#ff6600'];
  
  for (let i = 0; i < 12; i++) {
    const line = document.createElement('div');
    const color = colors[Math.floor(Math.random() * colors.length)];
    line.style.cssText = `
      position: absolute;
      top: 50%;
      left: 50%;
      width: 6px;
      height: 50px;
      background: ${color};
      border: 2px solid black;
      transform-origin: center bottom;
      transform: translate(-50%, -100%) rotate(${i * 30}deg) scaleY(0);
    `;
    explosion.appendChild(line);

    gsap.to(line, {
      scaleY: 1,
      opacity: 0,
      duration: 0.5,
      delay: Math.random() * 0.1,
      ease: 'power2.out'
    });
  }

  document.body.appendChild(explosion);
  setTimeout(() => explosion.remove(), 600);
}

// 震动屏幕
export function shakeScreen() {
  const app = document.querySelector('.app-container');
  if (!app) return;
  
  gsap.to(app, {
    x: 'random(-10, 10)',
    y: 'random(-10, 10)',
    rotation: 'random(-3, 3)',
    duration: 0.05,
    repeat: 10,
    yoyo: true,
    onComplete: () => { gsap.set(app, { x: 0, y: 0, rotation: 0 }); }
  });
}

// 页面翻转动画
export function pageFlipAnimation(
  currentEl: HTMLElement | null,
  nextEl: HTMLElement | null,
  onComplete?: () => void
) {
  if (!currentEl || !nextEl) {
    onComplete?.();
    return;
  }

  gsap.to(currentEl, {
    rotationY: 90,
    opacity: 0,
    duration: 0.3,
    onComplete: () => {
      currentEl.style.display = 'none';
      nextEl.style.display = 'block';
      gsap.fromTo(nextEl,
        { rotationY: -90, opacity: 0 },
        { 
          rotationY: 0, 
          opacity: 1, 
          duration: 0.3, 
          ease: 'back.out(1.7)',
          onComplete
        }
      );
    }
  });
}

// 淡入淡出动画
export function fadeInOutAnimation(
  elements: HTMLElement[],
  options: { duration?: number; stagger?: number; repeat?: number } = {}
) {
  const { duration = 2, stagger = 3, repeat = -1 } = options;
  
  const tl = gsap.timeline({ repeat });
  
  elements.forEach((el, i) => {
    tl.to(el, {
      opacity: 1,
      duration: duration / 2,
      onStart: () => { el.style.display = 'block'; }
    })
    .to(el, {
      opacity: 0,
      duration: duration / 2,
      delay: stagger - duration,
      onComplete: () => { 
        if (i < elements.length - 1) {
          el.style.display = 'none'; 
        }
      }
    });
  });
  
  return tl;
}

// 卡片滑动动画（左滑/右滑）
export function cardSwipeAnimation(
  element: HTMLElement,
  direction: 'left' | 'right',
  onComplete?: () => void
) {
  const xMove = direction === 'left' ? -window.innerWidth : window.innerWidth;
  const rotation = direction === 'left' ? -30 : 30;

  gsap.to(element, {
    x: xMove,
    rotation: rotation,
    opacity: 0,
    duration: 0.4,
    ease: 'power2.in',
    onComplete
  });
}

// 弹跳进入动画
export function bounceInAnimation(element: HTMLElement) {
  gsap.fromTo(element,
    { scale: 0, rotation: -180, opacity: 0 },
    { 
      scale: 1, 
      rotation: 0, 
      opacity: 1, 
      duration: 0.8, 
      ease: 'back.out(1.7)' 
    }
  );
}

// 脉冲动画
export function pulseAnimation(element: HTMLElement) {
  gsap.to(element, {
    scale: 1.1,
    duration: 0.3,
    yoyo: true,
    repeat: 3,
    ease: 'power1.inOut',
    onComplete: () => {}
  });
}

// 掉落动画
export function dropAnimation(
  element: HTMLElement,
  options: { fromY?: number; duration?: number; bounce?: boolean } = {}
) {
  const { fromY = -200, duration = 0.8, bounce = true } = options;
  
  gsap.fromTo(element,
    { y: fromY, opacity: 0 },
    { 
      y: 0, 
      opacity: 1, 
      duration, 
      ease: bounce ? 'bounce.out' : 'power2.out'
    }
  );
}
