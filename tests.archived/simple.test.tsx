import React from 'react';
import { auth } from '@/firebase/auth';
import { render, screen } from '@testing-library/react';

test('simple tsx test', () => {
    const element = <div>Hello</div>;
    expect(element).toBeDefined();
});

test('mock verification', () => {
    expect(auth).toBeDefined();
    expect(auth.currentUser).toBeNull();
});

test('dom verification', () => {
    const div = document.createElement('div');
    div.innerHTML = 'hello';
    expect(div.textContent).toBe('hello');
});

test('rtl verification', () => {
    render(<div>rtl hello</div>);
    expect(screen.getByText('rtl hello')).toBeInTheDocument();
});
