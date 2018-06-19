<template>
    <my-page class="page-editor" title="首页">
        <div class="tool-box">
            <ui-raised-button label="删除" @click="remove" />
        </div>
        <div class="editor-box">
            <div ref="editor" class="editor-content-box"
                 @click="editorClick($event)"
                 @mousedown="editorMouseDown($event)">
                <div ref="parent" id="parent" class="parent"
                     @contextmenu="contextmenu($event)"
                     :style="docStyle"
                    @click="parentClick($event)">
                    <div id="child" class="child"
                         v-for="elem in elems"
                         :style="elemStyle(elem)"
                         :class="elemClass(elem)"
                         @contextmenu.stop="elemContextmenu($event, elem)"
                         @click.stop="elemClick($event, elem)"
                         @dblclick="doubleClick($event, elem)"
                         @mousedown.stop="mouseDown($event, elem)"
                         @mousemove="mouseMove($event, elem)"
                         @mouseup="mouseUp($event, elem)">
                        <div class="mask"></div>
                        <input class="input" v-model="elem.text" v-if="elem.edit" @blur="blur($event, elem)">
                        <span :style="{'line-height': elem.height + 'px'}" v-if="elem.type === 'text' && !elem.edit">{{ elem.text }}</span>
                        <img class="img-content" :src="elem.image" v-if="elem.type === 'image'"/>
                        <handler ref="handler" :data="handlerData" :parentYY="parentY" :parentXX="parentX" v-if="curElem && curElem.id === elem.id" @change="onChange" />
                    </div>
                    <!-- lines -->
                    <div class="lines" v-if="lineVisible">
                        <div class="line-box" :class="lineClass(line)" v-for="line in lines"
                            @mousedown="lineMouseDown($event, line)"
                             :style="lineStyle(line)">
                            <div class="line"></div>
                        </div>
                    </div>
                    <!-- selections -->
                    <div class="doc-resize" @mousedown.stop="resizeDown($event)"></div>
                </div>
                <div class="selection" v-if="selection.visible" :style="selectionStyle"></div>
                <div class="doc-line" :style="docLineStyle" v-if="docLine.visible"></div>
            </div>
        </div>
        <div class="attr-box">
            <div v-if="curElem">
                <div class="form-item">
                    <ui-text-field class="input-small" v-model="curElem.x" label="X" type="number" />
                    <span class="unit mar-r">px</span>
                    <ui-text-field class="input-small" v-model="curElem.y" label="Y" type="number" />
                    <span class="unit">px</span>
                </div>
                <div class="form-item">
                    <ui-text-field class="input-small" v-model="curElem.width" label="宽度" type="number" />
                    <span class="unit mar-r">px</span>
                    <ui-text-field class="input-small" v-model="curElem.height" label="高度" type="number" />
                    <span class="unit">px</span>
                </div>
                <div class="form-item">
                    <ui-text-field class="input-small" v-model="curElem.rotate" label="角度" type="number" />
                    <span class="unit mar-r">°</span>
                    <ui-icon-button tooltip="旋转 90°">
                        <ui-icon value="rotate_90_degrees_ccw" style="transform: scaleX(-1)" @click="rotate90()" />
                    </ui-icon-button>
                    <ui-icon-button icon="flip" tooltip="水平翻转" @click="flipX" />
                    <ui-icon-button tooltip="垂直翻转" @click="flipY">
                        <ui-icon value="flip" style="transform: rotate(-270deg)" />
                    </ui-icon-button>
                </div>
                <div class="form-item">
                    <ui-text-field v-model="curElem.text" label="文本" type="number" />
                </div>
                <ui-raised-button label="删除" @click="remove" />
            </div>
            <br>
            <ui-raised-button label="添加文字" @click="addText" />
            <ui-raised-button label="添加图片" @click="addImage" />
            <div>menuX: {{ menuX }}</div>
            <div>lines.length: {{ lines.length }}</div>
        </div>
        <div class="context-menu" v-if="menuVisible" :style="menuStyle" @click.stop="doNothing">
            <ui-menu>
                <ui-menu-item title="Maps"/>
                <ui-menu-item title="Books"/>
                <ui-menu-item title="清空"/>
                <ui-menu-item title="准线" rightIcon="keyboard_arrow_right">
                    <ui-menu-item title="显示准线" :leftIcon="lineVisible ? 'check' : ''"
                                  :inset="!lineVisible" @click="toggleLineVisible"></ui-menu-item>
                    <ui-divider />
                    <ui-menu-item title="添加垂直准线" inset @click="addVerticalLine" />
                    <ui-menu-item title="添加水平准线" inset @click="addHorizontalLine"/>
                    <ui-divider />
                    <ui-menu-item title="清除辅助线" inset @click="clearLine" />
                </ui-menu-item>
                <ui-menu-item title="粘贴" @click="pasteElem"/>
            </ui-menu>
        </div>
        <div class="context-menu" v-if="itemMenuVisible" :style="itemMenuStyle" @click.stop="doNothing">
            <ui-menu>
                <ui-menu-item title="剪切" @click="cutElem"/>
                <ui-menu-item title="复制" @click="copyElem"/>
                <ui-menu-item title="删除" @click="removeElem"/>
                <ui-menu-item title="顺序" rightIcon="keyboard_arrow_right">
                    <ui-menu-item title="置于顶层" @click="moveIndexTop" />
                    <ui-menu-item title="上升一层" @click="moveIndexUp"/>
                    <ui-menu-item title="下降一层" @click="moveIndexDown" />
                    <ui-menu-item title="移至底层" @click="moveIndexBottom" />
                </ui-menu-item>
            </ui-menu>
        </div>
        <ui-drawer class="layer-box" right :open="layerVisible" :docked="false" @close="toggleLayer()">
            <ui-appbar title="图层"></ui-appbar>
            <ul class="layer-list">
                <li class="item" v-for="elem in elems">
                    {{ elem.text }}
                </li>
            </ul>
        </ui-drawer>
    </my-page>
