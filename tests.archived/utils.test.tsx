import { render } from '../test-utils';
import React from 'react';

test('utils render', () => {
    const result = render(<div>test</div>);
    expect(result).toBeDefined();
});
