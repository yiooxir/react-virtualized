import React, { Component } from "react";
import { normalizeCount } from "./utils";
import { WithSizeNs } from "./interfaces";
import { PropTypes } from "./prop-types";
import { BASE_WIDTH } from "./const";
import { SizeBuffer } from "./virtual-size-buffer";
import { VirtualList } from "./virtual-list";

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
      scrollDOMRef: PropTypes.HTMLElement,
      virtual: PropTypes.Boolean
    }

    state = {
      width: BASE_WIDTH,
      count: 0,
      sizes: {},
    }

    getChildContext() {
      return {
        scrollDOMRef: this.scrollDOMRef,
        virtual: this.props.virtual
      };
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

export {
  withSize
}
