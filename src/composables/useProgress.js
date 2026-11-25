import { ref } from 'vue';
import { lessonById, lessons } from '../data/course.js';

const storagePath = window.location.pathname.replace(/\/index\.html$/, '/').replace(/\/$/, '');
const storagePrefix = `mysql-study-plan:v1:${storagePath}:`;
const recentKey = `${storagePrefix}recent`;
// 为每节课生成独立的完成状态存储键。
const completionKey = (id) => `${storagePrefix}complete:${id}`;

const completed = ref(new Set());
const recent = ref('');
const storageAvailable = ref(true);

/** 从 localStorage 恢复最近阅读记录和所有课时的完成状态。 */
function readProgress() {
  try {
    const storage = window.localStorage;
    const saved = storage.getItem(recentKey);
    // 整体替换 Set，确保跨标签页同步时 Vue 能立即更新所有进度视图。
    completed.value = new Set(
      lessons.map(({ id }) => id).filter((id) => storage.getItem(completionKey(id)) === '1')
    );
    recent.value = lessonById.has(saved) ? saved : '';
  } catch {
    // 隐私模式等场景可能禁用存储，此时仍保留当前内存中的学习进度。
    storageAvailable.value = false;
  }
}

/** 写入或删除一个进度项，并统一处理浏览器存储不可用的情况。 */
function writeProgress(key, value) {
  try {
    if (value === null) window.localStorage.removeItem(key);
    else window.localStorage.setItem(key, value);
    storageAvailable.value = true;
  } catch {
    storageAvailable.value = false;
  }
}

/** 切换指定课时的完成状态，并将结果持久化。 */
function toggleComplete(id) {
  if (completed.value.has(id)) completed.value.delete(id);
  else completed.value.add(id);
  writeProgress(completionKey(id), completed.value.has(id) ? '1' : null);
}

/** 记录最近打开的课时，供首页的“继续学习”入口使用。 */
function recordRecent(id) {
  recent.value = id;
  writeProgress(recentKey, id);
}

/** 响应其他标签页的存储变更，只同步当前部署路径下的学习进度。 */
function onProgressStorage(event) {
  if (event.key === null || event.key.startsWith(storagePrefix)) readProgress();
}

readProgress();

/** 向页面和组件提供同一份响应式学习进度状态及操作方法。 */
export function useProgress() {
  return {
    completed,
    recent,
    storageAvailable,
    toggleComplete,
    recordRecent,
    onProgressStorage,
  };
}
