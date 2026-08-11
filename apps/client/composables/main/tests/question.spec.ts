import { describe, expect, it, vi } from "vitest";

import { isWord, useInput } from "../question";

describe("question", () => {
  it("should parse user input correctly", () => {
    const setInputCursorPosition = () => {};
    const getInputCursorPosition = () => 0;

    const { userInputWords, setInputValue, initialize } = useInput({
      source: () => "i eat",
      setInputCursorPosition,
      getInputCursorPosition,
    });
    initialize();
    setInputValue("i eat");

    expect(userInputWords).toMatchInlineSnapshot(`
      [
        {
          "correct": false,
          "end": 1,
          "id": 0,
          "incorrect": false,
          "isActive": true,
          "position": 0,
          "start": 0,
          "text": "i",
          "userInput": "i",
        },
        {
          "correct": false,
          "end": 5,
          "id": 1,
          "incorrect": false,
          "isActive": false,
          "position": 0,
          "start": 2,
          "text": "eat",
          "userInput": "eat",
        },
      ]
    `);
  });

  it("should filter all symbol", () => {
    const setInputCursorPosition = () => {};
    const getInputCursorPosition = () => 0;
    const { userInputWords, initialize } = useInput({
      source: () => `i " like " the food ?`,
      setInputCursorPosition,
      getInputCursorPosition,
    });

    initialize();
    expect(userInputWords.length).toBe(4);
  });

  it("should find word by id", () => {
    const setInputCursorPosition = () => {};
    const getInputCursorPosition = () => 0;
    const { findWordById, initialize } = useInput({
      source: () => `i " like " the food ?`,
      setInputCursorPosition,
      getInputCursorPosition,
    });
    initialize();

    expect(findWordById(0)?.text).toBe("i");
    expect(findWordById(2)?.text).toBe("like");
    expect(findWordById(4)?.text).toBe("the");
    expect(findWordById(5)?.text).toBe("food");
  });

  it("should be correct when checked the answer", async () => {
    const setInputCursorPosition = () => {};
    const getInputCursorPosition = () => 0;

    const { setInputValue, submitAnswer, initialize } = useInput({
      source: () => "i eat",
      setInputCursorPosition,
      getInputCursorPosition,
    });
    initialize();
    setInputValue("i eat");

    const correctCallback = vi.fn();
    const wrongCallback = vi.fn();
    submitAnswer(correctCallback, wrongCallback);

    expect(correctCallback).toBeCalled();
    expect(wrongCallback).not.toBeCalled();
  });

  it("A full stop at the end of a sentence will be ignored without affecting the result", async () => {
    const setInputCursorPosition = () => {};
    const getInputCursorPosition = () => 0;

    const { setInputValue, submitAnswer, initialize } = useInput({
      source: () => "i eat",
      setInputCursorPosition,
      getInputCursorPosition,
    });

    initialize();
    setInputValue("i eat.");

    const correctCallback = vi.fn();
    const wrongCallback = vi.fn();
    submitAnswer(correctCallback, wrongCallback);

    expect(correctCallback).toBeCalled();
    expect(wrongCallback).not.toBeCalled();
  });

  it.each([
    { source: "the scientific expedition.", input: "the scientific expedition" },
    { source: "the scientific expedition.", input: "the scientific expedition." },
    { source: "is it true?", input: "is it true" },
    { source: "is it true?", input: "is it true?" },
    { source: "watch out!", input: "watch out" },
    { source: "watch out!", input: "watch out!" },
  ])(
    "should be correct when source is '$source' and input is '$input'",
    async ({ source, input }) => {
      const setInputCursorPosition = () => {};
      const getInputCursorPosition = () => 0;

      const { setInputValue, submitAnswer, initialize } = useInput({
        source: () => source,
        setInputCursorPosition,
        getInputCursorPosition,
      });

      initialize();
      setInputValue(input);

      const correctCallback = vi.fn();
      const wrongCallback = vi.fn();
      submitAnswer(correctCallback, wrongCallback);

      expect(correctCallback).toBeCalled();
      expect(wrongCallback).not.toBeCalled();
    },
  );

  it("should be incorrect when checked the answer", async () => {
    const setInputCursorPosition = () => {};
    const getInputCursorPosition = () => 0;

    const { userInputWords, setInputValue, submitAnswer, initialize } = useInput({
      source: () => "i eat",
      setInputCursorPosition,
      getInputCursorPosition,
    });

    initialize();
    setInputValue("i like");

    const correctCallback = vi.fn();
    const wrongCallback = vi.fn();
    submitAnswer(correctCallback, wrongCallback);

    expect(correctCallback).not.toBeCalled();
    expect(wrongCallback).toBeCalled();
    expect(userInputWords[1].incorrect).toBe(true);
  });

  it.each(["i don‘t", "i don’t", "i don“t", `i don"t`, `i don”t`])(
    "should be correct when input '%s'",
    async (input) => {
      const setInputCursorPosition = () => {};
      const getInputCursorPosition = () => 0;

      const { setInputValue, submitAnswer, initialize } = useInput({
        source: () => "i don't",
        setInputCursorPosition,
        getInputCursorPosition,
      });

      initialize();
      setInputValue(input);

      const correctCallback = vi.fn();
      const wrongCallback = vi.fn();
      submitAnswer(correctCallback, wrongCallback);

      expect(correctCallback).toBeCalled();
      expect(wrongCallback).not.toBeCalled();
    },
  );

  it("should be the first word should be active", () => {
    const setInputCursorPosition = () => {};
    const getInputCursorPosition = () => 0;

    const { userInputWords, initialize } = useInput({
      source: () => "i eat",
      setInputCursorPosition,
      getInputCursorPosition,
    });

    initialize();

    expect(userInputWords[0].isActive).toBe(true);
  });

  it("should be the first word should be active", () => {
    const setInputCursorPosition = () => {};
    const getInputCursorPosition = () => 0;

    const { userInputWords, initialize } = useInput({
      source: () => "i eat",
      setInputCursorPosition,
      getInputCursorPosition,
    });
    initialize();

    expect(userInputWords[0].isActive).toBe(true);
  });

  it("should be changed the activated word based on the user's input", () => {
    const setInputCursorPosition = () => {};
    const getInputCursorPosition = vi.fn();

    const { userInputWords, setInputValue, initialize } = useInput({
      source: () => "i eat",
      setInputCursorPosition,
      getInputCursorPosition,
    });
    initialize();

    getInputCursorPosition.mockReturnValue(1);
    setInputValue("i");
    expect(userInputWords[0].isActive).toBe(true);

    getInputCursorPosition.mockReturnValue(2);
    setInputValue("i ");
    expect(userInputWords[1].isActive).toBe(true);

    getInputCursorPosition.mockReturnValue(3);
    setInputValue("i e");
    expect(userInputWords[1].isActive).toBe(true);

    getInputCursorPosition.mockReturnValue(3);
    setInputValue("iea");
    expect(userInputWords[0].isActive).toBe(true);
  });

  it("should be cleared the first incorrect word", async () => {
    const setInputCursorPosition = () => {};
    const getInputCursorPosition = () => 0;

    const { setInputValue, userInputWords, submitAnswer, fixIncorrectWord, initialize } = useInput({
      source: () => "i eat",
      setInputCursorPosition,
      getInputCursorPosition,
    });

    initialize();
    setInputValue("he eat");
    submitAnswer();
    await fixIncorrectWord();

    expect(userInputWords[0].userInput).toBe("");
    expect(userInputWords[0].isActive).toBe(true);
  });

  it("should be cleared the first incorrect word when press submit again", async () => {
    const setInputCursorPosition = () => {};
    const getInputCursorPosition = () => 0;

    const { setInputValue, userInputWords, submitAnswer, fixIncorrectWord, initialize } = useInput({
      source: () => "i eat",
      setInputCursorPosition,
      getInputCursorPosition,
    });

    initialize();
    setInputValue("he eat");
    submitAnswer();
    await fixIncorrectWord();

    // to next world by input Space
    setInputValue(" ");
    // again submit
    submitAnswer();
    await fixIncorrectWord();

    expect(userInputWords[0].isActive).toBe(true);
  });

  it("should be possible to clear out the wrong words in turn", async () => {
    const setInputCursorPosition = () => {};
    const getInputCursorPosition = () => 0;

    const { setInputValue, userInputWords, submitAnswer, fixIncorrectWord, initialize } = useInput({
      source: () => "i eat apple",
      setInputCursorPosition,
      getInputCursorPosition,
    });

    initialize();
    setInputValue("he eats a");
    submitAnswer();

    await fixIncorrectWord();

    expect(userInputWords[0].userInput).toBe("");
    expect(userInputWords[0].isActive).toBe(true);

    await fixIncorrectWord();

    expect(userInputWords[1].userInput).toBe("");
    expect(userInputWords[1].isActive).toBe(true);

    await fixIncorrectWord();

    expect(userInputWords[2].userInput).toBe("");
    expect(userInputWords[2].isActive).toBe(true);
  });

  it("should prevent move", () => {
    const setInputCursorPosition = () => {};
    const getInputCursorPosition = () => 0;

    const { setInputValue, handleKeyboardInput, initialize } = useInput({
      source: () => "i eat apple",
      setInputCursorPosition,
      getInputCursorPosition,
    });

    initialize();
    setInputValue("i ea ap");

    // move to left
    const preventDefaultLeft = vi.fn();
    handleKeyboardInput({
      code: "ArrowLeft",
      preventDefault: preventDefaultLeft,
    } as any as KeyboardEvent);
    expect(preventDefaultLeft).toBeCalled();

    // move to right
    const preventDefaultRight = vi.fn();
    handleKeyboardInput({
      code: "ArrowLeft",
      preventDefault: preventDefaultRight,
    } as any as KeyboardEvent);
    expect(preventDefaultRight).toBeCalled();
  });

  it("should prevent space when fix input", async () => {
    const setInputCursorPosition = () => {};
    const getInputCursorPosition = () => 0;

    const { setInputValue, submitAnswer, fixIncorrectWord, handleKeyboardInput, initialize } =
      useInput({
        source: () => "i eat apple",
        setInputCursorPosition,
        getInputCursorPosition,
      });

    initialize();
    setInputValue("i ea ap");
    submitAnswer();
    await fixIncorrectWord();

    const preventDefault = vi.fn();
    handleKeyboardInput({
      code: "Space",
      preventDefault,
    } as any as KeyboardEvent);

    expect(preventDefault).toBeCalled();
  });

  it("should prevent backspace when fix input", async () => {
    const setInputCursorPosition = () => {};
    const getInputCursorPosition = () => 0;

    const { setInputValue, submitAnswer, fixIncorrectWord, handleKeyboardInput, initialize } =
      useInput({
        source: () => "i eat apple",
        setInputCursorPosition,
        getInputCursorPosition,
      });

    initialize();
    setInputValue("i ea apple");
    submitAnswer();
    await fixIncorrectWord();

    const preventDefault = vi.fn();
    handleKeyboardInput({
      code: "Backspace",
      preventDefault,
    } as any as KeyboardEvent);

    expect(preventDefault).toBeCalled();
  });

  it("should prevent space when focus on last word", async () => {
    const setInputCursorPosition = () => {};
    const getInputCursorPosition = vi.fn();

    const { setInputValue, handleKeyboardInput, initialize } = useInput({
      source: () => "i eat apple",
      setInputCursorPosition,
      getInputCursorPosition,
    });

    initialize();
    const inputValue = "i eat apple";
    getInputCursorPosition.mockReturnValue(inputValue.length);
    setInputValue(inputValue);

    const preventDefault = vi.fn();
    const stopPropagation = vi.fn();
    handleKeyboardInput({
      code: "Space",
      preventDefault,
      stopPropagation,
    } as any as KeyboardEvent);

    expect(preventDefault).toBeCalled();
    expect(stopPropagation).toBeCalled();
  });

  it("should back to previous incorrect word", async () => {
    let getInputCursorPosition = () => 0;
    let setInputCursorPosition = () => {};

    const {
      userInputWords,
      setInputValue,
      submitAnswer,
      activePreviousIncorrectWord,
      fixIncorrectWord,
      initialize,
    } = useInput({
      source: () => "i eat apple",
      setInputCursorPosition,
      getInputCursorPosition,
    });

    initialize();
    setInputValue("he eat banana");
    submitAnswer();

    await fixIncorrectWord();
    setInputValue("a");
    await fixIncorrectWord();

    await activePreviousIncorrectWord();

    expect(userInputWords[0].isActive).toBe(true);
    expect(userInputWords[0].userInput).toBe("a");
  });

  it("should submit answer when enable use space", () => {
    const setInputCursorPosition = () => {};
    const getInputCursorPosition = vi.fn();

    const { setInputValue, handleKeyboardInput, initialize } = useInput({
      source: () => "i eat apple",
      setInputCursorPosition,
      getInputCursorPosition,
    });

    initialize();
    const inputValue = "i eat apple";
    getInputCursorPosition.mockReturnValue(inputValue.length);
    setInputValue(inputValue);

    const submitAnswerCallback = vi.fn();

    handleKeyboardInput(
      {
        code: "Space",
        preventDefault: () => {},
        stopPropagation: () => {},
      } as any as KeyboardEvent,
      {
        useSpaceSubmitAnswer: {
          enable: true,
          rightCallback: submitAnswerCallback,
        },
      },
    );

    expect(submitAnswerCallback).toBeCalled();
  });

  it("should submit answer when enable use space and fix the last incorrect word", async () => {
    const setInputCursorPosition = () => {};
    const getInputCursorPosition = vi.fn();

    const {
      setInputValue,
      userInputWords,
      submitAnswer,
      fixIncorrectWord,
      handleKeyboardInput,
      initialize,
    } = useInput({
      source: () => "i eat apple",
      setInputCursorPosition,
      getInputCursorPosition,
    });

    initialize();
    const inputValue = "i e apple";
    getInputCursorPosition.mockReturnValue(inputValue.length);
    setInputValue(inputValue);
    submitAnswer();

    await fixIncorrectWord();

    expect(userInputWords[1].userInput).toBe("");
    expect(userInputWords[1].isActive).toBe(true);

    getInputCursorPosition.mockReturnValue(2);
    userInputWords[1].userInput = "eat";

    const submitAnswerCallback = vi.fn();
    handleKeyboardInput(
      {
        code: "Space",
        preventDefault: () => {},
        stopPropagation: () => {},
      } as any as KeyboardEvent,
      {
        useSpaceSubmitAnswer: {
          enable: true,
          rightCallback: submitAnswerCallback,
        },
      },
    );

    expect(submitAnswerCallback).toBeCalled();
  });

  describe("input change call back", () => {
    it("should trigger when input regular character", () => {
      const setInputCursorPosition = () => {};
      const getInputCursorPosition = vi.fn();
      const inputChangedCallback = vi.fn();

      const { setInputValue, handleKeyboardInput, initialize } = useInput({
        source: () => "i eat apple",
        setInputCursorPosition,
        getInputCursorPosition,
        inputChangedCallback,
      });

      initialize();
      const inputValue = "i eat ap";
      getInputCursorPosition.mockReturnValue(inputValue.length);
      setInputValue(inputValue);

      handleKeyboardInput({
        code: "p",
      } as any as KeyboardEvent);

      expect(inputChangedCallback).toBeCalledWith({ code: "p" });
    });

    it("should trigger when press Backspace on fix mode ", () => {
      const setInputCursorPosition = () => {};
      const getInputCursorPosition = vi.fn();
      const inputChangedCallback = vi.fn();

      const { setInputValue, handleKeyboardInput, submitAnswer, initialize } = useInput({
        source: () => "i eat apple",
        setInputCursorPosition,
        getInputCursorPosition,
        inputChangedCallback,
      });

      initialize();
      const inputValue = "i eat ap";
      getInputCursorPosition.mockReturnValue(inputValue.length);
      setInputValue(inputValue);

      submitAnswer();

      handleKeyboardInput({
        code: "Backspace",
        preventDefault: () => {},
      } as any as KeyboardEvent);

      expect(inputChangedCallback).toBeCalledWith(expect.objectContaining({ code: "Backspace" }));
    });

    it.each([
      { userInput: "j", isPrevent: false },
      {
        userInput: "f",
        isPrevent: false,
      },

      {
        userInput: "Backspace",
        isPrevent: true,
      },

      {
        userInput: "Space",
        isPrevent: true,
      },
    ])(
      "should fix incorrect world when press $userInput on fix mode ",
      ({ userInput, isPrevent }) => {
        const setInputCursorPosition = () => {};
        const getInputCursorPosition = vi.fn();
        const inputChangedCallback = vi.fn();

        const { setInputValue, handleKeyboardInput, submitAnswer, userInputWords, initialize } =
          useInput({
            source: () => "like code",
            setInputCursorPosition,
            getInputCursorPosition,
            inputChangedCallback,
          });

        initialize();
        const inputValue = "lik co";
        getInputCursorPosition.mockReturnValue(inputValue.length);
        setInputValue(inputValue);

        submitAnswer();

        const preventDefault = vi.fn();
        handleKeyboardInput({
          code: userInput,
          preventDefault,
        } as any as KeyboardEvent);
        getInputCursorPosition.mockReturnValue(0);
        setInputValue(userInput);

        expect(userInputWords[0].isActive).toBe(true);
        expect(userInputWords[0].userInput).toBe(userInput);
        // preventDefault 意味着是否直接上屏
        isPrevent ? expect(preventDefault).toBeCalled() : expect(preventDefault).not.toBeCalled();
      },
    );

    it("should trigger when press Backspace on fix input mode ", () => {
      const setInputCursorPosition = () => {};
      const getInputCursorPosition = vi.fn();
      const inputChangedCallback = vi.fn();

      const { setInputValue, handleKeyboardInput, submitAnswer, initialize } = useInput({
        source: () => "i eat apple",
        setInputCursorPosition,
        getInputCursorPosition,
        inputChangedCallback,
      });
      initialize();

      const inputValue = "i eat a";
      getInputCursorPosition.mockReturnValue(inputValue.length);
      setInputValue(inputValue);

      submitAnswer();

      handleKeyboardInput({
        code: "Backspace",
        preventDefault: () => {},
      } as any as KeyboardEvent);

      handleKeyboardInput({
        code: "Backspace",
        preventDefault: () => {},
      } as any as KeyboardEvent);

      expect(inputChangedCallback).toBeCalledTimes(2);
    });
  });
});

