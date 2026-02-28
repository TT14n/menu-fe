import { useState, useRef, useEffect } from 'preact/hooks';
import { createPortal } from 'preact/compat';
import { AlertTriangle } from 'lucide-preact';

interface PopconfirmProps {
  title: string;
  description?: string;
  onConfirm: () => void;
  onCancel?: () => void;
  children: any;
  placement?: 'top' | 'bottom';
}

export function Popconfirm({ 
  title, 
  description, 
  onConfirm, 
  onCancel,
  children,
  placement = 'top'
}: PopconfirmProps) {
  const [visible, setVisible] = useState(false);
  const [position, setPosition] = useState({ top: 0, left: 0 });
  const triggerRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (visible && triggerRef.current) {
      const rect = triggerRef.current.getBoundingClientRect();
      setPosition({
        top: placement === 'top' ? rect.top - 8 : rect.bottom + 8,
        left: rect.left + rect.width / 2
      });
    }
  }, [visible, placement]);

  const handleConfirm = () => {
    onConfirm();
    setVisible(false);
  };

  const handleCancel = () => {
    onCancel?.();
    setVisible(false);
  };

  const popupContent = visible && createPortal(
    <>
      {/* 遮罩层 */}
      <div
        style={{
          position: 'fixed',
          top: 0,
          left: 0,
          right: 0,
          bottom: 0,
          zIndex: 999
        }}
        onClick={handleCancel}
      />

      {/* 气泡框 */}
      <div
        style={{
          position: 'fixed',
          top: placement === 'top' ? `${position.top}px` : 'auto',
          bottom: placement === 'top' ? 'auto' : `calc(100vh - ${position.top}px)`,
          left: `${position.left}px`,
          transform: placement === 'top' ? 'translate(-50%, -100%)' : 'translate(-50%, 0)',
          background: '#fff',
          borderRadius: '12px',
          padding: '16px',
          boxShadow: '0 6px 24px rgba(0,0,0,0.15)',
          zIndex: 1000,
          minWidth: '280px',
          animation: 'popIn 0.2s ease'
        }}
        onClick={(e) => e.stopPropagation()}
      >
        {/* 箭头 */}
        <div
          style={{
            position: 'absolute',
            [placement === 'top' ? 'bottom' : 'top']: '-6px',
            left: '50%',
            transform: 'translateX(-50%)',
            width: 0,
            height: 0,
            borderLeft: '8px solid transparent',
            borderRight: '8px solid transparent',
            [placement === 'top' ? 'borderTop' : 'borderBottom']: '8px solid #fff',
            filter: 'drop-shadow(0 2px 4px rgba(0,0,0,0.1))'
          }}
        />

        {/* 内容 */}
        <div style={{ display: 'flex', gap: '12px', marginBottom: '16px' }}>
          <div style={{
            width: '22px',
            height: '22px',
            borderRadius: '50%',
            background: '#fff7e6',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            flexShrink: 0
          }}>
            <AlertTriangle size={14} style={{ color: '#faad14' }} />
          </div>
          <div style={{ flex: 1 }}>
            <div style={{
              fontSize: '14px',
              fontWeight: '600',
              color: '#262626',
              marginBottom: description ? '4px' : 0
            }}>
              {title}
            </div>
            {description && (
              <div style={{
                fontSize: '13px',
                color: '#8c8c8c',
                lineHeight: 1.5
              }}>
                {description}
              </div>
            )}
          </div>
        </div>

        {/* 按钮组 */}
        <div style={{ display: 'flex', gap: '8px', justifyContent: 'flex-end' }}>
          <button
            onClick={handleCancel}
            style={{
              padding: '6px 16px',
              background: '#f5f5f5',
              border: 'none',
              borderRadius: '6px',
              fontSize: '13px',
              fontWeight: '600',
              color: '#595959',
              cursor: 'pointer',
              transition: 'all 0.2s'
            }}
            onMouseEnter={(e) => e.currentTarget.style.background = '#e8e8e8'}
            onMouseLeave={(e) => e.currentTarget.style.background = '#f5f5f5'}
          >
            取消
          </button>
          <button
            onClick={handleConfirm}
            style={{
              padding: '6px 16px',
              background: '#ff4d4f',
              border: 'none',
              borderRadius: '6px',
              fontSize: '13px',
              fontWeight: '600',
              color: '#fff',
              cursor: 'pointer',
              transition: 'all 0.2s'
            }}
            onMouseEnter={(e) => e.currentTarget.style.background = '#ff7875'}
            onMouseLeave={(e) => e.currentTarget.style.background = '#ff4d4f'}
          >
            确定
          </button>
        </div>
      </div>

      <style>{`
        @keyframes popIn {
          from {
            opacity: 0;
            transform: translate(-50%, ${placement === 'top' ? '-90%' : '10%'}) scale(0.9);
          }
          to {
            opacity: 1;
            transform: translate(-50%, ${placement === 'top' ? '-100%' : '0'}) scale(1);
          }
        }
      `}</style>
    </>,
    document.body
  );

  return (
    <div ref={triggerRef} style={{ position: 'relative', display: 'inline-block' }}>
      <div onClick={() => setVisible(!visible)}>
        {children}
      </div>
      {popupContent}
    </div>
  );
}

