import React, { Component, ReactChild } from "react";
import { SizeBuffer } from "./virtual-size-buffer";
import { isDef, normalizeCount, sliceRange } from "./utils";
import { BASE_WIDTH } from "./const";
//import { withSize } from "./virtual-with-size-decorator";
// import { VirtualListNs } from "./interfaces";
// import { VirtualCol } from "./virtual-column";

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
  private maxIndex = this.stopIndex
  private colCount
  private colWidth
  private prevColWidth
  private renderTree = []
  private unsized = []
  private stableHash
  private scrollDirection
  private scrollTop
  private topLayoutPos
  private bottomLayoutPos
  private indexes
  private pending = true

  // constructor(props, context) {
  //   super(props, context)
  //   this.updateSizesCb.bind(this)
  // }

  componentDidMount() {
    this.scrollDOMRef = document.querySelector(this.props.scrollSelector)
    if (!this.scrollDOMRef) {
      console.warn('Scroll Box is not detected')
    }

    this.children = Array.from((this.props.children as any))
    this.reindex()
    this.updateColParams()
  }

  componentWillReceiveProps(nextProps) {
    this.children = Array.from(nextProps.children)
    this.reindex()
    this.updateColParams()
  }

  componentWillUnmount() {

  }

  reindex() {

  }

  getIndex(key: string): number {
    if (key in this.indexes) {
      return this.indexes[key]
    } else {
      console.warn('Not indexed key received')
      return 0
    }

  }

  toNode(index) {

  }

  getCache(node: ReactChild): Cache {
    return this.metaMap[node.key]
  }

  toMetaMap(nodes: Array<ReactChild>): Array<Cache> {
    const res = []
    for(let node of nodes) {
      node.key in this.metaMap && res.push({[node.key]: this.metaMap[node.key]})
    }
    return res
  }

  updateColParams(): void {
    console.log('updateColParams')
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
      this.updateRenderTree()
      return
    }

    console.log('updateColParams start slicing')
    const mmSlice = this.toMetaMap(sliceRange(this.children, 0, this.maxIndex))

    if (this.colCount != count) {
      this.colCount = count
      // this.recalcCacheAddresses(mmSlice, true)
      // return
    }

    if (this.prevColWidth != this.colWidth) {
      // this.recalcCacheHeights(mmSlice)
    }

    this.updateRenderTree()
  }

  recalcCacheAddresses(metaMapSlice, drop = false) {
    console.log('recalcCacheAddresses with drop', drop)
    // recalc positions from start
    // recalc sizes to index from current last index to render
    // call UMR

    // const slice = this.toMetaMap(sliceRange(this.children, startIndex, stopIndex))
    // console.log('> recalced', slice.length)
    metaMapSlice.reduce((res: Array<number>, mm) => {
      console.log(1, mm)
      if (!drop && mm.address !== null) return res

      const minIndex = res.indexOf(Math.min(...res))
      res[minIndex] += mm.height
      mm.address = minIndex
      return res
    }, new Array(this.colCount).fill(0))

    this.recalcCacheHeights(metaMapSlice)
  }

  recalcCacheHeights(metaMapSlice) {
    console.log('recalcCacheHeights')
    if (this.prevColWidth !== this.colWidth) {
      console.log('recalcCacheHeights')
      const factor = this.colWidth / this.prevColWidth
        metaMapSlice.forEach(mm => mm.height = mm.height * factor)
    }

    this.recalcCacheOffsets()
  }

  recalcCacheOffsets() {
    console.log('recalcCacheOffsets', this.metaMap)
    Object.values(this.metaMap).reduce((res, mm) => {
      mm.offsetTop = res[mm.address] + mm.height
      res[mm.address] += mm.height
      return res
    }, new Array(this.colCount).fill(0))
  //   console.log('recalcCacheOffsets')
  //   // todo учесть распределение по колонкам
  //   const c = this.metaMap
  //   Object.keys(c).reduce((res, next) => {
  //     c[next].offsetTop = res[c[next].pos] || 0
  //     res[c[next].pos] = c[next].height
  //     return res
  //   }, {})
  //
    this.updateRenderTree()
  }

  updateSizesCb = (sizes) => {
    console.log('updateSizesCb', sizes)

    for(let key in sizes) {
      const mm = key in this.metaMap ? this.metaMap[key] : { ...initMetaObject }
      mm.height = sizes[key]
      this.metaMap[key] = mm
    }
    this.recalcCacheAddresses(this.toMetaMap(sliceRange(this.children, this.startIndex, this.stopIndex)))
  }

  shouldGetMore(cacheSlice) {
    // const frontTopItemSlice = stable.slice(0, colCount)
    // if (!shouldUpdate && frontTopItemSlice.every(node => this.toCache(node).offsetTop < topLayoutPos)) {
    //   shouldUpdate = true
    //   this.updateIndex('top')
    // }
    //
    // const frontBottomItemSlice = stable.slice(slice.length - colCount, colCount)
    // if (
    //   !shouldUpdate &&
    //   frontTopItemSlice.every(node => this.toCache(node).offsetTop + this.toCache(node).height > bottomLayoutPos)
    // ) {
    //   shouldUpdate = true
    //   this.updateIndex('bottom')
    // }
    //
    // if (shouldUpdate) {
    //   this.updateRenderTree()
    // }

    return false
  }

  updateRenderTree() {
    console.log('updateRenderTree')
    const unaddressed = []
    const unsized = []
    const stable = []
    const topInvisibleIndices = []
    const bottomInvisibleIndices = []
    const colCount = this.colCount
    const topLayoutPos = this.topLayoutPos
    const bottomLayoutPos = this.bottomLayoutPos

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

    // Reduce Indices Range
    this.renderTree = stable.reduce((res, node) => {
      const ch = this.getCache(node)
      // Add index for removing list if it is invisible

      if ((ch.offsetTop + ch.height) < topLayoutPos) {
        topInvisibleIndices.push(this.getIndex(node.key));
        return res;
      }

      if ((ch.offsetTop > bottomLayoutPos)) {
        bottomInvisibleIndices.push(this.getIndex(node.key));
        return res;
      }

      res[ch.address].push(node)
      return res
    }, Array.from({length: colCount}, () => []))

    // проверка на полное заполнение виртуального лейаута


    this.unsized = unsized
    // this.shouldGetMore(stable)
    this.forceUpdate()
  }

  render() {
    console.log('render')
    // const separated = this.separated()
    // const style: any = {}
    // style.width = style.maxWidth = style.minWidth = `${this.props.options.width}px`
    // style.overflow = 'hidden'
    //
    // return (
    //   <div>123</div>
    // )
    // console.log(123, this.props)
    // console.time('render')
    // const a = this.props.children.slice(0, 5)

    if (this.pending) return (
      <SizeBuffer key='sizer' ref={ el => this.sizerDOMRef = el } />
    )

    return (
      [<div
        key='layout'
        style={ {display: 'flex'} }>
        { this.renderTree.map(cols => {
          cols.map(items => items)
        }) }
      </div>,
        <SizeBuffer key='sizer' ref={ el => this.sizerDOMRef = el } onSizes={ this.updateSizesCb }>
          { this.unsized }
        </SizeBuffer>
      ]
    )
  }
}

export {
  VirtualList
}
