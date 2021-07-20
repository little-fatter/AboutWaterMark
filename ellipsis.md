今天业务中碰到一个省略中间的文本溢出处理需求，搜索了许久的资料，没有发现相关解决方法，所以在此记录一下。
一开始想要用css实现，最终发现只能实现常见的单行或多行的尾部省略效果，所以采用 js 来实现。因为项目中多采用 vue 的框架，便一同实现了自定义指令方便使用。
#### 思路：根据字体大小、元素宽度和显示的行数计算元素可容纳字数总量，然后截取原始文本超出部分并插入省略号
#### 实现：
```javascript
Vue.directive('ellipsis', {
    bind: function (el, binding) {
    const { width, fontSize } = await getComputedStyle(el)
    const baseText = el.innerText
    const lineDisplayAble = Math.floor(width.slice(0,-2) / fontSize.slice(0,-2))
    const lineNum = Number(binding.value) || 2
    if(baseText.length > lineDisplayAble * lineNum) {
        const moreNum = lineDisplayAble * lineNum - baseText.length
        const content = baseText.slice(0,moreNum - 5 											).concat('...').concat(baseText.substring(baseText.length - 3, baseText.length ))
        el.innerText = content
    }
}
```
到这，基本已经实现了，为了更加完善，实现响应窗口 rezise，在 bind 钩子里绑定了 ResizeObserver，完整代码如下：
```javascript
async function handleObserver (el, binding) {
    // 判断元素能容纳的字数总量并插入省略号
    // 当前仅适用于文本为中文，英文或符号需自行处理
    const { width, fontSize } = await getComputedStyle(el)
    const baseText = el.$originText
    const lineDisplayAble = Math.floor(width.slice(0,-2) / fontSize.slice(0,-2))
    const lineNum = Number(binding.value) || 2
    if(baseText.length > lineDisplayAble * lineNum) {
        const moreNum = lineDisplayAble * lineNum - baseText.length
        const content = baseText.slice(0,moreNum - 5 											).concat('...').concat(baseText.substring(baseText.length - 3, baseText.length 			))
        el.innerText = content
    } else {
        el.innerText = el.$originText
    }
}
function setText(el, binding) {
    el.$originText = el.innerText
    let timer
    handleObserver (el, binding)
    // 绑定 ResizeObserver 监听元素尺寸修改
    let ResizeObserver = window.ResizeObserver
    el.$observer = new ResizeObserver((entries) => {
        if(timer) clearTimeout(timer)
        timer = setTimeout(() => {
            handleObserver (el, binding)
        },300)
    })
    el.$observer.observe(el)
}
Vue.directive('ellipsis', {
    bind: setText,
    unbind: function(el) {
        el.$observer.disconnect()
        el.$observer = null
    }
})
```
### 进阶方案：利用行高解决中英文宽度占比不同的问题

```javascript
/* 
el：DOM 对象
baseText：采用的文本
calText: 截断的文本
lineNum：目标显示行数
suffix：默认后缀
*/
function textMetrics (el,baseText,calText,lineNum,suffix) {
  const { lineHeight, height } = getComputedStyle(el)
  // 二分法增删文本，判断 DOM 行数是否大于目标行数，设置终止条件。 
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
  // 保存原始文本供后续宽度增加回复文本
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
        // 如果宽度增加，初始化文本
      if (baseWidth && entries[0] && baseWidth < entries[0].contentRect.width) {
        el.innerText = el.$originText
      }
      baseWidth = entries[0] && entries[0].contentRect.width
      handleObserver (el, binding)
    },300)
  })
  el.$observer.observe(el)
}
```
