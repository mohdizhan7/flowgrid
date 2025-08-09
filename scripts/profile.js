const React = require("react");
const ReactDOMServer = require("react-dom/server");
const { FixedSizeList } = require("react-window");
const { Profiler } = React;

function Plain({ count }) {
  return React.createElement(
    "div",
    null,
    Array.from({ length: count }).map((_, i) =>
      React.createElement("div", { key: i }, `Item ${i}`)
    )
  );
}

function Virtual({ count }) {
  return React.createElement(
    FixedSizeList,
    { height: 500, width: 300, itemCount: count, itemSize: 20 },
    ({ index, style }) =>
      React.createElement("div", { style }, `Item ${index}`)
  );
}

function measure(Component) {
  let total = 0;
  const element = React.createElement(
    Profiler,
    {
      id: "test",
      onRender: (_id, _phase, actualDuration) => {
        total += actualDuration;
      },
    },
    React.createElement(Component, { count: 10000 })
  );
  const start = performance.now();
  ReactDOMServer.renderToString(element);
  return { profiler: total, time: performance.now() - start };
}

const plain = measure(Plain);
const virtual = measure(Virtual);
console.log(JSON.stringify({ plain, virtual }));
