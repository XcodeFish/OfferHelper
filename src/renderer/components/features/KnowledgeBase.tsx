import React, { useState, useEffect, useMemo } from 'react';
import { motion, AnimatePresence } from 'framer-motion';

interface KnowledgeItem {
  id: string;
  title: string;
  content: string;
  category: string;
  tags: string[];
  difficulty: 'easy' | 'medium' | 'hard';
  frequency: number;
  lastUpdated: Date;
}

interface KnowledgeBaseProps {
  onBack: () => void;
}

const KnowledgeBase: React.FC<KnowledgeBaseProps> = ({ onBack }) => {
  const [items, setItems] = useState<KnowledgeItem[]>([]);
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedCategory, setSelectedCategory] = useState('all');
  const [selectedItem, setSelectedItem] = useState<KnowledgeItem | null>(null);
  const [isEditing, setIsEditing] = useState(false);
  const [isLoading, setIsLoading] = useState(false);

  // 获取知识库数据
  useEffect(() => {
    loadKnowledgeItems();
  }, []);

  const loadKnowledgeItems = async () => {
    setIsLoading(true);
    try {
      // 模拟数据，实际应该从后端或本地存储获取
      const mockData: KnowledgeItem[] = [
        {
          id: '1',
          title: 'React Hooks 使用技巧',
          content: 'React Hooks 是 React 16.8 引入的新特性，允许在函数组件中使用状态和其他 React 特性...',
          category: 'React',
          tags: ['React', 'Hooks', '前端'],
          difficulty: 'medium',
          frequency: 5,
          lastUpdated: new Date('2024-01-15')
        },
        {
          id: '2',
          title: 'JavaScript 闭包原理',
          content: '闭包是 JavaScript 中的一个重要概念，它允许函数访问其外部作用域的变量...',
          category: 'JavaScript',
          tags: ['JavaScript', '闭包', '作用域'],
          difficulty: 'hard',
          frequency: 8,
          lastUpdated: new Date('2024-01-10')
        },
        {
          id: '3',
          title: 'CSS Flexbox 布局',
          content: 'Flexbox 是一种一维布局方法，用于在容器中排列项目...',
          category: 'CSS',
          tags: ['CSS', 'Flexbox', '布局'],
          difficulty: 'easy',
          frequency: 3,
          lastUpdated: new Date('2024-01-20')
        }
      ];
      setItems(mockData);
    } catch (error) {
      console.error('加载知识库失败:', error);
    } finally {
      setIsLoading(false);
    }
  };

  // 过滤和搜索
  const filteredItems = useMemo(() => {
    return items.filter(item => {
      const matchesSearch = item.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
                           item.content.toLowerCase().includes(searchQuery.toLowerCase()) ||
                           item.tags.some(tag => tag.toLowerCase().includes(searchQuery.toLowerCase()));
      
      const matchesCategory = selectedCategory === 'all' || item.category === selectedCategory;
      
      return matchesSearch && matchesCategory;
    });
  }, [items, searchQuery, selectedCategory]);

  // 获取分类列表
  const categories = useMemo(() => {
    const cats = Array.from(new Set(items.map(item => item.category)));
    return ['all', ...cats];
  }, [items]);

  const handleAddItem = () => {
    const newItem: KnowledgeItem = {
      id: Date.now().toString(),
      title: '新知识点',
      content: '',
      category: 'general',
      tags: [],
      difficulty: 'medium',
      frequency: 0,
      lastUpdated: new Date()
    };
    setSelectedItem(newItem);
    setIsEditing(true);
  };

  const handleSaveItem = async (item: KnowledgeItem) => {
    try {
      const existingIndex = items.findIndex(i => i.id === item.id);
      if (existingIndex >= 0) {
        // 更新现有项目
        const newItems = [...items];
        newItems[existingIndex] = item;
        setItems(newItems);
      } else {
        // 添加新项目
        setItems([...items, item]);
      }
      setIsEditing(false);
      setSelectedItem(null);
    } catch (error) {
      console.error('保存知识点失败:', error);
    }
  };

  const handleDeleteItem = async (id: string) => {
    if (confirm('确定要删除这个知识点吗？')) {
      try {
        setItems(items.filter(item => item.id !== id));
        if (selectedItem?.id === id) {
          setSelectedItem(null);
        }
      } catch (error) {
        console.error('删除知识点失败:', error);
      }
    }
  };

  return (
    <motion.div
      className="knowledge-base-container h-full bg-gray-900 text-white"
      initial={{ opacity: 0, x: 20 }}
      animate={{ opacity: 1, x: 0 }}
      exit={{ opacity: 0, x: -20 }}
      transition={{ duration: 0.3 }}
    >
      {/* 头部 */}
      <div className="flex items-center justify-between p-4 border-b border-white/10">
        <div className="flex items-center gap-3">
          <button
            onClick={onBack}
            className="p-2 hover:bg-white/10 rounded-lg transition-colors"
            title="返回主界面"
          >
            <svg className="w-5 h-5 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
            </svg>
          </button>
          <h2 className="text-xl font-semibold text-white">📚 知识库管理</h2>
        </div>
        <button
          onClick={handleAddItem}
          className="px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-lg text-sm transition-colors"
        >
          ➕ 添加知识点
        </button>
      </div>

      <div className="flex h-full">
        {/* 侧边栏 */}
        <div className="w-80 border-r border-white/10 p-4 space-y-4">
          {/* 搜索框 */}
          <div>
            <input
              type="text"
              placeholder="搜索知识点..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full bg-gray-800 border border-gray-600 rounded-lg px-3 py-2 text-white placeholder-gray-400"
            />
          </div>

          {/* 分类筛选 */}
          <div>
            <h3 className="text-sm font-semibold text-gray-300 mb-2">分类</h3>
            <div className="space-y-1">
              {categories.map(category => (
                <button
                  key={category}
                  className={`w-full text-left px-3 py-2 rounded-lg text-sm transition-colors ${
                    selectedCategory === category 
                      ? 'bg-blue-600 text-white' 
                      : 'text-gray-300 hover:bg-white/10'
                  }`}
                  onClick={() => setSelectedCategory(category)}
                >
                  {category === 'all' ? '全部' : category}
                </button>
              ))}
            </div>
          </div>
        </div>

        {/* 主内容区 */}
        <div className="flex-1 p-4">
          {isLoading ? (
            <div className="flex items-center justify-center h-full">
              <div className="text-center">
                <div className="animate-spin w-8 h-8 border-4 border-blue-500 border-t-transparent rounded-full mx-auto mb-4"></div>
                <p className="text-gray-400">加载中...</p>
              </div>
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {filteredItems.map(item => (
                <motion.div
                  key={item.id}
                  className={`bg-white/5 border border-white/10 rounded-xl p-4 cursor-pointer transition-all hover:bg-white/10 ${
                    selectedItem?.id === item.id ? 'ring-2 ring-blue-500' : ''
                  }`}
                  onClick={() => setSelectedItem(item)}
                  whileHover={{ scale: 1.02 }}
                  whileTap={{ scale: 0.98 }}
                >
                  <div className="flex items-start justify-between mb-2">
                    <h4 className="font-semibold text-white truncate">{item.title}</h4>
                    <div className="flex gap-1 ml-2">
                      <button
                        onClick={(e) => {
                          e.stopPropagation();
                          setSelectedItem(item);
                          setIsEditing(true);
                        }}
                        className="p-1 hover:bg-white/20 rounded text-xs"
                        title="编辑"
                      >
                        ✏️
                      </button>
                      <button
                        onClick={(e) => {
                          e.stopPropagation();
                          handleDeleteItem(item.id);
                        }}
                        className="p-1 hover:bg-white/20 rounded text-xs"
                        title="删除"
                      >
                        🗑️
                      </button>
                    </div>
                  </div>
                  
                  <div className="text-gray-300 text-sm mb-3 line-clamp-3">
                    {item.content.substring(0, 100)}...
                  </div>
                  
                  <div className="flex items-center justify-between text-xs">
                    <div className="flex items-center gap-2">
                      <span className="bg-blue-600 px-2 py-1 rounded">{item.category}</span>
                      <span className={`px-2 py-1 rounded ${
                        item.difficulty === 'easy' ? 'bg-green-600' :
                        item.difficulty === 'medium' ? 'bg-yellow-600' : 'bg-red-600'
                      }`}>
                        {item.difficulty === 'easy' ? '简单' : 
                         item.difficulty === 'medium' ? '中等' : '困难'}
                      </span>
                    </div>
                    <span className="text-gray-400">使用 {item.frequency} 次</span>
                  </div>
                  
                  <div className="flex flex-wrap gap-1 mt-2">
                    {item.tags.slice(0, 3).map(tag => (
                      <span key={tag} className="bg-gray-700 px-2 py-1 rounded text-xs">
                        {tag}
                      </span>
                    ))}
                    {item.tags.length > 3 && (
                      <span className="text-gray-400 text-xs">+{item.tags.length - 3}</span>
                    )}
                  </div>
                </motion.div>
              ))}
            </div>
          )}
        </div>

        {/* 详情面板 */}
        <AnimatePresence>
          {selectedItem && (
            <motion.div
              className="w-96 border-l border-white/10 bg-gray-800"
              initial={{ x: 300, opacity: 0 }}
              animate={{ x: 0, opacity: 1 }}
              exit={{ x: 300, opacity: 0 }}
            >
              {isEditing ? (
                <KnowledgeEditor
                  item={selectedItem}
                  onSave={handleSaveItem}
                  onCancel={() => {
                    setIsEditing(false);
                    setSelectedItem(null);
                  }}
                />
              ) : (
                <KnowledgeViewer
                  item={selectedItem}
                  onEdit={() => setIsEditing(true)}
                  onClose={() => setSelectedItem(null)}
                />
              )}
            </motion.div>
          )}
        </AnimatePresence>
      </div>
    </motion.div>
  );
};

