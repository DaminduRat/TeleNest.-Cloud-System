import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Folder, Image, Video, FileText, Music, Download, Share2, Star, Lock, Trash2, MoreVertical, Edit2 } from 'lucide-react';

interface FolderCardProps {
  name: string;
  itemCount: number;
  size: string;
  color: string;
  index: number;
  type?: 'system' | 'custom';
  progress?: number;
  onDelete?: () => void;
  onRename?: () => void;
}

const getIcon = (name: string, color: string, size = 28) => {
  const props = { size, color };
  switch (name) {
    case 'Images': return <Image {...props} />;
    case 'Videos': return <Video {...props} />;
    case 'Documents': return <FileText {...props} />;
    case 'Audio': return <Music {...props} />;
    case 'Downloads': return <Download {...props} />;
    case 'Shared': return <Share2 {...props} />;
    case 'Favorites': return <Star {...props} />;
    case 'Private Vault': return <Lock {...props} />;
    case 'Trash': return <Trash2 {...props} />;
    default: return <Folder {...props} />;
  }
};

const FolderCard: React.FC<FolderCardProps> = ({ name, itemCount, size, color, index, type = 'system', progress = 0, onDelete, onRename }) => {
  const [showMenu, setShowMenu] = useState(false);

  return (
    <motion.div
      className="glass-panel folder-card"
      style={{ padding: 0, cursor: 'pointer', position: 'relative', overflow: 'visible' }}
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay: index * 0.05, duration: 0.4 }}
      whileHover={{ y: -3, background: 'rgba(255,255,255,0.06)' }}
    >
      {type === 'custom' && (
        <div style={{ position: 'absolute', top: '8px', right: '8px', zIndex: 20 }}>
          <button 
            onClick={(e) => { e.stopPropagation(); setShowMenu(!showMenu); }}
            className="btn-icon" 
            style={{ width: '24px', height: '24px', background: 'transparent', border: 'none', color: 'var(--text-secondary)' }}
          >
            <MoreVertical size={16} />
          </button>
          
          <AnimatePresence>
            {showMenu && (
              <>
                <div 
                  style={{ position: 'fixed', inset: 0, zIndex: -1 }} 
                  onClick={(e) => { e.stopPropagation(); setShowMenu(false); }} 
                />
                <motion.div 
                  initial={{ opacity: 0, scale: 0.9, y: -10 }}
                  animate={{ opacity: 1, scale: 1, y: 0 }}
                  exit={{ opacity: 0, scale: 0.9, y: -10 }}
                  style={{ 
                    position: 'absolute', top: '28px', right: '0', background: '#111', 
                    border: '1px solid var(--glass-border)', borderRadius: '10px', padding: '6px',
                    width: '120px', boxShadow: '0 10px 25px rgba(0,0,0,0.5)', zIndex: 100
                  }}
                >
                  <button 
                    onClick={(e) => { e.stopPropagation(); setShowMenu(false); onRename?.(); }}
                    style={{ 
                      width: '100%', padding: '8px', display: 'flex', alignItems: 'center', gap: '8px',
                      background: 'transparent', border: 'none', color: '#fff', borderRadius: '6px',
                      cursor: 'pointer', fontSize: '0.8rem'
                    }}
                    className="menu-item-hover"
                  >
                    <Edit2 size={12} color="var(--tg-blue)" /> Rename
                  </button>
                  <button 
                    onClick={(e) => { e.stopPropagation(); setShowMenu(false); onDelete?.(); }}
                    style={{ 
                      width: '100%', padding: '8px', display: 'flex', alignItems: 'center', gap: '8px',
                      background: 'transparent', border: 'none', color: '#ef4444', borderRadius: '6px',
                      cursor: 'pointer', fontSize: '0.8rem'
                    }}
                    className="menu-item-hover"
                  >
                    <Trash2 size={12} /> Delete
                  </button>
                </motion.div>
              </>
            )}
          </AnimatePresence>
        </div>
      )}

      {/* Card content — compact layout */}
      <div className="folder-card-inner" style={{ padding: '16px' }}>
        {/* Icon + Name row */}
        <div style={{ display: 'flex', alignItems: 'center', gap: '12px', marginBottom: '10px' }}>
          <motion.div 
            style={{ 
              width: '40px', height: '40px', minWidth: '40px',
              borderRadius: '10px', 
              background: `${color}15`, 
              display: 'flex', alignItems: 'center', justifyContent: 'center' 
            }}
            whileHover={{ scale: 1.1, rotate: 5 }}
          >
            {getIcon(name, color, 22)}
          </motion.div>
          <div style={{ minWidth: 0, flex: 1 }}>
            <h3 style={{ fontSize: '0.95rem', fontWeight: 600, color: '#fff', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis', margin: 0 }}>{name}</h3>
            <div style={{ fontSize: '0.75rem', color: 'var(--text-secondary)', marginTop: '2px' }}>
              {itemCount > 0 ? `${itemCount} items` : 'Empty'} · {size}
            </div>
          </div>
        </div>

        {/* Progress bar */}
        <div style={{ height: '3px', background: 'rgba(255,255,255,0.05)', borderRadius: '2px', overflow: 'hidden' }}>
          <motion.div 
            style={{ height: '100%', background: color }}
            initial={{ width: 0 }}
            animate={{ width: `${progress}%` }}
            transition={{ delay: 0.5 + index * 0.1, duration: 1 }}
          />
        </div>
      </div>

      <style>{`
        .menu-item-hover:hover {
          background: rgba(255,255,255,0.05) !important;
        }
        @media (max-width: 768px) {
          .folder-card-inner {
            padding: 12px !important;
          }
        }
      `}</style>
    </motion.div>
  );
};

export default FolderCard;
