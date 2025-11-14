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

function closeToDepth(stack, targetDepth) {
  while (stack.length > 1 && stack[stack.length - 1].depth >= targetDepth) {
    stack.pop();
  }
}

function appendToCurrent(stack, node) {
  stack[stack.length - 1].body.push(node);
}

function rehypeCollapsibleSections(options = {}) {
  const minDepth = options.minDepth ?? MINIMUM_DEPTH;
  return function transform(tree) {
    if (!tree?.children) return;
    const result = [];
    const stack = [{ depth: 0, body: result }];

    for (const node of tree.children) {
      if (node.type !== "element") {
        appendToCurrent(stack, node);
        continue;
      }

      const match = /^h([1-6])$/.exec(node.tagName ?? "");
      if (!match) {
        appendToCurrent(stack, node);
        continue;
      }

      const depth = Number(match[1]);
      closeToDepth(stack, depth);

      if (depth < minDepth) {
        appendToCurrent(stack, node);
        continue;
      }

      const sectionNode = createSectionNode(node, depth);
      appendToCurrent(stack, sectionNode);
      stack.push({ depth, body: sectionNode.children[1].children });
    }
    tree.children = result;
  };
}

export default rehypeCollapsibleSections;
