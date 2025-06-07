// Silence console output during tests
// jest.spyOn(console, 'error').mockImplementation(() => {});
// jest.spyOn(console, 'warn').mockImplementation(() => {});
// jest.spyOn(console, 'log').mockImplementation(() => {});

const { debounce, throttle, handleError, dom } = require('../js/utils');

describe('Utility Functions', () => {
  describe('debounce', () => {
    jest.useFakeTimers();

    test('should debounce function calls', () => {
      const func = jest.fn();
      const debouncedFunc = debounce(func, 1000);

      debouncedFunc();
      debouncedFunc();
      debouncedFunc();

      expect(func).not.toBeCalled();

      jest.runAllTimers();

      expect(func).toBeCalledTimes(1);
    });
  });

  describe('throttle', () => {
    jest.useFakeTimers();

    test('should throttle function calls', () => {
      const func = jest.fn();
      const throttledFunc = throttle(func, 1000);

      throttledFunc();
      throttledFunc();
      throttledFunc();

      expect(func).toBeCalledTimes(1);

      jest.runAllTimers();

      throttledFunc();
      expect(func).toBeCalledTimes(2);
    });
  });

  describe('handleError', () => {
    test('should handle errors with context', () => {
      const error = new Error('Test error');
      const result = handleError(error, 'test context');

      expect(result).toEqual({
        message: 'Something went wrong. Please try again later.',
        details: 'Test error'
      });
    });
  });

  describe('DOM helpers', () => {
    test('should create elements with attributes', () => {
      const element = dom.create('div', {
        className: 'test',
        'data-test': 'value'
      }, ['Hello']);

      expect(element.tagName).toBe('DIV');
      expect(element.className).toBe('test');
      expect(element.getAttribute('data-test')).toBe('value');
      expect(element.textContent).toBe('Hello');
    });

    test('should safely set HTML', () => {
      const element = document.createElement('div');
      dom.setHTML(element, '<p>Test</p>');

      expect(element.innerHTML).toBe('<p>Test</p>');
    });
  });
}); 