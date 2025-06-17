'use client';

import React, { useEffect, useState } from 'react';
import { T, useLanguage } from './LanguageContext';
import { userService } from '../services/user-service';
import { coupleService, CoupleInfoDTO } from '@/services/couple-service';

export default function Account() {
  useLanguage();
  const [hasCouple, setHasCouple] = useState<boolean>(false);
  const [anniversaryDate, setAnniversaryDate] = useState<string>("2021-08-18");
  const [destinKey, setDestinKey] = useState<string>("");
  const [coupleInfo, setCoupleInfo] = useState<CoupleInfoDTO | null>(null);
  
  // 生成密钥函数
  const generateDestinKey = (date: string) => {
    // 以memoir开通，- 间隔，后面跟数字+字母的十六位
    const randomString = Math.random().toString(36).substring(2, 15) + Math.random().toString(36).substring(2, 15);
    return `memoir-${date}-${randomString}`;
  };
  
  useEffect(() => {
    const checkCoupleStatus = async () => {
      try {
        const exists = await userService.existCouple();
        setHasCouple(exists);
        
        // 如果存在情侣关系，获取情侣信息
        if (exists) {
          try {
            const info = await coupleService.getCoupleInfo();
            setCoupleInfo(info);
            setAnniversaryDate(info.anniversary_date);
          } catch (error) {
            console.error('Failed to get couple info:', error);
          }
        }
      } catch (error) {
        console.error('Failed to check couple status:', error);
      }
    };
    
    checkCoupleStatus();
  }, []);
  
  // 初始化和更新密钥
  useEffect(() => {
    const newKey = generateDestinKey(anniversaryDate);
    setDestinKey(newKey);
  }, [anniversaryDate]);
  
  // 处理保存更改
  const handleSaveChanges = async () => {
    try {   
      // 创建情侣关系
      const coupleInfo = await coupleService.createCouple({
        pair_token: destinKey,
        anniversary_date: anniversaryDate
      });
      
      // 更新状态
      if (coupleInfo && coupleInfo.couple_id) {
        setHasCouple(true);
        setCoupleInfo(coupleInfo);
      }     
      
      // 显示成功消息
      alert('情侣关系创建成功!');
    } catch (error) {
      console.error('Failed to save changes:', error);
      alert('保存失败，请重试!');
    }
  };
  
  return (
    <div className="account-container">
      <div className="account-card">
        <h2 className="card-title">
          <T zh="爱的记忆" en="Love Story" />
        </h2>
        
        {hasCouple && coupleInfo && (
          <div className="couple-info">
            <div className="couple-avatar-group">
              <div className="couple-avatar">{coupleInfo.couple_name.charAt(0)}</div>
              <div className="couple-avatar">{coupleInfo.couple_name.length > 1 ? coupleInfo.couple_name.charAt(1) : ''}</div>
            </div>
            <div className="couple-details">
              <div className="couple-name">{coupleInfo.couple_name}</div>
              <div className="couple-date">
                <i className="fas fa-heart"></i>
                <T 
                  zh={`在一起自${coupleInfo.anniversary_date}（${coupleInfo.couple_days}天）`} 
                  en={`Together since ${coupleInfo.anniversary_date} (${coupleInfo.couple_days} days)`} 
                />
              </div>
            </div>
          </div>
        )}
        
        <div className="form-section">
          <div className="form-group">
            <label><T zh="缘定之日" en="Anniversary Date" /></label>
            <input 
              type="date" 
              value={anniversaryDate}
              onChange={(e) => setAnniversaryDate(e.target.value)}
              disabled={hasCouple}
              className="form-input" 
            />
          </div>
          
          <div className="form-group">
            <label><T zh="memoir密钥" en="Destin Key" /></label>
            <input 
              type="text" 
              value={destinKey}
              onChange={(e) => setDestinKey(e.target.value)}
              readOnly={hasCouple}
              className="form-input" 
            />
          </div>
          
          {!hasCouple && (
            <button className="btn btn-primary" onClick={handleSaveChanges}>
              <i className="fas fa-save"></i>
              <T zh="步入爱河" en="Save Changes" />
            </button>
          )}
        </div>
      </div>
      
      <style jsx>{`
        .account-container {
          display: flex;
          justify-content: center;
          width: 100%;
          padding: 20px;
        }
        
        .account-card {
          background: white;
          border-radius: 12px;
          box-shadow: 0 2px 10px rgba(0,0,0,0.05);
          padding: 24px;
          width: 100%;
          max-width: 500px;
        }
        
        .card-title {
          font-size: 1.5rem;
          margin-bottom: 20px;
          color: #333;
          text-align: center;
          font-weight: 600;
        }
        
        .couple-info {
          display: flex;
          align-items: center;
          margin-bottom: 24px;
          justify-content: center;
        }
        
        .couple-avatar-group {
          display: flex;
          margin-right: 15px;
        }
        
        .couple-avatar {
          width: 45px;
          height: 45px;
          border-radius: 50%;
          background: #6c5ce7;
          color: white;
          display: flex;
          align-items: center;
          justify-content: center;
          font-size: 18px;
          font-weight: bold;
          margin-right: -10px;
          border: 2px solid white;
        }
        
        .couple-avatar:last-child {
          background: #fd79a8;
          margin-right: 0;
        }
        
        .couple-details {
          display: flex;
          flex-direction: column;
        }
        
        .couple-name {
          font-weight: 600;
          font-size: 18px;
        }
        
        .couple-date {
          font-size: 14px;
          color: #666;
        }
        
        .couple-date i {
          color: #fd79a8;
          margin-right: 5px;
        }
        
        .form-section {
          border-top: 1px solid #eee;
          padding-top: 20px;
        }
        
        .form-group {
          margin-bottom: 16px;
        }
        
        .form-group label {
          display: block;
          margin-bottom: 6px;
          font-size: 14px;
          color: #555;
        }
        
        .form-input {
          width: 100%;
          padding: 10px;
          border: 1px solid #ddd;
          border-radius: 6px;
          font-size: 14px;
        }
        
        .btn {
          padding: 10px 20px;
          border-radius: 6px;
          font-weight: 500;
          display: flex;
          align-items: center;
          justify-content: center;
          gap: 8px;
          cursor: pointer;
          transition: all 0.2s;
          border: none;
          width: 100%;
          margin-top: 20px;
        }
        
        .btn-primary {
          background: #6c5ce7;
          color: white;
        }
        
        .btn-primary:hover {
          background: #5b4ecc;
        }
      `}</style>
    </div>
  );
} 