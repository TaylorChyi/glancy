const MINIMUM_DEPTH = 2;

function createSectionNode(headingNode, depth) {
  const sectionId = headingNode.properties?.id;
  const summaryProperties = { depth };
  if (headingNode.properties?.className) {
    summaryProperties.className = headingNode.properties.className;
  }

  return {
    type: "element",
    tagName: "collapsible-section",
    properties: {
      depth,
      ...(sectionId ? { id: sectionId } : {}),
    },
    children: [
      {
        type: "element",
        tagName: "collapsible-summary",
        properties: summaryProperties,
        children: headingNode.children,
      },
      {
        type: "element",
        tagName: "collapsible-body",
        properties: { depth },
        children: [],
      },
    ],
  };
}

function rehypeCollapsibleSections(options = {}) {
  const minDepth = options.minDepth ?? MINIMUM_DEPTH;

  return function transform(tree) {
    if (!tree || !Array.isArray(tree.children)) return;

    const result = [];
    const stack = [
      {
        depth: 0,
        body: result,
      },
    ];

    const closeToDepth = (targetDepth) => {
      while (stack.length > 1 && stack[stack.length - 1].depth >= targetDepth) {
        stack.pop();
      }
    };

    const appendToCurrent = (node) => {
      stack[stack.length - 1].body.push(node);
    };

    for (const node of tree.children) {
      if (node.type !== "element") {
        appendToCurrent(node);
        continue;
      }

      const match = /^h([1-6])$/.exec(node.tagName ?? "");
      if (!match) {
        appendToCurrent(node);
        continue;
      }

      const depth = Number(match[1]);
      closeToDepth(depth);

      if (depth < minDepth) {
        appendToCurrent(node);
        continue;
      }

      const sectionNode = createSectionNode(node, depth);
      appendToCurrent(sectionNode);
      stack.push({ depth, body: sectionNode.children[1].children });
    }

    tree.children = result;
  };
}

export default rehypeCollapsibleSections;
