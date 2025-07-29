'use client';

import React, { useState } from 'react';
import { createPortal } from 'react-dom';
import { T, useLanguage } from '@/components/LanguageContext';

interface ConfirmationDialogProps {
  isOpen: boolean;
  title: string;
  message: string;
  confirmText?: string;
  cancelText?: string;
  onConfirm: () => void;
  onCancel: () => void;
}

export default function ConfirmationDialog({
  isOpen,
  title,
  message,
  confirmText,
  cancelText,
  onConfirm,
  onCancel
}: ConfirmationDialogProps) {
  const { language } = useLanguage();
  
  if (!isOpen) return null;

  return typeof document !== 'undefined' ? createPortal(
    <div className="confirmation-overlay" onClick={onCancel}>
      <div className="confirmation-dialog" onClick={(e) => e.stopPropagation()}>
        <div className="confirmation-header">
          <h3>{title}</h3>
        </div>
        <div className="confirmation-body">
          <p>{message}</p>
        </div>
        <div className="confirmation-footer">
          <button className="btn btn-secondary" onClick={onCancel}>
            {cancelText || <T zh="取消" en="Cancel" />}
          </button>
          <button className="btn btn-danger" onClick={onConfirm}>
            {confirmText || <T zh="确认" en="Confirm" />}
          </button>
        </div>
      </div>
      
      <style jsx>{`
        .confirmation-overlay {
          position: fixed;
          top: 0;
          left: 0;
          right: 0;
          bottom: 0;
          background-color: rgba(0, 0, 0, 0.5);
          display: flex;
          align-items: center;
          justify-content: center;
          z-index: 1000;
        }
        
        .confirmation-dialog {
          background-color: var(--bg-card, white);
          border-radius: 12px;
          box-shadow: var(--shadow-lg, 0 10px 25px rgba(0, 0, 0, 0.2));
          width: 90%;
          max-width: 400px;
          overflow: hidden;
        }
        
        .confirmation-header {
          padding: 20px 20px 0 20px;
        }
        
        .confirmation-header h3 {
          margin: 0;
          font-size: 18px;
          font-weight: 600;
          color: var(--text-primary, #333);
        }
        
        .confirmation-body {
          padding: 20px;
        }
        
        .confirmation-body p {
          margin: 0;
          color: var(--text-secondary, #666);
          line-height: 1.5;
        }
        
        .confirmation-footer {
          padding: 16px 20px;
          border-top: 1px solid var(--border-primary, #eee);
          display: flex;
          justify-content: flex-end;
          gap: 12px;
        }
        
        .btn {
          padding: 10px 16px;
          border-radius: 8px;
          font-size: 14px;
          font-weight: 500;
          cursor: pointer;
          transition: all 0.2s ease;
          border: none;
        }
        
        .btn-secondary {
          background: var(--bg-secondary, #f8f9fa);
          color: var(--text-secondary, #666);
        }
        
        .btn-secondary:hover {
          background: var(--bg-hover, #edf2f7);
        }
        
        .btn-danger {
          background: var(--accent-danger, #e74c3c);
          color: var(--text-inverse, white);
        }
        
        .btn-danger:hover {
          background: var(--accent-danger-hover, #c0392b);
        }
      `}</style>
    </div>,
    document.body
  ) : null;
}

export function useConfirmationDialog() {
  const [isOpen, setIsOpen] = useState(false);
  const [dialogProps, setDialogProps] = useState<{
    title: string;
    message: string;
    confirmText?: string;
    cancelText?: string;
    onConfirm: () => void;
  } | null>(null);

  const openDialog = (props: {
    title: string;
    message: string;
    confirmText?: string;
    cancelText?: string;
    onConfirm: () => void;
  }) => {
    setDialogProps(props);
    setIsOpen(true);
  };

  const closeDialog = () => {
    setIsOpen(false);
    setDialogProps(null);
  };

  const ConfirmationDialogComponent = dialogProps ? (
    <ConfirmationDialog
      isOpen={isOpen}
      title={dialogProps.title}
      message={dialogProps.message}
      confirmText={dialogProps.confirmText}
      cancelText={dialogProps.cancelText}
      onConfirm={() => {
        dialogProps.onConfirm();
        closeDialog();
      }}
      onCancel={closeDialog}
    />
  ) : null;

  return {
    openDialog,
    closeDialog,
    ConfirmationDialogComponent
  };
}