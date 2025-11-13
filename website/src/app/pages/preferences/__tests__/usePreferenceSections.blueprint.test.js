import {
  createDefaultBlueprintExpectations,
  createPreferenceSectionsContextManager,
  runDefaultBlueprintScenario as runDefaultBlueprintScenarioHelper,
} from "./preferenceSectionsBlueprintTestkit.js";
import { loadPreferenceSectionsModules } from "../testing/usePreferenceSections.fixtures.js";

let usePreferenceSections;
let ACCOUNT_USERNAME_FIELD_TYPE;
let runDefaultScenario;
let defaultBlueprintExpectations;
let contextManager;

beforeAll(async () => {
  ({ usePreferenceSections, ACCOUNT_USERNAME_FIELD_TYPE } =
    await loadPreferenceSectionsModules());
  contextManager = createPreferenceSectionsContextManager();
  runDefaultScenario = () =>
    runDefaultBlueprintScenarioHelper({
      setupContext: contextManager.setupContext,
      usePreferenceSections,
    });
  defaultBlueprintExpectations = createDefaultBlueprintExpectations({
    ACCOUNT_USERNAME_FIELD_TYPE,
  });
});

afterEach(() => {
  contextManager?.teardown();
});

/**
 * 测试目标：默认渲染时的蓝图应确保导航顺序、账号/订阅分区与响应风格元数据均符合设计文档。
 * 方案拆解：Given/When 阶段通过 runDefaultScenario 统一准备上下文，再使用 test.each 将各个断言主题拆分到独立 Then helper 中。
 * 断言：
 *  - general 领衔导航；
 *  - account section 注入身份与绑定信息；
 *  - subscription section 提供预期套餐；
 *  - response style section 填充表单文案与默认值；
 *  - avatar editor 与 toast 元数据符合默认值。
 */
describe("default preference sections blueprint", () => {
  test.each(defaultBlueprintExpectations)(
    "Given default sections When reading blueprint Then $expectation",
    async ({ assertThen }) => {
      const scenario = await runDefaultScenario();
      await assertThen(scenario);
    },
  );
});
