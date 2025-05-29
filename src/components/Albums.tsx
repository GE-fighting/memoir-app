'use client';

import React, { useState, useEffect } from 'react';
import { T, useLanguage } from './LanguageContext';
import CreateAlbumModal from './CreateAlbumModal';
import UploadPhotosModal from './UploadPhotosModal';
import { albumService, Album } from '@/services/album-service';
import '@/styles/modal.css';
import '@/styles/albums.css';
import '@/styles/upload.css';

export default function Albums() {
  const { language } = useLanguage();
  const [isCreateModalOpen, setIsCreateModalOpen] = useState(false);
  const [isUploadModalOpen, setIsUploadModalOpen] = useState(false);
  const [albums, setAlbums] = useState<Album[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState('');
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedAlbum, setSelectedAlbum] = useState<{id: string, title: string} | null>(null);
  
  // 默认封面图片集合，当相册没有封面时随机选择一个
  const defaultCovers = [
    "https://images.unsplash.com/photo-1518199266791-5375a83190b7?q=80&w=500&auto=format&fit=crop",
    "https://images.unsplash.com/photo-1523438885200-e635ba2c371e?q=80&w=500&auto=format&fit=crop",
    "https://images.unsplash.com/photo-1518156677180-95a2893f3e9f?q=80&w=500&auto=format&fit=crop",
    "https://images.unsplash.com/photo-1522204538344-922f76ecc041?q=80&w=500&auto=format&fit=crop",
    "https://images.unsplash.com/photo-1556103255-4443dbae8e5a?q=80&w=500&auto=format&fit=crop"
  ];
  
  // 获取默认封面图片
  const getDefaultCover = (albumId: string) => {
    // 使用相册ID作为种子，确保同一个相册总是获得相同的默认封面
    const index = parseInt(albumId.substring(albumId.length - 2), 16) % defaultCovers.length;
    return defaultCovers[index];
  };
  
  // 加载相册列表
  const loadAlbums = async () => {
    try {
      setIsLoading(true);
      setError('');
      const data = await albumService.getAlbums();
      setAlbums(data);
    } catch (err: any) {
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
  }, []);
  
  // 打开创建相册模态框
  const handleOpenCreateModal = () => {
    setIsCreateModalOpen(true);
  };
  
  // 关闭创建相册模态框
  const handleCloseCreateModal = () => {
    setIsCreateModalOpen(false);
  };
  
  // 创建相册成功后的回调
  const handleAlbumCreated = () => {
    // 重新加载相册列表
    loadAlbums();
  };
  
  // 处理上传照片按钮点击
  const handleUploadPhotos = (albumId: string, albumTitle: string) => {
    setSelectedAlbum({ id: albumId, title: albumTitle });
    setIsUploadModalOpen(true);
  };
  
  // 关闭上传照片模态框
  const handleCloseUploadModal = () => {
    setIsUploadModalOpen(false);
    setSelectedAlbum(null);
  };
  
  // 上传照片成功后的回调
  const handlePhotosUploaded = () => {
    // 关闭上传模态框
    setIsUploadModalOpen(false);
    
    // 不再每次上传后都重新加载所有相册
    // 可以在需要查看相册详情时再加载最新数据
  };
  
  // 处理编辑相册按钮点击
  const handleEditAlbum = (album: Album) => {
    // TODO: 实现编辑相册功能
    console.log(`编辑相册: ${album.title} (ID: ${album.id})`);
  };
  
  // 处理删除相册按钮点击
  const handleDeleteAlbum = (albumId: string, albumTitle: string) => {
    // TODO: 实现删除相册功能
    if (window.confirm(
      language === 'zh'
        ? `确定要删除相册 "${albumTitle}" 吗？`
        : `Are you sure you want to delete the album "${albumTitle}"?`
    )) {
      console.log(`删除相册: ${albumTitle} (ID: ${albumId})`);
      // 这里可以调用删除API
    }
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
        <button className="btn btn-primary" onClick={handleOpenCreateModal}>
          <i className="fas fa-plus"></i>
          <T zh="新建相册" en="New Album" />
        </button>
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
            <div className="album-card" key={album.id}>
              <div className="album-cover">
                <img 
                  src={album.cover_url || getDefaultCover(album.id)} 
                  alt={album.title} 
                  onError={(e) => {
                    // 如果图片加载失败，使用默认封面
                    (e.target as HTMLImageElement).src = getDefaultCover(album.id);
                  }}
                />
                <div className="album-info">
                  <div className="album-name">{album.title}</div>
                  <div className="album-meta">
                    <div>
                      {album.photos_videos ? (
                        <T 
                          zh={`${album.photos_videos.length}张照片`} 
                          en={`${album.photos_videos.length} Photos`} 
                        />
                      ) : (
                        <T zh="0张照片" en="0 Photos" />
                      )}
                    </div>
                    <div>{formatDate(album.created_at)}</div>
                  </div>
                </div>
                <div className="album-actions">
                  <button title={language === 'zh' ? '上传照片' : 'Upload Photos'} onClick={() => handleUploadPhotos(album.id, album.title)}>
                    <i className="fas fa-upload"></i>
                  </button>
                  <button title={language === 'zh' ? '编辑相册' : 'Edit Album'} onClick={() => handleEditAlbum(album)}>
                    <i className="fas fa-edit"></i>
                  </button>
                  <button title={language === 'zh' ? '删除相册' : 'Delete Album'} onClick={() => handleDeleteAlbum(album.id, album.title)}>
                    <i className="fas fa-trash"></i>
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
    </>
  );
} 