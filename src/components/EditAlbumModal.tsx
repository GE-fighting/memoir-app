import React, { useState, useEffect, useRef } from 'react';
import { T, useLanguage } from './LanguageContext';
import { albumService, Album } from '@/services/album-service';
import { useOSSUpload } from '@/lib/hooks/useOSSUpload';
import defaultCovers, { fallbackCovers } from '@/utils/default-covers';
import '@/styles/modal.css';

interface EditAlbumModalProps {
  isOpen: boolean;
  onClose: () => void;
  album: Album | null;
  onSuccess: (updatedAlbum: Album) => void;
}

export default function EditAlbumModal({ 
  isOpen, 
  onClose, 
  album,
  onSuccess
}: EditAlbumModalProps) {
  const { language } = useLanguage();
  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [coverUrl, setCoverUrl] = useState('');
  const [isUploading, setIsUploading] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  const [error, setError] = useState('');
  const [showCoverOptions, setShowCoverOptions] = useState(false); // 控制是否显示封面选项
  
  const fileInputRef = useRef<HTMLInputElement>(null);
  const { uploadFile } = useOSSUpload();
  
  // 默认封面图片集合
  const defaultCoversArray = defaultCovers;

  // Reset form when album changes
  useEffect(() => {
    if (album) {
      setTitle(album.title || '');
      setDescription(album.description || '');
      setCoverUrl(album.cover_url || '');
    } else {
      setTitle('');
      setDescription('');
      setCoverUrl('');
    }
    // 每次打开新相册时，重置封面选项显示状态
    setShowCoverOptions(false);
    setError('');
  }, [album]);

  const handleCoverUploadClick = () => {
    if (fileInputRef.current) {
      fileInputRef.current.click();
    }
  };

  const handleFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    
    try {
      setIsUploading(true);
      setError('');
      
      // Upload to OSS
      const result = await uploadFile(file);
      if (result?.url) {
        setCoverUrl(result.url);
      }
    } catch (err) {
      console.error('Failed to upload cover:', err);
      setError(language === 'zh' ? '上传封面失败' : 'Failed to upload cover');
    } finally {
      setIsUploading(false);
      // Reset file input
      if (fileInputRef.current) {
        fileInputRef.current.value = '';
      }
    }
  };

  const handleSave = async () => {
    if (!album) return;
    
    try {
      setIsSaving(true);
      setError('');
      
      // Update album
      const updatedAlbum = await albumService.updateAlbum(album.id, {
        title: title.trim(),
        description: description.trim(),
        cover_url: coverUrl !== album.cover_url ? coverUrl || undefined : undefined // 只有在封面更改时才更新
      });
      
      onSuccess(updatedAlbum);
      onClose();
    } catch (err) {
      console.error('Failed to update album:', err);
      setError(language === 'zh' ? '更新相册失败' : 'Failed to update album');
    } finally {
      setIsSaving(false);
    }
  };

  if (!isOpen || !album) return null;

  // 确定当前选中的封面是否为默认封面之一
  const isDefaultCover = defaultCoversArray.includes(coverUrl);
  const currentCoverIndex = defaultCoversArray.indexOf(coverUrl);

  return (
    <div className="modal-overlay" onClick={onClose}>
      <div className="modal-container" onClick={(e) => e.stopPropagation()}>
        <div className="modal-header">
          <h2><T zh="编辑相册" en="Edit Album" /></h2>
          <button className="close-button" onClick={onClose}>
            <i className="fas fa-times"></i>
          </button>
        </div>
        
        <div className="modal-body">
          {error && <div className="error-message">{error}</div>}
          
          <div className="form-group">
            <label htmlFor="album-title">
              <T zh="相册标题" en="Album Title" />
            </label>
            <input
              id="album-title"
              type="text"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              placeholder={language === 'zh' ? '输入相册标题' : 'Enter album title'}
              className="form-control"
            />
          </div>
          
          <div className="form-group">
            <label htmlFor="album-description">
              <T zh="相册描述" en="Album Description" />
            </label>
            <textarea
              id="album-description"
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              placeholder={language === 'zh' ? '输入相册描述（可选）' : 'Enter album description (optional)'}
              className="form-control"
              rows={3}
            />
          </div>
          
          <div className="form-group">
            <label>
              <T zh="相册封面" en="Album Cover" />
            </label>
            
            {/* 当前封面展示 */}
            <div className="current-cover-section">
              <div className="cover-preview">
                <div className="preview-container">
                  <img 
                    src={coverUrl || "https://placehold.co/500x500/CCCCCC/FFFFFF?text=No+Cover"} 
                    alt="Current cover" 
                    className="preview-image"
                    onError={(e) => {
                      // 查找当前选择的URL在defaultCovers数组中的索引
                      const index = defaultCoversArray.indexOf(coverUrl);
                      // 如果找到且有对应的备用URL，则使用备用URL
                      if (index !== -1 && fallbackCovers[index]) {
                        (e.target as HTMLImageElement).src = fallbackCovers[index];
                      } else {
                        // 如果找不到对应的备用图片，使用通用备用图片
                        (e.target as HTMLImageElement).src = "https://placehold.co/500x500/CCCCCC/FFFFFF?text=Preview+Not+Available";
                      }
                    }}
                  />
                </div>
                <p className="preview-hint">
                  {coverUrl ? (
                    isDefaultCover ? (
                      <T zh={`默认封面 #${currentCoverIndex + 1}`} en={`Default Cover #${currentCoverIndex + 1}`} />
                    ) : (
                      <T zh="自定义封面" en="Custom Cover" />
                    )
                  ) : (
                    <T zh="无封面" en="No Cover" />
                  )}
                </p>
              </div>
              
              <button
                type="button"
                className="btn btn-secondary"
                onClick={() => setShowCoverOptions(true)}
              >
                <i className="fas fa-exchange-alt"></i>
                <T zh="更换封面" en="Change Cover" />
              </button>
            </div>
            
            {/* 更换封面选项 - 仅当用户点击"更换封面"后显示 */}
            {showCoverOptions && (
              <div className="cover-change-section">
                <div className="cover-options">
                  {defaultCoversArray.map((cover, index) => (
                    <div 
                      key={index}
                      className={`cover-option ${coverUrl === cover ? 'selected' : ''}`}
                      onClick={() => setCoverUrl(cover)}
                    >
                      <img 
                        src={cover} 
                        alt={`Cover ${index + 1}`} 
                        onError={(e) => {
                          // 如果默认图片加载失败，使用备用图片
                          if (fallbackCovers[index]) {
                            (e.target as HTMLImageElement).src = fallbackCovers[index];
                          } else {
                            // 如果找不到对应的备用图片，使用通用备用图片
                            (e.target as HTMLImageElement).src = "https://placehold.co/500x500/CCCCCC/FFFFFF?text=Cover+${index+1}";
                          }
                        }}
                      />
                    </div>
                  ))}
                </div>
                
                <div className="custom-url-section">
                  <label htmlFor="album-cover">
                    <T zh="或上传自定义封面" en="Or upload custom cover" />
                  </label>
                  <input
                    type="file"
                    ref={fileInputRef}
                    onChange={handleFileChange}
                    accept="image/*"
                    style={{ display: 'none' }}
                  />
                  
                  <button
                    type="button"
                    className="btn btn-secondary"
                    onClick={handleCoverUploadClick}
                    disabled={isUploading}
                  >
                    {isUploading ? (
                      <>
                        <i className="fas fa-spinner fa-spin"></i>
                        <T zh="上传中..." en="Uploading..." />
                      </>
                    ) : (
                      <>
                        <i className="fas fa-upload"></i>
                        <T zh="上传封面" en="Upload Cover" />
                      </>
                    )}
                  </button>
                  
                  {coverUrl && !isDefaultCover && coverUrl !== album?.cover_url && (
                    <button
                      type="button"
                      className="btn btn-danger"
                      onClick={() => setCoverUrl(album?.cover_url || '')}
                      disabled={isUploading}
                      style={{ marginLeft: '10px' }}
                    >
                      <i className="fas fa-undo"></i>
                      <T zh="撤销更改" en="Undo Changes" />
                    </button>
                  )}
                </div>
              </div>
            )}
          </div>
        </div>
        
        <div className="modal-footer">
          <button 
            type="button"
            className="btn btn-secondary" 
            onClick={onClose}
            disabled={isSaving}
          >
            <T zh="取消" en="Cancel" />
          </button>
          <button 
            type="button"
            className="btn btn-primary" 
            onClick={handleSave}
            disabled={isSaving || !title.trim()}
          >
            {isSaving ? (
              <>
                <i className="fas fa-spinner fa-spin"></i>
                <T zh="保存中..." en="Saving..." />
              </>
            ) : (
              <>
                <i className="fas fa-save"></i>
                <T zh="保存" en="Save" />
              </>
            )}
          </button>
        </div>
      </div>
      
      <style jsx>{`
        .cover-options {
          display: grid;
          grid-template-columns: repeat(3, 1fr);
          gap: 10px;
          margin-bottom: 15px;
          max-height: 400px;
          overflow-y: auto;
        }
        
        .cover-option {
          border: 2px solid transparent;
          border-radius: 6px;
          overflow: hidden;
          cursor: pointer;
          height: 80px;
          transition: border-color 0.2s;
        }
        
        .cover-option:hover {
          border-color: #007bff;
        }
        
        .cover-option.selected {
          border-color: #007bff;
          box-shadow: 0 0 0 2px #007bff;
        }
        
        .cover-option img {
          width: 100%;
          height: 100%;
          object-fit: cover;
        }
        
        .custom-url-section {
          margin-top: 15px;
          display: flex;
          align-items: center;
          gap: 10px;
        }
        
        .custom-url-section label {
          margin: 0;
        }
        
        /* 当前封面展示样式 */
        .current-cover-section {
          display: flex;
          flex-direction: column;
          align-items: center;
          gap: 15px;
        }
        
        /* 封面预览样式 */
        .cover-preview {
          text-align: center;
          padding: 15px;
          background-color: #f8f9fa;
          border-radius: 8px;
          border: 1px solid #e9ecef;
          width: 100%;
        }
        
        .preview-container {
          display: flex;
          justify-content: center;
          align-items: center;
          min-height: 250px;
          background-color: white;
          border-radius: 4px;
          overflow: hidden;
          padding: 10px;
        }
        
        .preview-image {
          max-width: 100% !important;
          max-height: 300px !important;
          object-fit: contain !important;
          box-shadow: 0 2px 8px rgba(0, 0, 0, 0.1);
          background-color: white;
        }
        
        .preview-hint {
          margin-top: 8px;
          font-size: 14px;
          color: #6c757d;
        }
        
        .cover-change-section {
          margin-top: 20px;
          padding-top: 20px;
          border-top: 1px solid #e9ecef;
        }
        
        /* 滚动条样式 */
        .cover-options::-webkit-scrollbar {
          width: 6px;
        }
        
        .cover-options::-webkit-scrollbar-track {
          background: #f1f1f1;
          border-radius: 3px;
        }
        
        .cover-options::-webkit-scrollbar-thumb {
          background: #c1c1c1;
          border-radius: 3px;
        }
        
        .cover-options::-webkit-scrollbar-thumb:hover {
          background: #a1a1a1;
        }
        
        .error-message {
          padding: 12px;
          background-color: var(--error-bg, #f8d7da);
          color: var(--error-text, #721c24);
          border-radius: 4px;
          margin-bottom: 16px;
        }
      `}</style>
    </div>
  );
}