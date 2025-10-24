/**
 * 背景：
 *  - 新一代等待动画以三层波浪圆环表现品牌节奏，需要统一管理多环参数与字符生成逻辑。
 * 目的：
 *  - 通过策略模式集中定义波浪幅度、字符集与旋转速度，保持 Loader 组件的纯渲染职责。
 * 关键决策与取舍：
 *  - 采用可复用的伪随机生成器，为每个圆环提供稳定但不呆板的字符序列；
 *  - 输出纯函数 `composeRingGlyphs` 以便单测覆盖几何计算；
 *  - 将旋转速度与半径等参数冻结，保障未来替换素材时的契约稳定性。
 * 影响范围：
 *  - Loader 组件与等待动画单测依赖此策略，其他模块暂未直接引用。
 * 演进与TODO：
 *  - TODO：按主题/品牌活动扩展字符集与配色映射，或为低性能设备降低字符数量。
 */
const TAU = Math.PI * 2;
const DEG_PER_RAD = 180 / Math.PI;
const PRNG_MODULUS = 2147483647;
const PRNG_MULTIPLIER = 16807;
const FULL_TURN = 360;

const BASE_PARAMETERS = Object.freeze({
  radius: 218,
  count: 3,
  initialRotateY: 10,
  offset: 0.99,
  waveCount: 1,
  speedDegPerSec: 49,
  latitude: 12,
  ripple: 11,
  xScale: 3,
  yScale: 0,
  typeXScale: 0,
  typeYScale: 60,
  weight: 2,
  tweakXRotation: 20,
  tweakYRotation: 45,
  tweakZRotation: 19,
});

const RING_BLUEPRINTS = Object.freeze([
  Object.freeze({
    id: "ring-0",
    startRotation: 0,
    phaseShift: 0,
    offset: BASE_PARAMETERS.offset + 0.12,
    textLength: 16,
    seed: 48611,
  }),
  Object.freeze({
    id: "ring-1",
    startRotation: 120,
    phaseShift: (Math.PI * 2) / 3,
    offset: BASE_PARAMETERS.offset + 0.55,
    textLength: 18,
    seed: 93251,
  }),
  Object.freeze({
    id: "ring-2",
    startRotation: 240,
    phaseShift: (Math.PI * 4) / 3,
    offset: BASE_PARAMETERS.offset + 0.91,
    textLength: 20,
    seed: 125829,
  }),
]);

const CHARSET = Object.freeze(["▍", "▋", "▊", "▉"]);

function assertPositiveInteger(value, message) {
  if (!Number.isInteger(value) || value <= 0) {
    throw new TypeError(message);
  }
}

function normaliseSeed(seed) {
  if (!Number.isFinite(seed)) {
    return 1;
  }
  let normalized = Math.floor(seed) % PRNG_MODULUS;
  if (normalized <= 0) {
    normalized += PRNG_MODULUS - 1;
  }
  return normalized;
}

function createPseudoRandom(seed = 1) {
  let state = normaliseSeed(seed);
  return () => {
    state = (state * PRNG_MULTIPLIER) % PRNG_MODULUS;
    return state / PRNG_MODULUS;
  };
}

function pickCharacter(random) {
  const index = Math.floor(random() * CHARSET.length);
  return CHARSET[index];
}

function buildTextSequence(length, seedOrGenerator) {
  assertPositiveInteger(length, "length 必须为正整数");
  const generator =
    typeof seedOrGenerator === "function"
      ? seedOrGenerator
      : createPseudoRandom(seedOrGenerator);
  let buffer = "";
  for (let index = 0; index < length; index += 1) {
    buffer += pickCharacter(generator);
  }
  return buffer;
}

/**
 * 意图：根据基准参数与环形偏移生成字符节点的 3D 变换矩阵。
 * 输入：文本、覆盖配置（phaseShift/offset/textLength 等），均为有限数值。
 * 输出：包含字符与 transform 字符串的数组，供组件渲染。
 * 流程：
 *  1) 根据字符总数计算等分角度；
 *  2) 按弧度推导波峰位移、纵向/径向偏移与欧拉角；
 *  3) 拼接 transform 字符串并返回。
 * 错误处理：若文本为空，返回空数组；如参数非法由调用者预先校验。
 * 复杂度：O(n)，其中 n 为字符节点总数。
 */
function composeRingGlyphs(text, overrides = {}) {
  if (!text || text.length === 0) {
    return [];
  }
  const config = Object.assign({}, BASE_PARAMETERS, overrides);
  const characters = Array.from(text);
  const totalGlyphs = characters.length * config.count;
  if (totalGlyphs === 0) {
    return [];
  }

  const glyphs = [];
  const step = TAU / totalGlyphs;
  const scaleX = 1 + config.typeXScale / 100;
  const scaleY = 1 + config.typeYScale / 100;

  for (let index = 0; index < totalGlyphs; index += 1) {
    const char = characters[index % characters.length];
    const theta = index * step + (config.phaseShift || 0);
    const wave =
      Math.sin(theta * config.waveCount + (config.offset || 0)) *
      config.ripple;

    const rotateY = theta * DEG_PER_RAD + config.initialRotateY;
    const translateZ = config.radius + wave * config.xScale;
    const translateY = wave * config.latitude;

    const transform =
      `rotateY(${rotateY}deg) translateZ(${translateZ}px) translateY(${translateY}px)` +
      ` rotateX(${config.tweakXRotation}deg) rotateY(${config.tweakYRotation}deg)` +
      ` rotateZ(${config.tweakZRotation}deg) scale(${scaleX}, ${scaleY})`;

    glyphs.push({
      id: `${config.id || "ring"}-${index}`,
      char,
      transform,
    });
  }

  return glyphs;
}

function buildRings(seedOffset = 0) {
  return RING_BLUEPRINTS.map((blueprint, index) => {
    const generator = createPseudoRandom(seedOffset + blueprint.seed + index);
    const text = buildTextSequence(blueprint.textLength, generator);
    return {
      id: blueprint.id,
      glyphs: composeRingGlyphs(text, Object.assign({ id: blueprint.id }, blueprint)),
      fontWeight: BASE_PARAMETERS.weight * 100,
      startRotation: blueprint.startRotation % FULL_TURN,
    };
  });
}

const WAITING_ANIMATION_STRATEGY = Object.freeze({
  baseParameters: BASE_PARAMETERS,
  ringBlueprints: RING_BLUEPRINTS,
  charSet: CHARSET,
  rotationSpeedDegPerSec: BASE_PARAMETERS.speedDegPerSec,
  createPseudoRandom,
  buildTextSequence,
  composeRingGlyphs,
  buildRings,
});

module.exports = WAITING_ANIMATION_STRATEGY;
