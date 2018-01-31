import { VirtualList } from "./virtual-list";
import { expect } from 'chai'
import { sandbox } from 'sinon'
import { SCROLL_DIR } from "./const";

describe('getMetaSlice', () => {
  const inst = new VirtualList({})
  inst.metaMap = {1: {height: 1}, 2: {height: 2}, 3: {height: 3}}

  it('Should return correct slice', () => {
    expect(inst.getMetaSlice([{key: 1}, {key: 3}])).to.deep.equal([{height: 1}, {height: 3}])
  })

  it('Should return empty array', () => {
    expect(inst.getMetaSlice([{key: 4}, {key: 5}])).to.deep.equal([])
  })
})

describe('recalcMetaAddresses', () => {
  const sb = sandbox.create()
  const inst = new VirtualList({})
  Object.assign(inst, {
    colCount: 2
  })
  before(() => {
    sb.stub(inst, 'recalcMetaHeights')
  })
  after(() => {
    sb.restore()
  })

  it('should set correct addresses for each item', function () {
    inst.metaMap = {1: {height: 5}, 2: {height: 2}, 3: {height: 2}, 4: {height: 2}, 5: {height: 2}}
    inst.recalcMetaAddresses(Object.values(inst.metaMap), true)
    expect(inst.metaMap).to.deep.eq({
      '1': {height: 5, address: 0},
      '2': {height: 2, address: 1},
      '3': {height: 2, address: 1},
      '4': {height: 2, address: 1},
      '5': {height: 2, address: 0}
    })
  })
  it('should skip addressed items when @drop is false', function () {
    inst.metaMap = {1: {height: 5, address: 1}, 2: {height: 5}}
    inst.recalcMetaAddresses(Object.values(inst.metaMap), false)
    expect(inst.metaMap[1].address).to.eq(1)
    expect(inst.metaMap[2].address).to.eq(0)
  });
})

describe('recalcMetaHeights', () => {
  const sb = sandbox.create()
  const inst = new VirtualList({})
  Object.assign(inst, {
    colWidth: 100,
    prevColWidth: 80
  })
  before(() => {
    sb.stub(inst, 'recalcMetaOffsets')
  })
  after(() => {
    sb.restore()
  })

  it('should set new height values', function () {
    inst.metaMap = {1: {height: 12}, 2: {height: 20}}
    inst.recalcMetaHeights(Object.values(inst.metaMap))
    expect(inst.metaMap).to.deep.eq({'1': {height: 15}, '2': {height: 25}})
  });

  it('should skip height recalculation when col width has not changed', () => {
    inst.colWidth = 80
    inst.metaMap = {1: {height: 12}, 2: {height: 20}}
    inst.recalcMetaHeights(Object.values(inst.metaMap))
    expect(inst.metaMap).to.deep.eq({'1': {height: 12}, '2': {height: 20}})
  })
})

describe('recalcMetaOffsets', () => {
  const sb = sandbox.create()
  const inst = new VirtualList({})
  Object.assign(inst, {
    colCount: 2
  })
  before(() => {
    sb.stub(inst, 'updateRenderTree')
  })
  after(() => {
    sb.restore()
  })

  it('should set new offsets', function () {
    inst.metaMap = {
      1: {height: 5, address: 0, offsetTop: 10},
      2: {height: 10, address: 1, offsetTop: 10},
      3: {height: 15, address: 1, offsetTop: 10},
      4: {height: 20, address: 0, offsetTop: 10},
    }
    inst.recalcMetaOffsets()
    expect(inst.metaMap).to.deep.eq(
      {
        '1': {height: 5, address: 0, offsetTop: 0},
        '2': {height: 10, address: 1, offsetTop: 0},
        '3': {height: 15, address: 1, offsetTop: 10},
        '4': {height: 20, address: 0, offsetTop: 5}
      })
  });
})

describe('updateSizesCb', function () {
  const sb = sandbox.create()
  const inst = new VirtualList({})
  before(() => {
    sb.stub(inst, 'recalcMetaAddresses')
  })
  after(() => {
    sb.restore()
  })
  it('should set correct heights at initial phase', function () {
    inst.metaMap = {}
    inst.updateSizesCb({1: 10, 2: 20})
    console.log(inst.metaMap)
  });
});

