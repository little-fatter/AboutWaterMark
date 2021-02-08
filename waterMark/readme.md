最近，注意到盘古斧的水印，闲来无事，便粗略研究了一番，在此记录下心得。

第一反应水印的生成就是通过定位覆盖在页面之上。但直接覆盖在页面上，就好像一个蒙层，无法触发底下图层的事件，仔细观察发现，有一个 css 属性 -- pointer-events，查阅资料发现，pointer-events CSS 属性指定在什么情况下 (如果有) 某个特定的图形元素可以成为鼠标事件的 target，值none表示鼠标事件“穿透”该元素并且指定该元素“下面”的任何东西。

理清原理，实现起来就简单了。

### div实现水印
首先，生成一个水印块，然后设置透明度和旋转度，最后计算屏幕宽高，生成相应的水印数。

```
<div id="app">
        <div>waterMark</div>
        <div>test</div>
    </div>
    <script>
        function waterCreate(item,attrs) {
            for( let i in attrs ) {
                item['style'][i] = attrs[i]
            }
        }
        const waterWrapper = document.createElement('div')
        waterCreate(waterWrapper,Object.create({
            position: 'fixed',
            inset: '0px',
            overflow: 'hidden',
            display: 'flex',
            opacity: '1',
            'z-index': '999',
            'pointer-events': 'none',
            'flex-wrap': 'wrap',
            top: 0,
            left: 0
        }))    
        const waterWidth = 140;
        const waterHeight = 160;
        const { clientWidth, clientHeight } = document.documentElement || document.body;
        const column = Math.ceil(clientWidth / waterWidth)
        const row = Math.ceil(clientHeight / waterHeight)
        for( let i = 0; i < column * row; i++) {
            const wrap = document.createElement('div')
            wrap.innerHTML = 'myTest'
            waterCreate(wrap,Object.create({
                transform: `rotate(-15deg)`,
                position: 'relative',
                width: `${waterWidth}px`,
                height: `${waterHeight}px`,
                flex: `0 0 ${waterWidth}px`,
                overflow: 'hidden',
                opacity: 0.1,
            }))
            waterWrapper.appendChild(wrap)
        }
        document.body.appendChild(waterWrapper)
    </script>
```
###canvas实现
canvas 实现原理是利用 canvas 绘制一个水印，然后转为 base64 图片，通过 canvas.toDataUrl() 拿到文件流url，然后填充在元素背景中，背景图片属性设为重复。
```
<div id="app">
        <div>waterMark</div>
        <div>test</div>
    </div>
    <script>
        function createAttr(item,attrs) {
            for( let i in attrs ) {
                item['style'][i] = attrs[i]
            }
        }
        function waterCreate() {
            const angle = -30;
            const text = 'myTest';
            const canvas = document.createElement('canvas');
            canvas.width = 140;
            canvas.height = 160;
            const ctx = canvas.getContext('2d');
            ctx.clearRect(0,0,140,160);
            ctx.globalAlpha = 0.1;
            ctx.font = '18px serif';
            ctx.rotate(Math.PI / 180 * angle);
            ctx.fillText(text, 0, 50);
            return canvas.toDataURL();
        }
        const waterMark = document.createElement('div')
        function createWaterMark () {
            createAttr(waterMark,Object.create({
                position: 'fixed',
                top: '0px',
                right: '0px',
                bottom: '0px',
                left: '0px',
                'pointer-events': 'none',
                'background-repeat': 'repeat',
            }))
            waterMark.style.background = `url(${waterCreate()})`
            document.body.appendChild(waterMark)
        }
        createWaterMark ()
    </script>
```
###svg实现
svg 实现原理和 canvas 相同，主要还是生成背景图片，区别在于生成Url的方法不同
```javascript
 function waterCreate () {
                const svgStr = 
                `
                    <svg xmlns="http://www.w3.org/2000/svg" width="140px" height="160px">
                        <text x="0px" y="30px" dy="16px"
                        text-anchor = "start"
                        stroke="#000"
                        stroke-opacity="0.1"
                        fill="none"
                        transform="rotate(-30)"
                        font-weight="100"
                        >
                            myTest
                        </text>
                    </svg> 
                `
                return         `data:image/svg+xml;base64,${window.btoa(unescape(encodeURIComponent(svgStr)))}`
            }
```

但是目前的效果，只需要一点基础的开发调试知识，打开控制台，选中对应元素，直接 delete 就可轻松清除水印，所以需要加一个保护程序。MutationObserver 提供了监视 DOM 树更改的能力，查看 MDN 使用示例
```javascript
// 选择需要观察变动的节点
const targetNode = document.getElementById('some-id');
// 观察器的配置（需要观察什么变动）
const config = { attributes: true, childList: true, subtree: true };
// 当观察到变动时执行的回调函数
const callback = function(mutationsList, observer) {
    // Use traditional 'for loops' for IE 11
    for(let mutation of mutationsList) {
        if (mutation.type === 'childList') {
            console.log('A child node has been added or removed.');
        }
        else if (mutation.type === 'attributes') {
            console.log('The ' + mutation.attributeName + ' attribute was modified.');
        }
    }
};
// 创建一个观察器实例并传入回调函数
const observer = new MutationObserver(callback);
// 以上述配置开始观察目标节点
observer.observe(targetNode, config);
// 之后，可停止观察
observer.disconnect();
```
在这里，我们需要监视水印元素本身是否被删除、水印元素属性或文本是否被篡改以及水印元素的子元素是否变化

```
// 观察器的配置（需要观察什么变动）
const config = { characterData: true, attributes: true, childList: true, subtree: true };
// 当观察到变动时执行的回调函数
const callback = function (mutationsList, observer) {
	for (let mutation of mutationsList) {
		const target = mutation.target
		if( !target || (target !== waterWrapper && target.parentElement !==waterWrapper) ) {
			mutation.removedNodes.forEach(function (item) {
				if (item === waterWrapper) {
					createWaterMark()
				}
			});
			return
		}
		target.parentElement.removeChild(target)
	}
};
// 监听元素
const targetNode = document.body;
// 创建一个观察器实例并传入回调函数
const observer = new MutationObserver(callback);
// 以上述配置开始观察目标节点
observer.observe(targetNode, config);
window.onbeforeunload = function () {
	observer.disconnect()
}
```
至此，对水印元素及其子元素的修改都会触发重新生成水印。当然，做到这一步并非完美，仍然有相应的破解方法：

- 复制 body 元素，并删除原来的 body

- 打开控制台，settings -> Debugger 选中 Disable JavaScript
