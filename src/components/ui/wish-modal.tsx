'use client';

import React, { useState } from 'react';
import { T, useLanguage } from '../LanguageContext';

interface WishModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSave: (data: {
    title: string;
    description: string;
    category: 'travel' | 'promise';
    date?: string;
    priority?: number;
  }) => void;
  initialCategory: 'travel' | 'promise';
  initialData?: {
    title: string;
    description: string;
    priority: number;
    category: 'travel' | 'promise';
    date?: string;
  };
}

interface UseWishModalOptions {
  onSave: (data: {
    title: string;
    description: string;
    category: 'travel' | 'promise';
    date?: string;
    priority?: number;
  }) => void;
}

export function useWishModal({ onSave }: UseWishModalOptions) {
  const [isOpen, setIsOpen] = useState(false);
  const [initialCategory, setInitialCategory] = useState<'travel' | 'promise'>('travel');
  const [initialData, setInitialData] = useState<WishModalProps['initialData']>();

  const openModal = (category: 'travel' | 'promise', data?: WishModalProps['initialData']) => {
    setInitialCategory(category);
    setInitialData(data);
    setIsOpen(true);
  };

  const closeModal = () => {
    setIsOpen(false);
    setInitialData(undefined);
  };

  const WishModalComponent = (
    <WishModal
      isOpen={isOpen}
      onClose={closeModal}
      onSave={(data) => {
        onSave(data);
        closeModal();
      }}
      initialCategory={initialCategory}
      initialData={initialData}
    />
  );

  return { openModal, closeModal, WishModalComponent };
}

