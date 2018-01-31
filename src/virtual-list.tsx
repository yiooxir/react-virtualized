import React, { Component, ReactChild } from "react";
import { SizeBuffer } from "./virtual-size-buffer";
import { getLast, isDef, normalizeCount, sliceRange } from "./utils";
import { BASE_WIDTH, SCROLL_DIR, VIRTUAL_THRESHOLD } from "./const";
import { throttle } from 'throttle-debounce'
//import { withSize } from "./virtual-with-size-decorator";
// import { VirtualListNs } from "./interfaces";
// import { VirtualCol } from "./virtual-column";
const BATCH_COUNT = 10
/**
 * @class VirtualList
 *
 * Split containers into the different columns (Virtual) using optimal Col. height.
 */
//@withSize

interface Cache {
  height: number
  address: number
  offsetTop: number
  hash: string
}

const initMetaObject = {
  height: null,
  address: null,
  offsetTop: null,
  hash: null
}

class VirtualList extends Component<any, any> {
  private scrollDOMRef: HTMLDivElement
  private sizerDOMRef
  private children: Array<any> = []
  private metaMap: { [key: string]: Cache } = {}
  private startIndex = 0
  private stopIndex = 10
  // todo выставлять maxIndex при скроле, тоб был всегда актуальный
  private maxIndex = this.stopIndex
  private colCount
  private colWidth
  private prevColWidth
  private renderTree = []
  private unsized = []
  private stableHash
  private lastScrollPos
  private indexes = new Map()
  private pending = true
  private unstable = true

  // constructor(props, context) {
  //   super(props, context)
  //   this.updateSizesCb.bind(this)
  // }

  componentDidMount() {
    this.unstable = false
    this.scrollDOMRef = document.querySelector(this.props.scrollSelector)

    if (!this.scrollDOMRef) {
      console.warn('Scroll Box is not detected')
    }

    this.scrollDOMRef.addEventListener('scroll',  throttle(10, this.updateRenderTree))
    this.children = Array.from(this.props.children) //Array.from((this.props.children as any))
    this.reindex()
    this.updateColParams()
  }

  // todo компонент не получает свойства, когда внутренний изменяется через стейт
  componentWillReceiveProps(nextProps) {
    console.log('componentWillReceiveProps')
    this.children = Array.from(this.props.children)
    this.reindex()
    this.updateColParams()
  }

  componentWillUnmount() {

  }

  reindex() {
    this.children.forEach((node, i) => this.indexes.set(node.key, i))
  }

  getIndex(key: string): number {
    if (!this.indexes.has(key)) {
      console.warn('Not indexed key received')
      return 0
    }

    return this.indexes.get(key)
  }

  getMeta(node: ReactChild): Cache {
    return this.metaMap[node.key]
  }

  getMetaSlice(nodes: Array<ReactChild>): Array<Cache> {
    const res = []
    for(let node of nodes) {
      node.key in this.metaMap && res.push(this.metaMap[node.key])
    }
    return res
  }

  getVLParams = () => {
    const threshold = this.props.virtualThreshold || VIRTUAL_THRESHOLD
    const top = this.scrollDOMRef.scrollTop - threshold
    const bottom = this.scrollDOMRef.scrollTop + this.scrollDOMRef.clientHeight + threshold
    const direction = this.scrollDOMRef.scrollTop > this.lastScrollPos ? SCROLL_DIR.BOTTOM : SCROLL_DIR.TOP
    this.lastScrollPos = this.scrollDOMRef.scrollTop

    const res = {
      offsetTop: this.sizerDOMRef.ref.offsetTop,
      top: top >= 0 ? top : 0,
      bottom: bottom,
      direction
    }

    return res
  }

