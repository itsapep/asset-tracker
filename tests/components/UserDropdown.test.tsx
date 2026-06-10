import { describe, it, before, beforeEach } from 'node:test';
import assert from 'node:assert';
import React from 'react';

// Mock React hooks before importing UserDropdown
// eslint-disable-next-line @typescript-eslint/no-explicit-any
// eslint-disable-next-line @typescript-eslint/no-explicit-any
(React as any).useState = (initialValueValue: any) => [initialValueValue, () => {}];
// eslint-disable-next-line @typescript-eslint/no-explicit-any
// eslint-disable-next-line @typescript-eslint/no-explicit-any
(React as any).useRef = (initialValueValue: any) => ({ current: initialValueValue });
// eslint-disable-next-line @typescript-eslint/no-explicit-any
(React as any).useEffect = () => {};

// Now we can import the component safely
import UserDropdown from '@/components/layout/UserDropdown';

describe('UserDropdown Component Unit Tests', () => {
  it('should return null when no user is provided', () => {
    const element = UserDropdown({ user: undefined });
    assert.strictEqual(element, null);
  });

  it('should render correct name and primary role when user is provided', () => {
    const user = {
      name: 'Alice Smith',
      email: 'alice@example.com',
      roles: ['System Admin'],
    };

    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const element = UserDropdown({ user }) as any;
    assert.ok(element);
    assert.strictEqual(element.type, 'div');
    assert.strictEqual(element.props.className, 'relative');

    // Find the button within the children
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const button = element.props.children.find((child: any) => child && child.type === 'button');
    assert.ok(button, 'Dropdown button should be rendered');

    // Verify button contains name and role
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const textSpan = button.props.children.find((child: any) => child && child.type === 'span');
    assert.ok(textSpan, 'Text span should be rendered');
    assert.strictEqual(textSpan.props.children.join(''), 'Alice Smith (System Admin)');
  });

  it('should fallback to default role and name if not provided', () => {
    const user = {
      email: 'test@example.com',
    };

    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const element = UserDropdown({ user }) as any;
    assert.ok(element);

    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const button = element.props.children.find((child: any) => child && child.type === 'button');
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const textSpan = button.props.children.find((child: any) => child && child.type === 'span');
    assert.strictEqual(textSpan.props.children.join(''), 'Account (User)');
  });
});
