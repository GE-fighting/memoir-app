'use client';

import React, { useState, useEffect, useRef, useCallback } from 'react';
import { useRouter } from 'next/navigation';
import { T, useLanguage } from './LanguageContext';
import CreateAlbumModal from './CreateAlbumModal';
import UploadPhotosModal from './UploadPhotosModal';
import EditAlbumModal from './EditAlbumModal';
import { albumService, Album, DeleteCoupleAlbumPhotosRequest } from '@/services/album-service';
import { getCoupleSignedUrl } from '@/lib/services/coupleOssService';
import ImageViewer from './ImageViewer';
import defaultCovers, { fallbackCovers } from '@/utils/default-covers';
import { useConfirmationDialog } from '@/components/ui/confirmation-dialog';
import '@/styles/modal.css';
import '@/styles/albums.css';
import '@/styles/upload.css';

interface Photo {
  id: string;
  title?: string;
  media_url: string;
  thumbnail_url?: string;
  description?: string;
  media_type: 'photo' | 'video';
  created_at: string;
  url?: string; // 签名后的访问URL
}

export default function Albums() {
  const { language } = useLanguage();
  const router = useRouter();
  const [isCreateModalOpen, setIsCreateModalOpen] = useState(false);
  const [isUploadModalOpen, setIsUploadModalOpen] = useState(false);
  const [isEditModalOpen, setIsEditModalOpen] = useState(false);
  const [isAlbumDetailOpen, setIsAlbumDetailOpen] = useState(false);
  const [albums, setAlbums] = useState<Album[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState('');
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedAlbum, setSelectedAlbum] = useState<{id: string, title: string} | null>(null);
  const [currentAlbum, setCurrentAlbum] = useState<Album | null>(null);
  const [albumToEdit, setAlbumToEdit] = useState<Album | null>(null);
  const [albumPhotos, setAlbumPhotos] = useState<Photo[]>([]);
  const [loadingPhotos, setLoadingPhotos] = useState(false);
  const [currentMedia, setCurrentMedia] = useState<Photo | null>(null);
  const [isMediaViewerOpen, setIsMediaViewerOpen] = useState(false);
  const videoRef = useRef<HTMLVideoElement>(null);
  const [albumsLoaded, setAlbumsLoaded] = useState(false);
  // 批量删除相关状态
  const [isSelectionMode, setIsSelectionMode] = useState(false);
  const [selectedPhotos, setSelectedPhotos] = useState<string[]>([]);
  const [isDeleting, setIsDeleting] = useState(false);
  const [isDeletingAlbum, setIsDeletingAlbum] = useState<string | null>(null);
  // 预加载缓存和防抖相关
  const preloadCache = useRef<Set<string>>(new Set());
  const preloadTimer = useRef<NodeJS.Timeout | null>(null);
  const preloadQueue = useRef<string[]>([]);
  
  // 使用确认对话框
  const { openDialog, ConfirmationDialogComponent } = useConfirmationDialog();
  
  // 默认封面图片集合，当相册没有封面时随机选择一个
  const defaultCoversArray = defaultCovers;
  
  // 获取默认封面图片
  const getDefaultCover = (albumId: string) => {
    // 使用相册ID作为种子，确保同一个相册总是获得相同的默认封面
    const index = parseInt(albumId.substring(albumId.length - 2), 16) % defaultCoversArray.length;
    return defaultCoversArray[index];
  };
  
  // 处理图片加载失败的情况
  const handleImageError = (e: React.SyntheticEvent<HTMLImageElement, Event>, fallbackUrl: string) => {
    // 如果图片加载失败，尝试使用备用图片
    const img = e.target as HTMLImageElement;
    if (img.src !== fallbackUrl) {
      img.src = fallbackUrl;
    }
  };
  
  // 加载相册列表
  const loadAlbums = async (forceReload = false) => {
    // 如果已经加载过相册且不是强制重新加载，不再重复加载
    if (albumsLoaded && !forceReload) return;
    
    try {
      setIsLoading(true);
      setError('');
      const data = await albumService.getAlbums();
      console.log('Albums data from API:', data); // 添加调试日志
      setAlbums(data);
      setAlbumsLoaded(true);
    } catch (err: unknown) {
      console.error('Failed to load albums:', err);
      setError(
        language === 'zh' 
          ? '加载相册失败，请刷新页面重试' 
          : 'Failed to load albums, please refresh and try again'
      );
    } finally {
      setIsLoading(false);
    }
  };
  
  // 组件挂载时加载相册列表
  useEffect(() => {
    loadAlbums();
    
    // 返回清理函数
    return () => {
      // 组件卸载时清除预加载定时器
      if (preloadTimer.current) {
        clearTimeout(preloadTimer.current);
        preloadTimer.current = null;
      }
    };
  }, []);
  
  // 打开创建相册模态框
  const handleOpenCreateModal = () => {
    setIsCreateModalOpen(true);
  };
  
  // 关闭创建相册模态框
  const handleCloseCreateModal = () => {
    setIsCreateModalOpen(false);
  };
  
  // 打开编辑相册模态框
  const handleOpenEditModal = (album: Album, e: React.MouseEvent) => {
    e.stopPropagation(); // 阻止事件冒泡
    setAlbumToEdit(album);
    setIsEditModalOpen(true);
  };
  
  // 关闭编辑相册模态框
  const handleCloseEditModal = () => {
    setIsEditModalOpen(false);
    setAlbumToEdit(null);
  };
  
  // 编辑相册成功后的回调
  const handleAlbumUpdated = async (updatedAlbum: Album) => {
    // 重新加载相册列表以确保数据是最新的
    try {
      await loadAlbums(true); // 强制刷新相册列表
    } catch (err) {
      console.error('Failed to reload albums after update:', err);
      // 如果重新加载失败，仍然更新本地状态
      setAlbums(prevAlbums => 
        prevAlbums.map(album => 
          album.id === updatedAlbum.id ? updatedAlbum : album
        )
      );
    }
    
    // 如果当前打开的是被编辑的相册，更新当前相册信息
    if (currentAlbum && currentAlbum.id === updatedAlbum.id) {
      setCurrentAlbum(updatedAlbum);
    }
  };
  
  // 创建相册成功后的回调
  const handleAlbumCreated = () => {
    // 重新加载相册列表（强制刷新）
    loadAlbums(true);
  };
  
  // 处理上传照片按钮点击
  const handleUploadPhotos = (albumId: string, albumTitle: string, e: React.MouseEvent) => {
    e.stopPropagation(); // 阻止事件冒泡
    setSelectedAlbum({ id: albumId, title: albumTitle });
    setIsUploadModalOpen(true);
  };
  
  // 关闭上传照片模态框
  const handleCloseUploadModal = () => {
    setIsUploadModalOpen(false);
    setSelectedAlbum(null);
  };
  
  // 加载相册照片
  const loadAlbumPhotos = useCallback(async (albumId: string) => {
    // 避免重复加载同一个相册
    if (currentAlbum && currentAlbum.id === albumId && albumPhotos.length > 0) {
      return;
    }
    
    try {
      setLoadingPhotos(true);
      const albumWithPhotos = await albumService.getAlbumWithPhotos(albumId);
      
      // 如果当前相册不是我们要加载的相册，更新状态
      if (!currentAlbum || currentAlbum.id !== albumId) {
        setCurrentAlbum(albumWithPhotos);
      }
      
      // 处理照片URL，为每张照片生成签名URL
      if (albumWithPhotos.photos_videos && albumWithPhotos.photos_videos.length > 0) {
        // 分批处理照片签名，避免阻塞UI
        const batchSize = 10; // 每批处理10张照片
        const photos = albumWithPhotos.photos_videos;
        let processedPhotos: any[] = [];
        
        // 分批处理函数
        const processBatch = async (startIndex: number) => {
          const endIndex = Math.min(startIndex + batchSize, photos.length);
          const batch = photos.slice(startIndex, endIndex);
          
          // 处理当前批次
          const batchResults = await Promise.all(
            batch.map(async (photo) => {
              try {
                // 使用情侣相册专用的签名URL方法
                let signedUrl = '';
                if (photo.media_url) {
                  signedUrl = await getCoupleSignedUrl(photo.media_url);
                }
                
                // 获取缩略图URL的签名链接（如果存在）
                let thumbnailSignedUrl = '';
                if (photo.thumbnail_url) {
                  thumbnailSignedUrl = await getCoupleSignedUrl(photo.thumbnail_url);
                }
                
                return {
                  ...photo,
                  url: signedUrl, // 添加签名后的URL
                  thumbnail_url: thumbnailSignedUrl || '' // 使用签名后的缩略图URL
                };
              } catch (err) {
                console.error('处理照片URL失败:', err);
                return {
                  ...photo,
                  url: '', // 失败时使用空URL
                  thumbnail_url: ''
                };
              }
            })
          );
          
          // 过滤掉URL为空的项并更新状态
          const validPhotos = batchResults.filter(photo => photo.url || photo.thumbnail_url);
          processedPhotos = [...processedPhotos, ...validPhotos];
          setAlbumPhotos([...processedPhotos]);
          
          // 如果还有更多批次，继续处理
          if (endIndex < photos.length) {
            // 使用 requestAnimationFrame 让浏览器有机会更新UI
            requestAnimationFrame(async () => {
              await processBatch(endIndex);
            });
          }
        };
        
        // 开始处理第一批次
        await processBatch(0);
      } else {
        setAlbumPhotos([]);
      }
    } catch (err) {
      console.error('Failed to load album photos:', err);
      alert(language === 'zh' ? '加载相册照片失败' : 'Failed to load album photos');
      // 出错时关闭模态框
      setIsAlbumDetailOpen(false);
      setCurrentAlbum(null);
    } finally {
      setLoadingPhotos(false);
    }
  }, [currentAlbum, albumPhotos.length, language, getCoupleSignedUrl]);
  
  // 上传照片成功后的回调
  const handlePhotosUploaded = useCallback(() => {
    // 关闭上传模态框
    setIsUploadModalOpen(false);
    
    // 如果当前正在查看该相册，则刷新相册数据
    if (currentAlbum && selectedAlbum && currentAlbum.id === selectedAlbum.id) {
      loadAlbumPhotos(currentAlbum.id);
    }
    
    // 重新加载所有相册列表，以更新照片数量
    const refreshAlbums = async () => {
      try {
        const updatedAlbums = await albumService.getAlbums();
        setAlbums(updatedAlbums);
      } catch (err) {
        console.error('刷新相册列表失败:', err);
      }
    };
    
    refreshAlbums();
  }, [currentAlbum, selectedAlbum, loadAlbumPhotos]);
  
  // 处理编辑相册按钮点击
  const handleEditAlbum = async (album: Album, e: React.MouseEvent) => {
    e.stopPropagation(); // 阻止事件冒泡
    
    try {
      // 调用接口获取最新的相册详情
      const albumDetails = await albumService.getAlbum(album.id);
      setAlbumToEdit(albumDetails);
      setIsEditModalOpen(true);
    } catch (err) {
      console.error('Failed to fetch album details:', err);
      // 即使获取详情失败，也使用传入的相册信息
      setAlbumToEdit(album);
      setIsEditModalOpen(true);
    }
  };
  
  // 处理删除相册按钮点击
  const handleDeleteAlbum = async (albumId: string, albumTitle: string, e: React.MouseEvent) => {
    e.stopPropagation(); // 阻止事件冒泡
    
    // 使用自定义确认对话框
    openDialog({
      title: language === 'zh' ? '删除相册' : 'Delete Album',
      message: language === 'zh' 
        ? `确定要删除相册 "${albumTitle}" 吗？此操作不可撤销。` 
        : `Are you sure you want to delete the album "${albumTitle}"? This action cannot be undone.`,
      confirmText: language === 'zh' ? '删除' : 'Delete',
      cancelText: language === 'zh' ? '取消' : 'Cancel',
      onConfirm: async () => {
        try {
          // 设置正在删除的相册ID
          setIsDeletingAlbum(albumId);
          
          // 调用删除API
          await albumService.deleteAlbum(albumId);
          
          // 从相册列表中移除已删除的相册
          setAlbums(prevAlbums => prevAlbums.filter(album => album.id !== albumId));
          
          // 如果当前打开的是被删除的相册，关闭详情页
          if (currentAlbum && currentAlbum.id === albumId) {
            setIsAlbumDetailOpen(false);
            setCurrentAlbum(null);
            setAlbumPhotos([]);
          }
          
          // 显示成功消息
          // TODO: 使用通知组件显示成功消息
        } catch (err) {
          console.error('Failed to delete album:', err);
          // TODO: 使用通知组件显示错误消息
        } finally {
          // 清除正在删除状态
          setIsDeletingAlbum(null);
        }
      }
    });
  };
  
  // 处理相册点击
  const handleAlbumClick = useCallback((album: Album) => {
    // 立即打开模态框并显示加载状态
    setCurrentAlbum(album);
    setIsAlbumDetailOpen(true);
    setAlbumPhotos([]); // 清空之前的照片数据
    
    // 异步加载相册照片
    loadAlbumPhotos(album.id);
  }, [loadAlbumPhotos]);
  
  // 关闭相册详情
  const handleCloseAlbumDetail = () => {
    setIsAlbumDetailOpen(false);
    setCurrentAlbum(null);
    setAlbumPhotos([]);
  };
  
  // 处理媒体点击
  const handleMediaClick = (media: Photo) => {
    setCurrentMedia(media);
    setIsMediaViewerOpen(true);
    
    // 如果是视频，设置一个短暂的延迟后自动播放
    if (media.media_type === 'video') {
      setTimeout(() => {
        if (videoRef.current) {
          videoRef.current.play().catch(err => {
            console.error('自动播放视频失败:', err);
          });
        }
      }, 100);
    }
  };
  
  // 关闭媒体查看器
  const handleCloseMediaViewer = () => {
    if (currentMedia?.media_type === 'video' && videoRef.current) {
      videoRef.current.pause();
    }
    setIsMediaViewerOpen(false);
    setCurrentMedia(null);
  };
  
  // 批量删除相关函数
  // 切换选择模式
  const toggleSelectionMode = () => {
    setIsSelectionMode(!isSelectionMode);
    // 退出选择模式时清空选中的照片
    if (isSelectionMode) {
      setSelectedPhotos([]);
    }
  };
  
  // 处理照片选择/取消选择
  const handleSelectPhoto = (e: React.MouseEvent | null, photoId: string) => {
    if (e) {
      e.stopPropagation(); // 阻止事件冒泡，避免触发照片点击事件
    }
    
    setSelectedPhotos(prev => {
      // 如果已经选中，则取消选择
      if (prev.includes(photoId)) {
        return prev.filter(id => id !== photoId);
      } 
      // 否则添加到选中列表
      return [...prev, photoId];
    });
  };
  
  // 全选照片
  const selectAll = () => {
    const allPhotoIds = albumPhotos.map(photo => photo.id);
    setSelectedPhotos(allPhotoIds);
  };
  
  // 取消全选
  const deselectAll = () => {
    setSelectedPhotos([]);
  };
  
  // 处理批量删除
  const handleBulkDelete = async () => {
    if (selectedPhotos.length === 0 || !currentAlbum) return;
    
    // 使用自定义确认对话框
    openDialog({
      title: language === 'zh' ? '删除照片' : 'Delete Photos',
      message: language === 'zh' 
        ? `确定要删除选中的 ${selectedPhotos.length} 张照片吗？此操作不可撤销。` 
        : `Are you sure you want to delete ${selectedPhotos.length} selected photos? This action cannot be undone.`,
      confirmText: language === 'zh' ? '删除' : 'Delete',
      cancelText: language === 'zh' ? '取消' : 'Cancel',
      onConfirm: async () => {
        try {
          setIsDeleting(true);
          
          // 调用删除API
          const deleteParams: DeleteCoupleAlbumPhotosRequest = {
            album_id: currentAlbum.id,
            photo_video_ids: selectedPhotos
          };
          
          await albumService.deleteCoupleAlbumPhotos(deleteParams);
          
          // 更新UI状态
          // 从相册照片列表中移除已删除的照片
          setAlbumPhotos(prev => prev.filter(photo => !selectedPhotos.includes(photo.id)));
          
          // 清空选中的照片
          setSelectedPhotos([]);
          
          // 可选：退出选择模式
          setIsSelectionMode(false);
          
          // TODO: 使用通知组件显示成功消息
        } catch (err) {
          console.error('Failed to delete photos:', err);
          // TODO: 使用通知组件显示错误消息
        } finally {
          setIsDeleting(false);
        }
      }
    });
  };
  
  // 筛选相册
  const filteredAlbums = albums.filter(album => 
    album.title.toLowerCase().includes(searchTerm.toLowerCase())
  );
  
  // 格式化日期
  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    const year = date.getFullYear();
    const month = date.getMonth() + 1;
    
    if (language === 'zh') {
      return `${year}年${month}月`;
    } else {
      const monthNames = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];
      return `${monthNames[date.getMonth()]} ${year}`;
    }
  };
  
  return (
    <>
      <div className="timeline-header">
        <div className="search-filter-group">
          <div className="search-box">
            <i className="fas fa-search"></i>
            <input
              type="text"
              placeholder={language === 'zh' ? '搜索相册...' : 'Search albums...'}
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
            />
          </div>
        </div>
        <div className="header-actions">
          <button
            className="btn btn-secondary"
            onClick={() => router.push('/gallery')}
            title={language === 'zh' ? '切换到照片墙视图' : 'Switch to Gallery View'}
          >
            <i className="fas fa-th"></i>
            <T zh="照片墙" en="Gallery" />
          </button>
          <button className="btn btn-primary" onClick={handleOpenCreateModal}>
            <i className="fas fa-plus"></i>
            <T zh="新建相册" en="New Album" />
          </button>
        </div>
      </div>

      {isLoading ? (
        <div className="loading-container">
          <i className="fas fa-spinner fa-spin"></i>
          <p><T zh="加载中..." en="Loading..." /></p>
        </div>
      ) : error ? (
        <div className="error-container">
          <i className="fas fa-exclamation-circle"></i>
          <p>{error}</p>
        </div>
      ) : filteredAlbums.length === 0 ? (
        <div className="empty-container">
          <i className="fas fa-photo-video"></i>
          <p>
            {searchTerm ? (
              <T zh="没有找到匹配的相册" en="No matching albums found" />
            ) : (
              <T zh={'还没有创建相册，点击"新建相册"按钮开始创建'} en="No albums yet, click the 'New Album' button to get started" />
            )}
          </p>
        </div>
      ) : (
        <div className="albums-grid">
          {filteredAlbums.map(album => (
            <div 
              className="album-card" 
              key={album.id} 
              onClick={() => handleAlbumClick(album)}
              onMouseEnter={() => {
                // 预加载相册数据，添加防抖和缓存机制
                const albumId = album.id;
                
                // 如果已经预加载过，直接跳过
                if (preloadCache.current.has(albumId)) {
                  return;
                }
                
                // 将相册ID添加到预加载队列
                if (!preloadQueue.current.includes(albumId)) {
                  preloadQueue.current.push(albumId);
                }
                
                // 清除之前的定时器
                if (preloadTimer.current) {
                  clearTimeout(preloadTimer.current);
                }
                
                // 设置新的防抖定时器（300ms）
                preloadTimer.current = setTimeout(async () => {
                  // 处理队列中的所有相册
                  while (preloadQueue.current.length > 0) {
                    const idToPreload = preloadQueue.current.shift();
                    if (!idToPreload) continue;
                    
                    // 标记为已预加载
                    preloadCache.current.add(idToPreload);
                    
                    try {
                      const albumWithPhotos = await albumService.getAlbumWithPhotos(idToPreload);
                      
                      // 预处理照片URL签名
                      if (albumWithPhotos.photos_videos && albumWithPhotos.photos_videos.length > 0) {
                        // 只预加载前3张照片的签名URL，减少请求
                        const photosToPreload = albumWithPhotos.photos_videos.slice(0, 3);
                        await Promise.all(
                          photosToPreload.map(async (photo) => {
                            try {
                              if (photo.media_url) {
                                await getCoupleSignedUrl(photo.media_url);
                              }
                              if (photo.thumbnail_url) {
                                await getCoupleSignedUrl(photo.thumbnail_url);
                              }
                            } catch (err) {
                              console.debug('预加载照片签名URL失败:', err);
                            }
                          })
                        );
                      }
                    } catch (err) {
                      // 预加载失败时，从缓存中移除，以便稍后可以重试
                      preloadCache.current.delete(idToPreload);
                      console.debug('预加载相册数据失败:', err);
                    }
                  }
                }, 300);
              }}
              onMouseLeave={() => {
                // 鼠标离开时清除预加载定时器
                if (preloadTimer.current) {
                  clearTimeout(preloadTimer.current);
                  preloadTimer.current = null;
                  // 清空预加载队列
                  preloadQueue.current = [];
                }
              }}
            >
              <div className="album-cover">
                <img 
                  src={album.cover_url || getDefaultCover(album.id)} 
                  alt={album.title} 
                  onError={(e) => {
                    // 如果图片加载失败，使用备用封面
                    const defaultCover = getDefaultCover(album.id);
                    const index = defaultCoversArray.indexOf(defaultCover);
                    if (index !== -1 && fallbackCovers[index]) {
                      (e.target as HTMLImageElement).src = fallbackCovers[index];
                    } else {
                      // 如果找不到对应的备用图片，使用通用备用图片
                      (e.target as HTMLImageElement).src = "https://placehold.co/500x500/CCCCCC/FFFFFF?text=Cover+Not+Available";
                    }
                  }}
                />
                <div className="album-info">
                  <div className="album-name">{album.title}</div>
                  <div className="album-meta">
                    <div>
                      {album.count !== undefined ? (
                        <T 
                          zh={`${album.count}个媒体文件`} 
                          en={`${album.count} Media Files`} 
                        />
                      ) : album.photos_videos ? (
                        <T 
                          zh={`${album.photos_videos.length}个媒体文件`} 
                          en={`${album.photos_videos.length} Media Files`} 
                        />
                      ) : (
                        <T zh="0个媒体文件" en="0 Media Files" />
                      )}
                    </div>
                    <div>{formatDate(album.created_at)}</div>
                  </div>
                </div>
                <div className="album-actions">
                  <button title={language === 'zh' ? '上传照片' : 'Upload Photos'} onClick={(e) => handleUploadPhotos(album.id, album.title, e)}>
                    <i className="fas fa-upload"></i>
                  </button>
                  <button title={language === 'zh' ? '编辑相册' : 'Edit Album'} onClick={(e) => handleEditAlbum(album, e)}>
                    <i className="fas fa-edit"></i>
                  </button>
                  <button 
                    className="delete-btn" 
                    title={language === 'zh' ? '删除相册' : 'Delete Album'} 
                    onClick={(e) => handleDeleteAlbum(album.id, album.title, e)}
                    disabled={isDeletingAlbum === album.id}
                  >
                    {isDeletingAlbum === album.id ? (
                      <i className="fas fa-spinner fa-spin"></i>
                    ) : (
                      <i className="fas fa-trash"></i>
                    )}
                  </button>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}
      
      {/* 创建相册模态框 */}
      <CreateAlbumModal 
        isOpen={isCreateModalOpen} 
        onClose={handleCloseCreateModal} 
        onSuccess={handleAlbumCreated} 
      />
      
      {/* 编辑相册模态框 */}
      <EditAlbumModal
        isOpen={isEditModalOpen}
        onClose={handleCloseEditModal}
        album={albumToEdit}
        onSuccess={handleAlbumUpdated}
      />
      
      {/* 上传照片模态框 */}
      {selectedAlbum && (
        <UploadPhotosModal
          isOpen={isUploadModalOpen}
          onClose={handleCloseUploadModal}
          onSuccess={handlePhotosUploaded}
          albumId={selectedAlbum.id}
          albumTitle={selectedAlbum.title}
        />
      )}
      
      {/* 相册详情模态框 */}
      {isAlbumDetailOpen && currentAlbum && (
        <div className="modal-overlay" onClick={handleCloseAlbumDetail}>
          <div className="album-detail-modal" onClick={(e) => e.stopPropagation()}>
            <div className="modal-header">
              <h2>{currentAlbum.title}</h2>
              <div className="modal-actions">
                {!isSelectionMode ? (
                  <button 
                    className="action-btn select-btn" 
                    onClick={toggleSelectionMode}
                    title={language === 'zh' ? '选择照片' : 'Select Photos'}
                  >
                    <i className="fas fa-check-square"></i>
                    <span><T zh="选择" en="Select" /></span>
                  </button>
                ) : (
                  <button 
                    className="action-btn cancel-btn" 
                    onClick={toggleSelectionMode}
                    title={language === 'zh' ? '取消选择' : 'Cancel Selection'}
                  >
                    <i className="fas fa-times"></i>
                    <span><T zh="取消" en="Cancel" /></span>
                  </button>
                )}
                <button className="close-btn" onClick={handleCloseAlbumDetail}>
                  <i className="fas fa-times"></i>
                </button>
              </div>
            </div>
            
            <div className="album-description">
              {currentAlbum.description && <p>{currentAlbum.description}</p>}
              <div className="album-meta-info">
                <span>
                  <i className="fas fa-calendar"></i> {formatDate(currentAlbum.created_at)}
                </span>
                <span>
                  <i className="fas fa-image"></i> {currentAlbum.count !== undefined ? currentAlbum.count : albumPhotos.length} <T zh="个媒体文件" en="Media Files" />
                </span>
              </div>
            </div>
            
            {/* 选择模式下的操作条 */}
            {isSelectionMode && (
              <div className="selection-actions-bar">
                <div className="selection-status">
                  <T 
                    zh={`已选择 ${selectedPhotos.length} 张照片`} 
                    en={`${selectedPhotos.length} photos selected`} 
                  />
                </div>
                <div className="selection-actions">
                  <button 
                    className="action-btn select-all-btn" 
                    onClick={selectAll}
                    title={language === 'zh' ? '全选' : 'Select All'}
                  >
                    <i className="fas fa-check-double"></i>
                    <span><T zh="全选" en="Select All" /></span>
                  </button>
                  <button 
                    className="action-btn deselect-all-btn" 
                    onClick={deselectAll}
                    title={language === 'zh' ? '取消全选' : 'Deselect All'}
                  >
                    <i className="fas fa-square"></i>
                    <span><T zh="取消全选" en="Deselect All" /></span>
                  </button>
                  <button 
                    className="action-btn delete-btn" 
                    onClick={handleBulkDelete}
                    disabled={selectedPhotos.length === 0 || isDeleting}
                    title={language === 'zh' ? '删除所选' : 'Delete Selected'}
                  >
                    {isDeleting ? (
                      <i className="fas fa-spinner fa-spin"></i>
                    ) : (
                      <i className="fas fa-trash"></i>
                    )}
                    <span>
                      <T 
                        zh={isDeleting ? "删除中..." : "删除所选"} 
                        en={isDeleting ? "Deleting..." : "Delete Selected"} 
                      />
                    </span>
                  </button>
                </div>
              </div>
            )}
            
            {loadingPhotos ? (
              <div className="loading-container">
                <i className="fas fa-spinner fa-spin"></i>
                <p><T zh="加载照片中..." en="Loading photos..." /></p>
              </div>
            ) : albumPhotos.length === 0 ? (
              <div className="empty-photos">
                <i className="fas fa-images"></i>
                <p><T zh="相册中还没有照片" en="No photos in this album yet" /></p>
                <button 
                  className="btn btn-primary" 
                  onClick={() => {
                    setSelectedAlbum({ id: currentAlbum.id, title: currentAlbum.title });
                    setIsUploadModalOpen(true);
                  }}
                >
                  <i className="fas fa-upload"></i>
                  <T zh="上传照片" en="Upload Photos" />
                </button>
              </div>
            ) : (
              <div className="album-photos-grid">
                {albumPhotos.map((photo, index) => (
                  <div 
                    className={`photo-item ${isSelectionMode ? 'selection-mode' : ''} ${selectedPhotos.includes(photo.id) ? 'selected' : ''}`}
                    key={photo.id || index}
                    onClick={() => isSelectionMode ? handleSelectPhoto(null, photo.id) : handleMediaClick(photo)}
                  >
                    {isSelectionMode && (
                      <div 
                        className="selection-checkbox"
                        onClick={(e) => {
                          e.stopPropagation();
                          handleSelectPhoto(e, photo.id);
                        }}
                      >
                        <i className={`fas ${selectedPhotos.includes(photo.id) ? 'fa-check-square' : 'fa-square'}`}></i>
                      </div>
                    )}
                    
                    {photo.media_type === 'photo' ? (
                      <img 
                        src={photo.thumbnail_url || photo.url} 
                        alt={photo.title || `Photo ${index + 1}`} 
                        loading="lazy"
                      />
                    ) : (
                      <div className="video-thumbnail">
                        <img 
                          src={photo.thumbnail_url || `https://placehold.co/600x400/666/fff?text=Video`} 
                          alt={photo.title || `Video ${index + 1}`}
                          loading="lazy"
                        />
                        <div className="play-icon">
                          <i className="fas fa-play"></i>
                        </div>
                      </div>
                    )}
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      )}
      
      {/* 媒体查看器模态框 */}
      {isMediaViewerOpen && currentMedia && (
        <>
          {currentMedia.media_type === 'photo' ? (
            <ImageViewer
              src={currentMedia.url || ''}
              alt={currentMedia.title || 'Photo'}
              onClose={handleCloseMediaViewer}
            />
          ) : (
            <div className="modal-overlay media-viewer-overlay" onClick={handleCloseMediaViewer}>
              <div className="media-viewer-container" onClick={(e) => e.stopPropagation()}>
                <button className="close-btn media-close-btn" onClick={handleCloseMediaViewer}>
                  <i className="fas fa-times"></i>
                </button>

                <div className="media-viewer-video-container">
                  <video
                    ref={videoRef}
                    src={currentMedia.url}
                    controls
                    className="media-viewer-video"
                    controlsList="nodownload"
                  />
                </div>

                {currentMedia.title && (
                  <div className="media-viewer-caption">
                    <h3>{currentMedia.title}</h3>
                    {currentMedia.description && <p>{currentMedia.description}</p>}
                  </div>
                )}
              </div>
            </div>
          )}
        </>
      )}
      
      {/* 确认对话框 */}
      {ConfirmationDialogComponent}
      
      <style jsx>{`
        .album-detail-modal {
          background: var(--bg-card, white);
          border-radius: 12px;
          width: 90%;
          max-width: 1200px;
          max-height: 90vh;
          overflow-y: auto;
          padding: 24px;
          position: relative;
          box-shadow: var(--shadow-lg, 0 5px 20px rgba(0, 0, 0, 0.2));
          border: 1px solid var(--border-primary, transparent);
        }

        .modal-header {
          display: flex;
          justify-content: space-between;
          align-items: center;
          margin-bottom: 16px;
          padding-bottom: 16px;
          border-bottom: 1px solid var(--border-primary, #eee);
        }

        .modal-header h2 {
          margin: 0;
          font-size: 24px;
          color: var(--text-primary, #333);
        }
        
        .modal-actions {
          display: flex;
          align-items: center;
          gap: 8px;
        }
        
        .action-btn {
          display: flex;
          align-items: center;
          gap: 5px;
          padding: 5px 10px;
          border-radius: 4px;
          border: none;
          cursor: pointer;
          font-size: 14px;
          background: var(--accent-secondary, #f0f0f0);
          color: var(--text-primary, #333);
          transition: background 0.2s;
        }

        .action-btn:hover {
          background: var(--bg-tertiary, #e0e0e0);
        }

        .action-btn i {
          font-size: 14px;
        }

        .select-btn {
          background: var(--accent-secondary, #e8f4fd);
          color: var(--accent-primary, #0078d4);
        }

        .select-btn:hover {
          background: var(--bg-tertiary, #d0e8fa);
        }

        .delete-btn {
          background: rgba(248, 81, 73, 0.1);
          color: var(--accent-danger, #d40000);
        }

        .delete-btn:hover:not(:disabled) {
          background: rgba(248, 81, 73, 0.2);
        }

        .delete-btn:disabled {
          opacity: 0.5;
          cursor: not-allowed;
        }
        
        .selection-actions-bar {
          display: flex;
          justify-content: space-between;
          align-items: center;
          padding: 10px 16px;
          margin: 16px 0;
          background: var(--bg-secondary, #f8f8f8);
          border-radius: 8px;
          border: 1px solid var(--border-primary, transparent);
        }

        .selection-status {
          font-weight: 500;
          color: var(--text-primary, #333);
        }

        .selection-actions {
          display: flex;
          gap: 8px;
        }

        .close-btn {
          background: none;
          border: none;
          font-size: 20px;
          cursor: pointer;
          color: var(--text-secondary, #666);
          padding: 5px;
        }

        .album-description {
          margin-bottom: 20px;
          color: var(--text-secondary, #666);
        }

        .album-meta-info {
          display: flex;
          gap: 16px;
          margin-top: 8px;
          font-size: 14px;
          color: var(--text-tertiary, #888);
        }
        
        .album-meta-info i {
          margin-right: 5px;
        }
        
        .empty-photos {
          display: flex;
          flex-direction: column;
          align-items: center;
          justify-content: center;
          padding: 40px 0;
          color: var(--text-muted, #aaa);
        }

        .empty-photos i {
          font-size: 48px;
          margin-bottom: 16px;
        }

        .album-photos-grid {
          display: grid;
          grid-template-columns: repeat(auto-fill, minmax(180px, 1fr));
          gap: 12px;
          margin-top: 20px;
        }

        .photo-item {
          aspect-ratio: 1;
          overflow: hidden;
          border-radius: 8px;
          box-shadow: var(--shadow-sm, 0 2px 5px rgba(0, 0, 0, 0.1));
          cursor: pointer;
          transition: transform 0.2s ease;
          position: relative;
          border: 1px solid var(--border-primary, transparent);
        }

        .photo-item:hover {
          transform: scale(1.02);
          box-shadow: var(--shadow-md, 0 4px 12px rgba(0, 0, 0, 0.15));
        }

        .photo-item.selection-mode:hover {
          transform: none;
        }

        .photo-item.selection-mode.selected {
          box-shadow: 0 0 0 3px var(--accent-primary, #0078d4);
        }
        
        .selection-checkbox {
          position: absolute;
          top: 8px;
          right: 8px;
          width: 24px;
          height: 24px;
          background: var(--bg-overlay, rgba(255, 255, 255, 0.8));
          border-radius: 4px;
          display: flex;
          align-items: center;
          justify-content: center;
          z-index: 2;
          border: 1px solid var(--border-primary, rgba(0, 0, 0, 0.1));
        }

        .selection-checkbox i {
          color: var(--accent-primary, #0078d4);
          font-size: 18px;
        }
        
        .photo-item img {
          width: 100%;
          height: 100%;
          object-fit: cover;
        }
        
        .video-thumbnail {
          position: relative;
          width: 100%;
          height: 100%;
        }
        
        .play-icon {
          position: absolute;
          top: 50%;
          left: 50%;
          transform: translate(-50%, -50%);
          width: 40px;
          height: 40px;
          background: rgba(0, 0, 0, 0.6);
          border-radius: 50%;
          display: flex;
          align-items: center;
          justify-content: center;
          color: white;
        }
        
        .album-card {
          cursor: pointer;
        }
        
        /* 媒体查看器样式 */
        .media-viewer-overlay {
          background-color: rgba(0, 0, 0, 0.9);
          z-index: 1100;
        }
        
        .media-viewer-container {
          position: relative;
          width: 90%;
          max-width: 1200px;
          height: 90vh;
          display: flex;
          flex-direction: column;
          justify-content: center;
        }
        
        .media-close-btn {
          position: absolute;
          top: 20px;
          right: 20px;
          background: rgba(0, 0, 0, 0.5);
          color: white;
          width: 40px;
          height: 40px;
          border-radius: 50%;
          display: flex;
          align-items: center;
          justify-content: center;
          z-index: 10;
        }
        
        .media-viewer-image {
          max-width: 100%;
          max-height: 80vh;
          object-fit: contain;
          margin: 0 auto;
        }
        
        .media-viewer-video-container {
          width: 100%;
          height: 0;
          padding-bottom: 56.25%; /* 16:9 比例 */
          position: relative;
        }
        
        .media-viewer-video {
          position: absolute;
          top: 0;
          left: 0;
          width: 100%;
          height: 100%;
          object-fit: contain;
        }
        
        .media-viewer-caption {
          background: rgba(0, 0, 0, 0.5);
          color: white;
          padding: 16px;
          margin-top: 16px;
          border-radius: 8px;
        }
        
        .media-viewer-caption h3 {
          margin: 0 0 8px 0;
          font-size: 18px;
        }
        
        .media-viewer-caption p {
          margin: 0;
          font-size: 14px;
          color: #ddd;
        }
      `}</style>
    </>
  );
} 