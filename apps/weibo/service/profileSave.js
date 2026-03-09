import { updateProfile } from '../repository/profile.js';

const toPublicFileUrl = (pathText = '') => {
  const text = String(pathText || '').trim();
  if (!text) return '';
  if (text.startsWith('/files/')) return text;
  const idx = text.indexOf('/files/');
  if (idx >= 0) return text.slice(idx);
  if (text.startsWith('http://') || text.startsWith('https://')) return text;
  return '';
};

const isAllowedAvatar = (url = '') => {
  const text = String(url || '').trim();
  if (!text) return true;
  if (text.startsWith('http://') || text.startsWith('https://')) return true;
  if (!text.startsWith('/files/')) return false;
  return /\.(png|jpe?g|webp)$/i.test(text);
};

export const profileSave = (body = {}) => {
  const displayName = String(body.displayName || '').trim();
  const signature = String(body.signature || '').trim();
  const avatarUrl = toPublicFileUrl(body.avatarPath || body.avatarUrl || '');

  if (!displayName) return { status: 400, message: '名称不能为空' };
  if (displayName.length > 40) return { status: 400, message: '名称不能超过 40 字' };
  if (signature.length > 160) return { status: 400, message: '签名不能超过 160 字' };
  if (!isAllowedAvatar(avatarUrl)) return { status: 400, message: '头像地址不合法' };

  const row = updateProfile({ displayName, signature, avatarUrl });

  return {
    success: true,
    profile: {
      displayName: String(row?.displayName || displayName),
      signature: String(row?.signature || ''),
      avatarUrl: String(row?.avatarUrl || ''),
      updatedAt: row?.updatedAt || null
    }
  };
};
