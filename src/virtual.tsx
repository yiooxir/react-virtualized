import React, { Component } from 'react'
import { SizeBufferNs, Sizes, VirtualColNs, VirtualListNs, WithSizeNs } from "src/interfaces";
import { throttle } from 'throttle-debounce'
import { toIndex } from "./utils";

const BASE_WIDTH = 100
const VIRTUAL_THRESHOLD = 50

const ElementType = (props, propName, componentName) => {
  if (props[propName] !== undefined && props[propName] instanceof Element === false) {
    return new Error(
      'Invalid prop `' + propName + '` supplied to' +
      ' `' + componentName + '`. Validation failed.'
    );
  }
}

/**
 * @class SizeBuffer
 *
 * - Provide calculating containers height.
 * Takes children, get children sizes (height) and
 * return it in the callback.
 */
class SizeBuffer extends Component<SizeBufferNs.Props> {
  private ref: HTMLDivElement
  private sizes: Sizes = {}

  componentDidMount() {
    this.getSizes()
  }

  componentDidUpdate() {
    this.getSizes()
  }

  getItemKeyByIndex(index: number): string {
    const key = this.props.children[index].key

    if (!key) {
      console.warn(
        `
        Virtual List Warning: Each Item in the Virtual List should
        have an unique "key" prop.
        `
      )
    }

    return key
  }

  getSizes() {
    Array.from(this.ref.children).forEach((item: HTMLElement, i: number) => {
      this.sizes[this.getItemKeyByIndex(i)] = item.offsetHeight
    })

    !!React.Children.count(this.props.children) && this.props.onSizes(this.sizes)
  }

  render() {
    return (
      <div
        style={ {width: '100%'} }
        ref={ el => {
          this.ref = el;
          this.props.sizeBufferDOMRef(el)
        } }
      >
        { this.props.children }
      </div>
    )
  }
}

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

    static childContextTypes = {
      scrollDOMRef: ElementType
    }

    state = {
      width: BASE_WIDTH,
      count: 0,
      sizes: {},
    }

    getChildContext() {
      return {
        scrollDOMRef: this.scrollDOMRef
      };
    }

    componentDidMount() {
      this.scrollDOMRef = document.querySelector(this.props.scrollSelector)

      /* Width of the parent container.
       * It's the container where target list will be displayed. */
      const clientWidth = this.sizeBufferDOMRef.clientWidth
      /* Min count of container which can be placed at line in the parent box. */
      const count = Math.floor(clientWidth / this.props.baseWidth || BASE_WIDTH)
      /* Optimal container width. */
      const width = clientWidth / count

      this.setState({width, count})
    }

    render() {
      /* List of the Elements (children) that have been sized. */
      const sized = []
      /* List of the Elements (children) that have not been sized yet. */
      const unsized = []

      /* Split children by two array: @sized & @unsized */
      React.Children.forEach(this.props.children, (e: any) => {
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

/**
 * @class VirtualList
 *
 * Split containers into the different columns (Virtual) using optimal Col. height.
 */
@withSize
class VirtualList extends Component<VirtualListNs.Props, VirtualListNs.State> {
  static contextTypes = {
    scrollDOMRef: ElementType || null
  }

  separated() {
    const {count, sizes} = this.props.options
    const separatedElements = Array.from({length: count}, () => []);
    const colTotalHeight = Array.from({length: count}, () => 0)

    React.Children.forEach(this.props.children, (child: any, i: number) => {
      const index = i < count ? i : colTotalHeight.indexOf(Math.min(...colTotalHeight))
      separatedElements[index].push(child)
      colTotalHeight[index] = colTotalHeight[index] + sizes[child.key]
    })

    return separatedElements
  }

  render() {
    const separated = this.separated()
    const style: any = {}
    style.width = style.maxWidth = style.minWidth = `${this.props.options.width}px`
    style.overflow = 'hidden'

    return (
      <div
        style={ {display: 'flex'} }
        ref={ this.props.wrapRef }>
        { Array(this.props.options.count).fill('').map((e, i) => (
          <VirtualCol
            key={ i }
            index={ i }
            options={ this.props.options }
            children={ separated[i] }
          />
        )) }
      </div>
    )
  }
}


/**
 *
 */
class VirtualCol extends Component<VirtualColNs.Props> {
  static contextTypes = {
    scrollDOMRef: ElementType || null
  }

  state = {
    /* Index of the first element that will be rendered */
    firstIndex: 0,
    /* Index of the last element that will be rendered */
    lastIndex: 0,
    /* Shift from the top scroll position, before ones all the elements will not be rendered */
    offsetTop: 0
  }

  componentDidMount() {
    this.updateVirtualParams()
    this.context.scrollDOMRef.addEventListener('scroll', throttle(200, () => this._updateVirtualParams()))
  }

  updateVirtualParams = () => {
    throttle(200, this._updateVirtualParams)
  }

  _updateVirtualParams() {
    let runPosition = 0
    let offsetTop = 0
    let firstIndex = 0
    let lastIndex = toIndex(React.Children.count(this.props.children))
    const scrollTop = this.context.scrollDOMRef.scrollTop
    const topLine = scrollTop - VIRTUAL_THRESHOLD
    const bottomLine = scrollTop + this.context.scrollDOMRef.clientHeight + VIRTUAL_THRESHOLD

    const log = (...args) => {
      !this.props.index && console.log(args)
    }
    console.log('bottom line', bottomLine)
    const getSize = (child) => this.props.options.sizes[child.key.substr(2)]

    const matchRunIn = (child, i) => {
      if (getSize(child) + runPosition > topLine) {
        firstIndex = i
        offsetTop = runPosition
        matchFn = matchRunOut
      }
      runPosition += getSize(child)
    }

    const matchRunOut = (child, i) => {
      runPosition += getSize(child)
      if (runPosition > bottomLine) {
        lastIndex = i
        matchFn = null
      }
    }

    let matchFn = matchRunIn

    // React.Children.forEach(this.props.children, (child, i) => matchFn(child, i))

    React.Children.toArray(this.props.children).every((item, i) => {
      matchFn(item, i)
      return !!matchFn
    })

    log('>> res', firstIndex, lastIndex, offsetTop)
  }

  render() {
    const {options} = this.props
    const style = {
      width: `${options.width}px`
    }

    return (
      <div style={ style } className='v_col'>
        { this.props.children }
      </div>
    )
  }
}

export {
  VirtualList
}
