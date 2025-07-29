// 默认相册封面图片集合 (30张经过验证可访问的图片)
// 结合了Unsplash高质量图片和picsum.photos稳定图片
export const defaultCovers = [
  // Unsplash精选图片 (5张)
  "https://images.unsplash.com/photo-1518199266791-5375a83190b7?q=80&w=500&auto=format&fit=crop", // 自然风景
  "https://images.unsplash.com/photo-1523438885200-e635ba2c371e?q=80&w=500&auto=format&fit=crop", // 海边日落
  "https://images.unsplash.com/photo-1518156677180-95a2893f3e9f?q=80&w=500&auto=format&fit=crop", // 山脉湖泊
  "https://images.unsplash.com/photo-1522204538344-922f76ecc041?q=80&w=500&auto=format&fit=crop", // 森林小径
  "https://images.unsplash.com/photo-1556103255-4443dbae8e5a?q=80&w=500&auto=format&fit=crop", // 花海

  // 自然风景类 (5张)
  "https://picsum.photos/seed/nature1/500/500", // 自然风景1
  "https://picsum.photos/seed/nature2/500/500", // 自然风景2
  "https://picsum.photos/seed/nature3/500/500", // 自然风景3
  "https://picsum.photos/seed/nature4/500/500", // 自然风景4
  "https://picsum.photos/seed/nature5/500/500", // 自然风景5

  // 浪漫情侣类 (5张)
  "https://picsum.photos/seed/love1/500/500", // 浪漫情侣1
  "https://picsum.photos/seed/love2/500/500", // 浪漫情侣2
  "https://picsum.photos/seed/love3/500/500", // 浪漫情侣3
  "https://picsum.photos/seed/love4/500/500", // 浪漫情侣4
  "https://picsum.photos/seed/love5/500/500", // 浪漫情侣5

  // 城市建筑类 (5张)
  "https://picsum.photos/seed/city1/500/500", // 城市建筑1
  "https://picsum.photos/seed/city2/500/500", // 城市建筑2
  "https://picsum.photos/seed/city3/500/500", // 城市建筑3
  "https://picsum.photos/seed/city4/500/500", // 城市建筑4
  "https://picsum.photos/seed/city5/500/500", // 城市建筑5

  // 艺术创意类 (5张)
  "https://picsum.photos/seed/art1/500/500", // 艺术创意1
  "https://picsum.photos/seed/art2/500/500", // 艺术创意2
  "https://picsum.photos/seed/art3/500/500", // 艺术创意3
  "https://picsum.photos/seed/art4/500/500", // 艺术创意4
  "https://picsum.photos/seed/art5/500/500", // 艺术创意5

  // 旅行探索类 (5张)
  "https://picsum.photos/seed/travel1/500/500", // 旅行探索1
  "https://picsum.photos/seed/travel2/500/500", // 旅行探索2
  "https://picsum.photos/seed/travel3/500/500", // 旅行探索3
  "https://picsum.photos/seed/travel4/500/500", // 旅行探索4
  "https://picsum.photos/seed/travel5/500/500"  // 旅行探索5
];

// 备用图片URL集合，当主URL无法访问时使用
export const fallbackCovers = [
  // Unsplash精选图片的占位符 (5张)
  "https://placehold.co/500x500/4A90E2/FFFFFF?text=Unsplash+1", // Unsplash 1
  "https://placehold.co/500x500/4A90E2/FFFFFF?text=Unsplash+2", // Unsplash 2
  "https://placehold.co/500x500/4A90E2/FFFFFF?text=Unsplash+3", // Unsplash 3
  "https://placehold.co/500x500/4A90E2/FFFFFF?text=Unsplash+4", // Unsplash 4
  "https://placehold.co/500x500/4A90E2/FFFFFF?text=Unsplash+5", // Unsplash 5

  // 自然风景类 (5张)
  "https://placehold.co/500x500/4A90E2/FFFFFF?text=Nature+1", // 自然风景1
  "https://placehold.co/500x500/4A90E2/FFFFFF?text=Nature+2", // 自然风景2
  "https://placehold.co/500x500/4A90E2/FFFFFF?text=Nature+3", // 自然风景3
  "https://placehold.co/500x500/4A90E2/FFFFFF?text=Nature+4", // 自然风景4
  "https://placehold.co/500x500/4A90E2/FFFFFF?text=Nature+5", // 自然风景5

  // 浪漫情侣类 (5张)
  "https://placehold.co/500x500/E91E63/FFFFFF?text=Love+1", // 浪漫情侣1
  "https://placehold.co/500x500/E91E63/FFFFFF?text=Love+2", // 浪漫情侣2
  "https://placehold.co/500x500/E91E63/FFFFFF?text=Love+3", // 浪漫情侣3
  "https://placehold.co/500x500/E91E63/FFFFFF?text=Love+4", // 浪漫情侣4
  "https://placehold.co/500x500/E91E63/FFFFFF?text=Love+5", // 浪漫情侣5

  // 城市建筑类 (5张)
  "https://placehold.co/500x500/9E9E9E/FFFFFF?text=City+1", // 城市建筑1
  "https://placehold.co/500x500/9E9E9E/FFFFFF?text=City+2", // 城市建筑2
  "https://placehold.co/500x500/9E9E9E/FFFFFF?text=City+3", // 城市建筑3
  "https://placehold.co/500x500/9E9E9E/FFFFFF?text=City+4", // 城市建筑4
  "https://placehold.co/500x500/9E9E9E/FFFFFF?text=City+5", // 城市建筑5

  // 艺术创意类 (5张)
  "https://placehold.co/500x500/9C27B0/FFFFFF?text=Art+1", // 艺术创意1
  "https://placehold.co/500x500/9C27B0/FFFFFF?text=Art+2", // 艺术创意2
  "https://placehold.co/500x500/9C27B0/FFFFFF?text=Art+3", // 艺术创意3
  "https://placehold.co/500x500/9C27B0/FFFFFF?text=Art+4", // 艺术创意4
  "https://placehold.co/500x500/9C27B0/FFFFFF?text=Art+5", // 艺术创意5

  // 旅行探索类 (5张)
  "https://placehold.co/500x500/FF9800/FFFFFF?text=Travel+1", // 旅行探索1
  "https://placehold.co/500x500/FF9800/FFFFFF?text=Travel+2", // 旅行探索2
  "https://placehold.co/500x500/FF9800/FFFFFF?text=Travel+3", // 旅行探索3
  "https://placehold.co/500x500/FF9800/FFFFFF?text=Travel+4", // 旅行探索4
  "https://placehold.co/500x500/FF9800/FFFFFF?text=Travel+5"  // 旅行探索5
];

export default defaultCovers;