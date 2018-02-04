import React, { Component } from "react"
import { SizeBufferNs, Sizes } from "./interfaces"

/**
 * @class SizeBuffer
 *
 * - Provide calculating containers height.
 * Takes children, get children sizes (height) and
 * return it in the callback.
 */
class SizeBuffer extends Component<any> {
  private ref: HTMLDivElement
  private sizes: Sizes = {}

  static defaultProps = {
    onSizes: () => {}
  }

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
        style={ {width: '100%', height: '0', visibility: 'hidden'} }
        ref={ el => {
          this.ref = el;
        } }
      >
        { this.props.children }
      </div>
    )
  }
}

export {
  SizeBuffer
}