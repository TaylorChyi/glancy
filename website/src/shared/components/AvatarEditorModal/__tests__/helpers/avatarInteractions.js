import { act, fireEvent } from "@testing-library/react";

export function loadImage(element, { width, height }) {
  Object.defineProperty(element, "naturalWidth", {
    value: width,
    configurable: true,
  });
  Object.defineProperty(element, "naturalHeight", {
    value: height,
    configurable: true,
  });
  fireEvent.load(element);
}

export function dragViewport(viewport, { from, to, pointerId = 1 }) {
  act(() => {
    fireEvent.pointerDown(viewport, {
      pointerId,
      clientX: from.x,
      clientY: from.y,
    });
    fireEvent.pointerMove(viewport, {
      pointerId,
      clientX: to.x,
      clientY: to.y,
    });
    fireEvent.pointerUp(viewport, { pointerId });
  });
}

function parseTranslate3d(value) {
  const regex = /translate3d\(([-\d.]+)px, ([-\d.]+)px, 0\)/g;
  return Array.from(value.matchAll(regex), ([, x, y]) => ({
    x: Number(x),
    y: Number(y),
  }));
}

function parseScale(value) {
  const match = value.match(/scale\(([-\d.]+)\)/);
  return match ? Number(match[1]) : 1;
}

export function getViewportState(image) {
  const { transform } = image.style;
  return {
    translations: parseTranslate3d(transform),
    scale: parseScale(transform),
  };
}

export function clickButton(element) {
  act(() => {
    fireEvent.click(element);
  });
}
