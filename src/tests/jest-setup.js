// Jest setup file to suppress React 19 console.error warnings
const originalError = console.error;

beforeAll(() => {
    console.error = (...args) => {
        if (
            typeof args[0] === 'string' &&
            (args[0].includes('element.ref') ||
                args[0].includes('Accessing element.ref') ||
                args[0].includes('ref is now a regular prop'))
        ) {
            // Suppress React 19 ref warnings
            return;
        }
        originalError.call(console, ...args);
    };
});

afterAll(() => {
    console.error = originalError;
});
