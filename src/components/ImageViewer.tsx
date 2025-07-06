'use client';

import React, { useState, useRef, useEffect, useCallback } from 'react';
import { T } from './LanguageContext';

interface ImageViewerProps {
  src: string;
  alt: string;
  onClose: () => void;
}

const ImageViewer: React.FC<ImageViewerProps> = ({ src, alt, onClose }) => {
  const [scale, setScale] = useState(1);
  const [position, setPosition] = useState({ x: 0, y: 0 });
  const [isDragging, setIsDragging] = useState(false);
  const [dragStart, setDragStart] = useState({ x: 0, y: 0 });
  const [isLoaded, setIsLoaded] = useState(false);
  const imageRef = useRef<HTMLImageElement>(null);
  const containerRef = useRef<HTMLDivElement>(null);

  // 重置图片状态
  const resetImage = useCallback(() => {
    setScale(1);
    setPosition({ x: 0, y: 0 });
  }, []);

  // 放大
  const zoomIn = useCallback(() => {
    setScale(prev => Math.min(prev * 1.5, 5));
  }, []);

  // 缩小
  const zoomOut = useCallback(() => {
    setScale(prev => Math.max(prev / 1.5, 0.1));
  }, []);

  // 处理鼠标滚轮缩放
  const handleWheel = useCallback((e: React.WheelEvent) => {
    e.preventDefault();
    const delta = e.deltaY > 0 ? 0.9 : 1.1;
    setScale(prev => Math.max(0.1, Math.min(5, prev * delta)));
  }, []);

  // 处理鼠标按下开始拖拽
  const handleMouseDown = useCallback((e: React.MouseEvent) => {
    if (scale > 1) {
      setIsDragging(true);
      setDragStart({
        x: e.clientX - position.x,
        y: e.clientY - position.y
      });
    }
  }, [scale, position]);

  // 处理鼠标移动拖拽
  const handleMouseMove = useCallback((e: React.MouseEvent) => {
    if (isDragging && scale > 1) {
      setPosition({
        x: e.clientX - dragStart.x,
        y: e.clientY - dragStart.y
      });
    }
  }, [isDragging, scale, dragStart]);

  // 处理鼠标抬起结束拖拽
  const handleMouseUp = useCallback(() => {
    setIsDragging(false);
  }, []);

  // 处理键盘快捷键
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      switch (e.key) {
        case 'Escape':
          onClose();
          break;
        case '+':
        case '=':
          e.preventDefault();
          zoomIn();
          break;
        case '-':
          e.preventDefault();
          zoomOut();
          break;
        case '0':
          e.preventDefault();
          resetImage();
          break;
      }
    };

    document.addEventListener('keydown', handleKeyDown);
    return () => document.removeEventListener('keydown', handleKeyDown);
  }, [onClose, zoomIn, zoomOut, resetImage]);

  // 处理图片加载完成
  const handleImageLoad = () => {
    setIsLoaded(true);
  };

  return (
    <div className="image-viewer-overlay" onClick={onClose}>
      <div 
        className="image-viewer-container" 
        onClick={(e) => e.stopPropagation()}
        ref={containerRef}
      >
        {/* 关闭按钮 */}
        <button className="image-viewer-close-btn" onClick={onClose}>
          <i className="fas fa-times"></i>
        </button>

        {/* 工具栏 */}
        <div className="image-viewer-toolbar">
          <button 
            className="toolbar-btn" 
            onClick={zoomIn}
            title="放大 (+)"
          >
            <i className="fas fa-search-plus"></i>
          </button>
          <button 
            className="toolbar-btn" 
            onClick={zoomOut}
            title="缩小 (-)"
          >
            <i className="fas fa-search-minus"></i>
          </button>
          <button 
            className="toolbar-btn" 
            onClick={resetImage}
            title="重置 (0)"
          >
            <i className="fas fa-expand-arrows-alt"></i>
          </button>
          <span className="zoom-indicator">{Math.round(scale * 100)}%</span>
        </div>

        {/* 图片容器 */}
        <div 
          className="image-viewer-content"
          onWheel={handleWheel}
          onMouseDown={handleMouseDown}
          onMouseMove={handleMouseMove}
          onMouseUp={handleMouseUp}
          onMouseLeave={handleMouseUp}
          style={{ cursor: scale > 1 ? (isDragging ? 'grabbing' : 'grab') : 'default' }}
        >
          <img
            ref={imageRef}
            src={src}
            alt={alt}
            className={`image-viewer-image ${isLoaded ? 'loaded' : ''}`}
            style={{
              transform: `scale(${scale}) translate(${position.x / scale}px, ${position.y / scale}px)`,
              transition: isDragging ? 'none' : 'transform 0.3s ease'
            }}
            onLoad={handleImageLoad}
            draggable={false}
          />
        </div>

        {/* 加载指示器 */}
        {!isLoaded && (
          <div className="image-viewer-loading">
            <div className="loading-spinner"></div>
            <T zh="加载中..." en="Loading..." />
          </div>
        )}

        {/* 操作提示 */}
        <div className="image-viewer-hints">
          <div className="hint-item">
            <T zh="滚轮：缩放" en="Wheel: Zoom" />
          </div>
          <div className="hint-item">
            <T zh="拖拽：移动" en="Drag: Move" />
          </div>
          <div className="hint-item">
            <T zh="ESC：关闭" en="ESC: Close" />
          </div>
        </div>
      </div>

      <style jsx>{`
        .image-viewer-overlay {
          position: fixed;
          top: 0;
          left: 0;
          right: 0;
          bottom: 0;
          background-color: rgba(0, 0, 0, 0.95);
          display: flex;
          align-items: center;
          justify-content: center;
          z-index: 1200;
          backdrop-filter: blur(5px);
        }

        .image-viewer-container {
          position: relative;
          width: 100%;
          height: 100%;
          display: flex;
          flex-direction: column;
          overflow: hidden;
        }

        .image-viewer-close-btn {
          position: absolute;
          top: 20px;
          right: 20px;
          background: rgba(0, 0, 0, 0.7);
          color: white;
          width: 50px;
          height: 50px;
          border-radius: 50%;
          border: none;
          display: flex;
          align-items: center;
          justify-content: center;
          z-index: 10;
          cursor: pointer;
          font-size: 18px;
          transition: background-color 0.3s ease;
        }

        .image-viewer-close-btn:hover {
          background: rgba(0, 0, 0, 0.9);
        }

        .image-viewer-toolbar {
          position: absolute;
          top: 20px;
          left: 20px;
          display: flex;
          align-items: center;
          gap: 10px;
          background: rgba(0, 0, 0, 0.7);
          padding: 10px 15px;
          border-radius: 25px;
          z-index: 10;
        }

        .toolbar-btn {
          background: transparent;
          color: white;
          border: none;
          width: 35px;
          height: 35px;
          border-radius: 50%;
          display: flex;
          align-items: center;
          justify-content: center;
          cursor: pointer;
          transition: background-color 0.3s ease;
        }

        .toolbar-btn:hover {
          background: rgba(255, 255, 255, 0.2);
        }

        .zoom-indicator {
          color: white;
          font-size: 14px;
          font-weight: 500;
          min-width: 50px;
          text-align: center;
        }

        .image-viewer-content {
          flex: 1;
          display: flex;
          align-items: center;
          justify-content: center;
          overflow: hidden;
          position: relative;
        }

        .image-viewer-image {
          max-width: 100%;
          max-height: 100%;
          object-fit: contain;
          opacity: 0;
          transition: opacity 0.3s ease;
          user-select: none;
        }

        .image-viewer-image.loaded {
          opacity: 1;
        }

        .image-viewer-loading {
          position: absolute;
          top: 50%;
          left: 50%;
          transform: translate(-50%, -50%);
          display: flex;
          flex-direction: column;
          align-items: center;
          gap: 15px;
          color: white;
        }

        .loading-spinner {
          width: 40px;
          height: 40px;
          border: 3px solid rgba(255, 255, 255, 0.3);
          border-top: 3px solid white;
          border-radius: 50%;
          animation: spin 1s linear infinite;
        }

        @keyframes spin {
          0% { transform: rotate(0deg); }
          100% { transform: rotate(360deg); }
        }

        .image-viewer-hints {
          position: absolute;
          bottom: 20px;
          left: 50%;
          transform: translateX(-50%);
          display: flex;
          gap: 20px;
          background: rgba(0, 0, 0, 0.7);
          padding: 10px 20px;
          border-radius: 20px;
          z-index: 10;
        }

        .hint-item {
          color: white;
          font-size: 12px;
          opacity: 0.8;
        }

        @media (max-width: 768px) {
          .image-viewer-toolbar {
            top: 10px;
            left: 10px;
            padding: 8px 12px;
          }

          .toolbar-btn {
            width: 30px;
            height: 30px;
          }

          .image-viewer-close-btn {
            top: 10px;
            right: 10px;
            width: 40px;
            height: 40px;
          }

          .image-viewer-hints {
            bottom: 10px;
            flex-direction: column;
            gap: 5px;
            padding: 8px 15px;
          }
        }
      `}</style>
    </div>
  );
};

export default ImageViewer;
