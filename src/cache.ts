class DomState {
  private scrollDomRef
  private colCount
  private colWidth
  private lastUpdateHash

  constructor(scrollDOMRef) {

  }

  reindex() {

  }

  setMaxIndex() {

  }

  update(lastIndex) {
    this.updateColParams()
  }

  updateColParams(firstIndex, lastIndex) {
    const newWidth
    const newCount

    if (this.colCount !== newCount) {
      this.colCount = newCount
      this.colWidth = newWidth
      this
    }
  }

  updateAdresses(lastIndex) {
    this.updateHeights()
  }

  updateHeights(lastIndex) {}
  updateOffsets()

  updateOffsets(lastIndex) {

  }
}