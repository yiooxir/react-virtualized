import React, { Component } from 'react'
import { VirtualColNs } from "./interfaces"
import { SCROLL_DIR, VIRTUAL_THRESHOLD } from "./const"
import { PropTypes } from "./prop-types"
import { throttle } from 'throttle-debounce'
import { toCount, toIndex } from "./utils"

/**
 * @constructor Virtual Column
 *
 * Provide Render only Elements that are in the Virtual View Port
 */
class VirtualCol extends Component<VirtualColNs.Props> {
  private itemsToRender = this.props.children
  private lastScrollTopPos = 0

  public static contextTypes = {
    scrollDOMRef: PropTypes.HTMLElement || null,
    virtual: PropTypes.Boolean,
    getTopVirtualLevel: () => null,
    getBottomVirtualLevel: () => null
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
    this.updateVirtualParams(this.props, this.context)
    const update = () => this.updateVirtualParams(this.props, this.context)
    this.context.scrollDOMRef.addEventListener(
      'scroll',
      throttle(200, update)
    )
    console.log('>>>>', this.context)
  }

  componentWillReceiveProps(newProps) {
    this.updateVirtualParams(newProps, this.context)
  }

  updateScrollPos(newScrollPos): SCROLL_DIR {
    switch (true) {
      case this.lastScrollTopPos > newScrollPos:
        this.lastScrollTopPos = newScrollPos
        return SCROLL_DIR.TOP

      case this.lastScrollTopPos < newScrollPos:
        this.lastScrollTopPos = newScrollPos
        return SCROLL_DIR.BOTTOM

      default:
        return SCROLL_DIR.NONE
    }
  }

  updateVirtualParams = (props, context) => {
    /* Prevent calculate virtual list if no needed */
    if (!context.virtual) return

    const dir = this.updateScrollPos(context.scrollDOMRef.scrollTop)
    this._updateVirtualParams(props, context, dir)
  }

  _updateVirtualParams(props, context, scrollDirection) {
    const childrenCount = React.Children.count(props.children)
    console.warn(`col ${props.index} children count ${childrenCount}`)
    const arrChildren = React.Children.toArray(props.children)
    const scrollTop = context.scrollDOMRef.scrollTop
    const topLine = scrollTop - VIRTUAL_THRESHOLD
    const bottomLine = scrollTop + context.scrollDOMRef.clientHeight + VIRTUAL_THRESHOLD
    console.log('TOP LINE >>>>', topLine, context.getTopVirtualLevel())
    console.log('BOTTOM LINE >>>>', bottomLine, scrollTop, context.scrollDOMRef.clientHeight, context.getBottomVirtualLevel())

    if (
      this.state.lastIndex === toIndex(childrenCount) &&
      scrollDirection === SCROLL_DIR.BOTTOM
    ) {
      return
    }

    let runPosition = 0
    let offsetTop = 0
    let firstIndex = 0
    let lastIndex = toIndex(childrenCount)

    const getSize = (child): number => props.options.sizes[child.key.substr(2)]

    const matchRunIn = (child, i: number): void => {
      if (getSize(child) + runPosition > topLine) {
        firstIndex = i
        offsetTop = runPosition
        matchFn = matchRunOut
      }
      runPosition += getSize(child)
    }

    const matchRunOut = (child, i: number): void => {
      runPosition += getSize(child)
      if (runPosition > bottomLine) {
        lastIndex = i
        matchFn = null
      }
    }

    let matchFn = matchRunIn

    arrChildren.every((item, i) => {
      matchFn(item, i)
      return !!matchFn
    })


    if (lastIndex === this.state.lastIndex && firstIndex === this.state.firstIndex) return
    this.itemsToRender = arrChildren.slice(firstIndex, toCount(lastIndex))

    this.setState({
      offsetTop,
      firstIndex,
      lastIndex
    })
  }

  render() {
    const {options} = this.props

    if (this.props.index === 0) console.log('-----------------------------')
    console.log(`В ${this.props.index + 1} колонке:`, React.Children.count(this.itemsToRender), `Всего children`, React.Children.count(this.props.children))
    console.log(`firstIndex: ${this.state.firstIndex}, lastIndex: ${this.state.lastIndex}`)
    const style = {
      width: `${options.width}px`,
      transform: `translate(0, ${this.state.offsetTop}px)`
    }

    return (
      <div style={ style } className='v_col'>
      { this.itemsToRender }
    </div>
  )
  }
}

export {
  VirtualCol
}
