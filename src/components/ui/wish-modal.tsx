import React, { useState, useEffect } from 'react';
import { createPortal } from 'react-dom';
import { useLanguage } from '@/components/LanguageContext';

interface WishModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSave: (wishData: { title: string; description: string; date?: string; category: 'travel' | 'promise' }) => void;
  category: 'travel' | 'promise';
}

export default function WishModal({ isOpen, onClose, onSave, category }: WishModalProps) {
  const [isVisible, setIsVisible] = useState(false);
  const [isExiting, setIsExiting] = useState(false);
  const [isRenderingDOM, setIsRenderingDOM] = useState(false);
  const { language } = useLanguage();
  
  // Form state
  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [date, setDate] = useState('');

  // Control page scrolling and interaction
  useEffect(() => {
    if (isOpen) {
      document.body.style.overflow = 'hidden';
    } else {
      document.body.style.overflow = 'auto';
    }
    
    return () => {
      document.body.style.overflow = 'auto';
    };
  }, [isOpen]);

  useEffect(() => {
    if (isOpen) {
      setIsRenderingDOM(true);
      setIsExiting(false);
      setTimeout(() => setIsVisible(true), 10);
      // Reset form fields when opening
      setTitle('');
      setDescription('');
      setDate('');
    } else if (!isOpen && isRenderingDOM) {
      setIsVisible(false);
      setIsExiting(true);
      setTimeout(() => {
        setIsRenderingDOM(false);
      }, 300);
    }
  }, [isOpen, isRenderingDOM]);

  const handleClose = () => {
    setIsExiting(true);
    setIsVisible(false);
    setTimeout(() => {
      onClose();
    }, 300);
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (title.trim() === '') return;
    
    onSave({
      title,
      description,
      date: date || undefined,
      category
    });
    
    handleClose();
  };

  if (!isRenderingDOM) return null;

  const modalTitle = language === 'zh' ? '添加新心愿' : 'Add New Wish';
  const categoryLabel = language === 'zh' 
    ? (category === 'travel' ? '旅行梦想' : '共赴之约') 
    : (category === 'travel' ? 'Travel Dream' : 'Love Promise');
  const titleLabel = language === 'zh' ? '标题' : 'Title';
  const descriptionLabel = language === 'zh' ? '描述' : 'Description';
  const dateLabel = language === 'zh' ? '日期 (可选)' : 'Date (Optional)';
  const saveButtonText = language === 'zh' ? '保存' : 'Save';
  const cancelButtonText = language === 'zh' ? '取消' : 'Cancel';

  return typeof document !== 'undefined' ? createPortal(
    <div 
      className={`fixed inset-0 z-50 flex items-center justify-center p-4 bg-black bg-opacity-50 backdrop-blur-sm transition-opacity duration-300 ${
        isVisible ? 'opacity-100' : 'opacity-0'
      } ${isExiting ? 'opacity-0' : ''}`}
      onClick={handleClose} 
      style={{ pointerEvents: isVisible ? 'auto' : 'none' }}
      aria-modal="true"
      role="dialog"
    >
      <div 
        className={`bg-white rounded-xl shadow-2xl max-w-md w-full overflow-hidden transform transition-all duration-300 ${
          isVisible ? 'scale-100 translate-y-0' : 'scale-95 -translate-y-4'
        } ${isExiting ? 'scale-95 translate-y-4' : ''}`}
        onClick={(e) => e.stopPropagation()}
      >
        <div className="bg-gradient-to-r from-purple-500 to-indigo-600 p-4 flex items-center">
          <div className="mr-3 bg-white bg-opacity-20 p-2 rounded-full">
            {category === 'travel' ? (
              <svg className="w-6 h-6 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3.055 11H5a2 2 0 012 2v1a2 2 0 002 2 2 2 0 012 2v2.945M8 3.935V5.5A2.5 2.5 0 0010.5 8h.5a2 2 0 012 2 2 2 0 104 0 2 2 0 012-2h1.064M15 20.488V18a2 2 0 012-2h3.064M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
              </svg>
            ) : (
              <svg className="w-6 h-6 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4.318 6.318a4.5 4.5 0 000 6.364L12 20.364l7.682-7.682a4.5 4.5 0 00-6.364-6.364L12 7.636l-1.318-1.318a4.5 4.5 0 00-6.364 0z" />
              </svg>
            )}
          </div>
          <h3 className="text-xl font-bold text-white flex-1">{modalTitle}</h3>
          <button 
            onClick={handleClose}
            className="text-white hover:text-gray-200 transition-colors"
          >
            <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        </div>
        
        <form onSubmit={handleSubmit} className="p-6">
          <div className="mb-4">
            <div className="inline-block px-3 py-1 rounded-full bg-indigo-100 text-indigo-800 text-sm font-medium mb-3">
              {categoryLabel}
            </div>
          </div>
          
          <div className="mb-4">
            <label htmlFor="wish-title" className="block text-sm font-medium text-gray-700 mb-1">
              {titleLabel} *
            </label>
            <input
              id="wish-title"
              type="text"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500"
              required
            />
          </div>
          
          <div className="mb-4">
            <label htmlFor="wish-description" className="block text-sm font-medium text-gray-700 mb-1">
              {descriptionLabel}
            </label>
            <textarea
              id="wish-description"
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              rows={3}
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500"
            />
          </div>
          
          <div className="mb-6">
            <label htmlFor="wish-date" className="block text-sm font-medium text-gray-700 mb-1">
              {dateLabel}
            </label>
            <input
              id="wish-date"
              type="date"
              value={date}
              onChange={(e) => setDate(e.target.value)}
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500"
            />
          </div>
          
          <div className="flex justify-end gap-3">
            <button
              type="button"
              onClick={handleClose}
              className="px-4 py-2 border border-gray-300 rounded-md text-gray-700 hover:bg-gray-100 transition-colors"
            >
              {cancelButtonText}
            </button>
            <button
              type="submit"
              className="px-4 py-2 bg-gradient-to-r from-purple-500 to-indigo-600 text-white rounded-md hover:from-purple-600 hover:to-indigo-700 transition-colors shadow-md"
            >
              {saveButtonText}
            </button>
          </div>
        </form>
      </div>
    </div>,
    document.body
  ) : null;
}

export interface UseWishModalOptions {
  onSave?: (wishData: { title: string; description: string; date?: string; category: 'travel' | 'promise' }) => void;
}

export function useWishModal(options: UseWishModalOptions = {}) {
  const [isOpen, setIsOpen] = useState(false);
  const [category, setCategory] = useState<'travel' | 'promise'>('travel');

  const openModal = (selectedCategory: 'travel' | 'promise') => {
    setCategory(selectedCategory);
    setIsOpen(true);
  };
  
  const closeModal = () => {
    setIsOpen(false);
  };
  
  const handleSave = (wishData: { title: string; description: string; date?: string; category: 'travel' | 'promise' }) => {
    if (options.onSave) {
      options.onSave(wishData);
    }
    closeModal();
  };

  const WishModalComponent = (
    <WishModal 
      isOpen={isOpen} 
      onClose={closeModal}
      onSave={handleSave}
      category={category}
    />
  );

  return {
    openModal,
    closeModal,
    WishModalComponent
  };
} 