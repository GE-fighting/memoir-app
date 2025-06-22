'use client';

import React, { useState, useEffect, useCallback } from 'react';
import { T, useLanguage } from './LanguageContext';
import { eventService } from '../services/event-service';
import { locationService } from '../services/location-service';
import { albumService, Album } from '../services/album-service';
import { CreateTimelineEventRequest, Location } from '../services/api-types';
import { useAuth } from '../contexts/auth-context';
import { getCoupleSignedUrl } from '../lib/services/coupleOssService';
import { useTheme } from '../contexts/theme-context';

interface CreateStoryModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSuccess: () => void;
}

// Step indicator for the multi-step process
const StepIndicator = ({ currentStep }: { currentStep: number }) => {
  const steps = [
    { key: 1, label: { zh: '故事详情', en: 'Story Details' } },
    { key: 2, label: { zh: '地点选择', en: 'Location Selection' } },
    { key: 3, label: { zh: '照片选择', en: 'Photo Selection' } }
  ];

  return (
    <div className="step-indicator" style={{
      position: 'relative',
      display: 'flex',
      justifyContent: 'space-between',
      margin: '0 20px',
      padding: '20px 0'
    }}>
      {/* 连接线 */}
      <div style={{
        position: 'absolute',
        top: '50%',
        left: 0,
        right: 0,
        height: '2px',
        backgroundColor: 'var(--border-primary)',
        zIndex: 1
      }}></div>

      {steps.map((step) => (
        <div
          key={step.key}
          className="step"
          style={{
            display: 'flex',
            flexDirection: 'column',
            alignItems: 'center',
            position: 'relative',
            zIndex: 2
          }}
        >
          <div
            className="step-number"
            style={{
              width: '32px',
              height: '32px',
              borderRadius: '50%',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              fontSize: '14px',
              fontWeight: '600',
              marginBottom: '8px',
              backgroundColor: currentStep >= step.key ? 'var(--accent-primary)' : 'var(--bg-secondary)',
              color: currentStep >= step.key ? 'var(--text-inverse)' : 'var(--text-tertiary)',
              border: `2px solid ${currentStep >= step.key ? 'var(--accent-primary)' : 'var(--border-primary)'}`,
              transition: 'all 0.3s ease'
            }}
          >
            {currentStep > step.key ? <i className="fas fa-check"></i> : step.key}
          </div>
          <div
            className="step-label"
            style={{
              fontSize: '12px',
              fontWeight: '500',
              color: currentStep >= step.key ? 'var(--text-primary)' : 'var(--text-tertiary)',
              textAlign: 'center'
            }}
          >
            <T zh={step.label.zh} en={step.label.en} />
          </div>
        </div>
      ))}
    </div>
  );
};