// 知识点查看器
const KnowledgeViewer: React.FC<{
  item: KnowledgeItem;
  onEdit: () => void;
  onClose: () => void;
}> = ({ item, onEdit, onClose }) => (
  <div className="h-full flex flex-col">
    <div className="flex items-center justify-between p-4 border-b border-white/10">
      <h3 className="font-semibold text-white truncate">{item.title}</h3>
      <div className="flex gap-2">
        <button
          onClick={onEdit}
          className="px-3 py-1 bg-blue-600 hover:bg-blue-700 text-white rounded text-sm transition-colors"
        >
          编辑
        </button>
        <button
          onClick={onClose}
          className="p-1 hover:bg-white/10 rounded"
        >
          <svg className="w-5 h-5 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
          </svg>
        </button>
      </div>
    </div>
    
    <div className="flex-1 p-4 overflow-y-auto space-y-4">
      <div className="prose prose-invert max-w-none">
        <div className="text-gray-300 leading-relaxed whitespace-pre-wrap">
          {item.content}
        </div>
      </div>
      
      <div className="space-y-3 pt-4 border-t border-white/10">
        <div className="flex justify-between">
          <span className="text-gray-400">分类:</span>
          <span className="text-white">{item.category}</span>
        </div>
        <div className="flex justify-between">
          <span className="text-gray-400">难度:</span>
          <span className={`px-2 py-1 rounded text-xs ${
            item.difficulty === 'easy' ? 'bg-green-600' :
            item.difficulty === 'medium' ? 'bg-yellow-600' : 'bg-red-600'
          }`}>
            {item.difficulty === 'easy' ? '简单' : 
             item.difficulty === 'medium' ? '中等' : '困难'}
          </span>
        </div>
        <div className="flex justify-between">
          <span className="text-gray-400">使用次数:</span>
          <span className="text-white">{item.frequency}</span>
        </div>
        <div className="flex justify-between">
          <span className="text-gray-400">更新时间:</span>
          <span className="text-white">{item.lastUpdated.toLocaleDateString()}</span>
        </div>
        <div>
          <span className="text-gray-400 block mb-2">标签:</span>
          <div className="flex flex-wrap gap-1">
            {item.tags.map(tag => (
              <span key={tag} className="bg-gray-700 px-2 py-1 rounded text-xs">
                {tag}
              </span>
            ))}
          </div>
        </div>
      </div>
    </div>
  </div>
);

