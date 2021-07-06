function createAttr(item,attrs) {
    for( let i in attrs ) {
        item['style'][i] = attrs[i]
    }
}
const commonAttr = {
    position: 'fixed',
    top: '0px',
    right: '0px',
    bottom: '0px',
    left: '0px',
    pointerEvents: 'none',
    backgroundRepeat: 'repeat',
}