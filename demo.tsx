import React, { Component } from 'react'
import ReactDOM from 'react-dom'
import { VirtualList } from "./src/virtual-list"
import { action, observable } from "mobx";
import faker from 'faker'
import { isDef } from "./src/utils";
import { observer } from "mobx-react";

class List {
  @observable public items = []

  constructor() {
    this.init()
  }

  static generateItemParams() {
    return {
      id: faker.random.uuid(),
      name: faker.name.findName(),
      height: Math.random() * 300 + 30,
      color: faker.internet.color()
    }
  }

  @action
  init() {
    Array.from({ length: 40 }, () => this.appendOne())
  }

  @action
  appendOne(pos = 0) {
    isDef(pos) ?
      this.items.splice(pos, 0, List.generateItemParams()) :
      this.items.push(List.generateItemParams())
  }

  @action
  appendItems() {

  }

  @action editItem(name) {
    const item = this.getItemByName(name)
    Object.assign(
      item,
      List.generateItemParams(),
      {
        id: item.id,
        name: item.name
      })
  }

  @action
  deleteItem(name) {
    const item = this.getItemByName(name)
    const indexOf = this.items.indexOf(item)
    console.log(indexOf)
    this.items.splice(indexOf, 1 )
  }

  getItemByName(name) {
    return this.items.find(e => e.name === name)
  }
}

const list = new List()
window.l = list


class Item extends Component<any> {
  state = {
    name: this.props.name,
    height: this.props.height,
  }

  render() {
    const { height, color, name, id } = this.props

    const style = {
      height: `${height}px`,
      backgroundColor: color,
      color: 'white'
    }

    return (
      <div
        id={ id }
        onClick={ () => list.editItem(name) }
        className='test-element inner'
        style={ style }>
        name: { this.state.name }
        <button onClick={(event) => {
          event.stopPropagation()
          list.deleteItem(name)
        }}>delete</button>
      </div>
    )
  }
}

@observer
class App extends Component {
  render() {
    return (
      <div className="App">
        <button onClick={ () => list.appendOne(1) }>add item</button>
        <div className="wrap" id='scroll'>
          <div>123</div>
          <VirtualList
            virtual={ true }
            baseWidth={ 120 }
            maxCount={ 2 }
            minCount={ 1 }
            scrollSelector={ '#scroll' }
            virtualThreshold={ 500 }
            hasMore={true}
            loadMore={() => console.log('load more')}
          >
            { list.items.map(e => (<Item {...e} key={e.id} />)) }
          </VirtualList>
        </div>
      </div>
    )
  }

}

ReactDOM.render(<App/>, document.getElementById('root'));