  // todo при старте приложения отрисовывается одна колонка. потом идет пересчет
  updateColParams(): void {
    this.pending = true
    const clientWidth = this.sizerDOMRef.ref.clientWidth


    /* Min count of container which can be placed at line in the parent box. */
    const count = normalizeCount(Math.floor(clientWidth / this.props.baseWidth || BASE_WIDTH), {
      max: this.props.maxCount,
      min: this.props.minCount
    })

    /* Optimal container width. */
    const width = clientWidth / count
    this.prevColWidth = this.prevColWidth === undefined ? width : this.colWidth
    this.colWidth = width

    this.pending = false

    if (!Object.keys(this.metaMap).length) {
      this.colCount = count
      this.updateRenderTree()
      return
    }

    console.warn('updateColParams start slicing')
    const mmSlice = this.getMetaSlice(sliceRange(this.children, 0, this.maxIndex))

    if (this.colCount != count) {
      this.colCount = count
      this.recalcMetaAddresses(mmSlice, true)
      // return
    }

    if (this.prevColWidth != this.colWidth) {
      this.recalcMetaHeights(mmSlice)
    }

    this.updateRenderTree()
  }

  // todo если первый из списка не имеет позиции то встает в 0
  recalcMetaAddresses(metaMapSlice, drop = false) {
    console.count('recalcCacheAddresses with drop', drop)
    // debugger

    if (!this.colCount) {
      console.warn('#recalcMetaAddresses Error: Column count is undefined.')
      return
    }

    metaMapSlice.reduce((res: Array<number>, mm) => {
      if (!drop && isDef(mm.address)) return res

      const minIndex = res.indexOf(Math.min(...res)) || 0
      res[minIndex] += mm.height
      mm.address = minIndex
      return res
    }, new Array(this.colCount).fill(0))

    this.recalcMetaHeights(metaMapSlice)
  }

  recalcMetaHeights(metaMapSlice) {
    console.count('recalcCacheHeights')
    if (this.prevColWidth !== this.colWidth) {
      const factor = this.colWidth / this.prevColWidth
        metaMapSlice.forEach(mm => mm.height = mm.height * factor)
    }

    this.recalcMetaOffsets()
  }

  recalcMetaOffsets() {
    console.count('recalcMetaOffsets')
    Array.from(this.indexes.keys()).reduce((res, key) => {
      const mm =  this.metaMap[key]
      if (!mm) return res

      mm.offsetTop = res[mm.address]
      res[mm.address] += mm.height
      return res
    }, new Array(this.colCount).fill(0))

    console.log('recalcMetaOffsets', this.metaMap)
    this.updateRenderTree()
  }

  updateSizesCb = (sizes, a) => {
    console.warn('updateSizesCb')
    for(let key in sizes) {
      const mm = key in this.metaMap ? this.metaMap[key] : { ...initMetaObject }
      mm.height = sizes[key]
      this.metaMap[key] = mm
    }
    this.recalcMetaAddresses(this.getMetaSlice(sliceRange(this.children, this.startIndex, this.stopIndex)))
  }

