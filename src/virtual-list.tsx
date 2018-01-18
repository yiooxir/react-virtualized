import React, { Component } from "react";
import { withSize } from "./virtual-with-size-decorator";
import { VirtualListNs } from "./interfaces";
import { VirtualCol } from "./virtual-column";
import { PropTypes } from "./prop-types";

/**
 * @class VirtualList
 *
 * Split containers into the different columns (Virtual) using optimal Col. height.
 */
@withSize
class VirtualList extends Component<VirtualListNs.Props, VirtualListNs.State> {
  static contextTypes = {
    scrollDOMRef: PropTypes.HTMLElement
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

export {
  VirtualList
}
