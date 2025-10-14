import { jest } from "@jest/globals";
import { fireEvent, render, screen } from "@testing-library/react";
import SelectMenu from "../index.jsx";

describe("SelectMenu", () => {
  const options = [
    { value: "default", label: "Default", description: "Cheerful" },
    { value: "listener", label: "Listener", description: "Supportive" },
  ];

  it("renders placeholder and emits selection", () => {
    /**
     * 测试目标：
     *  - 验证在未选择值时展示占位文案，并在选择选项后触发 onChange。
     * 前置条件：
     *  - 提供两条可选项与 placeholder，且 onChange 为 jest mock。
     * 步骤：
     *  1) 渲染组件并确认占位文案可见；
     *  2) 点击触发器展开菜单；
     *  3) 点击第二个选项。
     * 断言：
     *  - onChange 被调用一次且参数为被选中的原始值；
     *  - 菜单关闭后选项不再出现在文档中。
     * 边界/异常：
     *  - 若 options 为空组件应直接返回 null（另行覆盖）。
     */
    const handleChange = jest.fn();
    render(
      <SelectMenu
        options={options}
        placeholder="请选择"
        onChange={handleChange}
      />,
    );

    expect(screen.getByText("请选择")).toBeInTheDocument();

    fireEvent.click(screen.getByRole("button"));
    fireEvent.click(screen.getByRole("menuitemradio", { name: /Listener/ }));

    expect(handleChange).toHaveBeenCalledTimes(1);
    expect(handleChange).toHaveBeenCalledWith("listener");
    expect(
      screen.queryByRole("menuitemradio", { name: /Default/ }),
    ).not.toBeInTheDocument();
  });

  it("shows active label when value provided", () => {
    /**
     * 测试目标：
     *  - 在受控值传入时展示对应标签。
     * 前置条件：
     *  - value 为 "default"，并提供匹配的选项标签。
     * 步骤：
     *  1) 渲染组件；
     *  2) 读取触发器文本。
     * 断言：
     *  - 触发器显示选中标签 "Default"。
     * 边界/异常：
     *  - 若 value 不匹配则回退至 options[0] 或 placeholder（在前一用例已覆盖）。
     */
    render(<SelectMenu options={options} value="default" />);

    expect(screen.getByRole("button")).toHaveTextContent("Default");
  });
});