describe("isWord", () => {
  it("should return true for a string containing an English letter", () => {
    expect(isWord("hello")).toBe(true);
    expect(isWord("Hello")).toBe(true);
    expect(isWord("123word")).toBe(true);
    expect(isWord("18")).toBe(true);
  });

  it("should return false for a string without any English letters", () => {
    expect(isWord("—")).toBe(false);
    expect(isWord("！@#$%^&*()")).toBe(false);
    expect(isWord("こんにちは")).toBe(false); // Japanese characters
  });

  it("should return false for an empty string", () => {
    expect(isWord("")).toBe(false);
  });

  it("should correctly identify single English letter", () => {
    expect(isWord("a")).toBe(true);
    expect(isWord("A")).toBe(true);
  });

  it("should return false for strings with only non-alphabetic characters", () => {
    expect(isWord(". ,;:!")).toBe(false);
  });
});

describe("Fix_Input mode robustness", () => {
  // 用户场景: 输入多处错误 → 修复 → 空格校验应保持正确
  it("should keep word structure intact when fixing multiple errors", async () => {
    const setInputCursorPosition = vi.fn();
    const getInputCursorPosition = vi.fn();

    const { setInputValue, userInputWords, submitAnswer, fixIncorrectWord, initialize } = useInput({
      source: () => "research requires accurate data to support it",
      setInputCursorPosition,
      getInputCursorPosition,
    });

    initialize();
    // 模拟用户输入 3 处错误: reserch(拼错), require(少s), fuport(拼错)
    const wrongInput = "reserch require accurate data to fuport it";
    getInputCursorPosition.mockReturnValue(wrongInput.length);
    setInputValue(wrongInput);

    submitAnswer();

    // 3 个单词应该被标记为错误
    expect(userInputWords[0].incorrect).toBe(true); // reserch
    expect(userInputWords[1].incorrect).toBe(true); // require
    expect(userInputWords[5].incorrect).toBe(true); // fuport

    // 修复第一个错误单词 (reserch → 清空)
    await fixIncorrectWord();
    expect(userInputWords[0].userInput).toBe("");
    expect(userInputWords[0].isActive).toBe(true);

    // 用户输入 research
    getInputCursorPosition.mockReturnValue(8);
    setInputValue("research require accurate data to fuport it");

    // 确认其他单词未被破坏
    expect(userInputWords[1].userInput).toBe("require");
    expect(userInputWords[2].userInput).toBe("accurate");
    expect(userInputWords[5].userInput).toBe("fuport");
    expect(userInputWords[6].userInput).toBe("it");
  });

  it("should not corrupt words when backspace at word boundary in Fix_Input mode", async () => {
    const setInputCursorPosition = vi.fn();
    const getInputCursorPosition = vi.fn();

    const {
      setInputValue,
      userInputWords,
      submitAnswer,
      fixIncorrectWord,
      handleKeyboardInput,
      initialize,
    } = useInput({
      source: () => "i eat apple",
      setInputCursorPosition,
      getInputCursorPosition,
    });

    initialize();
    getInputCursorPosition.mockReturnValue(9);
    setInputValue("i ea appel");
    submitAnswer();

    // word[1]="ea" 和 word[2]="appel" 标记为错误
    expect(userInputWords[1].incorrect).toBe(true);
    expect(userInputWords[2].incorrect).toBe(true);

    // 进入第一个错误单词
    await fixIncorrectWord();
    expect(userInputWords[1].userInput).toBe("");

    // 模拟光标在当前编辑单词的起始位置按 Backspace
    getInputCursorPosition.mockReturnValue(userInputWords[1].start);
    const preventDefault = vi.fn();
    handleKeyboardInput({
      code: "Backspace",
      preventDefault,
    } as any as KeyboardEvent);

    // 应该阻止退格（防止删除前面单词的空格）
    expect(preventDefault).toBeCalled();

    // 单词结构应完好
    expect(userInputWords[0].userInput).toBe("i");
    expect(userInputWords[2].userInput).toBe("appel");
  });

  it("should correctly submit after fixing all errors in Fix_Input mode", async () => {
    const setInputCursorPosition = vi.fn();
    const getInputCursorPosition = vi.fn();

    const {
      setInputValue,
      userInputWords,
      submitAnswer,
      fixIncorrectWord,
      handleKeyboardInput,
      initialize,
    } = useInput({
      source: () => "i eat apple",
      setInputCursorPosition,
      getInputCursorPosition,
    });

    initialize();
    getInputCursorPosition.mockReturnValue(10);
    setInputValue("he eats a");
    submitAnswer();

    // 全部标记为错误
    expect(userInputWords[0].incorrect).toBe(true);
    expect(userInputWords[1].incorrect).toBe(true);
    expect(userInputWords[2].incorrect).toBe(true);

    // 修复第一个: he → i
    await fixIncorrectWord();
    getInputCursorPosition.mockReturnValue(1);
    setInputValue("i eats a");
    // 空格跳到下一个错误
    await fixIncorrectWord();
    expect(userInputWords[1].userInput).toBe("");

    // 修复第二个: eats → eat
    getInputCursorPosition.mockReturnValue(5);
    setInputValue("i eat a");
    // 空格跳到下一个
    await fixIncorrectWord();
    expect(userInputWords[2].userInput).toBe("");

    // 修复第三个: a → apple
    getInputCursorPosition.mockReturnValue(11);
    userInputWords[2].userInput = "apple";

    // 提交 — 应该成功
    const correctCallback = vi.fn();
    const wrongCallback = vi.fn();
    submitAnswer(correctCallback, wrongCallback);

    expect(correctCallback).toBeCalled();
    expect(wrongCallback).not.toBeCalled();
  });

  it("should handle input with fewer parts than words gracefully", () => {
    const setInputCursorPosition = vi.fn();
    const getInputCursorPosition = vi.fn();

    const { setInputValue, userInputWords, initialize } = useInput({
      source: () => "i eat apple",
      setInputCursorPosition,
      getInputCursorPosition,
    });

    initialize();
    // 输入少于单词数（只输入了 2 个单词）
    getInputCursorPosition.mockReturnValue(5);
    setInputValue("i eat");

    // 不应崩溃，前两个单词正常，第三个为空
    expect(userInputWords[0].userInput).toBe("i");
    expect(userInputWords[1].userInput).toBe("eat");
    expect(userInputWords[2].userInput).toBe("");
  });

  it("should validate typed words when active word changes", () => {
    const setInputCursorPosition = vi.fn();
    const getInputCursorPosition = vi.fn();

    const { setInputValue, userInputWords, initialize } = useInput({
      source: () => "i eat apple",
      setInputCursorPosition,
      getInputCursorPosition,
    });

    initialize();

    // 输入 "i" 然后光标移到第二个单词
    getInputCursorPosition.mockReturnValue(1);
    setInputValue("i");
    // 移到 "eat" 的位置
    getInputCursorPosition.mockReturnValue(2);
    setInputValue("i ");

    // "i" 已离开，应被校验为正确
    expect(userInputWords[0].correct).toBe(true);
    expect(userInputWords[0].incorrect).toBe(false);
  });

  it("should mark incorrect word immediately when cursor leaves", () => {
    const setInputCursorPosition = vi.fn();
    const getInputCursorPosition = vi.fn();

    const { setInputValue, userInputWords, initialize } = useInput({
      source: () => "i eat apple",
      setInputCursorPosition,
      getInputCursorPosition,
    });

    initialize();

    // 输入错误的 "he" 然后光标移到下一个单词
    getInputCursorPosition.mockReturnValue(2);
    setInputValue("he");
    // 移到 "eat" 的位置
    getInputCursorPosition.mockReturnValue(3);
    setInputValue("he ");

    // "he" 不等于 "i"，应标记为错误
    expect(userInputWords[0].incorrect).toBe(true);
    expect(userInputWords[0].correct).toBe(false);
    // 当前单词不应被校验
    expect(userInputWords[1].incorrect).toBe(false);
    expect(userInputWords[1].correct).toBe(false);
  });

  it("should not validate active word or empty words", () => {
    const setInputCursorPosition = vi.fn();
    const getInputCursorPosition = vi.fn();

    const { setInputValue, userInputWords, initialize } = useInput({
      source: () => "i eat apple",
      setInputCursorPosition,
      getInputCursorPosition,
    });

    initialize();

    // 输入正确的两个单词，光标在第三个
    getInputCursorPosition.mockReturnValue(1);
    setInputValue("i");
    getInputCursorPosition.mockReturnValue(5);
    setInputValue("i eat");
    // 移到第三个单词
    getInputCursorPosition.mockReturnValue(6);
    setInputValue("i eat ");

    // 前两个单词应被校验为正确
    expect(userInputWords[0].correct).toBe(true);
    expect(userInputWords[1].correct).toBe(true);
    // 第三个还没输入，不校验
    expect(userInputWords[2].correct).toBe(false);
    expect(userInputWords[2].incorrect).toBe(false);
  });

  it("should ensure cursor stays within current edit word after focus", async () => {
    const setInputCursorPosition = vi.fn();
    const getInputCursorPosition = vi.fn();

    const {
      setInputValue,
      userInputWords,
      submitAnswer,
      fixIncorrectWord,
      handleKeyboardInput,
      initialize,
    } = useInput({
      source: () => "i eat apple",
      setInputCursorPosition,
      getInputCursorPosition,
    });

    initialize();
    getInputCursorPosition.mockReturnValue(9);
    setInputValue("i ea appel");
    submitAnswer();

    // 进入第一个错误
    await fixIncorrectWord();
    expect(userInputWords[1].userInput).toBe("");

    // 输入 eat
    getInputCursorPosition.mockReturnValue(5);
    setInputValue("i eat appel");

    // 模拟 focus 后光标跑到末尾（11），然后按任意键
    getInputCursorPosition.mockReturnValue(11); // 光标在末尾

    handleKeyboardInput({
      code: "KeyA",
      preventDefault: vi.fn(),
    } as any as KeyboardEvent);

    // ensureCursorInCurrentWord 应该把光标拉回 currentEditWord 的范围
    // currentEditWord 是 word[1], 此时 end = 5
    expect(setInputCursorPosition).toHaveBeenCalledWith(5);
  });
});