</template>

<script>
    export default {
        data () {
            return {
                curElem: null,
                data: {
                    version: '1.0.0',
                    info: {
                        width: 400,
                        height: 500
                    }
                },
                elems: [
                    {
                        type: 'text',
                        id: '1',
                        text: '123',
                        x: 0,
                        y: 0,
                        width: 100,
                        height: 100,
                        rotate: 0,
                        scaleX: 1,
                        scaleY: 1
                    },
                    {
                        type: 'text',
                        id: '2',
                        text: '456',
                        x: 0,
                        y: 100,
                        width: 200,
                        height: 100,
                        rotate: 0,
                        scaleX: 1,
                        scaleY: 1
                    },
                    {
                        id: '3',
                        type: 'image',
                        text: '456',
                        x: 100,
                        y: 0,
                        width: 100,
                        height: 100,
                        rotate: 45,
                        scaleX: 1,
                        scaleY: 1,
                        image: 'https://ss0.bdstatic.com/5aV1bjqh_Q23odCf/static/superman/img/logo_top_ca79a146.png'
                    }
                ],
                handlerData: {
                    x: 0,
                    y: 0,
                    width: 100,
                    height: 100
                },
                // context menu
                menuVisible: false,
                menuX: 200,
                menuY: 100,
                // item context menu
                itemMenuVisible: false,
                itemMenuX: 200,
                itemMenuY: 200,
                // lines
                lineVisible: true,
                lines: [
//                    {
//                        type: 'horizontal',
//                        position: 50
//                    },
//                    {
//                        type: 'vertical',
//                        position: 200
//                    }
                ],
                // selection
                selection: {
                    visible: false,
                    x: 50,
                    y: 20,
                    x2: 300,
                    y2: 300
                },
//                docLine: null,
                docLine: {
                    visible: false,
                    x: 100,
                    y: 100,
                    x2: 300,
                    y2: 400
                },
                // 复制粘贴
                copyedElem: null,
                // later
                layerVisible: false,
                page: {
                    menu: [
                        {
                            type: 'icon',
                            icon: 'help',
                            to: '/help'
                        }
                    ]
                }
            }
        },
        computed: {
            docLineStyle() {
                if (!this.docLine) {
                    return {}
                }
                return {
                    top: this.docLine.y + 'px',
                    left: this.docLine.x + 'px',
                    width: (this.docLine.x2 - this.docLine.x) + 'px',
                    height: (this.docLine.y2 - this.docLine.y) + 'px'
                }
            },
            docStyle() {
                return {
                    width: this.data.info.width + 'px',
                    height: this.data.info.height + 'px'
                }
            },
            selectionStyle() {
                return {
                    top: this.selection.y + 'px',
                    left: this.selection.x + 'px',
                    width: (this.selection.x2 - this.selection.x) + 'px',
                    height: (this.selection.y2 - this.selection.y) + 'px'
                }
            },
            menuStyle() {
                return {
                    top: this.menuY + 'px',
                    left: this.menuX + 'px'
                }
            },
            itemMenuStyle() {
                return {
                    top: this.itemMenuY + 'px',
                    left: this.itemMenuX + 'px'
                }
            },
            parentY() {
                return this.$refs.parent.getBoundingClientRect().top
            },
            parentX() {
                return this.$refs.parent.getBoundingClientRect().left
            }
        },
        mounted() {
            this.selectElem(this.elems[1])
//            let $parent = document.getElementById('parent')
//            let $child = document.getElementById('parent')
        },
        destroyed() {
        },
        methods: {
            toggleLayer() {
                this.layerVisible = !this.layerVisible
            },
            toggleLineVisible() {
                this.lineVisible = !this.lineVisible
            },
            clearLine() {
                this.lines = []
            },
            lineStyle(line) {
                if (line.type === 'vertical') {
                    return {
                        left: line.position + 'px'
                    }
                } else {
                    return {
                        top: line.position + 'px'
                    }
                }
            },
            lineClass(line) {
                if (line.type === 'vertical') {
                    return ['line-vertical']
                } else {
                    return ['line-horizontal']
                }
            },
            selectElem(elem) {
                this.curElem = elem
                this.$nextTick(() => {
                    console.log('refs')
                    console.log(this.$refs.handler)
                    this.$refs.handler[0].setData({
                        x: this.curElem.x,
                        y: this.curElem.y,
                        width: this.curElem.width,
                        height: this.curElem.height,
                        rotate: this.curElem.rotate
                    })
                })
//                this.handlerData.x = this.curElem.x
//                this.handlerData.y = this.curElem.y
//                this.handlerData.width = this.curElem.width
//                this.handlerData.height = this.curElem.height
            },
            onChange(data) {
                this.curElem.x = data.x
                this.curElem.y = data.y
                this.curElem.width = data.width
                this.curElem.height = data.height
                this.curElem.rotate = data.rotate
            },
            elemStyle(elem) {
                return {
                    left: elem.x + 'px',
                    top: elem.y + 'px',
                    width: elem.width + 'px',
                    height: elem.height + 'px',
                    transform: `rotate(${elem.rotate || 0}deg) scale(${elem.scaleX || 1}, ${elem.scaleY || 1})`
                }
            },
            elemClass(elem) {
                if (this.curElem && elem.id === this.curElem.id) {
                    return ['active']
                }
                return []
            },
            doubleClick(e, elem) {
//                Vue.set(elem, 'edit', true)
            },
            blur(e, elem) {
                elem.edit = false
            },
            editorClick(e) {
                e.stopPropagation()
                e.preventDefault()
                this.curElem = null
                console.log('点击空白')
                this.menuVisible = false
                this.itemMenuVisible = false
            },
            parentClick(e) {
//                e.stopPropagation()
//                e.preventDefault()
//                this.curElem = null
//                console.log('点击空白')
//                this.menuVisible = false
//                this.itemMenuVisible = false
            },
            elemClick(e, elem) {
                console.log(e)
                console.log('点击了元素' + elem.id)
            },
            editorMouseDown(e) {
                console.log('mouse down')

                this.selection.x = e.pageX - this.$refs.editor.getBoundingClientRect().left
                this.selection.y = e.pageY - this.$refs.editor.getBoundingClientRect().top
//                this.selection.x2 = this.selection.x
//                this.selection.y2 = this.selection.y

                let mouseMove
                let mouseUp
//                let isDown = true
                document.addEventListener('mousemove', mouseMove = e => {
                    this.selection.visible = true
                    this.selection.x2 = e.pageX - this.$refs.editor.getBoundingClientRect().left
                    this.selection.y2 = e.pageY - this.$refs.editor.getBoundingClientRect().top
                })
                document.addEventListener('mouseup', mouseUp = e => {
                    this.selection.visible = false
                    console.log('up')
                    document.removeEventListener('mousemove', mouseMove)
                    document.removeEventListener('mouseup', mouseUp)
                })

            },
            mouseDown(e, elem) {
                this.isDown = true
                this.downX = e.pageX
                this.downY = e.pageY
                this.downElem = elem
                this.selectElem(elem)
                this.originX = elem.x
                this.originY = elem.y
            },
            mouseMove(e, elem) {
                if (this.isDown) {
//                    console.log('move')
//                    this.downElem.x = this.originX + (e.pageX - this.downX)
//                    this.downElem.y = this.originY + (e.pageY - this.downY)
                }
            },
            mouseUp(e, elem) {
                this.isDown = false
            },
            contextmenu(e) {
                console.log('菜单')
                this.menuVisible = true
                this.menuX = e.pageX
                this.menuY = e.pageY
                e.returnValue = false
                let docClick
                document.addEventListener('click', docClick = e => {
                    document.removeEventListener('click', docClick)
                    this.menuVisible = false
                })
                return false
            },
            elemContextmenu(e, elem) {
                console.log('元素菜单')
                this.itemMenuVisible = true
                this.itemMenuX = e.pageX
                this.itemMenuY = e.pageY
                e.returnValue = false
                let docClick
                document.addEventListener('click', docClick = e => {
                    document.removeEventListener('click', docClick)
                    this.itemMenuVisible = false
                })
                this.menuVisible = false
                return false
            },
            cutElem() {
                this.pasteType = 'cut'
                this.copyedElem = this.curElem
                for (let i = 0; i < this.elems.length; i++) {
                    if (this.elems[i].id === this.curElem.id) {
                        this.elems.splice(i, 1)
                        break
                    }
                }
                this.itemMenuVisible = false
            },
            copyElem() {
                this.pasteType = 'copy'
                this.copyedElem = this.curElem
                this.itemMenuVisible = false
            },
            pasteElem() {
                let x = this.copyedElem.x
                let y = this.copyedElem.y
                if (this.pasteType === 'copy') {
                    x += 16
                    y += 16
                }
                // TODO
                this.elems.push({
                    type: this.copyedElem.type,
                    id: new Date().getTime(),
                    text: this.copyedElem.text,
                    x: x,
                    y: y,
                    width: this.copyedElem.width,
                    height: this.copyedElem.height,
                    image: this.copyedElem.image
                })
                this.menuVisible = false
            },
            removeElem() {
                for (let i = 0; i < this.elems.length; i++) {
                    if (this.elems[i].id === this.curElem.id) {
                        this.elems.splice(i, 1)
                        break
                    }
                }
                this.itemMenuVisible = false
            },
            remove() {
                for (let i = 0; i < this.elems.length; i++) {
                    if (this.elems[i].id === this.curElem.id) {
                        this.elems.splice(i, 1)
                        return
                    }
                }
            },
            addText() {
                this.elems.push({
                    id: new Date().getTime(),
                    type: 'text',
                    text: '未命名',
                    x: 0,
                    y: 0,
                    width: 100,
                    height: 100
                })
            },
            addImage() {
                this.elems.push({
                    id: new Date().getTime(),
                    type: 'image',
                    text: '456',
                    x: 100,
                    y: 100,
                    width: 100,
                    height: 100,
                    image: 'https://ss0.bdstatic.com/5aV1bjqh_Q23odCf/static/superman/img/logo_top_ca79a146.png'
                })
            },
            doNothing() {},
            lineMouseDown(e, line) {
                console.log('下')
                console.log(e.pageX)
                let mouseMove
                let mouseUp
//                let isDown = true
                document.addEventListener('mousemove', mouseMove = e => {
                    if (line.type === 'vertical') {
                        line.position = e.pageX - this.$refs.parent.getBoundingClientRect().left
                        console.log(line.position)
                    } else {
                        line.position = e.pageY - this.$refs.parent.getBoundingClientRect().top
                    }
                    console.log('move')
                })
                document.addEventListener('mouseup', mouseUp = e => {
                    console.log('up')
                    document.removeEventListener('mousemove', mouseMove)
                    document.removeEventListener('mouseup', mouseUp)
                })
            },
            resizeDown(e) {
                let downX = e.pageX
                let downY = e.pageY
                let mouseMove
                let mouseUp
//                let isDown = true
                this.docLine.x = this.$refs.parent.getBoundingClientRect().left - this.$refs.editor.getBoundingClientRect().left
                this.docLine.y = this.$refs.parent.getBoundingClientRect().top - this.$refs.editor.getBoundingClientRect().top
                this.docLine.x2 = this.docLine.x + this.data.info.width
                this.docLine.y2 = this.docLine.y + this.data.info.height
                this.docLine.visible = true
                document.addEventListener('mousemove', mouseMove = e => {
                    console.log('moveeeeeeeeeee')
                    this.docLine.x2 = e.pageX - this.$refs.editor.getBoundingClientRect().left
                    this.docLine.y2 = e.pageY - this.$refs.editor.getBoundingClientRect().top
                })
                document.addEventListener('mouseup', mouseUp = e => {
                    console.log('up')
                    document.removeEventListener('mousemove', mouseMove)
                    document.removeEventListener('mouseup', mouseUp)
                    this.docLine.visible = false
                    this.data.info.width = this.docLine.x2 - this.docLine.x
                    this.data.info.height = this.docLine.y2 - this.docLine.y
                })
            },
            addVerticalLine() {
                this.lines.push({
                    type: 'vertical',
                    position: this.menuX - this.$refs.parent.getBoundingClientRect().left
                })
            },
            addHorizontalLine() {
                this.lines.push({
                    type: 'horizontal',
                    position: this.menuY - this.$refs.parent.getBoundingClientRect().top
                })
            },
            moveIndexTop() {
                for (let i = 0; i < this.elems.length; i++) {
                    if (this.elems[i].id === this.curElem.id) {
                        this.elems.splice(i, 1)
                    }
                }
                this.elems.push(this.curElem)
            },
            moveIndexBottom() {
                for (let i = 0; i < this.elems.length; i++) {
                    if (this.elems[i].id === this.curElem.id) {
                        this.elems.splice(i, 1)
                    }
                }
                this.elems.unshift(this.curElem)
            },
            moveIndexUp() {
                let idx
                for (let i = 0; i < this.elems.length; i++) {
                    if (this.elems[i].id === this.curElem.id) {
                        idx = i
                        this.elems.splice(i, 1)
                    }
                }
                this.elems.splice(idx + 1, 0, this.curElem)
            },
            moveIndexDown() {
                let idx
                for (let i = 0; i < this.elems.length; i++) {
                    if (this.elems[i].id === this.curElem.id) {
                        idx = i
                        this.elems.splice(i, 1)
                    }
                }
                this.elems.splice(idx - 1, 0, this.curElem)
            },
            rotate90() {
                this.curElem.rotate = (this.curElem.rotate + 90) % 360
            },
            flipX() {
                this.curElem.scaleX *= -1
            },
            flipY() {
                this.curElem.scaleY *= -1
            }
        }
    }
</script>

<style lang="scss" scoped>

</style>
