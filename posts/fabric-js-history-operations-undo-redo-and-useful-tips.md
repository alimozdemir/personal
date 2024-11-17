---
layout: doc
title: "Fabric.js History Operations (undo, redo) and Useful Tips"
description: "Hello again, today’s subject is a javascript library called Fabric.js. I have worked with this library a couple of times in the past. However, you have to improvise while using the library features for advanced usages. I needed common features for my projects. Such as, history implementation (redo, undo), clipping the canvas, export image with high resolution and so on. I think this blog post will help other people for required such kind of features."
date: "2019-08-15T08:25:21.583Z"
categories: "Javascript"
keywords: "javascript,fabricjs"
thumbnail: '/img/1__yjsrwvoZmyY7RmRBxDt7Mg.png'
---

# Fabric.js History Operations (undo, redo) and Useful Tips

Hello again, today’s subject is a javascript library called Fabric.js. I have worked with this library a couple of times in the past. However, you have to improvise while using the library features for advanced usages. I needed common features for my projects. Such as, history implementation (redo, undo), clipping the canvas, export image with high resolution and so on. I think this blog post will help other people for required such kind of features.

## History

First of all, most required features are undo and redo actions. In fabric.js almost every action is catched with `object:modified`, `object:added` and `object:removed`. Basically, we are keeping the state of the canvas on a stack and redraw the state each time.

```javascript
fabric.Canvas.prototype.historyInit = function () {
  this.historyUndo = [];
  this.historyNextState = this.historyNext();

  this.on({
    "object:added": this.historySaveAction,
    "object:removed": this.historySaveAction,
    "object:modified": this.historySaveAction
  })
}

fabric.Canvas.prototype.historyNext = function () {
  return JSON.stringify(this.toDatalessJSON(this.extraProps));
}

fabric.Canvas.prototype.historySaveAction = function () {
  if (this.historyProcessing)
    return;

  const json = this.historyNextState;
  this.historyUndo.push(json);
  this.historyNextState = this.historyNext();
}

fabric.Canvas.prototype.undo = function () {
  // The undo process will render the new states of the objects
  // Therefore, object:added and object:modified events will triggered again
  // To ignore those events, we are setting a flag.
  this.historyProcessing = true;

  const history = this.historyUndo.pop();
  if (history) {
    this.loadFromJSON(history).renderAll();
  }

  this.historyProcessing = false;
}
```

`historySaveAction` collects the user’s actions into the `historyUndo` stack. However, the events are post-events, because of this we can’t get the current state of the canvas. To solve this problem, we are keeping the current state of the canvas on `historyNextState`variable. And pushing it into the stack when a new event fired.

`undo` function applies the rollback operation on the state popped from the stack. However, during the canvas re-rendering events from the old state will also trigger. These events should not be fired, therefore `historyProcessing` variable will block the new states from getting pushed into the stack.

## npm package

I have created a npm package in order to make it easier to apply the processes we discussed above. Additionally, it includes redo action. You can install the package using with

```shell
npm install fabric-history
```

Import it to a node project with

```js
import 'fabric-history';
```

Then basically you have to initialize it

```js
const canvas = new fabric.Canvas('canvas');  
canvas.historyInit();
```

Finally, you can easily redo and undo with

```js
canvas.undo();  
canvas.redo();
```

### Download the canvas with higher resolution

Second problem I have faced, my canvas had lower resolution than I needed, and I wanted to download the high resolution version of it. There is a built-in solution for this. Basically, you can multiply the canvas while downloading by

```js
canvas.toDataUrl({ multiplier: 3 });
```

Then you can download the 3x canvas.

## Clip canvas

In most cases, I wanted to clip objects with different kind of shapes. HTML5 canvas has a property called `globalCompositeOperation`.

![[global composite operation](https://www.rgraph.net/canvas/reference/globalcompositeoperation.html)](/img/1__yjsrwvoZmyY7RmRBxDt7Mg.png)

[global composite operation](https://www.rgraph.net/canvas/reference/globalcompositeoperation.html)

This is important while clipping a fabric object. Same rules apply here. For example, I have added a rectangle on the canvas. Then, I have set the clipPath property to a group of objects.

```js
var canvas = new fabric.Canvas('canvas')

var rect = new fabric.Rect({
  width: 100,
  height:100,
  fill: 'red',
  left: 100,
  top: 100
});

canvas.add(rect)

var clipGroup = new fabric.Group([
 new fabric.Circle({
    radius: 50,
    left: -50,
    top: -50
  }),
  new fabric.Rect({
    width: 25,
    height: 25,
    left: 0,
    top: 0,
    globalCompositeOperation: 'destination-out'
  })
]);

rect.clipPath = clipGroup;
```

The circle defines the outside border of the rectangle and second rectangle will cut inside of the circle. You can easily set the `globalCompositeOperation` as `destination-out` value. And the result;

![Destination-out](/img/1__uU9cD4GsTzVKbVWe8Mhd4A.png)

You can see an example below:


<iframe width="100%" height="300" src="//jsfiddle.net/almozdmr/yjmx6751/embedded/" allowfullscreen="allowfullscreen" allowpaymentrequest frameborder="0"></iframe>

https://jsfiddle.net/almozdmr/yjmx6751/


## Conclusion

In this blog post, we learned how to use `globalCompositeOperation` with fabric.js’s objects. Additionally, I have published my first npm package under name [fabric-history](https://www.npmjs.com/package/fabric-history).

## UPDATE

I have updated the fabric-history package. `historyInit`function is not necessary anymore. You just import the package and use `undo` , `redo` functions.

**fabric-history** source code

[**alimozdemir/fabric-history**  
_Basic undo and redo prototype implementation on Fabric.js npm i fabric-history Node projects Or html Initialization of…_github.com](https://github.com/alimozdemir/fabric-history "https://github.com/alimozdemir/fabric-history")[](https://github.com/alimozdemir/fabric-history)

## Resources

[**Home**  
_This repo uses Jekyll to serve pages, which can be installed here. Once installed just run the command jekyll serve in…_fabricjs.com](http://fabricjs.com/docs/ "http://fabricjs.com/docs/")[](http://fabricjs.com/docs/)

[**Canvas reference: The globalCompositeOperation property**  
_Summary: The globalCompositeOperation property determines how drawings are added to the canvas. It has a variety of…_www.rgraph.net](https://www.rgraph.net/canvas/reference/globalcompositeoperation.html "https://www.rgraph.net/canvas/reference/globalcompositeoperation.html")[](https://www.rgraph.net/canvas/reference/globalcompositeoperation.html)