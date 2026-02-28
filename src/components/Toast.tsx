import { useState, useEffect } from 'preact/hooks';

interface ToastProps {
  message: string;
  type?: 'success' | 'error' | 'info';
  duration?: number;
  onClose: () => void;
}

export function Toast({ message, type = 'success', duration = 2000, onClose }: ToastProps) {
  const [isVisible, setIsVisible] = useState(false);

  useEffect(() => {
    // 延迟显示以触发动画
    setTimeout(() => setIsVisible(true), 10);

    // 自动关闭
    const timer = setTimeout(() => {
      setIsVisible(false);
      setTimeout(onClose, 300); // 等待动画结束
    }, duration);

    return () => clearTimeout(timer);
  }, [duration, onClose]);

  const bgColor = type === 'success' ? '#52c41a' : type === 'error' ? '#ff4d4f' : '#1890ff';

  return (
    <div
      style={{
        position: 'fixed',
        top: '24px',
        left: '50%',
        transform: `translate(-50%, ${isVisible ? '0' : '-100px'})`,
        background: bgColor,
        color: '#fff',
        padding: '12px 24px',
        borderRadius: '8px',
        boxShadow: '0 4px 12px rgba(0,0,0,0.15)',
        fontSize: '15px',
        fontWeight: '600',
        zIndex: 9999,
        opacity: isVisible ? 1 : 0,
        transition: 'all 0.3s cubic-bezier(0.4, 0, 0.2, 1)',
        display: 'flex',
        alignItems: 'center',
        gap: '8px',
        minWidth: '200px',
        justifyContent: 'center'
      }}
    >
      <span style={{ fontSize: '18px' }}>
        {type === 'success' ? '✓' : type === 'error' ? '✕' : 'ℹ'}
      </span>
      {message}
    </div>
  );
}

// Toast 管理器
let toastId = 0;
const toastCallbacks: Map<number, () => void> = new Map();

export function showToast(message: string, type: 'success' | 'error' | 'info' = 'success', duration = 2000) {
  const id = toastId++;
  
  // 创建一个临时容器
  const container = document.createElement('div');
  document.body.appendChild(container);

  // 渲染 Toast
  import('preact').then(({ render, h }) => {
    const handleClose = () => {
      render(null, container);
      document.body.removeChild(container);
      toastCallbacks.delete(id);
    };

    toastCallbacks.set(id, handleClose);
    render(h(Toast, { message, type, duration, onClose: handleClose }), container);
  });

  return id;
}



