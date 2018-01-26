import React, { Component } from "react";
import { normalizeCount, toIndex } from "./utils";
import { WithSizeNs } from "./interfaces";
import { PropTypes } from "./prop-types";
import { BASE_WIDTH, SCROLL_DIR } from "./const";
import { SizeBuffer } from "./virtual-size-buffer";
import { VirtualList } from "./virtual-list";
import { VIRTUAL_THRESHOLD } from "./const";

/**
 * @decorator withSize
 *
 * - Manage children container dimensions
 * Doesn't render children that has not been sized yet.
 *
 * - Manage optimal containers width
 * Needs to fill all parent box evenly.
 *
 * - Manage Resize Parent Box event
 * Recalculate optimal width, Resize containers
 */
const withSize = (Enhanced): any => {
  class Wrap extends Component<WithSizeNs.Props, WithSizeNs.State> {
    private enhancedDOMRef: HTMLDivElement
    private enhancedComponentRef: VirtualList
    private sizeBufferDOMRef: HTMLDivElement
    private scrollDOMRef: null
    private unstableSizes: boolean = true
    private indexesToRemove: Array<string> = []
    private scrollDirection: SCROLL_DIR
    private renderList: Array<any> = []
    private reduceTimeout: any
    private reduceIndexes: Array[]
    private reduceDirection: number

    static childContextTypes = {
      scrollDOMRef: PropTypes.HTMLElement,
      virtual: PropTypes.Boolean,
      getTopVirtualLevel: () => null,
      getBottomVirtualLevel: () => null,
      getIndex: () => null
    }

    state = {
      width: BASE_WIDTH,
      count: 0,
      sizes: {},
      firstVirtualIndex: 0,
      lastVirtualIndex: 10
    }

    componentWillMount() {
      this.renderList = Array.from((this.props.children as any)).slice(this.firstIndex, this.renderCount)
    }

    componentWillReceiveProps(nextProps) {
      this.renderList = Array.from(nextProps.children).slice(this.firstIndex, this.renderCount)
    }

    get hasMore(): boolean {
      return React.Children.count(this.props.children) >= this.state.lastVirtualIndex
    }

    get firstIndex(): number {
      return this.state.firstVirtualIndex
    }

    get lastIndex(): number {
      return this.state.lastVirtualIndex
    }

    get topLevel(): number {
      if (!this.scrollDOMRef) {
        console.warn(`#getTopVirtualLevel: scrollDOMRef is undefined`)
        return
      }
      const ref: any = this.scrollDOMRef
      return ref.scrollTop - VIRTUAL_THRESHOLD
    }

    get bottomLevel(): number {
      const ref: any = this.scrollDOMRef
      return this.getTopVirtualLevel() + ref.clientHeight + VIRTUAL_THRESHOLD
    }

    get renderCount(): number {
      return this.lastIndex - this.firstIndex
    }
    // get readyToRender(): boolean {
    //   return true
    // }

    set sizes(sizes) {
      this.setState({...this.state.sizes, ...sizes})
    }

    set indexToRemove(indexes) {
      let propName, value
      switch (this.scrollDirection) {
        case SCROLL_DIR.TOP:
          propName = 'lastVirtualIndex'
          value = Math.min(indexes)
          break
        case SCROLL_DIR.BOTTOM:
          propName = 'firstVirtualIndex'
          value = Math.max(indexes)
          break
      }

      this.state[propName] !== value && this.setState({ [propName]: value })
    }

    shiftBottom(step): number {
      const res = this.lastIndex + step
      const total = React.Children.count(this.props.children)
      return res >= total ? total : res
    }

    shiftTop(step): number {
      const res = this.firstIndex - step
      return res <= 0 ? 0 : res
    }

    toKey = (node) => {
      return node.key.substr(2)
    }

    getIndex = (node): number => {
      let i = 0
      for(let e of this.renderList) {
        if (e.key === this.toKey(node)) break;
        i++
      }

      console.warn('>>>>>!!!', i)
      return i
    }

    reduceVirtualTree(direction, node) {

    }

    getMore(direction: SCROLL_DIR): void {
      switch (direction) {
        case SCROLL_DIR.TOP:
          this.firstIndex !== 0 && this.setState({ firstVirtualIndex: this.shiftTop(10) })
          break
        case SCROLL_DIR.BOTTOM:
          this.hasMore && this.setState({ lastVirtualIndex: this.shiftBottom(10) })
          break
      }
    }

    getChildContext() {
      return {
        getIndex: this.getIndex,
        scrollDOMRef: this.scrollDOMRef,
        virtual: this.props.virtual,
        getTopVirtualLevel: this.getTopVirtualLevel,
        getBottomVirtualLevel: this.getBottomVirtualLevel
      };
    }

    getPropsByKey(key) {
      return this.state.sizes[key]
    }

    getTopVirtualLevel() {
      if (!this.scrollDOMRef) {
        console.warn(`#getTopVirtualLevel: scrollDOMRef is undefined`)
        return
      }
      const ref: any = this.scrollDOMRef
      return ref.scrollTop - VIRTUAL_THRESHOLD

    }

    getBottomVirtualLevel() {
      const ref: any = this.scrollDOMRef
      return this.getTopVirtualLevel() + ref.clientHeight + VIRTUAL_THRESHOLD
    }

    componentDidMount() {
      this.scrollDOMRef = document.querySelector(this.props.scrollSelector)

      /* Width of the parent container.
       * It's the container where target list will be displayed. */
      const clientWidth = this.sizeBufferDOMRef.clientWidth
      /* Min count of container which can be placed at line in the parent box. */
      const count = normalizeCount(Math.floor(clientWidth / this.props.baseWidth || BASE_WIDTH), {
        max: this.props.maxCount,
        min: this.props.minCount

      })
      /* Optimal container width. */
      const width = clientWidth / count

      this.setState({width, count})
    }

    render() {
      console.count('vs dec')
      /* List of the Elements (children) that have been sized. */
      const sized = []
      /* List of the Elements (children) that have not been sized yet. */
      const unsized = []

      /* Split children by two array: @sized & @unsized */
      this.renderList.forEach((e: any) => {
          if (!e.key) return
          e.key in this.state.sizes ? sized.push(e) : unsized.push(e)
      })

      return [
        this.scrollDOMRef ? <Enhanced
          key={ 'main_port' }
          ref={ el => this.enhancedComponentRef = el }
          wrapRef={ (el) => this.enhancedDOMRef = el }
          options={ this.state }
          { ...this.props }
        >
          { sized }
        </Enhanced> : null,
        <SizeBuffer
          key={ 'size-buffer' }
          sizeBufferDOMRef={ el => this.sizeBufferDOMRef = el }
          onSizes={ (sizes) => this.setState({sizes: {...this.state.sizes, ...sizes}}) }
        >
          { unsized }
        </SizeBuffer>
      ]
    }
  }

  return Wrap
}

export {
  withSize
}