  // todo можно отслеживать виртуальный край по врапперу всех колонок, следовательно оптимизировать процесс пересчетов
  updateRenderTree = () => {
    console.count('updateRenderTree')
    console.log(this.metaMap)
    setTimeout(() => {
      console.count('updateRenderTreeAsync')
      // if (this.unstable) return

      const unaddressed = []
      const unsized = []
      const stable = []
      const topInvisibleIndices = []
      const bottomInvisibleIndices = []
      const colCount = this.colCount
      const layoutParams = this.getVLParams()

      console.warn('indeces', this.startIndex, this.stopIndex)
      const slice = this.children.slice(this.startIndex, this.stopIndex)

      for (let node of slice) {
        const k = node.key

        if (!(k in this.metaMap)) {
          unsized.push(node);
          continue;
        }

        const ch = this.metaMap[k]

        if (!isDef(ch.height)) {
          unsized.push(node);
          continue;
        }

        if (!isDef(ch.address)) {
          unaddressed.push(node);
          continue;
        }
        // if (ch.hash !== this.stableHash) {
        //   unsized.push(node)
        // }

        stable.push(node)
      }

      // unaddressed.length && this.recalcMetaAddresses(this.getMetaSlice(unaddressed))

      // Reduce Indices Range
      this.renderTree = stable.reduce((res, node) => {
        const mm = this.getMeta(node)
        // Add index for removing list if it is invisible

        if ((mm.offsetTop + mm.height) < layoutParams.top) {
          topInvisibleIndices.push(this.getIndex(node.key));
          return res;
        }

        if ((mm.offsetTop > layoutParams.bottom)) {
          bottomInvisibleIndices.push(this.getIndex(node.key));
          return res;
        }

        res[mm.address].push(node)
        return res
      }, Array.from({length: colCount}, () => []))

      // console.log('topInvisibleIndices', topInvisibleIndices)
      // console.log('bottomInvisibleIndices', bottomInvisibleIndices)
      this.unsized = unsized

      /* Increase slice range if needed */
      if (!this.unsized.length) {


        let needMore = false

        switch (layoutParams.direction) {
          case SCROLL_DIR.TOP:
            if (!this.isFirstElement(this.children[this.startIndex])) {
              this.renderTree.forEach((col) => {
                if (!col[0]) return
                const mm = this.getMeta(col[0])
                if (mm.offsetTop > layoutParams.top) needMore = true
              })

              if (needMore) {
                this.reduceStartIndex()
                this.updateRenderTree()
              }
            }
            break;

          case SCROLL_DIR.BOTTOM:
            if (!this.isLastElement(this.children[this.stopIndex])) {
              this.renderTree.forEach((col) => {
                const last = getLast<ReactChild>(col)
                if (!last) return
                const mm = this.getMeta(last)
                if (mm.offsetTop + mm.height < layoutParams.bottom) needMore = true
              })

              if (needMore) {
                this.increaseStopIndex()
                this.updateRenderTree()
              }
            }
            break;
        }
      }

      /* Reduce slice range if needed */

      // todo возможно нужно сделать через троттл
      this.forceUpdate()
    })

  }

  renderVirtualCol(items, i) {
    const first = items[0]
    const offset = first ? this.getMeta(first).offsetTop : 0
    const style: any = {
      transform: `translate(0, ${offset}px)`,
      alignSelf: 'flex-start'
    }
    style.width = style.maxWidth = style.minWidth = `${this.colWidth}px`

    return (
      <div style={style} key={i}>{items}</div>
    )
  }

  render() {
    // const separated = this.separated()
    const style: any = {}
    style.width = style.maxWidth = style.minWidth = `${this.colWidth}px`

    // style.overflow = 'hidden'
    //
    // return (
    //   <div>123</div>
    // )
    // console.log(123, this.props)
    // console.time('render')
    // const a = this.props.children.slice(0, 5)

    // if (this.pending) return (
    //   <SizeBuffer key='sizer' ref={ el => this.sizerDOMRef = el } />
    // )

    return (
      [
        <SizeBuffer key='sizer' ref={ el => this.sizerDOMRef = el } onSizes={ this.updateSizesCb }>
          { this.unsized }
        </SizeBuffer>,
        <div
        key='layout'
        style={ {display: 'flex'} }>
        { this.renderTree.map((items, i) => {
          return this.renderVirtualCol(items, i)
          {/*<div style={style} key={i}>{cols.map(items => items)}</div>*/
          }
        }) }
      </div>

      ]
    )
  }

  private isFirstElement(node): boolean {
    return this.children[0] === node
  }

  private reduceStartIndex() {
    const newIndex = this.startIndex - BATCH_COUNT
    return isDef(newIndex) ? newIndex : 0
  }

  private isLastElement(node): boolean {
    return getLast(this.children) === node
  }

  private increaseStopIndex(): void {
    const max = this.children.length - 1
    const res = this.stopIndex + BATCH_COUNT
    this.stopIndex = res > max ? max : res
  }
}

export {
  VirtualList
}
