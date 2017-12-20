import React from 'react'
import ReactDOM from 'react-dom'
import {VirtualList} from "../src/virtual";

const items = Array(50).fill('').map((e, i) => (
  <div
    key={i}
    className='inner'
    style={{height: `${Math.random() * 100 + 30}px`}}>{i}</div>
))

const App = () => (
  <div className="App">
    <div className="wrap">
      <div>hello guys</div>
      <VirtualList
        baseWidth={120}
        maxCount={6}
        minCount={4}
      >
        {items}
      </VirtualList>
    </div>
  </div>
);

ReactDOM.render(<App />, document.getElementById('root'));

// Hot Module Replacement
// if ((module as any).hot) {
//   (module as any).hot.accept();
// }