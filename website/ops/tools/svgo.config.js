const config = {
  plugins: [
    { name: "removeDimensions", active: true },
    { name: "removeAttrs", params: { attrs: "(fill|stroke)" } },
    {
      name: "addAttributesToSVGElement",
      params: { attributes: [{ fill: "currentColor" }] },
    },
  ],
};

export default config;
