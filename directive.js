import store from '../../vuex/'
// permission指令 用以控制当用户没有当前功能权限时对DOM不予展示
const hasPermission = function(permissionId) {
  if (store.state.userPermission.permissionIds && store.state.userPermission.permissionIds.indexOf(permissionId.toString()) === -1) {
    return false
  } else {
    return true
  }
}
function textMetrics (el,baseText,calText,lineNum,suffix) {
  const { lineHeight, height } = getComputedStyle(el)
  if(baseText.length < 2) {
    return
  } else if(height.slice(0,-2) / lineHeight.slice(0,-2) >= lineNum + 1) {
    const newBaseText = baseText.slice(0,Math.floor(baseText.length / 2))
    const newCalText = baseText.slice(Math.floor(baseText.length / 2))
    el.innerText = newBaseText + suffix
    textMetrics(el,newBaseText,newCalText,lineNum,suffix)
  } else if (!calText || calText.length < 2) {
    return
  } else {
    const newBaseText = baseText + calText.slice(0,Math.floor(calText.length / 2))
    const newCalText = calText.slice(Math.floor(calText.length / 2))
    el.innerText = newBaseText + suffix
    textMetrics(el,newBaseText,newCalText,lineNum,suffix)
  }
}
async function handleObserver (el, binding, maxNum = 0) {
  // 判断元素能容纳的字数总量并插入省略号
  let { width } = await getComputedStyle(el)
  if(!width || width === 'auto') {
    if(maxNum > 10) return
    const timer = setTimeout(() => {
      maxNum++
      handleObserver (el, binding,maxNum)
      clearTimeout(timer)
    }, 1000)
  }
  const baseText = el.$originText
  const lineNum = Number(binding.value) || 2
  const suffix = '...'+el.$originText.slice(-4)
  textMetrics(el,baseText,null,lineNum,suffix)
}
function setText(el, binding) {
  let baseWidth
  el.$originText = el.innerText
  let timer
  handleObserver (el, binding)
  // 绑定 ResizeObserver 监听元素尺寸修改
  let ResizeObserver = window.ResizeObserver
  el.$observer = new ResizeObserver((entries) => {
    if(timer) clearTimeout(timer)
    setTimeout(() => {
      if (baseWidth && entries[0] && baseWidth < entries[0].contentRect.width) {
        el.innerText = el.$originText
      }
      baseWidth = entries[0] && entries[0].contentRect.width
      handleObserver (el, binding)
    },300)
  })
  el.$observer.observe(el)
}
const ellipsisDirective = {
  bind: setText
}
const permissionDirective = {
  bind: function(el, binding) {
    if (!hasPermission(binding.value)) {
      el.parentNode.removeChild(el)
    }
  }
}
const DIRECTIVE = {
  install(Vue) {
    Vue.directive('permission', permissionDirective)
    Vue.directive('ellipsis', ellipsisDirective)
    Vue.prototype.$hasPermission = hasPermission
  }
}

export default DIRECTIVE
