import React, { Component, ReactChild } from "react";
import { SizeBuffer } from "./virtual-size-buffer";
import { normalizeCount, sliceRange } from "./utils";
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

class VirtualList extends Component<any, any> {
  private scrollDOMRef: HTMLDivElement
  private sizerDOMRef
  private children: Array<any> = []
  private childrenCount: number
  private metaMap: { [key: string]: Cache } = {}
  private startIndex = 0
  private stopIndex = 10
  private colCount
  private colWidth
  private prevColWidth
  private renderTree = []
  private unsized = []
  private stableHash
  private scrollDirection
  private scrollTop
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
    return nodes.reduce((res, node) => {
      const mm = this.getCache(node)
      mm && res.push(mm)
      return res
    }, [])
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

    if (this.colCount != count) {
      this.colCount = count
      this.recalcCacheAddresses(0, this.stopIndex, true)
      return
    }

    if (this.prevColWidth != this.colWidth) {
      this.recalcCacheHeights(0, this.stopIndex)
    }
  }

  recalcCacheAddresses(startIndex, stopIndex, drop = false) {
    console.log('recalcCacheAddresses with drop', drop)
    // recalc positions from start
    // recalc sizes to index from current last index to render
    // call UMR

    const slice = this.toMetaMap(sliceRange(this.children, startIndex, stopIndex))
    console.log('> recalced', slice.length)
    slice.reduce((res: Array<number>, mm) => {
      console.log(1, mm)
      if (!drop && 'address' in mm) return res

      const minIndex = Math.min(...res)
      res[minIndex] += mm.height
      mm.address = minIndex
      return res
    }, new Array(this.colCount).fill(0))

    this.recalcCacheHeights(startIndex, stopIndex)
  }

  recalcCacheHeights(startIndex, stopIndex) {
    if (this.prevColWidth !== this.colWidth) {
      console.log('recalcCacheHeights')
    }

    this.recalcCacheOffsets(startIndex, stopIndex)
  }

  recalcCacheOffsets(startIndex, stopIndex) {
    console.log('recalcCacheOffsets')
    // todo учесть распределение по колонкам
    const c = this.metaMap
    Object.keys(c).reduce((res, next) => {
      c[next].offsetTop = res[c[next].pos] || 0
      res[c[next].pos] = c[next].height
      return res
    }, {})

    this.updateRenderTree()
  }

  updateSizesCb = (sizes) => {
    console.log('updateSizesCb', sizes)
    Object.assign(this.metaMap, sizes)
    for(let key in sizes) this.metaMap[key] = sizes[key]
    this.recalcCacheAddresses(this.startIndex, this.stopIndex)
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
    const unaddressed = []
    const uncached = []
    const cached = []
    const topInvisibleIndices = []
    const bottomInvisibleIndices = []
    const colCount = this.colCount
    const topLayoutPos = 0
    const bottomLayoutPos = 0

    const slice = this.children.slice(this.startIndex, this.stopIndex)

    for (let node of slice) {
      const k = node.key
      if (!(k in this.metaMap)) {
        uncached.push(node);
        continue;
      }

      const ch = this.metaMap[k]

      if (ch.height === undefined) {
        uncached.push(node);
        continue;
      }
      if (ch.address === undefined) {
        unaddressed.push(node);
        continue;
      }
      if (ch.hash !== this.stableHash) {
        uncached.push(node)
      }

      cached.push(cached)
    }

    // Reduce Indices Range
    this.renderTree = cached.reduce((res, node) => {
      const ch = this.getCache(node)
      // Add index for removing list if it is invisible

      if ((ch.offsetTop + ch.height) > topLayoutPos) {
        topInvisibleIndices.push(this.getIndex(node.key));
        return res;
      }

      if ((ch.offsetTop < bottomLayoutPos)) {
        bottomInvisibleIndices.push(this.getIndex(node.key));
        return res;
      }

      res[ch.address].push(node)
      return res
    }, new Array(colCount).fill([]))

    // проверка на полное заполнение виртуального лейаута


    this.unsized = uncached
    console.log(111, uncached)
    // this.shouldGetMore(stable)
    this.forceUpdate()
  }

  render() {
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