export default function WishModal({ isOpen, onClose, onSave, initialCategory, initialData }: WishModalProps) {
  const { language } = useLanguage();
  const [title, setTitle] = useState(initialData?.title || '');
  const [description, setDescription] = useState(initialData?.description || '');
  const [category, setCategory] = useState<'travel' | 'promise'>(initialCategory);
  const [date, setDate] = useState(initialData?.date || '');
  const [priority, setPriority] = useState<number>(initialData?.priority || 2); // 默认中等优先级

  // 当initialData变化时更新表单状态
  React.useEffect(() => {
    if (initialData) {
      setTitle(initialData.title || '');
      setDescription(initialData.description || '');
      setCategory(initialData.category);
      setDate(initialData.date || '');
      setPriority(initialData.priority || 2);
    } else {
      // 当initialData为undefined时（新增模式），重置表单状态
      setTitle('');
      setDescription('');
      setCategory(initialCategory);
      setDate('');
      setPriority(2);
    }
  }, [initialData, initialCategory]);

  if (!isOpen) return null;

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    onSave({
      title,
      description,
      category,
      date: date || undefined,
      priority
    });
    
    // 重置表单
    setTitle('');
    setDescription('');
    setCategory(initialCategory);
    setDate('');
    setPriority(2);
  };

  return (
    <div className="modal-overlay">
      <div className="modal-container">
              <div className="modal-header">
        <h2>
          <T zh={initialData 
            ? (category === 'travel' ? '编辑旅行梦想' : '编辑共赴之约')
            : (category === 'travel' ? '添加旅行梦想' : '添加共赴之约')} 
             en={initialData
            ? (category === 'travel' ? 'Edit Travel Dream' : 'Edit Love Promise')
            : (category === 'travel' ? 'Add Travel Dream' : 'Add Love Promise')} />
        </h2>
        <button className="close-button" onClick={onClose}>
          <i className="fas fa-times"></i>
        </button>
      </div>
        
        <form onSubmit={handleSubmit} className="modal-form">
          <div className="form-group">
            <label htmlFor="title">
              <T zh="标题" en="Title" />
            </label>
            <input
              type="text"
              id="title"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              placeholder={language === 'zh' ? '输入标题...' : 'Enter title...'}
              required
            />
          </div>
          
          <div className="form-group">
            <label htmlFor="description">
              <T zh="描述" en="Description" />
            </label>
            <textarea
              id="description"
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              placeholder={language === 'zh' ? '输入描述...' : 'Enter description...'}
              rows={3}
            />
          </div>
          
          <div className="form-group">
            <label htmlFor="category">
              <T zh="类别" en="Category" />
            </label>
            <div className="category-selector">
              <button
                type="button"
                className={`category-option ${category === 'travel' ? 'selected' : ''}`}
                onClick={() => setCategory('travel')}
              >
                <i className="fas fa-map-marked-alt"></i>
                <T zh="旅行梦想" en="Travel Dream" />
              </button>
              <button
                type="button"
                className={`category-option ${category === 'promise' ? 'selected' : ''}`}
                onClick={() => setCategory('promise')}
              >
                <i className="fas fa-hands-holding-heart"></i>
                <T zh="共赴之约" en="Love Promise" />
              </button>
            </div>
          </div>
          
          <div className="form-group">
            <label htmlFor="date">
              <T zh="提醒日期" en="Reminder Date" />
            </label>
            <input
              type="date"
              id="date"
              value={date}
              onChange={(e) => setDate(e.target.value)}
            />
          </div>

          <div className="form-group">
            <label htmlFor="priority">
              <T zh="优先级" en="Priority" />
            </label>
            <div className="priority-selector">
              <button
                type="button"
                className={`priority-option ${priority === 1 ? 'selected high' : ''}`}
                onClick={() => setPriority(1)}
              >
                <i className="fas fa-flag"></i>
                <T zh="高" en="High" />
              </button>
              <button
                type="button"
                className={`priority-option ${priority === 2 ? 'selected medium' : ''}`}
                onClick={() => setPriority(2)}
              >
                <i className="fas fa-flag"></i>
                <T zh="中" en="Medium" />
              </button>
              <button
                type="button"
                className={`priority-option ${priority === 3 ? 'selected low' : ''}`}
                onClick={() => setPriority(3)}
              >
                <i className="fas fa-flag"></i>
                <T zh="低" en="Low" />
              </button>
            </div>
          </div>
          
          <div className="form-actions">
            <button type="button" className="cancel-button" onClick={onClose}>
              <T zh="取消" en="Cancel" />
            </button>
            <button type="submit" className="save-button">
              <T zh="保存" en="Save" />
            </button>
          </div>
        </form>
      </div>
      
      <style jsx>{`
        .modal-overlay {
          position: fixed;
          top: 0;
          left: 0;
          right: 0;
          bottom: 0;
          background-color: var(--bg-modal, rgba(0, 0, 0, 0.5));
          display: flex;
          align-items: center;
          justify-content: center;
          z-index: 1000;
        }

        .modal-container {
          background: var(--bg-card, white);
          border-radius: 12px;
          width: 90%;
          max-width: 500px;
          max-height: 90vh;
          overflow-y: auto;
          box-shadow: var(--shadow-lg, 0 5px 15px rgba(0, 0, 0, 0.2));
          border: 1px solid var(--border-primary, transparent);
        }
        
        .modal-header {
          display: flex;
          justify-content: space-between;
          align-items: center;
          padding: 16px 20px;
          border-bottom: 1px solid var(--border-primary, #eee);
        }

        .modal-header h2 {
          margin: 0;
          font-size: 20px;
          font-weight: 600;
          color: var(--text-primary, #333);
        }

        .close-button {
          background: none;
          border: none;
          font-size: 20px;
          color: var(--text-secondary, #999);
          cursor: pointer;
        }
        
        .modal-form {
          padding: 20px;
        }
        
        .form-group {
          margin-bottom: 16px;
        }
        
        .form-group label {
          display: block;
          margin-bottom: 8px;
          font-weight: 500;
          color: var(--text-primary, #333);
        }

        .form-group input,
        .form-group textarea {
          width: 100%;
          padding: 10px 12px;
          border: 1px solid var(--border-primary, #ddd);
          border-radius: 6px;
          font-size: 16px;
          background: var(--bg-card, white);
          color: var(--text-primary, #333);
        }
        
        .form-group textarea {
          resize: vertical;
        }
        
        .category-selector {
          display: flex;
          gap: 10px;
        }
        
        .category-option {
          flex: 1;
          padding: 10px;
          background: var(--bg-secondary, #f5f5f5);
          border: 2px solid transparent;
          border-radius: 6px;
          display: flex;
          flex-direction: column;
          align-items: center;
          gap: 8px;
          cursor: pointer;
          transition: all 0.2s ease;
        }

        .category-option i {
          font-size: 18px;
          color: var(--text-secondary, #666);
        }

        .category-option.selected {
          border-color: var(--accent-primary, #6c5ce7);
          background: var(--bg-tertiary, #f0eeff);
        }

        .category-option.selected i {
          color: var(--accent-primary, #6c5ce7);
        }

        .priority-selector {
          display: flex;
          gap: 10px;
        }
        
        .priority-option {
          flex: 1;
          padding: 10px;
          background: var(--bg-secondary, #f5f5f5);
          border: 2px solid transparent;
          border-radius: 6px;
          display: flex;
          flex-direction: column;
          align-items: center;
          gap: 8px;
          cursor: pointer;
          transition: all 0.2s ease;
        }

        .priority-option i {
          font-size: 18px;
          color: var(--text-secondary, #666);
        }

        .priority-option.selected {
          border-color: var(--accent-primary, #6c5ce7);
          background: var(--bg-tertiary, #f0eeff);
        }

        .priority-option.selected.high {
          border-color: var(--accent-danger, #e74c3c);
          background: rgba(248, 81, 73, 0.1);
        }

        .priority-option.selected.high i {
          color: var(--accent-danger, #e74c3c);
        }

        .priority-option.selected.medium {
          border-color: var(--accent-warning, #f39c12);
          background: rgba(227, 179, 65, 0.1);
        }

        .priority-option.selected.medium i {
          color: var(--accent-warning, #f39c12);
        }

        .priority-option.selected.low {
          border-color: var(--accent-success, #2ecc71);
          background: rgba(86, 211, 100, 0.1);
        }

        .priority-option.selected.low i {
          color: var(--accent-success, #2ecc71);
        }
        
        .form-actions {
          display: flex;
          justify-content: flex-end;
          gap: 12px;
          margin-top: 24px;
        }
        
        .cancel-button {
          padding: 10px 16px;
          background: var(--bg-secondary, #f5f5f5);
          border: none;
          border-radius: 6px;
          font-size: 16px;
          cursor: pointer;
          transition: background 0.2s ease;
          color: var(--text-primary, #333);
        }

        .cancel-button:hover {
          background: var(--bg-tertiary, #eee);
        }

        .save-button {
          padding: 10px 24px;
          background: var(--accent-primary, #6c5ce7);
          color: var(--text-inverse, white);
          border: none;
          border-radius: 6px;
          font-size: 16px;
          font-weight: 500;
          cursor: pointer;
          transition: background 0.2s ease;
        }

        .save-button:hover {
          background: var(--accent-hover, #5b4ecc);
        }

        /* 深色主题特殊适配 */
        :global([data-theme="dark"]) .form-group input:focus,
        :global([data-theme="dark"]) .form-group textarea:focus {
          border-color: var(--accent-primary, #58a6ff);
          box-shadow: 0 0 0 2px rgba(88, 166, 255, 0.2);
        }

        :global([data-theme="dark"]) .category-option:hover:not(.selected) {
          background: var(--bg-tertiary, rgba(255, 255, 255, 0.05));
        }

        :global([data-theme="dark"]) .priority-option:hover:not(.selected) {
          background: var(--bg-tertiary, rgba(255, 255, 255, 0.05));
        }

        :global([data-theme="dark"]) .close-button:hover {
          color: var(--text-primary, #f0f6fc);
        }
      `}</style>
    </div>
  );
} 