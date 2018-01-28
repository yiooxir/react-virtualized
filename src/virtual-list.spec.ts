import { VirtualList } from "./virtual-list";
import { expect } from 'chai'
import { sandbox } from 'sinon'

describe('toMetaMap', () => {
  const inst = new VirtualList({})
  inst.metaMap = {1: 1, 2: 2, 3: 3}

  it('Should return correct slice', () => {
    expect(inst.toMetaMap([{key: 1}, {key: 3}])).to.deep.equal([{1: 1}, {3: 3}])
  })

  it('Should return empty array', () => {
    expect(inst.toMetaMap([{key: 4}, {key: 5}])).to.deep.equal([])
  })
})

describe('recalcCacheAddresses', () => {
  const sb = sandbox.create()
  const inst = new VirtualList({})
  Object.assign(inst, {
    colCount: 2
  })
  before(() => {
    sb.stub(inst, 'recalcCacheHeights')
  })
  after(() => {
    sb.restore()
  })

  it('should set correct addresses for each item', function () {
    inst.metaMap = {1: {height: 5}, 2: {height: 2}, 3: {height: 2}, 4: {height: 2}, 5: {height: 2}}
    inst.recalcCacheAddresses(Object.values(inst.metaMap), true)
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
    inst.recalcCacheAddresses(Object.values(inst.metaMap), false)
    expect(inst.metaMap[1].address).to.eq(1)
    expect(inst.metaMap[2].address).to.eq(0)
  });
})

describe('recalcCacheHeights', () => {
  const sb = sandbox.create()
  const inst = new VirtualList({})
  Object.assign(inst, {
    colWidth: 100,
    prevColWidth: 80
  })
  before(() => {
    sb.stub(inst, 'recalcCacheOffsets')
  })
  after(() => {
    sb.restore()
  })

  it('should set new height values', function () {
    inst.metaMap = {1: {height: 12}, 2: {height: 20}}
    inst.recalcCacheHeights(Object.values(inst.metaMap))
    expect(inst.metaMap).to.deep.eq({'1': {height: 15}, '2': {height: 25}})
  });

  it('should skip height recalculation when col width has not changed', () => {
    inst.colWidth = 80
    inst.metaMap = {1: {height: 12}, 2: {height: 20}}
    inst.recalcCacheHeights(Object.values(inst.metaMap))
    expect(inst.metaMap).to.deep.eq({'1': {height: 12}, '2': {height: 20}})
  })
})

describe('recalcCacheOffsets', () => {
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
    inst.recalcCacheOffsets()
    expect(inst.metaMap).to.deep.eq(
      {
        '1': {height: 5, address: 0, offsetTop: 5},
        '2': {height: 10, address: 1, offsetTop: 10},
        '3': {height: 15, address: 1, offsetTop: 25},
        '4': {height: 20, address: 0, offsetTop: 25}
      })
  });
})

describe('updateSizesCb', function () {
  const sb = sandbox.create()
  const inst = new VirtualList({})
  before(() => {
    sb.stub(inst, 'recalcCacheAddresses')
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

describe.only('updateRenderTree', function () {
  const sb = sandbox.create()
  const inst = new VirtualList({})
  Object.assign(inst, {
    topLayoutPos: 10,
    bottomLayoutPos: 20,
    startIndex: 0,
    stopIndex: 10,
    colCount: 2
  })
  before(() => {
    sb.stub(inst, 'forceUpdate')
  })
  after(() => {
    sb.restore()
  })

  it('should move all nodes to unsized', function () {
    inst.children = [{key: 1}, {key: 2}, {key: 3}]
    inst.updateRenderTree()
    expect(inst.unsized).to.deep.eq([ { key: 1 }, { key: 2 }, { key: 3 } ])
  })

  it('should move key=2 to renderTree', function () {
    inst.children = [{key: 1}, {key: 2}, {key: 3}]
    inst.metaMap = {2: {height: 1, address: 0, offsetTop: 15}}
    inst.updateRenderTree()
    expect(inst.renderTree[0][0]).to.deep.eq({ key: 2 })
  })

  it('should stack to renderTree by addresses', function () {
      inst.children = [{key: 1}, {key: 2}, {key: 3}, {key: 4}]
      inst.metaMap = {
        1: {height: 1, address: 0, offsetTop: 15},
        2: {height: 1, address: 1, offsetTop: 15},
        3: {height: 1, address: 0, offsetTop: 15},
        4: {height: 1, address: 1, offsetTop: 15}
      }
      inst.updateRenderTree()
      console.log('res', inst.unsized, inst.renderTree)
      expect(inst.renderTree).to.deep.eq([
        [ { key: 1 }, {key: 3} ],
        [ { key: 2 }, {key: 4} ]
      ])
  })
});