export default function CreateStoryModal({ isOpen, onClose, onSuccess }: CreateStoryModalProps) {
  const { language } = useLanguage();
  const { user } = useAuth(); // 使用 useAuth 钩子获取当前用户信息
  const { theme } = useTheme();
  const [currentStep, setCurrentStep] = useState(1);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState('');
  
  // Step 1: Story details
  const [title, setTitle] = useState('');
  const [startDate, setStartDate] = useState('');
  const [endDate, setEndDate] = useState('');
  const [content, setContent] = useState('');
  
  // Step 2: Location selection
  const [locations, setLocations] = useState<Location[]>([]);
  const [locationsLoading, setLocationsLoading] = useState(false);
  const [selectedLocationIds, setSelectedLocationIds] = useState<string[]>([]);
  
  // Step 3: Photo selection
  const [albums, setAlbums] = useState<Album[]>([]);
  const [albumsLoading, setAlbumsLoading] = useState(false);
  const [selectedAlbumId, setSelectedAlbumId] = useState<string>('');
  const [albumPhotos, setAlbumPhotos] = useState<any[]>([]);
  const [albumPhotosLoading, setAlbumPhotosLoading] = useState(false);
  const [selectedPhotoIds, setSelectedPhotoIds] = useState<string[]>([]);
  // 添加封面照片ID状态
  const [coverPhotoId, setCoverPhotoId] = useState<string>('');
  
  // 存储签名后的照片URL
  const [signedPhotoUrls, setSignedPhotoUrls] = useState<Record<string, string>>({});

  // 重置表单
  const resetForm = useCallback(() => {
    setCurrentStep(1);
    setTitle('');
    setStartDate('');
    setEndDate('');
    setContent('');
    setSelectedLocationIds([]);
    setSelectedAlbumId('');
    setSelectedPhotoIds([]);
    setCoverPhotoId(''); // 重置封面照片ID
    setError('');
  }, []);

  // Reset form when modal is closed
  useEffect(() => {
    if (!isOpen) {
      resetForm();
    }
  }, [isOpen, resetForm]);

  // Load locations when reaching step 2
  useEffect(() => {
    if (isOpen && currentStep === 2) {
      loadLocations();
    }
  }, [isOpen, currentStep]);

  // Load albums when reaching step 3
  useEffect(() => {
    if (isOpen && currentStep === 3) {
      loadAlbums();
    }
  }, [isOpen, currentStep]);

  // Load album photos when an album is selected
  useEffect(() => {
    if (selectedAlbumId) {
      loadAlbumPhotos(selectedAlbumId);
    }
  }, [selectedAlbumId]);

  // 如果模态框不是打开状态，不渲染任何内容
  if (!isOpen) return null;

  // 加载位置列表
  async function loadLocations() {
    try {
      setLocationsLoading(true);
      const coupleId = user?.couple_id || localStorage.getItem('coupleID') || '';
      const data = await locationService.getLocations({couple_id: coupleId});
      setLocations(data);
    } catch (err: any) {
      setError(
        err.response?.data?.message || 
        (language === 'zh' ? '加载地点列表失败' : 'Failed to load locations')
      );
      // 出错时设置为空数组
      setLocations([]);
    } finally {
      setLocationsLoading(false);
    }
  }

  // 加载相册列表
  async function loadAlbums() {
    try {
      setAlbumsLoading(true);
      const albums = await albumService.getAlbums();
      setAlbums(albums);
    } catch (err: any) {
      setError(
        err.response?.data?.message || 
        (language === 'zh' ? '加载相册列表失败' : 'Failed to load albums')
      );
    } finally {
      setAlbumsLoading(false);
    }
  }

  // 加载相册照片
  async function loadAlbumPhotos(albumId: string) {
    try {
      setAlbumPhotosLoading(true);
      const album = await albumService.getAlbumWithPhotos(albumId);
      const photos = album.photos_videos || [];
      setAlbumPhotos(photos);
      
      // 为所有照片获取签名URL
      const urlMap: Record<string, string> = {};
      await Promise.all(photos.map(async (photo) => {
        try {
          // 为媒体URL和缩略图URL获取签名
          if (photo.media_url) {
            urlMap[`media_${photo.id}`] = await getCoupleSignedUrl(photo.media_url);
          }
          if (photo.thumbnail_url) {
            urlMap[`thumbnail_${photo.id}`] = await getCoupleSignedUrl(photo.thumbnail_url);
          }
        } catch (err) {
          console.error("获取签名URL失败:", err);
        }
      }));
      
      setSignedPhotoUrls(urlMap);
    } catch (err: any) {
      setError(
        err.response?.data?.message || 
        (language === 'zh' ? '加载相册照片失败' : 'Failed to load album photos')
      );
      // 出错时设置为空数组
      setAlbumPhotos([]);
    } finally {
      setAlbumPhotosLoading(false);
    }
  }

  // 获取照片的签名URL
  const getPhotoUrl = (photo: any, isThumb: boolean = true) => {
    const key = isThumb ? `thumbnail_${photo.id}` : `media_${photo.id}`;
    
    // 如果有签名URL，则使用签名URL
    if (signedPhotoUrls[key]) {
      return signedPhotoUrls[key];
    }
    
    // 否则返回原始URL（可能无法访问）
    return isThumb ? photo.thumbnail_url : photo.media_url;
  };

  // 处理位置选择
  const toggleLocationSelection = (locationId: string) => {
    setSelectedLocationIds(prev => {
      if (prev.includes(locationId)) {
        return prev.filter(id => id !== locationId);
      } else {
        return [...prev, locationId];
      }
    });
  };

  // 处理照片选择
  const togglePhotoSelection = (photoId: string) => {
    setSelectedPhotoIds(prev => {
      if (prev.includes(photoId)) {
        return prev.filter(id => id !== photoId);
      } else {
        return [...prev, photoId];
      }
    });
  };

  // 添加设置封面照片的函数
  const setCoverPhoto = (photoId: string) => {
    setCoverPhotoId(photoId);
  };

  // 验证当前步骤
  const validateCurrentStep = (): boolean => {
    switch (currentStep) {
      case 1:
        if (!title.trim()) {
          setError(language === 'zh' ? '请输入故事标题' : 'Please enter story title');
          return false;
        }
        if (!startDate.trim()) {
          setError(language === 'zh' ? '请选择开始日期' : 'Please select start date');
          return false;
        }
        if (!endDate.trim()) {
          setError(language === 'zh' ? '请选择结束日期' : 'Please select end date');
          return false;
        }
        if (!content.trim()) {
          setError(language === 'zh' ? '请输入故事内容' : 'Please enter story content');
          return false;
        }
        return true;
      
      case 2:
        // 位置选择是可选的
        return true;
      
      case 3:
        // 照片选择是可选的
        return true;
      
      default:
        return true;
    }
  };

  // 处理下一步
  const handleNextStep = () => {
    if (!validateCurrentStep()) return;
    
    setError('');
    if (currentStep < 3) {
      setCurrentStep(currentStep + 1);
    } else {
      handleSubmit();
    }
  };

  // 处理上一步
  const handlePrevStep = () => {
    setError('');
    if (currentStep > 1) {
      setCurrentStep(currentStep - 1);
    }
  };

  // 处理表单提交
  const handleSubmit = async () => {
    try {
      setIsLoading(true);
      setError('');
      
      // 从用户上下文或 localStorage 获取 couple_id
      const coupleId = user?.couple_id || localStorage.getItem('coupleID') || '';
      
      if (!coupleId) {
        setError(language === 'zh' ? '无法获取情侣ID，请重新登录' : 'Cannot get couple ID, please login again');
        setIsLoading(false);
        return;
      }
      
      // 获取封面照片URL
      let coverUrl = '';
      if (coverPhotoId) {
        const coverPhoto = albumPhotos.find(photo => photo.id === coverPhotoId);
        if (coverPhoto) {
          // 使用原始URL，后端会处理签名
          coverUrl = coverPhoto.media_url;
        }
      } else if (selectedPhotoIds.length > 0) {
        // 如果没有指定封面，默认使用第一张选中的照片
        const firstPhoto = albumPhotos.find(photo => photo.id === selectedPhotoIds[0]);
        if (firstPhoto) {
          // 使用原始URL，后端会处理签名
          coverUrl = firstPhoto.media_url;
        }
      }
      
      const eventData: CreateTimelineEventRequest = {
        couple_id: coupleId,
        title,
        start_date: startDate,
        end_date: endDate,
        content,
        cover_url: coverUrl || undefined,
        location_ids: selectedLocationIds.length > 0 
          ? selectedLocationIds
          : undefined,
        photo_video_ids: selectedPhotoIds.length > 0 
          ? selectedPhotoIds
          : undefined
      };
      
      await eventService.createEvent(eventData);
      
      // 成功后重置表单并关闭模态框
      resetForm();
      onSuccess();
      onClose();
    } catch (err: any) {
      // 显示错误信息
      setError(
        err.response?.data?.message || 
        (language === 'zh' ? '创建故事失败，请稍后重试' : 'Failed to create story, please try again later')
      );
    } finally {
      setIsLoading(false);
    }
  };

  // 渲染步骤内容
  const renderStepContent = () => {
    switch (currentStep) {
      case 1:
        return renderStoryDetailsStep();
      case 2:
        return renderLocationSelectionStep();
      case 3:
        return renderPhotoSelectionStep();
      default:
        return null;
    }
  };

  // 第一步：故事详情
  const renderStoryDetailsStep = () => {
    const formGroupStyle = {
      marginBottom: '20px'
    };

    const labelStyle = {
      display: 'block',
      marginBottom: '8px',
      fontSize: '14px',
      fontWeight: '500',
      color: 'var(--text-secondary)'
    };

    const inputStyle = {
      width: '100%',
      padding: '10px 12px',
      border: '1px solid var(--border-primary)',
      borderRadius: '6px',
      fontSize: '14px',
      backgroundColor: 'var(--bg-secondary)',
      color: 'var(--text-primary)',
      transition: 'all 0.2s ease'
    };

    const requiredStyle = {
      color: 'var(--accent-danger)',
      marginLeft: '2px'
    };

    return (
      <div className="step-content">
        <div className="form-group" style={formGroupStyle}>
          <label htmlFor="story-title" style={labelStyle}>
            <T zh="故事标题" en="Story Title" /> <span style={requiredStyle}>*</span>
          </label>
          <input
            id="story-title"
            type="text"
            value={title}
            onChange={(e) => setTitle(e.target.value)}
            placeholder={language === 'zh' ? '输入故事标题' : 'Enter story title'}
            required
            style={inputStyle}
            onFocus={(e) => {
              e.target.style.borderColor = 'var(--border-focus)';
              e.target.style.backgroundColor = 'var(--bg-primary)';
            }}
            onBlur={(e) => {
              e.target.style.borderColor = 'var(--border-primary)';
              e.target.style.backgroundColor = 'var(--bg-secondary)';
            }}
          />
        </div>

        <div className="form-row" style={{ display: 'flex', gap: '16px' }}>
          <div className="form-group" style={{ ...formGroupStyle, flex: 1 }}>
            <label htmlFor="start-date" style={labelStyle}>
              <T zh="开始日期" en="Start Date" /> <span style={requiredStyle}>*</span>
            </label>
            <input
              id="start-date"
              type="date"
              value={startDate}
              onChange={(e) => setStartDate(e.target.value)}
              required
              style={inputStyle}
              onFocus={(e) => {
                e.target.style.borderColor = 'var(--border-focus)';
                e.target.style.backgroundColor = 'var(--bg-primary)';
              }}
              onBlur={(e) => {
                e.target.style.borderColor = 'var(--border-primary)';
                e.target.style.backgroundColor = 'var(--bg-secondary)';
              }}
            />
          </div>

          <div className="form-group" style={{ ...formGroupStyle, flex: 1 }}>
            <label htmlFor="end-date" style={labelStyle}>
              <T zh="结束日期" en="End Date" /> <span style={requiredStyle}>*</span>
            </label>
            <input
              id="end-date"
              type="date"
              value={endDate}
              onChange={(e) => setEndDate(e.target.value)}
              required
              style={inputStyle}
              onFocus={(e) => {
                e.target.style.borderColor = 'var(--border-focus)';
                e.target.style.backgroundColor = 'var(--bg-primary)';
              }}
              onBlur={(e) => {
                e.target.style.borderColor = 'var(--border-primary)';
                e.target.style.backgroundColor = 'var(--bg-secondary)';
              }}
            />
          </div>
        </div>

        <div className="form-group" style={formGroupStyle}>
          <label htmlFor="story-content" style={labelStyle}>
            <T zh="故事内容" en="Story Content" /> <span style={requiredStyle}>*</span>
          </label>
          <textarea
            id="story-content"
            value={content}
            onChange={(e) => setContent(e.target.value)}
            placeholder={language === 'zh' ? '输入故事内容...' : 'Enter story content...'}
            rows={6}
            required
            style={{
              ...inputStyle,
              resize: 'vertical',
              minHeight: '120px'
            }}
            onFocus={(e) => {
              e.target.style.borderColor = 'var(--border-focus)';
              e.target.style.backgroundColor = 'var(--bg-primary)';
            }}
            onBlur={(e) => {
              e.target.style.borderColor = 'var(--border-primary)';
              e.target.style.backgroundColor = 'var(--bg-secondary)';
            }}
          />
        </div>
      </div>
    );
  };

  // 第二步：地点选择
  const renderLocationSelectionStep = () => {
    const subtitleStyle = {
      fontSize: '16px',
      fontWeight: '600',
      color: 'var(--text-primary)',
      marginBottom: '20px',
      textAlign: 'center' as const
    };

    const loadingStyle = {
      display: 'flex',
      flexDirection: 'column' as const,
      alignItems: 'center',
      justifyContent: 'center',
      padding: '40px 20px',
      color: 'var(--text-secondary)'
    };

    const emptyStateStyle = {
      display: 'flex',
      flexDirection: 'column' as const,
      alignItems: 'center',
      justifyContent: 'center',
      padding: '40px 20px',
      color: 'var(--text-tertiary)'
    };

    return (
      <div className="step-content">
        <h3 style={subtitleStyle}>
          <T zh="选择故事发生的地点" en="Select Locations Where Your Story Happened" />
        </h3>

        {locationsLoading ? (
          <div style={loadingStyle}>
            <i className="fas fa-spinner fa-spin" style={{ fontSize: '24px', marginBottom: '12px' }}></i>
            <p><T zh="加载地点列表中..." en="Loading locations..." /></p>
          </div>
        ) : !locations || locations.length === 0 ? (
          <div style={emptyStateStyle}>
            <i className="fas fa-map-marker-alt" style={{ fontSize: '48px', marginBottom: '16px' }}></i>
            <p><T zh="暂无保存的地点" en="No saved locations yet" /></p>
          </div>
        ) : (
          <div style={{
            display: 'grid',
            gridTemplateColumns: 'repeat(auto-fill, minmax(200px, 1fr))',
            gap: '16px',
            marginTop: '20px'
          }}>
            {locations.map(location => {
              const isSelected = selectedLocationIds.includes(location.id);
              return (
                <div
                  key={location.id}
                  onClick={() => toggleLocationSelection(location.id)}
                  style={{
                    border: `1px solid ${isSelected ? 'var(--accent-primary)' : 'var(--border-primary)'}`,
                    borderRadius: '8px',
                    padding: '16px',
                    display: 'flex',
                    flexDirection: 'column',
                    cursor: 'pointer',
                    transition: 'all 0.2s ease',
                    position: 'relative',
                    backgroundColor: isSelected ? 'var(--bg-tertiary)' : 'var(--bg-secondary)'
                  }}
                  onMouseEnter={(e) => {
                    if (!isSelected) {
                      e.currentTarget.style.borderColor = 'var(--accent-primary)';
                      e.currentTarget.style.backgroundColor = 'var(--bg-tertiary)';
                    }
                  }}
                  onMouseLeave={(e) => {
                    if (!isSelected) {
                      e.currentTarget.style.borderColor = 'var(--border-primary)';
                      e.currentTarget.style.backgroundColor = 'var(--bg-secondary)';
                    }
                  }}
                >
                  <div style={{
                    fontSize: '24px',
                    color: 'var(--accent-primary)',
                    marginBottom: '12px'
                  }}>
                    <i className="fas fa-map-marker-alt"></i>
                  </div>
                  <div>
                    <h4 style={{
                      margin: '0 0 8px',
                      fontSize: '16px',
                      color: 'var(--text-primary)'
                    }}>
                      {location.name}
                    </h4>
                    {location.description && (
                      <p style={{
                        margin: 0,
                        fontSize: '14px',
                        color: 'var(--text-secondary)',
                        lineHeight: '1.4'
                      }}>
                        {location.description}
                      </p>
                    )}
                  </div>
                  {isSelected && (
                    <div style={{
                      position: 'absolute',
                      top: '8px',
                      right: '8px',
                      width: '20px',
                      height: '20px',
                      borderRadius: '50%',
                      backgroundColor: 'var(--accent-primary)',
                      color: 'var(--text-inverse)',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      fontSize: '12px'
                    }}>
                      <i className="fas fa-check"></i>
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        )}
      </div>
    );
  };

  // 第三步：照片选择
  const renderPhotoSelectionStep = () => {
    const subtitleStyle = {
      fontSize: '16px',
      fontWeight: '600',
      color: 'var(--text-primary)',
      marginBottom: '20px',
      textAlign: 'center' as const
    };

    const loadingStyle = {
      display: 'flex',
      flexDirection: 'column' as const,
      alignItems: 'center',
      justifyContent: 'center',
      padding: '40px 20px',
      color: 'var(--text-secondary)'
    };

    const emptyStateStyle = {
      display: 'flex',
      flexDirection: 'column' as const,
      alignItems: 'center',
      justifyContent: 'center',
      padding: '40px 20px',
      color: 'var(--text-tertiary)'
    };

    const formGroupStyle = {
      marginBottom: '20px'
    };

    const labelStyle = {
      display: 'block',
      marginBottom: '8px',
      fontSize: '14px',
      fontWeight: '500',
      color: 'var(--text-secondary)'
    };

    const selectStyle = {
      width: '100%',
      padding: '10px 12px',
      border: '1px solid var(--border-primary)',
      borderRadius: '6px',
      fontSize: '14px',
      backgroundColor: 'var(--bg-secondary)',
      color: 'var(--text-primary)',
      transition: 'all 0.2s ease'
    };

    return (
      <div className="step-content">
        <h3 style={subtitleStyle}>
          <T zh="选择故事相关的照片" en="Select Photos Related to Your Story" />
        </h3>

        {albumsLoading ? (
          <div style={loadingStyle}>
            <i className="fas fa-spinner fa-spin" style={{ fontSize: '24px', marginBottom: '12px' }}></i>
            <p><T zh="加载相册列表中..." en="Loading albums..." /></p>
          </div>
        ) : albums.length === 0 ? (
          <div style={emptyStateStyle}>
            <i className="fas fa-images" style={{ fontSize: '48px', marginBottom: '16px' }}></i>
            <p><T zh="暂无相册" en="No albums yet" /></p>
          </div>
        ) : (
          <>
            <div style={formGroupStyle}>
              <label htmlFor="album-select" style={labelStyle}>
                <T zh="选择相册" en="Select Album" />
              </label>
              <select
                id="album-select"
                value={selectedAlbumId}
                onChange={(e) => setSelectedAlbumId(e.target.value)}
                style={selectStyle}
                onFocus={(e) => {
                  e.target.style.borderColor = 'var(--border-focus)';
                  e.target.style.backgroundColor = 'var(--bg-primary)';
                }}
                onBlur={(e) => {
                  e.target.style.borderColor = 'var(--border-primary)';
                  e.target.style.backgroundColor = 'var(--bg-secondary)';
                }}
              >
                <option value="">
                  {language === 'zh' ? '-- 请选择相册 --' : '-- Select an album --'}
                </option>
                {albums.map(album => (
                  <option key={album.id} value={album.id}>
                    {album.title} ({album.count || 0})
                  </option>
                ))}
              </select>
            </div>
            
            {selectedAlbumId && (
              albumPhotosLoading ? (
                <div style={loadingStyle}>
                  <i className="fas fa-spinner fa-spin" style={{ fontSize: '24px', marginBottom: '12px' }}></i>
                  <p><T zh="加载照片中..." en="Loading photos..." /></p>
                </div>
              ) : albumPhotos.length === 0 ? (
                <div style={emptyStateStyle}>
                  <i className="fas fa-image" style={{ fontSize: '48px', marginBottom: '16px' }}></i>
                  <p><T zh="该相册暂无照片" en="No photos in this album" /></p>
                </div>
              ) : (
                <>
                  {/* 添加选择封面照片的提示 */}
                  {selectedPhotoIds.length > 0 && (
                    <div style={{
                      backgroundColor: 'var(--bg-secondary)',
                      border: '1px solid var(--border-primary)',
                      borderRadius: '6px',
                      padding: '12px',
                      marginBottom: '16px'
                    }}>
                      <p style={{
                        margin: 0,
                        fontSize: '14px',
                        color: 'var(--text-secondary)',
                        display: 'flex',
                        alignItems: 'center',
                        gap: '8px'
                      }}>
                        <i className="fas fa-info-circle" style={{ color: 'var(--accent-primary)' }}></i>
                        <T
                          zh="请从已选照片中选择一张作为故事封面（点击照片右上角的星标）"
                          en="Please select one photo as story cover (click the star icon on the top-right of the photo)"
                        />
                      </p>
                    </div>
                  )}
                  
                  <div style={{
                    display: 'grid',
                    gridTemplateColumns: 'repeat(auto-fill, minmax(120px, 1fr))',
                    gap: '12px',
                    marginTop: '16px'
                  }}>
                    {albumPhotos.map(photo => {
                      const isSelected = selectedPhotoIds.includes(photo.id);
                      const isCover = coverPhotoId === photo.id;

                      return (
                        <div
                          key={photo.id}
                          onClick={() => togglePhotoSelection(photo.id)}
                          style={{
                            position: 'relative',
                            aspectRatio: '1',
                            borderRadius: '8px',
                            overflow: 'hidden',
                            cursor: 'pointer',
                            border: `2px solid ${
                              isCover ? 'var(--accent-warning)' :
                              isSelected ? 'var(--accent-primary)' :
                              'var(--border-primary)'
                            }`,
                            transition: 'all 0.2s ease',
                            backgroundColor: 'var(--bg-secondary)'
                          }}
                          onMouseEnter={(e) => {
                            if (!isSelected) {
                              e.currentTarget.style.borderColor = 'var(--accent-primary)';
                            }
                          }}
                          onMouseLeave={(e) => {
                            if (!isSelected && !isCover) {
                              e.currentTarget.style.borderColor = 'var(--border-primary)';
                            }
                          }}
                        >
                          <div style={{
                            width: '100%',
                            height: '100%',
                            position: 'relative'
                          }}>
                            <img
                              src={getPhotoUrl(photo)}
                              alt={photo.title || 'Photo'}
                              style={{
                                width: '100%',
                                height: '100%',
                                objectFit: 'cover'
                              }}
                            />
                          </div>

                          {/* 选中指示器 */}
                          {isSelected && (
                            <div style={{
                              position: 'absolute',
                              top: '4px',
                              left: '4px',
                              width: '20px',
                              height: '20px',
                              borderRadius: '50%',
                              backgroundColor: 'var(--accent-primary)',
                              color: 'var(--text-inverse)',
                              display: 'flex',
                              alignItems: 'center',
                              justifyContent: 'center',
                              fontSize: '12px'
                            }}>
                              <i className="fas fa-check"></i>
                            </div>
                          )}

                          {/* 封面标记按钮 */}
                          {isSelected && (
                            <div
                              onClick={(e) => {
                                e.stopPropagation(); // 阻止事件冒泡
                                setCoverPhoto(photo.id);
                              }}
                              title={language === 'zh' ? '设为封面' : 'Set as cover'}
                              style={{
                                position: 'absolute',
                                top: '4px',
                                right: '4px',
                                width: '24px',
                                height: '24px',
                                borderRadius: '50%',
                                backgroundColor: isCover ? 'var(--accent-warning)' : 'var(--bg-overlay)',
                                color: isCover ? 'var(--text-inverse)' : 'var(--text-tertiary)',
                                display: 'flex',
                                alignItems: 'center',
                                justifyContent: 'center',
                                fontSize: '12px',
                                cursor: 'pointer',
                                transition: 'all 0.2s ease'
                              }}
                              onMouseEnter={(e) => {
                                if (!isCover) {
                                  e.currentTarget.style.backgroundColor = 'var(--accent-warning)';
                                  e.currentTarget.style.color = 'var(--text-inverse)';
                                }
                              }}
                              onMouseLeave={(e) => {
                                if (!isCover) {
                                  e.currentTarget.style.backgroundColor = 'var(--bg-overlay)';
                                  e.currentTarget.style.color = 'var(--text-tertiary)';
                                }
                              }}
                            >
                              <i className="fas fa-star"></i>
                            </div>
                          )}
                        </div>
                      );
                    })}
                  </div>
                  
                  {/* 显示已选封面预览 */}
                  {coverPhotoId && (
                    <div style={{
                      marginTop: '24px',
                      padding: '16px',
                      backgroundColor: 'var(--bg-secondary)',
                      border: '1px solid var(--border-primary)',
                      borderRadius: '8px'
                    }}>
                      <h4 style={{
                        margin: '0 0 12px',
                        fontSize: '14px',
                        fontWeight: '600',
                        color: 'var(--text-primary)'
                      }}>
                        <T zh="已选封面" en="Selected Cover" />
                      </h4>
                      <div style={{
                        border: '1px solid var(--border-primary)',
                        borderRadius: '6px',
                        overflow: 'hidden',
                        maxHeight: '150px',
                        display: 'flex',
                        justifyContent: 'center',
                        backgroundColor: 'var(--bg-primary)'
                      }}>
                        {albumPhotos.map(photo => {
                          if (photo.id === coverPhotoId) {
                            return (
                              <img
                                key={photo.id}
                                src={getPhotoUrl(photo, false)}
                                alt={photo.title || 'Cover'}
                                style={{
                                  maxWidth: '100%',
                                  height: 'auto',
                                  objectFit: 'cover'
                                }}
                              />
                            );
                          }
                          return null;
                        })}
                      </div>
                    </div>
                  )}
                </>
              )
            )}
          </>
        )}
      </div>
    );
  };

  return (
    <div className="modal-overlay" style={{ backgroundColor: 'rgba(0, 0, 0, 0.7)' }}>
      <div className="modal-container wide-modal" style={{
        backgroundColor: 'var(--bg-card)',
        border: '1px solid var(--border-primary)',
        boxShadow: 'var(--shadow-xl)'
      }}>
        <div className="modal-header" style={{ borderBottomColor: 'var(--border-primary)' }}>
          <h2 style={{ color: 'var(--text-primary)' }}><T zh="创建回忆" en="Create New Story" /></h2>
          <button className="close-button" onClick={onClose} style={{ color: 'var(--text-tertiary)' }}
                  onMouseEnter={(e) => e.currentTarget.style.color = 'var(--text-primary)'}
                  onMouseLeave={(e) => e.currentTarget.style.color = 'var(--text-tertiary)'}>
            <i className="fas fa-times"></i>
          </button>
        </div>
        
        <StepIndicator currentStep={currentStep} />
        
        <div className="modal-body" style={{ backgroundColor: 'var(--bg-card)' }}>
          {error && (
            <div className="error-message" style={{
              color: 'var(--accent-danger)',
              backgroundColor: 'var(--bg-secondary)',
              border: '1px solid var(--accent-danger)',
              borderRadius: '6px',
              padding: '12px',
              marginBottom: '16px'
            }}>
              {error}
            </div>
          )}
          {renderStepContent()}
        </div>

        <div className="modal-footer" style={{
          borderTopColor: 'var(--border-primary)',
          backgroundColor: 'var(--bg-card)'
        }}>
          {currentStep > 1 && (
            <button
              type="button"
              className="btn btn-secondary"
              onClick={handlePrevStep}
              disabled={isLoading}
              style={{
                backgroundColor: 'var(--bg-secondary)',
                color: 'var(--text-secondary)',
                border: '1px solid var(--border-primary)',
                padding: '8px 16px',
                borderRadius: '6px',
                fontSize: '14px',
                fontWeight: '500',
                cursor: 'pointer',
                transition: 'all 0.2s ease'
              }}
              onMouseEnter={(e) => {
                if (!isLoading) {
                  e.currentTarget.style.backgroundColor = 'var(--bg-tertiary)';
                }
              }}
              onMouseLeave={(e) => {
                e.currentTarget.style.backgroundColor = 'var(--bg-secondary)';
              }}
            >
              <T zh="上一步" en="Previous" />
            </button>
          )}

          <button
            type="button"
            className="btn btn-secondary"
            onClick={onClose}
            disabled={isLoading}
            style={{
              backgroundColor: 'var(--bg-secondary)',
              color: 'var(--text-secondary)',
              border: '1px solid var(--border-primary)',
              padding: '8px 16px',
              borderRadius: '6px',
              fontSize: '14px',
              fontWeight: '500',
              cursor: 'pointer',
              transition: 'all 0.2s ease'
            }}
            onMouseEnter={(e) => {
              if (!isLoading) {
                e.currentTarget.style.backgroundColor = 'var(--bg-tertiary)';
              }
            }}
            onMouseLeave={(e) => {
              e.currentTarget.style.backgroundColor = 'var(--bg-secondary)';
            }}
          >
            <T zh="取消" en="Cancel" />
          </button>

          <button
            type="button"
            className="btn btn-primary"
            onClick={handleNextStep}
            disabled={isLoading}
            style={{
              backgroundColor: 'var(--accent-primary)',
              color: 'var(--text-inverse)',
              border: 'none',
              padding: '8px 16px',
              borderRadius: '6px',
              fontSize: '14px',
              fontWeight: '500',
              cursor: 'pointer',
              transition: 'all 0.2s ease',
              opacity: isLoading ? '0.7' : '1'
            }}
            onMouseEnter={(e) => {
              if (!isLoading) {
                e.currentTarget.style.filter = 'brightness(1.1)';
              }
            }}
            onMouseLeave={(e) => {
              e.currentTarget.style.filter = 'brightness(1)';
            }}
          >
            {isLoading ? (
              <span><i className="fas fa-spinner fa-spin"></i> <T zh="处理中..." en="Processing..." /></span>
            ) : currentStep < 3 ? (
              <T zh="下一步" en="Next" />
            ) : (
              <T zh="创建故事" en="Create Story" />
            )}
          </button>
        </div>
      </div>
    </div>
  );
} 