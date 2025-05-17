'use client';

import React from 'react';
import { T, useLanguage } from './LanguageContext';

export default function Account() {
  const { language } = useLanguage();
  
  return (
    <div className="account-grid">
      <div className="card">
        <h2 className="card-title">
          <T zh="我们的信息" en="Our Information" />
        </h2>
        <div className="couple-info">
          <div className="couple-avatar-group">
            <div className="couple-avatar">A</div>
            <div className="couple-avatar">J</div>
          </div>
          <div className="couple-details">
            <div className="couple-name">Alex & Jamie</div>
            <div className="couple-date">
              <i className="fas fa-heart"></i>
              <T 
                zh="在一起自2021年8月18日（748天）" 
                en="Together since August 18, 2021 (748 days)" 
              />
            </div>
          </div>
        </div>
        <div className="form-group">
          <label><T zh="关系名称" en="Relationship Name" /></label>
          <input type="text" defaultValue="Alex & Jamie's Journey" />
        </div>
        <div className="form-row">
          <div className="form-group">
            <label><T zh="Alex的名字" en="Alex's Name" /></label>
            <input type="text" defaultValue="Alexander Mitchell" />
          </div>
          <div className="form-group">
            <label><T zh="Jamie的名字" en="Jamie's Name" /></label>
            <input type="text" defaultValue="Jamie Thompson" />
          </div>
        </div>
        <div className="form-group">
          <label><T zh="纪念日" en="Anniversary Date" /></label>
          <input type="date" defaultValue="2021-08-18" />
        </div>
        <div className="form-group">
          <label><T zh="共享邮箱（用于通知）" en="Shared Email (for notifications)" /></label>
          <input type="email" defaultValue="us@alexjamie.com" />
        </div>
        <button className="btn btn-primary">
          <i className="fas fa-save"></i>
          <T zh="保存更改" en="Save Changes" />
        </button>
      </div>

      <div className="card">
        <h2 className="card-title">
          <T zh="存储与数据" en="Storage & Data" />
        </h2>
        <div className="storage-info">
          <div className="storage-bar">
            <div className="storage-progress"></div>
          </div>
          <div className="storage-details">
            <div><T zh="已使用 3.5 GB" en="Using 3.5 GB" /></div>
            <div><T zh="共 10 GB" en="of 10 GB" /></div>
          </div>
          <div className="storage-breakdown">
            <div className="storage-item">
              <div className="storage-item-label">
                <div className="storage-color purple"></div>
                <div><T zh="时间轴媒体" en="Timeline Media" /></div>
              </div>
              <div>1.2 GB</div>
            </div>
            <div className="storage-item">
              <div className="storage-item-label">
                <div className="storage-color orange"></div>
                <div><T zh="相册照片和视频" en="Album Photos & Videos" /></div>
              </div>
              <div>2.1 GB</div>
            </div>
            <div className="storage-item">
              <div className="storage-item-label">
                <div className="storage-color blue"></div>
                <div><T zh="回忆视频" en="Memory Videos" /></div>
              </div>
              <div>0.2 GB</div>
            </div>
          </div>
        </div>
        <div style={{ display: 'flex', gap: '10px', marginTop: '15px' }}>
          <button className="btn btn-outline">
            <i className="fas fa-download"></i>
            <T zh="导出数据" en="Export Data" />
          </button>
          <button className="btn btn-outline">
            <i className="fas fa-arrow-up"></i>
            <T zh="升级存储" en="Upgrade Storage" />
          </button>
        </div>
      </div>
    </div>
  );
} 