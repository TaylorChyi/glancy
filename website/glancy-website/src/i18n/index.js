import authEn from './auth/en.js';
import authZh from './auth/zh.js';
import navigationEn from './navigation/en.js';
import navigationZh from './navigation/zh.js';
import profileEn from './profile/en.js';
import profileZh from './profile/zh.js';
import commonEn from './common/en.js';
import commonZh from './common/zh.js';

const en = {
  ...navigationEn,
  ...authEn,
  ...profileEn,
  ...commonEn,
};

const zh = {
  ...navigationZh,
  ...authZh,
  ...profileZh,
  ...commonZh,
};

export default { en, zh };