describe('updateRenderTree', function () {
  const sb = sandbox.create()
  const inst = new VirtualList({})
  Object.assign(inst, {
    startIndex: 0,
    stopIndex: 10,
    colCount: 2
  })

  beforeEach(() => {
    sb.stub(inst, 'forceUpdate')
  })
  afterEach(() => {
    sb.restore()
  })

  it('should move all nodes to unsized', function () {
    sb.stub(inst, 'getVLParams').returns({
      top: 10,
      bottom: 20
    })
    const clock = sb.useFakeTimers()
    inst.children = [{key: 1}, {key: 2}, {key: 3}]
    inst.updateRenderTree()
    clock.tick(1)
    expect(inst.unsized).to.deep.eq([{key: 1}, {key: 2}, {key: 3}])
  })

  it('should move key=2 to renderTree', function () {
    sb.stub(inst, 'getVLParams').returns({
      top: 10,
      bottom: 20
    })
    const clock = sb.useFakeTimers()
    inst.children = [{key: 1}, {key: 2}, {key: 3}]
    inst.metaMap = {2: {height: 1, address: 0, offsetTop: 15}}
    inst.updateRenderTree()
    clock.tick()
    expect(inst.renderTree[0][0]).to.deep.eq({key: 2})
  })

  it('should stack to the renderTree cols by addresses', function () {
    const clock = sb.useFakeTimers()
    // direction = null will case ignoring "need more" calculate
    sb.stub(inst, 'getVLParams').returns({ direction: null })

    inst.children = [{key: 1}, {key: 2}, {key: 3}, {key: 4}]

    inst.metaMap = {
      1: {height: 1, address: 0, offsetTop: 15},
      2: {height: 1, address: 1, offsetTop: 15},
      3: {height: 1, address: 0, offsetTop: 15},
      4: {height: 1, address: 1, offsetTop: 15}
    }

    inst.updateRenderTree()
    clock.tick()
    console.log('res', inst.unsized, inst.renderTree)
    expect(inst.renderTree).to.deep.eq([
      [{key: 1}, {key: 3}],
      [{key: 2}, {key: 4}]
    ])
  })

  it('Should call reduceStartIndex() lack of first element is placed below the top VL', (done) => {
    /* In this test:
     * > Scroll direction goes to the top
     * > metaMap @3 & @ 4 are the first elements in the virtual columns
     * > first elements top edges are lower then the VL.top
     *
     * So: updateRenderTree should call reduceStartIndex() method once
     * */
    inst.colCount = 2
    inst.startIndex = 2
    inst.stopIndex = 5
    inst.children = [{key: 1}, {key: 2}, {key: 3}, {key: 4}, {key: 5}, {key: 6}]
    inst.reindex()
    inst.metaMap = {
      1: {height: 5, address: 0, offsetTop: 10},
      2: {height: 5, address: 0, offsetTop: 15},
      3: {height: 5, address: 0, offsetTop: 15},
      4: {height: 5, address: 1, offsetTop: 20},
      5: {height: 5, address: 1, offsetTop: 20},
      6: {height: 5, address: 1, offsetTop: 20},
    }

    const reduceStartIndex = sb.stub(inst, 'reduceStartIndex')
    sb.stub(inst, 'getVLParams').returns({
      offsetTop: 5,
      top: 5,
      bottom: 100,
      direction: SCROLL_DIR.TOP
    })

    inst.updateRenderTree()
    const updateRenderTree = sb.stub(inst, 'updateRenderTree')

    setTimeout(() => {
      sb.assert.calledOnce(reduceStartIndex)
      sb.assert.calledOnce(updateRenderTree)
      done()
    }, 10)
  })

  it('Should call increaseStopIndex() lack of last element is placed above the bottom VL', (done) => {
    /* In this test:
     * > Scroll direction goes to the bottom
     * > metaMap @3 & @ 4 are the latest elements in the virtual columns
     * > last elements' bottom edges is higher then VL.bottom
     *
     * So: updateRenderTree should call increaseStopIndex() method once
     * */
    inst.colCount = 2
    inst.startIndex = 0
    inst.stopIndex = 3
    inst.children = [{key: 1}, {key: 2}, {key: 3}, {key: 4}, {key: 5}, {key: 6}]
    inst.reindex()
    inst.metaMap = {
      1: {height: 5, address: 0, offsetTop: 10},
      2: {height: 5, address: 0, offsetTop: 15},
      3: {height: 5, address: 0, offsetTop: 15},
      4: {height: 5, address: 1, offsetTop: 20},
      5: {height: 5, address: 1, offsetTop: 20},
      6: {height: 5, address: 1, offsetTop: 20},
    }

    const increaseStopIndex = sb.stub(inst, 'increaseStopIndex')

    sb.stub(inst, 'getVLParams').returns({
      offsetTop: 5,
      top: 0,
      bottom: 50,
      direction: SCROLL_DIR.BOTTOM
    })

    inst.updateRenderTree()
    const updateRenderTree = sb.stub(inst, 'updateRenderTree')

    setTimeout(() => {
      sb.assert.calledOnce(increaseStopIndex)
      sb.assert.calledOnce(updateRenderTree)
      done()
    }, 10)
  })
});