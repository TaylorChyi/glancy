import { AST_NODE_TYPES } from "@typescript-eslint/types";

const SHORT_CIRCUIT_OPERATORS = new Set(["&&", "||"]);

const sumChild = (nodeOrNodes, nesting, compute) => {
  if (!nodeOrNodes) {
    return 0;
  }
  if (Array.isArray(nodeOrNodes)) {
    return nodeOrNodes.reduce((total, child) => total + compute(child, nesting), 0);
  }
  if (typeof nodeOrNodes.type === "string") {
    return compute(nodeOrNodes, nesting);
  }
  return 0;
};

const handlers = {
  IfStatement(node, nesting, compute) {
    let complexity = 1 + nesting;
    complexity += compute(node.test, nesting);
    complexity += compute(node.consequent, nesting + 1);
    if (node.alternate) {
      if (node.alternate.type === AST_NODE_TYPES.IfStatement) {
        complexity += compute(node.alternate, nesting);
      } else {
        complexity += compute(node.alternate, nesting + 1);
      }
    }
    return complexity;
  },
  ForStatement(node, nesting, compute) {
    return (
      1 +
      nesting +
      sumChild(node.init, nesting, compute) +
      sumChild(node.test, nesting, compute) +
      sumChild(node.update, nesting, compute) +
      compute(node.body, nesting + 1)
    );
  },
  ForOfStatement(node, nesting, compute) {
    return 1 + nesting + sumChild(node.left, nesting, compute) + compute(node.body, nesting + 1);
  },
  ForInStatement(node, nesting, compute) {
    return 1 + nesting + sumChild(node.left, nesting, compute) + compute(node.body, nesting + 1);
  },
  WhileStatement(node, nesting, compute) {
    return 1 + nesting + compute(node.test, nesting) + compute(node.body, nesting + 1);
  },
  DoWhileStatement(node, nesting, compute) {
    return 1 + nesting + compute(node.body, nesting + 1) + compute(node.test, nesting);
  },
  SwitchStatement(node, nesting, compute) {
    let complexity = 0;
    complexity += compute(node.discriminant, nesting);
    node.cases.forEach((caseNode) => {
      if (caseNode.test) {
        complexity += 1 + nesting;
      }
      complexity += sumChild(caseNode.consequent, nesting + 1, compute);
    });
    return complexity;
  },
  LogicalExpression(node, nesting, compute) {
    const increment = SHORT_CIRCUIT_OPERATORS.has(node.operator) ? 1 + nesting : 0;
    return increment + compute(node.left, nesting) + compute(node.right, nesting);
  },
  ConditionalExpression(node, nesting, compute) {
    return (
      1 +
      nesting +
      compute(node.test, nesting) +
      compute(node.consequent, nesting + 1) +
      compute(node.alternate, nesting + 1)
    );
  },
  CatchClause(node, nesting, compute) {
    return 1 + nesting + compute(node.param, nesting) + compute(node.body, nesting + 1);
  },
  TryStatement(node, nesting, compute) {
    return (
      compute(node.block, nesting) +
      sumChild(node.handler, nesting, compute) +
      sumChild(node.finalizer, nesting, compute)
    );
  },
};

const createCompute = (context) => {
  const visitorKeys = context.sourceCode.visitorKeys;
  const compute = (node, nesting = 0) => {
    if (!node) {
      return 0;
    }
    const handler = handlers[node.type];
    if (handler) {
      return handler(node, nesting, compute);
    }
    const keys = visitorKeys[node.type] ?? [];
    return keys.reduce(
      (total, key) => total + sumChild(node[key], nesting, compute),
      0,
    );
  };
  return compute;
};

export const cognitiveComplexityRule = {
  meta: {
    type: "suggestion",
    docs: {
      description: "Limit cognitive complexity following Sonar S3776 semantics",
    },
    schema: [
      {
        type: "integer",
        minimum: 1,
      },
    ],
    messages: {
      excessive: "Cognitive complexity {{actual}} exceeds allowed maximum {{max}}",
    },
  },
  create(context) {
    const max = context.options[0] ?? 15;
    const compute = createCompute(context);
    const reportIfNecessary = (node) => {
      const body = node.body ?? node.value?.body ?? node;
      const actual = compute(body, 0);
      if (actual > max) {
        context.report({
          node,
          messageId: "excessive",
          data: { actual, max },
        });
      }
    };

    return {
      FunctionDeclaration: reportIfNecessary,
      FunctionExpression: reportIfNecessary,
      ArrowFunctionExpression: reportIfNecessary,
      MethodDefinition(node) {
        reportIfNecessary(node.value);
      },
    };
  },
};
