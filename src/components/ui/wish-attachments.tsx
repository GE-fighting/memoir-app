'use client';

import React, { useState, useEffect } from 'react';
import { T, useLanguage } from '../LanguageContext';
import { Attachment } from '@/services/api-types';
import ImageViewer from '../ImageViewer';
import { getSignedUrl } from '@/lib/services/ossService';

interface WishAttachmentsProps {
  attachments: Attachment[];
}

export default function WishAttachments({ attachments }: WishAttachmentsProps) {
  const { language } = useLanguage();
  const [selectedIndex, setSelectedIndex] = useState<number | null>(null);
  const [videoUrl, setVideoUrl] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  const [signedAttachments, setSignedAttachments] = useState<(Attachment & { signedUrl: string })[]>([]);
  
  // 获取签名URL
  useEffect(() => {
    const getSignedUrls = async () => {
      try {
        setLoading(true);
        const signedItems = await Promise.all(
          attachments.map(async (attachment) => {
            try {
              const signedUrl = await getSignedUrl(attachment.url);
              return { ...attachment, signedUrl };
            } catch (error) {
              console.error(`获取附件签名URL失败: ${attachment.file_name}`, error);
              // 如果获取签名失败，使用原始URL作为后备
              return { ...attachment, signedUrl: attachment.url };
            }
          })
        );
        setSignedAttachments(signedItems);
      } catch (error) {
        console.error('处理附件签名URL失败:', error);
      } finally {
        setLoading(false);
      }
    };

    if (attachments && attachments.length > 0) {
      getSignedUrls();
    }
  }, [attachments]);
  
  if (!attachments || attachments.length === 0) {
    return null;
  }
  
  // 判断文件类型
  const isImage = (fileType: string) => fileType.startsWith('image/');
  const isVideo = (fileType: string) => fileType.startsWith('video/');
  
  // 处理附件点击
  const handleAttachmentClick = (index: number) => {
    if (signedAttachments.length <= index) return;
    
    const attachment = signedAttachments[index];
    
    if (isImage(attachment.file_type)) {
      setSelectedIndex(index);
      setVideoUrl(null);
    } else if (isVideo(attachment.file_type)) {
      setVideoUrl(attachment.signedUrl);
      setSelectedIndex(null);
    }
  };
  
  // 关闭查看器
  const handleClose = () => {
    setSelectedIndex(null);
    setVideoUrl(null);
  };
  
  // 切换到下一个附件
  const handleNext = () => {
    if (selectedIndex !== null && selectedIndex < signedAttachments.length - 1) {
      // 查找下一个图片
      let nextIndex = selectedIndex + 1;
      while (nextIndex < signedAttachments.length && !isImage(signedAttachments[nextIndex].file_type)) {
        nextIndex++;
      }
      
      if (nextIndex < signedAttachments.length) {
        setSelectedIndex(nextIndex);
      }
    }
  };
  
  // 切换到上一个附件
  const handlePrev = () => {
    if (selectedIndex !== null && selectedIndex > 0) {
      // 查找上一个图片
      let prevIndex = selectedIndex - 1;
      while (prevIndex >= 0 && !isImage(signedAttachments[prevIndex].file_type)) {
        prevIndex--;
      }
      
      if (prevIndex >= 0) {
        setSelectedIndex(prevIndex);
      }
    }
  };
  
  // 最多显示的缩略图数量
  const MAX_VISIBLE_THUMBNAILS = 4;
  const hasMoreAttachments = attachments.length > MAX_VISIBLE_THUMBNAILS;
  
  return (
    <div className="wish-attachments">
      <div className="attachments-header">
        <i className="fas fa-camera-retro"></i>
        <span>
          <T 
            zh={`完成记录 (${attachments.length})`} 
            en={`Completion Records (${attachments.length})`} 
          />
        </span>
      </div>
      
      {loading ? (
        <div className="attachments-loading">
          <i className="fas fa-spinner fa-spin"></i>
          <span><T zh="加载中..." en="Loading..." /></span>
        </div>
      ) : (
        <div className="attachments-grid">
          {signedAttachments.slice(0, MAX_VISIBLE_THUMBNAILS).map((attachment, index) => (
            <div 
              key={attachment.id} 
              className="attachment-item"
              onClick={() => handleAttachmentClick(index)}
            >
              {isImage(attachment.file_type) ? (
                <img 
                  src={attachment.signedUrl} 
                  alt={attachment.file_name} 
                  loading="lazy" 
                />
              ) : isVideo(attachment.file_type) ? (
                <div className="video-thumbnail">
                  <div className="video-placeholder">
                    <i className="fas fa-file-video"></i>
                  </div>
                  <div className="play-icon">
                    <i className="fas fa-play"></i>
                  </div>
                </div>
              ) : (
                <div className="file-placeholder">
                  <i className="fas fa-file"></i>
                </div>
              )}
            </div>
          ))}
          
          {hasMoreAttachments && (
            <div 
              className="more-attachments"
              onClick={() => handleAttachmentClick(MAX_VISIBLE_THUMBNAILS)}
            >
              <span>+{attachments.length - MAX_VISIBLE_THUMBNAILS}</span>
            </div>
          )}
        </div>
      )}
      
      {/* 图片查看器 */}
      {selectedIndex !== null && signedAttachments[selectedIndex] && (
        <>
          <ImageViewer
            src={signedAttachments[selectedIndex].signedUrl}
            alt={signedAttachments[selectedIndex].file_name}
            onClose={handleClose}
          />
          
          {/* 添加左右切换按钮 */}
          <div className="image-navigation">
            {selectedIndex > 0 && (
              <button 
                className="nav-button prev-button" 
                onClick={(e) => {
                  e.stopPropagation();
                  handlePrev();
                }}
              >
                <i className="fas fa-chevron-left"></i>
              </button>
            )}
            
            {selectedIndex < signedAttachments.length - 1 && (
              <button 
                className="nav-button next-button" 
                onClick={(e) => {
                  e.stopPropagation();
                  handleNext();
                }}
              >
                <i className="fas fa-chevron-right"></i>
              </button>
            )}
          </div>
        </>
      )}
      
      {/* 视频查看器 */}
      {videoUrl && (
        <div className="video-viewer-overlay" onClick={handleClose}>
          <div className="video-viewer-container" onClick={(e) => e.stopPropagation()}>
            <button className="close-btn" onClick={handleClose}>
              <i className="fas fa-times"></i>
            </button>
            <video 
              src={videoUrl} 
              controls 
              autoPlay 
              className="video-player"
            />
          </div>
        </div>
      )}
      
      <style jsx>{`
        .wish-attachments {
          margin-top: 12px;
          padding-top: 12px;
          border-top: 1px dashed var(--border-primary, #eee);
        }
        
        .attachments-header {
          display: flex;
          align-items: center;
          gap: 8px;
          margin-bottom: 10px;
          font-size: 14px;
          color: var(--text-secondary, #666);
        }
        
        .attachments-loading {
          display: flex;
          align-items: center;
          justify-content: center;
          gap: 8px;
          padding: 20px 0;
          color: var(--text-tertiary, #999);
          font-size: 14px;
        }
        
        .attachments-grid {
          display: grid;
          grid-template-columns: repeat(auto-fill, minmax(70px, 1fr));
          gap: 8px;
          margin-bottom: 8px;
        }
        
        .attachment-item {
          aspect-ratio: 1 / 1;
          border-radius: 6px;
          overflow: hidden;
          cursor: pointer;
          position: relative;
          background: var(--bg-tertiary, #f5f7fa);
          border: 1px solid var(--border-primary, #eee);
          transition: transform 0.2s ease, box-shadow 0.2s ease;
        }
        
        .attachment-item:hover {
          transform: translateY(-2px);
          box-shadow: var(--shadow-md, 0 4px 12px rgba(0, 0, 0, 0.1));
        }
        
        .attachment-item img {
          width: 100%;
          height: 100%;
          object-fit: cover;
          display: block;
        }
        
        .video-thumbnail {
          position: relative;
          width: 100%;
          height: 100%;
          background: var(--bg-tertiary, #f5f7fa);
          display: flex;
          align-items: center;
          justify-content: center;
        }
        
        .video-placeholder {
          display: flex;
          align-items: center;
          justify-content: center;
          width: 100%;
          height: 100%;
          color: var(--text-tertiary, #999);
          font-size: 24px;
        }
        
        .play-icon {
          position: absolute;
          top: 50%;
          left: 50%;
          transform: translate(-50%, -50%);
          background: rgba(0, 0, 0, 0.6);
          color: white;
          width: 24px;
          height: 24px;
          border-radius: 50%;
          display: flex;
          align-items: center;
          justify-content: center;
          font-size: 10px;
        }
        
        .file-placeholder {
          width: 100%;
          height: 100%;
          display: flex;
          align-items: center;
          justify-content: center;
          color: var(--text-tertiary, #999);
          font-size: 24px;
        }
        
        .more-attachments {
          aspect-ratio: 1 / 1;
          border-radius: 6px;
          background: var(--bg-tertiary, #f5f7fa);
          border: 1px solid var(--border-primary, #eee);
          display: flex;
          align-items: center;
          justify-content: center;
          cursor: pointer;
          font-size: 14px;
          font-weight: 500;
          color: var(--text-secondary, #666);
          transition: all 0.2s ease;
        }
        
        .more-attachments:hover {
          background: var(--bg-hover, #edf2f7);
          color: var(--accent-primary, #6c5ce7);
        }
        
        .video-viewer-overlay {
          position: fixed;
          top: 0;
          left: 0;
          right: 0;
          bottom: 0;
          background-color: rgba(0, 0, 0, 0.9);
          display: flex;
          align-items: center;
          justify-content: center;
          z-index: 1200;
          backdrop-filter: blur(5px);
        }
        
        .video-viewer-container {
          position: relative;
          width: 90%;
          max-width: 800px;
          max-height: 90vh;
          display: flex;
          flex-direction: column;
          overflow: hidden;
          border-radius: 8px;
          background: black;
        }
        
        .close-btn {
          position: absolute;
          top: 15px;
          right: 15px;
          background: rgba(0, 0, 0, 0.7);
          color: white;
          width: 36px;
          height: 36px;
          border-radius: 50%;
          border: none;
          display: flex;
          align-items: center;
          justify-content: center;
          z-index: 10;
          cursor: pointer;
          font-size: 16px;
          transition: background-color 0.3s ease;
        }
        
        .close-btn:hover {
          background: rgba(0, 0, 0, 0.9);
        }
        
        .video-player {
          width: 100%;
          max-height: 90vh;
          display: block;
        }
        
        .image-navigation {
          position: fixed;
          top: 50%;
          left: 0;
          right: 0;
          display: flex;
          justify-content: space-between;
          padding: 0 20px;
          z-index: 1250;
          transform: translateY(-50%);
          pointer-events: none;
        }
        
        .nav-button {
          background: rgba(0, 0, 0, 0.7);
          color: white;
          border: none;
          border-radius: 50%;
          width: 44px;
          height: 44px;
          display: flex;
          align-items: center;
          justify-content: center;
          cursor: pointer;
          transition: background-color 0.3s ease;
          pointer-events: auto;
        }
        
        .nav-button:hover {
          background: rgba(0, 0, 0, 0.9);
        }
        
        @media (max-width: 768px) {
          .attachments-grid {
            grid-template-columns: repeat(auto-fill, minmax(60px, 1fr));
          }
          
          .video-viewer-container {
            width: 95%;
          }
        }
      `}</style>
    </div>
  );
} 