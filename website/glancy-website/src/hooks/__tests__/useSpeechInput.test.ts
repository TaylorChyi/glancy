/* eslint-env jest */
import { renderHook, act } from "@testing-library/react";
import { jest } from "@jest/globals";
import useSpeechInput from "../useSpeechInput";

/**
 * 模拟 SpeechRecognition 实现并验证 Hook 能正确调用和返回识别结果
 */
const recognitionMock: any = {
  start: jest.fn(),
  lang: "",
  interimResults: false,
  maxAlternatives: 1,
  onresult: null,
};

(global as any).webkitSpeechRecognition = function () {
  return recognitionMock;
};

describe("useSpeechInput", () => {
  afterEach(() => {
    recognitionMock.start.mockClear();
    recognitionMock.onresult = null;
  });

  afterAll(() => {
    delete (global as any).webkitSpeechRecognition;
  });

  test("invokes SpeechRecognition and callback", () => {
    const onResult = jest.fn();
    const { result } = renderHook(() => useSpeechInput({ onResult }));

    act(() => {
      result.current.start("en-US");
    });

    expect(recognitionMock.start).toHaveBeenCalled();

    const event = { results: [[{ transcript: "hello" }]] };
    act(() => {
      recognitionMock.onresult(event);
    });
    expect(onResult).toHaveBeenCalledWith("hello");
  });
});