// 知识点编辑器
const KnowledgeEditor: React.FC<{
  item: KnowledgeItem;
  onSave: (item: KnowledgeItem) => void;
  onCancel: () => void;
}> = ({ item, onSave, onCancel }) => {
  const [editItem, setEditItem] = useState<KnowledgeItem>({ ...item });

  const handleSave = () => {
    onSave({
      ...editItem,
      lastUpdated: new Date()
    });
  };

  return (
    <div className="h-full flex flex-col">
      <div className="flex items-center justify-between p-4 border-b border-white/10">
        <h3 className="font-semibold text-white">编辑知识点</h3>
        <div className="flex gap-2">
          <button
            onClick={handleSave}
            className="px-3 py-1 bg-green-600 hover:bg-green-700 text-white rounded text-sm transition-colors"
          >
            保存
          </button>
          <button
            onClick={onCancel}
            className="px-3 py-1 bg-gray-600 hover:bg-gray-700 text-white rounded text-sm transition-colors"
          >
            取消
          </button>
        </div>
      </div>
      
      <div className="flex-1 p-4 overflow-y-auto space-y-4">
        <div>
          <label className="block text-gray-300 mb-2">标题</label>
          <input
            type="text"
            value={editItem.title}
            onChange={(e) => setEditItem({ ...editItem, title: e.target.value })}
            className="w-full bg-gray-700 border border-gray-600 rounded-lg px-3 py-2 text-white"
          />
        </div>
        
        <div>
          <label className="block text-gray-300 mb-2">分类</label>
          <input
            type="text"
            value={editItem.category}
            onChange={(e) => setEditItem({ ...editItem, category: e.target.value })}
            className="w-full bg-gray-700 border border-gray-600 rounded-lg px-3 py-2 text-white"
          />
        </div>
        
        <div>
          <label className="block text-gray-300 mb-2">难度</label>
          <select
            value={editItem.difficulty}
            onChange={(e) => setEditItem({ ...editItem, difficulty: e.target.value as any })}
            className="w-full bg-gray-700 border border-gray-600 rounded-lg px-3 py-2 text-white"
          >
            <option value="easy">简单</option>
            <option value="medium">中等</option>
            <option value="hard">困难</option>
          </select>
        </div>
        
        <div>
          <label className="block text-gray-300 mb-2">标签 (用逗号分隔)</label>
          <input
            type="text"
            value={editItem.tags.join(', ')}
            onChange={(e) => setEditItem({ 
              ...editItem, 
              tags: e.target.value.split(',').map(tag => tag.trim()).filter(Boolean)
            })}
            className="w-full bg-gray-700 border border-gray-600 rounded-lg px-3 py-2 text-white"
          />
        </div>
        
        <div>
          <label className="block text-gray-300 mb-2">内容</label>
          <textarea
            value={editItem.content}
            onChange={(e) => setEditItem({ ...editItem, content: e.target.value })}
            className="w-full bg-gray-700 border border-gray-600 rounded-lg px-3 py-2 text-white resize-none"
            rows={12}
          />
        </div>
      </div>
    </div>
  );
};

export default KnowledgeBase;
