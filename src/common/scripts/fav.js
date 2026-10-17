// 收藏存储工具，基于 @system.storage
// 性能策略：磁盘只读一次（进入学习页时），之后全部走内存缓存；
// 只有用户点星星时才写一次盘，翻词热路径零 I/O、零 JSON 解析。
import storage from '@system.storage'

const KEY = 'favorites'

// 模块级单例缓存：收藏对象数组
let cache = null

// 首次调用从磁盘加载；之后直接复用缓存
export function loadFavs(cb) {
  if (cache !== null) {
    cb(cache)
    return
  }
  storage.get({
    key: KEY,
    success: function (data) {
      let arr = []
      try {
        arr = JSON.parse(data) || []
      } catch (e) {
        arr = []
      }
      cache = arr
      cb(cache)
    },
    fail: function () {
      cache = []
      cb(cache)
    }
  })
}

// 同步查询收藏状态（必须在 loadFavs 回调之后调用）
export function isFav(id) {
  if (!cache) return false
  for (let i = 0; i < cache.length; i++) {
    if (cache[i].id === id) return true
  }
  return false
}

// 切换收藏：先改内存，再异步写盘，回调参数为切换后的状态
export function toggleFav(word, cb) {
  if (!cache) cache = []
  let fav = false
  let idx = -1
  for (let i = 0; i < cache.length; i++) {
    if (cache[i].id === word.id) {
      idx = i
      break
    }
  }
  if (idx >= 0) {
    cache.splice(idx, 1)
    fav = false
  } else {
    cache.push(word)
    fav = true
  }
  storage.set({ key: KEY, value: JSON.stringify(cache) })
  cb(fav)
}
