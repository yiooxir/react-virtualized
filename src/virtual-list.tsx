import React, { Component, ReactChild } from "react";
import { SizeBuffer } from "./virtual-size-buffer";
import { isDef, normalizeCount, sliceRange } from "./utils";
import { BASE_WIDTH, SCROLL_DIR, VIRTUAL_THRESHOLD } from "./const";
import { throttle } from 'throttle-debounce'

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
  key: string
}

const initMetaObject = {
  height: null,
  address: null,
  offsetTop: null,
  hash: null,
  key: null
}

const withSize = (Enhanced): any => {
  class Wrap extends Component<any, any> {
    private itv

    state = {
      // todo вынести в константы
      stopIndex: 100
    }

    componentDidMount() {
      // this.addMore = this.addMore.bind(this)
    }

    _addMore() {

    }

    // todo ввести константу для буфера
    // todo отработать срез при 100 не должно быть вызова setState
    addMore = (index) => {
      if (this.state.stopIndex - +index < 50) {
        console.warn('!!!! increase')
        this.setState({stopIndex: this.state.stopIndex + 100 })
      }
    }

    render() {
      console.warn('increase slice to', this.state.stopIndex)
      return <Enhanced
        { ...this.props }
        hasMore={ (this.props.children.length - 1) >= this.state.stopIndex }
        addMore={ this.addMore }
        children={ sliceRange(this.props.children, 0, this.state.stopIndex) }
      />
    }
  }

  return Wrap
}

@withSize
class VirtualList extends Component<any, any> {
  private scrollDOMRef: HTMLDivElement
  private sizerDOMRef
  private listDOMRef
  private children: Array<any> = []
  private metaMap: { [key: string]: Cache } = {}
  private colCount
  private colWidth
  private prevColWidth
  private lastScrollPos
  private indexes = new Map()

  state = {
    unsized: [],
    tree: []
  }

  componentDidMount() {
    this.scrollDOMRef = document.querySelector(this.props.scrollSelector)

    if (!this.scrollDOMRef) {
      console.warn('Scroll Box is not detected')
    }

    this.scrollDOMRef.addEventListener('scroll', throttle(200, this.rebuildRenderTree))
    this.children = Array.from(this.props.children)
    this.reindex()
    this.updateColParams()
  }

  componentWillReceiveProps(nextProps) {
    console.log('componentWillReceiveProps')
    this.children = Array.from(nextProps.children)
    this.reindex()
    this.updateColParams()
  }

  componentWillUnmount() {

  }

  reindex() {
    this.indexes.clear()
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
    for (let node of nodes) {
      node.key in this.metaMap && res.push(this.metaMap[node.key])
    }
    return res
  }

  getVLParams = () => {
    const threshold = this.props.virtualThreshold || VIRTUAL_THRESHOLD
    const top = this.scrollDOMRef.scrollTop - threshold
    const bottom = this.scrollDOMRef.scrollTop + this.scrollDOMRef.clientHeight + threshold
    const direction = this.scrollDOMRef.scrollTop >= this.lastScrollPos ? SCROLL_DIR.BOTTOM : SCROLL_DIR.TOP
    this.lastScrollPos = this.scrollDOMRef.scrollTop

    return {
      offsetTop: this.sizerDOMRef.ref.offsetTop,
      top: top >= 0 ? top : 0,
      bottom: bottom,
      direction
    }
  }

  // todo при старте приложения отрисовывается одна колонка. потом идет пересчет
  updateColParams(): void {
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

    if (!Object.keys(this.metaMap).length) {
      this.colCount = count
      this.rebuildRenderTree()
      return
    }

    const mmSlice = this.getMetaSlice(this.props.children)

    if (this.colCount != count) {
      this.colCount = count
      this.recalcMetaAddresses(mmSlice, true)
      // return
    }

    if (this.prevColWidth != this.colWidth) {
      this.recalcMetaHeights(mmSlice)
    }

    this.rebuildRenderTree()
  }

  // todo если первый из списка не имеет позиции то встает в 0
  // todo при item.edit меняется адресация уже адресных элементов
  recalcMetaAddresses(metaMapSlice, drop = false) {
    console.count('recalcCacheAddresses with drop', drop)
    // debugger

    if (!this.colCount) {
      console.warn('#recalcMetaAddresses Error: Column count is undefined.')
      return
    }

    metaMapSlice.reduce((res: Array<number>, mm) => {
      if (!drop && isDef(mm.address)) {
        res[mm.address] += mm.height
        return res
      }

      const index = res.indexOf(Math.min(...res)) || 0

      res[index] += mm.height
      mm.address = index
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

    this.rebuildRenderTree()
  }

  getNodeByKey(key) {
    return this.children[this.indexes.get(key)]
  }

  mapToNodes(keys) {
    return keys.map(key => this.getNodeByKey(key))
  }


  // todo реализовать shadow resize когда не надо вызывать ререндер если height не изменился.
  rebuildRenderTree = () => {
    console.count('rebuildRenderTree')
    setTimeout(() => {
      const params = this.getVLParams()
      const tree = Array.from({length: this.colCount}, () => [])
      const unsized = []
      let lastKey = null
      // let max = 0, min = null

      Array.from(this.indexes.keys()).reduce((res, key) => {
        const mm = this.metaMap[key]

        if (!mm || !mm.height) {
          unsized.push(key)
          return res
        }

        mm.offsetTop = res[mm.address]
        res[mm.address] += mm.height

        if (mm.offsetTop + mm.height > params.top && mm.offsetTop < params.bottom) {


          tree[mm.address].push(key)
          lastKey = key
        }

        return res
      }, new Array(this.colCount).fill(0))

      this.props.addMore(this.indexes.get(lastKey))

      this.setState({
        unsized,
        tree
      })
    })
  }

  recalcMetaParams = (sizes, a) => {
    const res = Object.keys(sizes).map(key => {
      const mm = key in this.metaMap ? this.metaMap[key] : {...initMetaObject}
      mm.height = sizes[key]
      mm.key = key
      this.metaMap[key] = mm
      return mm
    })

    this.recalcMetaAddresses(res)
  }

  renderVirtualCol(items, i) {
    const nodes = this.mapToNodes(items)
    const first = items[0]
    const offset = first ? this.metaMap[first].offsetTop : 0
    const style: any = {
      transform: `translate(0, ${offset}px)`,
      alignSelf: 'flex-start'
    }
    style.width = style.maxWidth = style.minWidth = `${this.colWidth}px`

    return (
      <div style={ style } key={ i }>{ nodes }</div>
    )
  }

  render() {
    return (
      [
        <div
          key='layout'
          ref={ el => this.listDOMRef = el }
          style={ {display: 'flex'} }>
          { this.state.tree.map((items, i) => {
            return this.renderVirtualCol(items, i)
          }) }
        </div>,
        <SizeBuffer key='sizer' ref={ el => this.sizerDOMRef = el } onSizes={ this.recalcMetaParams }>
          { this.mapToNodes(this.state.unsized) }
        </SizeBuffer>

      ]
    )
  }
}

export {
  VirtualList
}
